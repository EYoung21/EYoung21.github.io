/* ============================================
   ELI YOUNG — Portfolio 2026 JS
   Lenis + GSAP + ScrollTrigger + Custom Cursor
   ============================================ */

// ── Loader ──
(function initLoader() {
    const loader = document.getElementById('loader');
    const numEl = loader.querySelector('.loader-num');
    const fillEl = loader.querySelector('.loader-fill');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            numEl.textContent = '100';
            fillEl.style.width = '100%';
            setTimeout(() => {
                loader.classList.add('done');
                initSite();
            }, 600);
            return;
        }
        numEl.textContent = Math.floor(progress);
        fillEl.style.width = progress + '%';
    }, 80);
})();

function initSite() {
    initLenis();
    initCursor();
    initNav();
    initHeroAnimations();
    initScrollAnimations();
    initCounters();
    initMobileMenu();
}

// ── Lenis Smooth Scroll ──
let lenis;
function initLenis() {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                lenis.scrollTo(target, { offset: -60 });
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu.classList.contains('open')) {
                    mobileMenu.classList.remove('open');
                }
            }
        });
    });
}

// ── Custom Cursor ──
function initCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor || window.matchMedia('(max-width: 900px)').matches) return;

    const dot = cursor.querySelector('.cursor-dot');
    const circle = cursor.querySelector('.cursor-circle');
    const label = cursor.querySelector('.cursor-label');

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        cursorX += (mouseX - cursorX) * 0.12;
        cursorY += (mouseY - cursorY) * 0.12;

        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        requestAnimationFrame(animate);
    }
    animate();

    // Cursor states
    document.querySelectorAll('[data-cursor]').forEach(el => {
        const type = el.getAttribute('data-cursor');

        el.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-' + type);
            if (type === 'view') label.textContent = 'View';
            else if (type === 'drag') label.textContent = 'Drag';
        });

        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-' + type);
            label.textContent = '';
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
    });
}

// ── Navigation ──
function initNav() {
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    // Show nav after hero
    ScrollTrigger.create({
        trigger: '#about',
        start: 'top 80%',
        onEnter: () => nav.classList.add('visible'),
        onLeaveBack: () => nav.classList.remove('visible'),
    });

    // Active link highlighting
    document.querySelectorAll('.section[id]').forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => highlightLink(section.id),
            onEnterBack: () => highlightLink(section.id),
        });
    });

    function highlightLink(id) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.style.color = '';
        });
        const active = document.querySelector(`.nav-link[href="#${id}"]`);
        if (active) active.style.color = 'var(--accent)';
    }
}

// ── Mobile Menu ──
function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');

    toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.classList.toggle('open');
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('open');
            toggle.classList.remove('open');
        });
    });
}

// ── Hero Animations ──
function initHeroAnimations() {
    const tl = gsap.timeline({ delay: 0.3 });

    // Split hero title into chars
    document.querySelectorAll('.hero-title .line').forEach(line => {
        const text = line.textContent;
        line.textContent = '';
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00A0' : char;
            line.appendChild(span);
        });
    });

    const chars = document.querySelectorAll('.hero-title .char');

    tl.to(chars, {
        y: 0,
        duration: 0.9,
        stagger: 0.04,
        ease: 'power4.out',
    })
    .to('.hero-eyebrow', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
    }, '-=0.5')
    .to('.hero-description', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
    }, '-=0.3')
    .to('.hero-ctas', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
    }, '-=0.3')
    .to('.hero-stats', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
    }, '-=0.3')
    .to('.scroll-hint', {
        opacity: 1,
        duration: 0.6,
    }, '-=0.2');
}

// ── Scroll Animations ──
function initScrollAnimations() {
    // Section headings - split text
    document.querySelectorAll('[data-animate="split"]').forEach(heading => {
        const html = heading.innerHTML;
        // Split by <br> tags first, then split each segment into words
        const lines = html.split(/<br\s*\/?>/gi);
        heading.innerHTML = '';

        lines.forEach((line, lineIdx) => {
            if (lineIdx > 0) {
                heading.appendChild(document.createElement('br'));
            }
            const cleanLine = line.replace(/<[^>]*>/g, '').trim();
            const words = cleanLine.split(/\s+/).filter(w => w.length > 0);
            words.forEach((word) => {
                const wrapper = document.createElement('span');
                wrapper.style.display = 'inline-block';
                wrapper.style.overflow = 'hidden';
                wrapper.style.marginRight = '0.3em';

                const inner = document.createElement('span');
                inner.className = 'word-anim';
                inner.style.display = 'inline-block';
                inner.style.transform = 'translateY(110%)';
                inner.textContent = word;

                wrapper.appendChild(inner);
                heading.appendChild(wrapper);
            });
        });

        gsap.to(heading.querySelectorAll('.word-anim'), {
            y: 0,
            duration: 0.8,
            stagger: 0.06,
            ease: 'power4.out',
            scrollTrigger: {
                trigger: heading,
                start: 'top 85%',
                toggleActions: 'play none none none',
            }
        });
    });

    // Section labels
    gsap.utils.toArray('.section-label').forEach(label => {
        gsap.from(label, {
            opacity: 0,
            x: -20,
            duration: 0.5,
            scrollTrigger: {
                trigger: label,
                start: 'top 90%',
            }
        });
    });

    // About cards
    gsap.utils.toArray('.about-card').forEach((card, i) => {
        gsap.from(card, {
            opacity: 0,
            x: 30,
            duration: 0.6,
            delay: i * 0.1,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
            }
        });
    });

    // About text paragraphs
    gsap.utils.toArray('.about-description').forEach((p, i) => {
        gsap.from(p, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: i * 0.1,
            scrollTrigger: {
                trigger: p,
                start: 'top 90%',
            }
        });
    });

    // Experience items
    gsap.utils.toArray('.exp-item').forEach((item, i) => {
        gsap.from(item, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
            }
        });
    });

    // Featured projects
    gsap.utils.toArray('.project-featured').forEach(proj => {
        const media = proj.querySelector('.project-featured-media');
        const info = proj.querySelector('.project-featured-info');

        gsap.from(media, {
            opacity: 0,
            x: -40,
            duration: 0.8,
            scrollTrigger: {
                trigger: proj,
                start: 'top 80%',
            }
        });

        gsap.from(info, {
            opacity: 0,
            x: 40,
            duration: 0.8,
            delay: 0.2,
            scrollTrigger: {
                trigger: proj,
                start: 'top 80%',
            }
        });
    });

    // Project cards
    gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.from(card, {
            opacity: 0,
            y: 40,
            duration: 0.6,
            delay: (i % 3) * 0.1,
            scrollTrigger: {
                trigger: card,
                start: 'top 90%',
            }
        });
    });

    // Leadership cards
    gsap.utils.toArray('.leadership-card').forEach((card, i) => {
        gsap.from(card, {
            opacity: 0,
            y: 30,
            duration: 0.5,
            delay: (i % 2) * 0.1,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
            }
        });
    });

    // Skill blocks
    gsap.utils.toArray('.skill-block').forEach((block, i) => {
        gsap.from(block, {
            opacity: 0,
            y: 30,
            duration: 0.5,
            delay: i * 0.1,
            scrollTrigger: {
                trigger: block,
                start: 'top 90%',
            }
        });
    });

    // Contact links
    gsap.utils.toArray('.contact-link').forEach((link, i) => {
        gsap.from(link, {
            opacity: 0,
            y: 20,
            duration: 0.4,
            delay: i * 0.08,
            scrollTrigger: {
                trigger: link,
                start: 'top 95%',
            }
        });
    });

    // Project featured reversed items
    gsap.utils.toArray('.project-featured.reverse').forEach(proj => {
        const media = proj.querySelector('.project-featured-media');
        const info = proj.querySelector('.project-featured-info');

        // Override default direction for reversed
        gsap.set(media, { clearProps: 'x' });
        gsap.set(info, { clearProps: 'x' });

        gsap.from(media, {
            opacity: 0,
            x: 40,
            duration: 0.8,
            scrollTrigger: {
                trigger: proj,
                start: 'top 80%',
            }
        });

        gsap.from(info, {
            opacity: 0,
            x: -40,
            duration: 0.8,
            delay: 0.2,
            scrollTrigger: {
                trigger: proj,
                start: 'top 80%',
            }
        });
    });
}

// ── Counter Animation ──
function initCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));

        ScrollTrigger.create({
            trigger: el,
            start: 'top 90%',
            once: true,
            onEnter: () => {
                gsap.to({ val: 0 }, {
                    val: target,
                    duration: 2,
                    ease: 'power2.out',
                    onUpdate: function() {
                        el.textContent = Math.floor(this.targets()[0].val);
                    }
                });
            }
        });
    });
}
