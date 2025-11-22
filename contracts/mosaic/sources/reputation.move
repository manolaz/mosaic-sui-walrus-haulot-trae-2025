module mosaic::reputation {
    use sui::tx_context;
    use sui::object;
    use sui::bag;
    use mosaic::event;

    struct ReputationRegistry has key, store {
        id: object::ID,
        scores: bag::Bag,
    }

    public entry fun init(ctx: &mut tx_context::TxContext): ReputationRegistry {
        let id = object::new(ctx);
        let scores = bag::new();
        ReputationRegistry { id, scores }
    }

    public entry fun inc(reg: &mut ReputationRegistry, organizer: address, by: u64) {
        let k = to_bytes_address(organizer);
        let v = bag::borrow_mut_or_add(&mut reg.scores, k, 0u64);
        *v = *v + by;
    }

    public fun get(reg: &ReputationRegistry, organizer: address): u64 {
        let k = to_bytes_address(organizer);
        if (bag::contains(&reg.scores, k)) {
            *bag::borrow(&reg.scores, k)
        } else { 0u64 }
    }

    fun to_bytes_address(a: address): vector<u8> {
        let v = vector::empty<u8>();
        vector::push_back(&mut v, 0);
        v
    }
}