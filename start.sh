#!/bin/bash
set -e

# Start MCP server (SSE transport on port 8000)
python mcp/server.py --transport sse --host 0.0.0.0 --port 8000 &

# Start REST API (port 8002)
uvicorn mcp.api:app --host 0.0.0.0 --port 8002 &

# Start Caddy (static site + reverse proxy for the API and MCP)
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &

# If any process dies, exit so Fly restarts the machine
# (otherwise Caddy keeps the container alive and serves 502s forever).
wait -n
exit 1
