# Pyramid Solutions - Vercel Deployable Version

A production-ready, SEO-optimized Express.js application for Vercel deployment with full content negotiation support.

## Features

### 🔄 Content Negotiation
- **Accept Header Support**: Automatically detects `Accept` header and returns appropriate format
  - `text/html` → Full HTML with SEO meta tags
  - `text/markdown` → Clean Markdown content
  - `application/json` → Structured JSON with metadata
- **Query Parameter Override**: Explicit format selection via `?format=html|md|markdown|json`
- **API Endpoint**: `/api/content/:page?format=` for programmatic access

### 🎯 SEO Optimization
- **Meta Tags**: Title, description, keywords, author, canonical URLs
- **Open Graph**: Complete OG tags for Facebook/LinkedIn sharing
- **Twitter Cards**: Summary large image cards
- **JSON-LD Structured Data**: 
  - `WebSite` / `WebPage` for general pages
  - `Service` for consulting pages
  - `EmploymentAgency` for recruitment
  - `Course` for training
  - `ContactPage` for contact
- **Sitemap.xml**: Auto-generated with all pages, proper priorities
- **Robots.txt**: Crawler directives with sitemap reference
- **Semantic HTML**: Proper heading hierarchy, ARIA labels, landmarks

### ⚡ Performance & Security
- **Helmet.js**: CSP, HSTS, XSS protection, frame options
- **Compression**: Gzip/Brotli compression for all responses
- **Caching Headers**: Optimized cache-control for static assets, sitemap, robots
- **Security Headers**: X-Content-Type-Options, Referrer-Policy, Permissions-Policy

### 📱 Modern Architecture
- **ES Modules**: Native Node.js ES module support
- **Markdown-First**: Content stored as Markdown, rendered to HTML
- **Template System**: Per-page Markdown templates with variable substitution
- **Responsive CSS**: Mobile-first, accessible, print-optimized
- **Vanilla JS**: No framework bloat, progressive enhancement

## Project Structure

```
npm/
├── api/
│   ├── index.js              # Main Express application
│   └── templates/            # Markdown content templates
│       ├── index.md
│       ├── consulting.md
│       ├── recruitment.md
│       ├── outsourcing.md
│       ├── training.md
│       ├── stories.md
│       ├── about.md
│       ├── faq.md
│       ├── contact.md
│       ├── 404.md
│       └── 500.md
├── static/
│   ├── styles.css            # Complete stylesheet
│   ├── app.js                # Client-side JavaScript
│   └── logo.svg              # Brand logo
├── package.json              # Dependencies & scripts
├── vercel.json               # Vercel configuration
└── README.md                 # This file
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# or
vercel dev

# Server runs on http://localhost:3000
```

### Production Build

```bash
# No build step required for this setup
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Content Negotiation Examples

### Via Accept Header (Recommended)

```bash
# HTML (default for browsers)
curl http://localhost:3000/

# Markdown
curl -H "Accept: text/markdown" http://localhost:3000/

# JSON
curl -H "Accept: application/json" http://localhost:3000/

# Specific page
curl -H "Accept: text/markdown" http://localhost:3000/consulting
```

### Via Query Parameter

```bash
# Markdown format
curl "http://localhost:3000/consulting?format=markdown"
curl "http://localhost:3000/consulting?format=md"

# JSON format
curl "http://localhost:3000/consulting?format=json"

# HTML format (explicit)
curl "http://localhost:3000/consulting?format=html"
```

### Via API Endpoint

```bash
# Markdown
curl "http://localhost:3000/api/content/consulting?format=markdown"

# JSON with metadata
curl "http://localhost:3000/api/content/consulting?format=json"

# Response includes:
{
  "page": "consulting",
  "title": "HR Consulting & Advisory | Pyramid Solutions",
  "description": "...",
  "content": "...",  // markdown-rendered HTML
  "format": "markdown",
  "htmlUrl": "https://.../consulting",
  "markdownUrl": "https://.../api/content/consulting?format=markdown",
  "jsonUrl": "https://.../api/content/consulting?format=json"
}
```

## Available Pages

| Route | Description | JSON-LD Type |
|-------|-------------|--------------|
| `/` | Homepage with hero, stats, services overview | `WebSite` |
| `/consulting` | HR Consulting & Advisory | `Service` |
| `/recruitment` | Recruitment & Staffing | `EmploymentAgency` |
| `/outsourcing` | BPO & HR Outsourcing | `Service` |
| `/training` | Professional Training | `Course` |
| `/stories` | Success Stories / Case Studies | `WebPage` |
| `/about` | About Us / Company Info | `WebPage` |
| `/faq` | Frequently Asked Questions | `WebPage` |
| `/contact` | Contact Form & Info | `ContactPage` |

## SEO Features Detail

### Meta Tags (Every Page)
```html
<title>Page Title | Pyramid Solutions</title>
<meta name="description" content="Page-specific description">
<meta name="keywords" content="relevant, keywords, here">
<link rel="canonical" href="https://domain.com/page">
```

### Open Graph
```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://domain.com/page">
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Description">
<meta property="og:image" content="https://domain.com/static/og-image.jpg">
<meta property="og:site_name" content="Pyramid Solutions">
```

### Twitter Cards
```html
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:site" content="@pyramidsolutions">
<meta property="twitter:url" content="https://domain.com/page">
<meta property="twitter:title" content="Page Title">
<meta property="twitter:description" content="Description">
<meta property="twitter:image" content="https://domain.com/static/og-image.jpg">
```

### JSON-LD (Page-Specific)
Each page includes appropriate structured data for rich search results.

## Adding New Pages

1. **Create Markdown template**: `api/templates/newpage.md`
2. **Add page config** to `PAGES` object in `api/index.js`
3. **Add route** in `api/index.js`:
   ```javascript
   app.get('/newpage', (req, res) => handlePageRequest(req, res, 'newpage'));
   ```
4. **Update sitemap** (auto-generated from PAGES config)

## Vercel Configuration

The `vercel.json` includes:
- Function configuration (30s timeout, 1024MB memory)
- Security headers for all routes
- Cache headers for static assets, sitemap, robots.txt
- Rewrite rules for SPA-like routing
- Cron job for sitemap regeneration (daily at 2 AM)

## Environment Variables

Create `.env` for local development:
```env
NODE_ENV=development
SITE_URL=http://localhost:3000
```

Production (set in Vercel dashboard):
```env
NODE_ENV=production
SITE_URL=https://your-domain.vercel.app
```

## Scripts

```json
{
  "dev": "vercel dev",
  "build": "echo 'No build step required'",
  "start": "node api/index.js",
  "lint": "eslint ."
}
```

## Dependencies

### Production
- `express` - Web framework
- `compression` - Response compression
- `helmet` - Security headers
- `markdown-it` - Markdown parser
- `markdown-it-anchor` - Header anchors
- `markdown-it-toc-done-right` - Table of contents

### Development
- `eslint` - Code linting
- `vercel` - Vercel CLI

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- WCAG 2.1 AA compliant
- Semantic HTML5 landmarks
- Skip links
- ARIA labels & roles
- Focus management
- Keyboard navigation
- Color contrast ratios
- Reduced motion support

## License

MIT © Pyramid Solutions