import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { OwnedObjects } from "../OwnedObjects";
import { importKeyHex, decryptJson } from "../mosaic/encryption";
import type { EncryptedTicketPayload, UserProfile } from "../mosaic/types";
import { useState, useEffect, type ChangeEvent } from "react";
import {
  writeJsonToWalrus,
  writeFileToWalrus,
  walrusBlobGatewayUrl,
} from "../mosaic/walrus";
import { saveBlobId, loadBlobId } from "../mosaic/storage";

export function MyTickets() {
  const account = useCurrentAccount();
  const [cipher, setCipher] = useState("");
  const [iv, setIv] = useState("");
  const [keyHex, setKeyHex] = useState("");
  const [result, setResult] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [reputationUrl, setReputationUrl] = useState("");
  const [profileBlobId, setProfileBlobId] = useState<string>("");
  const [avatarBlobId, setAvatarBlobId] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    if (account?.address) {
      const existing = loadBlobId("profile", account.address);
      if (existing) {
        setAvatarBlobId(existing);
        setAvatarUrl(walrusBlobGatewayUrl(existing, "testnet"));
      }
    }
  }, [account?.address]);
  const [checkInToken, setCheckInToken] = useState<string>(crypto.randomUUID());
  const [checkedIn, setCheckedIn] = useState<boolean>(false);
  const qrData = account
    ? `mosaic:ticket:${account.address}:${checkInToken}`
    : "";
  const { data: owned, isPending: ownedPending } = useSuiClientQuery(
    "getOwnedObjects",
    { owner: account?.address as string },
    { enabled: !!account },
  );

  async function handleDecrypt() {
    try {
      const key = await importKeyHex(keyHex);
      const payload = await decryptJson<EncryptedTicketPayload>(
        key,
        cipher,
        iv,
      );
      setResult(JSON.stringify(payload));
    } catch {
      setResult("Decryption failed");
    }
  }
  async function handleSaveProfile() {
    if (!account) return;
    const profile: UserProfile = {
      displayName,
      bio,
      email,
      twitter,
      website,
      reputationUrl,
      avatarBlobId: avatarBlobId || undefined,
    };
    const blobId = await writeJsonToWalrus({
      wallet: account.address,
      profile,
    });
    setProfileBlobId(blobId);
  }
  async function handleAvatarSelected(file: File | null) {
    if (!file || !account) return;
    const blobId = await writeFileToWalrus(file, "testnet");
    setAvatarBlobId(blobId);
    const url = walrusBlobGatewayUrl(blobId, "testnet");
    setAvatarUrl(url);
    saveBlobId("profile", account.address, blobId);
  }
  async function handleExportAttendance() {
    if (!account || !owned || ownedPending) return;
    const dataset = {
      organizer: account.address,
      timestamp: new Date().toISOString(),
      checkedIn,
      objects: (owned.data || []).map((o) => o.data?.objectId || ""),
    };
    const blobId = await writeJsonToWalrus(dataset);
    setResult(`attendance:${blobId}`);
  }
  return (
    <Container>
      <Heading mb="3">🎫 My Tickets</Heading>
      {!account ? <Text>🔌 Connect your wallet</Text> : null}
      <OwnedObjects />
      <Box
        mt="4"
        p="3"
        style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
      >
        <Heading size="4">🔐 Open Encrypted Ticket</Heading>
        <Flex gap="2" direction="column" mt="2">
          <input
            placeholder="Ciphertext (hex)"
            value={cipher}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCipher(e.target.value)
            }
          />
          <input
            placeholder="IV (hex)"
            value={iv}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setIv(e.target.value)
            }
          />
          <input
            placeholder="Key (hex)"
            value={keyHex}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setKeyHex(e.target.value)
            }
          />
          <Button onClick={handleDecrypt}>Decrypt</Button>
          {result ? <Text>{result}</Text> : null}
        </Flex>
      </Box>
      <Box
        mt="4"
        p="3"
        style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
      >
        <Heading size="4">👤 Networking Profile</Heading>
        <Flex gap="2" direction="column" mt="2">
          {avatarUrl ? (
            <img
              alt="Avatar"
              src={avatarUrl}
              style={{
                width: 120,
                height: 120,
                borderRadius: 16,
                objectFit: "cover",
              }}
            />
          ) : null}
          <input
            type="file"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleAvatarSelected(e.target.files?.[0] || null)
            }
          />
          <input
            placeholder="Display name"
            value={displayName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDisplayName(e.target.value)
            }
          />
          <input
            placeholder="Bio"
            value={bio}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setBio(e.target.value)
            }
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
          />
          <input
            placeholder="Twitter"
            value={twitter}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTwitter(e.target.value)
            }
          />
          <input
            placeholder="Website"
            value={website}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setWebsite(e.target.value)
            }
          />
          <input
            placeholder="Reputation URL"
            value={reputationUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setReputationUrl(e.target.value)
            }
          />
          <Button onClick={handleSaveProfile} disabled={!account}>
            Save to Walrus
          </Button>
          {profileBlobId ? <Text>Profile blob: {profileBlobId}</Text> : null}
        </Flex>
      </Box>
      <Box
        mt="4"
        p="3"
        style={{ border: "1px solid var(--gray-a4)", borderRadius: 16 }}
      >
        <Heading size="4">🏷️ Badge and Check-in</Heading>
        <Flex gap="2" direction="column" mt="2">
          <input
            placeholder="Check-in token"
            value={checkInToken}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCheckInToken(e.target.value)
            }
          />
          {qrData ? (
            <img
              alt="QR"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
              style={{ width: 200, height: 200 }}
            />
          ) : null}
          <Flex align="center" gap="2">
            <input
              type="checkbox"
              checked={checkedIn}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCheckedIn(e.target.checked)
              }
            />
            <span>Checked in</span>
          </Flex>
          <Button onClick={() => window.print()}>Print Badge</Button>
          <Button
            onClick={handleExportAttendance}
            disabled={!account || ownedPending}
          >
            Export Attendance to Walrus
          </Button>
        </Flex>
      </Box>
    </Container>
  );
}
