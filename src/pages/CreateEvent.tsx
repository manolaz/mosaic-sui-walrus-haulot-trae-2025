import { memo, useMemo, type ComponentProps } from "react";
import { Container, Heading } from "@radix-ui/themes";
import { UnifiedEventForm } from "../components/UnifiedEventForm";

/**
 * CreateEvent page
 *
 * Responsibilities:
 * - Presents a focused page wrapper around `UnifiedEventForm`.
 * - Defines and memoizes default form behavior for event creation.
 * - Uses small subcomponents and a tiny hook to keep the page self‑contained and testable.
 */
function PageHeader() {
  return <Heading mb="3">✏️ Create Event</Heading>;
}

/**
 * Returns the default configuration used by the Create Event page.
 * Extracted as a hook to centralize defaults and enable future extension
 * (e.g., reading from query params or feature flags) without touching the page tree.
 */
function useCreateEventDefaults(): Pick<
  ComponentProps<typeof UnifiedEventForm>,
  "defaultMintTicket" | "defaultCreateNFT"
> {
  return {
    defaultMintTicket: true,
    defaultCreateNFT: false,
  };
}

export const CreateEvent = memo(function CreateEvent() {
  const defaults = useCreateEventDefaults();
  const formProps = useMemo(() => defaults, [defaults]);

  return (
    <Container>
      <PageHeader />
      <UnifiedEventForm {...formProps} />
    </Container>
  );
});
