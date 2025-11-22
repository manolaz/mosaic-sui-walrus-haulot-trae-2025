import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { useMemo, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import seedEvents from "../data/events.json";
import categories from "../data/categories.json";
import organizers from "../data/organizers.json";

type EventSeed = {
  title: string;
  description: string;
  categorySlug: string;
  organizerSlug: string;
  startsAt: string;
  endsAt: string;
};

export function ImportData() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const byCategory = useMemo(() => {
    const map: Record<string, EventSeed[]> = {};
    (seedEvents as EventSeed[]).forEach((e) => {
      if (!map[e.categorySlug]) map[e.categorySlug] = [];
      map[e.categorySlug].push(e);
    });
    return map;
  }, []);

  async function handleImportAll() {
    if (!account || !packageId) return;
    setBusy(true);
    setResults([]);
    try {
      for (const e of seedEvents as EventSeed[]) {
        const startsMs = Number.isFinite(Date.parse(e.startsAt)) ? Date.parse(e.startsAt) : 0;
        const endsMs = Number.isFinite(Date.parse(e.endsAt)) ? Date.parse(e.endsAt) : 0;
        const enc = new TextEncoder();
        const titleBytes = Array.from(enc.encode(e.title));
        const descriptionBytes = Array.from(enc.encode(e.description));
        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::event::create`,
          arguments: [
            tx.pure.address(account.address),
            tx.pure("vector<u8>", titleBytes),
            tx.pure("vector<u8>", descriptionBytes),
            tx.pure.u64(BigInt(startsMs)),
            tx.pure.u64(BigInt(endsMs)),
          ],
        });
        const res = await signAndExecute({ transaction: tx });
        const digest = (res as any)?.digest as string;
        setResults((prev) => [...prev, digest]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container>
      <Heading mb="3">📥 Import Sample Data</Heading>
      {!account ? <Text>🔌 Connect your wallet</Text> : null}
      {!packageId ? <Text>Missing package ID</Text> : null}
      <Box p="3" style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}>
        <Heading size="4">Categories</Heading>
        <Flex gap="2" mt="2">
          {(categories as any[]).map((c) => (
            <Box key={c.slug} p="2" style={{ border: "1px solid var(--gray-a4)", borderRadius: 12 }}>
              <Text>{c.name}</Text>
              <Text size="2">{(byCategory[c.slug] || []).length} events</Text>
            </Box>
          ))}
        </Flex>
      </Box>
      <Box mt="3" p="3" style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}>
        <Heading size="4">Events</Heading>
        <Flex direction="column" gap="2" mt="2">
          {(seedEvents as EventSeed[]).map((e, i) => (
            <Box key={`${e.title}-${i}`} p="2" style={{ border: "1px solid var(--gray-a4)", borderRadius: 12 }}>
              <Flex justify="between" align="center">
                <Text>{e.title}</Text>
                <Text>{new Date(Date.parse(e.startsAt)).toLocaleString()}</Text>
              </Flex>
              <Text>{e.description}</Text>
              <Text size="2">{e.categorySlug}</Text>
              <Text size="2">{e.organizerSlug}</Text>
            </Box>
          ))}
        </Flex>
        <Flex gap="2" mt="3" align="center">
          <Button onClick={handleImportAll} disabled={!account || !packageId || busy}>Import All to Sui testnet</Button>
          {busy ? <Text>Importing…</Text> : null}
        </Flex>
        <Flex direction="column" gap="1" mt="2">
          {results.map((d) => (
            <Text key={d}>Tx: {d}</Text>
          ))}
        </Flex>
      </Box>
      <Box mt="3" p="3" style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}>
        <Heading size="4">Organizers</Heading>
        <Flex gap="2" mt="2">
          {(organizers as any[]).map((o) => (
            <Box key={o.slug} p="2" style={{ border: "1px solid var(--gray-a4)", borderRadius: 12 }}>
              <Text>{o.name}</Text>
              {o.website ? <Text size="2">{o.website}</Text> : null}
              {o.twitter ? <Text size="2">{o.twitter}</Text> : null}
            </Box>
          ))}
        </Flex>
      </Box>
    </Container>
  );
}
