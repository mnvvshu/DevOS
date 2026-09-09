# Security

## Threat Model
Since DevOS runs locally and executes code, the main threats are:
1. Malicious repository content exploiting the AI (Prompt Injection).
2. Malicious user intent or compromised local state.
3. Supply chain attacks via malicious npm packages.

## Permission System Design
All actions flow through `@devos/permissions`.
- **Safe**: Reading files, checking Git status.
- **Requires Approval**: Writing files, deleting safe files, running safe commands.
- **Blocked**: Deleting critical system files, accessing `.env` unless explicitly allowed, network exfiltration commands.

## Command Execution Safety
- We always use `execFile` or `spawn`, never `exec`. This prevents shell injection vulnerabilities.
- Arguments are explicitly passed as arrays, not concatenated strings.

## Path Traversal Prevention
- All paths are normalized and resolved against a strict workspace root.
- Operations outside the workspace root are blocked by default.

## API Key Handling
- Keys are kept in memory and `.env`. 
- They are never logged or exposed in the UI.

## Supply Chain Security
- `pnpm` with strictly locked versions.
- Audits run automatically via CI.
