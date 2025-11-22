# Mosaic dApp Overview

Mosaic is a decentralized ticketing marketplace built on Sui with Walrus storage and Seal-managed encryption and access control.

## Architecture

- Hybrid design with Sui for state, Walrus for blob storage, Seal for encryption.
- Tickets are dynamic objects referencing encrypted Walrus blobs.
- Access control ties decryption rights to NFT ownership and policy code.
- Optional Nautilus-style attestation for organizer authenticity.

## On-chain Packages

- `event`: Create events with organizer, schedule, reputation.
- `ticket`: Mint transferable tickets with Walrus blob references and authenticity fields.
- `reputation`: Shared registry to track organizer reputation.
- `policy`: Seal-compatible policy function to approve key access.

## Frontend

- Marketplace: Event discovery and ticket listings.
- Create Event: Organizer flow to mint encrypted tickets.
- My Tickets: Wallet integration, owned objects, decryption form.

## Storage

- Walrus is used to store encrypted ticket payloads and evolving metadata.
- Files are written and read via the `@mysten/walrus` SDK.

## Encryption & Access

- Seal SDK provides identity-based encryption and threshold key fetch.
- Policy on Sui defines who can decrypt (e.g., current ticket holder).
- Fallback AES-GCM is available for local development.

## Authenticity

- Integrate Nautilus to verify organizer attestations for event authenticity.
- Verified outputs are stored and referenced in ticket objects.

## Testing

- Unit tests for Move modules (events, tickets, reputation, policy).
- Integration tests for Sui–Walrus flows and Seal key access.
- Performance checks for encryption and Walrus reads/writes.
- Security review for policy code and encryption usage.

## Configuration

- `MOSAIC_PACKAGE_ID` network variable for frontend calls.
- Seal key server object IDs and URLs for testnet.

## Tagline

Every attendee is a piece of the picture.

