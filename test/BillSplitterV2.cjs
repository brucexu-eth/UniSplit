const { expect } = require('chai')
const { ethers } = require('hardhat')
const {
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers')

describe('BillSplitterV2', function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployBillSplitterV2Fixture() {
    // Deploy mock tokens for testing
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    const usdt = await MockERC20.deploy('Tether USD', 'USDT', 6) // 6 decimals like real USDT
    const usdc = await MockERC20.deploy('USD Coin', 'USDC', 6) // 6 decimals like real USDC

    // Get signers
    const [owner, user1, user2, user3] = await ethers.getSigners()

    // Deploy BillSplitterV2
    const BillSplitterV2 = await ethers.getContractFactory('BillSplitterV2')
    const billSplitter = await BillSplitterV2.deploy(owner.address)

    // Mint tokens to test users
    const mintAmount = ethers.parseUnits('1000', 6) // 1000 tokens with 6 decimals
    await usdt.mint(user1.address, mintAmount)
    await usdt.mint(user2.address, mintAmount)
    await usdt.mint(user3.address, mintAmount)
    await usdc.mint(user1.address, mintAmount)
    await usdc.mint(user2.address, mintAmount)
    await usdc.mint(user3.address, mintAmount)

    return { billSplitter, usdt, usdc, owner, user1, user2, user3 }
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { billSplitter, owner } = await loadFixture(
        deployBillSplitterV2Fixture
      )
      expect(await billSplitter.owner()).to.equal(owner.address)
    })
  })

  describe('Bill Creation', function () {
    it('Should create a bill successfully with USDT', async function () {
      const { billSplitter, usdt, user1 } = await loadFixture(
        deployBillSplitterV2Fixture
      )

      const billId = ethers.keccak256(ethers.toUtf8Bytes('test-bill-1'))
      const sharePrice = ethers.parseUnits('10', 6) // 10 USDT
      const totalShares = 5
      const paidShares = 2
      const description = 'Test dinner bill'

      await expect(
        billSplitter
          .connect(user1)
          .createBill(
            billId,
            await usdt.getAddress(),
            sharePrice,
            totalShares,
            paidShares,
            description
          )
      )
        .to.emit(billSplitter, 'BillCreated')
        .withArgs(
          billId,
          user1.address,
          await usdt.getAddress(),
          sharePrice,
          totalShares,
          paidShares,
          description
        )

      const bill = await billSplitter.getBill(billId)
      expect(bill.creator).to.equal(user1.address)
      expect(bill.token).to.equal(await usdt.getAddress())
      expect(bill.sharePrice).to.equal(sharePrice)
      expect(bill.totalShares).to.equal(totalShares)
      expect(bill.paidShares).to.equal(paidShares)
      expect(bill.status).to.equal(0) // Active
    })

    it('Should create a bill successfully with USDC', async function () {
      const { billSplitter, usdc, user1 } = await loadFixture(
        deployBillSplitterV2Fixture
      )

      const billId = ethers.keccak256(ethers.toUtf8Bytes('test-bill-usdc'))
      const sharePrice = ethers.parseUnits('15', 6) // 15 USDC
      const totalShares = 4
      const paidShares = 1
      const description = 'Test USDC bill'

      await expect(
        billSplitter
          .connect(user1)
          .createBill(
            billId,
            await usdc.getAddress(),
            sharePrice,
            totalShares,
            paidShares,
            description
          )
      )
        .to.emit(billSplitter, 'BillCreated')
        .withArgs(
          billId,
          user1.address,
          await usdc.getAddress(),
          sharePrice,
          totalShares,
          paidShares,
          description
        )

      const bill = await billSplitter.getBill(billId)
      expect(bill.token).to.equal(await usdc.getAddress())
      expect(bill.paidShares).to.equal(paidShares)
    })

    it('Should auto-close bill if creator pays all shares', async function () {
      const { billSplitter, usdt, user1 } = await loadFixture(
        deployBillSplitterV2Fixture
      )

      const billId = ethers.keccak256(ethers.toUtf8Bytes('test-bill-full'))
      const sharePrice = ethers.parseUnits('10', 6)
      const totalShares = 3
      const paidShares = 3 // Creator pays all shares

      await expect(
        billSplitter
          .connect(user1)
          .createBill(
            billId,
            await usdt.getAddress(),
            sharePrice,
            totalShares,
            paidShares,
            'Full payment'
          )
      )
        .to.emit(billSplitter, 'BillCreated')
        .and.to.emit(billSplitter, 'BillClosed')

      const bill = await billSplitter.getBill(billId)
      expect(bill.status).to.equal(1) // Closed
    })

    it('Should reject duplicate bill IDs', async function () {
      const { billSplitter, usdt, user1 } = await loadFixture(
        deployBillSplitterV2Fixture
      )

      const billId = ethers.keccak256(ethers.toUtf8Bytes('test-bill-1'))
      const sharePrice = ethers.parseUnits('10', 6)
      const totalShares = 5

      await billSplitter
        .connect(user1)
        .createBill(
          billId,
          await usdt.getAddress(),
          sharePrice,
          totalShares,
          0,
          'First bill'
        )

      await expect(
        billSplitter
          .connect(user1)
          .createBill(
            billId,
            await usdt.getAddress(),
            sharePrice,
            totalShares,
            0,
            'Second bill'
          )
      ).to.be.revertedWithCustomError(billSplitter, 'BillAlreadyExists')
    })

    it('Should reject invalid parameters', async function () {
      const { billSplitter, usdt, user1 } = await loadFixture(
        deployBillSplitterV2Fixture
      )

      const billId = ethers.keccak256(ethers.toUtf8Bytes('test-bill-1'))
      const sharePrice = ethers.parseUnits('10', 6)

      // Invalid token address
      await expect(
        billSplitter
          .connect(user1)
          .createBill(billId, ethers.ZeroAddress, sharePrice, 5, 0, 'Test')
      ).to.be.revertedWithCustomError(billSplitter, 'InvalidToken')

      // Zero share price
      await expect(
        billSplitter
          .connect(user1)
          .createBill(billId, await usdt.getAddress(), 0, 5, 0, 'Test')
      ).to.be.revertedWithCustomError(billSplitter, 'InvalidSharePrice')

      // Zero shares
      await expect(
        billSplitter
          .connect(user1)
          .createBill(billId, await usdt.getAddress(), sharePrice, 0, 0, 'Test')
      ).to.be.revertedWithCustomError(billSplitter, 'InvalidShares')

      // Too many shares
      await expect(
        billSplitter
          .connect(user1)
          .createBill(
            billId,
            await usdt.getAddress(),
            sharePrice,
            101,
            0,
            'Test'
          )
      ).to.be.revertedWithCustomError(billSplitter, 'InvalidShares')

      // Test with a different bill ID for paid shares exceeding total (should auto-close)
      const billId2 = ethers.keccak256(ethers.toUtf8Bytes('test-bill-2'))
      await expect(
        billSplitter
          .connect(user1)
          .createBill(billId2, await usdt.getAddress(), sharePrice, 5, 6, 'Test')
      )
        .to.emit(billSplitter, 'BillCreated')
        .and.to.emit(billSplitter, 'BillClosed')
    })
  })

  // Helper function to create a test bill
  async function createTestBill() {
    const fixture = await loadFixture(deployBillSplitterV2Fixture)
    const { billSplitter, usdt, user1 } = fixture

    const billId = ethers.keccak256(ethers.toUtf8Bytes('test-bill-1'))
    const sharePrice = ethers.parseUnits('10', 6) // 10 USDT
    const totalShares = 5
    const paidShares = 1

    await billSplitter
      .connect(user1)
      .createBill(
        billId,
        await usdt.getAddress(),
        sharePrice,
        totalShares,
        paidShares,
        'Test dinner'
      )

    return { ...fixture, billId, sharePrice, totalShares, paidShares }
  }

  describe('Payment Processing', function () {
    it('Should process payment successfully with correct token', async function () {
      const { billSplitter, usdt, user2, billId, sharePrice } =
        await createTestBill()

      const shareCount = 2
      const paymentAmount = sharePrice * BigInt(shareCount)

      // Approve token transfer
      await usdt
        .connect(user2)
        .approve(await billSplitter.getAddress(), paymentAmount)

      await expect(
        billSplitter
          .connect(user2)
          .payBill(billId, await usdt.getAddress(), shareCount)
      )
        .to.emit(billSplitter, 'PaymentMade')
        .withArgs(billId, user2.address, shareCount, paymentAmount)

      const bill = await billSplitter.getBill(billId)
      expect(bill.paidShares).to.equal(1 + shareCount) // 1 creator share + 2 paid shares
    })

    it('Should reject payment with wrong token', async function () {
      const { billSplitter, usdc, user2, billId } = await createTestBill()

      const shareCount = 2
      const paymentAmount = ethers.parseUnits('20', 6)

      // Approve USDC transfer (but bill expects USDT)
      await usdc
        .connect(user2)
        .approve(await billSplitter.getAddress(), paymentAmount)

      await expect(
        billSplitter
          .connect(user2)
          .payBill(billId, await usdc.getAddress(), shareCount)
      ).to.be.revertedWithCustomError(billSplitter, 'TokenMismatch')
    })

    it('Should automatically close when fully paid', async function () {
      const {
        billSplitter,
        usdt,
        user2,
        billId,
        sharePrice,
        totalShares,
        paidShares,
      } = await createTestBill()

      const remainingShares = totalShares - paidShares
      const paymentAmount = sharePrice * BigInt(remainingShares)

      // Approve and pay remaining shares
      await usdt
        .connect(user2)
        .approve(await billSplitter.getAddress(), paymentAmount)

      await expect(
        billSplitter
          .connect(user2)
          .payBill(billId, await usdt.getAddress(), remainingShares)
      )
        .to.emit(billSplitter, 'PaymentMade')
        .and.to.emit(billSplitter, 'BillClosed')

      const bill = await billSplitter.getBill(billId)
      expect(bill.status).to.equal(1) // Closed
      expect(bill.paidShares).to.equal(totalShares)
    })

    it('Should reject overpayment', async function () {
      const {
        billSplitter,
        usdt,
        user2,
        billId,
        sharePrice,
        totalShares,
        paidShares,
      } = await createTestBill()

      const excessiveShares = totalShares - paidShares + 1
      const paymentAmount = sharePrice * BigInt(excessiveShares)
      await usdt
        .connect(user2)
        .approve(await billSplitter.getAddress(), paymentAmount)

      await expect(
        billSplitter
          .connect(user2)
          .payBill(billId, await usdt.getAddress(), excessiveShares)
      ).to.be.revertedWithCustomError(billSplitter, 'ExcessiveShares')
    })

    it('Should reject payment to non-existent bill', async function () {
      const { billSplitter, usdt, user2 } = await loadFixture(
        deployBillSplitterV2Fixture
      )

      const nonExistentBillId = ethers.keccak256(
        ethers.toUtf8Bytes('non-existent')
      )

      await expect(
        billSplitter
          .connect(user2)
          .payBill(nonExistentBillId, await usdt.getAddress(), 1)
      ).to.be.revertedWithCustomError(billSplitter, 'BillNotFound')
    })
  })

  describe('Bill Updates', function () {
    it('Should allow creator to update bill', async function () {
      const { billSplitter, user1, billId } = await createTestBill()

      const newSharePrice = ethers.parseUnits('15', 6)
      const newTotalShares = 6
      const newDescription = 'Updated dinner bill'

      await expect(
        billSplitter
          .connect(user1)
          .updateBill(billId, newSharePrice, newTotalShares, newDescription)
      )
        .to.emit(billSplitter, 'BillUpdated')
        .withArgs(billId, newSharePrice, newTotalShares, newDescription)

      const bill = await billSplitter.getBill(billId)
      expect(bill.sharePrice).to.equal(newSharePrice)
      expect(bill.totalShares).to.equal(newTotalShares)
    })

    it('Should reject non-creator updates', async function () {
      const { billSplitter, user2, billId } = await createTestBill()

      await expect(
        billSplitter
          .connect(user2)
          .updateBill(billId, ethers.parseUnits('15', 6), 6, 'Updated')
      ).to.be.revertedWithCustomError(billSplitter, 'OnlyCreator')
    })

    it('Should reject reducing total shares below paid shares', async function () {
      const { billSplitter, user1, billId } = await createTestBill()

      // Current bill has 1 paid share (creator), try to reduce to 0 total shares
      await expect(
        billSplitter
          .connect(user1)
          .updateBill(billId, ethers.parseUnits('15', 6), 0, 'Updated')
      ).to.be.revertedWithCustomError(billSplitter, 'InvalidShares')
    })
  })

  describe('Bill Management', function () {
    it('Should allow creator to close bill', async function () {
      const { billSplitter, user1, billId } = await createTestBill()

      await expect(billSplitter.connect(user1).closeBill(billId)).to.emit(
        billSplitter,
        'BillClosed'
      )

      const bill = await billSplitter.getBill(billId)
      expect(bill.status).to.equal(1) // Closed
    })

    it('Should reject non-creator closing bill', async function () {
      const { billSplitter, user2, billId } = await createTestBill()

      await expect(
        billSplitter.connect(user2).closeBill(billId)
      ).to.be.revertedWithCustomError(billSplitter, 'OnlyCreator')
    })
  })

  describe('View Functions', function () {
    it('Should return correct bill totals and remaining amounts', async function () {
      const { billSplitter, billId, sharePrice, totalShares, paidShares } =
        await createTestBill()

      const expectedTotal = sharePrice * BigInt(totalShares)
      const expectedPaid = sharePrice * BigInt(paidShares)

      expect(await billSplitter.getTotalAmount(billId)).to.equal(expectedTotal)
      expect(await billSplitter.getPaidAmount(billId)).to.equal(expectedPaid)
      expect(await billSplitter.getRemainingShares(billId)).to.equal(
        totalShares - paidShares
      )
    })

    it('Should check bill existence correctly', async function () {
      const { billSplitter, billId } = await createTestBill()

      expect(await billSplitter.isBillExists(billId)).to.be.true

      const nonExistentBillId = ethers.keccak256(
        ethers.toUtf8Bytes('non-existent')
      )
      expect(await billSplitter.isBillExists(nonExistentBillId)).to.be.false
    })
  })

  describe('Multi-Token Support', function () {
    it('Should support different tokens for different bills', async function () {
      const { billSplitter, usdt, usdc, user1, user2 } = await loadFixture(
        deployBillSplitterV2Fixture
      )

      // Create USDT bill
      const usdtBillId = ethers.keccak256(ethers.toUtf8Bytes('usdt-bill'))
      await billSplitter
        .connect(user1)
        .createBill(
          usdtBillId,
          await usdt.getAddress(),
          ethers.parseUnits('10', 6),
          5,
          0,
          'USDT Bill'
        )

      // Create USDC bill
      const usdcBillId = ethers.keccak256(ethers.toUtf8Bytes('usdc-bill'))
      await billSplitter
        .connect(user1)
        .createBill(
          usdcBillId,
          await usdc.getAddress(),
          ethers.parseUnits('15', 6),
          4,
          0,
          'USDC Bill'
        )

      // Pay USDT bill with USDT
      await usdt
        .connect(user2)
        .approve(await billSplitter.getAddress(), ethers.parseUnits('10', 6))
      await billSplitter
        .connect(user2)
        .payBill(usdtBillId, await usdt.getAddress(), 1)

      // Pay USDC bill with USDC
      await usdc
        .connect(user2)
        .approve(await billSplitter.getAddress(), ethers.parseUnits('15', 6))
      await billSplitter
        .connect(user2)
        .payBill(usdcBillId, await usdc.getAddress(), 1)

      // Verify both bills have correct tokens
      const usdtBill = await billSplitter.getBill(usdtBillId)
      const usdcBill = await billSplitter.getBill(usdcBillId)

      expect(usdtBill.token).to.equal(await usdt.getAddress())
      expect(usdcBill.token).to.equal(await usdc.getAddress())
    })
  })
})
