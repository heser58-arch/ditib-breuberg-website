/**
 * DITIB Breuberg - Main JavaScript
 * Navigation, scroll effects, gallery, forms
 */

// ---- Navigation ----
(function initNav() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.navbar__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (!navbar) return;

  // Scroll effect
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active nav link
  const navLinks = document.querySelectorAll('.navbar__nav a, .mobile-menu__inner a');
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.replace(/\/$/, '') || '/';
    if (linkPath === currentPath || (currentPath === '/' && href === 'index.html') || (currentPath.includes(linkPath) && linkPath !== '/')) {
      link.classList.add('active');
    }
  });

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
})();

// ---- Scroll Animations (Intersection Observer) ----
(function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  elements.forEach(el => observer.observe(el));
})();

// ---- Gallery Lightbox ----
(function initGallery() {
  const items = document.querySelectorAll('.gallery-item[data-src]');
  if (!items.length) return;

  // Create lightbox
  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.92);
    display:none;align-items:center;justify-content:center;
    cursor:zoom-out;
  `;
  lightbox.innerHTML = `
    <img id="lightbox-img" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);">
    <button id="lightbox-close" aria-label="Schließen" style="position:absolute;top:20px;right:20px;color:white;font-size:2rem;background:none;border:none;cursor:pointer;line-height:1;">✕</button>
    <button id="lightbox-prev" aria-label="Zurück" style="position:absolute;left:20px;color:white;font-size:2.5rem;background:none;border:none;cursor:pointer;">‹</button>
    <button id="lightbox-next" aria-label="Weiter" style="position:absolute;right:60px;color:white;font-size:2.5rem;background:none;border:none;cursor:pointer;">›</button>
  `;
  document.body.appendChild(lightbox);

  const img = document.getElementById('lightbox-img');
  let currentIndex = 0;
  const srcs = [...items].map(i => i.dataset.src);

  function open(index) {
    currentIndex = index;
    img.src = srcs[index];
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }

  items.forEach((item, i) => item.addEventListener('click', () => open(i)));
  document.getElementById('lightbox-close').addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.getElementById('lightbox-prev').addEventListener('click', e => { e.stopPropagation(); open((currentIndex - 1 + srcs.length) % srcs.length); });
  document.getElementById('lightbox-next').addEventListener('click', e => { e.stopPropagation(); open((currentIndex + 1) % srcs.length); });

  document.addEventListener('keydown', e => {
    if (lightbox.style.display === 'flex') {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') open((currentIndex - 1 + srcs.length) % srcs.length);
      if (e.key === 'ArrowRight') open((currentIndex + 1) % srcs.length);
    }
  });
})();

// ---- Donation Amount Buttons ----
(function initDonation() {
  const btns = document.querySelectorAll('.donation-amount-btn');
  const customInput = document.getElementById('donation-custom');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (customInput) customInput.value = btn.dataset.amount || '';
    });
  });
})();

// ---- Contact Form ----
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const originalText = btn.textContent;

    btn.textContent = 'Wird gesendet…';
    btn.disabled = true;

    // Simulate async submit (replace with actual endpoint)
    await new Promise(r => setTimeout(r, 1500));

    showToast('Ihre Nachricht wurde erfolgreich gesendet!', 'success');
    form.reset();
    btn.textContent = originalText;
    btn.disabled = false;
  });
})();

// ---- Toast Notification ----
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

window.showToast = showToast;

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ---- Initialize Prayer Times ----
document.addEventListener('DOMContentLoaded', () => {
  if (window.PrayerTimes) {
    window.PrayerTimes.init();
  }
});

// ---- Announcement bar auto-scroll ----
(function initTicker() {
  const ticker = document.querySelector('.announcement-bar__inner');
  if (!ticker) return;
  // Clone for infinite scroll
  ticker.innerHTML += ticker.innerHTML;
})();
