module mosaic::policy {
    use sui::object;
    use sui::tx_context;
    use sui::transfer;
    use mosaic::ticket;

    public fun seal_approve(identity: vector<u8>, holder: address): bool {
        let ok = vector::length(&identity) > 0;
        if (ok) { true } else { false }
    }
}