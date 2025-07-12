const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("BillSplitter", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployBillSplitterFixture() {
    // Deploy a mock USDT token for testing
    const MockUSDT = await ethers.getContractFactory("MockERC20");
    const usdt = await MockUSDT.deploy("Tether USD", "USDT", 6); // 6 decimals like real USDT
    
    // Get signers
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy BillSplitter
    const BillSplitter = await ethers.getContractFactory("BillSplitter");
    const billSplitter = await BillSplitter.deploy(await usdt.getAddress(), owner.address);
    
    // Mint USDT to test users
    const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDT with 6 decimals
    await usdt.mint(user1.address, mintAmount);
    await usdt.mint(user2.address, mintAmount);
    await usdt.mint(user3.address, mintAmount);
    
    return { billSplitter, usdt, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the right USDT token", async function () {
      const { billSplitter, usdt } = await loadFixture(deployBillSplitterFixture);
      expect(await billSplitter.usdtToken()).to.equal(await usdt.getAddress());
    });

    it("Should set the right owner", async function () {
      const { billSplitter, owner } = await loadFixture(deployBillSplitterFixture);
      expect(await billSplitter.owner()).to.equal(owner.address);
    });

    it("Should have correct initial values", async function () {
      const { billSplitter } = await loadFixture(deployBillSplitterFixture);
      expect(await billSplitter.platformFee()).to.equal(100); // 1%
      expect(await billSplitter.VERSION()).to.equal("1.0.0");
      expect(await billSplitter.collectedFees()).to.equal(0);
    });
  });

  describe("Bill Creation", function () {
    it("Should create a bill successfully", async function () {
      const { billSplitter, user1 } = await loadFixture(deployBillSplitterFixture);
      
      const billId = ethers.keccak256(ethers.toUtf8Bytes("test-bill-1"));
      const sharePrice = ethers.parseUnits("10", 6); // 10 USDT
      const totalShares = 5;
      const description = "Test dinner bill";
      
      await expect(billSplitter.connect(user1).createBill(billId, sharePrice, totalShares, description))
        .to.emit(billSplitter, "BillCreated")
        .withArgs(billId, user1.address, sharePrice, totalShares, description);
      
      const bill = await billSplitter.getBill(billId);
      expect(bill.creator).to.equal(user1.address);
      expect(bill.sharePrice).to.equal(sharePrice);
      expect(bill.totalShares).to.equal(totalShares);
      expect(bill.paidShares).to.equal(0);
      expect(bill.status).to.equal(0); // Active
      expect(bill.description).to.equal(description);
    });

    it("Should reject duplicate bill IDs", async function () {
      const { billSplitter, user1 } = await loadFixture(deployBillSplitterFixture);
      
      const billId = ethers.keccak256(ethers.toUtf8Bytes("test-bill-1"));
      const sharePrice = ethers.parseUnits("10", 6);
      const totalShares = 5;
      
      await billSplitter.connect(user1).createBill(billId, sharePrice, totalShares, "First bill");
      
      await expect(billSplitter.connect(user1).createBill(billId, sharePrice, totalShares, "Second bill"))
        .to.be.revertedWithCustomError(billSplitter, "BillAlreadyExists");
    });

    it("Should reject invalid parameters", async function () {
      const { billSplitter, user1 } = await loadFixture(deployBillSplitterFixture);
      
      const billId = ethers.keccak256(ethers.toUtf8Bytes("test-bill-1"));
      
      // Zero share price
      await expect(billSplitter.connect(user1).createBill(billId, 0, 5, "Test"))
        .to.be.revertedWithCustomError(billSplitter, "InvalidSharePrice");
      
      // Zero shares
      await expect(billSplitter.connect(user1).createBill(billId, ethers.parseUnits("10", 6), 0, "Test"))
        .to.be.revertedWithCustomError(billSplitter, "InvalidShares");
      
      // Too many shares
      await expect(billSplitter.connect(user1).createBill(billId, ethers.parseUnits("10", 6), 101, "Test"))
        .to.be.revertedWithCustomError(billSplitter, "InvalidShares");
    });
  });

  // Helper function to create a test bill
  async function createTestBill() {
    const fixture = await loadFixture(deployBillSplitterFixture);
    const { billSplitter, user1 } = fixture;
    
    const billId = ethers.keccak256(ethers.toUtf8Bytes("test-bill-1"));
    const sharePrice = ethers.parseUnits("10", 6); // 10 USDT
    const totalShares = 5;
    
    await billSplitter.connect(user1).createBill(billId, sharePrice, totalShares, "Test dinner");
    
    return { ...fixture, billId, sharePrice, totalShares };
  }

  describe("Payment Processing", function () {

    it("Should process payment successfully", async function () {
      const { billSplitter, usdt, user2, billId, sharePrice } = await createTestBill();
      
      const shareCount = 2;
      const paymentAmount = sharePrice * BigInt(shareCount);
      
      // Approve USDT transfer
      await usdt.connect(user2).approve(await billSplitter.getAddress(), paymentAmount);
      
      await expect(billSplitter.connect(user2).payShare(billId, shareCount))
        .to.emit(billSplitter, "BillPaid")
        .withArgs(billId, user2.address, shareCount, paymentAmount);
      
      const bill = await billSplitter.getBill(billId);
      expect(bill.paidShares).to.equal(shareCount);
      
      const userShares = await billSplitter.getBillPayment(billId, user2.address);
      expect(userShares).to.equal(shareCount);
    });

    it("Should automatically settle when fully paid", async function () {
      const { billSplitter, usdt, user1, user2, billId, sharePrice, totalShares } = await createTestBill();
      
      const totalAmount = sharePrice * BigInt(totalShares);
      
      // Approve and pay full amount
      await usdt.connect(user2).approve(await billSplitter.getAddress(), totalAmount);
      
      await expect(billSplitter.connect(user2).payShare(billId, totalShares))
        .to.emit(billSplitter, "BillPaid")
        .and.to.emit(billSplitter, "BillSettled");
      
      const bill = await billSplitter.getBill(billId);
      expect(bill.status).to.equal(1); // Settled
      expect(bill.paidShares).to.equal(totalShares);
    });

    it("Should reject overpayment", async function () {
      const { billSplitter, usdt, user2, billId, sharePrice, totalShares } = await createTestBill();
      
      const paymentAmount = sharePrice * BigInt(totalShares + 1);
      await usdt.connect(user2).approve(await billSplitter.getAddress(), paymentAmount);
      
      await expect(billSplitter.connect(user2).payShare(billId, totalShares + 1))
        .to.be.revertedWithCustomError(billSplitter, "ExcessiveShares");
    });

    it("Should reject payment to non-existent bill", async function () {
      const { billSplitter, user2 } = await loadFixture(deployBillSplitterFixture);
      
      const nonExistentBillId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      
      await expect(billSplitter.connect(user2).payShare(nonExistentBillId, 1))
        .to.be.revertedWithCustomError(billSplitter, "BillNotFound");
    });
  });

  // Helper function to create a test bill with payments
  async function createTestBillWithPayments() {
    const fixture = await createTestBill();
    const { billSplitter, usdt, user2, billId, sharePrice } = fixture;
    
    // Make partial payment
    const shareCount = 2;
    const paymentAmount = sharePrice * BigInt(shareCount);
    await usdt.connect(user2).approve(await billSplitter.getAddress(), paymentAmount);
    await billSplitter.connect(user2).payShare(billId, shareCount);
    
    return fixture;
  }

  describe("Bill Management", function () {

    it("Should allow creator to close bill", async function () {
      const { billSplitter, user1, billId } = await createTestBillWithPayments();
      
      await expect(billSplitter.connect(user1).closeBill(billId))
        .to.emit(billSplitter, "BillSettled");
      
      const bill = await billSplitter.getBill(billId);
      expect(bill.status).to.equal(1); // Settled
    });

    it("Should reject non-creator closing bill", async function () {
      const { billSplitter, user2, billId } = await createTestBillWithPayments();
      
      await expect(billSplitter.connect(user2).closeBill(billId))
        .to.be.revertedWithCustomError(billSplitter, "UnauthorizedAccess");
    });

    it("Should allow creator to cancel bill and refund payments", async function () {
      const { billSplitter, usdt, user1, user2, billId, sharePrice } = await createTestBillWithPayments();
      
      const initialBalance = await usdt.balanceOf(user2.address);
      
      await expect(billSplitter.connect(user1).cancelBill(billId))
        .to.emit(billSplitter, "BillCancelled");
      
      const bill = await billSplitter.getBill(billId);
      expect(bill.status).to.equal(2); // Cancelled
      
      // Check refund was processed
      const finalBalance = await usdt.balanceOf(user2.address);
      const refundAmount = sharePrice * 2n; // 2 shares were paid
      expect(finalBalance).to.equal(initialBalance + refundAmount);
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const { billSplitter, owner } = await loadFixture(deployBillSplitterFixture);
      
      const newFee = 200; // 2%
      
      await expect(billSplitter.connect(owner).updatePlatformFee(newFee))
        .to.emit(billSplitter, "PlatformFeeUpdated")
        .withArgs(newFee);
      
      expect(await billSplitter.platformFee()).to.equal(newFee);
    });

    it("Should reject invalid platform fee", async function () {
      const { billSplitter, owner } = await loadFixture(deployBillSplitterFixture);
      
      await expect(billSplitter.connect(owner).updatePlatformFee(600)) // 6% > 5% max
        .to.be.revertedWithCustomError(billSplitter, "InvalidFee");
    });

    it("Should allow owner to withdraw collected fees", async function () {
      const { billSplitter, usdt, owner, user1, user2 } = await loadFixture(deployBillSplitterFixture);
      
      // Create and fully pay a bill to generate fees
      const billId = ethers.keccak256(ethers.toUtf8Bytes("fee-test"));
      const sharePrice = ethers.parseUnits("100", 6); // 100 USDT
      const totalShares = 1;
      
      await billSplitter.connect(user1).createBill(billId, sharePrice, totalShares, "Fee test");
      
      await usdt.connect(user2).approve(await billSplitter.getAddress(), sharePrice);
      await billSplitter.connect(user2).payShare(billId, totalShares);
      
      // Check fees were collected
      const collectedFees = await billSplitter.collectedFees();
      expect(collectedFees).to.be.gt(0);
      
      // Withdraw fees
      await expect(billSplitter.connect(owner).withdrawFees(owner.address))
        .to.emit(billSplitter, "FeesWithdrawn")
        .withArgs(owner.address, collectedFees);
      
      expect(await billSplitter.collectedFees()).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return correct bill totals and remaining amounts", async function () {
      const { billSplitter, usdt, user1, user2, billId, sharePrice, totalShares } = await createTestBill();
      
      const expectedTotal = sharePrice * BigInt(totalShares);
      expect(await billSplitter.getBillTotal(billId)).to.equal(expectedTotal);
      expect(await billSplitter.getBillRemaining(billId)).to.equal(expectedTotal);
      
      // Make partial payment
      const shareCount = 2;
      const paymentAmount = sharePrice * BigInt(shareCount);
      await usdt.connect(user2).approve(await billSplitter.getAddress(), paymentAmount);
      await billSplitter.connect(user2).payShare(billId, shareCount);
      
      const expectedRemaining = sharePrice * BigInt(totalShares - shareCount);
      expect(await billSplitter.getBillRemaining(billId)).to.equal(expectedRemaining);
    });

    it("Should track bill payers correctly", async function () {
      const { billSplitter, usdt, user2, user3, billId, sharePrice } = await createTestBill();
      
      // User2 pays
      await usdt.connect(user2).approve(await billSplitter.getAddress(), sharePrice);
      await billSplitter.connect(user2).payShare(billId, 1);
      
      // User3 pays
      await usdt.connect(user3).approve(await billSplitter.getAddress(), sharePrice);
      await billSplitter.connect(user3).payShare(billId, 1);
      
      const payers = await billSplitter.getBillPayers(billId);
      expect(payers).to.include(user2.address);
      expect(payers).to.include(user3.address);
      expect(payers.length).to.equal(2);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle multiple payments from same user", async function () {
      const { billSplitter, usdt, user2, billId, sharePrice } = await createTestBill();
      
      // First payment
      await usdt.connect(user2).approve(await billSplitter.getAddress(), sharePrice);
      await billSplitter.connect(user2).payShare(billId, 1);
      
      // Second payment
      await usdt.connect(user2).approve(await billSplitter.getAddress(), sharePrice);
      await billSplitter.connect(user2).payShare(billId, 1);
      
      const userShares = await billSplitter.getBillPayment(billId, user2.address);
      expect(userShares).to.equal(2);
      
      // User should only appear once in payers list
      const payers = await billSplitter.getBillPayers(billId);
      expect(payers.length).to.equal(1);
      expect(payers[0]).to.equal(user2.address);
    });

    it("Should prevent operations on cancelled bills", async function () {
      const { billSplitter, usdt, user1, user2, billId, sharePrice } = await createTestBill();
      
      // Cancel the bill
      await billSplitter.connect(user1).cancelBill(billId);
      
      // Try to pay - should fail
      await usdt.connect(user2).approve(await billSplitter.getAddress(), sharePrice);
      await expect(billSplitter.connect(user2).payShare(billId, 1))
        .to.be.revertedWithCustomError(billSplitter, "BillNotActive");
    });

    it("Should prevent operations on settled bills", async function () {
      const { billSplitter, usdt, user1, user2, billId, sharePrice, totalShares } = await createTestBill();
      
      // Fully pay and settle the bill
      const totalAmount = sharePrice * BigInt(totalShares);
      await usdt.connect(user2).approve(await billSplitter.getAddress(), totalAmount);
      await billSplitter.connect(user2).payShare(billId, totalShares);
      
      // Try to pay again - should fail
      await usdt.connect(user2).approve(await billSplitter.getAddress(), sharePrice);
      await expect(billSplitter.connect(user2).payShare(billId, 1))
        .to.be.revertedWithCustomError(billSplitter, "BillNotActive");
    });
  });
});