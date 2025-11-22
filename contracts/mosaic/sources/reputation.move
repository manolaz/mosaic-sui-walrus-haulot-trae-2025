module mosaic::reputation {
    use sui::tx_context;
    use sui::object;
    use sui::table;

    struct ReputationRegistry has key, store {
        id: object::UID,
        scores: table::Table<address, u64>,
    }

    public fun create_registry(ctx: &mut tx_context::TxContext): ReputationRegistry {
        let id = object::new(ctx);
        let scores = table::new<address, u64>(ctx);
        ReputationRegistry { id, scores }
    }

    public entry fun inc(reg: &mut ReputationRegistry, organizer: address, by: u64, _ctx: &mut tx_context::TxContext) {
        if (table::contains<address, u64>(&reg.scores, organizer)) {
            let v = table::borrow_mut<address, u64>(&mut reg.scores, organizer);
            *v = *v + by;
        } else {
            table::add<address, u64>(&mut reg.scores, organizer, by);
        }
    }

    public fun get(reg: &ReputationRegistry, organizer: address): u64 {
        if (table::contains<address, u64>(&reg.scores, organizer)) {
            *table::borrow<address, u64>(&reg.scores, organizer)
        } else { 0u64 }
    }
}
