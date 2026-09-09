# Architecture

## High-Level Architecture
DevOS is structured as a robust local-first AI Developer OS.

```
┌────────────────────────────────────────────────────────┐
│                        Web UI                          │
│             (React, Tailwind, WebSocket)               │
└──────────────────────────┬─────────────────────────────┘
                           │ WebSocket / HTTP
┌──────────────────────────▼─────────────────────────────┐
│                       Fastify API                      │
│                                                        │
│  ┌──────────────┐   ┌─────────────┐   ┌──────────────┐ │
│  │ Permission   │   │ AI Agent    │   │ Local DB     │ │
│  │ Manager      │   │ (ReAct Loop)│   │ (SQLite)     │ │
│  └──────┬───────┘   └──────┬──────┘   └──────────────┘ │
│         │                  │                           │
│  ┌──────▼───────┐   ┌──────▼──────┐                    │
│  │ File System  │   │ Ext. Models │                    │
│  │ Git / System │   │ Providers   │                    │
│  └──────────────┘   └─────────────┘                    │
└────────────────────────────────────────────────────────┘
```

## Package Dependency Graph
The monorepo uses Turborepo with packages:
- `@devos/agent` -> depends on `tools`, `ai-providers`
- `@devos/server` -> depends on `agent`, `database`, `logger`
- `@devos/tools` -> depends on `git-ops`, `repo-intel`, `system`, `permissions`

## Process Model
- Web Frontend runs in browser, interacts via HTTP and WebSockets.
- Backend server acts as a local daemon hosting Fastify API.
- Tools execute locally in separate child processes or via safe function calls.

## Agent Loop Design (ReAct Pattern)
The AI Agent operates on a Observe -> Think -> Act (ReAct) loop:
1. User provides prompt.
2. Agent gathers context.
3. Agent formulates a plan and selects a tool.
4. Tool action is validated by the Permission Engine.
5. Result is observed and loop repeats until resolution.

## Tool System Architecture
All tools implement a standard interface returning validation, execution logic, and metadata. Tools are dynamically loaded and injected into the ReAct loop prompt.

## Permission Model
Three-tier:
- Safe: Automatically run.
- Requires Approval: Prompts user via WebSocket.
- Blocked: Always rejected.

## Context Management
Limits input context size. Uses summarization and chunking when interacting with LLMs.
