import {
  Box,
  Card,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
} from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";

interface EventNFTCardProps {
  nftId: string;
}

function EventNFTCard({ nftId }: EventNFTCardProps) {
  const { data: nftData, isPending } = useSuiClientQuery("getObject", {
    id: nftId,
    options: { showType: true, showContent: true },
  });

  if (isPending) {
    return (
      <Card>
        <Text size="2">Loading NFT...</Text>
      </Card>
    );
  }

  if (!nftData?.data?.content) {
    return null;
  }

  const content = nftData.data.content as any;
  const fields = content.fields;

  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Heading size="3">{fields.name}</Heading>
          <Badge color="purple">NFT</Badge>
        </Flex>

        <Text size="2" color="gray">
          {fields.description}
        </Text>

        <Box>
          <Text size="1" weight="bold">
            Organizer:
          </Text>
          <Text size="1" style={{ fontFamily: "monospace" }}>
            {fields.organizer.slice(0, 8)}...{fields.organizer.slice(-8)}
          </Text>
        </Box>

        {fields.metadata_blob_id && fields.metadata_blob_id !== "None" && (
          <Badge color="blue">Dynamic Metadata</Badge>
        )}

        <Link to={`/event-nft/${nftId}`}>
          <Button size="1" variant="soft">
            View Details
          </Button>
        </Link>
      </Flex>
    </Card>
  );
}

export function EventNFTs() {
  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");

  const { data: txs, isPending: txsPending } = useSuiClientQuery(
    "queryTransactionBlocks",
    {
      filter: {
        MoveFunction: {
          package: packageId as string,
          module: "event",
          function: "create_event_nft",
        },
      },
      limit: 50,
      order: "descending",
      options: { showEffects: true },
    },
    { enabled: !!packageId },
  );

  const createdNFTIds: string[] = [];
  (txs?.data || []).forEach((tx: any) => {
    const created = tx.effects?.created || [];
    created.forEach((c: any) => {
      const type = c.reference?.type || "";
      if (typeof type === "string" && type.includes("::event::EventNFT")) {
        const id = c.reference?.objectId;
        if (id && !createdNFTIds.includes(id)) createdNFTIds.push(id);
      }
    });
  });

  if (txsPending) {
    return (
      <Container>
        <Heading size="4" mb="3">
          🎨 Dynamic Event NFTs
        </Heading>
        <Text>Loading NFTs...</Text>
      </Container>
    );
  }

  if (createdNFTIds.length === 0) {
    return (
      <Container>
        <Heading size="4" mb="3">
          🎨 Dynamic Event NFTs
        </Heading>
        <Text color="gray">
          No Event NFTs found. Create one to get started!
        </Text>
      </Container>
    );
  }

  return (
    <Container>
      <Heading size="4" mb="3">
        🎨 Dynamic Event NFTs
      </Heading>
      <Flex direction="column" gap="3">
        {createdNFTIds.map((nftId) => (
          <EventNFTCard key={nftId} nftId={nftId} />
        ))}
      </Flex>
    </Container>
  );
}
