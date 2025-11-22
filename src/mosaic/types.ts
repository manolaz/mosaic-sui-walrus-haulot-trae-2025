export type MosaicEvent = {
  id: string;
  organizer: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  reputationScore: number;
};

export type EncryptedTicketPayload = {
  version: string;
  eventId: string;
  ticketId: string;
  holder: string;
  blobId?: string;
  ciphertext?: string;
  iv?: string;
};

export type Ticket = {
  id: string;
  eventId: string;
  organizer: string;
  holder: string;
  walrusBlobId?: string;
  accessPolicyPackageId?: string;
};

export type SealKeyServer = {
  objectId: string;
  url: string;
};