# ctjs.net

This repository contains the website, module registry, API, and review tools for ChatTriggers Community Edition.

The site is based on the open source ChatTriggers website rewrite and retains its module browsing, accounts, release storage, and API design. This continuation adds a module application process, mandatory release review, static archive scanning, reviewer audit records, current Fabric version metadata, and self-hosted deployment files.

## Development

Copy `.env.local.example` to `.env.local`, configure a MySQL database, and install dependencies with Yarn 3 through Corepack.

```text
corepack enable
yarn install
yarn prisma-generate
yarn prisma-sync-db
yarn dev
```

Run the verification checks before opening a pull request:

```text
yarn test
yarn tsc --noEmit
yarn build
```

## Module review flow

1. A verified account submits an application with a public source repository.
2. A reviewer accepts or declines the project.
3. An accepted project receives a private module listing.
4. Each uploaded release is normalized, hashed, and scanned.
5. A reviewer inspects the source, release diff, and scanner findings.
6. Only an explicitly approved release becomes public.

The scanner does not claim to prove that a module is safe. Its purpose is to give reviewers consistent evidence and highlight capabilities that need explanation.

## Deployment

The included container configuration runs the Next.js application, MySQL, and Caddy. See [DEPLOYMENT.md](DEPLOYMENT.md) for the WSL deployment procedure and required secrets.

## Credits

This project derives from [ChatTriggers/new-website](https://github.com/ChatTriggers/new-website). The original maintainers and contributors retain credit for their work. See [NOTICE.md](NOTICE.md) for source lineage.

## License

The upstream website did not include a standalone license file at the imported revision. Contributions made in this continuation are offered under the MIT License, subject to any rights that apply to inherited files. See [LICENSING.md](LICENSING.md) for the current provenance audit and the conditions required before describing the full website as open source.
