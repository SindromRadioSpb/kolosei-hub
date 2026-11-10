# Production IndexNow delta notifications

This workflow notifies only new, substantively changed, or confirmed-deleted public canonical pages on `kolosei.com`. It does not submit application corpora, API, private pages, query URLs or lesson players. Existing public IndexNow key configuration is reused.

## Production guard

`.github/workflows/indexnow.yml` listens for completed Cloudflare Pages checks from the verified GitHub App (ID 85455). The helper queries GitHub again and requires the exact current `main` SHA, successful check, main check-suite branch and the known Cloudflare Pages project. Preview/old/foreign checks are rejected. It rebuilds that exact SHA, verifies the site, and requires live sitemap, robots and normalized public editorial content to match the build before notification. It rechecks main immediately before the send stage.

No account settings, new secret or token permissions are required: `contents`, `checks`, `actions` stay read-only. GitHub's built-in artifact upload mechanism holds state. Local scheduling is not used.

## Durable state and safety

Initial baseline was read from 42 live public pages on 2026-11-10. It records hashes, NOT notification or indexing claims. A one-time manual workflow dispatch with `bootstrap=true` seeds the reviewed baseline after the production check succeeds. Normal automatic runs never initialize missing state.

Each run restores the latest artifact from this workflow on main. Before any POST, it writes and uploads an immutable `indexnow-intent-*` artifact. The POST step only accepts the same run/attempt identity and exact prepared plan hash. It revalidates live content. Only HTTP 200 advances the manifest. Final state/receipt upload supersedes the intent by creation timestamp (IDs are not chronological); a same-second final artifact takes precedence only within the same run/attempt, and ambiguous cross-run ties fail closed. If the run crashes after POST or final upload fails, the durable unresolved intent blocks future sends instead of blindly duplicating them. `202` and uncertain transport outcomes also require manual review.

Artifacts expire after 90 days (or sooner if repository retention is reduced). After a sufficiently long idle period or manual deletion, the workflow stops safely and requires reviewed recovery. Do not resolve a pending submission by blindly removing pending.json or replaying it. Confirm the outcome, preserve the receipt and establish the appropriate manifest first. A complete loss of artifacts does not trigger automatic baseline reset.

HTTP 200 means notification received, not crawled/indexed/ranked. Failed runs are visible in GitHub Actions; this workflow does not add unsolicited external alerts.

## Local commands

```
python -m unittest discover -s scripts/indexnow -q
python scripts/indexnow/indexnow_delta.py --config scripts/indexnow.json --state-dir PATH --expected-dist dist
```

Dry-run is default. `--initialize` makes a checked local baseline without POST. `--apply` submits a reviewed delta using existing config. CI uses `--prepare-only` + `--intent-id` to enforce durable write-ahead intent. Normal page removals require absence from sitemap and HTTP404/410; redirects/noindex changes require review. More than 25 changed URLs or more than 100 sitemap URLs fail closed pending explicit review.

Stable hash covers page title, main editorial text/links, description/OpenGraph/hreflang metadata and JSON-LD. Dynamic visitor counters/footer/scripts are intentionally excluded. CSS-only changes do not trigger IndexNow. Review this policy if a new component stores substantive content outside main.

## Setup verification record

The workflow was installed through PR #1 on 2026-11-10 after 22 unit tests, a 42-page build and 2097 site verification checks passed. The initial live-to-build comparison had zero changed URLs, so the eight earlier manual notifications must not be replayed. Activation is complete only after a successful Cloudflare production check, explicit baseline bootstrap and a successful check_run-triggered execution restoring durable state.

