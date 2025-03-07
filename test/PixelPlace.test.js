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

  describe("Batch Pixel Painting", function () {
    it("Should allow painting multiple pixels in a single transaction", async function () {
      const pixels = [
        { x: 5, y: 10, color: "0x111111" },
        { x: 25, y: 30, color: "0x222222" },
        { x: 50, y: 60, color: "0x333333" }
      ];
      
      const totalFee = INITIAL_FEE * BigInt(pixels.length);
      
      // Paint the pixels
      await expect(pixelPlace.connect(user1).paintPixels(pixels, {
        value: totalFee
      }))
        .to.emit(pixelPlace, "PixelsBatchPainted")
        .withArgs(pixels.length, await user1.getAddress());
      
      // Verify each pixel color
      for (const pixel of pixels) {
        const pixelColor = await pixelPlace.getPixelColor(pixel.x, pixel.y);
        expect(pixelColor).to.equal(pixel.color);
      }
    });

    it("Should fail batch painting if fee is insufficient", async function () {
      const pixels = [
        { x: 5, y: 10, color: "0x111111" },
        { x: 25, y: 30, color: "0x222222" }
      ];
      
      const insufficientFee = INITIAL_FEE; // Only paying for one pixel
      
      // Try to paint with insufficient fee
      await expect(
        pixelPlace.connect(user1).paintPixels(pixels, {
          value: insufficientFee
        })
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should fail batch painting if any pixel is out of bounds", async function () {
      const pixels = [
        { x: 5, y: 10, color: "0x111111" },
        { x: 105, y: 30, color: "0x222222" } // x is out of bounds
      ];
      
      const totalFee = INITIAL_FEE * BigInt(pixels.length);
      
      // Try to paint with a pixel out of bounds
      await expect(
        pixelPlace.connect(user1).paintPixels(pixels, {
          value: totalFee
        })
      ).to.be.revertedWith("Coordinates out of bounds");
    });

    it("Should fail if batch size is too large", async function () {
      // Create an array of 501 pixels (over the 500 limit)
      const pixels = [];
      for (let i = 0; i < 501; i++) {
        pixels.push({ x: i % 100, y: Math.floor(i / 100), color: "0x123456" });
      }
      
      const totalFee = INITIAL_FEE * BigInt(pixels.length);
      
      // Try to paint too many pixels
      await expect(
        pixelPlace.connect(user1).paintPixels(pixels, {
          value: totalFee
        })
      ).to.be.revertedWith("Too many pixels in a single transaction");
    });

    it("Should fail if pixels array is empty", async function () {
      const pixels = [];
      
      // Try to paint with an empty array
      await expect(
        pixelPlace.connect(user1).paintPixels(pixels, {
          value: INITIAL_FEE
        })
      ).to.be.revertedWith("No pixels to paint");
    });

    it("Should emit individual PixelPainted events for each pixel", async function () {
      const pixels = [
        { x: 5, y: 10, color: "0x111111" },
        { x: 25, y: 30, color: "0x222222" }
      ];
      
      const totalFee = INITIAL_FEE * BigInt(pixels.length);
      
      // Paint the pixels and check for events
      const tx = await pixelPlace.connect(user1).paintPixels(pixels, {
        value: totalFee
      });
      
      const receipt = await tx.wait();
      
      // Filter for PixelPainted events
      const paintedEvents = receipt.logs
        .filter(log => log.fragment && log.fragment.name === 'PixelPainted')
        .map(log => pixelPlace.interface.decodeEventLog('PixelPainted', log.data, log.topics));
      
      // Should have one event per pixel
      expect(paintedEvents.length).to.equal(pixels.length);
      
      // Check each event matches the expected pixel
      for (let i = 0; i < pixels.length; i++) {
        expect(paintedEvents[i].x).to.equal(BigInt(pixels[i].x));
        expect(paintedEvents[i].y).to.equal(BigInt(pixels[i].y));
        expect(paintedEvents[i].color).to.equal(pixels[i].color);
        expect(paintedEvents[i].painter).to.equal(await user1.getAddress());
      }
    });

    it("Should allow overwriting existing pixels in batch mode", async function () {
      // First paint some pixels individually
      await pixelPlace.connect(user1).paintPixel(5, 10, "0xAAAAAA", {
        value: INITIAL_FEE
      });
      
      await pixelPlace.connect(user1).paintPixel(25, 30, "0xBBBBBB", {
        value: INITIAL_FEE
      });
      
      // Now overwrite them in a batch
      const newPixels = [
        { x: 5, y: 10, color: "0x111111" },
        { x: 25, y: 30, color: "0x222222" }
      ];
      
      const totalFee = INITIAL_FEE * BigInt(newPixels.length);
      
      await pixelPlace.connect(user2).paintPixels(newPixels, {
        value: totalFee
      });
      
      // Verify new colors
      for (const pixel of newPixels) {
        const pixelColor = await pixelPlace.getPixelColor(pixel.x, pixel.y);
        expect(pixelColor).to.equal(pixel.color);
      }
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

    it("Should show correct canvas after batch painting", async function () {
      // Paint multiple pixels in a batch
      const pixels = [
        { x: 5, y: 5, color: "0x111111" },
        { x: 6, y: 5, color: "0x222222" },
        { x: 5, y: 6, color: "0x333333" }
      ];
      
      const totalFee = INITIAL_FEE * BigInt(pixels.length);
      
      await pixelPlace.connect(user1).paintPixels(pixels, {
        value: totalFee
      });
      
      // Get a 2x2 section
      const section = await pixelPlace.getCanvasSection(5, 5, 2, 2);
      
      // Verify section colors
      expect(section[0][0]).to.equal("0x111111");
      expect(section[0][1]).to.equal("0x222222");
      expect(section[1][0]).to.equal("0x333333");
      expect(section[1][1]).to.equal("0xffffff"); // Default white
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

    it("Should allow owner to withdraw fees from batch painting", async function () {
      // Paint multiple pixels in a batch
      const pixels = [
        { x: 5, y: 5, color: "0x111111" },
        { x: 6, y: 5, color: "0x222222" },
        { x: 5, y: 6, color: "0x333333" }
      ];
      
      const totalFee = INITIAL_FEE * BigInt(pixels.length);
      
      await pixelPlace.connect(user1).paintPixels(pixels, {
        value: totalFee
      });
      
      const initialBalance = await ethers.provider.getBalance(await owner.getAddress());
      
      // Owner withdraws fees
      const tx = await pixelPlace.connect(owner).withdraw();
      const receipt = await tx.wait();
      
      // Calculate gas costs
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Check owner's balance increased (minus gas costs)
      const finalBalance = await ethers.provider.getBalance(await owner.getAddress());
      expect(finalBalance >= initialBalance + totalFee - gasUsed).to.be.true;
      
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