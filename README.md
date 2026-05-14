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
docker run -d \
  --name bunge-hub-db \
  -e POSTGRES_USER=odnelazm \
  -e POSTGRES_PASSWORD=odnelazm \
  -e POSTGRES_DB=odnelazm \
  -p 5432:5432 \
  postgres:16
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
  --enrich-members
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

Issues and pull requests are welcome. The project uses the MIT licence.

- [Open an issue](https://github.com/mwananchi-tech/bunge-hub/issues/new)
- [View open issues](https://github.com/mwananchi-tech/bunge-hub/issues)
