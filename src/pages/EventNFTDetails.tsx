import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  Badge,
} from "@radix-ui/themes";
import { useParams } from "react-router-dom";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { readJsonFromWalrus, walrusBlobGatewayUrl } from "../mosaic/walrus";
import { useState, useEffect } from "react";

interface EventMetadata {
  title: string;
  description: string;
  location: string;
  category: string;
  tags: string[];
  external_url?: string;
  image_cid?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    display_type?: string;
  }>;
}

export function EventNFTDetails() {
  const { nftId } = useParams<{ nftId: string }>();
  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");
  const [metadata, setMetadata] = useState<EventMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const { data: nftData, isPending } = useSuiClientQuery(
    "getObject",
    {
      id: nftId!,
      options: { showType: true, showContent: true, showOwner: true },
    },
    { enabled: !!nftId && !!packageId },
  );

  useEffect(() => {
    const loadMetadata = async () => {
      if (!nftData?.data?.content) return;

      const content = nftData.data.content as any;
      const metadataBlobId = content.fields?.metadata_blob_id;

      if (metadataBlobId && metadataBlobId !== "None") {
        setLoadingMetadata(true);
        try {
          const blobId = metadataBlobId.replace(/^Some\("(.+)"\)$/, "$1");
          const metadataJson = await readJsonFromWalrus(blobId);
          setMetadata(metadataJson as EventMetadata);
        } catch (error) {
          console.error("Error loading metadata from Walrus:", error);
        } finally {
          setLoadingMetadata(false);
        }
      }
    };

    loadMetadata();
  }, [nftData]);

  if (isPending) {
    return (
      <Container>
        <Text>Loading NFT details...</Text>
      </Container>
    );
  }

  if (!nftData?.data?.content) {
    return (
      <Container>
        <Text>Event NFT not found</Text>
      </Container>
    );
  }

  const content = nftData.data.content as any;
  const fields = content.fields;

  return (
    <Container>
      <Heading mb="4">🎨 Event NFT Details</Heading>

      <Card>
        <Flex direction="column" gap="3">
          <Box>
            <Heading size="4">{fields.name}</Heading>
            <Text size="2" color="gray">
              ID: {nftId?.slice(0, 8)}...{nftId?.slice(-8)}
            </Text>
          </Box>

          <Box>
            <Text size="2" weight="bold">
              Description:
            </Text>
            <Text>{fields.description}</Text>
          </Box>

          <Box>
            <Text size="2" weight="bold">
              Organizer:
            </Text>
            <Text size="2" style={{ fontFamily: "monospace" }}>
              {fields.organizer}
            </Text>
          </Box>

          <Box>
            <Text size="2" weight="bold">
              Created:
            </Text>
            <Text size="2">
              {new Date(parseInt(fields.created_at) * 1000).toLocaleString()}
            </Text>
          </Box>

          {fields.metadata_blob_id && fields.metadata_blob_id !== "None" && (
            <Box>
              <Text size="2" weight="bold">
                Metadata Storage:
              </Text>
              <Badge color="blue">Walrus</Badge>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {fields.metadata_blob_id.replace(/^Some\("(.+)"\)$/, "$1")}
              </Text>
            </Box>
          )}

          {loadingMetadata && (
            <Box>
              <Text size="2">Loading metadata from Walrus...</Text>
            </Box>
          )}

          {metadata && (
            <Box>
              <Heading size="3" mb="2">
                📋 Event Information
              </Heading>

              <Box mb="2">
                <Text size="2" weight="bold">
                  Title:
                </Text>
                <Text>{metadata.title}</Text>
              </Box>

              <Box mb="2">
                <Text size="2" weight="bold">
                  Location:
                </Text>
                <Text>{metadata.location}</Text>
              </Box>

              <Box mb="2">
                <Text size="2" weight="bold">
                  Category:
                </Text>
                <Badge>{metadata.category}</Badge>
              </Box>

              {metadata.tags.length > 0 && (
                <Box mb="2">
                  <Text size="2" weight="bold">
                    Tags:
                  </Text>
                  <Flex gap="1" wrap="wrap">
                    {metadata.tags.map((tag, index) => (
                      <Badge key={index} size="1">
                        {tag}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}

              {metadata.attributes.length > 0 && (
                <Box mb="2">
                  <Text size="2" weight="bold">
                    Attributes:
                  </Text>
                  {metadata.attributes.map((attr, index) => (
                    <Box key={index} mt="1">
                      <Text size="1" weight="bold">
                        {attr.trait_type}:
                      </Text>
                      <Text size="1">{attr.value}</Text>
                    </Box>
                  ))}
                </Box>
              )}

              {metadata.external_url && (
                <Box>
                  <Button
                    size="1"
                    variant="soft"
                    onClick={() => window.open(metadata.external_url, "_blank")}
                  >
                    Visit Event Website
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {fields.image_url && (
            <Box>
              <Text size="2" weight="bold">
                Image URL:
              </Text>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {fields.image_url}
              </Text>
            </Box>
          )}
        </Flex>
      </Card>

      <Box mt="4">
        <Heading size="3" mb="2">
          🔗 Quick Actions
        </Heading>
        <Flex gap="2">
          <Button
            variant="soft"
            onClick={() => {
              const url = `https://suiexplorer.com/object/${nftId}?network=testnet`;
              window.open(url, "_blank");
            }}
          >
            View on Explorer
          </Button>

          {fields.metadata_blob_id && fields.metadata_blob_id !== "None" && (
            <Button
              variant="soft"
              onClick={() => {
                const blobId = fields.metadata_blob_id.replace(
                  /^Some\("(.+)"\)$/,
                  "$1",
                );
                const url = walrusBlobGatewayUrl(blobId);
                window.open(url, "_blank");
              }}
            >
              View Metadata
            </Button>
          )}
        </Flex>
      </Box>
    </Container>
  );
}
