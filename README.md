# Pyramid Solutions - Flask Backend

A Flask backend serving the Pyramid Solutions HR consultancy website with content negotiation support for HTML and Markdown.

## Features

- Serves HTML templates from `templates/` folder
- **Content Negotiation**: Returns Markdown when `Accept: text/markdown` header is present
- API endpoint for explicit format selection (`?format=markdown|html|json`)
- Health check endpoint
- Error handling with content negotiation

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Running the Server

```bash
# Development
python app.py

# Production (with gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

## Content Negotiation

### Via Accept Header

```bash
# Get HTML (default)
curl http://localhost:5000/

# Get Markdown
curl -H "Accept: text/markdown" http://localhost:5000/

# Get JSON
curl -H "Accept: application/json" http://localhost:5000/
```

### Via Query Parameter (API Endpoint)

```bash
# Markdown format
curl "http://localhost:5000/api/content/index?format=markdown"

# HTML format
curl "http://localhost:5000/api/content/index?format=html"

# JSON format
curl "http://localhost:5000/api/content/index?format=json"
```

## Project Structure

```
project/
├── app.py                 # Flask application factory
├── requirements.txt       # Python dependencies
├── templates/
│   ├── index.html         # Main HTML template
│   ├── index.md           # Markdown version for content negotiation
│   ├── 404.html           # 404 error page (optional)
│   └── 500.html           # 500 error page (optional)
└── static/                # Static assets (CSS, JS, images)
```

## Adding New Pages

1. Create `templates/<page>.html` for HTML version
2. Create `templates/<page>.md` for Markdown version
3. Access via `/<page>` with content negotiation

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main page with content negotiation |
| `GET /<page>` | Any page with content negotiation |
| `GET /api/content/<page>` | Explicit format via `?format=` param |
| `GET /health` | Health check |

## Content Negotiation Logic

The server checks the `Accept` header in this priority:
1. `text/markdown` → Returns `.md` template
2. `text/html` → Returns `.html` template (default)
3. `application/json` → Returns JSON structure
4. `*/*` → Defaults to HTML

Quality values (`q=`) in Accept header are respected.