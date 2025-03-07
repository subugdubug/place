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

    // Define the pixels to paint (a simple smiley face)
    const pixels = [
      // Eyes
      { x: 40, y: 40, color: "0x000000" },
      { x: 60, y: 40, color: "0x000000" },
      // Smile
      { x: 35, y: 60, color: "0x000000" },
      { x: 40, y: 65, color: "0x000000" },
      { x: 45, y: 68, color: "0x000000" },
      { x: 50, y: 70, color: "0x000000" },
      { x: 55, y: 68, color: "0x000000" },
      { x: 60, y: 65, color: "0x000000" },
      { x: 65, y: 60, color: "0x000000" }
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
    
    console.log("Batch painting demonstration complete!");
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