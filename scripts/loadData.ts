import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { walrus, WalrusFile } from "@mysten/walrus";

declare const process: any;
declare const Buffer: any;
declare const TextEncoder: any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NETWORK = "testnet" as const;
const FULLNODE_URL = getFullnodeUrl(NETWORK);
const MOSAIC_PACKAGE_ID = "0xf6012255c72bec20d66d825398a49bc6cf64391e80573c52073ee809880c6fb0";

type EventSeed = {
  title: string;
  description: string;
  categorySlug: string;
  organizerSlug: string;
  startsAt: string;
  endsAt: string;
};

function readJson(relative: string): any {
  const p = path.resolve(__dirname, "../../src/data", relative);
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

async function ensureFunds(address: string) {
  try {
    await requestSuiFromFaucetV2({ host: getFaucetHost(NETWORK), recipient: address });
    console.log(`Faucet requested for ${address}`);
  } catch (e: any) {
    console.warn(`Faucet request failed: ${e?.message || e}`);
  }
}

function vecFromString(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

async function createWalrusClient() {
  const client: any = new SuiJsonRpcClient({ url: FULLNODE_URL, network: NETWORK }).$extend(walrus());
  return client as any;
}

async function writeWalrusJson(data: unknown, signer: any, owner: string): Promise<string> {
  const client = await createWalrusClient();
  const file = WalrusFile.from({
    contents: new TextEncoder().encode(JSON.stringify(data)),
    identifier: "event.json",
    tags: { "content-type": "application/json" },
  });
  const res = await (client as any).walrus.writeFiles({ files: [file], signer, owner, epochs: 1, deletable: false });
  const blobId = res[0]?.blobId ?? res?.blobId ?? "";
  return blobId as string;
}

async function main() {
  const secretB64: string | undefined = process.env.SUI_SECRET_KEY_BASE64;
  const keypair = secretB64
    ? Ed25519Keypair.fromSecretKey(Buffer.from(secretB64, "base64"))
    : new Ed25519Keypair();
  const address = keypair.getPublicKey().toSuiAddress();
  const client = new SuiClient({ url: FULLNODE_URL });

  if (!secretB64) {
    await ensureFunds(address);
  }

  const events: EventSeed[] = readJson("events.json");
  const categories = readJson("categories.json");
  const organizers = readJson("organizers.json");

  const registry: any[] = [];
  for (const e of events) {
    const startsMs = Number.isFinite(Date.parse(e.startsAt)) ? Date.parse(e.startsAt) : 0;
    const endsMs = Number.isFinite(Date.parse(e.endsAt)) ? Date.parse(e.endsAt) : 0;
    let walrusBlobId = "";
    try {
      walrusBlobId = await writeWalrusJson(e, keypair, address);
    } catch (err: any) {
      console.warn(`Walrus write failed, continuing without blob: ${err?.message || err}`);
    }
    const tx = new Transaction();
    const eventObj = tx.moveCall({
      target: `${MOSAIC_PACKAGE_ID}::event::create`,
      arguments: [
        tx.pure.address(address),
        tx.pure("vector<u8>", vecFromString(e.title)),
        tx.pure("vector<u8>", vecFromString(e.description)),
        tx.pure.u64(BigInt(startsMs)),
        tx.pure.u64(BigInt(endsMs)),
      ],
    });
    tx.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`${MOSAIC_PACKAGE_ID}::event::Event`],
      arguments: [eventObj, tx.pure.address(address)],
    });
    const res = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
    const details = await client.waitForTransaction({ digest: res.digest, options: { showEffects: true } });
    const created = (details.effects?.created || []).find((c: any) => String(c.reference?.type || "").includes("::event::Event"));
    const eventId = created?.reference?.objectId || null;
    registry.push({ eventId, walrusBlobId, title: e.title, startsAt: e.startsAt, categorySlug: e.categorySlug, organizerSlug: e.organizerSlug });
    console.log(`Created event '${e.title}'`, { digest: res.digest, eventId, walrusBlobId });
  }

  try {
    const regBlobId = await writeWalrusJson({ network: NETWORK, packageId: MOSAIC_PACKAGE_ID, organizer: address, events: registry, timestamp: new Date().toISOString() }, keypair, address);
    console.log(`Event registry blob: ${regBlobId}`);
  } catch (err: any) {
    console.warn(`Walrus registry write failed: ${err?.message || err}`);
  }
  console.log(`Loaded categories: ${categories.length}, organizers: ${organizers.length}, events: ${events.length}`);
}

main().catch((e: any) => {
  console.error(e);
  process.exit(1);
});
