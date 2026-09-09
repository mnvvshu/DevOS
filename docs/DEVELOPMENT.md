# Development Guide

## Prerequisites
- Node.js 20+
- pnpm 9+
- Git

## Setup Steps
```bash
git clone https://github.com/user/devos.git
cd devos
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

## Adding a New Tool
1. Navigate to `packages/tools/src/`.
2. Create your tool implementing the `Tool` interface.
3. Add it to the tool registry.
4. Ensure you add unit tests in `packages/tools/tests/`.

## Adding a New AI Provider
1. Navigate to `packages/ai-providers/src/`.
2. Implement the `AIProvider` interface.

## Database Migrations
We use Drizzle ORM.
To generate a migration:
```bash
pnpm db:generate
```
To run migrations:
```bash
pnpm db:migrate
```

## Testing
```bash
pnpm test
```
