import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";

// For testnet operations, we can generate a temporary keypair
// In production, this should use the user's actual keypair
export function getWalrusKeypair(): Ed25519Keypair {
  // Generate a new keypair for Walrus operations
  // In a real application, you might want to:
  // 1. Use the user's connected wallet keypair
  // 2. Store a dedicated keypair securely
  // 3. Use a keypair derived from the user's wallet
  return Ed25519Keypair.generate();
}

// Alternative: Create keypair from private key (for testing)
export function getWalrusKeypairFromPrivateKey(privateKeyBase64: string): Ed25519Keypair {
  const privateKey = fromB64(privateKeyBase64);
  return Ed25519Keypair.fromSecretKey(privateKey);
}

// Walrus testnet configuration
export const WALRUS_CONFIG = {
  testnet: {
    aggregator: 'https://aggregator.walrus-testnet.walrus.space',
    publisher: 'https://publisher.walrus-testnet.walrus.space',
    uploadRelay: 'https://upload-relay.testnet.walrus.space'
  },
  mainnet: {
    aggregator: 'https://aggregator.walrus-mainnet.walrus.space',
    publisher: 'https://publisher.walrus-mainnet.walrus.space',
    uploadRelay: 'https://upload-relay.mainnet.walrus.space'
  }
} as const;