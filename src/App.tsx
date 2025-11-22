import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Marketplace } from "./pages/Marketplace";
import { CreateEvent } from "./pages/CreateEvent";
import { MyTickets } from "./pages/MyTickets";
import { MOSAIC_TAGLINE } from "./mosaic/config";
import { useState } from "react";

function App() {
  const [tab, setTab] = useState<"market" | "create" | "mine">("market");
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>Mosaic</Heading>
          <Text size="2">{MOSAIC_TAGLINE}</Text>
        </Box>

        <Flex align="center" gap="3">
          <Button variant={tab === "market" ? "solid" : "soft"} onClick={() => setTab("market")}>
            Marketplace
          </Button>
          <Button variant={tab === "create" ? "solid" : "soft"} onClick={() => setTab("create")}>
            Create Event
          </Button>
          <Button variant={tab === "mine" ? "solid" : "soft"} onClick={() => setTab("mine")}>
            My Tickets
          </Button>
          <ConnectButton />
        </Flex>
      </Flex>
      <Container>
        <Container mt="5" pt="2" px="4" style={{ background: "var(--gray-a2)", minHeight: 500 }}>
          {tab === "market" ? <Marketplace /> : null}
          {tab === "create" ? <CreateEvent /> : null}
          {tab === "mine" ? <MyTickets /> : null}
        </Container>
      </Container>
    </>
  );
}

export default App;
