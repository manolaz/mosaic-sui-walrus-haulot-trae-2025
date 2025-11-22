# Event NFT Creation Workflow with Walrus Testnet

This implementation adds dynamic NFT functionality to the Mosaic event platform, allowing event organizers to create dynamic Event NFTs with metadata stored on Walrus testnet.

## Features

### 1. Dynamic Event NFT Contract (`contracts/mosaic/sources/event.move`)
- **EventNFT**: A dynamic NFT representing events with mutable metadata
- **Walrus Integration**: Store event metadata off-chain on Walrus decentralized storage
- **Dynamic Updates**: Event organizers can update metadata without changing the NFT
- **Transferable**: NFTs can be transferred between users

### 2. Enhanced Walrus Integration (`src/mosaic/walrus.ts`)
- **Testnet Configuration**: Pre-configured for Walrus testnet
- **Upload Relay**: Uses Mysten Labs' upload relay service
- **Blob Management**: Create, read, and manage data blobs
- **Gateway URLs**: Generate accessible URLs for stored content

### 3. Event Creation Workflow (`src/pages/CreateEventNFT.tsx`)
- **Rich Metadata**: Support for titles, descriptions, locations, categories, tags
- **Image Upload**: Upload event images to Walrus
- **Dynamic Attributes**: Time-based and categorical attributes
- **Batch Operations**: Create event and NFT in single transaction

### 4. NFT Management (`src/pages/EventNFTDetails.tsx`)
- **Metadata Display**: Show event information from Walrus
- **Attribute Viewing**: Display dynamic attributes
- **External Links**: Link to event websites
- **Explorer Integration**: View on Sui Explorer

### 5. NFT Discovery (`src/components/EventNFTs.tsx`)
- **NFT Listing**: Browse all created Event NFTs
- **Search & Filter**: Find specific event NFTs
- **Quick Actions**: Direct links to details and metadata

## Usage

### Creating an Event NFT

1. Navigate to "🎨 Create NFT Event" in the navigation
2. Fill in the event details:
   - Event name and description
   - Title and location
   - Category and tags
   - External URL (optional)
   - Event image (optional)
   - Start and end times
3. Click "Create Event NFT"
4. The system will:
   - Upload metadata to Walrus testnet
   - Create the base event object
   - Mint the Event NFT
   - Link them together

### Viewing Event NFTs

1. Go to the Events page
2. Event NFTs are displayed alongside regular events
3. Click on an Event NFT to view detailed information
4. Access metadata stored on Walrus
5. View on Sui Explorer for transaction details

## Technical Implementation

### Move Contract Structure

```move
struct EventNFT has key, store {
    id: UID,
    event_id: ID,
    name: String,
    description: String,
    image_url: Url,
    metadata_blob_id: Option<String>, // Walrus blob ID
    organizer: address,
    created_at: u64,
    mutable_attributes: vector<u8>,
}
```

### Walrus Integration

```typescript
// Upload metadata to Walrus
const blobId = await writeJsonToWalrus(metadata, keypair);

// Read metadata from Walrus
const metadata = await readJsonFromWalrus(blobId);

// Generate gateway URLs
const url = walrusBlobGatewayUrl(blobId);
```

### Transaction Flow

1. **Metadata Upload**: Event metadata is uploaded to Walrus
2. **Event Creation**: Base event object is created on Sui
3. **NFT Minting**: EventNFT is minted and linked to the event
4. **Sharing**: Event object is shared for public access
5. **Transfer**: NFT is transferred to the creator

## Configuration

### Walrus Testnet Settings

```typescript
const WALRUS_TESTNET_CONFIG = {
  aggregator: 'https://aggregator.walrus-testnet.walrus.space',
  publisher: 'https://publisher.walrus-testnet.walrus.space',
  uploadRelay: 'https://upload-relay.testnet.walrus.space'
};
```

### Keypair Management

For testnet operations, temporary keypairs are generated. In production:
- Use the user's connected wallet keypair
- Implement secure key storage
- Consider key derivation from user wallets

## Benefits

### For Event Organizers
- **Dynamic Content**: Update event information without reminting
- **Rich Metadata**: Comprehensive event information storage
- **Decentralized Storage**: Content persists on Walrus
- **NFT Ownership**: Transferable and tradeable event tokens

### For Attendees
- **Collectible NFTs**: Unique event tokens as memorabilia
- **Verified Authenticity**: On-chain verification of event tokens
- **Transferable**: Trade or gift event NFTs
- **Rich Information**: Access detailed event metadata

### For the Platform
- **Scalable Storage**: Walrus handles large metadata efficiently
- **Cost Effective**: Off-chain storage reduces on-chain costs
- **Enhanced UX**: Rich event information and media
- **Future Extensibility**: Foundation for advanced NFT features

## Future Enhancements

1. **Ticket Integration**: Link NFTs to ticket purchases
2. **Event Updates**: Real-time metadata updates
3. **Social Features**: Event NFT sharing and discovery
4. **Analytics**: Event attendance and engagement metrics
5. **Cross-Chain**: Multi-chain event NFT support
6. **Marketplace**: Trade and sell event NFTs

## Testing

The implementation includes:
- TypeScript compilation checks
- ESLint validation
- Build verification
- Testnet deployment ready

To test the functionality:
1. Deploy the Move contract to Sui testnet
2. Configure the package ID in network config
3. Connect to Walrus testnet
4. Create test event NFTs
5. Verify metadata storage and retrieval

## Dependencies

- **@mysten/sui**: Sui blockchain interaction
- **@mysten/walrus**: Walrus storage integration
- **@mysten/dapp-kit**: Wallet connection and transactions
- **@radix-ui/themes**: UI components