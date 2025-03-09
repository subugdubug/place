# Definition Document: Open Canvas Smart Contract ("PixelPlace")

## 1. Project Overview

### 1.1 Purpose

The goal of this project is to create a decentralized, interactive canvas on the blockchain where users can pay a fee to paint pixels in specific colors. The canvas will function similarly to Reddit's r/place or Satoshi's Place, allowing for collaborative pixel art that evolves over time, or completely devolve into a worldwide billboard. The smart contract will handle pixel painting, color updates, transparency, and transaction fees, ensuring a flexible and immutable art platform.

### 1.2 Objectives

- **Core Functionality**: Allow users to paint pixels on a fixed-size canvas by specifying coordinates and colors via transactions.
- **Advanced Color Support**: Support full RGBA colors with alpha transparency for more expressive artwork.
- **Batch Operations**: Enable painting multiple pixels in a single transaction for gas efficiency and better user experience.
- **Economic Incentives**: Require a small fee (in ETH) for each pixel painted, with fees going to the contract owner.
- **Transparency**: Store canvas data on-chain to ensure immutability and decentralization.
- **Scalability & Gas Efficiency**: Optimize storage and computation to minimize gas costs for users.
- **Frontend Compatibility**: Ensure the contract can be queried easily for integration with a frontend interface.

## 2. Requirements

### 2.1 Functional Requirements

1. **Canvas Setup**:
   - Fixed-size canvas (100x100 pixels) defined at contract deployment.
   - Each pixel has coordinates (x, y) and an RGBA color value (with alpha for transparency).

2. **Pixel Painting**:
   - Users can paint a single pixel by calling a function with coordinates (x, y) and a color value.
   - Users can paint multiple pixels in a batch to save on gas costs.
   - Painting requires a payment (fee set by the contract owner).
   - Pixels can be repainted by anyone (no ownership restrictions).
   - Support transparency via alpha channel in colors.

3. **Fee Management**:
   - Painting a pixel requires a fee in ETH (configurable by the contract owner).
   - For batch painting, fee scales linearly with the number of pixels.
   - Fees are collected and can be withdrawn by the contract owner.

4. **Canvas Data Access**:
   - Provide functions to query the color of a specific pixel.
   - Allow retrieval of sections of the canvas for frontend rendering.
   - Support querying pixel components (RGBA values) separately.
   - Check if pixels have been painted (have non-zero alpha).

5. **Events**:
   - Emit events when a pixel is painted (including coordinates, color, and user address).
   - Emit batch events when multiple pixels are painted at once.
   - Emit events when fees are updated.

### 2.2 Non-Functional Requirements

1. **Gas Efficiency**:
   - Minimize gas costs through batch operations and efficient storage.
   - Optimize data formats for on-chain storage.

2. **Security**:
   - Prevent unauthorized access to administrative functions.
   - Include bounds checking for pixel coordinates.
   - Protect against reentrancy attacks during withdrawals.

3. **Scalability**:
   - Support the 100x100 canvas (10,000 pixels) efficiently.
   - Allow retrieval of canvas sections to prevent gas limit issues.
   - Limit batch sizes to prevent exceeding gas limits.

4. **Reliability**:
   - Handle case sensitivity issues with hex color values.
   - Provide proper error handling for invalid inputs.
   - Ensure consistent behavior across different clients and interfaces.

### 2.3 Constraints

- **Storage Limits**: On-chain storage is expensive, balance canvas size with cost.
- **Color Representation**: Use bytes4 for RGBA to support transparency.
- **Gas Costs**: Batch operations to keep painting affordable.
- **Technical Interoperability**: Handle case sensitivity in hex color values.

## 3. Current Implementation

### 3.1 Canvas Representation

- **Size**: 100x100 grid (10,000 pixels total).
- **Pixel Data**: Each pixel stores a color value using 32-bit RGBA format (4 bytes: red, green, blue, alpha).
- **Storage**: 2D mapping structure `mapping(uint256 => mapping(uint256 => bytes4)) canvas;`.
- **Default State**: Initially, all pixels are transparent white (`0xFFFFFF00`).

### 3.2 Color Handling

- **Format**: Uses bytes4 for RGBA colors (last byte is alpha channel).
- **Transparency**: Alpha value of 0 means fully transparent, 255 means fully opaque.
- **Default Color**: Transparent white (`0xFFFFFF00`) for unpainted pixels.
- **Case Sensitivity**: Contract returns lowercase hex values; clients should normalize case for comparisons.

### 3.3 Painting Mechanisms

- **Single Pixel**: `paintPixel(uint256 x, uint256 y, bytes4 color)` allows painting one pixel.
- **Batch Painting**: `paintPixels(Pixel[] pixels)` allows painting multiple pixels in one transaction.
- **Batch Limits**: Maximum 500 pixels per batch to prevent gas limit issues.
- **Payment**: Users must send ETH with transactions based on the number of pixels painted.
- **Events**: Emits individual events for each pixel plus a batch summary event.

### 3.4 Pixel Status and Inspection

- **Color Retrieval**: `getPixelColor(uint256 x, uint256 y)` returns the RGBA color.
- **Paint Status**: `isPixelPainted(uint256 x, uint256 y)` checks if a pixel has non-zero alpha.
- **Color Components**: `getPixelRGBA(uint256 x, uint256 y)` returns individual R, G, B, A values.
- **Canvas Sections**: `getCanvasSection(startX, startY, width, height)` returns rectangular sections.

### 3.5 Fee Management

- **Fee Configuration**: Owner can set the `pixelFee` (in wei) per pixel.
- **Batch Fees**: Total fee scales linearly with the number of pixels in batch operations.
- **Fee Collection**: Fees accumulate in the contract balance for owner withdrawal.

### 3.6 Security Mechanisms

- **Access Control**: OpenZeppelin's `Ownable` restricts administrative functions.
- **Input Validation**: Coordinates, batch sizes, and fees are validated.
- **Reentrancy Protection**: `ReentrancyGuard` protects the withdrawal function.

## 4. Technical Details

### 4.1 Smart Contract Structure

The contract now includes features beyond the original PRD:

```solidity
contract PixelPlace is Ownable, ReentrancyGuard {
    // Canvas dimensions
    uint256 public constant WIDTH = 100;
    uint256 public constant HEIGHT = 100;
    
    // Alpha value constants
    uint8 public constant ALPHA_TRANSPARENT = 0;
    uint8 public constant ALPHA_OPAQUE = 255;
    
    // Default background color (white fully transparent)
    bytes4 public constant DEFAULT_COLOR = bytes4(0xFFFFFF00);

    // Fee to paint a pixel (in wei)
    uint256 public pixelFee;

    // Canvas storage: mapping of (x, y) to color (bytes4 for RGBA)
    mapping(uint256 => mapping(uint256 => bytes4)) private canvas;

    // Events
    event PixelPainted(uint256 indexed x, uint256 indexed y, bytes4 color, address indexed painter);
    event PixelsBatchPainted(uint256 count, address indexed painter);
    event FeeUpdated(uint256 newFee);

    // Struct for batch operations
    struct Pixel {
        uint256 x;
        uint256 y;
        bytes4 color;
    }

    // Core functions
    function paintPixel(uint256 x, uint256 y, bytes4 color) external payable;
    function paintPixels(Pixel[] calldata pixels) external payable;
    function getPixelColor(uint256 x, uint256 y) external view returns (bytes4);
    function isPixelPainted(uint256 x, uint256 y) external view returns (bool);
    function getPixelRGBA(uint256 x, uint256 y) external view returns (uint8 r, uint8 g, uint8 b, uint8 a);
    function getCanvasSection(uint256 startX, uint256 startY, uint256 width, uint256 height) external view returns (bytes4[][] memory);

    // Administrative functions
    function setPixelFee(uint256 newFee) external onlyOwner;
    function withdraw() external onlyOwner nonReentrant;
}
```

### 4.2 Implementation Highlights

1. **Alpha Channel Support**:
   - Uses bytes4 for RGBA colors instead of bytes3 for RGB.
   - Added constants for alpha values (TRANSPARENT, OPAQUE).
   - Default color is transparent white (0xFFFFFF00).
   - Functions to extract RGBA components separately.

2. **Batch Painting**:
   - Implemented the `Pixel` struct for batch operations.
   - Added `paintPixels` function to handle multiple pixels at once.
   - Limited batch size to 500 pixels to prevent gas limit issues.
   - Emits individual events plus a batch summary event.

3. **Transparency Features**:
   - Added `isPixelPainted` to check if a pixel has non-zero alpha.
   - Updated canvas to support transparent and semi-transparent colors.
   - Fixed issues with distinguishing black (0x000000FF) from unpainted pixels.

4. **Color Case Handling**:
   - Contract returns lowercase hex colors (e.g., "0xff0000ff").
   - Client-side normalization for case-insensitive comparisons.
   - Helper functions in tests and demos to handle this consistently.

### 4.3 Current Project Version

The project is currently at version 1.2.1, with the following version history:

- **v1.0.0**: Initial implementation with basic pixel painting
- **v1.1.0**: Added batch painting functionality
- **v1.2.0**: Added alpha channel support for transparency
- **v1.2.1**: Fixed color case sensitivity issues

## 5. Future Enhancements

### 5.1 Planned Improvements

- **Cooldown Periods**: Add time restrictions between paintings of the same pixel.
- **Color Palette Restrictions**: Optional predefined palette for consistency/gas savings.
- **Layer 2 Integration**: Support for Ethereum scaling solutions.
- **Dynamic Fees**: Adjust fees based on pixel location or canvas activity.

### 5.2 Advanced Features (Backlog)

- **Pixel Animation**: Support for time-based pixel changes.
- **Pixel Ownership**: Optional time-limited ownership after painting.
- **Social Features**: Collaborative zones or community challenges.
- **Activity Heatmap**: Visualization of frequently painted areas.

## 6. Integration Guidance

### 6.1 Frontend Integration

Frontends should:

1. Normalize color case when comparing values from the contract
2. Use batch painting for multiple pixels when possible
3. Handle transparency in UI rendering
4. Listen for both individual and batch events

### 6.2 Working with Alpha Channel

Example code:

```javascript
// Check if painted (has non-zero alpha)
const isPainted = await contract.isPixelPainted(x, y);

// Get individual RGBA components
const [r, g, b, a] = await contract.getPixelRGBA(x, y);

// Create semi-transparent color
const semiTransparentRed = "0xff0000" + "80"; // 50% opacity

// Normalize color case for comparisons
function normalizeColorCase(color) {
  return color.toLowerCase();
}
```

### 6.3 Batch Operations

For painting multiple pixels:

```javascript
const pixels = [
  { x: 5, y: 10, color: "0xff0000ff" }, // Red
  { x: 6, y: 10, color: "0x00ff00ff" }, // Green
  { x: 7, y: 10, color: "0x0000ffff" }  // Blue
];

const fee = pixelFee * BigInt(pixels.length);
await contract.paintPixels(pixels, { value: fee });
```

## 7. Deployment and Maintenance

### 7.1 Current Deployments

- Contract has been deployed and tested on Sepolia testnet
- Production deployment on Ethereum mainnet is pending

### 7.2 Monitoring Considerations

- Track gas costs of batch vs. individual painting
- Monitor fee levels relative to ETH price
- Observe popular canvas regions for potential dynamic fee adjustments
- Watch for any issues with color handling or transparency
