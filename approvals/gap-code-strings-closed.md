# Drift King: gap closed

Our signed intent says: "Nothing is built or run unless the model names it."
https://drift-king.org/intent/letter-of-intent#:~:text=Nothing%20is%20built%20or%20run%20unless%20the%20model%20names%20it.

We signed a gap against that sentence. We had seen string literals in the code that the model does not name, and pid1 did not ship until the check returned 0.
https://drift-king.org/approvals/gap-code-strings

Before it could pass, the check was made to read what it had missed: template literals, and each argument of format! on its own. Its rules are the files the-linter/rules/strings-rust.yml and the-linter/rules/strings-js.yml.

The check the-linter/checks/code-strings-named.rq now returns 0 on all the code it reads. Its canary still fails first, so it cannot pass by seeing nothing. The build that ran it shipped pid1.

That closes the gap.

What we do not do: we do not reopen a closed gap. If the check fails again, that is a new gap, signed again.

Signed: Drift King Compliance
