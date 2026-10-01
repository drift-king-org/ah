// Canary: one string nobody named. code-strings-named must catch it, here.
function canary() {
  const x = "not a named thing";
  const y = `not named, as a template literal`;
}
