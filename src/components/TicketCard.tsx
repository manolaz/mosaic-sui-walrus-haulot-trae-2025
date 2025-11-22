import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import type { Ticket } from "../mosaic/types";

type Props = {
  ticket: Ticket;
  onOpen?: (ticket: Ticket) => void;
};

export function TicketCard({ ticket, onOpen }: Props) {
  return (
    <Box p="3" style={{ border: "1px solid var(--gray-a4)", borderRadius: 8 }}>
      <Flex justify="between" align="center">
        <Heading size="3">Ticket {ticket.id.slice(0, 8)}</Heading>
        <Text>Event {ticket.eventId.slice(0, 8)}</Text>
      </Flex>
      <Flex mt="2" align="center" justify="between">
        <Text>Holder {ticket.holder.slice(0, 8)}</Text>
        <Button onClick={() => onOpen?.(ticket)}>Open</Button>
      </Flex>
    </Box>
  );
}

