module mosaic::event {
    use sui::tx_context;
    use sui::object;

    struct Event has key {
        id: object::ID,
        organizer: address,
        title: vector<u8>,
        description: vector<u8>,
        starts_at_ms: u64,
        ends_at_ms: u64,
        reputation: u64,
    }

    public entry fun create(
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
}