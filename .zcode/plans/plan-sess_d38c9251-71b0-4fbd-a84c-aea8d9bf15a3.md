## Plan: Refactor `index.html` Sections into Dedicated Sub-routes

### Context
The `index.html` has **3 sections** embedded in one page:
1. **Hero** (`#home`) — Stats counter, CTA buttons
2. **Trust Bar** — Client logo strip (no separate route needed — it's a shared widget)
3. **Services Overview** (`#services`) — Cards linking out to `/recruitment`, `/outsourcing`, `/training`

The other service pages (consulting, recruitment, etc.) already exist as separate templates. The goal is to give the **index sections their own first-class routes** (e.g. `/home`, `/services`) so they're URL-addressable independently, while keeping `/` as the composed homepage.

---

### New Routes to Add

| Route | Description |
|---|---|
| `GET /home` | Standalone Hero section page |
| `GET /services` | Standalone Services Overview section page |

Both will also support content negotiation (HTML / Markdown / JSON) to match the existing pattern.

---

### Files to Create / Modify

#### 1. `templates/home.html` *(new)*
A standalone template extending `base.html` that renders only the Hero section from index.html, with `active_page = 'home'`.

#### 2. `templates/home.md` *(new)*
Markdown version of the hero section content for content negotiation.

#### 3. `templates/services.html` *(new)*
A standalone template extending `base.html` that renders only the Services Overview grid section, with `active_page = 'home'`.

#### 4. `templates/services.md` *(new)*
Markdown version of the services overview for content negotiation.

#### 5. `app.py` *(modify)*
Add two explicit route handlers inside `create_app()`, following the exact existing pattern:
```python
@app.route("/home")
def home_section():
    ...render home.html with seo for 'home' page...

@app.route("/services")
def services_section():
    ...render services.html with seo for 'services' page...
```
Also add SEO metadata for `'home'` and `'services'` keys in `get_seo_meta()`, and add them to `get_sitemap_urls()`.

#### 6. `npm/api/index.js` *(modify)*
Add route entries at lines 648–656 (where the existing page routes are defined):
```js
app.get('/home', (req, res) => handlePageRequest(req, res, 'home'));
app.get('/services', (req, res) => handlePageRequest(req, res, 'services'));
```
Add `home` and `services` entries to the `PAGES` config object with title, description, keywords, canonical, and sections.
Also copy the new templates into `npm/api/templates/` (Express reads from its own templates copy).

---

### SEO Metadata to Add

**`home` page:**
- Title: `"Pyramid Solutions — Building Exceptional Teams & Streamlined Operations"`
- Description: `"High-impact HR consultancy, recruitment, BPO, HRO, and professional development. 15K+ candidates placed, 98% client satisfaction, 350+ BPO & HR partners."`
- Canonical: `/home`

**`services` page:**
- Title: `"HR Services Overview — Recruitment, Outsourcing & Training | Pyramid Solutions"`
- Description: `"Comprehensive HR service lines: precision talent acquisition, strategic BPO & HR outsourcing, and professional certification programs."`
- Canonical: `/services`

---

### What Does NOT Change
- `/` (root homepage) keeps the full composed `index.html` — unchanged
- All other existing routes (`/consulting`, `/recruitment`, `/outsourcing`, etc.) unchanged
- `base.html`, `npm/api/index.js` rendering logic — unchanged
- No React introduced — pure server-side Jinja2 + Express templates

---

### Summary of Changes
| File | Action |
|---|---|
| `templates/home.html` | Create (Hero section as standalone page) |
| `templates/home.md` | Create (Markdown content for `/home`) |
| `templates/services.html` | Create (Services grid as standalone page) |
| `templates/services.md` | Create (Markdown content for `/services`) |
| `app.py` | Add `/home` and `/services` routes + SEO meta + sitemap entries |
| `npm/api/index.js` | Add `/home` and `/services` routes + `PAGES` config entries |
| `npm/api/templates/home.html` | Create (copy of templates/home.html for Express) |
| `npm/api/templates/home.md` | Create (copy for Express) |
| `npm/api/templates/services.html` | Create (copy of templates/services.html for Express) |
| `npm/api/templates/services.md` | Create (copy for Express) |
