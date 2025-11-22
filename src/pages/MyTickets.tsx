import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { OwnedObjects } from "../OwnedObjects";
import { importKeyHex, decryptJson } from "../mosaic/encryption";
import type { EncryptedTicketPayload } from "../mosaic/types";
import { useState, type ChangeEvent } from "react";

export function MyTickets() {
  const account = useCurrentAccount();
  const [cipher, setCipher] = useState("");
  const [iv, setIv] = useState("");
  const [keyHex, setKeyHex] = useState("");
  const [result, setResult] = useState<string>("");

  async function handleDecrypt() {
    try {
      const key = await importKeyHex(keyHex);
      const payload = await decryptJson<EncryptedTicketPayload>(key, cipher, iv);
      setResult(JSON.stringify(payload));
    } catch {
      setResult("Decryption failed");
    }
  }
  return (
    <Container>
      <Heading mb="3">My Tickets</Heading>
      {!account ? <Text>Connect your wallet</Text> : null}
      <OwnedObjects />
      <Box mt="4" p="3" style={{ border: "1px solid var(--gray-a4)", borderRadius: 8 }}>
        <Heading size="4">Open Encrypted Ticket</Heading>
        <Flex gap="2" direction="column" mt="2">
          <input placeholder="Ciphertext (hex)" value={cipher} onChange={(e: ChangeEvent<HTMLInputElement>) => setCipher(e.target.value)} />
          <input placeholder="IV (hex)" value={iv} onChange={(e: ChangeEvent<HTMLInputElement>) => setIv(e.target.value)} />
          <input placeholder="Key (hex)" value={keyHex} onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyHex(e.target.value)} />
          <Button onClick={handleDecrypt}>Decrypt</Button>
          {result ? <Text>{result}</Text> : null}
        </Flex>
      </Box>
    </Container>
  );
}