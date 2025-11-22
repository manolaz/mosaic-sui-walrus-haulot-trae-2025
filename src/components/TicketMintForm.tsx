import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Box, Button, Flex } from "@radix-ui/themes";
import { useState, type ChangeEvent } from "react";
import type { MosaicEvent, Ticket } from "../mosaic/types";
import { useNetworkVariable } from "../networkConfig";
import { Transaction } from "@mysten/sui/transactions";
import { isValidRange, parseLocalDateTime } from "../utils/date";

type Props = {
  onCreate: (event: MosaicEvent, ticket: Ticket) => void;
};

export function TicketMintForm({ onCreate }: Props) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tracksCsv, setTracksCsv] = useState("");
  const [tiersCsv, setTiersCsv] = useState("");
  const [attendeeTypesCsv, setAttendeeTypesCsv] = useState("");
  const [tier, setTier] = useState("");
  const [track, setTrack] = useState("");
  const [attendeeType, setAttendeeType] = useState("");
  const [profileOptIn, setProfileOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  async function handleSubmit() {
    if (!account || !packageId) return;
    setBusy(true);
    setTxDigest(null);
    try {
      const startsMs = parseLocalDateTime(startsAt);
      const endsMs = parseLocalDateTime(endsAt);
      const enc = new TextEncoder();
      const titleBytes = Array.from(enc.encode(title));
      const descriptionBytes = Array.from(enc.encode(description));
      const walrusBlobId = [] as number[];
      const authenticity = Array.from(new TextEncoder().encode(account.address));

      const tx = new Transaction();
      const eventObj = tx.moveCall({
        target: `${packageId}::event::create`,
        arguments: [
          tx.pure.address(account.address),
          tx.pure("vector<u8>", titleBytes),
          tx.pure("vector<u8>", descriptionBytes),
          tx.pure.u64(BigInt(startsMs)),
          tx.pure.u64(BigInt(endsMs)),
        ],
      });

      const mintedTicket = tx.moveCall({
        target: `${packageId}::ticket::mint`,
        arguments: [
          eventObj,
          tx.pure("vector<u8>", walrusBlobId),
          tx.pure("vector<u8>", authenticity),
          tx.pure.address(account.address),
        ],
      });

      tx.moveCall({
        target: `${packageId}::ticket::transfer_ticket`,
        arguments: [mintedTicket, tx.pure.address(account.address)],
      });

      const res = await signAndExecute({ transaction: tx });
      setTxDigest(res.digest);

      const created = (res.effects as any)?.created ?? [];
      const eventCreated = created.find(
        (c: any) =>
          c.owner?.ObjectOwner === account.address &&
          c.reference?.type?.includes("::event::Event"),
      );
      const ticketCreated = created.find(
        (c: any) =>
          c.owner?.AddressOwner === account.address ||
          c.reference?.type?.includes("::ticket::Ticket"),
      );
      const eventId = eventCreated?.reference?.objectId || crypto.randomUUID();
      const ticketId =
        ticketCreated?.reference?.objectId || crypto.randomUUID();

      const event: MosaicEvent = {
        id: eventId,
        organizer: account.address,
        title,
        description,
        startsAt,
        endsAt,
        reputationScore: 0,
        tracks: tracksCsv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        tiers: tiersCsv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        attendeeTypes: attendeeTypesCsv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      };
      const ticket: Ticket = {
        id: ticketId,
        eventId,
        organizer: account.address,
        holder: account.address,
        tier: tier || undefined,
        track: track || undefined,
        attendeeType: attendeeType || undefined,
        profileOptIn,
        checkInToken: crypto.randomUUID(),
      };
      onCreate(event, ticket);

      setTitle("");
      setDescription("");
      setStartsAt("");
      setEndsAt("");
      setTracksCsv("");
      setTiersCsv("");
      setAttendeeTypesCsv("");
      setTier("");
      setTrack("");
      setAttendeeType("");
      setProfileOptIn(false);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Flex gap="3" direction="column">
        <Flex direction="column" gap="1">
          <label>Event title</label>
          <input
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
          />
        </Flex>
        <Flex direction="column" gap="1">
          <label>Event description</label>
          <input
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDescription(e.target.value)
            }
          />
        </Flex>
        <Flex gap="3" align="center">
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <label>Starts at</label>
            <input
              type="datetime-local"
              value={startsAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setStartsAt(e.target.value)
              }
            />
          </Flex>
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <label>Ends at</label>
            <input
              type="datetime-local"
              value={endsAt}
              min={startsAt || new Date().toISOString().slice(0, 16)}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEndsAt(e.target.value)
              }
            />
          </Flex>
        </Flex>
        <input
          placeholder="Event tracks (comma-separated)"
          value={tracksCsv}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTracksCsv(e.target.value)
          }
        />
        <input
          placeholder="Event tiers (comma-separated)"
          value={tiersCsv}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTiersCsv(e.target.value)
          }
        />
        <input
          placeholder="Attendee types (comma-separated)"
          value={attendeeTypesCsv}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setAttendeeTypesCsv(e.target.value)
          }
        />
        <input
          placeholder="Ticket tier"
          value={tier}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTier(e.target.value)
          }
        />
        <input
          placeholder="Ticket track"
          value={track}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTrack(e.target.value)
          }
        />
        <input
          placeholder="Attendee type"
          value={attendeeType}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setAttendeeType(e.target.value)
          }
        />
        <Flex align="center" gap="2">
          <input
            type="checkbox"
            checked={profileOptIn}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setProfileOptIn(e.target.checked)
            }
          />
          <span>Opt-in to share profile for networking and follow-ups</span>
        </Flex>
        <Button
          onClick={handleSubmit}
          disabled={!account || busy || !startsAt || !endsAt || !isValidRange(startsAt, endsAt)}
        >
          Create Event and Mint Ticket
        </Button>
        {txDigest ? <span>Tx: {txDigest}</span> : null}
      </Flex>
    </Box>
  );
}
