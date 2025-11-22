# Mosaic - Decentralized Ticketing Marketplace

**Tagline:** Every attendee is a piece of the picture.

Mosaic is a decentralized ticketing marketplace built on the Sui blockchain with Walrus for decentralized storage and Seal for encrypted access control. It enables organizers to create events, mint dynamic tickets as NFTs, and manage access with privacy-preserving encryption. Tickets are evolvable data objects that prove authenticity and organizer reputation while protecting user privacy.

This project refactors the Sui dApp Starter Template to implement Mosaic's hybrid architecture, integrating Sui for on-chain state, Walrus for off-chain asset storage, and Seal for threshold encryption tied to NFT ownership.

## Key Features

- **Dynamic Tickets**: Tickets as Sui objects with encrypted payloads stored in Walrus, evolvable via on-chain updates.
- **Privacy-Preserving Access**: Seal encryption ensures only ticket owners can decrypt and access ticket data.
- **Organizer Reputation System**: On-chain tracking of organizer credibility with Nautilus-style authenticity verification.
- **Frontend Interface**: React-based UI for event creation, marketplace browsing, ticket minting, and management.
- **Wallet Integration**: Seamless connection via `@mysten/dapp-kit` for Sui wallets.
- **Hybrid Architecture**: Combines Sui blockchain state, Walrus blob storage, and Seal access policies.

## Architecture Overview

- **Sui Blockchain**: Manages event and ticket state via Move smart contracts in `contracts/mosaic/`.
- **Walrus Storage**: Handles decentralized storage of encrypted ticket payloads using `@mysten/walrus` SDK.
- **Seal Encryption**: Provides threshold encryption and on-chain access control for secure data access.
- **Frontend**: Vite + React app with Radix UI components for user interaction.
- **Nautilus Integration**: (Planned) For verifiable off-chain computations to attest organizer authenticity.

For detailed architecture and integration steps, see `docs/Mosaic.md`.

## Prerequisites

- Node.js (v18+)
- pnpm (v8+)
- Sui CLI for Move contract deployment (optional for development)

## Installation

To install dependencies:

```bash
pnpm install
```

This includes key packages like `@mysten/dapp-kit`, `@mysten/walrus`, `@mysten/seal`, and others.

## Development

To start the dApp in development mode:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173/`.

## Building

To build the app for deployment:

```bash
pnpm build
```

## Linting

To run ESLint:

```bash
pnpm lint
```

## Move Contracts

Smart contracts are in `contracts/mosaic/`. To deploy:

1. Ensure Sui CLI is installed.
2. Navigate to `contracts/mosaic/`.
3. Run `sui move build` to compile.
4. Deploy to a Sui network and update `src/networkConfig.ts` with the `MOSAIC_PACKAGE_ID`.

## Testing

- Unit tests for Move contracts: (To be implemented).
- Integration tests for Sui-Walrus interactions: (Planned).
- Run frontend tests with `pnpm test` (if configured).

## Contributing

Contributions are welcome! Please follow the project's code style and submit pull requests.

## License

This project is licensed under the MIT License.
