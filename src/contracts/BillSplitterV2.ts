export const BILL_SPLITTER_V2_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_usdtToken', type: 'address', internalType: 'address' },
      { name: '_initialOwner', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'billExists',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'bills',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'sharePrice', type: 'uint256', internalType: 'uint256' },
      { name: 'totalShares', type: 'uint8', internalType: 'uint8' },
      { name: 'paidShares', type: 'uint8', internalType: 'uint8' },
      {
        name: 'status',
        type: 'uint8',
        internalType: 'enum BillSplitterV2.BillStatus',
      },
      { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
      { name: 'description', type: 'string', internalType: 'string' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'closeBill',
    inputs: [{ name: 'billId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createBill',
    inputs: [
      { name: 'billId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'sharePrice', type: 'uint256', internalType: 'uint256' },
      { name: 'totalShares', type: 'uint8', internalType: 'uint8' },
      { name: 'description', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'creatorSelfPayment',
    inputs: [
      { name: 'billId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'shareCount', type: 'uint8', internalType: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getBill',
    inputs: [{ name: 'billId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'sharePrice', type: 'uint256', internalType: 'uint256' },
      { name: 'totalShares', type: 'uint8', internalType: 'uint8' },
      { name: 'paidShares', type: 'uint8', internalType: 'uint8' },
      {
        name: 'status',
        type: 'uint8',
        internalType: 'enum BillSplitterV2.BillStatus',
      },
      { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
      { name: 'description', type: 'string', internalType: 'string' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPaidAmount',
    inputs: [{ name: 'billId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRemainingShares',
    inputs: [{ name: 'billId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalAmount',
    inputs: [{ name: 'billId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isBillExists',
    inputs: [{ name: 'billId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'payBill',
    inputs: [
      { name: 'billId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'shareCount', type: 'uint8', internalType: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateBill',
    inputs: [
      { name: 'billId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'newSharePrice', type: 'uint256', internalType: 'uint256' },
      { name: 'newTotalShares', type: 'uint8', internalType: 'uint8' },
      { name: 'newDescription', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'usdtToken',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'BillClosed',
    inputs: [
      {
        name: 'billId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'BillCreated',
    inputs: [
      {
        name: 'billId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'creator',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'sharePrice',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'totalShares',
        type: 'uint8',
        indexed: false,
        internalType: 'uint8',
      },
      {
        name: 'description',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'BillUpdated',
    inputs: [
      {
        name: 'billId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'newSharePrice',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'newTotalShares',
        type: 'uint8',
        indexed: false,
        internalType: 'uint8',
      },
      {
        name: 'newDescription',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PaymentMade',
    inputs: [
      {
        name: 'billId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'payer',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'sharesPaid',
        type: 'uint8',
        indexed: false,
        internalType: 'uint8',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'isCreatorSelfPayment',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'BillAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BillNotActive',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BillNotFound',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ExcessiveShares',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidShares',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidSharePrice',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OnlyCreator',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
] as const

// Bill interface for V2 contract
export interface BillV2 {
  creator: string
  sharePrice: bigint
  totalShares: number
  paidShares: number
  status: BillStatus
  createdAt: bigint
  description: string
}

export enum BillStatus {
  Active = 0,
  Closed = 1,
}