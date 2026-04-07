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

# Install Python dependencies
COPY streamlit/requirements.txt requirements-streamlit.txt
RUN pip install --no-cache-dir -r requirements-streamlit.txt fastmcp fastapi uvicorn

# Copy application code
COPY data-raw/ data-raw/
COPY streamlit/ streamlit/
COPY mcp/ mcp/
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh start.sh
RUN chmod +x start.sh

EXPOSE 8080

CMD ["./start.sh"]
