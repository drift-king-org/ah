// Canary: a string nobody named, compared, not joined. code-strings-named
// must catch it: a literal on one side of === is its own string. The rule
// before strings-js-v2.yml skipped every literal inside a binary
// expression, so this one went unseen.
function canary(a) {
  return a === "not a named thing";
}
