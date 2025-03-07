# Changelog

All notable changes to the PixelPlace project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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