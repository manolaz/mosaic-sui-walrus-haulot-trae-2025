import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { walrus } from "@mysten/walrus";
import type { Keypair } from "@mysten/sui/cryptography";

const WALRUS_TESTNET_CONFIG = {
  aggregator: 'https://aggregator.walrus-testnet.walrus.space',
  publisher: 'https://publisher.walrus-testnet.walrus.space',
  uploadRelay: 'https://upload-relay.testnet.walrus.space'
};

export function createWalrusClient(network: "devnet" | "testnet" | "mainnet" = "testnet") {
  const client = new SuiClient({ 
    url: getFullnodeUrl(network), 
    network 
  }).$extend(
    walrus({
      uploadRelay: {
        host: WALRUS_TESTNET_CONFIG.uploadRelay,
        sendTip: {
          max: 1_000,
        },
      },
    })
  );
  return client;
}

export async function writeJsonToWalrus(
  data: unknown,
  signer: Keypair,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<string> {
  const client = createWalrusClient(network);
  const fileData = new TextEncoder().encode(JSON.stringify(data));
  
  const { blobId } = await client.walrus.writeBlob({
    blob: fileData,
    deletable: true,
    epochs: 3,
    signer,
  });
  
  return blobId;
}

export async function readJsonFromWalrus(
  blobId: string,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<unknown> {
  const client = createWalrusClient(network);
  const file = await client.walrus.getFiles({ ids: [blobId] });
  const json = await file[0].json();
  return json;
}

export async function writeFileToWalrus(
  file: File,
  signer: Keypair,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<string> {
  const client = createWalrusClient(network);
  const contents = new Uint8Array(await file.arrayBuffer());
  
  const { blobId } = await client.walrus.writeBlob({
    blob: contents,
    deletable: true,
    epochs: 3,
    signer,
  });
  
  return blobId;
}

export async function getWalrusBlobObjectUrl(
  blobId: string,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<string> {
  const gatewayUrl = walrusBlobGatewayUrl(blobId, network);
  return gatewayUrl;
}

export function walrusBlobGatewayUrl(
  blobId: string,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): string {
  const base = network === "mainnet"
    ? "https://walrus.mainnet.mystenlabs.com"
    : network === "devnet"
      ? "https://walrus.devnet.mystenlabs.com"
      : "https://walrus.testnet.mystenlabs.com";
  return `${base}/v1/blob/${blobId}`;
}
