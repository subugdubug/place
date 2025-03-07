# PixelPlace - Decentralized Canvas Smart Contract

PixelPlace is a decentralized, interactive canvas on the Ethereum blockchain where users can pay a small fee to paint individual pixels in specific colors. Inspired by Reddit's r/place and Satoshi's Place, it allows for collaborative pixel art creation that is transparent and immutable.

## Features

- Fixed-size canvas (100x100 pixels)
- Pay a small fee in ETH to paint a pixel
- Batch painting allows multiple pixels to be painted in a single transaction
- Any pixel can be repainted by anyone (no ownership restrictions)
- Canvas data is stored entirely on-chain
- Fees are collected and can be withdrawn by the contract owner

## Technical Implementation

The contract is implemented in Solidity and uses:
- 24-bit RGB color format (3 bytes for red, green, blue)
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

- `paintPixel(uint256 x, uint256 y, bytes3 color) payable`: Paint a single pixel at (x,y) with the specified RGB color
- `paintPixels(Pixel[] pixels) payable`: Paint multiple pixels in a single transaction with the specified coordinates and colors
- `getPixelColor(uint256 x, uint256 y)`: Get the color of a pixel at (x,y)
- `getCanvasSection(uint256 startX, uint256 startY, uint256 width, uint256 height)`: Get a section of the canvas

### Data Structures

- `Pixel`: A struct representing a pixel to be painted:
  ```solidity
  struct Pixel {
      uint256 x;
      uint256 y;
      bytes3 color;
  }
  ```

### Events

- `PixelPainted(uint256 indexed x, uint256 indexed y, bytes3 color, address indexed painter)`: Emitted when a single pixel is painted
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

### Example of Batch Painting

```javascript
// Example of painting multiple pixels in a batch
const pixels = [
  { x: 5, y: 10, color: "0x111111" },
  { x: 6, y: 10, color: "0x222222" },
  { x: 7, y: 10, color: "0x333333" }
];

// Calculate the total fee
const pixelFee = await pixelPlace.pixelFee();
const totalFee = pixelFee * BigInt(pixels.length);

// Send the transaction
await pixelPlace.paintPixels(pixels, { value: totalFee });
```

## Gas Optimization

To keep gas costs manageable:
- The contract uses `bytes3` for color storage (more compact than `uint256`)
- Canvas sections are limited to 1000 pixels per query to prevent excessive gas usage
- Batch painting allows multiple pixels to be updated in a single transaction, reducing overall gas costs
- Pixel painting has minimal overhead beyond storage updates

## Limitations

- Batch painting is limited to 500 pixels per transaction to prevent exceeding gas limits
- Individual pixels in a batch must still be within the canvas dimensions (0 to 99 for both x and y)
- All pixels in a batch require the same fee per pixel

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

Possible future improvements:
- Cooldown periods between paintings of the same pixel
- Color palette restrictions to save gas
- Integration with Layer 2 solutions for scalability
- Dynamic fee adjustment based on pixel location or canvas activity 