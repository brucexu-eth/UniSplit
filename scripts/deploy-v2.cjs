const { ethers } = require('hardhat')

async function main() {
  console.log('Deploying BillSplitterV2...')
  
  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  
  // Get network info
  const network = await ethers.provider.getNetwork()
  console.log('Network:', network.name, 'Chain ID:', network.chainId)
  
  // Deploy BillSplitterV2 (now only needs initial owner)
  const BillSplitterV2 = await ethers.getContractFactory('BillSplitterV2')
  const billSplitter = await BillSplitterV2.deploy(deployer.address)
  
  await billSplitter.waitForDeployment()
  const contractAddress = await billSplitter.getAddress()
  
  console.log('BillSplitterV2 deployed to:', contractAddress)
  console.log('Owner:', deployer.address)
  
  // Verify contract if on live network
  if (network.chainId !== 31337n) {
    console.log('Waiting for block confirmations...')
    await billSplitter.deploymentTransaction().wait(5)
    
    try {
      await hre.run('verify:verify', {
        address: contractAddress,
        constructorArguments: [deployer.address],
      })
      console.log('Contract verified successfully')
    } catch (error) {
      console.log('Verification failed:', error.message)
    }
  }
  
  console.log('\nDeployment Summary:')
  console.log('==================')
  console.log(`BillSplitterV2: ${contractAddress}`)
  console.log(`Network: ${network.name} (${network.chainId})`)
  console.log(`Owner: ${deployer.address}`)
  console.log('\nUpdate your .env file:')
  console.log(`VITE_BILL_SPLITTER_CONTRACT_ADDRESS=${contractAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })