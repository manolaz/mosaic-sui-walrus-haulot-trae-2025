import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import seedEvents from "../data/events.json";
import organizers from "../data/organizers.json";

type RawFields = {
  organizer: string;
  title: any;
  description: any;
  starts_at_ms: string | number;
  ends_at_ms: string | number;
};

function decodeVecU8(v: any): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    try {
      const bytes = new Uint8Array(v as number[]);
      return new TextDecoder().decode(bytes);
    } catch {
      return "";
    }
  }
  return "";
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString();
}

function seedIdFor(e: any): string {
  const titleSlug = String(e.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const ts = Number.isFinite(Date.parse(e.startsAt))
    ? Date.parse(e.startsAt)
    : 0;
  return `${titleSlug}-${ts}`;
}

export function Calendars() {
  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");
  const { data: txs, isPending: txsPending } = useSuiClientQuery(
    "queryTransactionBlocks",
    {
      filter: {
        MoveFunction: {
          package: packageId as string,
          module: "event",
          function: "create",
        },
      },
      limit: 200,
      order: "descending",
      options: { showEffects: true },
    },
    { enabled: !!packageId },
  );

  const ids: string[] = [];
  (txs?.data || []).forEach((tx: any) => {
    const created = tx.effects?.created || [];
    created.forEach((c: any) => {
      const type = c.reference?.type || "";
      if (typeof type === "string" && type.includes("::event::Event")) {
        const id = c.reference?.objectId;
        if (id && !ids.includes(id)) ids.push(id);
      }
    });
  });

  const { data: objects, isPending: objPending } = useSuiClientQuery(
    "multiGetObjects",
    { ids, options: { showType: true, showContent: true } },
    { enabled: ids.length > 0 },
  );

  const events = (objects || [])
    .map((o: any) => {
      const f = (o.data?.content as any)?.fields as RawFields | undefined;
      if (!f) return null as any;
      return {
        id: o.data?.objectId as string,
        organizer: f.organizer as string,
        title: decodeVecU8(f.title),
        description: decodeVecU8(f.description),
        startsMs: Number(f.starts_at_ms),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.startsMs - b.startsMs);

  const grouped: Record<string, typeof events> = {} as any;
  events.forEach((e) => {
    const key = e.organizer;
    if (!grouped[key]) grouped[key] = [] as any;
    grouped[key].push(e);
  });

  const organizerKeys = Object.keys(grouped);

  const seedGroups: Record<string, any[]> = {} as any;
  (seedEvents as any[])
    .map((s) => {
      const startsMs = Number.isFinite(Date.parse(s.startsAt))
        ? Date.parse(s.startsAt)
        : 0;
      return {
        id: `demo:${seedIdFor(s)}`,
        organizerSlug: s.organizerSlug as string,
        title: s.title as string,
        description: s.description as string,
        startsMs,
      };
    })
    .sort((a, b) => a.startsMs - b.startsMs)
    .forEach((e) => {
      const slug = e.organizerSlug;
      if (!seedGroups[slug]) seedGroups[slug] = [] as any[];
      seedGroups[slug].push(e);
    });

  return (
    <Container>
      <Heading mb="3">🗓️ Calendars</Heading>
      {!packageId ? <Text>Missing package ID</Text> : null}
      {txsPending || objPending ? <Text>Loading...</Text> : null}
      {organizerKeys.length === 0 && !txsPending && !objPending ? null : null}
      <Flex direction="column" gap="3">
        {(organizerKeys.length > 0
          ? organizerKeys
          : Object.keys(seedGroups)
        ).map((org) => (
          <Box
            key={org}
            p="3"
            style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
          >
            <Heading size="4">
              {organizerKeys.length > 0
                ? `👤 Organizer ${org.slice(0, 8)}`
                : `👤 Organizer ${(organizers as any[]).find((o) => o.slug === org)?.name || org}`}
            </Heading>
            <Flex direction="column" gap="2" mt="2">
              {(organizerKeys.length > 0 ? grouped[org] : seedGroups[org]).map(
                (e) => (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Box
                      p="2"
                      style={{
                        border: "1px solid var(--gray-a4)",
                        borderRadius: 12,
                      }}
                    >
                      <Flex justify="between" align="center">
                        <Text>
                          {e.title ||
                            (typeof e.id === "string" ? e.id.slice(0, 8) : "")}
                        </Text>
                        <Text>{formatDate(e.startsMs)}</Text>
                      </Flex>
                      <Text>{e.description}</Text>
                    </Box>
                  </Link>
                ),
              )}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Container>
  );
}
