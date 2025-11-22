module mosaic::ticket {
    use sui::tx_context;
    use sui::transfer;
    use sui::object;
    use sui::coin;
    use sui::sui;
    use mosaic::event;
    use mosaic::policy;

    const EAUTH: u64 = 1;

    struct Ticket has key, store {
        id: object::UID,
        event_id: object::ID,
        organizer: address,
        holder: address,
        walrus_blob_id: vector<u8>,
        authenticity: vector<u8>,
    }

    public fun mint(
        e: &event::Event,
        walrus_blob_id: vector<u8>,
        authenticity: vector<u8>,
        to: address,
        ctx: &mut tx_context::TxContext
    ): Ticket {
        assert!(policy::seal_approve(authenticity, to), EAUTH);
        let id = object::new(ctx);
        let event_id = event::id(e);
        let organizer = event::organizer(e);
        let t = Ticket { id, event_id, organizer, holder: to, walrus_blob_id, authenticity };
        t
    }

    public fun transfer_ticket(t: Ticket, to: address) {
        let mut_t = t;
        mut_t.holder = to;
        transfer::transfer(mut_t, to)
    }

    public fun buy_ticket_with_sui(
        e: &event::Event,
        walrus_blob_id: vector<u8>,
        authenticity: vector<u8>,
        to: address,
        fee_recipient: address,
        payment: coin::Coin<sui::SUI>,
        ctx: &mut tx_context::TxContext
    ): Ticket {
        assert!(policy::seal_approve(authenticity, to), EAUTH);
        let organizer = event::organizer(e);
        let total = coin::value<sui::SUI>(&payment);
        let fee_amt = total / 100;
        if (fee_amt > 0) {
            let fee_coin = coin::split<sui::SUI>(&mut payment, fee_amt, ctx);
            transfer::public_transfer(fee_coin, fee_recipient);
        };
        transfer::public_transfer(payment, organizer);
        let id = object::new(ctx);
        let event_id = event::id(e);
        let t = Ticket { id, event_id, organizer, holder: to, walrus_blob_id, authenticity };
        t
    }
}
