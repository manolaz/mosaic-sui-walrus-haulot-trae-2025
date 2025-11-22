import { Container, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useState } from "react";
import { writeJsonToWalrus } from "../mosaic/walrus";

export function Marketplace() {
  const account = useCurrentAccount();
  const { data: owned, isPending } = useSuiClientQuery(
    "getOwnedObjects",
    { owner: account?.address as string },
    { enabled: !!account }
  );
  const [sponsorBlob, setSponsorBlob] = useState("");
  const [loyaltyBlob, setLoyaltyBlob] = useState("");
  async function handleSponsorActivation() {
    if (!account || !owned || isPending) return;
    const payload = {
      organizer: account.address,
      timestamp: new Date().toISOString(),
      activation: "sponsor",
      attendees: (owned.data || []).map((o) => o.data?.objectId || ""),
    };
    const blobId = await writeJsonToWalrus(payload);
    setSponsorBlob(blobId);
  }
  async function handleLoyaltyDataset() {
    if (!account || !owned || isPending) return;
    const payload = {
      organizer: account.address,
      timestamp: new Date().toISOString(),
      program: "loyalty",
      points: (owned.data || []).map((o) => ({ objectId: o.data?.objectId || "", points: 1 })),
    };
    const blobId = await writeJsonToWalrus(payload);
    setLoyaltyBlob(blobId);
  }
  return (
    <Container>
      <Heading mb="3">🛍️ Marketplace</Heading>
      <Flex justify="center" my="4">
        <div className="logo-ring">
          <div className="logo-inner">
            <img className="logo-img" src="/images/MOSAIC.png" alt="Mosaic" />
          </div>
        </div>
      </Flex>
      <Flex direction="column" gap="2">
        <Text>🔎 Discover events and tickets</Text>
        <Heading size="4">🔗 Integrations</Heading>
        <Text>Use attendance data for sponsor activations and loyalty programs.</Text>
        <Flex gap="2" align="center">
          <Button onClick={handleSponsorActivation} disabled={!account || isPending}>🧩 Create Sponsor Activation Blob</Button>
          {sponsorBlob ? <Text>Blob: {sponsorBlob}</Text> : null}
        </Flex>
        <Flex gap="2" align="center">
          <Button onClick={handleLoyaltyDataset} disabled={!account || isPending}>💖 Create Loyalty Dataset Blob</Button>
          {loyaltyBlob ? <Text>Blob: {loyaltyBlob}</Text> : null}
        </Flex>
      </Flex>
    </Container>
  );
}
