/**
 * Longbourn Papers - Main JavaScript
 */
(function () {
    'use strict';

    // Mobile menu toggle
    var menuToggle = document.querySelector('.menu-toggle');
    var mainNav = document.querySelector('.main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function () {
            var expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            mainNav.classList.toggle('active');
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.main-nav a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768 && mainNav) {
                mainNav.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Sticky header shadow
    var header = document.querySelector('.site-header');
    if (header) {
        window.addEventListener('scroll', function () {
            header.style.boxShadow = window.scrollY > 10
                ? '0 2px 12px rgba(0,0,0,0.06)'
                : 'none';
        });
    }

    // Shop page category filter
    var filterBtns = document.querySelectorAll('.filter-btn');
    var productCards = document.querySelectorAll('.product-card[data-category]');

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var category = this.getAttribute('data-filter');

            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');

            productCards.forEach(function (card) {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });

            // Update count
            var visible = document.querySelectorAll('.product-card[data-category]:not([style*="display: none"])');
            var countEl = document.querySelector('.filter-bar__count');
            if (countEl) {
                countEl.textContent = visible.length + ' product' + (visible.length !== 1 ? 's' : '');
            }
        });
    });

    // Netlify Forms success message
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        var form = document.querySelector('.contact-form form');
        if (form) {
            form.innerHTML = '<div class="featured-text" style="padding:var(--spacing-lg) 0;"><h2>Thank You!</h2><p>Your message has been sent. We\'ll get back to you soon.</p></div>';
        }
    }
})();
