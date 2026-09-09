# Contributing

Welcome to DevOS! We appreciate your help.

## Getting Started
1. Fork the repo.
2. Clone it locally.
3. Run `pnpm install`.

## Development Workflow
Create a branch from `main`:
```bash
git checkout -b feature/your-feature
```

## Code Style
- **TypeScript**: Strict mode enabled everywhere.
- **Formatting**: Prettier is used. Run `pnpm format`.
- **Linting**: ESLint is used. Run `pnpm lint`.

## Testing Requirements
All new features must include unit tests. Run tests via `pnpm test`.

## Pull Request Process
1. Push to your fork.
2. Open a PR against `main`.
3. CI will run (lint, typecheck, tests).
4. Require at least 1 approval from a core maintainer.

## Commit Message Format
We follow conventional commits:
`feat: added new tool`
`fix: resolved issue with git diff`
