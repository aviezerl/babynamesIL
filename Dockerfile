FROM python:3.12-slim

# Install Caddy
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg debian-keyring debian-archive-keyring apt-transport-https && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && \
    apt-get update && \
    apt-get install -y caddy && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies for the REST API and MCP server
COPY mcp/requirements.txt mcp/requirements.txt
RUN pip install --no-cache-dir -r mcp/requirements.txt

# Application code and data
COPY data-raw/ data-raw/
COPY mcp/ mcp/
COPY web/ web/
# Build the site's data files (web/data.json, web/rare.json and .gz copies) from data-raw/
RUN python web/build_data.py
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh start.sh
RUN chmod +x start.sh

EXPOSE 8080

CMD ["./start.sh"]
