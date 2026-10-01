# Drift King: gap

Our signed intent says: "Nothing is built or run unless the model names it."
https://drift-king.org/intent/letter-of-intent#:~:text=Nothing%20is%20built%20or%20run%20unless%20the%20model%20names%20it.

So our code contains no string literals of its own. Every string comes from the model. The check the-linter/checks/code-strings-named.rq finds any that do not. It runs on every build, and its canaries must fail first, so it cannot pass by seeing nothing.

We have seen string literals in the code that do not reference the model. The check does not return 0.

pid1 does not ship until the check returns 0. That closes this gap.

What we do not do: we do not ship with a string the model does not name.

Signed: Drift King Compliance
