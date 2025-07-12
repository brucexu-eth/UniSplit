const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Mock USDT to Base Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy(deployer.address);
  
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();

  console.log("✅ Mock USDT deployed to:", mockUSDTAddress);
  console.log("🏦 Initial supply: 1,000,000 USDT");
  console.log("💧 Faucet available: 1,000 USDT per user");

  // Verify the contract (optional)
  console.log("\n📝 To verify the contract, run:");
  console.log(`npx hardhat verify --network base-sepolia ${mockUSDTAddress} "${deployer.address}"`);

  console.log("\n🔧 Update your .env file:");
  console.log(`VITE_USDT_CONTRACT_ADDRESS=${mockUSDTAddress}`);

  return {
    mockUSDT: mockUSDTAddress,
    deployer: deployer.address,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });