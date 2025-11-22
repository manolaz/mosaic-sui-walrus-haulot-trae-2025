module mosaic::event {
    use sui::tx_context;
    use sui::object;
    use sui::transfer;

    struct Event has key {
        id: object::UID,
        organizer: address,
        title: vector<u8>,
        description: vector<u8>,
        starts_at_ms: u64,
        ends_at_ms: u64,
        reputation: u64,
    }

    public fun create(
        organizer: address,
        title: vector<u8>,
        description: vector<u8>,
        starts_at_ms: u64,
        ends_at_ms: u64,
        ctx: &mut tx_context::TxContext
    ): Event {
        let id = object::new(ctx);
        Event { id, organizer, title, description, starts_at_ms, ends_at_ms, reputation: 0 }
    }

    public fun id(e: &Event): object::ID {
        object::uid_to_inner(&e.id)
    }

    public fun organizer(e: &Event): address {
        e.organizer
    }

    public fun share(e: Event) {
        transfer::share_object(e)
    }
}
