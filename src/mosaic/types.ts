export type MosaicEvent = {
  id: string;
  organizer: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  reputationScore: number;
  tracks?: string[];
  tiers?: string[];
  attendeeTypes?: string[];
};

export type EncryptedTicketPayload = {
  version: string;
  eventId: string;
  ticketId: string;
  holder: string;
  blobId?: string;
  ciphertext?: string;
  iv?: string;
  tier?: string;
  track?: string;
  attendeeType?: string;
};

export type Ticket = {
  id: string;
  eventId: string;
  organizer: string;
  holder: string;
  walrusBlobId?: string;
  accessPolicyPackageId?: string;
  tier?: string;
  track?: string;
  attendeeType?: string;
  checkedIn?: boolean;
  checkInToken?: string;
  profileOptIn?: boolean;
  profileBlobId?: string;
  reputationUrl?: string;
};

export type SealKeyServer = {
  objectId: string;
  url: string;
};

export type UserProfile = {
  displayName: string;
  bio?: string;
  email?: string;
  twitter?: string;
  website?: string;
  reputationUrl?: string;
  avatarBlobId?: string;
};
