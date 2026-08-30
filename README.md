# Bunge Hub

Open-source web platform for exploring Kenya's parliamentary record. Every bill debated, every contribution made, every question raised in the 13th Parliament: structured, searchable, and openly available.

Built on top of [odnelazm](https://github.com/mwananchi-tech/odnelazm), which handles scraping, parsing, and ingesting Hansard data from mzalendo.com into a PostgreSQL database. Bunge Hub is the read layer on top of that database: a React Router v7 SSR app that queries it and presents the data.

## Stack

- [React Router v7](https://reactrouter.com/): SSR, loaders, file-based routing
- [postgres.js](https://github.com/porsager/postgres): database queries
- [Tailwind CSS v4](https://tailwindcss.com/): styling
- [React Flow](https://reactflow.dev/): bill journey visualisation
- PostgreSQL: data store (populated by odnelazm-pipeline)

## Local development

### 1. Start PostgreSQL

```bash
docker compose up -d --wait postgres
export DATABASE_URL='postgres://odnelazm:odnelazm@localhost:5432/odnelazm'
```

### 2. Populate the database

Install `odnelazm-pipeline` from the [odnelazm](https://github.com/mwananchi-tech/odnelazm) repository:

```bash
cargo install --git https://github.com/mwananchi-tech/odnelazm odnelazm-pipeline
```

Run the ingest pipeline to fetch the last 3 months of sittings and enrich member profiles:

```bash
odnelazm-pipeline ingest \
  --start-date $(date -v-3m +%Y-%m-%d) \
  --import-profiles
```

See the [odnelazm-ingest README](https://github.com/mwananchi-tech/odnelazm/blob/main/crates/odnelazm-ingest/README.md) for the full reference, including the `enrich` subcommand for AI-generated summaries.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL connection string:

```
DATABASE_URL=postgres://odnelazm:odnelazm@localhost:5432/odnelazm
```

### 5. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Data contract and cutover

Bunge Hub is the compatible read layer for odnelazm migrations `0015`-`0017`:

- Canonical links use stable UUID routes. Source links resolve through
  `sitting_sources` and their `data_sources.base_url`, falling back to the legacy
  canonical URL for rows without an alias.
- Sitting routes using a legacy URL suffix permanently redirect (`308`) to the
  canonical `/sittings/<uuid>` route when exactly one row matches. No match is a
  `404`; ambiguous aliases return `409` rather than redirecting incorrectly.
- Member profiles, speaker links, search results, and sitemap entries use the
  immutable `members.id` at `/members/<uuid>`. Legacy member slugs resolve from
  member URLs and source URL metadata, then redirect with `308` when unique;
  missing slugs return `404` and ambiguous slugs return `409`.
- Member images use a shared accessible avatar. A missing image renders an
  initial immediately, and a URL that fails in the browser is replaced by the
  same fallback without changing the server-rendered initial state. External
  profile links come from `member_sources` and `data_sources`, not canonical
  identity fields.
- Queries expose only active reconciled bill mentions, topics, and speaker
  projections. Inactive rows and their preserved AI summaries remain in the
  database for audit and recovery.
- Sitting pages continue to display preserved generated summaries while their
  stale metadata queues them for regeneration; ingestion does not blank summary
  content during cutover.

Deploy this compatible app before the reconciliation writer performs a real
ingest. The complete backup, migration, ingestion, verification, and rollback
procedure is in the
[odnelazm-ingest runbook](https://github.com/mwananchi-tech/odnelazm/blob/main/crates/odnelazm-ingest/README.md#canonical-data-migration-runbook).

## Other scripts

```bash
npm run build       # production build
npm run typecheck   # TypeScript type check
npm run lint        # ESLint
npm run lint:fix    # ESLint with auto-fix
npm run format      # Prettier check
npm run format:fix  # Prettier auto-format
```

## Docker

```bash
docker build -t bunge-hub .
docker run -p 3000:3000 -e DATABASE_URL=postgres://... bunge-hub
```

## Contributing

Issues and pull requests are welcome. The project is licensed under the GPL-3.0.

- [Open an issue](https://github.com/mwananchi-tech/bunge-hub/issues/new)
- [View open issues](https://github.com/mwananchi-tech/bunge-hub/issues)
