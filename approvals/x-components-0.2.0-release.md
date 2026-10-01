# x-components: release 0.2.0

The x-components letter says: "A release ships only when every check passes on the exact bytes it ships."
https://drift-king.org/intent/x-components-letter-of-intent#:~:text=A%20release%20ships%20only%20when%20every%20check%20passes%20on%20the%20exact%20bytes%20it%20ships.

The candidate is commit 6cf506e of the public x-components repository.

It adds the tape, the line panes, the sticker and the seal. Every word a component shows comes from the site, the classes each component emits are part of the contract, two escaping defects are fixed, and a static entry point expands a page with no Worker. That entry point brings the package's first dependency, cheerio at exactly 1.2.0.

This document's approval page lists the files npm will publish from that commit, the 23 packages the dependency brings, the checks Drift King ran on them and what each found, with the fingerprint of every file. One known gap ships with this release and is signed beside it: cheerio's own dependencies are not pinned.

This approves tagging v0.2.0 and a staged publish. It does not approve taking the version into Drift King: that is signed once the published tarball is checked against these files.

What we do not do: we do not count a check that has not run as passed.

Signed: Drift King Compliance
