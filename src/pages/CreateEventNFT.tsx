import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  TextField,
  TextArea,
  Select,
} from "@radix-ui/themes";
import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { writeJsonToWalrus, writeFileToWalrus } from "../mosaic/walrus";
import { getWalrusKeypair } from "../mosaic/walrus-config";

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

interface EventFormData {
  name: string;
  description: string;
  title: string;
  location: string;
  category: string;
  tags: string;
  externalUrl: string;
  imageFile?: File;
  startsAt: string;
  endsAt: string;
}

export function CreateEventNFT() {
  const [isCreating, setIsCreating] = useState(false);
  const [lastTxDigest, setLastTxDigest] = useState<string | null>(null);
  const [metadataBlobId, setMetadataBlobId] = useState<string | null>(null);

  const packageId = useNetworkVariable("MOSAIC_PACKAGE_ID");
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    title: "",
    location: "",
    category: "conference",
    tags: "",
    externalUrl: "",
    startsAt: "",
    endsAt: "",
  });

  const handleInputChange = (
    field: keyof EventFormData,
    value: string | File,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const uploadImageToWalrus = async (file: File): Promise<string> => {
    try {
      // For testnet, we'll use a temporary keypair - in production, this should be the user's keypair
      const keypair = getWalrusKeypair();
      const blobId = await writeFileToWalrus(file, keypair);
      return blobId;
    } catch (error) {
      console.error("Error uploading image to Walrus:", error);
      throw error;
    }
  };

  const createEventMetadata = async (): Promise<EventMetadata> => {
    let imageCid = formData.imageFile
      ? await uploadImageToWalrus(formData.imageFile)
      : undefined;

    return {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      category: formData.category,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      external_url: formData.externalUrl || undefined,
      image_cid: imageCid,
      attributes: [
        {
          trait_type: "Start Time",
          value: new Date(formData.startsAt).toISOString(),
          display_type: "date",
        },
        {
          trait_type: "End Time",
          value: new Date(formData.endsAt).toISOString(),
          display_type: "date",
        },
        {
          trait_type: "Category",
          value: formData.category,
        },
        {
          trait_type: "Location",
          value: formData.location,
        },
      ],
    };
  };

  const handleCreateEvent = async () => {
    if (!packageId) {
      alert("Package ID not configured");
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Upload metadata to Walrus
      const metadata = await createEventMetadata();
      // For testnet, we'll use a temporary keypair - in production, this should be the user's keypair
      const keypair = getWalrusKeypair();
      const blobId = await writeJsonToWalrus(metadata, keypair);
      setMetadataBlobId(blobId);

      // Step 2: Create transaction for event and NFT
      const tx = new Transaction();

      // Create the base event
      const [event] = tx.moveCall({
        target: `${packageId}::event::create`,
        arguments: [
          tx.pure.address(currentAccount?.address || ""),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(formData.title)),
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(formData.description)),
          ),
          tx.pure.u64(new Date(formData.startsAt).getTime()),
          tx.pure.u64(new Date(formData.endsAt).getTime()),
        ],
      });

      // Create the Event NFT
      const [nft] = tx.moveCall({
        target: `${packageId}::event::create_event_nft`,
        arguments: [
          event,
          tx.pure.string(formData.name),
          tx.pure.string(formData.description),
          tx.pure.string(
            `https://walrus-testnet.walrus.space/v1/blob/${blobId}`,
          ), // Placeholder image URL
          tx.pure.option("string", blobId),
        ],
      });

      // Share the event object
      tx.moveCall({
        target: `${packageId}::event::share`,
        arguments: [event],
      });

      // Transfer NFT to creator
      tx.transferObjects([nft], currentAccount?.address || "");

      // Sign and execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
          chain: "sui:testnet",
        },
        {
          onSuccess: (result) => {
            setLastTxDigest(result.digest);
            alert(
              `Event NFT created successfully! Transaction: ${result.digest}`,
            );
          },
          onError: (error) => {
            console.error("Error creating event NFT:", error);
            alert("Error creating event NFT. Check console for details.");
          },
        },
      );
    } catch (error) {
      console.error("Error in event creation:", error);
      alert("Error creating event. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Container>
      <Heading mb="3">🎨 Create Dynamic Event NFT</Heading>

      <Flex direction="column" gap="3">
        <TextField.Root
          placeholder="Event Name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
        />

        <TextArea
          placeholder="Event Description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
        />

        <TextField.Root
          placeholder="Event Title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
        />

        <TextField.Root
          placeholder="Location"
          value={formData.location}
          onChange={(e) => handleInputChange("location", e.target.value)}
        />

        <Select.Root
          value={formData.category}
          onValueChange={(value) => handleInputChange("category", value)}
        >
          <Select.Trigger placeholder="Select category" />
          <Select.Content>
            <Select.Item value="conference">Conference</Select.Item>
            <Select.Item value="workshop">Workshop</Select.Item>
            <Select.Item value="meetup">Meetup</Select.Item>
            <Select.Item value="concert">Concert</Select.Item>
            <Select.Item value="exhibition">Exhibition</Select.Item>
            <Select.Item value="other">Other</Select.Item>
          </Select.Content>
        </Select.Root>

        <TextField.Root
          placeholder="Tags (comma separated)"
          value={formData.tags}
          onChange={(e) => handleInputChange("tags", e.target.value)}
        />

        <TextField.Root
          placeholder="External URL (optional)"
          value={formData.externalUrl}
          onChange={(e) => handleInputChange("externalUrl", e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleInputChange("imageFile", file);
          }}
        />

        <TextField.Root
          type="datetime-local"
          placeholder="Start Time"
          value={formData.startsAt}
          onChange={(e) => handleInputChange("startsAt", e.target.value)}
        />

        <TextField.Root
          type="datetime-local"
          placeholder="End Time"
          value={formData.endsAt}
          onChange={(e) => handleInputChange("endsAt", e.target.value)}
        />

        <Button
          onClick={handleCreateEvent}
          disabled={
            isCreating ||
            !formData.name ||
            !formData.description ||
            !formData.startsAt ||
            !formData.endsAt
          }
        >
          {isCreating ? "Creating..." : "Create Event NFT"}
        </Button>

        {metadataBlobId && (
          <Box
            p="3"
            style={{ border: "1px solid var(--gray-a4)", borderRadius: 8 }}
          >
            <Text size="2">Metadata uploaded to Walrus:</Text>
            <Text size="1" style={{ fontFamily: "monospace" }}>
              {metadataBlobId}
            </Text>
          </Box>
        )}

        {lastTxDigest && (
          <Box
            p="3"
            style={{ border: "1px solid var(--gray-a4)", borderRadius: 8 }}
          >
            <Text size="2">Transaction successful:</Text>
            <Text size="1" style={{ fontFamily: "monospace" }}>
              {lastTxDigest}
            </Text>
          </Box>
        )}
      </Flex>
    </Container>
  );
}
