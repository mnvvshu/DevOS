# API Reference

## REST Endpoints

### `GET /api/health`
Returns the health status of the API.
**Response:**
```json
{
  "status": "ok"
}
```

### `POST /api/chat`
Starts a new chat or continues an existing one.
**Request:**
```json
{
  "sessionId": "123",
  "message": "Hello!"
}
```

## WebSocket Events

### `agent:progress`
Emitted when the agent updates its thinking or action state.

### `agent:action_request`
Emitted when the agent needs permission to execute a tool.

## Tool Definitions
See standard tool schema inside `packages/tools/src/schema.ts`.
