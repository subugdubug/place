# Definition Document: Open Canvas Smart Contract ("PixelPlace")

## 1. Project Overview

### 1.1 Purpose

The goal of this project is to create a decentralized, interactive canvas on the Ethereum blockchain where users can pay a small fee to paint individual pixels in specific colors. The canvas will function similarly to Reddit's r/place or Satoshi's Place, allowing for collaborative pixel art that evolves over time. The smart contract will handle pixel ownership, color updates, and transaction fees, ensuring transparency and immutability.

### 1.2 Objectives

- **Core Functionality**: Allow users to paint pixels on a fixed-size canvas by specifying coordinates and colors via transactions.
- **Economic Incentives**: Require a small fee (in ETH) for each pixel painted, with fees going to a configurable recipient (e.g., contract owner or treasury).
- **Transparency**: Store canvas data on-chain to ensure immutability and decentralization.
- **Scalability & Gas Efficiency**: Optimize storage and computation to minimize gas costs for users.
- **Frontend Compatibility**: Ensure the contract can be queried easily for integration with a frontend interface (e.g., to display the canvas).

## 2. Requirements

### 2.1 Functional Requirements

1. **Canvas Setup**:
   - Fixed-size canvas (e.g., 100x100 pixels) defined at contract deployment.
   - Each pixel has coordinates (x, y) and a color (e.g., RGB or indexed color palette).
2. **Pixel Painting**:
   - Users can paint a pixel by calling a function with coordinates (x, y) and a color value.
   - Painting requires a payment (minimum fee set by the contract owner).
   - Pixels can be repainted by anyone (no ownership restrictions).
3. **Fee Management**:
   - Painting a pixel requires a fee in ETH (configurable by the contract owner).
   - Fees are collected and can be withdrawn by the contract owner or sent to a treasury.
4. **Canvas Data Access**:
   - Provide functions to query the color of a specific pixel.
   - Allow retrieval of the entire canvas state for frontend rendering.
5. **Events**:
   - Emit events when a pixel is painted (including coordinates, color, and user address).
   - Emit events when fees or settings are updated.

### 2.2 Non-Functional Requirements

1. **Gas Efficiency**:
   - Minimize gas costs for painting pixels and querying canvas data.
   - Avoid storing unnecessary data on-chain.
2. **Security**:
   - Prevent unauthorized access to administrative functions (e.g., fee updates, withdrawals).
   - Include checks to prevent out-of-bounds pixel coordinates.
3. **Scalability**:
   - Ensure the contract can handle a reasonable number of pixels (e.g., 10,000 for a 100x100 canvas) without excessive gas usage.
4. **Reliability**:
   - Use proper error handling for invalid inputs (e.g., coordinates, fees).

### 2.3 Constraints

- **Storage Limits**: On-chain storage is expensive, so the canvas size must balance usability with cost.
- **Color Representation**: Use a compact color format (e.g., 8-bit or 24-bit RGB) to save space.
- **Ethereum Gas Costs**: Painting and querying must be affordable for users.

## 3. Architecture and Design

### 3.1 Canvas Representation

- **Size**: The canvas will be a 100x100 grid (10,000 pixels total). This can be adjusted at deployment if needed.
- **Pixel Data**: Each pixel will store a color value. To save gas, we’ll use a 24-bit RGB color format (3 bytes: 1 byte each for red, green, blue).
- **Storage**: Use a 2D mapping to store pixel data: `mapping(uint256 => mapping(uint256 => bytes3)) canvas;` where `bytes3` holds the RGB color value.
- **Default State**: Initially, all pixels are white (`0xFFFFFF`).

### 3.2 Painting Mechanism

- **Function**: `paintPixel(uint256 x, uint256 y, bytes3 color)` allows users to paint a pixel.
- **Payment**: Users must send ETH with the transaction, meeting or exceeding the `pixelFee` (configurable by the owner).
- **Validation**:
  - Check that `(x, y)` coordinates are within bounds (0 ≤ x, y < 100).
  - Verify the transaction value meets the required fee.
- **Events**: Emit a `PixelPainted` event with the coordinates, color, and user address.

### 3.3 Fee Management

- **Fee Configuration**: The contract owner can set the `pixelFee` (in wei) using a restricted function.
- **Fee Collection**: Fees are accumulated in the contract balance and can be withdrawn by the owner via a `withdraw` function.
- **Events**: Emit a `FeeUpdated` event when the fee is changed.

### 3.4 Canvas Data Access

- **Single Pixel Query**: Provide a `getPixelColor(uint256 x, uint256 y)` function to return the color of a pixel.
- **Batch Query**: Provide a `getCanvasState(uint256 startX, uint256 startY, uint256 width, uint256 height)` function to fetch a rectangular section of the canvas (useful for frontend rendering).
- **Note**: Due to gas limits, fetching the entire canvas in one call may not be feasible; frontends should fetch data in chunks.

### 3.5 Security Mechanisms

- **Access Control**: Use OpenZeppelin’s `Ownable` to restrict fee updates and withdrawals to the contract owner.
- **Input Validation**: Validate all inputs (coordinates, colors, fees) to prevent errors or exploits.
- **Reentrancy Protection**: Use OpenZeppelin’s `ReentrancyGuard` for the `withdraw` function.

## 4. Implementation Plan

### 4.1 Smart Contract Structure

Below is a high-level outline of the contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PixelPlace is Ownable, ReentrancyGuard {
    // Canvas dimensions
    uint256 public constant WIDTH = 100;
    uint256 public constant HEIGHT = 100;

    // Fee to paint a pixel (in wei)
    uint256 public pixelFee;

    // Canvas storage: mapping of (x, y) to color (bytes3 for RGB)
    mapping(uint256 => mapping(uint256 => bytes3)) private canvas;

    // Events
    event PixelPainted(uint256 indexed x, uint256 indexed y, bytes3 color, address indexed painter);
    event FeeUpdated(uint256 newFee);

    constructor(uint256 initialFee) {
        pixelFee = initialFee;
    }

    // Paint a pixel at (x, y) with the given color
    function paintPixel(uint256 x, uint256 y, bytes3 color) external payable {
        // Validate coordinates
        require(x < WIDTH && y < HEIGHT, "Coordinates out of bounds");
        // Validate payment
        require(msg.value >= pixelFee, "Insufficient fee");

        // Update canvas
        canvas[x][y] = color;

        // Emit event
        emit PixelPainted(x, y, color, msg.sender);
    }

    // Get the color of a pixel at (x, y)
    function getPixelColor(uint256 x, uint256 y) external view returns (bytes3) {
        require(x < WIDTH && y < HEIGHT, "Coordinates out of bounds");
        return canvas[x][y] == 0 ? bytes3(0xFFFFFF) : canvas[x][y]; // Default to white
    }

    // Update the pixel painting fee (only owner)
    function setPixelFee(uint256 newFee) external onlyOwner {
        pixelFee = newFee;
        emit FeeUpdated(newFee);
    }

    // Withdraw collected fees (only owner)
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
```

### 4.2 Development Phases

1. **Phase 1: Core Contract Development**
   - Implement the basic contract structure with canvas storage, painting function, and fee management.
   - Add input validation and events.
2. **Phase 2: Security and Optimization**
   - Integrate OpenZeppelin’s `Ownable` and `ReentrancyGuard`.
   - Optimize storage and gas usage (e.g., consider using a single mapping for pixel data if needed).
3. **Phase 3: Testing**
   - Write unit tests using Hardhat or Foundry to test painting, fee updates, withdrawals, and edge cases (e.g., out-of-bounds coordinates).
   - Test gas costs for painting and querying.
4. **Phase 4: Deployment and Frontend Integration**
   - Deploy the contract to a testnet (e.g., Sepolia) for initial testing.
   - Provide ABI and documentation for frontend developers to build a UI for rendering the canvas and submitting transactions.

### 4.3 Future Enhancements

- **Cooldown Periods**: Add a cooldown period between paints for a given pixel to prevent spam.
- **Color Palette Restriction**: Restrict colors to a predefined palette to save storage or enforce consistency.
- **Batch Painting**: Allow users to paint multiple pixels in one transaction (with appropriate fee scaling).
- **Off-Chain Storage**: Explore hybrid solutions where pixel data is stored off-chain (e.g., IPFS) and only hashes are stored on-chain for gas savings.

## 5. Risks and Mitigation

- **High Gas Costs**: Painting many pixels could become expensive. Mitigation: Optimize storage and encourage frontend batching for queries.
- **Spam/Abuse**: Malicious users could spam the canvas. Mitigation: Introduce cooldowns or increasing fees for rapid paints.
- **Frontend Dependence**: The contract relies on a frontend for usability. Mitigation: Ensure the contract is usable via direct calls and document its functions well.

## 6. Deployment and Maintenance

- **Deployment**: Deploy on Ethereum mainnet or a layer-2 solution (e.g., Optimism, Arbitrum) for lower gas costs.
- **Initial Fee**: Set an initial `pixelFee` (e.g., 0.001 ETH) to balance accessibility and spam prevention.
- **Monitoring**: Monitor contract usage and collected fees to adjust `pixelFee` as needed.
- **Upgrades**: Use a proxy pattern (e.g., OpenZeppelin Upgrades) if future updates are anticipated.
