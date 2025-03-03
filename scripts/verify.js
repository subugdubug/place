const { ethers, run } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set the CONTRACT_ADDRESS environment variable");
    return;
  }
  
  console.log(`Verifying contract at address: ${contractAddress}`);
  
  // The initial fee used during deployment (adjust if needed)
  const initialFee = ethers.parseEther("0.001");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [initialFee],
    });

    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 