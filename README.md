# PixelPlace - Decentralized Canvas Smart Contract

PixelPlace is a decentralized, interactive canvas on the Ethereum blockchain where users can pay a small fee to paint individual pixels in specific colors. Inspired by Reddit's r/place and Satoshi's Place, it allows for collaborative pixel art creation that is transparent and immutable.

## Features

- Fixed-size canvas (100x100 pixels)
- Pay a small fee in ETH to paint a pixel
- Full RGBA color support with alpha transparency
- Batch painting allows multiple pixels to be painted in a single transaction
- Any pixel can be repainted by anyone (no ownership restrictions)
- Canvas data is stored entirely on-chain
- Fees are collected and can be withdrawn by the contract owner

## Technical Implementation

The contract is implemented in Solidity and uses:

- 32-bit RGBA color format (4 bytes: red, green, blue, alpha)
- Alpha channel for transparency control (0 = fully transparent, 255 = fully opaque)
- Efficient storage using nested mappings
- Batch pixel painting for gas efficiency
- OpenZeppelin libraries for security (Ownable, ReentrancyGuard)
- Event emission for frontend tracking

## Getting Started

### Prerequisites

- Node.js (v12 or later)
- npm or yarn
- Hardhat

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Compile the contracts

   ```bash
   npx hardhat compile
   ```

### Testing

Run the test suite to ensure everything works correctly:

```bash
npx hardhat test
```

### Deployment

1. Configure your network settings in `hardhat.config.js`

2. Create a `.env` file with your private key and API endpoints (see `.env.example`)

3. Deploy to a network

   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

### Interacting with Deployed Contract

After deployment, you can interact with the contract using the demo scripts:

1. Set the `CONTRACT_ADDRESS` in your `.env` file to your deployed contract address

2. Run the batch painting demo:

   ```bash
   npm run demo:batch
   ```

   Or on a specific network (e.g., Sepolia):

   ```bash
   npm run demo:batch:sepolia
   ```

## Contract Functions

### Core Functions

- `paintPixel(uint256 x, uint256 y, bytes4 color) payable`: Paint a single pixel at (x,y) with the specified RGBA color
- `paintPixels(Pixel[] pixels) payable`: Paint multiple pixels in a single transaction with the specified coordinates and colors
- `getPixelColor(uint256 x, uint256 y)`: Get the color of a pixel at (x,y)
- `isPixelPainted(uint256 x, uint256 y)`: Check if a pixel has been painted (has non-zero alpha)
- `getPixelRGBA(uint256 x, uint256 y)`: Get the individual RGBA components of a pixel
- `getCanvasSection(uint256 startX, uint256 startY, uint256 width, uint256 height)`: Get a section of the canvas

### Data Structures

- `Pixel`: A struct representing a pixel to be painted:

  ```solidity
  struct Pixel {
      uint256 x;
      uint256 y;
      bytes4 color;  // RGBA format
  }
  ```

### Constants

- `WIDTH`: Canvas width (100 pixels)
- `HEIGHT`: Canvas height (100 pixels)
- `ALPHA_TRANSPARENT`: Alpha value for fully transparent pixels (0)
- `ALPHA_OPAQUE`: Alpha value for fully opaque pixels (255)
- `DEFAULT_COLOR`: Default color for unpainted pixels (transparent white: 0xFFFFFF00)

### Events

- `PixelPainted(uint256 indexed x, uint256 indexed y, bytes4 color, address indexed painter)`: Emitted when a single pixel is painted
- `PixelsBatchPainted(uint256 count, address indexed painter)`: Emitted when a batch of pixels is painted
- `FeeUpdated(uint256 newFee)`: Emitted when the pixel fee is updated

### Administrative Functions

- `setPixelFee(uint256 newFee)`: Update the fee required to paint a pixel (owner only)
- `withdraw()`: Withdraw collected fees (owner only)

## Frontend Integration

Frontends can interact with the contract by:

1. Querying the current state of the canvas using `getPixelColor` or `getCanvasSection`
2. Sending transactions to `paintPixel` with proper ETH value to paint individual pixels
3. Using `paintPixels` to paint multiple pixels in a single transaction for better gas efficiency
4. Listening to `PixelPainted` and `PixelsBatchPainted` events to update the display in real-time

### Example of Batch Painting with Alpha Channel

```javascript
// Example of painting multiple pixels in a batch with RGBA colors
const pixels = [
  { x: 5, y: 10, color: "0xff0000ff" },  // Red (fully opaque)
  { x: 6, y: 10, color: "0x00ff00ff" },  // Green (fully opaque)
  { x: 7, y: 10, color: "0x0000ffff" },  // Blue (fully opaque)
  { x: 8, y: 10, color: "0xffff0080" }   // Yellow (semi-transparent)
];

// Calculate the total fee
const pixelFee = await pixelPlace.pixelFee();
const totalFee = pixelFee * BigInt(pixels.length);

// Send the transaction
await pixelPlace.paintPixels(pixels, { value: totalFee });
```

### Working with Alpha Transparency

```javascript
// Check if a pixel has been painted (has non-zero alpha)
const isPainted = await pixelPlace.isPixelPainted(x, y);

// Get individual RGBA components
const [red, green, blue, alpha] = await pixelPlace.getPixelRGBA(x, y);

// Create a color with 50% transparency
const halfTransparentRed = "0xff0000" + "80"; // Red with alpha=128 (50%)

// Note: Solidity returns hex values in lowercase
// When comparing colors, you should normalize the case
function normalizeColorCase(color) {
  return color.toLowerCase();
}

// Example of comparing colors
const pixelColor = await pixelPlace.getPixelColor(x, y);
if (normalizeColorCase(pixelColor) === normalizeColorCase(expectedColor)) {
  // Colors match
}
```

## Gas Optimization

To keep gas costs manageable:

- The contract uses `bytes4` for RGBA color storage
- Canvas sections are limited to 1000 pixels per query to prevent excessive gas usage
- Batch painting allows multiple pixels to be updated in a single transaction, reducing overall gas costs
- Pixel painting has minimal overhead beyond storage updates

## Limitations

- Batch painting is limited to 500 pixels per transaction to prevent exceeding gas limits
- Individual pixels in a batch must still be within the canvas dimensions (0 to 99 for both x and y)
- All pixels in a batch require the same fee per pixel
- Color values returned by the contract are in lowercase, so comparisons should be case-insensitive

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

Possible future improvements:

- Cooldown periods between paintings of the same pixel
- Color palette restrictions to save gas
- Integration with Layer 2 solutions for scalability
- Dynamic fee adjustment based on pixel location or canvas activity
