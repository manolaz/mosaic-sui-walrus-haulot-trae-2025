module mosaic::event {
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::url::{Self, Url};
    use sui::event as sui_event;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use std::vector;

    // Event NFT representing a dynamic event
    struct EventNFT has key, store {
        id: UID,
        event_id: ID,
        name: String,
        description: String,
        image_url: Url,
        metadata_blob_id: Option<String>, // Walrus blob ID for dynamic metadata
        organizer: address,
        created_at: u64,
        mutable_attributes: vector<u8>, // Encoded mutable attributes
    }

    // Event metadata stored in Walrus
    struct EventMetadata has drop, store, copy {
        title: String,
        description: String,
        location: String,
        category: String,
        tags: vector<String>,
        external_url: Option<String>,
        image_cid: Option<String>,
        attributes: vector<EventAttribute>,
    }

    struct EventAttribute has drop, store, copy {
        trait_type: String,
        value: String,
        display_type: Option<String>,
    }

    // Original Event struct for compatibility
    struct Event has key {
        id: UID,
        organizer: address,
        title: vector<u8>,
        description: vector<u8>,
        starts_at_ms: u64,
        ends_at_ms: u64,
        reputation: u64,
        nft_id: Option<ID>, // Link to EventNFT
    }

    // Events
    struct EventNFTMinted has copy, drop {
        event_id: ID,
        nft_id: ID,
        organizer: address,
    }

    struct EventMetadataUpdated has copy, drop {
        event_id: ID,
        nft_id: ID,
    }

    // Create original event (backward compatibility)
    public fun create(
        organizer: address,
        title: vector<u8>,
        description: vector<u8>,
        starts_at_ms: u64,
        ends_at_ms: u64,
        ctx: &mut TxContext
    ): Event {
        let id = object::new(ctx);
        Event { 
            id, 
            organizer, 
            title, 
            description, 
            starts_at_ms, 
            ends_at_ms, 
            reputation: 0,
            nft_id: option::none(),
        }
    }

    // Create dynamic Event NFT
    public fun create_event_nft(
        event: &mut Event,
        name: String,
        description: String,
        image_url: String,
        metadata_blob_id: Option<String>,
        ctx: &mut TxContext
    ): EventNFT {
        let event_id = object::uid_to_inner(&event.id);
        let nft_id = object::new(ctx);
        let nft = EventNFT {
            id: nft_id,
            event_id,
            name,
            description,
            image_url: url::new_unsafe_from_bytes(string::into_bytes(image_url)),
            metadata_blob_id,
            organizer: event.organizer,
            created_at: tx_context::epoch(ctx),
            mutable_attributes: vector::empty(),
        };
        
        // Link event to NFT
        event.nft_id = option::some(object::uid_to_inner(&nft.id));
        
        sui_event::emit(EventNFTMinted {
            event_id,
            nft_id: object::uid_to_inner(&nft.id),
            organizer: event.organizer,
        });
        
        nft
    }

    // Update event metadata (dynamic NFT functionality)
    public fun update_event_metadata(
        nft: &mut EventNFT,
        new_metadata_blob_id: String,
        ctx: &mut TxContext
    ) {
        assert!(nft.organizer == tx_context::sender(ctx), 0);
        nft.metadata_blob_id = option::some(new_metadata_blob_id);
        sui_event::emit(EventMetadataUpdated {
            event_id: nft.event_id,
            nft_id: object::uid_to_inner(&nft.id),
        });
    }

    // Update mutable attributes
    public fun update_mutable_attributes(
        nft: &mut EventNFT,
        attributes: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(nft.organizer == tx_context::sender(ctx), 0);
        nft.mutable_attributes = attributes;
    }

    // Getters
    public fun id(e: &Event): ID {
        object::uid_to_inner(&e.id)
    }

    public fun organizer(e: &Event): address {
        e.organizer
    }

    public fun nft_id(e: &Event): Option<ID> {
        e.nft_id
    }

    public fun event_id(nft: &EventNFT): ID {
        nft.event_id
    }

    public fun metadata_blob_id(nft: &EventNFT): Option<String> {
        nft.metadata_blob_id
    }

    public fun share(e: Event) {
        transfer::share_object(e)
    }

    public fun transfer_nft(nft: EventNFT, recipient: address) {
        transfer::public_transfer(nft, recipient)
    }
}
