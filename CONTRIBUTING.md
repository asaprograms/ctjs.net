## Getting Started

In the past, it has been quite difficult to run the CT website locally unless you had access to
the production database. Fortunately, our use of the Prisma ORM makes setting up mock data
extremely simple. This guide assumes you have node installed, and will use the `yarn` package
manager, but you can use any package manager you wish.

The first step is to configure MySQL. This is heavily OS-dependent, and outside the scope of this
document. After setting up MySQL, copy `.env.local.example` to `.env.local` and fill out the
required variables. It is very likely that the variables that already have default values will
not need to change.

Afterwards, execute the following commands to get up and running:

```bash
# Install dependencies using your package manager of choice
yarn

# Generate the Prisma client and create the associated MySQL database
yarn prisma-sync-db

# Fill the MySQL database with fake data. This can be ran multiple times to generate new data
yarn prisma-seed

# Start the web server
yarn dev
```
