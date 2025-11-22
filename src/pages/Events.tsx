import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import seedEvents from "../data/events.json";
import categories from "../data/categories.json";
import organizers from "../data/organizers.json";
import { EventNFTs } from "../components/EventNFTs";

type RawFields = {
  organizer: string;
  title: any;
  description: any;
  starts_at_ms: string | number;
  ends_at_ms: string | number;
  reputation: string | number;
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

function formatTime(ms: number): string {
  const d = new Date(ms);
  const day = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day} ${time}`;
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

export function Events() {
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

  const createdIds: string[] = [];
  (txs?.data || []).forEach((tx: any) => {
    const created = tx.effects?.created || [];
    created.forEach((c: any) => {
      const type = c.reference?.type || "";
      if (typeof type === "string" && type.includes("::event::Event")) {
        const id = c.reference?.objectId;
        if (id && !createdIds.includes(id)) createdIds.push(id);
      }
    });
  });

  const { data: objects, isPending: objsPending } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: createdIds,
      options: { showType: true, showContent: true, showOwner: true },
    },
    { enabled: createdIds.length > 0 },
  );

  const events = (objects || [])
    .map((o: any) => {
      const fields = (o.data?.content as any)?.fields as RawFields | undefined;
      if (!fields) return null as any;
      const startsMs = Number(fields.starts_at_ms);
      const endsMs = Number(fields.ends_at_ms);
      const match = (seedEvents as any[]).find(
        (s) =>
          s.title === decodeVecU8(fields.title) &&
          Number.isFinite(Date.parse(s.startsAt)) &&
          Date.parse(s.startsAt) === startsMs,
      );
      const catSlug = match?.categorySlug as string | undefined;
      const catName = (categories as any[]).find((c) => c.slug === catSlug)
        ?.name as string | undefined;
      return {
        id: o.data?.objectId as string,
        organizer: fields.organizer as string,
        title: decodeVecU8(fields.title),
        description: decodeVecU8(fields.description),
        startsMs,
        endsMs,
        categoryName: catName,
      };
    })
    .filter(Boolean);

  const now = Date.now();
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

  const todayUpcoming = events
    .filter(
      (e) =>
        e.startsMs >= now && e.startsMs >= todayStart && e.startsMs <= todayEnd,
    )
    .sort((a, b) => a.startsMs - b.startsMs);

  const future = events
    .filter((e) => e.startsMs > todayEnd)
    .sort((a, b) => a.startsMs - b.startsMs);

  const seedObjs = (seedEvents as any[]).map((s) => {
    const startsMs = Number.isFinite(Date.parse(s.startsAt))
      ? Date.parse(s.startsAt)
      : 0;
    const endsMs = Number.isFinite(Date.parse(s.endsAt))
      ? Date.parse(s.endsAt)
      : 0;
    const catName = (categories as any[]).find((c) => c.slug === s.categorySlug)
      ?.name as string | undefined;
    const orgName = (organizers as any[]).find(
      (o) => o.slug === s.organizerSlug,
    )?.name as string | undefined;
    return {
      id: `demo:${seedIdFor(s)}`,
      organizerName: orgName,
      title: s.title as string,
      description: s.description as string,
      startsMs,
      endsMs,
      categoryName: catName,
    };
  });

  const seedTodayUpcoming = seedObjs
    .filter(
      (e) =>
        e.startsMs >= now && e.startsMs >= todayStart && e.startsMs <= todayEnd,
    )
    .sort((a, b) => a.startsMs - b.startsMs);

  const seedFuture = seedObjs
    .filter((e) => e.startsMs > todayEnd)
    .sort((a, b) => a.startsMs - b.startsMs);

  return (
    <Container>
      <Heading mb="3">🎉 Events</Heading>

      {/* Event NFTs Section */}
      <EventNFTs />

      {!packageId ? <Text>Missing package ID</Text> : null}
      {txsPending || objsPending ? <Text>Loading...</Text> : null}
      {!txsPending && events.length === 0 ? null : null}
      {(events.length > 0 ? todayUpcoming : seedTodayUpcoming).length > 0 ? (
        <Heading size="4">☀️ Today</Heading>
      ) : null}
      <Flex direction="column" gap="2" mt="2">
        {(events.length > 0 ? todayUpcoming : seedTodayUpcoming).map((e) => (
          <Link
            key={e.id}
            to={`/events/${e.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Box
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Flex justify="between" align="center">
                <Heading size="3">
                  {e.title ||
                    (typeof e.id === "string" ? e.id.slice(0, 8) : "")}
                </Heading>
                <Text>{formatTime(e.startsMs)}</Text>
              </Flex>
              <Text>{e.description}</Text>
              {e.categoryName ? <Text>Category {e.categoryName}</Text> : null}
              {"organizer" in e ? (
                <Text>Organizer {(e as any).organizer.slice(0, 8)}</Text>
              ) : e.organizerName ? (
                <Text>Organizer {e.organizerName}</Text>
              ) : null}
            </Box>
          </Link>
        ))}
      </Flex>
      {(events.length > 0 ? future : seedFuture).length > 0 ? (
        <Heading mt="4" size="4">
          🌈 Upcoming
        </Heading>
      ) : null}
      <Flex direction="column" gap="2" mt="2">
        {(events.length > 0 ? future : seedFuture).map((e) => (
          <Link
            key={e.id}
            to={`/events/${e.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Box
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Flex justify="between" align="center">
                <Heading size="3">
                  {e.title ||
                    (typeof e.id === "string" ? e.id.slice(0, 8) : "")}
                </Heading>
                <Text>{formatTime(e.startsMs)}</Text>
              </Flex>
              <Text>{e.description}</Text>
              {"organizer" in e ? (
                <Text>Organizer {(e as any).organizer.slice(0, 8)}</Text>
              ) : e.organizerName ? (
                <Text>Organizer {e.organizerName}</Text>
              ) : null}
            </Box>
          </Link>
        ))}
      </Flex>
    </Container>
  );
}
