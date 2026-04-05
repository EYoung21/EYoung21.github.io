/* ============================================
   ELI YOUNG — Portfolio JS 2026
   GSAP + Lenis + creative scroll animations
   ============================================ */

(() => {
    'use strict';

    // ── Lenis smooth scroll ──
    const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
    });

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

        // Animate each character in the title
        const titleLines = document.querySelectorAll('.hero-title .line');
        titleLines.forEach(line => {
            const text = line.textContent;
            line.textContent = '';
            [...text].forEach(char => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = char === ' ' ? '\u00A0' : char;
                line.appendChild(span);
            });
        });

        const allChars = document.querySelectorAll('.hero-title .char');
        tl.to(allChars, {
            y: 0,
            duration: 1.2,
            stagger: 0.04,
            ease: 'power4.out',
        }, 0.1);

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

    // ── Smooth scroll for anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) lenis.scrollTo(target, { offset: -60 });
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
            animateSplitHeadings();
            setupScrollAnimations();
        }, 500);
    });

    // ── ThreeJS WebGL Metamorphosis: Data to Structure (Idea 1 - acko.net style) ──
    const canvas = document.getElementById('theme-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.z = 150;

        // 1. Generate Target Coordinates from Offscreen Canvas (Text)
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 1000;
        textCanvas.height = 300;
        const ctx = textCanvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 160px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EYOUNG', textCanvas.width / 2, textCanvas.height / 2);

        const imgData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
        const textPoints = [];
        
        // Sample every 4th pixel to limit point count
        for (let y = 0; y < textCanvas.height; y += 4) {
            for (let x = 0; x < textCanvas.width; x += 4) {
                const index = (y * textCanvas.width + x) * 4;
                const r = imgData[index];
                if (r > 128) {
                    // Map from canvas space (0,0 top-left) to Three.js space (0,0 center)
                    const pX = (x - textCanvas.width / 2) * 0.3;
                    const pY = (textCanvas.height / 2 - y) * 0.3;
                    textPoints.push(new THREE.Vector3(pX, pY, (Math.random() - 0.5) * 5));
                }
            }
        }

        const numParticles = Math.max(textPoints.length, 3000); // Ensure a good density
        const positions = new Float32Array(numParticles * 3);
        
        // We will animate positions array via JS, so we keep track of states
        const chaosPositions = [];
        const targetPositions = [];
        const currentPositions = [];
        const velocities = [];

        for (let i = 0; i < numParticles; i++) {
            // Chaos: random points distributed in a wide sphere
            const r = 100 + Math.random() * 80;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            const cX = r * Math.sin(phi) * Math.cos(theta);
            const cY = r * Math.sin(phi) * Math.sin(theta);
            const cZ = r * Math.cos(phi);
            chaosPositions.push(new THREE.Vector3(cX, cY, cZ));

            // Target Text: pull from generated text points or map randomly to existing ones
            let tX, tY, tZ;
            if (i < textPoints.length) {
                tX = textPoints[i].x; tY = textPoints[i].y; tZ = textPoints[i].z;
            } else {
                // If we need more points than the text, just cluster them densely around it
                const randomTextPt = textPoints[Math.floor(Math.random() * textPoints.length)];
                tX = randomTextPt.x + (Math.random() - 0.5) * 3;
                tY = randomTextPt.y + (Math.random() - 0.5) * 3;
                tZ = randomTextPt.z + (Math.random() - 0.5) * 10;
            }
            targetPositions.push(new THREE.Vector3(tX, tY, tZ));

            // Initial state is chaos
            currentPositions.push(new THREE.Vector3(cX, cY, cZ));
            velocities.push(new THREE.Vector3(0, 0, 0));
            
            positions[i * 3] = cX;
            positions[i * 3 + 1] = cY;
            positions[i * 3 + 2] = cZ;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Let's create a custom shader material for glowing points
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00ff66) },
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = (150.0 / -mvPosition.z); 
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                void main() {
                    float d = distance(gl_PointCoord, vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = max(0.0, 1.0 - (d * 2.0));
                    gl_FragColor = vec4(color, alpha * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(geometry, particleMaterial);
        scene.add(particleSystem);

        // Interaction State
        let mouse = new THREE.Vector3(0, 0, 0);
        let targetStateMode = 'CHAOS'; // CHAOS or TEXT
        let time = 0;

        // Transition from Chaos to Text triggered precisely when Boot Sequence finishes
        window.addEventListener('terminalBootComplete', () => {
            targetStateMode = 'TEXT';
        });

        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            // Unproject to get rough 3D mouse mapping
            const vector = new THREE.Vector3(x, y, 0.5);
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const distance = -camera.position.z / dir.z;
            mouse = camera.position.clone().add(dir.multiplyScalar(distance));
        });

        function animate3D() {
            requestAnimationFrame(animate3D);
            time += 0.01;
            particleMaterial.uniforms.time.value = time;

            const posAttribute = geometry.attributes.position;
            const lerpSpeed = targetStateMode === 'TEXT' ? 0.02 : 0.05;

            for (let i = 0; i < numParticles; i++) {
                const target = targetStateMode === 'TEXT' ? targetPositions[i] : chaosPositions[i];
                const current = currentPositions[i];
                const velocity = velocities[i];

                // Mouse Repulsion
                const distToMouse = current.distanceTo(mouse);
                if (distToMouse < 30) {
                    const force = new THREE.Vector3().subVectors(current, mouse).normalize();
                    force.multiplyScalar((30 - distToMouse) * 0.1);
                    velocity.add(force);
                }

                // Spring physics towards target
                const springForce = new THREE.Vector3().subVectors(target, current).multiplyScalar(lerpSpeed);
                velocity.add(springForce);
                velocity.multiplyScalar(0.85); // friction/damping
                
                // Add tiny organic float when in TEXT mode
                if (targetStateMode === 'TEXT') {
                    velocity.x += Math.sin(time * 2 + i) * 0.05;
                    velocity.y += Math.cos(time * 2 + i) * 0.05;
                } else {
                    // Slowly rotate chaos positions
                    chaosPositions[i].applyAxisAngle(new THREE.Vector3(0,1,0), 0.005);
                    chaosPositions[i].applyAxisAngle(new THREE.Vector3(1,0,0), 0.002);
                }

                current.add(velocity);

                posAttribute.array[i * 3] = current.x;
                posAttribute.array[i * 3 + 1] = current.y;
                posAttribute.array[i * 3 + 2] = current.z;
            }
            posAttribute.needsUpdate = true;

            // Camera slightly moves with actual mouse for parallax
            gsap.to(camera.position, {
                x: (mouse.x * 0.1),
                y: (mouse.y * 0.1),
                ease: 'power2.out',
                duration: 1
            });
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }
        animate3D();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
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
