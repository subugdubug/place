# Changelog

All notable changes to the PixelPlace project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2023-12-16

### Changed

- Updated tests to handle case-insensitive color comparisons
- Normalized hex color values in demo script and documentation

### Fixed

- Fixed issues with color case sensitivity (Solidity returns lowercase hex values)
- Added helper functions to normalize color case for consistent comparisons
- Updated documentation with color case sensitivity guidance

## [1.2.0] - 2023-12-15

### Added

- Alpha channel support for transparency
  - Changed color format from RGB (bytes3) to RGBA (bytes4)
  - Added constants for alpha values (ALPHA_TRANSPARENT, ALPHA_OPAQUE)
  - Added DEFAULT_COLOR constant (transparent white: 0xFFFFFF00)
- New functions for working with alpha channel
  - `isPixelPainted(uint256 x, uint256 y)`: Check if a pixel has been painted (has non-zero alpha)
  - `getPixelRGBA(uint256 x, uint256 y)`: Get individual RGBA components
- Enhanced tests for alpha channel functionality
- Updated demo script to showcase transparency features

### Changed

- Modified all color-related functions to work with bytes4 instead of bytes3
- Updated event signatures to use bytes4 for colors
- Changed default color behavior to use transparent white instead of opaque white
- Updated documentation to reflect RGBA color format

### Fixed

- Fixed the issue where black pixels (0x000000) couldn't be distinguished from unpainted pixels
- Improved color component extraction in the contract

## [1.1.0] - 2023-11-30

### Added

- Batch pixel painting functionality
  - New `paintPixels` function that allows painting multiple pixels in a single transaction
  - Added a `Pixel` struct to represent pixels with x, y coordinates and color
  - Emits individual `PixelPainted` events for each pixel plus a summarizing `PixelsBatchPainted` event
  - Maximum of 500 pixels can be painted in a single batch to prevent gas limit issues
- Demo script for batch painting (`scripts/demo-batch-paint.js`)
  - Demonstrates how to use the batch painting functionality
  - Draws a simple smiley face as an example
- Updated documentation about the batch painting feature in README.md

### Changed

- Updated tests to thoroughly test the batch painting functionality
- Enhanced error handling in demo scripts
- Updated dependencies to use ethers v6
- Improved gas efficiency for painting multiple pixels

### Fixed

- Gas cost optimizations for multiple pixel updates
- Improved event filtering in scripts for compatibility with ethers v6

## [1.0.0] - 2023-11-01

### Added

- Initial implementation of PixelPlace contract
- Basic pixel painting functionality
- Canvas data retrieval
- Fee management system
- Ownership and withdrawal mechanisms
