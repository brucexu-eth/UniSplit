const { ethers } = require('hardhat')

async function main() {
  console.log('Deploying BillSplitterV2...')
  
  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  
  // Get network info
  const network = await ethers.provider.getNetwork()
  console.log('Network:', network.name, 'Chain ID:', network.chainId)
  
  // Set USDT contract address based on network
  let usdtAddress
  if (network.chainId === 8453n) {
    // Base Mainnet
    usdtAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    console.log('Using Base Mainnet USDT:', usdtAddress)
  } else if (network.chainId === 84532n) {
    // Base Sepolia - use our deployed Mock USDT
    usdtAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    console.log('Using Base Sepolia Mock USDT:', usdtAddress)
  } else {
    throw new Error(`Unsupported network: ${network.chainId}`)
  }
  
  // Deploy BillSplitterV2
  const BillSplitterV2 = await ethers.getContractFactory('BillSplitterV2')
  const billSplitter = await BillSplitterV2.deploy(usdtAddress, deployer.address)
  
  await billSplitter.waitForDeployment()
  const contractAddress = await billSplitter.getAddress()
  
  console.log('BillSplitterV2 deployed to:', contractAddress)
  console.log('USDT Token:', usdtAddress)
  console.log('Owner:', deployer.address)
  
  // Verify contract if on live network
  if (network.chainId !== 31337n) {
    console.log('Waiting for block confirmations...')
    await billSplitter.deploymentTransaction().wait(5)
    
    try {
      await hre.run('verify:verify', {
        address: contractAddress,
        constructorArguments: [usdtAddress, deployer.address],
      })
      console.log('Contract verified successfully')
    } catch (error) {
      console.log('Verification failed:', error.message)
    }
  }
  
  console.log('\nDeployment Summary:')
  console.log('==================')
  console.log(`BillSplitterV2: ${contractAddress}`)
  console.log(`USDT Token: ${usdtAddress}`)
  console.log(`Network: ${network.name} (${network.chainId})`)
  console.log('\nUpdate your .env file:')
  console.log(`VITE_BILL_SPLITTER_CONTRACT_ADDRESS=${contractAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })