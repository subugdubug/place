const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Demonstrating batch painting functionality on deployed contract...");

  // Get the deployed contract address from command line arguments or use a default
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set the CONTRACT_ADDRESS environment variable");
    return;
  }

  try {
    // Get the first signer
    const [signer] = await ethers.getSigners();
    console.log("Using account:", await signer.getAddress());

    // Verify the contract exists
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      console.error(`No contract found at address ${contractAddress}`);
      return;
    }

    // Get the contract instance
    const PixelPlace = await ethers.getContractFactory("PixelPlace");
    const pixelPlace = PixelPlace.attach(contractAddress);

    // Get the current pixel fee
    const pixelFee = await pixelPlace.pixelFee();
    console.log("Current pixel fee:", ethers.formatEther(pixelFee), "ETH");
    
    // Get alpha constants
    const ALPHA_OPAQUE = await pixelPlace.ALPHA_OPAQUE();
    console.log("Alpha opaque value:", ALPHA_OPAQUE);

    // Define RGBA colors with full opacity - using lowercase to match contract behavior
    const BLACK_OPAQUE = "0x000000ff"; // Black with full alpha (opaque)
    const RED_OPAQUE = "0xff0000ff";   // Red with full alpha (opaque)
    const YELLOW_OPAQUE = "0xffff00ff"; // Yellow with full alpha (opaque)
    
    // Helper function to normalize color format
    function normalizeColorCase(color) {
      return color.toLowerCase();
    }
    
    // Define the pixels to paint (a simple smiley face)
    const pixels = [
      // Eyes (black)
      { x: 40, y: 40, color: BLACK_OPAQUE },
      { x: 60, y: 40, color: BLACK_OPAQUE },
      // Smile (black)
      { x: 35, y: 60, color: BLACK_OPAQUE },
      { x: 40, y: 65, color: BLACK_OPAQUE },
      { x: 45, y: 68, color: BLACK_OPAQUE },
      { x: 50, y: 70, color: BLACK_OPAQUE },
      { x: 55, y: 68, color: BLACK_OPAQUE },
      { x: 60, y: 65, color: BLACK_OPAQUE },
      { x: 65, y: 60, color: BLACK_OPAQUE },
      // Add a red nose with full opacity
      { x: 50, y: 50, color: RED_OPAQUE },
      // Add yellow cheeks with 50% opacity
      { x: 30, y: 50, color: "0xffff0080" }, // Semi-transparent yellow
      { x: 70, y: 50, color: "0xffff0080" }  // Semi-transparent yellow
    ];

    // Calculate total fee
    const totalFee = pixelFee * BigInt(pixels.length);
    console.log(`Painting ${pixels.length} pixels for a total of ${ethers.formatEther(totalFee)} ETH`);

    // Paint the pixels in a batch
    console.log("Submitting batch painting transaction...");
    const tx = await pixelPlace.paintPixels(pixels, { value: totalFee });
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block", receipt.blockNumber);
    
    // Filter through the logs to find pixel painted events
    const paintedEvents = [];
    for (const log of receipt.logs) {
      try {
        if (log.fragment && log.fragment.name === 'PixelPainted') {
          const event = pixelPlace.interface.decodeEventLog('PixelPainted', log.data, log.topics);
          paintedEvents.push(event);
        }
      } catch (e) {
        // Skip logs that can't be decoded as this event
      }
    }
    
    console.log(`Successfully painted ${paintedEvents.length} pixels in a single transaction`);
    
    // Find the batch event
    const batchEvents = [];
    for (const log of receipt.logs) {
      try {
        if (log.fragment && log.fragment.name === 'PixelsBatchPainted') {
          const event = pixelPlace.interface.decodeEventLog('PixelsBatchPainted', log.data, log.topics);
          batchEvents.push(event);
        }
      } catch (e) {
        // Skip logs that can't be decoded as this event
      }
    }
    
    if (batchEvents.length > 0) {
      console.log(`Batch event emitted: ${batchEvents[0].count} pixels painted by ${batchEvents[0].painter}`);
    }
    
    // Check if pixels are painted
    console.log("\nVerifying pixel painting status:");
    
    // Check a painted pixel with full opacity
    const isBlackEyePainted = await pixelPlace.isPixelPainted(40, 40);
    console.log(`Black eye pixel (40,40) is painted: ${isBlackEyePainted}`);
    
    // Check a painted pixel with partial opacity
    const isCheekPainted = await pixelPlace.isPixelPainted(30, 50);
    console.log(`Yellow cheek pixel (30,50) is painted: ${isCheekPainted}`);
    
    // Check an unpainted pixel
    const isUnpaintedPixel = await pixelPlace.isPixelPainted(10, 10);
    console.log(`Unpainted pixel (10,10) is painted: ${isUnpaintedPixel}`);
    
    // Get RGBA components of a pixel
    const [r, g, b, a] = await pixelPlace.getPixelRGBA(50, 50);
    console.log(`\nRed nose pixel (50,50) RGBA components: R:${r}, G:${g}, B:${b}, Alpha:${a}`);
    
    // Get colors and display them
    console.log("\nVerifying pixel colors:");
    
    const blackEyeColor = await pixelPlace.getPixelColor(40, 40);
    console.log(`Black eye pixel color: ${blackEyeColor} (normalized: ${normalizeColorCase(blackEyeColor)})`);
    
    const redNoseColor = await pixelPlace.getPixelColor(50, 50);
    console.log(`Red nose pixel color: ${redNoseColor} (normalized: ${normalizeColorCase(redNoseColor)})`);
    
    const yellowCheekColor = await pixelPlace.getPixelColor(30, 50);
    console.log(`Yellow cheek pixel color: ${yellowCheekColor} (normalized: ${normalizeColorCase(yellowCheekColor)})`);
    
    const unpaintedColor = await pixelPlace.getPixelColor(10, 10);
    console.log(`Unpainted pixel color: ${unpaintedColor} (normalized: ${normalizeColorCase(unpaintedColor)})`);
    
    // Get and display default color value
    const defaultColor = await pixelPlace.DEFAULT_COLOR();
    console.log(`Default color from contract: ${defaultColor} (normalized: ${normalizeColorCase(defaultColor)})`);
    
    console.log("\nBatch painting demonstration complete!");
  } catch (error) {
    console.error("Error during batch painting demonstration:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 