import { Box, Container, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import { Link, useParams } from "react-router-dom";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import seedEvents from "../data/events.json";
import categories from "../data/categories.json";
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

function formatRange(a: number, b: number): string {
  const da = new Date(a);
  const db = new Date(b);
  const day = da.toLocaleDateString();
  const ta = da.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const tb = db.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day} ${ta}–${tb}`;
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

function hourLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit" });
}

function segmentOfHour(h: number): "Morning" | "Afternoon" | "Night" {
  if (h < 12 && h >= 6) return "Morning";
  if (h < 18 && h >= 12) return "Afternoon";
  return "Night";
}

function buildAgenda(startsMs: number, endsMs: number, seed: any | null) {
  const items: { time: number; title: string; segment: string }[] = [];
  const startHour = new Date(startsMs).getHours();
  const durationHours = Math.max(
    1,
    Math.ceil((endsMs - startsMs) / (60 * 60 * 1000)),
  );
  const pool = seed?.tracks?.length
    ? seed.tracks
    : [
        "Keynote",
        "Workshop",
        "Panel",
        "Break",
        "Networking",
        "Demos",
        "Lightning Talks",
      ];
  for (let i = 0; i < durationHours; i++) {
    const t = startsMs + i * 60 * 60 * 1000;
    const h = (startHour + i) % 24;
    const seg = segmentOfHour(h);
    const title = pool[i % pool.length] as string;
    items.push({ time: t, title, segment: seg });
  }
  const groups: Record<
    string,
    { label: string; items: { time: number; title: string }[] }
  > = {};
  items.forEach((it) => {
    const key = it.segment;
    if (!groups[key]) groups[key] = { label: key, items: [] };
    groups[key].items.push({ time: it.time, title: it.title });
  });
  const fullDay =
    durationHours >= 8
      ? [
          {
            label: "Full day",
            items: items.map((it) => ({ time: it.time, title: it.title })),
          },
        ]
      : [];
  const ordered = ["Morning", "Afternoon", "Night"]
    .filter((k) => groups[k])
    .map((k) => groups[k]);
  return [...fullDay, ...ordered];
}

export function EventDetails() {
  const { eventId } = useParams();
  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");
  const isDemo = typeof eventId === "string" && eventId.startsWith("demo:");
  const demoSlug = isDemo ? String(eventId).slice(5) : "";
  const seed = isDemo
    ? (seedEvents as any[]).find((e) => seedIdFor(e) === demoSlug)
    : null;
  const startsMsSeed = seed
    ? Number.isFinite(Date.parse(seed.startsAt))
      ? Date.parse(seed.startsAt)
      : 0
    : 0;
  const endsMsSeed = seed
    ? Number.isFinite(Date.parse(seed.endsAt))
      ? Date.parse(seed.endsAt)
      : 0
    : 0;
  const catNameSeed = seed
    ? ((categories as any[]).find((c) => c.slug === seed.categorySlug)?.name as
        | string
        | undefined)
    : undefined;
  const orgNameSeed = seed
    ? ((organizers as any[]).find((o) => o.slug === seed.organizerSlug)
        ?.name as string | undefined)
    : undefined;

  const { data: object, isPending } = useSuiClientQuery(
    "getObject",
    {
      id: isDemo ? "0x0" : (eventId as string),
      options: { showType: true, showContent: true, showOwner: true },
    },
    { enabled: !!packageId && !!eventId && !isDemo },
  );

  const fields = (object?.data?.content as any)?.fields as
    | RawFields
    | undefined;
  const startsMs = fields ? Number(fields.starts_at_ms) : startsMsSeed;
  const endsMs = fields ? Number(fields.ends_at_ms) : endsMsSeed;
  const title = fields ? decodeVecU8(fields.title) : seed?.title;
  const description = fields
    ? decodeVecU8(fields.description)
    : seed?.description;
  const organizer = fields ? (fields.organizer as string) : undefined;
  const catName = fields ? undefined : catNameSeed;
  const orgName = fields ? undefined : orgNameSeed;
  const agenda = buildAgenda(startsMs, endsMs, seed || null);

  return (
    <Container>
      <Flex align="center" justify="between" mb="3">
        <Heading>🎟️ {title}</Heading>
        <Link to="/events">
          <Text>Back</Text>
        </Link>
      </Flex>
      {isPending ? <Text>Loading...</Text> : null}
      <Box
        p="3"
        style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
      >
        <Text>{description}</Text>
        <Flex gap="2" mt="2" align="center">
          <Badge>{formatRange(startsMs, endsMs)}</Badge>
          {catName ? <Badge color="green">{catName}</Badge> : null}
          {orgName ? <Badge color="blue">{orgName}</Badge> : null}
          {organizer ? (
            <Badge color="blue">{organizer.slice(0, 8)}</Badge>
          ) : null}
        </Flex>
      </Box>
      <Heading mt="4" size="4">
        🕰️ Agenda
      </Heading>
      <Flex direction="column" gap="3" mt="2">
        {agenda.map((section, i) => (
          <Box
            key={`${section.label}-${i}`}
            p="3"
            style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
          >
            <Heading size="3">{section.label}</Heading>
            <Flex direction="column" gap="1" mt="2">
              {section.items.map((it, j) => (
                <Flex
                  key={`${i}-${j}`}
                  justify="between"
                  align="center"
                  style={{
                    padding: 8,
                    border: "1px solid var(--gray-a4)",
                    borderRadius: 12,
                  }}
                >
                  <Text>{hourLabel(it.time)}</Text>
                  <Text>{it.title}</Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Container>
  );
}
