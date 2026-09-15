How to migrate from the legacy CT database to the new one:
1. Generate the old prisma definitions: `dotenv -e .env.local npx prisma db generate --schema prisma/legacy_schema.prisma`
1. Generate the new prisma definitions: `dotenv -e .env.local npx prisma db generate --schema prisma/schema.prisma`
1. Create the new database: `create database website`
1. Populate the new database: `dotenv -e .env.local npx prisma db push`
1. Run the migration script: `yarn migrate-legacy-db`
