/**
 * Pyramid Solutions - Vercel Deployable Express Application
 * Handles content negotiation (Accept headers) and SEO optimization
 */

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItToc from 'markdown-it-toc-done-right';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ============================================
// Security & Performance Middleware
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files with caching
app.use('/static', express.static(path.join(__dirname, '..', 'static'), {
  maxAge: '1y',
  immutable: true,
  etag: true,
}));

// ============================================
// Content Negotiation Middleware
// ============================================
const SUPPORTED_TYPES = {
  'text/html': 'html',
  'text/markdown': 'md',
  'application/json': 'json',
};

// Short format names for query parameter override
const FORMAT_ALIASES = {
  'html': 'html',
  'htm': 'html',
  'markdown': 'md',
  'md': 'md',
  'json': 'json',
};

function negotiateContentType(acceptHeader) {
  if (!acceptHeader) return 'html';

  const accepted = acceptHeader.split(',').map(part => {
    const [mediaType, ...params] = part.trim().split(';');
    let q = 1.0;
    for (const param of params) {
      const [key, value] = param.trim().split('=');
      if (key === 'q') q = parseFloat(value) || 1.0;
    }
    return { type: mediaType.trim(), q };
  });

  accepted.sort((a, b) => b.q - a.q);

  for (const { type } of accepted) {
    if (type === '*/*') return 'html';
    if (SUPPORTED_TYPES[type]) return SUPPORTED_TYPES[type];
    // Handle wildcard text/*
    if (type.startsWith('text/') && type !== 'text/html') {
      if (type === 'text/markdown') return 'md';
    }
  }
  return 'html';
}

app.use((req, res, next) => {
  req.preferredFormat = negotiateContentType(req.headers.accept);
  // Allow override via query parameter (supports short names: html, md, markdown, json)
  if (req.query.format && FORMAT_ALIASES[req.query.format.toLowerCase()]) {
    req.preferredFormat = FORMAT_ALIASES[req.query.format.toLowerCase()];
  }
  next();
});

// ============================================
// Markdown Parser Setup
// ============================================
const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      symbol: '#',
      renderAttrs: () => ({ class: 'anchor-link', ariaLabel: 'Link to this section' }),
    }),
    level: [1, 2, 3, 4],
  })
  .use(markdownItToc, {
    containerClass: 'table-of-contents',
    listClass: 'toc-list',
    itemClass: 'toc-item',
    linkClass: 'toc-link',
    level: [2, 3],
  });

// ============================================
// Template Data & SEO Configuration
// ============================================
const SITE_CONFIG = {
  name: 'Pyramid Solutions',
  tagline: 'Premier HR Consultancy & Outsourcing',
  description: 'Expert HR Consulting, Recruitment, BPO, HRO, and End-to-End Outsourcing solutions alongside professional training to elevate your organization.',
  url: 'https://pyramid-solutions.vercel.app',
  ogImage: '/static/og-image.jpg',
  twitterHandle: '@pyramidsolutions',
  contact: {
    email: 'hello@pyramidsolutions.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, Suite 400, San Francisco, CA 94105',
  },
  social: {
    linkedin: 'https://linkedin.com/company/pyramid-solutions',
    twitter: 'https://twitter.com/pyramidsolutions',
    facebook: 'https://facebook.com/pyramidsolutions',
  },
};

const PAGES = {
  index: {
    title: 'Pyramid Solutions — HR Consulting, Recruitment & Outsourcing',
    description: 'Expert HR Consulting, Recruitment, BPO, HRO, and End-to-End Outsourcing solutions alongside professional training to elevate your organization.',
    keywords: 'HR consultancy, HR advisory, Change Management, Org Design, Business Process Outsourcing, BPO, HR Outsourcing, HRO, Talent Outsourcing, End-to-End Outsourcing, Permanent Recruitment, IT Recruitment, Non-IT Recruitment, Executive Hiring',
    canonical: '/',
    sections: ['hero', 'trust', 'consulting', 'services', 'recruitment', 'outsourcing', 'training', 'stories', 'about', 'faq', 'contact'],
  },
  consulting: {
    title: 'HR Consulting & Advisory | Pyramid Solutions',
    description: 'Strategic HR consulting, compliance, employee relations, compensation structuring, fractional HR leadership, and organizational design.',
    keywords: 'HR consulting, HR advisory, HR compliance, employee relations, compensation benefits, fractional HR, organizational design, HR technology',
    canonical: '/consulting',
    sections: ['consulting', 'process'],
  },
  recruitment: {
    title: 'Recruitment & Staffing Services | Pyramid Solutions',
    description: 'Permanent placement, contract staffing, executive search, IT & non-IT recruitment, campus hiring, and RPO solutions.',
    keywords: 'recruitment, staffing, permanent placement, contract staffing, executive search, IT recruitment, campus hiring, RPO',
    canonical: '/recruitment',
    sections: ['recruitment', 'process', 'job-listings'],
  },
  outsourcing: {
    title: 'BPO & HR Outsourcing Solutions | Pyramid Solutions',
    description: 'Business Process Outsourcing (BPO), HR Outsourcing (HRO), payroll outsourcing, compliance outsourcing, and end-to-end outsourcing.',
    keywords: 'BPO, business process outsourcing, HRO, HR outsourcing, payroll outsourcing, compliance outsourcing, talent outsourcing',
    canonical: '/outsourcing',
    sections: ['outsourcing', 'benefits'],
  },
  training: {
    title: 'Professional Training & Development | Pyramid Solutions',
    description: 'HR certification courses, leadership development, soft skills training, legal compliance training, and custom corporate training.',
    keywords: 'professional training, HR certification, leadership development, soft skills, compliance training, corporate training',
    canonical: '/training',
    sections: ['training', 'courses', 'categories'],
  },
  stories: {
    title: 'Success Stories | Pyramid Solutions',
    description: 'Case studies and testimonials from clients who transformed their HR with Pyramid Solutions.',
    keywords: 'success stories, case studies, testimonials, HR transformation, client success',
    canonical: '/stories',
    sections: ['stories'],
  },
  about: {
    title: 'About Us | Pyramid Solutions',
    description: 'Learn about Pyramid Solutions\' mission, values, and team. Building exceptional teams and streamlined operations.',
    keywords: 'about pyramid solutions, HR company mission, values, team, fractional HR leadership',
    canonical: '/about',
    sections: ['about', 'values', 'team'],
  },
  faq: {
    title: 'Frequently Asked Questions | Pyramid Solutions',
    description: 'Answers to common questions about our HR consulting, recruitment, outsourcing, and training services.',
    keywords: 'FAQ, frequently asked questions, HR services questions, recruitment guarantee, fractional HR',
    canonical: '/faq',
    sections: ['faq'],
  },
  contact: {
    title: 'Contact Us | Pyramid Solutions',
    description: 'Get in touch with Pyramid Solutions for HR consulting, recruitment, outsourcing, and training services.',
    keywords: 'contact, HR consulting contact, recruitment agency contact, outsourcing services contact',
    canonical: '/contact',
    sections: ['contact'],
  },
};

// ============================================
// Template Rendering Functions
// ============================================
function readTemplate(name) {
  const templatePath = path.join(__dirname, 'templates', `${name}.md`);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }
  return null;
}

function readHtmlTemplate(name) {
  const templatePath = path.join(__dirname, 'templates', `${name}.html`);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }
  return null;
}

function generateSeoHead(pageData, pageName) {
  const structuredData = generateStructuredData(pageData, pageName);
  return `<!-- Primary Meta Tags -->
    <title>${escapeHtml(pageData.title)}</title>
    <meta name="title" content="${escapeHtml(pageData.title)}">
    <meta name="description" content="${escapeHtml(pageData.description)}">
    <meta name="keywords" content="${escapeHtml(pageData.keywords)}">
    <meta name="author" content="${SITE_CONFIG.name}">
    <meta name="robots" content="index, follow">

    <!-- Canonical URL -->
    <link rel="canonical" href="${SITE_CONFIG.url}${pageData.canonical}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_CONFIG.url}${pageData.canonical}">
    <meta property="og:title" content="${escapeHtml(pageData.title)}">
    <meta property="og:description" content="${escapeHtml(pageData.description)}">
    <meta property="og:image" content="${SITE_CONFIG.url}${SITE_CONFIG.ogImage}">
    <meta property="og:site_name" content="${SITE_CONFIG.name}">
    <meta property="og:locale" content="en_US">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${SITE_CONFIG.twitterHandle}">
    <meta name="twitter:title" content="${escapeHtml(pageData.title)}">
    <meta name="twitter:description" content="${escapeHtml(pageData.description)}">
    <meta name="twitter:image" content="${SITE_CONFIG.url}${SITE_CONFIG.ogImage}">

    <!-- Additional SEO Meta Tags -->
    <meta name="theme-color" content="#ff385c">
    <meta name="msapplication-TileColor" content="#ff385c">
    <link rel="icon" type="image/svg+xml" href="/static/logo.svg">
    <link rel="manifest" href="/static/site.webmanifest">

    <!-- Preload critical resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
    </script>`;
}

function renderMarkdown(templateName, data = {}) {
  const template = readTemplate(templateName);
  if (!template) return null;

  // Simple template variable replacement
  let content = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    content = content.replace(placeholder, String(value));
  }

  // Pre-process markdown link class annotations e.g. [Text](url){.btn-primary .extra}
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)\{([^{}]+)\}/g, (match, text, href, attr) => {
    const classes = attr
      .split(/\s+/)
      .filter(c => c.startsWith('.'))
      .map(c => c.slice(1))
      .join(' ');
    if (classes) {
      return `<a href="${href}" class="${classes}">${text}</a>`;
    }
    return match;
  });

  return md.render(content);
}

function renderHTML(templateName, data = {}) {
  const pageData = PAGES[templateName] || PAGES.index;

  // 1. Direct index.html rendering (Full single-page application)
  if (templateName === 'index') {
    let indexHtml = readHtmlTemplate('index');
    if (indexHtml) {
      indexHtml = indexHtml.replace(/<head>([\s\S]*?)<style>/i, `<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  ${generateSeoHead(pageData, 'index')}\n  <style>`);
      indexHtml = indexHtml.replace(/{%[\s\S]*?%}/g, '');
      indexHtml = indexHtml.replace(/{{[\s\S]*?}}/g, '');
      return indexHtml;
    }
  }

  // 2. Specific page HTML template (extends base.html)
  const pageHtml = readHtmlTemplate(templateName);
  const baseHtml = readHtmlTemplate('base');

  if (pageHtml && baseHtml) {
    const contentMatch = pageHtml.match(/{%\s*block\s+content\s*%}([\s\S]*?){%\s*endblock\s*%}/);
    const content = contentMatch ? contentMatch[1] : pageHtml;

    let fullHtml = baseHtml.replace(/{%\s*block\s+content\s*%}{%\s*endblock\s*%}/, content);
    fullHtml = fullHtml.replace(/<head>([\s\S]*?)<style>/i, `<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  ${generateSeoHead(pageData, templateName)}\n  <style>`);
    fullHtml = fullHtml.replace(/{%\s*block\s+extra_head\s*%}{%\s*endblock\s*%}/, '');
    fullHtml = fullHtml.replace(/{%\s*block\s+scripts\s*%}{%\s*endblock\s*%}/, '');

    // Set active nav tabs
    fullHtml = fullHtml.replace(/{%\s*if\s+active_page\s*==\s*'([^']+)'\s*%}active{%\s*endif\s*%}/g, (match, page) => {
      return page === templateName ? 'active' : '';
    });
    fullHtml = fullHtml.replace(/{%\s*if\s+active_page\s*==\s*'faq'\s*%}style="font-weight:\s*var\(--fw-bold\);"{%\s*endif\s*%}/g, () => {
      return templateName === 'faq' ? 'style="font-weight: var(--fw-bold);"' : '';
    });

    fullHtml = fullHtml.replace(/{%[\s\S]*?%}/g, '');
    fullHtml = fullHtml.replace(/{{[\s\S]*?}}/g, '');

    return fullHtml;
  }

  // 3. Fallback: Markdown rendering with layout wrapper
  const markdownContent = renderMarkdown(templateName, data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${generateSeoHead(pageData, templateName)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/styles.css">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${renderHeader(templateName)}
  <main id="main-content">
    ${markdownContent ? `<div class="container markdown-content reveal">${markdownContent}</div>` : '<div class="container markdown-content"><h1>Page Not Found</h1><p>The requested page could not be found.</p></div>'}
  </main>
  <a href="/contact" class="float-contact" aria-label="Contact Us">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  ${renderFooter()}
  <script src="/static/app.js" defer></script>
</body>
</html>`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateStructuredData(pageData, pageName) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageData.title,
    description: pageData.description,
    url: `${SITE_CONFIG.url}${pageData.canonical}`,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/static/logo.svg`,
      },
    },
  };

  // Add service-specific schemas
  if (pageName === 'consulting') {
    return {
      ...baseSchema,
      '@type': 'Service',
      serviceType: 'HR Consulting',
      provider: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
      },
      areaServed: 'Global',
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: `${SITE_CONFIG.url}/contact`,
      },
    };
  }

  if (pageName === 'recruitment') {
    return {
      ...baseSchema,
      '@type': 'EmploymentAgency',
      name: `${SITE_CONFIG.name} - Recruitment Services`,
      description: pageData.description,
      url: `${SITE_CONFIG.url}/recruitment`,
      hiringOrganization: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
      },
    };
  }

  if (pageName === 'training') {
    return {
      ...baseSchema,
      '@type': 'Course',
      name: 'Professional HR Training Programs',
      description: pageData.description,
      provider: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
      },
    };
  }

  if (pageName === 'contact') {
    return {
      ...baseSchema,
      '@type': 'ContactPage',
      mainEntity: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        email: SITE_CONFIG.contact.email,
        telephone: SITE_CONFIG.contact.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Business Ave, Suite 400',
          addressLocality: 'San Francisco',
          addressRegion: 'CA',
          postalCode: '94105',
          addressCountry: 'US',
        },
      },
    };
  }

  return {
    ...baseSchema,
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function renderHeader(activePage = 'index') {
  return `
<header class="top-nav" id="topNav" role="banner">
  <a href="/" class="nav-brand" aria-label="${SITE_CONFIG.name} Home">
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M18 2L34 30H2L18 2Z" fill="currentColor" opacity="0.9"/>
      <path d="M18 10L28 28H8L18 10Z" fill="#fff" opacity="0.7"/>
    </svg>
    <span>${SITE_CONFIG.name}</span>
  </a>
  <nav class="nav-center" aria-label="Main navigation">
    <a href="/" class="nav-tab ${activePage === 'index' ? 'active' : ''}" data-section="home">
      <svg class="nav-icon" viewBox="0 0 28 28" fill="none"><rect x="2" y="10" width="24" height="16" rx="3" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M5 10V6L14 2l9 4v4" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
      Home
    </a>
    <a href="/consulting" class="nav-tab ${activePage === 'consulting' ? 'active' : ''}" data-section="consulting">
      <svg class="nav-icon" viewBox="0 0 28 28" fill="none"><path d="M14 2L26 24H2L14 2Z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M14 10V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="14" cy="20" r="1" fill="currentColor"/></svg>
      Consulting
    </a>
    <a href="/recruitment" class="nav-tab ${activePage === 'recruitment' ? 'active' : ''}" data-section="recruitment">
      <svg class="nav-icon" viewBox="0 0 28 28" fill="none"><circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M14 14l8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      Recruitment
    </a>
    <a href="/outsourcing" class="nav-tab ${activePage === 'outsourcing' ? 'active' : ''}" data-section="outsourcing">
      <svg class="nav-icon" viewBox="0 0 28 28" fill="none"><path d="M4 14h20M14 4v20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="14" cy="14" r="10" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
      Outsourcing
    </a>
    <a href="/training" class="nav-tab ${activePage === 'training' ? 'active' : ''}" data-section="training">
      <svg class="nav-icon" viewBox="0 0 28 28" fill="none"><rect x="3" y="5" width="22" height="18" rx="3" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M10 13l3 3 5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      Training
      <span class="badge-new">NEW</span>
    </a>
    <a href="/stories" class="nav-tab ${activePage === 'stories' ? 'active' : ''}" data-section="stories">
      <svg class="nav-icon" viewBox="0 0 28 28" fill="none"><path d="M5 4h18a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8 9h12M8 14h12M8 19h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      Stories
    </a>
    <a href="/about" class="nav-tab ${activePage === 'about' ? 'active' : ''}" data-section="about">
      <svg class="nav-icon" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="11" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M14 12v7M14 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      About
    </a>
  </nav>
  <div class="nav-right">
    <a href="/faq" ${activePage === 'faq' ? 'style="font-weight: var(--fw-bold);"' : ''}>FAQ</a>
    <a href="/contact" class="btn-contact-nav">Contact Us</a>
    <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobileMenu">
      <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
    </button>
  </div>
</header>
<div class="mobile-menu" id="mobileMenu" aria-hidden="true" role="navigation" aria-label="Mobile menu">
  <a href="/" class="mobile-nav-link ${activePage === 'index' ? 'active' : ''}">Home</a>
  <a href="/consulting" class="mobile-nav-link ${activePage === 'consulting' ? 'active' : ''}">HR Consulting</a>
  <a href="/recruitment" class="mobile-nav-link ${activePage === 'recruitment' ? 'active' : ''}">Recruitment Services</a>
  <a href="/outsourcing" class="mobile-nav-link ${activePage === 'outsourcing' ? 'active' : ''}">Outsourcing Solutions</a>
  <a href="/training" class="mobile-nav-link ${activePage === 'training' ? 'active' : ''}">Training Courses</a>
  <a href="/stories" class="mobile-nav-link ${activePage === 'stories' ? 'active' : ''}">Success Stories</a>
  <a href="/about" class="mobile-nav-link ${activePage === 'about' ? 'active' : ''}">About Us</a>
  <a href="/faq" class="mobile-nav-link ${activePage === 'faq' ? 'active' : ''}">FAQ</a>
  <a href="/contact" class="mobile-nav-link mobile-cta">Contact Us</a>
</div>`;
}

function renderFooter() {
  return `
<footer class="footer" role="contentinfo">
  <div class="footer-grid">
    <div class="footer-col">
      <h5>${SITE_CONFIG.name}</h5>
      <p style="color: var(--color-muted); font-size: var(--fs-body-sm); line-height: var(--lh-relaxed);">
        Building exceptional teams & streamlined operations through strategic HR partnership.
      </p>
    </div>
    <div class="footer-col">
      <h5>Services</h5>
      <a href="/consulting">HR Consulting</a>
      <a href="/recruitment">Recruitment</a>
      <a href="/outsourcing">Outsourcing</a>
      <a href="/training">Training</a>
    </div>
    <div class="footer-col">
      <h5>Company</h5>
      <a href="/about">About Us</a>
      <a href="/stories">Success Stories</a>
      <a href="/faq">FAQ</a>
      <a href="/contact">Contact</a>
    </div>
    <div class="footer-col">
      <h5>Resources</h5>
      <a href="/blog">Blog</a>
      <a href="/resources">Whitepapers</a>
      <a href="/webinars">Webinars</a>
      <a href="/careers">Careers</a>
    </div>
    <div class="footer-col">
      <h5>Legal</h5>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/cookies">Cookie Policy</a>
      <a href="/compliance">Compliance</a>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; ${new Date().getFullYear()} ${SITE_CONFIG.name}. All rights reserved.</p>
    <div class="footer-bottom-links">
      <a href="${SITE_CONFIG.social.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
      <a href="${SITE_CONFIG.social.twitter}" target="_blank" rel="noopener noreferrer" aria-label="Twitter">Twitter</a>
      <a href="${SITE_CONFIG.social.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook">Facebook</a>
    </div>
  </div>
</footer>`;
}

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'pyramid-solutions', timestamp: new Date().toISOString() });
});

// Sitemap generation
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = SITE_CONFIG.url;
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = Object.entries(PAGES).map(([key, page]) => `
  <url>
    <loc>${baseUrl}${page.canonical}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${key === 'index' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_CONFIG.url}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 10`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

// Main page routes with content negotiation
app.get(['/', '/index'], (req, res) => handlePageRequest(req, res, 'index'));
app.get('/consulting', (req, res) => handlePageRequest(req, res, 'consulting'));
app.get('/recruitment', (req, res) => handlePageRequest(req, res, 'recruitment'));
app.get('/outsourcing', (req, res) => handlePageRequest(req, res, 'outsourcing'));
app.get('/training', (req, res) => handlePageRequest(req, res, 'training'));
app.get('/stories', (req, res) => handlePageRequest(req, res, 'stories'));
app.get('/about', (req, res) => handlePageRequest(req, res, 'about'));
app.get('/faq', (req, res) => handlePageRequest(req, res, 'faq'));
app.get('/contact', (req, res) => handlePageRequest(req, res, 'contact'));

// API endpoint for explicit format selection
app.get('/api/content/:page', (req, res) => {
  const pageName = req.params.page;
  const format = req.query.format || req.preferredFormat;

  if (!PAGES[pageName] && pageName !== 'index') {
    return res.status(404).json({ error: 'Page not found' });
  }

  const templateName = pageName === 'index' ? 'index' : pageName;

  if (format === 'md' || format === 'markdown') {
    const content = renderMarkdown(templateName);
    if (!content) {
      return res.status(404).json({ error: 'Markdown content not found' });
    }
    res.set('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(content);
  }

  if (format === 'json') {
    const content = renderMarkdown(templateName);
    return res.json({
      page: templateName,
      title: PAGES[templateName]?.title,
      description: PAGES[templateName]?.description,
      content,
      format: 'markdown',
      htmlUrl: `${SITE_CONFIG.url}/${templateName}`,
      markdownUrl: `${SITE_CONFIG.url}/api/content/${templateName}?format=markdown`,
      jsonUrl: `${SITE_CONFIG.url}/api/content/${templateName}?format=json`,
    });
  }

  // Default HTML
  const html = renderHTML(templateName);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Generic page handler with content negotiation
function handlePageRequest(req, res, pageName) {
  const format = req.preferredFormat;

  if (format === 'md' || format === 'markdown') {
    const content = renderMarkdown(pageName);
    if (!content) {
      return res.status(404).send('# Not Found\n\nThe requested page was not found.');
    }
    res.set('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(content);
  }

  if (format === 'json') {
    const content = renderMarkdown(pageName);
    return res.json({
      page: pageName,
      title: PAGES[pageName]?.title,
      description: PAGES[pageName]?.description,
      content,
      format: 'markdown',
    });
  }

  // Default HTML
  const html = renderHTML(pageName);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// 404 handler
app.use((req, res) => {
  const format = req.preferredFormat;

  if (format === 'md' || format === 'markdown') {
    res.status(404).set('Content-Type', 'text/markdown; charset=utf-8');
    return res.send('# Not Found\n\nThe requested page was not found.');
  }

  if (format === 'json') {
    return res.status(404).json({ error: 'Not found', message: 'The requested resource was not found' });
  }

  res.status(404).send(renderHTML('404'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const format = req.preferredFormat;

  if (format === 'md' || format === 'markdown') {
    return res.status(500).set('Content-Type', 'text/markdown; charset=utf-8')
      .send('# Server Error\n\nAn internal server error occurred.');
  }

  if (format === 'json') {
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(500).send(renderHTML('500'));
});

// ============================================
// Export for Vercel
// ============================================
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}