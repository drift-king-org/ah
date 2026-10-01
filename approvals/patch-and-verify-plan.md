# Drift King: patch-and-verify plan

Our signed intent says: "Nothing is built or run unless the model names it."
https://drift-king.org/intent/letter-of-intent#:~:text=Nothing%20is%20built%20or%20run%20unless%20the%20model%20names%20it.

A directive is how a change reaches this repository: a patch, the hash it must have, and the commit it applies to. How a directive is carried out was only ever written in chat. Now it is three plans in the model: one for a patch, one for checking a published package against what was signed, and one for a push or a tag.

Each plan is one chain of steps, and every step says what to do. The build checks that on every run, with a canary that forks and leaves a step blank. The skill that walks the plans holds no step of its own: it finds the plan that nothing replaces and walks it, as the signing skill does. The plans and the skill are published, and the build checks their hashes on every run.

Nothing in the plans pushes, tags, publishes or ships unless a directive says the lead architect OKs that one action.

What we do not do: we do not let a skill carry a step the model does not hold.

Signed: Drift King Compliance
