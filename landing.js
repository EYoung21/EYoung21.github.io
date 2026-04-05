/* ============================================
   ELI YOUNG — Portfolio JS 2026
   GSAP + Lenis + creative scroll animations
   ============================================ */

(() => {
    'use strict';
    // ── Music & Intro Experience ──
    const PLAYLIST = [
        { title: "You Wish", artist: "Nightmares on Wax", file: "Nightmares On Wax - You Wish.mp3", url: "https://nightmaresonwax.warp.net/?lang=en_GB" },
        { title: "Les Nuits", artist: "Nightmares on Wax", file: "Nightmares on Wax - Les Nuits.mp3", url: "https://nightmaresonwax.warp.net/?lang=en_GB" },
        { title: "Tadow", artist: "Masego + FKJ", file: "Masego + FKJ   - Tadow.mp3", url: "https://tommisch.com/" },
        { title: "Apricots", artist: "Bicep", file: "BICEP ｜ APRICOTS (Official Video).mp3", url: "https://www.feelmybicep.com/" },
        { title: "Everything In Its Right Place", artist: "Radiohead", file: "Everything In Its Right Place.mp3", url: "https://www.radiohead.com/" },
        { title: "Losing My Way", artist: "Tom Misch & FKJ", file: "Tom Misch & FKJ - Losing My Way.mp3", url: "https://tommisch.com/" },
        { title: "Levitate", artist: "twenty one pilots", file: "twenty one pilots - Levitate (Official Video).mp3", url: "https://www.twentyonepilots.com/" },
        { title: "Lovely Day", artist: "Bill Withers", file: "Bill Withers - Lovely Day (Official Audio).mp3", url: "https://billwithers.com/" },
        { title: "Me Gustas Tu", artist: "Manu Chao", file: "Manu Chao - Me Gustas Tu (Official Audio).mp3", url: "https://www.manuchao.net/" },
        { title: "DLZ", artist: "TV on the Radio", file: "DLZ.mp3", url: "https://tvontheradio.com/" },
        { title: "Lead Me Home", artist: "Jamie N Commons", file: "Jamie N Commons - Lead Me Home (The Walking Dead).mp3", url: "https://www.jamiencommons.com/" },
        { title: "Sirius", artist: "The Alan Parsons Project", file: "The Alan Parsons Project - Sirius (Official Audio).mp3", url: "https://www.littlebarrie.com/" },
        { title: "Middle City Troops", artist: "Little Barrie", file: "Middle City Troops.mp3", url: "https://www.littlebarrie.com/" },
        { title: "Morning Dew", artist: "Krisu", file: "Krisu - Morning Dew (Remastered).mp3", url: "https://leach.band/" },
        { title: "Beach Day", artist: "RemK", file: "RemK - Beach Day.mp3", url: "https://leach.band/" },
        { title: "Want To Love", artist: "Aloboi", file: "Aloboi - Want To Love (Just Raw).mp3", url: "https://leach.band/" },
        { title: "resonance", artist: "jacal", file: "resonance (midwest emo version).mp3", url: "https://leach.band/" },
        { title: "Apricots", artist: "Bicep", file: "BICEP ｜ APRICOTS (Official Video).mp3", url: "https://www.feelmybicep.com/" },
        { title: "Space Remix", artist: "Forde Ward", file: "Bennett Foddy Space Remix 'I'm Going Down The Road Felling Bad' - Forde ward.mp3", url: "https://foddy.net/" },
        { title: "Courtesy", artist: "Chipzel", file: "Chipzel - Courtesy - Super Hexagon.mp3", url: "https://foddy.net/" },
        { title: "Harvest Dawn", artist: "Jeremy Soule", file: "Harvest Dawn.mp3", url: "https://foddy.net/" },
        { title: "From Past to Present", artist: "Jeremy Soule", file: "From Past to Present.mp3", url: "https://foddy.net/" },
        { title: "VIBR8", artist: "Marshmello", file: "Marshmello - VIBR8.mp3", url: "https://foddy.net/" },
        { title: "All For Nothing", artist: "Zachariehs", file: "All For Nothing.mp3", url: "https://foddy.net/" },
        { title: "Idea 22", artist: "Gibran Alcocer", file: "Idea 22.mp3", url: "https://foddy.net/" },
        { title: "Ethereal", artist: "Txmy", file: "Ethereal.mp3", url: "https://foddy.net/" },
        { title: "Vengeance", artist: "iwilldiehere", file: "Vengeance.mp3", url: "https://foddy.net/" },
        { title: "Stars", artist: "Gacabe & Jecabe", file: "Stars.mp3", url: "https://foddy.net/" },
        { title: "Little Taste of Heaven", artist: "Leach", file: "Little Taste of Heaven.mp3", url: "https://leach.band/" }
    ];

    let currentAudio = null;
    const introOverlay = document.getElementById('intro-overlay');
    const playBtn = document.getElementById('play-btn-acko');
    const songPopup = document.getElementById('song-popup-acko');
    const songNameEl = document.getElementById('song-name');
    const songArtistEl = document.getElementById('song-artist');
    const songLinkEl = document.getElementById('song-link');

    // ── Acko.net Style Intro Experience ──
    // Inspired by Steven Wittens' procedural ribbon technique:
    // Wide flat ribbons, dense chaotic scene, tight camera traversal
    
    let ackoScene = null; // Global ref for theme updates

    const initAckoIntro = () => {
        const canvas = document.getElementById('acko-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        // Detect current theme
        const getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
        const isDark = () => getTheme() === 'dark';

        // Theme-aware colors — USER'S GREEN PALETTE, not acko's orange/teal
        const themeColors = {
            dark: {
                bg: 0x050505,
                stripe1: '#0a0a0a', stripe2: '#111111',
                // Bright greens, whites, cyans — all visible on dark bg
                palette: [0x00ff66, 0x00cc55, 0x22c55e, 0x44ffaa, 0x88ffcc, 0x33ddaa, 0xffffff, 0x00e85c, 0x66ffbb, 0xaaffdd],
                ambient: 0x222222, ambientIntensity: 0.6,
                dirLight: 0xffffff, dirIntensity: 0.8,
                pointLight: 0x00ff66, pointIntensity: 3.5,
                ribbonRoughness: 0.25, ribbonMetalness: 0.4,
            },
            light: {
                bg: 0xf0f3f6,
                stripe1: '#ffffff', stripe2: '#e8ecf0',
                palette: [0x00cc55, 0x222222, 0x333344, 0x888888, 0xffffff, 0x22c55e, 0x44ffaa, 0x555555, 0x00aa44, 0xbbbbbb],
                ambient: 0xffffff, ambientIntensity: 1.0,
                dirLight: 0xffffff, dirIntensity: 0.6,
                pointLight: 0x00ff66, pointIntensity: 2.5,
                ribbonRoughness: 0.4, ribbonMetalness: 0.15,
            }
        };

        // Init Audio Setup (Resilient for GitHub Pages)
        let songDuration = 180; // Default 3 minutes for fallback
        try {
            const randomSong = PLAYLIST[Math.floor(Math.random() * PLAYLIST.length)];
            currentAudio = new Audio(`./music/${randomSong.file}`);
            currentAudio.loop = false;
            
            currentAudio.addEventListener('loadedmetadata', () => {
                songDuration = currentAudio.duration;
                console.log(`Song duration: ${songDuration.toFixed(1)}s — animation will match`);
            });
            
            if (songNameEl) songNameEl.textContent = randomSong.title;
            if (songArtistEl) songArtistEl.textContent = randomSong.artist;
            if (songLinkEl) songLinkEl.href = randomSong.url;
        } catch (e) {
            console.warn("Audio initialization failed.", e);
        }

        const tc = isDark() ? themeColors.dark : themeColors.light;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(tc.bg);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
        camera.position.set(0, 0, 120);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = false;

        // Lighting — richer setup for flat ribbons
        const ambientLight = new THREE.AmbientLight(tc.ambient, tc.ambientIntensity);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(tc.dirLight, tc.dirIntensity);
        dirLight.position.set(50, 80, 100);
        scene.add(dirLight);

        const dirLight2 = new THREE.DirectionalLight(0x00ff66, 0.3);
        dirLight2.position.set(-50, -40, 60);
        scene.add(dirLight2);
        
        const mouseLight = new THREE.PointLight(tc.pointLight, tc.pointIntensity, 600);
        mouseLight.position.set(0, 0, 100);
        scene.add(mouseLight);

        // Acko Background — subtle diagonal stripes
        const buildStripeBg = () => {
            const stripeCanvas = document.createElement('canvas');
            stripeCanvas.width = 128; stripeCanvas.height = 128;
            const ctx = stripeCanvas.getContext('2d');
            const colors = isDark() ? themeColors.dark : themeColors.light;
            ctx.fillStyle = colors.stripe1;
            ctx.fillRect(0, 0, 128, 128);
            ctx.strokeStyle = colors.stripe2;
            ctx.lineWidth = 14;
            ctx.beginPath();
            for (let j = -2; j < 4; j++) {
                ctx.moveTo(-64 + j * 64, 64 + j * 64);
                ctx.lineTo(64 + j * 64, -64 + j * 64);
            }
            ctx.stroke();
            return new THREE.CanvasTexture(stripeCanvas);
        };

        let stripeTex = buildStripeBg();
        stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
        stripeTex.repeat.set(80, 80);

        const bgMaterial = new THREE.MeshBasicMaterial({ map: stripeTex });
        const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), bgMaterial);
        bgPlane.position.z = -300;
        scene.add(bgPlane);

        // ═══════════════════════════════════════════════
        // RIBBON CREATION — solid TubeGeometry with proper scale
        // ═══════════════════════════════════════════════
        const ribbonsGroup = new THREE.Group();
        scene.add(ribbonsGroup);

        // Creates a solid ribbon tube along a curve path
        function createFlatRibbon(curvePath, ribbonRadius, unused, color, roughness, metalness, segments) {
            segments = segments || 200;
            ribbonRadius = ribbonRadius || 0.6;

            const tubeGeo = new THREE.TubeGeometry(curvePath, segments, ribbonRadius, 8, false);
            tubeGeo.userData.origPositions = new Float32Array(tubeGeo.attributes.position.array);

            const mat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: roughness,
                metalness: metalness,
                side: THREE.DoubleSide,
            });

            return new THREE.Mesh(tubeGeo, mat);
        }

        let letterRibbons = [];
        let chaosRibbons = [];
        let allRibbons = [];
        let masterCameraPath = null;
        let targetHover = 0; 
        let currentHover = 0;
        let introPlaying = false;
        let introTimeline = null;
        let mouseX = 0, mouseY = 0;
        let rotationX = 0, rotationY = 0;
        let isDragging = false;
        let ribbonsFormed = false; // tracks whether swirl-in is complete
        let startX = 0, startY = 0;
        let playBtnHovering = false;

        const loader = new THREE.FontLoader();
        loader.load('https://unpkg.com/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            const message = "Eli Young";
            const shapes = font.generateShapes(message, 20);
            
            const geometry = new THREE.ShapeGeometry(shapes);
            geometry.computeBoundingBox();
            const xOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
            const yOffset = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);

            const cameraWaypoints = [];
            const currentPalette = isDark() ? themeColors.dark.palette : themeColors.light.palette;

            // ── Build letter ribbons: ONE ribbon per shape outline (not per curve) ──
            shapes.forEach((shape, sIdx) => {
                const allCurves = [...shape.curves];
                if (shape.holes) {
                    shape.holes.forEach(hole => allCurves.push(...hole.curves));
                }

                // Concatenate all curve points into one continuous 3D path
                const allShapePoints = [];
                allCurves.forEach((curve, ci) => {
                    const pts = curve.getPoints(40);
                    pts.forEach((p, idx) => {
                        // Skip duplicate start points (curves join end-to-start)
                        if (ci > 0 && idx === 0) return;
                        allShapePoints.push(new THREE.Vector3(
                            p.x + xOffset,
                            p.y + yOffset,
                            Math.sin(allShapePoints.length * 0.05 + sIdx * 2.0) * 18 + Math.cos(allShapePoints.length * 0.02) * 10
                        ));
                    });
                });

                // Camera waypoints
                allShapePoints.forEach((pt, idx) => {
                    if (idx % 5 === 0) cameraWaypoints.push(pt.clone());
                });

                if (allShapePoints.length >= 3) {
                    const curvePath = new THREE.CatmullRomCurve3(allShapePoints);
                    const colorIdx = sIdx % currentPalette.length;
                    const ribbon = createFlatRibbon(
                        curvePath, 
                        0.5 + Math.random() * 0.5,  // radius 0.5–1.0 (visible but not overwhelming)
                        0,
                        currentPalette[colorIdx],
                        tc.ribbonRoughness,
                        tc.ribbonMetalness,
                        Math.min(allShapePoints.length * 2, 300)
                    );
                    letterRibbons.push(ribbon);
                    ribbonsGroup.add(ribbon);
                }
            });

            // ── Build CHAOTIC background ribbons (dense, interlocking) ──
            const chaosCount = 30;
            for (let c = 0; c < chaosCount; c++) {
                const numPts = 5 + Math.floor(Math.random() * 8);
                const chaosPts = [];
                const cx = (Math.random() - 0.5) * 160;
                const cy = (Math.random() - 0.5) * 80;
                const cz = (Math.random() - 0.5) * 80;

                for (let j = 0; j < numPts; j++) {
                    chaosPts.push(new THREE.Vector3(
                        cx + (Math.random() - 0.5) * 120,
                        cy + (Math.random() - 0.5) * 60,
                        cz + (Math.random() - 0.5) * 60 + Math.sin(j * 1.5) * 20
                    ));
                }

                const chaosCurve = new THREE.CatmullRomCurve3(chaosPts);
                const chaosColor = currentPalette[Math.floor(Math.random() * currentPalette.length)];
                const chaosRibbon = createFlatRibbon(
                    chaosCurve,
                    0.3 + Math.random() * 0.5,   // radius 0.3–0.8
                    0,
                    chaosColor,
                    tc.ribbonRoughness + Math.random() * 0.15,
                    tc.ribbonMetalness + Math.random() * 0.2,
                    100
                );
                chaosRibbons.push(chaosRibbon);
                ribbonsGroup.add(chaosRibbon);
            }

            allRibbons = [...letterRibbons, ...chaosRibbons];

            // ── Build the master camera path ──
            if (cameraWaypoints.length > 2) {
                const cinematicWaypoints = cameraWaypoints.map(wp => 
                    new THREE.Vector3(wp.x * 1.05, wp.y * 1.05 + 2, wp.z + 15)
                );
                masterCameraPath = new THREE.CatmullRomCurve3(cinematicWaypoints, false, 'centripetal', 0.5);
                console.log(`Camera path built with ${cinematicWaypoints.length} waypoints tracing all letters`);
            }

            // ── SWIRL-IN ANIMATION: ribbons fly in from the left ──
            // Start all ribbons far to the left
            ribbonsGroup.position.x = -300;
            ribbonsGroup.rotation.y = -0.8;
            ribbonsGroup.rotation.z = 0.3;

            // Animate them into position
            gsap.to(ribbonsGroup.position, {
                x: 0, duration: 2.5, ease: 'power3.out', delay: 0.3
            });
            gsap.to(ribbonsGroup.rotation, {
                y: 0, z: 0, duration: 2.5, ease: 'power3.out', delay: 0.3,
                onComplete: () => {
                    ribbonsFormed = true;
                    // Show masthead elements after ribbons form (cascading reveal)
                    if (playBtn) {
                        gsap.fromTo(playBtn, 
                            { opacity: 0, scale: 0.5 },
                            { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }
                        );
                    }
                    const mastheadTitle = document.querySelector('.masthead-title');
                    const mastheadAuthor = document.querySelector('.masthead-author');
                    const ackoArrow = document.getElementById('acko-arrow');
                    if (mastheadTitle) {
                        gsap.fromTo(mastheadTitle, 
                            { opacity: 0, y: 15 },
                            { opacity: 1, y: 0, duration: 0.7, delay: 0.3, ease: 'power2.out' }
                        );
                    }
                    if (mastheadAuthor) {
                        gsap.fromTo(mastheadAuthor, 
                            { opacity: 0, y: 10 },
                            { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' }
                        );
                    }
                    if (ackoArrow) {
                        gsap.fromTo(ackoArrow, 
                            { opacity: 0 },
                            { opacity: 1, duration: 0.8, delay: 0.6, ease: 'power2.out' }
                        );
                    }
                }
            });
        });

        // ═══════════════════════════════════════════════
        // INTERACTION — play button hover "sucking" effect 
        // ═══════════════════════════════════════════════
        
        // Compute play button world-space target for the "suck" effect
        const getPlayBtnTarget = () => {
            if (!playBtn) return new THREE.Vector3(60, -50, 20);
            const rect = playBtn.getBoundingClientRect();
            const ndcX = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
            const ndcY = -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1;
            const target = new THREE.Vector3(ndcX, ndcY, 0.5);
            target.unproject(camera);
            // Push it forward a bit
            const dir = target.sub(camera.position).normalize();
            return camera.position.clone().add(dir.multiplyScalar(80));
        };

        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#intro-overlay') && !introPlaying) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => isDragging = false);

        window.addEventListener('mousemove', (e) => {
            const mx = (e.clientX / window.innerWidth - 0.5);
            const my = (e.clientY / window.innerHeight - 0.5);
            mouseX = mx * 200;
            mouseY = -my * 200;
            mouseLight.position.set(mouseX, mouseY, 120);

            if (isDragging && !introPlaying) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                rotationY += deltaX * 0.005;
                rotationX += deltaY * 0.005;
                startX = e.clientX;
                startY = e.clientY;
            }
        });

        if (playBtn) {
            playBtn.addEventListener('mouseenter', () => { 
                targetHover = 0.85;
                playBtnHovering = true;
            });
            playBtn.addEventListener('mouseleave', () => { 
                targetHover = 0;
                playBtnHovering = false;
            });

            playBtn.addEventListener('click', () => {
                if (introPlaying) return;
                introPlaying = true;
                targetHover = 0;
                playBtnHovering = false;
                
                // Start audio
                if (currentAudio) currentAudio.play().catch(() => {});

                // Show song popup (upper right)
                if (songPopup) songPopup.classList.add('active');

                // Show scroll-stop message (upper right)
                const scrollStopMsg = document.getElementById('scroll-stop-msg');
                if (scrollStopMsg) scrollStopMsg.classList.add('active');

                // Add playing class to overlay
                if (introOverlay) introOverlay.classList.add('playing');

                const tl = gsap.timeline();
                introTimeline = tl;
                const prompt = introOverlay ? introOverlay.querySelector('.intro-prompt') : null;
                
                // Hide play button + prompt immediately
                if (playBtn) gsap.to(playBtn, { opacity: 0, scale: 0.3, duration: 0.5, pointerEvents: 'none' });
                if (prompt) gsap.to(prompt, { opacity: 0, duration: 0.4 });

                // Phase 1: Dramatic zoom INTO the ribbon structure (3 seconds)
                tl.to({}, {
                    duration: 3,
                    onUpdate: function() {
                        const p = this.progress();
                        // Zoom from overview to closer — but NOT inside the ribbons
                        camera.position.z = 120 - p * 80; // 120 -> 40
                        camera.position.x = Math.sin(p * Math.PI) * 20 * p;
                        camera.position.y = Math.cos(p * 2) * 8 * p;
                        camera.lookAt(0, 0, 0);
                        camera.fov = 60 + p * 10;
                        camera.updateProjectionMatrix();
                    },
                    ease: "power2.inOut"
                });

                // Phase 2: Camera traces the letter paths (song duration)
                tl.to({}, {
                    duration: Math.max(songDuration - 8, 30),
                    onUpdate: function() {
                        const p = this.progress();
                        
                        if (masterCameraPath) {
                            const point = masterCameraPath.getPointAt(p);
                            camera.position.copy(point);
                            
                            // Look ahead along the path
                            const lookP = Math.min(p + 0.008, 1);
                            const lookTarget = masterCameraPath.getPointAt(lookP);
                            camera.lookAt(lookTarget);
                            
                            // Cinematic camera roll
                            camera.rotation.z = Math.sin(p * 25) * 0.12;
                            
                            // Slowly modulate FOV for variety
                            camera.fov = 65 + Math.sin(p * 8) * 10;
                            camera.updateProjectionMatrix();
                        }
                    },
                    ease: "none"
                });

                // Phase 3: Pull back and exit (5 seconds)
                tl.to({}, {
                    duration: 5,
                    onUpdate: function() {
                        const p = this.progress();
                        targetHover = -3.0 * p;
                        
                        camera.position.z = 40 + p * 300;
                        camera.position.x = Math.sin(p * 4) * 50 * p;
                        camera.position.y = Math.cos(p * 4) * 25 * p;
                        camera.lookAt(0, 0, 0);
                        camera.rotation.z = p * 1.2;
                        camera.fov = 75 - p * 20;
                        camera.updateProjectionMatrix();

                        if (p > 0.3) {
                            const fadeP = (p - 0.3) / 0.7;
                            if (introOverlay) introOverlay.style.opacity = (1 - fadeP).toString();
                            if (canvas) canvas.style.opacity = (1 - fadeP).toString();
                        }
                    },
                    ease: "power2.in",
                    onComplete: () => {
                        gsap.set([canvas, introOverlay], { display: 'none', pointerEvents: 'none' });
                        if (currentAudio) {
                            gsap.to({ vol: currentAudio.volume }, {
                                vol: 0, duration: 2,
                                onUpdate: function() { if (currentAudio) currentAudio.volume = this.targets()[0].vol; },
                                onComplete: () => { if (currentAudio) currentAudio.pause(); }
                            });
                        }
                    }
                });

                // End on song finish
                if (currentAudio) {
                    currentAudio.addEventListener('ended', () => {
                        if (introPlaying && tl) tl.progress(0.92);
                    });
                }
            });
        }

        // Fade loading text after initial load
        setTimeout(() => {
            const prompt = document.querySelector('.intro-prompt');
            if (prompt && !introPlaying) {
                gsap.to(prompt, { opacity: 0, duration: 2, delay: 1.5 });
            }
        }, 1000);

        // ═══════════════════════════════════════════════
        // SCROLL — ribbons slide to side like acko.net
        // ═══════════════════════════════════════════════
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: 'body',
                start: 'top top',
                end: '1200px top',
                onUpdate: (self) => {
                    const p = self.progress;
                    
                    // INSTANT music stop on any scroll
                    if (p > 0.01 && currentAudio && !currentAudio.paused) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                    }

                    // Kill the intro timeline if running
                    if (p > 0.01 && introTimeline) {
                        introTimeline.kill();
                        introTimeline = null;
                        introPlaying = false;
                    }
                    
                    if (canvas) {
                        canvas.style.opacity = Math.max(0, 1 - p * 1.8);
                        canvas.style.pointerEvents = (p > 0.5) ? 'none' : 'auto';
                        
                        // ACKO BEHAVIOR: ribbons slide UP and to the LEFT on scroll
                        ribbonsGroup.position.x = -p * 120;
                        ribbonsGroup.position.y = p * 60;
                        ribbonsGroup.position.z = -p * 100;
                        bgPlane.position.z = -300 - (p * 200);
                        // Slight rotation as it slides away
                        ribbonsGroup.rotation.x = p * 0.15;
                        ribbonsGroup.rotation.y = -p * 0.3;
                    }
                    if (introOverlay) {
                        introOverlay.style.opacity = Math.max(0, 1 - p * 2);
                        introOverlay.style.pointerEvents = (p > 0.3) ? 'none' : 'auto';
                    }
                }
            });
        }

        // ═══════════════════════════════════════════════
        // SETTINGS — gear toggle, mute, wireframe
        // ═══════════════════════════════════════════════
        const settingsBtn = document.getElementById('settings-btn');
        const settingsMenu = document.getElementById('settings-menu');
        if (settingsBtn && settingsMenu) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsMenu.classList.toggle('open');
            });
            document.addEventListener('click', () => settingsMenu.classList.remove('open'));
        }

        const muteCb = document.getElementById('mute-cb');
        if (muteCb) {
            muteCb.addEventListener('change', (e) => {
                if (currentAudio) currentAudio.muted = e.target.checked;
            });
        }

        const styleSelect = document.getElementById('style-select');
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                const isWireframe = e.target.value === 'wireframe';
                ribbonsGroup.children.forEach(mesh => {
                    if (mesh.material) mesh.material.wireframe = isWireframe;
                });
            });
        }

        // ═══════════════════════════════════════════════
        // ANIMATION LOOP
        // ═══════════════════════════════════════════════
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            currentHover += (targetHover - currentHover) * 0.04;

            // Compute play button world target for sucking effect
            const playTarget = getPlayBtnTarget();

            // Animate ALL ribbons (letter + chaos)
            ribbonsGroup.children.forEach((mesh, idx) => {
                const geo = mesh.geometry;
                const pos = geo.attributes.position;
                const orig = geo.userData.origPositions;

                if (pos && orig) {
                    const isLetter = idx < letterRibbons.length;
                    const noiseScale = isLetter ? 1.0 : 1.8;
                    const noiseSpeed = isLetter ? 1.2 : 0.8;

                    for (let i = 0; i < pos.count; i++) {
                        const ox = orig[i * 3];
                        const oy = orig[i * 3 + 1];
                        const oz = orig[i * 3 + 2];

                        // Organic breathing / floating noise
                        const nx = ox + Math.sin(time * noiseSpeed + idx * 0.15 + i * 0.002) * noiseScale * 2;
                        const ny = oy + Math.cos(time * noiseSpeed + idx * 0.15 + i * 0.003) * noiseScale * 2;
                        const nz = oz + Math.sin(time * noiseSpeed * 2 + idx * 0.5 + i * 0.001) * noiseScale * 4;

                        if (currentHover > 0.01 && !introPlaying) {
                            // "SUCKING" into play button — gravitational pull
                            const intensity = Math.pow(currentHover, 1.8);
                            const dx = playTarget.x - nx;
                            const dy = playTarget.y - ny;
                            const dz = playTarget.z - nz;
                            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                            const falloff = Math.min(1, 200 / (dist + 1)); // Closer = stronger pull
                            const pull = intensity * falloff;
                            pos.setXYZ(i, 
                                nx + dx * pull * 0.6, 
                                ny + dy * pull * 0.6, 
                                nz + dz * pull * 0.3
                            );
                        } else if (currentHover < -0.01) {
                            // Explosion outward
                            const push = Math.abs(currentHover);
                            pos.setXYZ(i,
                                nx + nx * push * 1.2,
                                ny + ny * push * 1.2,
                                nz + push * 300
                            );
                        } else {
                            pos.setXYZ(i, nx, ny, nz);
                        }
                    }
                    pos.needsUpdate = true;
                }
            });

            // Smooth rotation (only when not in cinematic mode)
            if (!introPlaying) {
                ribbonsGroup.rotation.y += (rotationY - ribbonsGroup.rotation.y) * 0.05;
                ribbonsGroup.rotation.x += (rotationX - ribbonsGroup.rotation.x) * 0.05;
            }

            renderer.render(scene, camera);
        };

        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Store scene reference for theme updates
        ackoScene = { 
            scene, renderer, camera, ribbonsGroup, bgPlane, bgMaterial,
            ambientLight, mouseLight, dirLight, dirLight2, themeColors, 
            buildStripeBg, stripeTex, letterRibbons, chaosRibbons
        };
    };

    initAckoIntro();

    // ── Theme Toggle ──
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const updateThemeUI = (theme) => {
            const isDark = theme === 'dark';
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        };

        // Apply theme to 3D scenes
        const applyThemeTo3D = (theme) => {
            const isDark = theme === 'dark';

            // Update Acko intro scene
            if (ackoScene) {
                const tc = isDark ? ackoScene.themeColors.dark : ackoScene.themeColors.light;
                
                // Background
                ackoScene.scene.background = new THREE.Color(tc.bg);
                
                // Stripe texture
                const newTex = ackoScene.buildStripeBg();
                newTex.wrapS = newTex.wrapT = THREE.RepeatWrapping;
                newTex.repeat.set(80, 80);
                ackoScene.bgMaterial.map = newTex;
                ackoScene.bgMaterial.needsUpdate = true;

                // Lighting
                ackoScene.ambientLight.color.set(tc.ambient);
                ackoScene.ambientLight.intensity = tc.ambientIntensity;
                ackoScene.mouseLight.color.set(tc.pointLight);
                ackoScene.mouseLight.intensity = tc.pointIntensity;
                if (ackoScene.dirLight) {
                    ackoScene.dirLight.color.set(tc.dirLight);
                    ackoScene.dirLight.intensity = tc.dirIntensity;
                }

                // Ribbon colors
                ackoScene.ribbonsGroup.children.forEach((mesh, idx) => {
                    if (mesh.material) {
                        mesh.material.color.set(tc.palette[idx % tc.palette.length]);
                        mesh.material.roughness = tc.ribbonRoughness;
                        mesh.material.metalness = tc.ribbonMetalness;
                        mesh.material.needsUpdate = true;
                    }
                });
            }

            // Update Hypercube scene
            if (typeof hypercubeScene !== 'undefined' && hypercubeScene) {
                const hueBase = isDark ? 0.4 : 0.3;
                hypercubeScene.planes.forEach((p, i) => {
                    const hue = hueBase + (i / hypercubeScene.planes.length) * 0.2;
                    p.mesh.material.color.setHSL(hue, isDark ? 1.0 : 0.7, isDark ? 0.5 : 0.4);
                    p.mesh.material.opacity = isDark ? (0.1 + (i === 0 || i === hypercubeScene.planes.length - 1 ? 0.15 : 0)) : 0.06;
                });
                if (hypercubeScene.boundingBox) {
                    hypercubeScene.boundingBox.material.color.set(isDark ? 0x00ff66 : 0x22c55e);
                    hypercubeScene.boundingBox.material.opacity = isDark ? 0.3 : 0.15;
                }
                if (hypercubeScene.coreParticles) {
                    hypercubeScene.coreParticles.material.color.set(isDark ? 0x00ff66 : 0x22c55e);
                    hypercubeScene.coreParticles.material.opacity = isDark ? 0.8 : 0.4;
                }
            }
        };

        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeUI(currentTheme);
        // Apply theme to 3D on initial load (after a small delay for scenes to init)
        setTimeout(() => applyThemeTo3D(currentTheme), 500);

        themeToggle.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeUI(newTheme);
            applyThemeTo3D(newTheme);
        });
    }

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

        // Fade music on scroll
        ScrollTrigger.create({
            trigger: 'body',
            start: 'top top',
            end: '500px top',
            onUpdate: (self) => {
                const progress = self.progress;
                if (currentAudio) {
                    currentAudio.volume = Math.max(0, 1 - progress);
                    if (progress > 0.8) {
                        introOverlay.classList.add('hidden');
                        songPopup.classList.remove('active');
                    } else {
                        introOverlay.classList.remove('hidden');
                    }
                }
            }
        });

        tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8 }, 0.4);
        tl.to('.hero-description', { opacity: 1, y: 0, duration: 0.8 }, 0.6);
        tl.to('.hero-ctas', { opacity: 1, y: 0, duration: 0.8 }, 0.7);
        tl.to('.hero-footer', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.8);
        tl.to('.hero-stat', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, 1.0);
        tl.to('.github-chart-wrapper', { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.7)' }, 1.2);
        tl.to('.scroll-hint', { opacity: 0.8, y: 0, duration: 1 }, 1.5);

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
            if (inners.length > 0) {
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
            }
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

    // ── ThreeJS Interactive Hypercube Theme ──
    let hypercubeScene = null;
    const canvas = document.getElementById('theme-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 40;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        // OrbitControls for interactive drag
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false; // Keep it focused on the structure
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        const hypercubeGroup = new THREE.Group();
        scene.add(hypercubeGroup);

        const numPlanes = 24;
        const planeSize = 16;
        const spacing = 1.0;

        const planes = [];
        // Inner vibrating planes
        for (let i = 0; i < numPlanes; i++) {
            const geom = new THREE.PlaneGeometry(planeSize, planeSize, 8, 8);
            const hue = 0.4 + (i / numPlanes) * 0.2; 
            const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
            
            const mat = new THREE.MeshBasicMaterial({ 
                color: color, 
                wireframe: true,
                transparent: true,
                opacity: 0.1 + (i===0 || i===numPlanes-1 ? 0.15 : 0)
            });
            const plane = new THREE.Mesh(geom, mat);
            plane.position.z = (i - numPlanes / 2) * spacing;
            hypercubeGroup.add(plane);
            planes.push({ mesh: plane, index: i, baseZ: plane.position.z });
        }

        // Bounding box
        const boxGeom = new THREE.BoxGeometry(planeSize, planeSize, numPlanes * spacing);
        const edges = new THREE.EdgesGeometry(boxGeom);
        const boxMat = new THREE.LineBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.3 });
        const boundingBox = new THREE.LineSegments(edges, boxMat);
        hypercubeGroup.add(boundingBox);

        // Core energy particles inside the hypercube
        const particleGeom = new THREE.BufferGeometry();
        const pCount = 200;
        const pPos = new Float32Array(pCount * 3);
        const pVel = [];
        for (let i=0; i<pCount; i++) {
            pPos[i*3] = (Math.random() - 0.5) * planeSize;
            pPos[i*3+1] = (Math.random() - 0.5) * planeSize;
            pPos[i*3+2] = (Math.random() - 0.5) * (numPlanes * spacing);
            pVel.push(new THREE.Vector3((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1));
        }
        particleGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x00ff66, size: 0.2, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
        const coreParticles = new THREE.Points(particleGeom, pMat);
        hypercubeGroup.add(coreParticles);

        // Outer ambient grid to prevent "cut off" feeling
        const outerGroup = new THREE.Group();
        scene.add(outerGroup);
        const outerPlanes = [];
        const outerNum = 12;
        for (let i = 0; i < outerNum; i++) {
            const geom = new THREE.PlaneGeometry(100, 100, 10, 10);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00aa44, wireframe: true, transparent: true, opacity: 0.03 });
            const plane = new THREE.Mesh(geom, mat);
            plane.position.z = (i - outerNum/2) * 5;
            outerGroup.add(plane);
            outerPlanes.push(plane);
        }

        // Interaction State
        let mouseX = 0;
        let mouseY = 0;
        let time = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        function animate() {
            requestAnimationFrame(animate);
            time += 0.015;
            
            // Animate internal planes: organic breathing effect and interactive spacing
            const mouseDist = Math.sqrt(mouseX*mouseX + mouseY*mouseY);
            const expansion = 1 + mouseDist * 0.5; // Expands when mouse is further from center

            planes.forEach(p => {
                const wave = Math.sin(time * 3 + p.index * 0.3);
                // Pulse size
                p.mesh.scale.setScalar(1 + wave * 0.03 * expansion);
                // Expand spacing dynamically
                p.mesh.position.z = p.baseZ * (0.8 + 0.2 * expansion) + wave * 0.2;
                // Twist internally
                p.mesh.rotation.z = Math.sin(time) * 0.1 * (p.index / numPlanes) * expansion;
            });

            // Animate outer ambient grid
            outerGroup.rotation.x = hypercubeGroup.rotation.x * 0.3;
            outerGroup.rotation.y = hypercubeGroup.rotation.y * 0.3;
            outerPlanes.forEach((plane, i) => {
                plane.position.z += 0.05;
                if (plane.position.z > (outerNum/2) * 5) {
                    plane.position.z -= outerNum * 5;
                }
            });

            // Animate internal energy particles
            const positions = coreParticles.geometry.attributes.position.array;
            for(let i=0; i<pCount; i++) {
                positions[i*3] += pVel[i].x;
                positions[i*3+1] += pVel[i].y;
                positions[i*3+2] += pVel[i].z;

                // Bounce off bounds
                const halfSize = planeSize/2;
                const halfDepth = (numPlanes * spacing)/2;
                if(Math.abs(positions[i*3]) > halfSize) pVel[i].x *= -1;
                if(Math.abs(positions[i*3+1]) > halfSize) pVel[i].y *= -1;
                if(Math.abs(positions[i*3+2]) > halfDepth) pVel[i].z *= -1;
            }
            coreParticles.geometry.attributes.position.needsUpdate = true;

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Scroll-driven camera movement
        ScrollTrigger.create({
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                const zPos = 40 + (self.progress * 60); // Move camera away on scroll
                gsap.to(camera.position, { z: zPos, duration: 0.5 });
                
                // Move entire visual out of frame slowly
                gsap.to(canvas, { y: -self.scroll() * 0.2, duration: 0.1 });
            }
        });

        // Store reference for theme toggle
        hypercubeScene = { planes, boundingBox, coreParticles };
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
