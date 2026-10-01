// Canary: a bare string statement, a no-op like a docstring. Not code, not
// meant to compile as anything real -- ast-grep only parses it.
fn canary() {
    "a bare string statement, doing nothing";
}
