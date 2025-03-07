// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PixelPlace
 * @dev A decentralized canvas on Ethereum where users can paint pixels for a fee
 */
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
    event PixelsBatchPainted(uint256 count, address indexed painter);

    // Struct to represent a pixel to be painted
    struct Pixel {
        uint256 x;
        uint256 y;
        bytes3 color;
    }

    /**
     * @dev Constructor sets initial fee for painting pixels
     * @param initialFee The initial fee (in wei) required to paint a pixel
     */
    constructor(uint256 initialFee) {
        pixelFee = initialFee;
    }

    /**
     * @dev Paint a pixel at coordinates (x, y) with the specified color
     * @param x The x-coordinate of the pixel (0 to WIDTH-1)
     * @param y The y-coordinate of the pixel (0 to HEIGHT-1)
     * @param color The RGB color to paint (as bytes3)
     */
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

    /**
     * @dev Paint multiple pixels in a single transaction
     * @param pixels Array of Pixel structs containing coordinates and colors
     */
    function paintPixels(Pixel[] calldata pixels) external payable {
        // Validate the array isn't empty
        require(pixels.length > 0, "No pixels to paint");
        
        // Validate adequate payment for all pixels
        require(msg.value >= pixelFee * pixels.length, "Insufficient fee");
        
        // Maximum number of pixels to avoid gas limit issues
        require(pixels.length <= 500, "Too many pixels in a single transaction");
        
        // Paint each pixel
        for (uint256 i = 0; i < pixels.length; i++) {
            Pixel memory pixel = pixels[i];
            
            // Validate coordinates
            require(pixel.x < WIDTH && pixel.y < HEIGHT, "Coordinates out of bounds");
            
            // Update canvas
            canvas[pixel.x][pixel.y] = pixel.color;
            
            // Emit individual pixel painted event
            emit PixelPainted(pixel.x, pixel.y, pixel.color, msg.sender);
        }
        
        // Emit batch event
        emit PixelsBatchPainted(pixels.length, msg.sender);
    }

    /**
     * @dev Get the color of a specific pixel
     * @param x The x-coordinate of the pixel
     * @param y The y-coordinate of the pixel
     * @return The RGB color of the pixel (defaults to white if never painted)
     */
    function getPixelColor(uint256 x, uint256 y) external view returns (bytes3) {
        require(x < WIDTH && y < HEIGHT, "Coordinates out of bounds");
        return canvas[x][y] == 0 ? bytes3(0xFFFFFF) : canvas[x][y]; // Default to white
    }

    /**
     * @dev Get a section of the canvas
     * @param startX The starting x-coordinate
     * @param startY The starting y-coordinate
     * @param width The width of the section to retrieve
     * @param height The height of the section to retrieve
     * @return A 2D array of pixel colors
     */
    function getCanvasSection(
        uint256 startX,
        uint256 startY,
        uint256 width,
        uint256 height
    ) external view returns (bytes3[][] memory) {
        require(startX + width <= WIDTH, "X coordinates out of bounds");
        require(startY + height <= HEIGHT, "Y coordinates out of bounds");
        require(width > 0 && height > 0, "Width and height must be positive");
        
        // Due to gas limitations, restrict the size of sections that can be fetched
        require(width * height <= 1000, "Requested section too large");
        
        bytes3[][] memory section = new bytes3[][](height);
        
        for (uint256 y = 0; y < height; y++) {
            section[y] = new bytes3[](width);
            for (uint256 x = 0; x < width; x++) {
                bytes3 color = canvas[startX + x][startY + y];
                section[y][x] = color == 0 ? bytes3(0xFFFFFF) : color; // Default to white
            }
        }
        
        return section;
    }

    /**
     * @dev Update the pixel painting fee (only owner)
     * @param newFee The new fee amount in wei
     */
    function setPixelFee(uint256 newFee) external onlyOwner {
        pixelFee = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @dev Withdraw all collected fees (only owner)
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
} 