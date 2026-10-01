# x-components: gap

The x-components letter says: "A release ships only when every check passes on the exact bytes it ships."
https://drift-king.org/intent/x-components-letter-of-intent#:~:text=A%20release%20ships%20only%20when%20every%20check%20passes%20on%20the%20exact%20bytes%20it%20ships.

We have seen that 0.2.0 runs more than the bytes it ships. It depends on cheerio at exactly 1.2.0, and cheerio depends on 22 more packages by version ranges. A site that installs x-components can receive newer versions of those 22 than the ones checked. The release's approval page lists the 23 that were checked, each with its integrity.

To close this, every package an install of x-components runs is either shipped in the release or pinned to the exact version that was checked. A canary with one dependency at a range must fail.

What we do not do: we do not call a version checked that nobody checked, and we do not hide which parts of a release float.

Signed: Drift King Compliance
