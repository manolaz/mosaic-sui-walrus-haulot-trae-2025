import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { getFullnodeUrl } from "@mysten/sui/client";

export async function writeJsonToWalrus(
  data: unknown,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<string> {
  const walrusMod = await import("@mysten/walrus");
  const { walrus, WalrusFile } = walrusMod as any;
  const client = new SuiJsonRpcClient({ url: getFullnodeUrl(network), network }).$extend(
    walrus(),
  );
  const file = (WalrusFile as any).from({
    contents: new TextEncoder().encode(JSON.stringify(data)),
    identifier: "ticket.json",
    tags: { "content-type": "application/json" },
  });
  const res = await (client as any).walrus.writeFiles({ files: [file] });
  const blobId = res[0]?.blobId ?? res?.blobId ?? "";
  return blobId as string;
}

export async function readJsonFromWalrus(
  blobId: string,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<unknown> {
  const walrusMod = await import("@mysten/walrus");
  const { walrus } = walrusMod as any;
  const client = new SuiJsonRpcClient({ url: getFullnodeUrl(network), network }).$extend(
    walrus(),
  );
  const file = await (client as any).walrus.getFiles({ ids: [blobId] });
  const json = await file[0].json();
  return json;
}

export async function writeFileToWalrus(
  file: File,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<string> {
  const walrusMod = await import("@mysten/walrus");
  const { walrus, WalrusFile } = walrusMod as any;
  const client = new SuiJsonRpcClient({ url: getFullnodeUrl(network), network }).$extend(
    walrus(),
  );
  const contents = new Uint8Array(await file.arrayBuffer());
  const wf = (WalrusFile as any).from({
    contents,
    identifier: file.name || "file",
    tags: { "content-type": file.type || "application/octet-stream" },
  });
  const res = await (client as any).walrus.writeFiles({ files: [wf] });
  const blobId = res[0]?.blobId ?? res?.blobId ?? "";
  return blobId as string;
}

export async function getWalrusBlobObjectUrl(
  blobId: string,
  network: "devnet" | "testnet" | "mainnet" = "testnet",
): Promise<string> {
  const walrusMod = await import("@mysten/walrus");
  const { walrus } = walrusMod as any;
  const client = new SuiJsonRpcClient({ url: getFullnodeUrl(network), network }).$extend(
    walrus(),
  );
  const files = await (client as any).walrus.getFiles({ ids: [blobId] });
  const blob = await files[0].blob();
  const url = URL.createObjectURL(blob);
  return url;
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
