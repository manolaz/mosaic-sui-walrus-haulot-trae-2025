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
    };
    const ticket: Ticket = {
      id: ticketId,
      eventId,
      organizer: account.address,
      holder: account.address,
    };
    onCreate(event, ticket);
    setTitle("");
    setDescription("");
    setStartsAt("");
    setEndsAt("");
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
        <Button onClick={handleSubmit} disabled={!account}>
          Create Event and Mint Ticket
        </Button>
      </Flex>
    </Box>
  );
}