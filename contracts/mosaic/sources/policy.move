module mosaic::policy {
    use std::vector;

    public fun seal_approve(identity: vector<u8>, holder: address): bool {
        let ok = vector::length(&identity) > 0;
        if (ok) { true } else { false }
    }
}
