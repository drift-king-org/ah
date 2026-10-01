// Canary: two named words joined by concat! into one unnamed string. Valid
// Rust, unlike the first version of this canary (str + str isn't).
fn canary() {
    let _x = concat!("name", "step");
}
