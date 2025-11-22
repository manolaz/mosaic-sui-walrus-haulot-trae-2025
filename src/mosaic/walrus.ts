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