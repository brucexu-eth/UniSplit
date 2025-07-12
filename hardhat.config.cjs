require('@nomicfoundation/hardhat-toolbox')
require('@nomicfoundation/hardhat-verify')
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
      },
    },
    base: {
      url: process.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
      accounts:
        process.env.PRIVATE_KEY &&
        process.env.PRIVATE_KEY !== 'your_private_key_here'
          ? [process.env.PRIVATE_KEY]
          : [],
      chainId: 8453,
    },
    'base-sepolia': {
      url: 'https://sepolia.base.org',
      accounts:
        process.env.PRIVATE_KEY &&
        process.env.PRIVATE_KEY !== 'your_private_key_here'
          ? [process.env.PRIVATE_KEY]
          : [],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || '',
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org/',
        },
      },
      {
        network: 'base-sepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org/',
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
}
