import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Marketplace } from "./pages/Marketplace";
import { CreateEvent } from "./pages/CreateEvent";
import { MyTickets } from "./pages/MyTickets";
import { MOSAIC_TAGLINE } from "./mosaic/config";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Events } from "./pages/Events";
import { Calendars } from "./pages/Calendars";

function App() {
  const location = useLocation();
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
          <Link to="/">
            <Button variant={location.pathname === "/" ? "solid" : "soft"}>
              Marketplace
            </Button>
          </Link>
          <Link to="/events">
            <Button
              variant={location.pathname === "/events" ? "solid" : "soft"}
            >
              Events
            </Button>
          </Link>
          <Link to="/calendars">
            <Button
              variant={location.pathname === "/calendars" ? "solid" : "soft"}
            >
              Calendars
            </Button>
          </Link>
          <Link to="/create">
            <Button
              variant={location.pathname === "/create" ? "solid" : "soft"}
            >
              Create Event
            </Button>
          </Link>
          <Link to="/mine">
            <Button variant={location.pathname === "/mine" ? "solid" : "soft"}>
              My Tickets
            </Button>
          </Link>
          <ConnectButton />
        </Flex>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/events" element={<Events />} />
            <Route path="/calendars" element={<Calendars />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/mine" element={<MyTickets />} />
          </Routes>
        </Container>
      </Container>
    </>
  );
}

export default App;
