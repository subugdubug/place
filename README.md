# PixelPlace - Decentralized Canvas Smart Contract

PixelPlace is a decentralized, interactive canvas on the Ethereum blockchain where users can pay a small fee to paint individual pixels in specific colors. Inspired by Reddit's r/place and Satoshi's Place, it allows for collaborative pixel art creation that is transparent and immutable.

## Features

- Fixed-size canvas (100x100 pixels)
- Pay a small fee in ETH to paint a pixel
- Any pixel can be repainted by anyone (no ownership restrictions)
- Canvas data is stored entirely on-chain
- Fees are collected and can be withdrawn by the contract owner

## Technical Implementation

The contract is implemented in Solidity and uses:
- 24-bit RGB color format (3 bytes for red, green, blue)
- Efficient storage using nested mappings
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

## Contract Functions

### Core Functions

- `paintPixel(uint256 x, uint256 y, bytes3 color) payable`: Paint a pixel at (x,y) with the specified RGB color
- `getPixelColor(uint256 x, uint256 y)`: Get the color of a pixel at (x,y)
- `getCanvasSection(uint256 startX, uint256 startY, uint256 width, uint256 height)`: Get a section of the canvas

### Administrative Functions

- `setPixelFee(uint256 newFee)`: Update the fee required to paint a pixel (owner only)
- `withdraw()`: Withdraw collected fees (owner only)

## Frontend Integration

Frontends can interact with the contract by:
1. Querying the current state of the canvas using `getPixelColor` or `getCanvasSection`
2. Sending transactions to `paintPixel` with proper ETH value to paint pixels
3. Listening to `PixelPainted` events to update their display in real-time

## Gas Optimization

To keep gas costs manageable:
- The contract uses `bytes3` for color storage (more compact than `uint256`)
- Canvas sections are limited to 1000 pixels per query to prevent excessive gas usage
- Pixel painting has minimal overhead beyond storage updates

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

Possible future improvements:
- Cooldown periods between paintings of the same pixel
- Color palette restrictions to save gas
- Batch painting functionality to reduce transaction costs
- Integration with Layer 2 solutions for scalability 