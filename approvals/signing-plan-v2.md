# Drift King: signing plan, version 2

Our signed intent says: "Every change is signed and hashed."
https://drift-king.org/intent/letter-of-intent#:~:text=Every%20change%20is%20signed%20and%20hashed.

The signing plan says how every approval is signed and recorded. Version 1 is signed and stays exactly as it is. Version 2 is a new file that replaces it.

The site now waits for ready-to-deploy before it goes online, and documents are hosted at drift-king.org. For a client's work, the client's approver signs second. A signing is recorded in ah/signings.ttl, and when a gap is closed, the gap itself says so. Letters of intent live in intent/.

The skill that walks the plan finds the current plan by what the model says replaces what, so a new version needs no new skill. Both files are published, and the build checks their hashes on every run.

What we do not do: we do not edit a signed plan. A change is a new version, signed again.

Signed: Drift King Compliance
