const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting BillSplitter deployment...");
  
  // Base mainnet USDT contract address
  const USDT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("❌ Deployer account has no ETH for gas fees");
  }
  
  console.log("📝 Contract parameters:");
  console.log("  - USDT Token:", USDT_ADDRESS);
  console.log("  - Initial Owner:", deployer.address);
  
  // Deploy the BillSplitter contract
  console.log("\n🔨 Deploying BillSplitter contract...");
  const BillSplitter = await ethers.getContractFactory("BillSplitter");
  const billSplitter = await BillSplitter.deploy(USDT_ADDRESS, deployer.address);
  
  await billSplitter.waitForDeployment();
  const contractAddress = await billSplitter.getAddress();
  
  console.log("✅ BillSplitter deployed to:", contractAddress);
  
  // Verify deployment by checking contract state
  console.log("\n🔍 Verifying deployment...");
  const usdtToken = await billSplitter.usdtToken();
  const owner = await billSplitter.owner();
  const platformFee = await billSplitter.platformFee();
  const version = await billSplitter.VERSION();
  
  console.log("✅ Verification results:");
  console.log("  - USDT Token:", usdtToken);
  console.log("  - Owner:", owner);
  console.log("  - Platform Fee:", platformFee.toString(), "basis points");
  console.log("  - Version:", version);
  
  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    usdtToken: usdtToken,
    platformFee: platformFee.toString(),
    version: version,
    deploymentTime: new Date().toISOString(),
    transactionHash: billSplitter.deploymentTransaction()?.hash
  };
  
  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🎉 Deployment completed successfully!");
  
  if (process.env.BASESCAN_API_KEY) {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    await billSplitter.deploymentTransaction()?.wait(5);
    
    console.log("🔐 Verifying contract on Basescan...");
    console.log("Run the following command to verify:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${USDT_ADDRESS}" "${deployer.address}"`);
  } else {
    console.log("\n💡 To verify the contract, add BASESCAN_API_KEY to your .env file and run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${USDT_ADDRESS}" "${deployer.address}"`);
  }
  
  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((contractAddress) => {
    console.log(`\n✨ Contract deployed at: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });