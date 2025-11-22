import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Heading,
  Select,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useState, type ChangeEvent } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import {
  writeJsonToWalrus,
  writeFileToWalrus,
  walrusBlobGatewayUrl,
} from "../mosaic/walrus";
import { getWalrusKeypair } from "../mosaic/walrus-config";
import {
  isValidRange,
  parseLocalDateTime,
  toIsoFromInput,
} from "../utils/date";
import categories from "../data/categories.json";

type Props = {
  defaultMintTicket?: boolean;
  defaultCreateNFT?: boolean;
};

export function UnifiedEventForm({
  defaultMintTicket = false,
  defaultCreateNFT = false,
}: Props) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>(categories[0]?.slug || "");
  const [tags, setTags] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [tracksCsv, setTracksCsv] = useState("");
  const [tiersCsv, setTiersCsv] = useState("");
  const [attendeeTypesCsv, setAttendeeTypesCsv] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [mintTicket, setMintTicket] = useState(defaultMintTicket);
  const [ticketTier, setTicketTier] = useState("");
  const [ticketTrack, setTicketTrack] = useState("");
  const [ticketAttendeeType, setTicketAttendeeType] = useState("");
  const [profileOptIn, setProfileOptIn] = useState(false);

  const [createNFT, setCreateNFT] = useState(defaultCreateNFT);
  const [nftName, setNftName] = useState("");
  const [nftImageFile, setNftImageFile] = useState<File | undefined>(undefined);
  const [externalUrl, setExternalUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [resultDigest, setResultDigest] = useState<string | null>(null);
  const [metadataBlobId, setMetadataBlobId] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  function handleFileSelect(f: File | undefined) {
    setNftImageFile(f);
  }

  async function handleSubmit() {
    if (!account || !packageId) return;
    setBusy(true);
    setResultDigest(null);
    setCreatedEventId(null);
    try {
      const startsMs = parseLocalDateTime(startsAt);
      const endsMs = parseLocalDateTime(endsAt);
      const enc = new TextEncoder();
      const tx = new Transaction();

      const eventRef = tx.moveCall({
        target: `${packageId}::event::create`,
        arguments: [
          tx.pure.address(account.address),
          tx.pure("vector<u8>", Array.from(enc.encode(title))),
          tx.pure("vector<u8>", Array.from(enc.encode(description))),
          tx.pure.u64(BigInt(startsMs)),
          tx.pure.u64(BigInt(endsMs)),
        ],
      });

      if (mintTicket) {
        const authenticity = Array.from(new TextEncoder().encode(account.address));
        const mintedTicket = tx.moveCall({
          target: `${packageId}::ticket::mint`,
          arguments: [
            eventRef,
            tx.pure("vector<u8>", [] as number[]),
            tx.pure("vector<u8>", authenticity),
            tx.pure.address(account.address),
          ],
        });
        tx.moveCall({
          target: `${packageId}::ticket::transfer_ticket`,
          arguments: [mintedTicket, tx.pure.address(account.address)],
        });
      }

      if (createNFT) {
        let imageBlobId = "";
        let imageUrl = "";
        if (nftImageFile) {
          try {
            const kp = getWalrusKeypair();
            imageBlobId = await writeFileToWalrus(nftImageFile, kp);
            imageUrl = walrusBlobGatewayUrl(imageBlobId, "testnet");
          } catch {
            imageBlobId = "";
            imageUrl = "";
          }
        }
        const meta = {
          title,
          description,
          location,
          category,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
          external_url: externalUrl || undefined,
          image_cid: imageBlobId || undefined,
          attributes: [
            {
              trait_type: "Start Time",
              value: toIsoFromInput(startsAt),
              display_type: "date",
            },
            {
              trait_type: "End Time",
              value: toIsoFromInput(endsAt),
              display_type: "date",
            },
            { trait_type: "Category", value: category },
            { trait_type: "Location", value: location },
          ],
        };
        let blobId = "";
        try {
          const kp = getWalrusKeypair();
          blobId = await writeJsonToWalrus(meta, kp);
        } catch {
          blobId = "";
        }
        setMetadataBlobId(blobId);
        const [nft] = tx.moveCall({
          target: `${packageId}::event::create_event_nft`,
          arguments: [
            eventRef,
            tx.pure.string(nftName || title),
            tx.pure.string(description),
            tx.pure.string(imageUrl),
            tx.pure.option("string", blobId),
          ],
        });
        tx.transferObjects([nft], account.address);
      }

      tx.moveCall({
        target: `${packageId}::event::share`,
        arguments: [eventRef],
      });

      const res = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });
      const digest = (res as any)?.digest as string | undefined;
      setResultDigest(digest || null);
      if (digest) {
        const details = await client.getTransactionBlock({
          digest,
          options: { showEffects: true },
        });
        const created = ((details as any)?.effects?.created || []).find(
          (c: any) =>
            typeof c?.reference?.type === "string" &&
            c.reference.type.includes("::event::Event"),
        );
        const eventId = created?.reference?.objectId || null;
        setCreatedEventId(eventId);
      }
    } finally {
      setBusy(false);
    }
  }

  const validDates = startsAt && endsAt && isValidRange(startsAt, endsAt);
  const canSubmit =
    !!account && !!packageId && !!title && !!description && validDates;

  return (
    <Card>
      <Flex direction="column" gap="3" p="3">
        <Heading size="4">Create Event</Heading>
        <Flex gap="3" direction="column">
          <TextField.Root
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Event title"
          />
          <TextArea
            rows={3}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Event description"
          />
          <Flex gap="3">
            <TextField.Root
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Event location"
            />
            <Select.Root value={category} onValueChange={(v) => setCategory(v)}>
              <Select.Trigger placeholder="Category" />
              <Select.Content>
                {categories.map((c) => (
                  <Select.Item key={c.slug} value={c.slug}>
                    {c.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          <TextField.Root
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            aria-label="Event tags"
          />
          <Flex gap="3">
            <TextField.Root
              type="datetime-local"
              placeholder="Start"
              value={startsAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setStartsAt(e.target.value)}
              aria-label="Start date and time"
            />
            <TextField.Root
              type="datetime-local"
              placeholder="End"
              value={endsAt}
              min={startsAt || new Date().toISOString().slice(0, 16)}
              onChange={(e) => setEndsAt(e.target.value)}
              aria-label="End date and time"
            />
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox
              checked={advancedOpen}
              onCheckedChange={(v) => setAdvancedOpen(Boolean(v))}
            />
            <Text>Advanced fields</Text>
          </Flex>
          {advancedOpen ? (
            <Flex direction="column" gap="2">
              <TextField.Root
                placeholder="Event tracks (comma-separated)"
                value={tracksCsv}
                onChange={(e) => setTracksCsv(e.target.value)}
                aria-label="Event tracks"
              />
              <TextField.Root
                placeholder="Event tiers (comma-separated)"
                value={tiersCsv}
                onChange={(e) => setTiersCsv(e.target.value)}
                aria-label="Event tiers"
              />
              <TextField.Root
                placeholder="Attendee types (comma-separated)"
                value={attendeeTypesCsv}
                onChange={(e) => setAttendeeTypesCsv(e.target.value)}
                aria-label="Attendee types"
              />
            </Flex>
          ) : null}
        </Flex>
        <Heading size="4">Optional Features</Heading>
        <Card>
          <Flex direction="column" gap="2" p="3">
            <Flex align="center" gap="2">
              <Checkbox
                checked={mintTicket}
                onCheckedChange={(v) => setMintTicket(Boolean(v))}
              />
              <Text>Mint ticket</Text>
            </Flex>
            {mintTicket ? (
              <Flex gap="2" direction="column">
                <TextField.Root
                  placeholder="Ticket tier"
                  value={ticketTier}
                  onChange={(e) => setTicketTier(e.target.value)}
                  aria-label="Ticket tier"
                />
                <TextField.Root
                  placeholder="Ticket track"
                  value={ticketTrack}
                  onChange={(e) => setTicketTrack(e.target.value)}
                  aria-label="Ticket track"
                />
                <TextField.Root
                  placeholder="Attendee type"
                  value={ticketAttendeeType}
                  onChange={(e) => setTicketAttendeeType(e.target.value)}
                  aria-label="Attendee type"
                />
                <Flex align="center" gap="2">
                  <Checkbox
                    checked={profileOptIn}
                    onCheckedChange={(v) => setProfileOptIn(Boolean(v))}
                  />
                  <Text>Opt-in to share profile</Text>
                </Flex>
              </Flex>
            ) : null}
            <Flex align="center" gap="2" mt="3">
              <Checkbox
                checked={createNFT}
                onCheckedChange={(v) => setCreateNFT(Boolean(v))}
              />
              <Text>Create event NFT</Text>
            </Flex>
            {createNFT ? (
              <Flex gap="2" direction="column">
                <TextField.Root
                  placeholder="NFT name"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  aria-label="NFT name"
                />
                <TextField.Root
                  placeholder="External URL"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  aria-label="External URL"
                />
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload NFT image"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleFileSelect(e.target.files?.[0] || undefined)
                  }
                />
              </Flex>
            ) : null}
          </Flex>
        </Card>
        <Flex gap="2" align="center" mt="3">
          <Button onClick={handleSubmit} disabled={!canSubmit || busy}>
            {busy ? "Creating..." : "Create"}
          </Button>
          {!account ? <Text size="2">Connect wallet</Text> : null}
          {!packageId ? <Text size="2">Missing package ID</Text> : null}
          {!validDates && startsAt && endsAt ? (
            <Text size="2">Invalid date range</Text>
          ) : null}
        </Flex>
        {metadataBlobId ? (
          <Box mt="2">
            <Text size="2" aria-live="polite">
              Metadata blob:
            </Text>
            <Text size="1" style={{ fontFamily: "monospace" }}>
              {metadataBlobId}
            </Text>
          </Box>
        ) : null}
        {createdEventId ? (
          <Box mt="2">
            <Text size="2" aria-live="polite">
              Event ID:
            </Text>
            <Text size="1" style={{ fontFamily: "monospace" }}>
              {createdEventId}
            </Text>
          </Box>
        ) : null}
        {resultDigest ? (
          <Box mt="2">
            <Text size="2" aria-live="polite">
              Tx:
            </Text>
            <Text size="1" style={{ fontFamily: "monospace" }}>
              {resultDigest}
            </Text>
          </Box>
        ) : null}
      </Flex>
    </Card>
  );
}
