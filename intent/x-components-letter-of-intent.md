# x-components: letter of intent

x-components is a set of HTML components and the code that expands them, published as @apricotter/x-components under Apache-2.0. Drift King uses it. Anyone may.

This letter sits under Drift King's letter of intent, https://drift-king.org/intent/letter-of-intent.md, and changes none of it.

Nothing in the repository is written by hand. Every file is projected from a commit of its source, and each release names the commits it came from.

What good looks like is a list of checks, each proven by a canary that must fail. A release ships only when every check passes on the exact bytes it ships. The list is https://drift-king.org/intent/x-components-what-good-looks-like.md.

The model ships with the code. component.ttl defines every component, and the package carries it. A site checks its pages against the same version it runs.

The package holds only what the model lists. If the tarball holds anything else, the release fails.

It is public, so it is clean. No internal hostnames, paths, names, emails, keys or tokens, and no site's name as a default. A check looks for them before anything is pushed.

Every release is signed and logged. npm provenance records the repository and commit that built it, in Sigstore's Rekor. After the first release, no token can publish. Each release comes from the repository's own workflow, staged, and a person approves it on npmjs.com.

Drift King pins one version. It takes no update it has not checked.

We keep it small: the components and the expander. No styling. Each site styles the class names itself.

What we do not do: we do not change a published version. A fix is a new version. We do not edit a signed intent. A new intent is a new letter, signed again.

Signed: Drift King Compliance
