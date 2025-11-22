import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
} from "@radix-ui/themes";
import { Link, useParams } from "react-router-dom";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import seedEvents from "../data/events.json";
import categories from "../data/categories.json";
import organizers from "../data/organizers.json";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  writeJsonToWalrus,
  writeFileToWalrus,
  walrusBlobGatewayUrl,
} from "../mosaic/walrus";
import { getWalrusKeypair } from "../mosaic/walrus-config";
import { saveBlobId, loadBlobId } from "../mosaic/storage";
import { useState, useEffect } from "react";
import { formatRangeMs, formatTimeMs, parseLocalDateTime } from "../utils/date";
import { decodeVecU8 } from "../utils/sui";

type RawFields = {
  organizer: string;
  title: any;
  description: any;
  starts_at_ms: string | number;
  ends_at_ms: string | number;
};

function formatRange(a: number, b: number): string {
  return formatRangeMs(a, b);
}

function seedIdFor(e: any): string {
  const titleSlug = String(e.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const ts = parseLocalDateTime(e.startsAt);
  return `${titleSlug}-${ts}`;
}

function hourLabel(ms: number): string {
  return formatTimeMs(ms);
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
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
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

  const {
    data: object,
    isPending,
    error,
  } = useSuiClientQuery(
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
  const [busy, setBusy] = useState(false);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const imageUrl = isDemo ? (seed as any)?.imageUrl : undefined;
  const [eventImageUrl, setEventImageUrl] = useState<string>("");
  const [_eventImageBlobId, setEventImageBlobId] = useState<string>("");
  const [organizerImageUrl, setOrganizerImageUrl] = useState<string>("");
  const [_organizerBlobId, setOrganizerBlobId] = useState<string>("");
  const venue = isDemo ? (seed as any)?.venue : undefined;
  const city = isDemo ? (seed as any)?.city : undefined;
  const capacity = isDemo ? (seed as any)?.capacity : undefined;
  const tags: string[] = isDemo ? (seed as any)?.tags || [] : [];
  const tracks: string[] = isDemo ? (seed as any)?.tracks || [] : [];
  const tiers: string[] = isDemo ? (seed as any)?.tiers || [] : [];
  const attendeeTypes: string[] = isDemo
    ? (seed as any)?.attendeeTypes || []
    : [];

  const organizerInfo = isDemo
    ? (organizers as any[]).find((o) => o.slug === (seed as any)?.organizerSlug)
    : undefined;
  const organizerKey = isDemo ? (organizerInfo as any)?.slug : organizer || "";
  const goalText = isDemo
    ? `Connect developers in ${city || "the city"} with hands-on sessions and open collaboration across ${tracks.join(", ") || "tracks"}.`
    : undefined;
  const isSpecialTraeEvent = String(title || "").includes(
    "TRAE Meetup&Vibe Coding Experience@Vietnam",
  );

  const isFreeSeed =
    !!seed &&
    Array.isArray((seed as any).tiers) &&
    (seed as any).tiers.includes("Free");

  async function handleClaimFreeTicket() {
    if (!account || !packageId) return;
    setBusy(true);
    setTxDigest(null);
    setBlobId(null);
    try {
      const defaultImage = "/images/MOSAIC.png";
      const chosenImageUrl = (eventImageUrl ||
        imageUrl ||
        defaultImage) as string;
      let imageBlobId = _eventImageBlobId || "";
      let imageGatewayUrl = "";
      if (!imageBlobId) {
        try {
          const resp = await fetch(chosenImageUrl);
          const blob = await resp.blob();
          const name = chosenImageUrl.split("/").pop() || "ticket-image";
          const file = new File([blob], name, {
            type: blob.type || "application/octet-stream",
          });
          imageBlobId = await writeFileToWalrus(file, getWalrusKeypair());
          imageGatewayUrl = walrusBlobGatewayUrl(imageBlobId, "testnet");
        } catch {
          void 0;
        }
      } else {
        imageGatewayUrl = walrusBlobGatewayUrl(imageBlobId, "testnet");
      }
      const meta = {
        version: "1",
        type: "ticket",
        free: true,
        title: title || "",
        description: description || "",
        categorySlug: (seed as any)?.categorySlug,
        organizerSlug: (seed as any)?.organizerSlug,
        startsAt: new Date(startsMs).toISOString(),
        endsAt: new Date(endsMs).toISOString(),
        imageUrl: imageGatewayUrl || chosenImageUrl,
        imageBlobId: imageBlobId || undefined,
      };
      const walrusBlobId = await writeJsonToWalrus(meta, getWalrusKeypair());
      setBlobId(walrusBlobId);

      const enc = new TextEncoder();
      const blobBytes = Array.from(enc.encode(walrusBlobId));
      const authenticity = Array.from(enc.encode(account.address));

      const tx = new Transaction();
      const eventRef = isDemo
        ? tx.moveCall({
            target: `${packageId}::event::create`,
            arguments: [
              tx.pure.address(account.address),
              tx.pure("vector<u8>", Array.from(enc.encode(title || ""))),
              tx.pure("vector<u8>", Array.from(enc.encode(description || ""))),
              tx.pure.u64(BigInt(startsMs)),
              tx.pure.u64(BigInt(endsMs)),
            ],
          })
        : tx.object(eventId as string);

      const mintedTicket = tx.moveCall({
        target: `${packageId}::ticket::mint`,
        arguments: [
          eventRef,
          tx.pure("vector<u8>", blobBytes),
          tx.pure("vector<u8>", authenticity),
          tx.pure.address(account.address),
        ],
      });

      tx.moveCall({
        target: `${packageId}::ticket::transfer_ticket`,
        arguments: [mintedTicket, tx.pure.address(account.address)],
      });

      const res = await signAndExecute({ transaction: tx });
      setTxDigest((res as any)?.digest || null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (eventId && !isDemo) {
      const existing = loadBlobId("event", eventId);
      if (existing) {
        setEventImageBlobId(existing);
        setEventImageUrl(walrusBlobGatewayUrl(existing, "testnet"));
      }
    }
  }, [eventId, isDemo]);

  useEffect(() => {
    if (organizerKey) {
      const existing = loadBlobId("organizer", organizerKey);
      if (existing) {
        setOrganizerBlobId(existing);
        setOrganizerImageUrl(walrusBlobGatewayUrl(existing, "testnet"));
      }
    }
  }, [organizerKey]);

  async function handleEventImageSelected(file: File | null) {
    if (!file || !eventId) return;
    const bId = await writeFileToWalrus(file, getWalrusKeypair());
    setEventImageBlobId(bId);
    const url = walrusBlobGatewayUrl(bId, "testnet");
    setEventImageUrl(url);
    saveBlobId("event", eventId, bId);
  }

  async function handleOrganizerImageSelected(file: File | null) {
    if (!file || !organizerKey) return;
    const bId = await writeFileToWalrus(file, getWalrusKeypair());
    setOrganizerBlobId(bId);
    const url = walrusBlobGatewayUrl(bId, "testnet");
    setOrganizerImageUrl(url);
    saveBlobId("organizer", organizerKey, bId);
  }

  return (
    <Container>
      <Flex align="center" justify="between" mb="3">
        <Heading>{title}</Heading>
        <Link to="/events">
          <Text>Back</Text>
        </Link>
      </Flex>
      {error ? <Text color="red">Error loading event</Text> : null}
      {isPending ? <Text>Loading...</Text> : null}
      <Flex gap="4">
        <Box style={{ flex: 2 }}>
          {isDemo ? (
            <Box
              p="0"
              style={{
                overflow: "hidden",
                borderRadius: 20,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <img src={imageUrl} alt={title || "Event image"} />
            </Box>
          ) : null}
          {!isDemo && eventImageUrl ? (
            <Box
              p="0"
              style={{
                overflow: "hidden",
                borderRadius: 20,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <img src={eventImageUrl} alt={title || "Event image"} />
            </Box>
          ) : null}
          <Box
            mt="3"
            p="3"
            style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
          >
            <Flex gap="2" align="center" wrap="wrap">
              <Badge>{formatRange(startsMs, endsMs)}</Badge>
              {venue ? <Badge color="yellow">{venue}</Badge> : null}
              {city ? <Badge color="yellow">{city}</Badge> : null}
              {capacity ? (
                <Badge color="orange">Capacity {capacity}</Badge>
              ) : null}
              {catName ? <Badge color="green">{catName}</Badge> : null}
              {orgName ? <Badge color="blue">{orgName}</Badge> : null}
              {organizer ? (
                <Badge color="blue">{organizer.slice(0, 8)}</Badge>
              ) : null}
              {tiers?.length ? (
                <Badge color="purple">{tiers.join(" / ")}</Badge>
              ) : null}
            </Flex>
            <Flex gap="2" mt="2" wrap="wrap">
              {tags.map((t, i) => (
                <Badge key={`${t}-${i}`} variant="soft">
                  {t}
                </Badge>
              ))}
            </Flex>
          </Box>
          <Box
            mt="3"
            p="3"
            style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
          >
            <Heading size="4">About Event</Heading>
            <Text mt="2">{description}</Text>
            {!isDemo ? (
              <Box mt="3">
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload event image"
                  onChange={(e) =>
                    handleEventImageSelected(e.target.files?.[0] || null)
                  }
                />
              </Box>
            ) : null}
          </Box>
          {goalText ? (
            <Box
              mt="3"
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Heading size="4">Goal</Heading>
              <Text mt="2">{goalText}</Text>
            </Box>
          ) : null}
          {organizerInfo ? (
            <Box
              mt="3"
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Heading size="4">Organizer</Heading>
              {organizerImageUrl ? (
                <Box
                  mt="2"
                  p="0"
                  style={{
                    overflow: "hidden",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <img src={organizerImageUrl} alt="Organizer" />
                </Box>
              ) : null}
              <Text mt="2">{organizerInfo.name}</Text>
              {organizerInfo.website ? (
                <Text mt="1" size="2">
                  {organizerInfo.website}
                </Text>
              ) : null}
              {organizerInfo.twitter ? (
                <Text mt="1" size="2">
                  {organizerInfo.twitter}
                </Text>
              ) : null}
              <Box mt="3">
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload organizer image"
                  onChange={(e) =>
                    handleOrganizerImageSelected(e.target.files?.[0] || null)
                  }
                />
              </Box>
            </Box>
          ) : null}
          {isSpecialTraeEvent ? (
            <Box
              mt="3"
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Heading size="4">Rewards</Heading>
              <Text mt="2">Winner: 3,500,000 VND</Text>
              <Text mt="1">Runner Up (2): 1,800,000 VND each</Text>
              <Text mt="1">Second Runner Up (3): 1,000,000 VND each</Text>
            </Box>
          ) : null}
          {isSpecialTraeEvent ? (
            <Box
              mt="3"
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Heading size="4">Community</Heading>
              <Text mt="2">Reddit: https://www.reddit.com/r/Trae_ai/</Text>
              <Text mt="1">Discord: https://discord.gg/d8QBfGBWNF</Text>
            </Box>
          ) : null}
        </Box>
        <Box style={{ flex: 1 }}>
          <Box
            p="3"
            style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
          >
            {isDemo && isFreeSeed ? (
              <Button
                onClick={handleClaimFreeTicket}
                disabled={!account || !packageId || busy}
                variant="solid"
              >
                {busy ? "Claiming…" : "Claim free ticket"}
              </Button>
            ) : null}
            {txDigest ? (
              <Text mt="2" size="2">
                Tx: {txDigest}
              </Text>
            ) : null}
            {blobId ? (
              <Text mt="1" size="2">
                Walrus blob: {blobId}
              </Text>
            ) : null}
          </Box>
          <Heading mt="4" size="4">
            Agenda
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
          {tracks?.length ? (
            <Box
              mt="3"
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Heading size="3">Tracks</Heading>
              <Flex gap="2" mt="2" wrap="wrap">
                {tracks.map((t, i) => (
                  <Badge key={`${t}-${i}`} variant="soft">
                    {t}
                  </Badge>
                ))}
              </Flex>
            </Box>
          ) : null}
          {attendeeTypes?.length ? (
            <Box
              mt="3"
              p="3"
              style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
            >
              <Heading size="3">Attendee Types</Heading>
              <Flex gap="2" mt="2" wrap="wrap">
                {attendeeTypes.map((t, i) => (
                  <Badge key={`${t}-${i}`} variant="soft">
                    {t}
                  </Badge>
                ))}
              </Flex>
            </Box>
          ) : null}
        </Box>
      </Flex>
    </Container>
  );
}
