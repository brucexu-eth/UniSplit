// BillSplitter contract ABI and constants
export const BILL_SPLITTER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_usdtToken',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_initialOwner',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'BillAlreadyExists',
    type: 'error',
  },
  {
    inputs: [],
    name: 'BillNotActive',
    type: 'error',
  },
  {
    inputs: [],
    name: 'BillNotFound',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ExcessiveShares',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientPayment',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidFee',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSharePrice',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidShares',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotBillCreator',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnauthorizedCancellation',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'billId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'sharePrice',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'totalShares',
        type: 'uint8',
      },
    ],
    name: 'BillCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'billId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'payer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'sharesPaid',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'PaymentMade',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'billId',
        type: 'bytes32',
      },
    ],
    name: 'cancelBill',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'billId',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: 'sharePrice',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'totalShares',
        type: 'uint8',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'createBill',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'billId',
        type: 'bytes32',
      },
    ],
    name: 'getBill',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'creator',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'sharePrice',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'totalShares',
            type: 'uint8',
          },
          {
            internalType: 'uint8',
            name: 'paidShares',
            type: 'uint8',
          },
          {
            internalType: 'enum BillSplitter.BillStatus',
            name: 'status',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'createdAt',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'settledAt',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'description',
            type: 'string',
          },
        ],
        internalType: 'struct BillSplitter.Bill',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'billId',
        type: 'bytes32',
      },
    ],
    name: 'isBillExists',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'billId',
        type: 'bytes32',
      },
      {
        internalType: 'uint8',
        name: 'sharesPaid',
        type: 'uint8',
      },
    ],
    name: 'payBill',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'platformFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newFee',
        type: 'uint256',
      },
    ],
    name: 'setPlatformFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdtToken',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// For development/testing purposes - this would be replaced with actual deployed contract address
export const BILL_SPLITTER_ADDRESS =
  '0x1234567890123456789012345678901234567890' as const

// Bill status enum matching the smart contract
export enum BillStatus {
  Active = 0,
  Settled = 1,
  Cancelled = 2,
}

// Type definitions matching the smart contract
export interface Bill {
  creator: string
  sharePrice: bigint
  totalShares: number
  paidShares: number
  status: BillStatus
  createdAt: bigint
  settledAt: bigint
  description: string
}
