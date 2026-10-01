// Canary: one string nobody named. code-strings-named must catch it, here.
// The second line is its own canary: a colon plus a space makes IRI(?value)
// fail in the check's address test, which must not let the string through.
// The third is an argument to format!, which is its own string, not part of
// the format string.
fn canary() {
    let _x = "not a named thing";
    let _y = "canary: a colon and spaces {x}";
    let _z = format!("{}", "not named either");
}
