/* ============================================
   ELI YOUNG — Portfolio JS 2026
   GSAP + Lenis + creative scroll animations
   ============================================ */

(() => {
    'use strict';
    // ── Theme Toggle ──
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        document.body.setAttribute('data-theme', currentTheme);
        themeToggle.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // ── Lenis smooth scroll ──
    const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
    });
    window.__portfolioLenis = lenis;

    // Lenis + ScrollTrigger sync
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // ── Magnetic Buttons (Idea 14) ──
    const magneticElements = document.querySelectorAll('.btn, .nav-resume');
    magneticElements.forEach((el) => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        });
    });



    // ── CLI Boot Sequence (Idea 3) ──
    const terminalLoader = document.getElementById('terminalLoader');
    const terminalBody = document.getElementById('terminalBody');
    
    const bootLines = [
        "[OK] Initializing boot sequence...",
        "[OK] Loading environment weights...",
        "[WARN] Sub-optimal dimensions detected. Re-calibrating...",
        "[OK] Establishing uplink to EYoung21 portfolio payload...",
        "[OK] Neural Network topology established.",
        "[OK] Allocating 5000 AlgoArena nodes...",
        "Decrypting source files... [████████████████████] 100%",
        "ACCESS GRANTED."
    ];

    function runBootSequence() {
        if (!terminalLoader || !terminalBody) return;
        
        let i = 0;
        const cursorHTML = '<span class="cursor">_</span>';
        
        function typeLine() {
            if (i >= bootLines.length) {
                // Done booting
                setTimeout(() => {
                    // GSAP 3D Shatter/Flip out
                    gsap.to("#terminalWindow", {
                        rotationX: 45,
                        rotationY: -20,
                        z: -500,
                        scale: 0.8,
                        opacity: 0,
                        duration: 1.2,
                        ease: "power3.in",
                        onComplete: () => {
                            terminalLoader.remove();
                            // TRIGGER WEBGL METAMORPHOSIS!
                            window.dispatchEvent(new Event('terminalBootComplete'));
                            document.getElementById('nav')?.classList.add('visible');
                            animateHero();
                        }
                    });
                }, 400);
                return;
            }

            const currentLine = bootLines[i];
            const div = document.createElement('div');
            div.className = 'terminal-line';
            
            // formatting based on [STATUS]
            let formattedLine = currentLine;
            if (currentLine.startsWith('[OK]')) {
                formattedLine = `<span class="status">[OK]</span> ${currentLine.substring(4)}`;
            } else if (currentLine.startsWith('[WARN]')) {
                formattedLine = `<span class="status" style="color:#ffbd2e">[WARN]</span> ${currentLine.substring(6)}`;
            } else if (currentLine === "ACCESS GRANTED.") {
                formattedLine = `<span class="highlight">${currentLine}</span>`;
            }

            // Remove old cursor
            const oldCursor = terminalBody.querySelector('.cursor');
            if (oldCursor) oldCursor.remove();

            div.innerHTML = formattedLine + (i === bootLines.length - 1 ? cursorHTML : '');
            terminalBody.appendChild(div);

            // Re-add cursor if not last line
            if (i < bootLines.length - 1) {
                const curDiv = document.createElement('div');
                curDiv.className = 'terminal-line cursor-line';
                curDiv.innerHTML = cursorHTML;
                terminalBody.appendChild(curDiv);
            }

            // Scroll to bottom
            terminalBody.scrollTop = terminalBody.scrollHeight;

            i++;
            // Variable typing speed
            const nextDelay = currentLine === "ACCESS GRANTED." ? 100 : Math.random() * 150 + 50;
            setTimeout(typeLine, nextDelay);
        }

        setTimeout(typeLine, 300); // Start after brief delay
    }

    window.addEventListener('load', runBootSequence);

    // ── Hero Animation ──
    function animateHero() {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.to('.hero-distort-canvas', { opacity: 1, y: 0, duration: 0.9 }, 0.1);

        tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8 }, 0.4);
        tl.to('.hero-description', { opacity: 1, y: 0, duration: 0.8 }, 0.6);
        tl.to('.hero-ctas', { opacity: 1, y: 0, duration: 0.8 }, 0.7);
        tl.to('.hero-stats', { opacity: 1, y: 0, duration: 0.8 }, 0.8);
        tl.to('.scroll-hint', { opacity: 0.6, duration: 1 }, 1.2);

        // Counter animation
        document.querySelectorAll('[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            gsap.to({ val: 0 }, {
                val: target,
                duration: 2,
                delay: 1,
                ease: 'power2.out',
                onUpdate: function() {
                    el.textContent = Math.floor(this.targets()[0].val).toLocaleString();
                }
            });
        });
    }

    // ── Scroll-triggered section headings ──
    function animateSplitHeadings() {
        document.querySelectorAll('[data-animate="split"]').forEach(heading => {
            // Preserve the HTML but extract text for animation
            const lines = heading.innerHTML.split('<br>');
            heading.innerHTML = '';

            lines.forEach((lineText, i) => {
                const lineWrapper = document.createElement('span');
                lineWrapper.className = 'line';
                lineWrapper.style.display = 'block';
                lineWrapper.style.overflow = 'hidden';

                const clean = lineText.replace(/<[^>]*>/g, '').trim();
                const inner = document.createElement('span');
                inner.style.display = 'inline-block';
                inner.style.transform = 'translateY(110%)';
                inner.textContent = clean;
                lineWrapper.appendChild(inner);
                heading.appendChild(lineWrapper);
            });

            const inners = heading.querySelectorAll('.line > span');
            gsap.to(inners, {
                y: 0,
                duration: 1,
                stagger: 0.12,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: heading,
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                }
            });
        });
    }

    // ── Scroll animations for cards and items ──
    function setupScrollAnimations() {
        // About cards
        gsap.utils.toArray('.about-card').forEach((card, i) => {
            gsap.from(card, {
                opacity: 0,
                x: 40,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                }
            });
        });

        // Experience items
        gsap.utils.toArray('.exp-item').forEach((item, i) => {
            gsap.from(item, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                delay: i * 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                }
            });
        });

        // Featured projects — staggered reveal with parallax
        gsap.utils.toArray('.project-featured').forEach(project => {
            const media = project.querySelector('.project-featured-media');
            const info = project.querySelector('.project-featured-info');

            gsap.from(media, {
                opacity: 0,
                y: 60,
                scale: 0.95,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: project,
                    start: 'top 80%',
                }
            });

            gsap.from(info, {
                opacity: 0,
                x: 40,
                duration: 0.8,
                delay: 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: project,
                    start: 'top 80%',
                }
            });

            // Parallax on scroll
            if (media) {
                gsap.to(media, {
                    y: -30,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: project,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1,
                    }
                });
            }
        });

        // Project cards
        gsap.utils.toArray('.project-card').forEach((card, i) => {
            gsap.from(card, {
                opacity: 0,
                y: 40,
                duration: 0.7,
                delay: i * 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%',
                }
            });
        });

        // Leadership cards
        gsap.utils.toArray('.leadership-card').forEach((card, i) => {
            gsap.from(card, {
                opacity: 0,
                y: 30,
                scale: 0.96,
                duration: 0.7,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                }
            });
        });

        // Contact heading
        const contactHeading = document.querySelector('.contact-heading');
        if (contactHeading) {
            gsap.from(contactHeading, {
                scale: 0.8,
                opacity: 0,
                duration: 1.2,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: contactHeading,
                    start: 'top 85%',
                }
            });
        }

        // Contact links
        gsap.utils.toArray('.contact-link').forEach((link, i) => {
            gsap.from(link, {
                opacity: 0,
                y: 20,
                duration: 0.6,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: link,
                    start: 'top 90%',
                }
            });
        });

        // Skill blocks
        gsap.utils.toArray('.skill-block').forEach((block, i) => {
            gsap.from(block, {
                opacity: 0,
                y: 30,
                duration: 0.7,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: block,
                    start: 'top 88%',
                }
            });
        });

        // About descriptions
        gsap.utils.toArray('.about-description').forEach((p, i) => {
            gsap.from(p, {
                opacity: 0,
                y: 20,
                duration: 0.7,
                delay: i * 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: p,
                    start: 'top 85%',
                }
            });
        });
    }

    // ── Hero grid dissolve when scrolling off intro ──
    function setupHeroGridDissolve() {
        const grid = document.getElementById('hero-grid-dissolve');
        const hero = document.getElementById('hero');
        if (!grid || !hero || typeof ScrollTrigger === 'undefined') return;

        if (!grid.childElementCount) {
            const cols = 12;
            const rows = 8;
            const total = cols * rows;
            for (let i = 0; i < total; i += 1) {
                const cell = document.createElement('span');
                cell.className = 'grid-cell';
                const col = i % cols;
                const row = Math.floor(i / cols);
                const waveDelay = row * 35 + col * 18 + Math.floor(Math.random() * 120);
                const xJitter = Math.round((Math.random() - 0.5) * 20);
                const yJitter = -12 - Math.round(Math.random() * 22);
                cell.style.setProperty('--delay', String(waveDelay));
                cell.style.setProperty('--x-jitter', `${xJitter}px`);
                cell.style.setProperty('--y-jitter', `${yJitter}px`);
                grid.appendChild(cell);
            }
        }

        let didDissolve = false;
        const playDissolve = () => {
            grid.classList.remove('active');
            // Force reflow so class re-add replays animation.
            void grid.offsetWidth;
            grid.classList.add('active');
        };

        ScrollTrigger.create({
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            onUpdate: (self) => {
                const mobile = window.matchMedia('(max-width: 768px)').matches;
                const triggerAt = mobile ? 0.5 : 0.58;
                const resetAt = mobile ? 0.28 : 0.35;
                if (self.progress > triggerAt && !didDissolve) {
                    didDissolve = true;
                    playDissolve();
                }
                if (self.progress < resetAt && didDissolve) {
                    didDissolve = false;
                    grid.classList.remove('active');
                }
            }
        });
    }

    // ── Mobile Menu ──
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    navToggle?.addEventListener('click', () => {
        navToggle.classList.toggle('open');
        mobileMenu?.classList.toggle('open');
    });

    mobileMenu?.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle?.classList.remove('open');
            mobileMenu?.classList.remove('open');
        });
    });

    // ── Nav scroll behavior ──
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('nav');
        const scrollY = window.scrollY;

        if (scrollY > 100 && nav && !nav.classList.contains('visible')) {
            nav.classList.add('visible');
        }
    });

    // ── Smooth scroll for anchor links (only #section — not href="#" that later becomes a full URL)
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            if (href === '#') {
                e.preventDefault();
                return;
            }
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                lenis.scrollTo(target, { offset: -60 });
            }
        });
    });

    // ── Idea 7: Horizontal Scroll Projects ──
    const horizontalContainer = document.querySelector('.horizontal-container');
    const horizontalWrapper = document.querySelector('.horizontal-wrapper');
    if (horizontalContainer && horizontalWrapper) {
        let mm = gsap.matchMedia();
        mm.add("(min-width: 769px)", () => {
            gsap.to(horizontalContainer, {
                x: () => -(horizontalContainer.scrollWidth - window.innerWidth + 80),
                ease: "none",
                scrollTrigger: {
                    trigger: horizontalWrapper,
                    pin: true,
                    scrub: 1,
                    end: () => "+=" + horizontalContainer.scrollWidth
                }
            });
        });
    }

    // ── Init ──
    window.addEventListener('load', () => {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            setupHeroGridDissolve();
            animateSplitHeadings();
            setupScrollAnimations();
        }, 500);
    });

    // ── Idea 12B: Text Scramble (Hero) ──
        const roles = [
            "Computer Science · Machine Learning · Product", 
            "Co-Founder @ AlgoArena", 
            "ML Researcher @ UIUC", 
            "Full-Stack Engineer", 
            "Godot Game Developer"
        ];
        let roleIndex = 0;
        const scrambleEl = document.querySelector('.hero-eyebrow');
        
        function scrambleText(element, newText, duration = 800) {
            const chars = '!<>-_\\\\/[]{}—=+*^?#_';
            const oldText = element.innerText;
            const length = Math.max(oldText.length, newText.length);
            let start = Date.now();
            
            function update() {
                let progress = (Date.now() - start) / duration;
                if (progress > 1) {
                    element.innerText = newText;
                    return;
                }
                let result = '';
                for (let i = 0; i < length; i++) {
                    if (i < progress * length) {
                        result += newText[i] || '';
                    } else {
                        result += chars[Math.floor(Math.random() * chars.length)];
                    }
                }
                element.innerText = result;
                requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
        }
    
        setInterval(() => {
            roleIndex = (roleIndex + 1) % roles.length;
            if(scrambleEl) scrambleText(scrambleEl, roles[roleIndex]);
        }, 3000);
    
        // ── Idea 11: 3D Tilt Cards ──
        const tiltCards = document.querySelectorAll('.project-card, .about-card, .project-featured-info');
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const rotateX = (y / (rect.height / 2)) * -5;
                const rotateY = (x / (rect.width / 2)) * 5;
                
                gsap.to(card, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    transformPerspective: 1000,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.3)"
                });
            });
        });
    
    })();
