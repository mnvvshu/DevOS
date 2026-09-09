# DevOS

<div align="center">

**Local-First AI Developer OS**

*Understand your codebase. Diagnose problems. Fix bugs. Run tests. All from one place.*

[![CI](https://github.com/user/devos/actions/workflows/ci.yml/badge.svg)](https://github.com/user/devos/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## What is DevOS?

DevOS is a **local-first AI-powered developer workstation** that acts as your intelligent coding assistant. Unlike simple AI chatbots, DevOS can:

- 🔍 **Understand your repository** — automatically detects languages, frameworks, build systems, and project structure
- 🐛 **Diagnose problems** — reads files, inspects logs, analyzes Git changes, and monitors system resources  
- 🛠️ **Fix issues** — proposes targeted code changes, runs tests, and shows diffs
- 🛡️ **Stays safe** — every destructive action requires explicit user approval
- 💾 **Runs locally** — your code never leaves your machine unless you configure an external AI provider

## Architecture

```
┌──────────────────────────────────────────────────┐
│                    DevOS                         │
├───────────────┬──────────────────────────────────┤
│ Sidebar        │ AI Chat Panel                    │
│                │                                   │
│ 📂 Project     │ User: Why is my API slow?         │
│ 🔀 Git         │                                   │
│ 📊 System      │ 🤖 Analyzing repository...         │
│ 📜 History     │    ✓ Read server/routes.ts          │
│                │    ✓ Found N+1 query pattern       │
│                │    ✓ Proposed fix                   │
│                │                                   │
│                │ [Review Diff] [Apply] [Run Tests]│
└───────────────┴──────────────────────────────────┘
```

## Features

### 🤖 AI Agent with Tool Calling
- ReAct-style agent loop with explicit tool calls
- 12+ built-in tools for filesystem, Git, code search, terminal, and system diagnostics
- Every tool has strict input validation, timeout enforcement, and structured error handling

### 🛡️ Security-First Design
- **Three-tier permission system**: Safe (auto-approved), Requires Approval (user prompt), Blocked (always denied)
- Command injection prevention via `execFile` (never `exec`)
- Path traversal detection and prevention
- Sensitive file access blocking (.env, SSH keys)
- Repository contents treated as untrusted input (prompt injection defense)

### 📊 System Diagnostics
- CPU, RAM, and disk usage monitoring
- Process listing with resource consumption
- Network connection inspection
- Cross-platform support (Windows primary, Linux/macOS structured for extension)

### 🔀 Git Integration
- Repository status, diff, and log
- Branch information
- Changed file tracking
- Commit history with details

### 💾 Local-First Storage
- SQLite database with WAL mode for concurrent access
- Task history with full audit trail
- Session management
- Settings persistence
- No data leaves your machine

### 🎨 Modern Developer UI
- Dark/light mode
- Command palette (Ctrl+K / ⌘K)
- Real-time agent event streaming via WebSocket
- Code diff viewer
- System monitor dashboard
- Keyboard shortcuts
- Responsive layout

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Git

### Installation

```bash
git clone https://github.com/user/devos.git
cd devos

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your AI provider API key

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Configuration

Edit `.env` to configure your AI provider:

```env
# OpenAI (default)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Ollama (fully local, no API key needed)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

## Example Workflows

### "Why are my tests failing?"
```
1. DevOS reads your test output
2. Identifies the 3 failing tests
3. Reads the relevant source files
4. Determines the root cause (missing null check)
5. Proposes a targeted fix
6. Asks for your approval
7. Applies the change
8. Runs the tests again
9. Shows: ✓ All 124 tests passing
```

### "Explain the project architecture"
```
1. DevOS scans your project structure
2. Detects: React + FastAPI + PostgreSQL + Docker
3. Identifies entry points and configuration
4. Maps component relationships
5. Produces a clear architecture summary
```

## Project Structure

```
DevOS/
├── apps/
│   ├── desktop/          # Electron shell (future)
│   └── web/              # React frontend (Vite)
│
├── packages/
│   ├── agent/            # AI agent core (ReAct loop)
│   ├── ai-providers/     # Multi-provider AI abstraction
│   ├── database/         # SQLite + Drizzle ORM
│   ├── git-ops/          # Git operations (read-only)
│   ├── logger/           # Structured logging + events
│   ├── permissions/      # Permission engine + validation
│   ├── repo-intel/       # Repository intelligence
│   ├── server/           # Fastify API + WebSocket
│   ├── shared/           # Shared types + utilities
│   ├── system/           # OS diagnostics
│   └── tools/            # Agent tool implementations
│
├── tests/
│   ├── unit/             # Unit tests
│   └── security/         # Security tests
│
└── docs/                 # Documentation
```

## Security Model

See [SECURITY.md](docs/SECURITY.md) for the full security design.

| Permission Level | Actions | Behavior |
|---|---|---|
| ✅ Safe | Read files, search code, Git status/log, system metrics | Auto-approved |
| ⚠️ Requires Approval | Write files, run commands, Git commit, install deps | User prompt with risk assessment |
| 🛑 Blocked | rm -rf, format, credential access, privilege escalation | Always denied |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Fastify 5 + WebSocket |
| Database | SQLite + better-sqlite3 + Drizzle ORM |
| AI | Custom multi-provider (OpenAI, Anthropic, Ollama) |
| Monorepo | pnpm + Turborepo |
| Testing | Vitest + Playwright |
| Language | TypeScript (strict mode) throughout |

## Development

```bash
pnpm dev           # Start dev servers
pnpm build         # Production build
pnpm test          # Run all tests
pnpm lint          # Lint code
pnpm typecheck     # Type check
pnpm format        # Format code
```

## Supported Platforms

| Platform | Status | Notes |
|---|---|---|
| Windows | ✅ Primary | Full support |
| Linux | 🟡 Partial | System diagnostics use platform adapters |
| macOS | 🟡 Partial | System diagnostics use platform adapters |

## Limitations

- AI features require an API key (OpenAI/Anthropic) or local Ollama installation
- System diagnostics commands are Windows-primary; Linux/macOS adapters need extension
- No Electron desktop packaging yet (web app only in MVP)
- File search uses line-by-line scanning (planned: bundled ripgrep for large repos)
- No multi-model orchestration (single model per session)

## Roadmap

- [ ] Electron desktop application packaging
- [ ] Bundled ripgrep for faster code search
- [ ] Tree-sitter AST analysis for smarter context selection
- [ ] Terminal emulator (xterm.js) in the UI
- [ ] Multi-file diff viewer
- [ ] Agent memory across sessions
- [ ] Plugin system for custom tools
- [ ] MCP (Model Context Protocol) support

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

MIT
