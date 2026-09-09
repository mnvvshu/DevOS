<div align="center">

<img src="https://img.icons8.com/fluency/96/console.png" width="80" alt="DevOS Logo"/>

# DevOS

### 🧠 Your Local AI-Powered Developer Operating System

*The open-source, self-hosted coding assistant that actually understands your codebase.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](docs/CONTRIBUTING.md)

<br/>

**DevOS is NOT another AI chatbot wrapper.**<br/>
It's a full-stack developer workstation with an AI agent that can read your code, run your tests, diagnose failures, propose fixes, and execute commands — all with your approval, all on your machine.

<br/>

[Getting Started](#-getting-started) •
[Features](#-features) •
[Architecture](#-architecture) •
[Security](#-security-model) •
[Contributing](#-contributing)

---

</div>

<br/>

## ⚡ What Makes DevOS Different?

| | ChatGPT / Copilot Chat | DevOS |
|---|---|---|
| **Sees your files** | ❌ You paste code manually | ✅ Reads any file in your repo |
| **Runs commands** | ❌ No | ✅ Executes with your approval |
| **Understands project** | ❌ No context | ✅ Detects language, framework, tests |
| **Runs tests** | ❌ No | ✅ Runs and parses results |
| **Git aware** | ❌ No | ✅ Status, diff, log, branches |
| **System diagnostics** | ❌ No | ✅ CPU, RAM, disk, processes |
| **Your data stays local** | ❌ Sent to cloud | ✅ Everything on your machine |
| **Open source** | ❌ | ✅ MIT Licensed |

<br/>

## 🎬 How It Works

```
You:  "Why are my tests failing?"

DevOS Agent:
  🔍 Reading test output...
  📂 Found 3 failing tests in auth.test.ts
  📖 Reading src/auth/validate.ts...
  🐛 Root cause: missing null check on line 47
  ✏️  Proposing fix...
  ⏳ Awaiting your approval...

You:  ✅ Approve

DevOS Agent:
  💾 Applied fix to src/auth/validate.ts
  🧪 Running tests...
  ✅ All 124 tests passing
```

> The agent **thinks → acts → observes → repeats** using a [ReAct loop](https://arxiv.org/abs/2210.03629) with real tools, not just text generation.

<br/>

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ &nbsp;·&nbsp; **pnpm** 9+ &nbsp;·&nbsp; **Git**

### Install & Run

```bash
# Clone
git clone https://github.com/mnvvshu/DevOS.git
cd DevOS

# Install dependencies
pnpm install

# Configure AI provider
cp .env.example .env
# Edit .env (see below)

# Start dev servers
pnpm dev
```

Then open **http://localhost:5173** 🎉

### Configure AI Provider

```env
# Option 1: OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Option 2: Anthropic (Claude)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Option 3: Ollama (100% free & local)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

> 💡 **No API key?** Use [Ollama](https://ollama.com) — it's free, runs locally, and keeps everything private.

<br/>

## 🧰 Features

### 🤖 AI Agent — Not a Chatbot

A **ReAct-style autonomous agent** that chains tool calls to solve problems. It doesn't just generate text — it reads files, runs commands, and takes action.

| Tool | Permission | What It Does |
|---|---|---|
| `read_file` | ✅ Safe | Read any file in your project |
| `write_file` | ⚠️ Approval | Propose and apply code changes |
| `list_directory` | ✅ Safe | Browse folder structure |
| `search_files` | ✅ Safe | Find files by name or glob pattern |
| `search_code` | ✅ Safe | Grep through code with regex |
| `run_command` | ⚠️ Approval | Execute shell commands securely |
| `run_tests` | ⚠️ Approval | Run test suite and parse results |

### 🔍 Repository Intelligence

- Auto-detects **language**, **framework**, **package manager**, **test runner**, and **build tool**
- Builds a searchable file index of your entire project
- Scores file relevance to surface the right context for every query

### 📊 System Diagnostics Dashboard

Real-time monitoring built into the sidebar:

- **CPU** — Per-core usage with interval sampling
- **Memory** — Used / free / total with percentage
- **Disk** — Per-drive capacity and usage
- **Processes** — Top processes sorted by memory
- **Network** — Active connections with ports and state

### 🔀 Git Integration

- Current branch, status, and uncommitted changes
- Full diff and staged diff
- Commit log with details
- Branch listing

### 🎨 Developer UI

- ⌨️ **Command Palette** — `Ctrl+K` / `⌘K` for quick actions
- 🌙 **Dark / Light mode** — System-aware theming
- ⚡ **Real-time streaming** — WebSocket events show agent thinking live
- 📱 **Responsive layout** — Collapsible sidebar, fluid panels

<br/>

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         DevOS                               │
│                                                             │
│  ┌──────────┐    HTTP/WS    ┌─────────────────────────────┐ │
│  │  React   │◄────────────►│     Fastify Server          │ │
│  │  Frontend│               │                             │ │
│  │          │               │  ┌─────────┐  ┌──────────┐ │ │
│  │ • Chat   │               │  │  Agent  │  │  Tools   │ │ │
│  │ • Sidebar│               │  │  (ReAct)│─►│ Registry │ │ │
│  │ • Cmd+K  │               │  └────┬────┘  └──────────┘ │ │
│  └──────────┘               │       │                     │ │
│                              │  ┌────▼────┐  ┌──────────┐ │ │
│                              │  │   AI    │  │Permission│ │ │
│                              │  │Provider │  │ Engine   │ │ │
│                              │  └─────────┘  └──────────┘ │ │
│                              └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
DevOS/
├── apps/
│   ├── web/                # React 19 + Vite + Tailwind CSS
│   └── desktop/            # Electron shell (security hardened)
│
├── packages/
│   ├── shared/             # Types, utilities, Zod schemas
│   ├── logger/             # Structured JSON logging + EventBus
│   ├── database/           # JSON file-based storage engine
│   ├── ai-providers/       # OpenAI, Anthropic, Ollama adapters
│   ├── system/             # OS-level diagnostics
│   ├── git-ops/            # Git operations (read-only by default)
│   ├── repo-intel/         # Language/framework auto-detection
│   ├── tools/              # 7 agent tools with validation
│   ├── permissions/        # 3-tier permission engine
│   ├── agent/              # ReAct agent loop
│   └── server/             # Fastify REST + WebSocket API
│
├── tests/
│   ├── unit/               # Permissions, utils, detection, metrics
│   └── security/           # Injection, traversal, prompt attacks
│
├── docs/                   # ARCHITECTURE · SECURITY · API · CONTRIBUTING
└── .github/workflows/      # CI pipeline (lint, test, build)
```

<br/>

## 🛡 Security Model

> Security isn't an afterthought — it's the foundation.

### Three-Tier Permission System

| Level | Example Actions | Behavior |
|---|---|---|
| ✅ **Safe** | Read files, search code, git status, system metrics | Auto-approved |
| ⚠️ **Requires Approval** | Write files, run commands, install packages | UI prompt with risk assessment |
| 🛑 **Blocked** | `rm -rf`, format disk, access credentials, escalate privileges | Always denied, always logged |

### Defense in Depth

- **No `exec()`** — All commands use `execFile()` to prevent shell injection
- **Path traversal protection** — Resolves and validates all paths against project root
- **Sensitive file blocking** — `.env`, SSH keys, and credentials are never readable
- **Prompt injection defense** — Repository contents are treated as untrusted input
- **Audit logging** — Every action is recorded with risk level and decision

Read the full security design → [**SECURITY.md**](docs/SECURITY.md)

<br/>

## 🧪 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Language** | TypeScript (strict) | End-to-end type safety |
| **Frontend** | React 19 + Vite + Tailwind | Modern, fast, beautiful |
| **Backend** | Fastify 5 + WebSocket | High performance, plugin ecosystem |
| **Database** | JSON file storage | Zero native deps, portable |
| **AI** | Raw `fetch()` + SSE | No SDK lock-in, full streaming control |
| **Monorepo** | pnpm + Turborepo | Fast installs, cached builds |
| **Testing** | Vitest | Fast, TypeScript-native |
| **Desktop** | Electron | Cross-platform packaging |

<br/>

## 🛠 Development

```bash
pnpm dev           # Start all dev servers
pnpm build         # Production build (all 13 packages)
pnpm test          # Run unit + security tests
pnpm typecheck     # TypeScript strict check
pnpm lint          # ESLint
```

<br/>

## 🗺 Roadmap

- [ ] Electron desktop packaging & auto-updates
- [ ] Bundled ripgrep for instant code search
- [ ] Tree-sitter AST analysis for smarter context
- [ ] Integrated terminal (xterm.js)
- [ ] Multi-file diff viewer
- [ ] Agent memory across sessions
- [ ] Plugin system for custom tools
- [ ] MCP (Model Context Protocol) support
- [ ] Multi-model orchestration

<br/>

## 🤝 Contributing

Contributions are welcome! Please read [**CONTRIBUTING.md**](docs/CONTRIBUTING.md) before submitting a PR.

```bash
# Fork → Clone → Branch → Code → Test → PR
pnpm test          # Make sure tests pass
pnpm typecheck     # Make sure types are clean
```

<br/>

## 📄 License

MIT — do whatever you want with it.

<br/>

---

<div align="center">

**Built with 🧠 by [mnvvshu](https://github.com/mnvvshu)**

If this helped you, give it a ⭐

</div>
