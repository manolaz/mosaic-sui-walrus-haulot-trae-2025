import { Container, Flex, Heading, Text } from "@radix-ui/themes";

export function Marketplace() {
  return (
    <Container>
      <Heading mb="3">Marketplace</Heading>
      <Flex direction="column" gap="2">
        <Text>Discover events and tickets</Text>
      </Flex>
    </Container>
  );
}