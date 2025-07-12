// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BillSplitter V2
 * @dev Simplified bill splitting contract with direct transfers and event-based tracking
 */
contract BillSplitterV2 is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;

    enum BillStatus { Active, Closed }

    struct Bill {
        address creator;
        uint256 sharePrice;
        uint8 totalShares;
        uint8 paidShares;
        BillStatus status;
        uint256 createdAt;
        string description; // Optional
    }

    mapping(bytes32 => Bill) public bills;
    mapping(bytes32 => bool) public billExists;

    // Events for tracking payments (replaces storage)
    event BillCreated(
        bytes32 indexed billId,
        address indexed creator,
        uint256 sharePrice,
        uint8 totalShares,
        string description
    );

    event BillUpdated(
        bytes32 indexed billId,
        uint256 newSharePrice,
        uint8 newTotalShares,
        string newDescription
    );

    event PaymentMade(
        bytes32 indexed billId,
        address indexed payer,
        uint8 sharesPaid,
        uint256 amount,
        bool isCreatorSelfPayment
    );

    event BillClosed(bytes32 indexed billId);

    // Custom errors
    error BillNotFound();
    error BillNotActive();
    error BillAlreadyExists();
    error InvalidShares();
    error ExcessiveShares();
    error OnlyCreator();
    error InvalidSharePrice();

    constructor(address _usdtToken, address _initialOwner) Ownable(_initialOwner) {
        usdtToken = IERC20(_usdtToken);
    }

    /**
     * @dev Create a new bill
     * @param billId Unique identifier for the bill
     * @param sharePrice Price per share in USDT (6 decimals)
     * @param totalShares Total number of shares
     * @param description Optional description of the bill
     */
    function createBill(
        bytes32 billId,
        uint256 sharePrice,
        uint8 totalShares,
        string calldata description
    ) external {
        if (billExists[billId]) revert BillAlreadyExists();
        if (sharePrice == 0) revert InvalidSharePrice();
        if (totalShares == 0 || totalShares > 100) revert InvalidShares();

        bills[billId] = Bill({
            creator: msg.sender,
            sharePrice: sharePrice,
            totalShares: totalShares,
            paidShares: 0,
            status: BillStatus.Active,
            createdAt: block.timestamp,
            description: description
        });

        billExists[billId] = true;

        emit BillCreated(billId, msg.sender, sharePrice, totalShares, description);
    }

    /**
     * @dev Update an existing bill (only by creator)
     * @param billId Bill identifier
     * @param newSharePrice New price per share
     * @param newTotalShares New total shares (must be >= current paid shares)
     * @param newDescription New description
     */
    function updateBill(
        bytes32 billId,
        uint256 newSharePrice,
        uint8 newTotalShares,
        string calldata newDescription
    ) external {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        if (bill.creator != msg.sender) revert OnlyCreator();
        if (bill.status != BillStatus.Active) revert BillNotActive();
        if (newSharePrice == 0) revert InvalidSharePrice();
        if (newTotalShares == 0 || newTotalShares > 100) revert InvalidShares();
        if (newTotalShares < bill.paidShares) revert InvalidShares(); // Can't reduce below paid shares

        bill.sharePrice = newSharePrice;
        bill.totalShares = newTotalShares;
        bill.description = newDescription;

        emit BillUpdated(billId, newSharePrice, newTotalShares, newDescription);
    }

    /**
     * @dev Pay for shares of a bill
     * @param billId Bill identifier
     * @param shareCount Number of shares to pay for
     */
    function payBill(bytes32 billId, uint8 shareCount) external nonReentrant {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        if (bill.status != BillStatus.Active) revert BillNotActive();
        if (shareCount == 0) revert InvalidShares();
        if (bill.paidShares + shareCount > bill.totalShares) revert ExcessiveShares();

        uint256 totalAmount = bill.sharePrice * shareCount;
        
        // Transfer USDT directly to bill creator
        usdtToken.safeTransferFrom(msg.sender, bill.creator, totalAmount);
        
        // Update paid shares
        bill.paidShares += shareCount;

        emit PaymentMade(billId, msg.sender, shareCount, totalAmount, false);

        // Auto-close if fully paid
        if (bill.paidShares >= bill.totalShares) {
            bill.status = BillStatus.Closed;
            emit BillClosed(billId);
        }
    }

    /**
     * @dev Creator marks shares as paid by themselves (no token transfer needed)
     * @param billId Bill identifier
     * @param shareCount Number of shares creator is paying for themselves
     */
    function creatorSelfPayment(bytes32 billId, uint8 shareCount) external {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        if (bill.creator != msg.sender) revert OnlyCreator();
        if (bill.status != BillStatus.Active) revert BillNotActive();
        if (shareCount == 0) revert InvalidShares();
        if (bill.paidShares + shareCount > bill.totalShares) revert ExcessiveShares();

        // Update paid shares without token transfer
        bill.paidShares += shareCount;
        uint256 totalAmount = bill.sharePrice * shareCount;

        emit PaymentMade(billId, msg.sender, shareCount, totalAmount, true);

        // Auto-close if fully paid
        if (bill.paidShares >= bill.totalShares) {
            bill.status = BillStatus.Closed;
            emit BillClosed(billId);
        }
    }

    /**
     * @dev Close a bill (only by creator)
     * @param billId Bill identifier
     */
    function closeBill(bytes32 billId) external {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        if (bill.creator != msg.sender) revert OnlyCreator();
        if (bill.status != BillStatus.Active) revert BillNotActive();

        bill.status = BillStatus.Closed;
        emit BillClosed(billId);
    }

    /**
     * @dev Get bill information
     * @param billId Bill identifier
     * @return creator Bill creator address
     * @return sharePrice Price per share in USDT
     * @return totalShares Total number of shares
     * @return paidShares Number of paid shares
     * @return status Bill status (Active/Closed)
     * @return createdAt Creation timestamp
     * @return description Bill description
     */
    function getBill(bytes32 billId) external view returns (
        address creator,
        uint256 sharePrice,
        uint8 totalShares,
        uint8 paidShares,
        BillStatus status,
        uint256 createdAt,
        string memory description
    ) {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        return (
            bill.creator,
            bill.sharePrice,
            bill.totalShares,
            bill.paidShares,
            bill.status,
            bill.createdAt,
            bill.description
        );
    }

    /**
     * @dev Check if bill exists
     * @param billId Bill identifier
     * @return true if bill exists
     */
    function isBillExists(bytes32 billId) external view returns (bool) {
        return billExists[billId];
    }

    /**
     * @dev Get remaining shares for a bill
     * @param billId Bill identifier
     * @return Number of unpaid shares
     */
    function getRemainingShares(bytes32 billId) external view returns (uint8) {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        return bill.totalShares - bill.paidShares;
    }

    /**
     * @dev Get total amount for a bill
     * @param billId Bill identifier
     * @return Total bill amount in USDT
     */
    function getTotalAmount(bytes32 billId) external view returns (uint256) {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        return bill.sharePrice * bill.totalShares;
    }

    /**
     * @dev Get paid amount for a bill
     * @param billId Bill identifier
     * @return Paid amount in USDT
     */
    function getPaidAmount(bytes32 billId) external view returns (uint256) {
        if (!billExists[billId]) revert BillNotFound();
        
        Bill storage bill = bills[billId];
        return bill.sharePrice * bill.paidShares;
    }
}