"""
Flask backend for Pyramid Solutions website with content negotiation support.

Serves HTML templates and supports markdown responses via Accept header negotiation.
Includes comprehensive SEO features: sitemap.xml, robots.txt, structured data, meta tags.
"""
import os
import json
from datetime import datetime, timezone
from pathlib import Path
from flask import Flask, render_template, request, send_file, abort, make_response, url_for
from markdown import markdown


def create_app():
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
        static_url_path="/static",
    )

    # Configuration
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 3600  # 1 hour cache for static files
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.config["SITE_NAME"] = "Pyramid Solutions"
    app.config["SITE_URL"] = "https://pyramidsolutions.com"
    app.config["SITE_DESCRIPTION"] = "Premier HR consultancy offering HR Consulting, Recruitment, Executive Hiring, BPO, HR Outsourcing, and Professional Training services."
    app.config["DEFAULT_OG_IMAGE"] = "/static/images/og-default.jpg"
    app.config["TWITTER_HANDLE"] = "@pyramidsolutions"

    # Supported content types for negotiation
    SUPPORTED_CONTENT_TYPES = {
        "text/html": ".html",
        "text/markdown": ".md",
        "application/json": ".json",
    }

    # ========== SEO HELPER FUNCTIONS ==========

    def get_base_url():
        """Get the base URL for the site."""
        return app.config["SITE_URL"].rstrip("/")

    def get_current_url():
        """Get the current request URL."""
        return request.url_root.rstrip("/") + request.path

    def build_canonical_url(path: str = "") -> str:
        """Build a canonical URL for a given path."""
        base = get_base_url()
        if path:
            path = path.lstrip("/")
            return f"{base}/{path}"
        return base

    def get_seo_meta(page: str = "index", **kwargs) -> dict:
        """
        Generate comprehensive SEO meta tags for a page.

        Args:
            page: Page identifier (index, consulting, recruitment, etc.)
            **kwargs: Additional context variables for dynamic content

        Returns:
            Dictionary of meta tag data for template rendering
        """
        base_url = get_base_url()
        current_url = get_current_url()
        site_name = app.config["SITE_NAME"]
        site_desc = app.config["SITE_DESCRIPTION"]
        og_image = f"{base_url}{app.config['DEFAULT_OG_IMAGE']}"
        twitter_handle = app.config["TWITTER_HANDLE"]

        # Page-specific SEO data
        page_seo = {
            "index": {
                "title": "Pyramid Solutions — HR Consulting, Recruitment & Outsourcing",
                "description": "Expert HR Consulting, Recruitment, BPO, HRO, and End-to-End Outsourcing solutions alongside professional training to elevate your organization.",
                "keywords": "HR consultancy, HR advisory, Change Management, Org Design, Business Process Outsourcing, BPO, HR Outsourcing, HRO, Talent Outsourcing, End-to-End Outsourcing, Permanent Recruitment, IT Recruitment, Non-IT Recruitment, Executive Hiring, Pyramid Solutions",
                "og_type": "website",
                "og_title": "Pyramid Solutions — Premier HR Consultancy & Outsourcing",
                "og_description": "Expert HR Consulting, Recruitment, BPO, HRO, and End-to-End Outsourcing solutions alongside professional training to elevate your organization.",
                "canonical": base_url,
                "robots": "index, follow",
            },
            "consulting": {
                "title": "Strategic HR Consulting & Compliance | Pyramid Solutions",
                "description": "Fractional HR leadership, compliance audits, organizational design, compensation structuring, and HR technology advisory. Your strategic HR partner.",
                "keywords": "HR consulting, HR compliance, fractional HR, organizational design, compensation benefits, HR technology, employee relations, risk management",
                "og_type": "website",
                "og_title": "Strategic HR Consulting & Compliance | Pyramid Solutions",
                "og_description": "Fractional HR leadership, compliance audits, organizational design, and HR technology advisory services.",
                "canonical": f"{base_url}/consulting",
                "robots": "index, follow",
            },
            "recruitment": {
                "title": "Recruitment & Staffing Services | Pyramid Solutions",
                "description": "Permanent placement, contract staffing, executive search, IT & non-IT recruitment, campus hiring, and RPO solutions. 15K+ candidates placed.",
                "keywords": "recruitment agency, permanent placement, contract staffing, executive search, IT recruitment, campus hiring, RPO, recruitment process outsourcing",
                "og_type": "website",
                "og_title": "Recruitment & Staffing Services | Pyramid Solutions",
                "og_description": "Comprehensive recruitment solutions: permanent placement, executive search, contract staffing, and RPO services.",
                "canonical": f"{base_url}/recruitment",
                "robots": "index, follow",
            },
            "outsourcing": {
                "title": "BPO & HR Outsourcing Solutions | Pyramid Solutions",
                "description": "Business Process Outsourcing, HR Outsourcing, payroll outsourcing, compliance outsourcing, and end-to-end talent outsourcing. 350+ partners served.",
                "keywords": "BPO, business process outsourcing, HRO, HR outsourcing, payroll outsourcing, compliance outsourcing, talent outsourcing, end-to-end outsourcing",
                "og_type": "website",
                "og_title": "BPO & HR Outsourcing Solutions | Pyramid Solutions",
                "og_description": "Comprehensive outsourcing solutions: BPO, HRO, payroll, compliance, and talent outsourcing services.",
                "canonical": f"{base_url}/outsourcing",
                "robots": "index, follow",
            },
            "training": {
                "title": "Professional HR Training & Certification Courses | Pyramid Solutions",
                "description": "HR certification courses, leadership development, soft skills training, legal compliance training, and custom corporate training programs.",
                "keywords": "HR training, HR certification, leadership development, soft skills training, compliance training, corporate training, professional development",
                "og_type": "website",
                "og_title": "Professional HR Training & Certification Courses | Pyramid Solutions",
                "og_description": "Upskill your workforce with HR certification, leadership development, soft skills, and compliance training programs.",
                "canonical": f"{base_url}/training",
                "robots": "index, follow",
            },
            "stories": {
                "title": "Success Stories & Case Studies | Pyramid Solutions",
                "description": "Read how Pyramid Solutions helped TechCorp, MedGlobal, FinLuxe, and other enterprises achieve 40% faster hiring, 100% compliance, and 60% turnover reduction.",
                "keywords": "HR case studies, recruitment success stories, HR consulting case studies, BPO case studies, client testimonials",
                "og_type": "website",
                "og_title": "Success Stories & Case Studies | Pyramid Solutions",
                "og_description": "Client success stories: 40% faster hiring, 100% compliance, 60% turnover reduction, and more.",
                "canonical": f"{base_url}/stories",
                "robots": "index, follow",
            },
            "about": {
                "title": "About Pyramid Solutions | Our Mission, Values & Team",
                "description": "Learn about Pyramid Solutions' mission to build exceptional teams, our core values of integrity, excellence, partnership, innovation, and empathy.",
                "keywords": "about Pyramid Solutions, HR company mission, HR consultancy values, HR leadership team",
                "og_type": "website",
                "og_title": "About Pyramid Solutions | Our Mission, Values & Team",
                "og_description": "Building exceptional teams and streamlined operations through strategic HR partnership.",
                "canonical": f"{base_url}/about",
                "robots": "index, follow",
            },
            "home": {
                "title": "Pyramid Solutions — Building Exceptional Teams & Streamlined Operations",
                "description": "High-impact HR consultancy, recruitment, BPO, HRO, and professional development. 15K+ candidates placed, 98% client satisfaction, 350+ BPO & HR partners.",
                "keywords": "HR consultancy, premier HR, exceptional teams, recruitment solutions, BPO, HRO, professional development, Pyramid Solutions",
                "og_type": "website",
                "og_title": "Pyramid Solutions — Building Exceptional Teams & Streamlined Operations",
                "og_description": "High-impact HR consultancy, recruitment, BPO, HRO, and professional development that accelerates growth.",
                "canonical": f"{base_url}/home",
                "robots": "index, follow",
            },
            "services": {
                "title": "HR Services Overview — Recruitment, Outsourcing & Training | Pyramid Solutions",
                "description": "Comprehensive HR service lines: precision talent acquisition, strategic BPO & HR outsourcing, and professional certification programs.",
                "keywords": "HR services, recruitment, outsourcing, BPO, HRO, HR consulting, training, Pyramid Solutions services",
                "og_type": "website",
                "og_title": "HR Services Overview — Recruitment, Outsourcing & Training | Pyramid Solutions",
                "og_description": "Comprehensive HR service lines: talent acquisition, BPO & HR outsourcing, HR consulting, and professional certification programs.",
                "canonical": f"{base_url}/services",
                "robots": "index, follow",
            },
            "faq": {
                "title": "Frequently Asked Questions | Pyramid Solutions",
                "description": "Find answers to common questions about our HR consulting, recruitment, outsourcing, and training services. Industries served, fractional HR, guarantees, international hiring.",
                "keywords": "HR consulting FAQ, recruitment FAQ, outsourcing FAQ, fractional HR, recruitment guarantee, international hiring",
                "og_type": "website",
                "og_title": "Frequently Asked Questions | Pyramid Solutions",
                "og_description": "Answers to common questions about HR consulting, recruitment, outsourcing, and training services.",
                "canonical": f"{base_url}/faq",
                "robots": "index, follow",
            },
            "contact": {
                "title": "Contact Us | Get Free HR Audit | Pyramid Solutions",
                "description": "Ready to transform your HR? Contact Pyramid Solutions for a free HR audit. Email: hello@pyramidsolutions.com, Phone: +1 (555) 123-4567.",
                "keywords": "contact HR consultancy, free HR audit, HR consulting contact, recruitment contact, outsourcing contact",
                "og_type": "website",
                "og_title": "Contact Us | Get Free HR Audit | Pyramid Solutions",
                "og_description": "Get in touch for a free HR audit. Expert HR consulting, recruitment, and outsourcing solutions.",
                "canonical": f"{base_url}/contact",
                "robots": "index, follow",
            },
            "404": {
                "title": "Page Not Found | Pyramid Solutions",
                "description": "The page you're looking for doesn't exist. Return to Pyramid Solutions homepage for HR consulting, recruitment, and outsourcing services.",
                "keywords": "",
                "og_type": "website",
                "og_title": "Page Not Found | Pyramid Solutions",
                "og_description": "The requested page was not found. Return to our homepage for HR solutions.",
                "canonical": base_url,
                "robots": "noindex, follow",
            },
            "500": {
                "title": "Server Error | Pyramid Solutions",
                "description": "Something went wrong on our end. Please try again later or contact Pyramid Solutions directly.",
                "keywords": "",
                "og_type": "website",
                "og_title": "Server Error | Pyramid Solutions",
                "og_description": "We're experiencing technical difficulties. Please try again later.",
                "canonical": base_url,
                "robots": "noindex, follow",
            },
        }

        # Get page-specific data or default to index
        seo = page_seo.get(page, page_seo["index"]).copy()

        # Allow overrides from kwargs
        for key, value in kwargs.items():
            if key in seo:
                seo[key] = value

        # Add common fields
        seo.update({
            "site_name": site_name,
            "site_url": base_url,
            "current_url": current_url,
            "og_url": seo["canonical"],
            "og_image": og_image,
            "og_site_name": site_name,
            "twitter_card": "summary_large_image",
            "twitter_site": twitter_handle,
            "twitter_creator": twitter_handle,
            "twitter_title": seo["og_title"],
            "twitter_description": seo["og_description"],
            "twitter_image": og_image,
            "robots": seo["robots"],
            "canonical_url": seo["canonical"],
            "published_time": "2024-01-01T00:00:00+00:00",
            "modified_time": datetime.now(timezone.utc).isoformat(),
            "author": site_name,
        })

        return seo

    def get_structured_data(page: str = "index", **kwargs) -> dict:
        """
        Generate JSON-LD structured data for SEO.

        Returns:
            Dictionary ready for json_script filter in templates
        """
        base_url = get_base_url()
        site_name = app.config["SITE_NAME"]

        # Organization schema (common for all pages)
        organization = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": site_name,
            "url": base_url,
            "logo": f"{base_url}/static/images/logo.png",
            "sameAs": [
                "https://linkedin.com/company/pyramid-solutions",
                "https://twitter.com/pyramidsolutions",
                "https://facebook.com/pyramidsolutions",
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-555-123-4567",
                "contactType": "customer service",
                "availableLanguage": "English",
                "areaServed": "US",
            },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Business Ave, Suite 400",
                "addressLocality": "San Francisco",
                "addressRegion": "CA",
                "postalCode": "94105",
                "addressCountry": "US",
            },
            "description": app.config["SITE_DESCRIPTION"],
        }

        # Page-specific schemas
        page_schemas = {
            "index": [
                organization,
                {
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": site_name,
                    "url": base_url,
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": {
                            "@type": "EntryPoint",
                            "urlTemplate": f"{base_url}/search?q={{search_term_string}}",
                        },
                        "query-input": "required name=search_term_string",
                    },
                },
                {
                    "@context": "https/schema.org",
                    "@type": "Service",
                    "serviceType": "HR Consulting",
                    "name": "Strategic HR Consulting & Compliance",
                    "provider": {"@type": "Organization", "name": site_name},
                    "areaServed": "Worldwide",
                    "description": "Fractional HR leadership, compliance audits, organizational design, compensation structuring, and HR technology advisory.",
                },
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "serviceType": "Recruitment",
                    "name": "Recruitment & Staffing Services",
                    "provider": {"@type": "Organization", "name": site_name},
                    "areaServed": "Worldwide",
                    "description": "Permanent placement, contract staffing, executive search, IT & non-IT recruitment, campus hiring, and RPO solutions.",
                },
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "serviceType": "Business Process Outsourcing",
                    "name": "BPO & HR Outsourcing Solutions",
                    "provider": {"@type": "Organization", "name": site_name},
                    "areaServed": "Worldwide",
                    "description": "Business Process Outsourcing, HR Outsourcing, payroll outsourcing, compliance outsourcing, and end-to-end talent outsourcing.",
                },
                {
                    "@context": "https://schema.org",
                    "@type": "EducationalOrganization",
                    "name": "Pyramid Solutions Training",
                    "description": "Professional HR training, certification courses, leadership development, and custom corporate training programs.",
                },
            ],
            "consulting": [
                organization,
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "serviceType": "HR Consulting",
                    "name": "Strategic HR Consulting & Compliance",
                    "provider": {"@type": "Organization", "name": site_name},
                    "areaServed": "Worldwide",
                    "description": "Fractional HR leadership, compliance audits, organizational design, compensation structuring, and HR technology advisory.",
                    "offers": [
                        {
                            "@type": "Offer",
                            "name": "HR Compliance & Risk Management",
                            "description": "Navigate complex labor laws with ease. We audit your policies, handbooks, and practices.",
                        },
                        {
                            "@type": "Offer",
                            "name": "Employee Relations & Culture",
                            "description": "Reduce turnover and boost productivity through performance management and retention strategies.",
                        },
                        {
                            "@type": "Offer",
                            "name": "Compensation & Benefits Structuring",
                            "description": "Design comprehensive benefits packages and compensation structures.",
                        },
                        {
                            "@type": "Offer",
                            "name": "Fractional HR Leadership",
                            "description": "Senior HR expertise on-demand for day-to-day HR operations.",
                        },
                        {
                            "@type": "Offer",
                            "name": "Organizational Design & Restructuring",
                            "description": "Optimize organizational chart for maximum efficiency and agility.",
                        },
                        {
                            "@type": "Offer",
                            "name": "HR Technology & Analytics Advisory",
                            "description": "Select, implement, and optimize HRIS platforms with data analytics.",
                        },
                    ],
                },
            ],
            "recruitment": [
                organization,
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "serviceType": "Recruitment Agency",
                    "name": "Recruitment & Staffing Services",
                    "provider": {"@type": "Organization", "name": site_name},
                    "areaServed": "Worldwide",
                    "description": "Permanent placement, contract staffing, executive search, IT & non-IT recruitment, campus hiring, and RPO solutions.",
                    "offers": [
                        {"@type": "Offer", "name": "Permanent Placement", "description": "Full-time recruitment with 90-day replacement guarantee."},
                        {"@type": "Offer", "name": "Contract & Temporary Staffing", "description": "Flexible staffing solutions for project-based needs."},
                        {"@type": "Offer", "name": "Executive Search", "description": "C-suite and senior leadership recruitment."},
                        {"@type": "Offer", "name": "IT & Non-IT Recruitment", "description": "Specialized technical and non-technical talent acquisition."},
                        {"@type": "Offer", "name": "Campus Hiring", "description": "Fresh graduate recruitment programs."},
                        {"@type": "Offer", "name": "RPO (Recruitment Process Outsourcing)", "description": "End-to-end recruitment process management."},
                    ],
                },
            ],
            "outsourcing": [
                organization,
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "serviceType": "Business Process Outsourcing",
                    "name": "BPO & HR Outsourcing Solutions",
                    "provider": {"@type": "Organization", "name": site_name},
                    "areaServed": "Worldwide",
                    "description": "Business Process Outsourcing, HR Outsourcing, payroll outsourcing, compliance outsourcing, and end-to-end talent outsourcing.",
                    "offers": [
                        {"@type": "Offer", "name": "Business Process Outsourcing (BPO)", "description": "Comprehensive business process management."},
                        {"@type": "Offer", "name": "HR Outsourcing (HRO)", "description": "Full or partial HR function outsourcing."},
                        {"@type": "Offer", "name": "Payroll Outsourcing", "description": "Accurate, compliant payroll processing."},
                        {"@type": "Offer", "name": "Compliance Outsourcing", "description": "Regulatory compliance management."},
                        {"@type": "Offer", "name": "Talent Outsourcing", "description": "Specialized talent acquisition and management."},
                        {"@type": "Offer", "name": "End-to-End Outsourcing", "description": "Complete HR function outsourcing."},
                    ],
                },
            ],
            "training": [
                organization,
                {
                    "@context": "https://schema.org",
                    "@type": "EducationalOrganization",
                    "name": "Pyramid Solutions Training",
                    "description": "Professional HR training, certification courses, leadership development, and custom corporate training programs.",
                    "url": f"{base_url}/training",
                },
                {
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": "HR Certification Courses",
                    "description": "Professional HR certification programs.",
                    "provider": {"@type": "Organization", "name": "Pyramid Solutions Training"},
                },
                {
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": "Leadership Development",
                    "description": "Executive and management leadership training.",
                    "provider": {"@type": "Organization", "name": "Pyramid Solutions Training"},
                },
                {
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": "Soft Skills Training",
                    "description": "Communication, teamwork, and interpersonal skills development.",
                    "provider": {"@type": "Organization", "name": "Pyramid Solutions Training"},
                },
                {
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": "Legal & Compliance Training",
                    "description": "Employment law and regulatory compliance education.",
                    "provider": {"@type": "Organization", "name": "Pyramid Solutions Training"},
                },
            ],
        }

        schemas = page_schemas.get(page, page_schemas["index"])

        # Add breadcrumb schema for all pages
        breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": base_url,
                },
            ],
        }

        # Add page-specific breadcrumb
        page_breadcrumbs = {
            "home": "Home",
            "services": "Services",
            "consulting": "HR Consulting",
            "recruitment": "Recruitment",
            "outsourcing": "Outsourcing",
            "training": "Training",
            "stories": "Success Stories",
            "about": "About Us",
            "faq": "FAQ",
            "contact": "Contact",
        }

        if page in page_breadcrumbs:
            breadcrumb["itemListElement"].append({
                "@type": "ListItem",
                "position": 2,
                "name": page_breadcrumbs[page],
                "item": f"{base_url}/{page}",
            })

        schemas.append(breadcrumb)

        return schemas

    def get_sitemap_urls() -> list:
        """Generate list of URLs for sitemap.xml."""
        base_url = get_base_url()
        now = datetime.now(timezone.utc).date().isoformat()

        urls = [
            {"loc": base_url, "lastmod": now, "changefreq": "weekly", "priority": "1.0"},
            {"loc": f"{base_url}/home", "lastmod": now, "changefreq": "weekly", "priority": "0.9"},
            {"loc": f"{base_url}/services", "lastmod": now, "changefreq": "monthly", "priority": "0.9"},
            {"loc": f"{base_url}/consulting", "lastmod": now, "changefreq": "monthly", "priority": "0.8"},
            {"loc": f"{base_url}/recruitment", "lastmod": now, "changefreq": "monthly", "priority": "0.8"},
            {"loc": f"{base_url}/outsourcing", "lastmod": now, "changefreq": "monthly", "priority": "0.8"},
            {"loc": f"{base_url}/training", "lastmod": now, "changefreq": "monthly", "priority": "0.8"},
            {"loc": f"{base_url}/stories", "lastmod": now, "changefreq": "monthly", "priority": "0.7"},
            {"loc": f"{base_url}/about", "lastmod": now, "changefreq": "yearly", "priority": "0.6"},
            {"loc": f"{base_url}/faq", "lastmod": now, "changefreq": "monthly", "priority": "0.6"},
            {"loc": f"{base_url}/contact", "lastmod": now, "changefreq": "yearly", "priority": "0.7"},
        ]
        return urls

    # ========== TEMPLATE HELPERS ==========

    @app.template_filter("json_script")
    def json_script_filter(value):
        """Convert a Python object to a JSON script tag for structured data."""
        return json.dumps(value, ensure_ascii=False, indent=2)

    @app.context_processor
    def inject_seo_helpers():
        """Inject SEO helper functions into all templates."""
        return {
            "get_seo_meta": get_seo_meta,
            "get_structured_data": get_structured_data,
            "build_canonical_url": build_canonical_url,
            "get_base_url": get_base_url,
        }

    def get_template_path(template_name: str, extension: str = ".html") -> Path:
        """Get the full path to a template file."""
        return Path(app.template_folder) / f"{template_name}{extension}"

    def negotiate_content_type(accept_header: str) -> str:
        """
        Negotiate content type based on Accept header.
        Returns the best matching content type or defaults to text/html.
        """
        if not accept_header:
            return "text/html"

        # Parse Accept header (simplified - handles q-values)
        accepted = []
        for part in accept_header.split(","):
            part = part.strip()
            if ";" in part:
                media_type, q_part = part.split(";", 1)
                media_type = media_type.strip()
                try:
                    q = float(q_part.split("=")[1].strip())
                except (IndexError, ValueError):
                    q = 1.0
            else:
                media_type = part
                q = 1.0
            accepted.append((media_type, q))

        # Sort by quality descending
        accepted.sort(key=lambda x: x[1], reverse=True)

        # Find best match
        for media_type, _ in accepted:
            # Handle wildcards
            if media_type == "*/*":
                return "text/html"
            if media_type.startswith("text/") and media_type != "text/html":
                # Check for text/markdown explicitly
                if media_type == "text/markdown":
                    return "text/markdown"
            if media_type in SUPPORTED_CONTENT_TYPES:
                return media_type

        return "text/html"

    def render_markdown(template_name: str, **context) -> str:
        """Render a template as markdown."""
        template_path = get_template_path(template_name, ".md")
        if not template_path.exists():
            # Fallback: convert HTML template to markdown
            html_content = render_template(f"{template_name}.html", **context)
            return html_to_markdown(html_content)

        with open(template_path, "r", encoding="utf-8") as f:
            md_template = f.read()

        # Simple template variable substitution for markdown
        for key, value in context.items():
            placeholder = f"{{{{ {key} }}}}"
            md_template = md_template.replace(placeholder, str(value))

        return md_template

    def html_to_markdown(html: str) -> str:
        """Basic HTML to markdown conversion."""
        import re
        html = re.sub(r"<h1[^>]*>(.*?)</h1>", r"# \1", html, flags=re.DOTALL)
        html = re.sub(r"<h2[^>]*>(.*?)</h2>", r"## \1", html, flags=re.DOTALL)
        html = re.sub(r"<h3[^>]*>(.*?)</h3>", r"### \1", html, flags=re.DOTALL)
        html = re.sub(r"<p[^>]*>(.*?)</p>", r"\1\n\n", html, flags=re.DOTALL)
        html = re.sub(r"<a[^>]*href=[\"']([^\"']*)[\"'][^>]*>(.*?)</a>", r"[\2](\1)", html, flags=re.DOTALL)
        html = re.sub(r"<strong[^>]*>(.*?)</strong>", r"**\1**", html, flags=re.DOTALL)
        html = re.sub(r"<em[^>]*>(.*?)</em>", r"*\1*", html, flags=re.DOTALL)
        html = re.sub(r"<br\s*/?>", "\n", html)
        html = re.sub(r"<[^>]+>", "", html)
        html = re.sub(r"\n{3,}", "\n\n", html)
        return html.strip()

    # ========== ROUTES ==========

    @app.route("/")
    def index():
        """Serve the main page with content negotiation and SEO."""
        content_type = negotiate_content_type(request.headers.get("Accept", ""))

        if content_type == "text/markdown":
            md_content = render_markdown("index")
            response = make_response(md_content)
            response.headers["Content-Type"] = "text/markdown; charset=utf-8"
            return response

        if content_type == "application/json":
            return {
                "page": "index",
                "format": "json",
                "html_url": "/",
                "markdown_url": "/api/content/index?format=markdown",
            }

        # Default to HTML with SEO context
        seo_meta = get_seo_meta("index")
        structured_data = get_structured_data("index")
        return render_template("index.html", seo=seo_meta, structured_data=structured_data)

    @app.route("/home")
    def home_section():
        """Serve the standalone Hero/Home section page with content negotiation and SEO."""
        content_type = negotiate_content_type(request.headers.get("Accept", ""))

        if content_type == "text/markdown":
            md_content = render_markdown("home")
            response = make_response(md_content)
            response.headers["Content-Type"] = "text/markdown; charset=utf-8"
            return response

        if content_type == "application/json":
            return {
                "page": "home",
                "format": "json",
                "html_url": "/home",
                "markdown_url": "/api/content/home?format=markdown",
            }

        seo_meta = get_seo_meta("home")
        structured_data = get_structured_data("index")  # reuse org/website schema
        return render_template("home.html", seo=seo_meta, structured_data=structured_data)

    @app.route("/services")
    def services_section():
        """Serve the standalone Services Overview section page with content negotiation and SEO."""
        content_type = negotiate_content_type(request.headers.get("Accept", ""))

        if content_type == "text/markdown":
            md_content = render_markdown("services")
            response = make_response(md_content)
            response.headers["Content-Type"] = "text/markdown; charset=utf-8"
            return response

        if content_type == "application/json":
            return {
                "page": "services",
                "format": "json",
                "html_url": "/services",
                "markdown_url": "/api/content/services?format=markdown",
            }

        seo_meta = get_seo_meta("services")
        structured_data = get_structured_data("index")  # reuse org schema with services
        return render_template("services.html", seo=seo_meta, structured_data=structured_data)

    @app.route("/<path:page>")
    def serve_page(page: str):
        """Serve any page with content negotiation and SEO."""
        page = page.rstrip("/")
        if page.endswith(".html"):
            page = page[:-5]

        content_type = negotiate_content_type(request.headers.get("Accept", ""))

        if content_type == "text/markdown":
            template_path = get_template_path(page, ".md")
            if not template_path.exists():
                abort(404)
            md_content = render_markdown(page)
            response = make_response(md_content)
            response.headers["Content-Type"] = "text/markdown; charset=utf-8"
            return response

        if content_type == "application/json":
            return {
                "page": page,
                "format": "json",
                "html_url": f"/{page}",
                "markdown_url": f"/{page}?format=markdown",
            }

        # Try to render HTML template with SEO
        try:
            seo_meta = get_seo_meta(page)
            structured_data = get_structured_data(page)
            return render_template(f"{page}.html", seo=seo_meta, structured_data=structured_data)
        except Exception:
            abort(404)

    @app.route("/api/content/<path:page>")
    def api_content(page: str):
        """
        API endpoint for content with explicit format selection.
        Supports ?format=html|markdown|json query parameter.
        """
        page = page.rstrip("/")
        format_param = request.args.get("format", "").lower()

        if format_param == "markdown" or format_param == "md":
            md_content = render_markdown(page)
            return {"content": md_content, "format": "markdown"}

        if format_param == "json":
            return {
                "page": page,
                "format": "json",
                "html_url": f"/{page}",
                "markdown_url": f"/{page}?format=markdown",
            }

        # Default to HTML
        try:
            html_content = render_template(f"{page}.html")
            return {"content": html_content, "format": "html"}
        except Exception:
            abort(404)

    @app.route("/sitemap.xml")
    def sitemap():
        """Generate dynamic sitemap.xml."""
        urls = get_sitemap_urls()

        xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>']
        xml_parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
        xml_parts.append('        xmlns:xhtml="http://www.w3.org/1999/xhtml">')

        for url in urls:
            xml_parts.append("  <url>")
            xml_parts.append(f"    <loc>{url['loc']}</loc>")
            xml_parts.append(f"    <lastmod>{url['lastmod']}</lastmod>")
            xml_parts.append(f"    <changefreq>{url['changefreq']}</changefreq>")
            xml_parts.append(f"    <priority>{url['priority']}</priority>")
            # Add hreflang for English (default)
            xml_parts.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{url["loc"]}"/>')
            xml_parts.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{url["loc"]}"/>')
            xml_parts.append("  </url>")

        xml_parts.append("</urlset>")

        response = make_response("\n".join(xml_parts))
        response.headers["Content-Type"] = "application/xml; charset=utf-8"
        response.headers["Cache-Control"] = "public, max-age=86400"  # Cache for 24 hours
        return response

    @app.route("/robots.txt")
    def robots_txt():
        """Serve robots.txt from static folder."""
        return send_file("static/robots.txt", mimetype="text/plain")

    @app.route("/health")
    def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "service": "pyramid-solutions"}

    @app.errorhandler(404)
    def not_found(e):
        content_type = negotiate_content_type(request.headers.get("Accept", ""))
        if content_type == "text/markdown":
            return make_response("# Not Found\n\nThe requested page was not found.", 404, {"Content-Type": "text/markdown"})

        seo_meta = get_seo_meta("404")
        structured_data = get_structured_data("index")  # Use org schema for error pages
        return render_template("404.html", seo=seo_meta, structured_data=structured_data), 404

    @app.errorhandler(500)
    def server_error(e):
        content_type = negotiate_content_type(request.headers.get("Accept", ""))
        if content_type == "text/markdown":
            return make_response("# Server Error\n\nAn internal server error occurred.", 500, {"Content-Type": "text/markdown"})

        seo_meta = get_seo_meta("500")
        structured_data = get_structured_data("index")
        return render_template("500.html", seo=seo_meta, structured_data=structured_data), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)