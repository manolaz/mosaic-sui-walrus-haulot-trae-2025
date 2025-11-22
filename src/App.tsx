import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Marketplace } from "./pages/Marketplace";
import { CreateEvent } from "./pages/CreateEvent";
import { MyTickets } from "./pages/MyTickets";
import { MOSAIC_TAGLINE } from "./mosaic/config";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Events } from "./pages/Events";
import { EventDetails } from "./pages/EventDetails";
import { Calendars } from "./pages/Calendars";
import { ImportData } from "./pages/ImportData";

function App() {
  const location = useLocation();
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="3"
        justify="between"
        style={{
          backgroundColor: "#14181f",
          borderBottom: "1px solid #2a2f38",
          borderRadius: 20,
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        }}
      >
        <Box>
          <Heading>🌈🧩 Mosaic</Heading>
          <Text size="2">✨ {MOSAIC_TAGLINE}</Text>
        </Box>

        <Flex align="center" gap="3">
          <Link to="/">
            <Button variant={location.pathname === "/" ? "solid" : "soft"}>
              🛍️ Marketplace
            </Button>
          </Link>
          <Link to="/events">
            <Button
              variant={location.pathname === "/events" ? "solid" : "soft"}
            >
              🎉 Events
            </Button>
          </Link>
          <Link to="/calendars">
            <Button
              variant={location.pathname === "/calendars" ? "solid" : "soft"}
            >
              🗓️ Calendars
            </Button>
          </Link>
          <Link to="/create">
            <Button
              variant={location.pathname === "/create" ? "solid" : "soft"}
            >
              ✏️ Create Event
            </Button>
          </Link>
          <Link to="/mine">
            <Button variant={location.pathname === "/mine" ? "solid" : "soft"}>
              🎫 My Tickets
            </Button>
          </Link>
          <Link to="/import">
            <Button
              variant={location.pathname === "/import" ? "solid" : "soft"}
            >
              📥 Import
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
          style={{
            backgroundColor: "#0f1115",
            minHeight: 500,
            borderRadius: 24,
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
          }}
        >
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<EventDetails />} />
            <Route path="/calendars" element={<Calendars />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/mine" element={<MyTickets />} />
            <Route path="/import" element={<ImportData />} />
          </Routes>
        </Container>
      </Container>
    </>
  );
}

export default App;
