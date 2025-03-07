# Release Guide for Batch Painting Feature

This document outlines the steps to commit and release the batch painting feature to the PixelPlace project.

## Pre-Release Checklist

- [x] Feature implementation complete
- [x] Tests passing for all functionality
- [x] Demo script created and tested
- [x] Documentation updated
- [x] Changelog updated
- [x] Package dependencies updated for ethers v6

## Git Commit Strategy

1. Commit the changes with a descriptive message:

```bash
git add .
git commit -m "Add batch painting functionality to reduce gas costs for painting multiple pixels"
```

2. Create a tag for the new version:

```bash
git tag v1.1.0
```

3. Push changes and tags:

```bash
git push origin main
git push origin v1.1.0
```

## Deployment Process

1. Deploy to Sepolia testnet (already completed):

```bash
npm run deploy:sepolia
```

2. Verify the contract on Etherscan:

```bash
CONTRACT_ADDRESS=<deployed_address> npm run verify:sepolia
```

3. Test the batch painting functionality using the demo script:

```bash
CONTRACT_ADDRESS=<deployed_address> npm run demo:batch:sepolia
```

4. Document the deployed contract address in your team's documentation.

## Mainnet Deployment (When Ready)

When ready for production:

1. Deploy to Ethereum mainnet:

```bash
npm run deploy:mainnet
```

2. Verify the contract on Etherscan:

```bash
CONTRACT_ADDRESS=<mainnet_address> npm run verify:script --network mainnet
```

3. Update documentation and announce the feature release.

## Post-Release Monitoring

1. Monitor gas usage for batch transactions vs. individual transactions
2. Track user adoption of the batch painting feature
3. Address any reported issues promptly 