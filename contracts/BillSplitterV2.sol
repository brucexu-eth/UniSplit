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

    enum BillStatus { Active, Closed }

    struct Bill {
        address creator;
        address token;
        uint256 sharePrice;
        uint8 totalShares;
        uint8 paidShares;
        BillStatus status;
        uint256 createdAt;
    }

    mapping(bytes32 => Bill) public bills;
    mapping(bytes32 => bool) public billExists;

    // Events for tracking payments (replaces storage)
    event BillCreated(
        bytes32 indexed billId,
        address indexed creator,
        address indexed token,
        uint256 sharePrice,
        uint8 totalShares,
        uint8 creatorShares,
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
        uint256 amount
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
    error InvalidToken();
    error TokenMismatch();

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @dev Create a new bill
     * @param billId Unique identifier for the bill
     * @param token ERC20 token address for payments
     * @param sharePrice Price per share in token units
     * @param totalShares Total number of shares
     * @param creatorShares Number of shares creator is paying for themselves
     * @param description Optional description of the bill
     */
    function createBill(
        bytes32 billId,
        address token,
        uint256 sharePrice,
        uint8 totalShares,
        uint8 creatorShares,
        string calldata description
    ) external {
        if (billExists[billId]) revert BillAlreadyExists();
        if (token == address(0)) revert InvalidToken();
        if (sharePrice == 0) revert InvalidSharePrice();
        if (totalShares == 0 || totalShares > 100) revert InvalidShares();
        if (creatorShares > totalShares) revert ExcessiveShares();

        bills[billId] = Bill({
            creator: msg.sender,
            token: token,
            sharePrice: sharePrice,
            totalShares: totalShares,
            paidShares: creatorShares,
            status: BillStatus.Active,
            createdAt: block.timestamp
        });

        billExists[billId] = true;

        emit BillCreated(billId, msg.sender, token, sharePrice, totalShares, creatorShares, description);

        // Auto-close if creator paid all shares
        if (creatorShares >= totalShares) {
            bills[billId].status = BillStatus.Closed;
            emit BillClosed(billId);
        }
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

        emit BillUpdated(billId, newSharePrice, newTotalShares, newDescription);
    }

    /**
     * @dev Pay for shares of a bill
     * @param billId Bill identifier
     * @param token ERC20 token address (must match bill's token)
     * @param shareCount Number of shares to pay for
     */
    function payBill(bytes32 billId, address token, uint8 shareCount) external nonReentrant {
        if (!billExists[billId]) revert BillNotFound();

        Bill storage bill = bills[billId];
        if (bill.status != BillStatus.Active) revert BillNotActive();
        if (token != bill.token) revert TokenMismatch();
        if (shareCount == 0) revert InvalidShares();
        if (bill.paidShares + shareCount > bill.totalShares) revert ExcessiveShares();

        uint256 totalAmount = bill.sharePrice * shareCount;

        // Transfer tokens directly to bill creator
        IERC20(token).safeTransferFrom(msg.sender, bill.creator, totalAmount);

        // Update paid shares
        bill.paidShares += shareCount;

        emit PaymentMade(billId, msg.sender, shareCount, totalAmount);

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
     * @return token ERC20 token address
     * @return sharePrice Price per share in token units
     * @return totalShares Total number of shares
     * @return paidShares Number of paid shares
     * @return status Bill status (Active/Closed)
     * @return createdAt Creation timestamp
     */
    function getBill(bytes32 billId) external view returns (
        address creator,
        address token,
        uint256 sharePrice,
        uint8 totalShares,
        uint8 paidShares,
        BillStatus status,
        uint256 createdAt
    ) {
        if (!billExists[billId]) revert BillNotFound();

        Bill storage bill = bills[billId];
        return (
            bill.creator,
            bill.token,
            bill.sharePrice,
            bill.totalShares,
            bill.paidShares,
            bill.status,
            bill.createdAt
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
     * @return Total bill amount in token units
     */
    function getTotalAmount(bytes32 billId) external view returns (uint256) {
        if (!billExists[billId]) revert BillNotFound();

        Bill storage bill = bills[billId];
        return bill.sharePrice * bill.totalShares;
    }

    /**
     * @dev Get paid amount for a bill
     * @param billId Bill identifier
     * @return Paid amount in token units
     */
    function getPaidAmount(bytes32 billId) external view returns (uint256) {
        if (!billExists[billId]) revert BillNotFound();

        Bill storage bill = bills[billId];
        return bill.sharePrice * bill.paidShares;
    }
}