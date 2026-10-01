# Drift King: gap

Our signed intent says: "Every change is signed and hashed."
https://drift-king.org/intent/letter-of-intent#:~:text=Every%20change%20is%20signed%20and%20hashed.

We have seen that a new file can reach the build without anyone signing it. The file-provenance check exists, but the builder does not run it, so a written file with no signing behind it passes every check. The 0.2.0 candidate's files, its lockfile and the home page's copy are in the build today, and none of them is signed.

To close this, the builder runs file-provenance on every build. Every file the build reads or publishes is either signed, a projection of something signed, or a pinned tool. A canary with one unsigned file must fail it.

What we do not do: we do not ship a file nobody signed, and we do not sign a file we have not hashed.

Signed: Drift King Compliance
