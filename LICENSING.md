# Licensing status

The application was initially imported from `ChatTriggers/new-website`. That repository does not publish a license file or an explicit repository-wide license grant. Public visibility alone does not grant redistribution rights.

An audit against the upstream `main` branch on 2026-09-19 found 82 files that were byte-for-byte identical and 23 inherited files that had been modified. The identical set includes application code, account routes, module UI, assets, and project configuration. Modified inherited files can still contain upstream copyrightable work.

For that reason, this repository does not claim that the inherited website is presently available under an open-source license. New code written specifically for this continuation is offered under MIT, but that statement does not relicense upstream work.

## Resolution criteria

The website can be described as fully open source only after one of these conditions is met:

1. The upstream copyright holders publish a license that covers the imported revision.
2. The upstream copyright holders provide an explicit redistribution and modification grant.
3. Every inherited implementation and asset is replaced with independently written material, followed by a clean provenance review.

Until then, releases and repository documentation must preserve this limitation. The mod repository has separate MIT-licensed lineage and is not affected by this website-specific issue.

## Audit method

The audit compared relative paths and SHA-256 file hashes between this repository and a fresh checkout of `ChatTriggers/new-website`. Generated output, dependency directories, local environment files, and Git metadata were excluded. A later edit to an inherited file does not by itself establish independent authorship, so provenance must be reviewed rather than inferred from a changed hash.
