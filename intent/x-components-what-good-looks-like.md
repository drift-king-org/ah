# x-components: what good looks like

Each line below is a check. Each check has a canary that must fail first, so it cannot pass by seeing nothing. A release ships only when every check passes on the exact bytes it ships.

1. The repository holds exactly the files the model lists, and the letter of intent as signed.

2. Every hash is of committed bytes, never of a checkout.

3. The tarball holds the package's files list, package.json, README and LICENSE, and nothing else.

4. package.json names @apricotter/x-components, Apache-2.0, the exact repository address, public access, its exports, and Node 22.14.0 or later.

5. Every action the release workflow runs is pinned to the commit its tag names. The workflow may write an identity token and read the repository, nothing more, and runs in the npm environment.

6. The model and the code name the same components.

7. The generated file is exactly what component.ttl generates.

8. The ontology loads by itself. It parses, every ARIA role it names resolves, and every ontology of ours it imports ships in the package. W3C standards are imported by their own names, for the consumer to vendor.

9. Nothing internal. No comment in the code, and nothing in the files, refers to another repository, file, page, product, person or dated history.

10. No site is a default. No brand, host or link is written in for a site that does not pass it.

11. A link needs the site's domain. Without it, the expander refuses.

12. No known defect ships unless it is a signed gap.

13. Every commit names the commit it was projected from.

What we do not do: we do not count a check as passed on anything but the bytes it ships.

Signed: Drift King Compliance
