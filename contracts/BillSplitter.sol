// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BillSplitter
 * @dev Smart contract for splitting bills among multiple parties using USDT payments
 * @notice This contract allows users to create bills, track payments, and manage bill settlement
 */
contract BillSplitter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // USDT token contract on Base mainnet
    IERC20 public immutable usdtToken;
    
    // Contract version for upgrades
    string public constant VERSION = "1.0.0";
    
    // Platform fee (in basis points: 100 = 1%)
    uint256 public platformFee = 100; // 1% fee
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5% max fee
    
    // Maximum number of shares per bill to prevent gas issues
    uint256 public constant MAX_SHARES = 100;
    
    // Bill status enumeration
    enum BillStatus {
        Active,    // Bill is open for payments
        Settled,   // Bill is fully paid and closed
        Cancelled  // Bill was cancelled by creator
    }
    
    // Bill structure
    struct Bill {
        address creator;           // Address of the bill creator
        uint256 sharePrice;        // Price per share in USDT (6 decimals)
        uint8 totalShares;         // Total number of shares for this bill
        uint8 paidShares;          // Number of shares already paid
        BillStatus status;         // Current status of the bill
        uint256 createdAt;         // Timestamp when bill was created
        uint256 settledAt;         // Timestamp when bill was settled (0 if not settled)
        string description;        // Optional description of the bill
    }
    
    // Mapping from bill ID to Bill struct
    mapping(bytes32 => Bill) public bills;
    
    // Mapping from bill ID to payer address to number of shares paid
    mapping(bytes32 => mapping(address => uint8)) public billPayments;
    
    // Mapping from bill ID to list of payers (for enumeration)
    mapping(bytes32 => address[]) public billPayers;
    
    // Mapping to track if an address has paid for a specific bill (for gas optimization)
    mapping(bytes32 => mapping(address => bool)) public hasPaid;
    
    // Platform fee collection
    uint256 public collectedFees;
    
    // Events
    event BillCreated(
        bytes32 indexed billId,
        address indexed creator,
        uint256 sharePrice,
        uint8 totalShares,
        string description
    );
    
    event BillPaid(
        bytes32 indexed billId,
        address indexed payer,
        uint8 shareCount,
        uint256 amount
    );
    
    event BillSettled(
        bytes32 indexed billId,
        address indexed creator,
        uint256 totalAmount,
        uint256 platformFeeAmount
    );
    
    event BillCancelled(
        bytes32 indexed billId,
        address indexed creator
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    // Custom errors for gas efficiency
    error BillNotFound();
    error BillNotActive();
    error BillAlreadyExists();
    error InvalidShares();
    error InvalidSharePrice();
    error InsufficientPayment();
    error ExcessiveShares();
    error UnauthorizedAccess();
    error InvalidFee();
    error NoFeesToWithdraw();
    error TransferFailed();
    
    /**
     * @dev Constructor sets the USDT token address and initial owner
     * @param _usdtToken Address of the USDT token contract on Base mainnet
     * @param _initialOwner Address that will be the initial owner of the contract
     */
    constructor(address _usdtToken, address _initialOwner) Ownable(_initialOwner) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_initialOwner != address(0), "Invalid initial owner address");
        usdtToken = IERC20(_usdtToken);
    }
    
    /**
     * @dev Modifier to check if bill exists and is active
     * @param billId The ID of the bill to check
     */
    modifier billExists(bytes32 billId) {
        if (bills[billId].creator == address(0)) revert BillNotFound();
        _;
    }
    
    /**
     * @dev Modifier to check if bill is active
     * @param billId The ID of the bill to check
     */
    modifier billActive(bytes32 billId) {
        if (bills[billId].status != BillStatus.Active) revert BillNotActive();
        _;
    }
    
    /**
     * @dev Modifier to check if caller is bill creator
     * @param billId The ID of the bill to check
     */
    modifier onlyBillCreator(bytes32 billId) {
        if (bills[billId].creator != msg.sender) revert UnauthorizedAccess();
        _;
    }
    
    /**
     * @dev Creates a new bill with specified parameters
     * @param billId Unique identifier for the bill
     * @param sharePrice Price per share in USDT (6 decimals)
     * @param totalShares Total number of shares for this bill
     * @param description Optional description of the bill
     */
    function createBill(
        bytes32 billId,
        uint256 sharePrice,
        uint8 totalShares,
        string memory description
    ) external {
        // Validate inputs
        if (bills[billId].creator != address(0)) revert BillAlreadyExists();
        if (sharePrice == 0) revert InvalidSharePrice();
        if (totalShares == 0 || totalShares > MAX_SHARES) revert InvalidShares();
        
        // Create the bill
        bills[billId] = Bill({
            creator: msg.sender,
            sharePrice: sharePrice,
            totalShares: totalShares,
            paidShares: 0,
            status: BillStatus.Active,
            createdAt: block.timestamp,
            settledAt: 0,
            description: description
        });
        
        emit BillCreated(billId, msg.sender, sharePrice, totalShares, description);
    }
    
    /**
     * @dev Closes a bill and settles payments to creator
     * @param billId The ID of the bill to close
     */
    function closeBill(bytes32 billId) 
        external 
        nonReentrant 
        billExists(billId) 
        billActive(billId) 
        onlyBillCreator(billId) 
    {
        Bill storage bill = bills[billId];
        
        // Calculate total amount and platform fee
        uint256 totalAmount = uint256(bill.paidShares) * bill.sharePrice;
        uint256 feeAmount = (totalAmount * platformFee) / 10000;
        uint256 creatorAmount = totalAmount - feeAmount;
        
        // Update bill status
        bill.status = BillStatus.Settled;
        bill.settledAt = block.timestamp;
        
        // Update collected fees
        collectedFees += feeAmount;
        
        // Transfer USDT to creator
        if (creatorAmount > 0) {
            usdtToken.safeTransfer(msg.sender, creatorAmount);
        }
        
        emit BillSettled(billId, msg.sender, totalAmount, feeAmount);
    }
    
    /**
     * @dev Cancels a bill and refunds all payments
     * @param billId The ID of the bill to cancel
     */
    function cancelBill(bytes32 billId) 
        external 
        nonReentrant 
        billExists(billId) 
        billActive(billId) 
        onlyBillCreator(billId) 
    {
        Bill storage bill = bills[billId];
        
        // Refund all payments
        address[] memory payers = billPayers[billId];
        for (uint256 i = 0; i < payers.length; i++) {
            address payer = payers[i];
            uint8 sharesPaid = billPayments[billId][payer];
            if (sharesPaid > 0) {
                uint256 refundAmount = uint256(sharesPaid) * bill.sharePrice;
                usdtToken.safeTransfer(payer, refundAmount);
                
                // Clear payment record
                billPayments[billId][payer] = 0;
                hasPaid[billId][payer] = false;
            }
        }
        
        // Update bill status
        bill.status = BillStatus.Cancelled;
        bill.settledAt = block.timestamp;
        
        // Clear payers array
        delete billPayers[billId];
        
        emit BillCancelled(billId, msg.sender);
    }
    
    /**
     * @dev Pays for shares of a bill using USDT
     * @param billId The ID of the bill to pay for
     * @param shareCount Number of shares to pay for
     */
    function payShare(bytes32 billId, uint8 shareCount) 
        external 
        nonReentrant 
        billExists(billId) 
        billActive(billId) 
    {
        if (shareCount == 0) revert InvalidShares();
        
        Bill storage bill = bills[billId];
        
        // Check if payment would exceed total shares
        if (bill.paidShares + shareCount > bill.totalShares) revert ExcessiveShares();
        
        // Calculate payment amount
        uint256 paymentAmount = uint256(shareCount) * bill.sharePrice;
        
        // Transfer USDT from payer to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), paymentAmount);
        
        // Update bill state
        bill.paidShares += shareCount;
        
        // Update payer tracking
        if (!hasPaid[billId][msg.sender]) {
            billPayers[billId].push(msg.sender);
            hasPaid[billId][msg.sender] = true;
        }
        billPayments[billId][msg.sender] += shareCount;
        
        emit BillPaid(billId, msg.sender, shareCount, paymentAmount);
        
        // Automatically close bill if fully paid
        if (bill.paidShares == bill.totalShares) {
            _settleBill(billId);
        }
    }
    
    /**
     * @dev Internal function to settle a fully paid bill
     * @param billId The ID of the bill to settle
     */
    function _settleBill(bytes32 billId) internal {
        Bill storage bill = bills[billId];
        
        // Calculate total amount and platform fee
        uint256 totalAmount = uint256(bill.paidShares) * bill.sharePrice;
        uint256 feeAmount = (totalAmount * platformFee) / 10000;
        uint256 creatorAmount = totalAmount - feeAmount;
        
        // Update bill status
        bill.status = BillStatus.Settled;
        bill.settledAt = block.timestamp;
        
        // Update collected fees
        collectedFees += feeAmount;
        
        // Transfer USDT to creator
        if (creatorAmount > 0) {
            usdtToken.safeTransfer(bill.creator, creatorAmount);
        }
        
        emit BillSettled(billId, bill.creator, totalAmount, feeAmount);
    }
    
    /**
     * @dev Updates the platform fee (only owner)
     * @param newFee New fee in basis points (100 = 1%)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_PLATFORM_FEE) revert InvalidFee();
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }
    
    /**
     * @dev Withdraws collected platform fees (only owner)
     * @param to Address to send the fees to
     */
    function withdrawFees(address to) external onlyOwner nonReentrant {
        if (collectedFees == 0) revert NoFeesToWithdraw();
        if (to == address(0)) revert UnauthorizedAccess();
        
        uint256 amount = collectedFees;
        collectedFees = 0;
        
        usdtToken.safeTransfer(to, amount);
        emit FeesWithdrawn(to, amount);
    }
    
    // View functions
    
    /**
     * @dev Gets bill details
     * @param billId The ID of the bill
     * @return Bill struct
     */
    function getBill(bytes32 billId) external view returns (Bill memory) {
        return bills[billId];
    }
    
    /**
     * @dev Gets payment details for a specific payer
     * @param billId The ID of the bill
     * @param payer Address of the payer
     * @return Number of shares paid by the payer
     */
    function getBillPayment(bytes32 billId, address payer) external view returns (uint8) {
        return billPayments[billId][payer];
    }
    
    /**
     * @dev Gets all payers for a bill
     * @param billId The ID of the bill
     * @return Array of payer addresses
     */
    function getBillPayers(bytes32 billId) external view returns (address[] memory) {
        return billPayers[billId];
    }
    
    /**
     * @dev Checks if a bill exists
     * @param billId The ID of the bill
     * @return True if bill exists
     */
    function isBillExists(bytes32 billId) external view returns (bool) {
        return bills[billId].creator != address(0);
    }
    
    /**
     * @dev Gets the total amount owed for a bill
     * @param billId The ID of the bill
     * @return Total amount in USDT
     */
    function getBillTotal(bytes32 billId) external view billExists(billId) returns (uint256) {
        Bill memory bill = bills[billId];
        return uint256(bill.totalShares) * bill.sharePrice;
    }
    
    /**
     * @dev Gets the remaining amount to be paid for a bill
     * @param billId The ID of the bill
     * @return Remaining amount in USDT
     */
    function getBillRemaining(bytes32 billId) external view billExists(billId) returns (uint256) {
        Bill memory bill = bills[billId];
        uint8 remainingShares = bill.totalShares - bill.paidShares;
        return uint256(remainingShares) * bill.sharePrice;
    }
}