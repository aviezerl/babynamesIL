# babynamesIL MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets AI agents query Israeli baby name data (1948–2024).

## Quick Start

```bash
pip install fastmcp pandas
```

### Run directly

```bash
cd babynamesIL
fastmcp run mcp/server.py
```

### Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "babynamesIL": {
      "command": "fastmcp",
      "args": ["run", "/path/to/babynamesIL/mcp/server.py"]
    }
  }
}
```

### Add to Claude Code

```bash
claude mcp add babynamesIL -- fastmcp run /path/to/babynamesIL/mcp/server.py
```

## Available Tools

| Tool | Description |
|------|-------------|
| `search_name` | Look up a name and get summary statistics (total count, peak year, year range) |
| `name_trend` | Get year-by-year popularity data for a name |
| `top_names` | Get the most popular names for a given year, sector, and sex |
| `compare_names` | Compare popularity of multiple names side by side |
| `search_by_pattern` | Find names matching a substring (useful for partial/uncertain spelling) |
| `list_sectors` | Get dataset overview: sectors, year range, record counts |

## Example Queries

Once connected, you can ask your AI agent things like:

- "What are the top 10 boy names in Israel in 2024?"
- "How has the name נועם trended over the years?"
- "Compare דוד and יוסף across all time"
- "Find all names containing אור"
- "What are the most popular Muslim girl names in 2020?"

## Data Source

[Israeli Central Bureau of Statistics (CBS/LAMAS)](https://www.cbs.gov.il), Release 391/2025.
