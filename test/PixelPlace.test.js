const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PixelPlace", function () {
  let pixelPlace;
  let owner;
  let user1;
  let user2;
  const INITIAL_FEE = ethers.parseEther("0.001"); // 0.001 ETH

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy the contract
    const PixelPlace = await ethers.getContractFactory("PixelPlace");
    pixelPlace = await PixelPlace.deploy(INITIAL_FEE);
    await pixelPlace.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct initial fee", async function () {
      expect(await pixelPlace.pixelFee()).to.equal(INITIAL_FEE);
    });

    it("Should set the correct owner", async function () {
      expect(await pixelPlace.owner()).to.equal(await owner.getAddress());
    });

    it("Should have the correct canvas dimensions", async function () {
      expect(await pixelPlace.WIDTH()).to.equal(100);
      expect(await pixelPlace.HEIGHT()).to.equal(100);
    });
  });

  describe("Pixel Painting", function () {
    it("Should allow painting a pixel with correct fee", async function () {
      const x = 5;
      const y = 10;
      const color = "0x123456"; // RGB color
      
      // Paint the pixel
      await expect(pixelPlace.connect(user1).paintPixel(x, y, color, {
        value: INITIAL_FEE
      }))
        .to.emit(pixelPlace, "PixelPainted")
        .withArgs(x, y, color, await user1.getAddress());
      
      // Verify the pixel color
      const pixelColor = await pixelPlace.getPixelColor(x, y);
      expect(pixelColor).to.equal(color);
    });

    it("Should fail if fee is insufficient", async function () {
      const x = 5;
      const y = 10;
      const color = "0x123456"; // RGB color
      const insufficientFee = ethers.parseEther("0.0005"); // Less than required
      
      // Try to paint with insufficient fee
      await expect(
        pixelPlace.connect(user1).paintPixel(x, y, color, {
          value: insufficientFee
        })
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should fail if coordinates are out of bounds", async function () {
      const color = "0x123456"; // RGB color
      
      // Try to paint with x out of bounds
      await expect(
        pixelPlace.connect(user1).paintPixel(100, 50, color, {
          value: INITIAL_FEE
        })
      ).to.be.revertedWith("Coordinates out of bounds");
      
      // Try to paint with y out of bounds
      await expect(
        pixelPlace.connect(user1).paintPixel(50, 100, color, {
          value: INITIAL_FEE
        })
      ).to.be.revertedWith("Coordinates out of bounds");
    });

    it("Should allow overwriting an existing pixel", async function () {
      const x = 5;
      const y = 10;
      const color1 = "0x123456"; // First color
      const color2 = "0x654321"; // Second color
      
      // Paint the pixel first time
      await pixelPlace.connect(user1).paintPixel(x, y, color1, {
        value: INITIAL_FEE
      });
      
      // Paint the same pixel second time
      await pixelPlace.connect(user2).paintPixel(x, y, color2, {
        value: INITIAL_FEE
      });
      
      // Verify the pixel has the new color
      const pixelColor = await pixelPlace.getPixelColor(x, y);
      expect(pixelColor).to.equal(color2);
    });
  });

  describe("Canvas Retrieval", function () {
    it("Should return white for unpainted pixels", async function () {
      const x = 15;
      const y = 20;
      
      // Get an unpainted pixel
      const pixelColor = await pixelPlace.getPixelColor(x, y);
      expect(pixelColor).to.equal("0xffffff"); // White
    });

    it("Should retrieve a section of the canvas", async function () {
      // Paint a few pixels
      await pixelPlace.connect(user1).paintPixel(5, 5, "0x111111", {
        value: INITIAL_FEE
      });
      
      await pixelPlace.connect(user1).paintPixel(6, 5, "0x222222", {
        value: INITIAL_FEE
      });
      
      await pixelPlace.connect(user1).paintPixel(5, 6, "0x333333", {
        value: INITIAL_FEE
      });
      
      // Get a 2x2 section
      const section = await pixelPlace.getCanvasSection(5, 5, 2, 2);
      
      // Verify section colors
      expect(section[0][0]).to.equal("0x111111");
      expect(section[0][1]).to.equal("0x222222");
      expect(section[1][0]).to.equal("0x333333");
      expect(section[1][1]).to.equal("0xffffff"); // Default white
    });

    it("Should fail if requested section is too large", async function () {
      await expect(
        pixelPlace.getCanvasSection(0, 0, 40, 40) // 1600 pixels, over the 1000 limit
      ).to.be.revertedWith("Requested section too large");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update the fee", async function () {
      const newFee = ethers.parseEther("0.002");
      
      await expect(pixelPlace.connect(owner).setPixelFee(newFee))
        .to.emit(pixelPlace, "FeeUpdated")
        .withArgs(newFee);
      
      expect(await pixelPlace.pixelFee()).to.equal(newFee);
    });

    it("Should prevent non-owners from updating the fee", async function () {
      const newFee = ethers.parseEther("0.002");
      
      await expect(
        pixelPlace.connect(user1).setPixelFee(newFee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to withdraw fees", async function () {
      // User paints a pixel, sending ETH to the contract
      await pixelPlace.connect(user1).paintPixel(5, 10, "0x123456", {
        value: INITIAL_FEE
      });
      
      const initialBalance = await ethers.provider.getBalance(await owner.getAddress());
      
      // Owner withdraws fees
      const tx = await pixelPlace.connect(owner).withdraw();
      const receipt = await tx.wait();
      
      // Calculate gas costs
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Check owner's balance increased (minus gas costs)
      const finalBalance = await ethers.provider.getBalance(await owner.getAddress());
      expect(finalBalance >= initialBalance + INITIAL_FEE - gasUsed).to.be.true;
      
      // Contract balance should be zero
      const contractAddress = await pixelPlace.getAddress();
      const contractBalance = await ethers.provider.getBalance(contractAddress);
      expect(contractBalance).to.equal(0);
    });

    it("Should prevent non-owners from withdrawing fees", async function () {
      // User paints a pixel
      await pixelPlace.connect(user1).paintPixel(5, 10, "0x123456", {
        value: INITIAL_FEE
      });
      
      // User tries to withdraw
      await expect(
        pixelPlace.connect(user1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if withdrawing with zero balance", async function () {
      await expect(
        pixelPlace.connect(owner).withdraw()
      ).to.be.revertedWith("No funds to withdraw");
    });
  });
}); 