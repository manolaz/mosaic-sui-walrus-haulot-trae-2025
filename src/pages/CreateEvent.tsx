import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { TicketMintForm } from "../components/TicketMintForm";
import type { MosaicEvent, Ticket } from "../mosaic/types";
import { encryptJson, generateKey, exportKeyHex } from "../mosaic/encryption";

export function CreateEvent() {
  const [events, setEvents] = useState<MosaicEvent[]>([]);
  const [lastCipher, setLastCipher] = useState<string | null>(null);

  async function handleCreate(event: MosaicEvent, ticket: Ticket) {
    const key = await generateKey();
    const payload = {
      version: "1",
      eventId: event.id,
      ticketId: ticket.id,
      holder: ticket.holder,
      tier: ticket.tier,
      track: ticket.track,
      attendeeType: ticket.attendeeType,
    };
    const { ciphertext, iv } = await encryptJson(key, payload);
    const exported = await exportKeyHex(key);
    setEvents((prev) => [event, ...prev]);
    setLastCipher(`${ciphertext}:${iv}:${exported}`);
  }

  return (
    <Container>
      <Heading mb="3">Create Event</Heading>
      <TicketMintForm onCreate={handleCreate} />
      <Flex direction="column" mt="4" gap="2">
        {events.length === 0 ? (
          <Text>No events created</Text>
        ) : (
          <Heading size="4">Recent</Heading>
        )}
        {events.map((e) => (
          <Box key={e.id} p="3" style={{ border: "1px solid var(--gray-a4)", borderRadius: 8 }}>
            <Flex justify="between">
              <Heading size="3">{e.title}</Heading>
              <Text>{e.id.slice(0, 8)}</Text>
            </Flex>
            <Text>{e.description}</Text>
            {e.tracks && e.tracks.length > 0 ? (
              <Text>Tracks: {e.tracks.join(", ")}</Text>
            ) : null}
            {e.tiers && e.tiers.length > 0 ? (
              <Text>Tiers: {e.tiers.join(", ")}</Text>
            ) : null}
          </Box>
        ))}
        {lastCipher ? <Text>Encrypted payload: {lastCipher.slice(0, 32)}…</Text> : null}
      </Flex>
    </Container>
  );
}
