const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment of PixelPlace...");

  // Set the initial fee for painting pixels (0.001 ETH)
  const initialFee = ethers.parseEther("0.001");
  
  // Get the contract factory
  const PixelPlace = await ethers.getContractFactory("PixelPlace");
  
  // Deploy the contract
  console.log("Deploying PixelPlace with initial fee:", ethers.formatEther(initialFee), "ETH");
  const pixelPlace = await PixelPlace.deploy(initialFee);
  
  // Wait for deployment to complete
  await pixelPlace.waitForDeployment();
  
  const pixelPlaceAddress = await pixelPlace.getAddress();
  console.log("PixelPlace deployed to:", pixelPlaceAddress);
  console.log("Canvas dimensions:", 
    (await pixelPlace.WIDTH()).toString(), "x", 
    (await pixelPlace.HEIGHT()).toString()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 