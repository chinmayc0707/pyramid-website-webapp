/**
 * Pyramid Solutions - Main Application Script
 * Handles navigation, animations, forms, and interactive elements
 */

(function() {
  'use strict';

  // ============================================
  // Utility Functions
  // ============================================
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  function throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ============================================
  // Navigation & Mobile Menu
  // ============================================
  function initNavigation() {
    const hamburger = $('.hamburger');
    const mobileMenu = $('#mobileMenu');
    const navLinks = $$('.mobile-nav-link, .nav-tab');
    const topNav = $('.top-nav');

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
        mobileMenu.setAttribute('aria-hidden', !isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      // Close mobile menu on link click
      $$('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          mobileMenu.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          mobileMenu.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        });
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
          hamburger.classList.remove('active');
          mobileMenu.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          mobileMenu.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
      });
    }

    // Navbar scroll effect
    if (topNav) {
      const handleScroll = throttle(() => {
        if (window.scrollY > 50) {
          topNav.classList.add('scrolled');
        } else {
          topNav.classList.remove('scrolled');
        }
      }, 100);

      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Active nav tab based on scroll position
    const sections = $$('section[id], div[id]');
    const navTabs = $$('.nav-tab[data-section]');

    if (sections.length && navTabs.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navTabs.forEach(tab => {
              tab.classList.toggle('active', tab.dataset.section === id);
            });
          }
        });
      }, {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.1
      });

      sections.forEach(section => observer.observe(section));
    }
  }

  // ============================================
  // Scroll Animations (Intersection Observer)
  // ============================================
  function initScrollAnimations() {
    const revealElements = $$('.reveal');

    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // ============================================
  // FAQ Accordion
  // ============================================
  function initFAQ() {
    const faqQuestions = $$('.faq-question');

    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const faqItem = question.closest('.faq-item');
        const isOpen = faqItem.classList.toggle('open');
        question.setAttribute('aria-expanded', isOpen);
      });

      // Keyboard support
      question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          question.click();
        }
      });
    });
  }

  // ============================================
  // Course Filters
  // ============================================
  function initCourseFilters() {
    const filterButtons = $$('.course-filter-btn');
    const courseCards = $$('.course-card');

    if (filterButtons.length === 0 || courseCards.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Filter cards
        courseCards.forEach(card => {
          const category = card.dataset.category;
          const shouldShow = filter === 'all' || category === filter;
          card.style.display = shouldShow ? 'flex' : 'none';
        });
      });
    });
  }

  // ============================================
  // Counter Animation for Hero Stats
  // ============================================
  function initCounterAnimation() {
    const counters = $$('.hero-stat .number[data-target]');

    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.dataset.target, 10);
          const duration = 2000;
          const step = target / (duration / 16);
          let current = 0;

          const updateCounter = () => {
            current += step;
            if (current < target) {
              counter.textContent = Math.floor(current).toLocaleString();
              requestAnimationFrame(updateCounter);
            } else {
              counter.textContent = target.toLocaleString();
            }
          };

          updateCounter();
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  // ============================================
  // Contact Form Handling
  // ============================================
  function initContactForm() {
    const form = $('.contact-form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const successMsg = form.querySelector('.form-success');
      const formData = new FormData(form);

      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        // In production, this would be an actual API call
        // const response = await fetch('/api/contact', {
        //   method: 'POST',
        //   body: formData
        // });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success
        form.reset();
        if (successMsg) {
          successMsg.classList.add('visible');
          successMsg.textContent = 'Thank you! We\'ll be in touch within 24 hours.';
        }

        // Track form submission (analytics)
        if (typeof gtag !== 'undefined') {
          gtag('event', 'generate_lead', {
            event_category: 'Contact',
            event_label: 'Contact Form'
          });
        }
      } catch (error) {
        console.error('Form submission error:', error);
        if (successMsg) {
          successMsg.classList.add('visible');
          successMsg.style.background = '#fef2f2';
          successMsg.style.borderColor = '#fecaca';
          successMsg.style.color = '#991b1b';
          successMsg.textContent = 'Something went wrong. Please try again or email us directly.';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      }
    });
  }

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = $('.top-nav')?.offsetHeight || 80;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without scrolling
        history.pushState(null, '', href);

        // Focus target for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  }

  // ============================================
  // Floating Contact Button
  // ============================================
  function initFloatContact() {
    const floatBtn = $('.float-contact');

    if (!floatBtn) return;

    floatBtn.addEventListener('click', () => {
      const contactSection = $('#contact');
      if (contactSection) {
        const navHeight = $('.top-nav')?.offsetHeight || 80;
        const targetPosition = contactSection.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      } else {
        // Navigate to contact page
        window.location.href = '/contact';
      }
    });
  }

  // ============================================
  // Lazy Load Images
  // ============================================
  function initLazyLoad() {
    const images = $$('img[data-src]');

    if (images.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });

    images.forEach(img => observer.observe(img));
  }

  // ============================================
  // Performance: Preload Critical Resources
  // ============================================
  function preloadCriticalResources() {
    // Preload fonts
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.href = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
    fontPreload.as = 'font';
    fontPreload.type = 'font/woff2';
    fontPreload.crossOrigin = 'anonymous';
    document.head.appendChild(fontPreload);
  }

  // ============================================
  // Analytics Helpers
  // ============================================
  function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
    if (typeof fbq !== 'undefined') {
      fbq('trackCustom', eventName, parameters);
    }
  }

  function initAnalyticsTracking() {
    // Track CTA clicks
    $$('a[href="#contact"], .btn-contact-nav, .mobile-cta, .float-contact').forEach(el => {
      el.addEventListener('click', () => {
        trackEvent('click_cta', { cta_location: el.className });
      });
    });

    // Track navigation clicks
    $$('.nav-tab, .mobile-nav-link').forEach(el => {
      el.addEventListener('click', () => {
        trackEvent('navigation', { destination: el.textContent.trim() });
      });
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', throttle(() => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if ([25, 50, 75, 100].includes(scrollPercent)) {
          trackEvent('scroll_depth', { percent: scrollPercent });
        }
      }
    }, 500), { passive: true });
  }

  // ============================================
  // Initialize All Components
  // ============================================
  function init() {
    // Core functionality
    initNavigation();
    initScrollAnimations();
    initFAQ();
    initCourseFilters();
    initCounterAnimation();
    initContactForm();
    initSmoothScroll();
    initFloatContact();
    initLazyLoad();
    preloadCriticalResources();

    // Analytics (only in production)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      initAnalyticsTracking();
    }

    // Mark page as loaded for CSS animations
    document.body.classList.add('loaded');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for testing
  window.PyramidSolutions = {
    trackEvent,
    initNavigation,
    initScrollAnimations,
    initFAQ,
    initCourseFilters,
    initCounterAnimation,
    initContactForm
  };
})();