import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Button, Flex } from "@radix-ui/themes";
import { useState, type ChangeEvent } from "react";
import type { MosaicEvent, Ticket } from "../mosaic/types";

type Props = {
  onCreate: (event: MosaicEvent, ticket: Ticket) => void;
};

export function TicketMintForm({ onCreate }: Props) {
  const account = useCurrentAccount();
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

  function handleSubmit() {
    if (!account) return;
    const eventId = crypto.randomUUID();
    const ticketId = crypto.randomUUID();
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
  }

  return (
    <Box>
      <Flex gap="2" direction="column">
        <input
          placeholder="Event title"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />
        <input
          placeholder="Event description"
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
        />
        <input
          placeholder="Starts at (ISO)"
          value={startsAt}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setStartsAt(e.target.value)}
        />
        <input
          placeholder="Ends at (ISO)"
          value={endsAt}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEndsAt(e.target.value)}
        />
        <input
          placeholder="Event tracks (comma-separated)"
          value={tracksCsv}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTracksCsv(e.target.value)}
        />
        <input
          placeholder="Event tiers (comma-separated)"
          value={tiersCsv}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTiersCsv(e.target.value)}
        />
        <input
          placeholder="Attendee types (comma-separated)"
          value={attendeeTypesCsv}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAttendeeTypesCsv(e.target.value)}
        />
        <input
          placeholder="Ticket tier"
          value={tier}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTier(e.target.value)}
        />
        <input
          placeholder="Ticket track"
          value={track}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTrack(e.target.value)}
        />
        <input
          placeholder="Attendee type"
          value={attendeeType}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAttendeeType(e.target.value)}
        />
        <Flex align="center" gap="2">
          <input
            type="checkbox"
            checked={profileOptIn}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileOptIn(e.target.checked)}
          />
          <span>Opt-in to share profile for networking and follow-ups</span>
        </Flex>
        <Button onClick={handleSubmit} disabled={!account}>
          Create Event and Mint Ticket
        </Button>
      </Flex>
    </Box>
  );
}
