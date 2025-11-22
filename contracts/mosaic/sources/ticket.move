module mosaic::ticket {
    use sui::tx_context;
    use sui::transfer;
    use sui::object;
    use mosaic::event;

    struct Ticket has key, store {
        id: object::ID,
        event_id: object::ID,
        organizer: address,
        holder: address,
        walrus_blob_id: vector<u8>,
        authenticity: vector<u8>,
    }

    public entry fun mint(
        e: &event::Event,
        walrus_blob_id: vector<u8>,
        authenticity: vector<u8>,
        to: address,
        ctx: &mut tx_context::TxContext
    ): Ticket {
        let id = object::new(ctx);
        let t = Ticket { id, event_id: e.id, organizer: e.organizer, holder: to, walrus_blob_id, authenticity };
        t
    }

    public entry fun transfer_ticket(t: Ticket, to: address) {
        transfer::transfer(t, to)
    }
}