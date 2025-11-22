import { memo, useMemo, type ComponentProps } from "react";
import { Container, Heading } from "@radix-ui/themes";
import { UnifiedEventForm } from "../components/UnifiedEventForm";

function PageHeader() {
  return <Heading mb="3">🎨 Create NFT Event</Heading>;
}

function useCreateNFTDefaults(): Pick<
  ComponentProps<typeof UnifiedEventForm>,
  "defaultMintTicket" | "defaultCreateNFT"
> {
  return {
    defaultMintTicket: false,
    defaultCreateNFT: true,
  };
}

export const CreateNFTEvent = memo(function CreateNFTEvent() {
  const defaults = useCreateNFTDefaults();
  const formProps = useMemo(() => defaults, [defaults]);

  return (
    <Container>
      <PageHeader />
      <UnifiedEventForm {...formProps} />
    </Container>
  );
});

