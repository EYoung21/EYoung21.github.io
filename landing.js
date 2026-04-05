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
    // Single BufferGeometry, camera traces letter paths, duration = song length
    
    let ackoScene = null; // Global ref for theme updates

    const initAckoIntro = () => {
        const canvas = document.getElementById('acko-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        // Detect current theme
        const getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
        const isDark = () => getTheme() === 'dark';

        // Theme-aware colors
        const themeColors = {
            dark: {
                bg: 0x050505,
                stripe1: '#0a0a0a', stripe2: '#111111',
                palette: [0x00ff66, 0x00cc55, 0x22c55e, 0x44ffaa, 0xffffff],
                ambient: 0x222222, ambientIntensity: 0.4,
                pointLight: 0x00ff66, pointIntensity: 3.5,
                ribbonRoughness: 0.3, ribbonMetalness: 0.5,
            },
            light: {
                bg: 0xf5f5f7,
                stripe1: '#ffffff', stripe2: '#f0f3f6',
                palette: [0x00ff66, 0x111111, 0x000000, 0x888888, 0xffffff],
                ambient: 0xffffff, ambientIntensity: 1.0,
                pointLight: 0x00ff66, pointIntensity: 2.5,
                ribbonRoughness: 0.5, ribbonMetalness: 0.1,
            }
        };

        // Init Audio Setup (Resilient for GitHub Pages)
        let songDuration = 180; // Default 3 minutes for fallback
        try {
            const randomSong = PLAYLIST[Math.floor(Math.random() * PLAYLIST.length)];
            currentAudio = new Audio(`./music/${randomSong.file}`);
            currentAudio.loop = false; // Don't loop — animation ends with song
            
            // Get actual song duration when metadata loads
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

        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 4000);
        camera.position.set(0, 0, 180);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Lighting
        const ambientLight = new THREE.AmbientLight(tc.ambient, tc.ambientIntensity);
        scene.add(ambientLight);
        
        const mouseLight = new THREE.PointLight(tc.pointLight, tc.pointIntensity, 600);
        mouseLight.position.set(0, 0, 100);
        scene.add(mouseLight);

        // Acko Background - subtle diagonal stripes (theme-aware)
        const buildStripeBg = () => {
            const stripeCanvas = document.createElement('canvas');
            stripeCanvas.width = 128; stripeCanvas.height = 128;
            const ctx = stripeCanvas.getContext('2d');
            const colors = isDark() ? themeColors.dark : themeColors.light;
            ctx.fillStyle = colors.stripe1;
            ctx.fillRect(0, 0, 128, 128);
            ctx.strokeStyle = colors.stripe2;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(-64, 64); ctx.lineTo(64, -64);
            ctx.moveTo(0, 128); ctx.lineTo(128, 0);
            ctx.moveTo(64, 192); ctx.lineTo(192, 64);
            ctx.stroke();
            return new THREE.CanvasTexture(stripeCanvas);
        };

        let stripeTex = buildStripeBg();
        stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
        stripeTex.repeat.set(60, 60);

        const bgMaterial = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 1 });
        const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), bgMaterial);
        bgPlane.position.z = -200;
        scene.add(bgPlane);

        // Group to hold our text tubes
        const ribbonsGroup = new THREE.Group();
        scene.add(ribbonsGroup);

        let tubesList = [];
        let allLetterPaths = []; // Store ALL curve paths for camera traversal
        let masterCameraPath = null; // The continuous path the camera follows
        let targetHover = 0; 
        let currentHover = 0;
        let introPlaying = false;
        let mouseX = 0, mouseY = 0;
        let rotationX = 0, rotationY = 0;
        let isDragging = false;
        let startX = 0, startY = 0;

        const loader = new THREE.FontLoader();
        loader.load('https://unpkg.com/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            const message = "Eli Young";
            const shapes = font.generateShapes(message, 18);
            
            const geometry = new THREE.ShapeGeometry(shapes);
            geometry.computeBoundingBox();
            const xOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
            const yOffset = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);

            const cameraWaypoints = []; // Collect all 3D points for camera path
            const currentPalette = isDark() ? themeColors.dark.palette : themeColors.light.palette;

            shapes.forEach((shape, sIdx) => {
                // Process main shape curves
                const allCurves = [...shape.curves];
                // Also process holes for letters like 'o', 'e', 'Y' etc.
                if (shape.holes) {
                    shape.holes.forEach(hole => {
                        allCurves.push(...hole.curves);
                    });
                }

                allCurves.forEach((curve, i) => {
                    const points = curve.getPoints(64);
                    const path3DPoints = points.map((p, idx) => 
                        new THREE.Vector3(
                            p.x + xOffset, 
                            p.y + yOffset, 
                            Math.sin(idx * 0.12 + sIdx) * 12
                        )
                    );

                    // Store for camera path
                    allLetterPaths.push(path3DPoints);
                    // Add every Nth point as a camera waypoint (to sample the full letter)
                    path3DPoints.forEach((pt, idx) => {
                        if (idx % 4 === 0) cameraWaypoints.push(pt.clone());
                    });

                    const path = new THREE.CatmullRomCurve3(path3DPoints);
                    const tubeGeo = new THREE.TubeGeometry(path, 128, 0.4, 4, false);
                    const material = new THREE.MeshStandardMaterial({
                        color: currentPalette[(sIdx + i) % currentPalette.length],
                        roughness: isDark() ? themeColors.dark.ribbonRoughness : themeColors.light.ribbonRoughness,
                        metalness: isDark() ? themeColors.dark.ribbonMetalness : themeColors.light.ribbonMetalness,
                    });

                    const tubeMesh = new THREE.Mesh(tubeGeo, material);
                    tubeGeo.userData.origPositions = new Float32Array(tubeGeo.attributes.position.array);
                    tubesList.push(tubeMesh);
                    ribbonsGroup.add(tubeMesh);
                });
            });

            // Build the master camera path from ALL letter waypoints
            if (cameraWaypoints.length > 2) {
                // Add cinematic offset: camera sits slightly above and in front of the path
                const cinematicWaypoints = cameraWaypoints.map(wp => 
                    new THREE.Vector3(wp.x, wp.y + 3, wp.z + 25)
                );
                masterCameraPath = new THREE.CatmullRomCurve3(cinematicWaypoints, false, 'centripetal', 0.5);
                console.log(`Camera path built with ${cinematicWaypoints.length} waypoints tracing all letters`);
            }
        });

        // Interaction: Click and Drag
        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#intro-overlay')) {
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

            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                rotationY += deltaX * 0.005;
                rotationX += deltaY * 0.005;
                startX = e.clientX;
                startY = e.clientY;
            }
        });

        if (playBtn) {
            playBtn.addEventListener('mouseenter', () => targetHover = 0.8);
            playBtn.addEventListener('mouseleave', () => targetHover = 0);

            playBtn.addEventListener('click', () => {
                if (introPlaying) return;
                introPlaying = true;
                
                // Start audio
                if (currentAudio) currentAudio.play().catch(() => {});

                // Show song popup
                if (songPopup) songPopup.classList.add('active');

                // Show scroll-stop message
                const scrollStopMsg = document.getElementById('scroll-stop-msg');
                if (scrollStopMsg) {
                    scrollStopMsg.style.opacity = '1';
                    setTimeout(() => { scrollStopMsg.style.opacity = '0'; }, 4000);
                }

                const tl = gsap.timeline();
                const prompt = introOverlay ? introOverlay.querySelector('.intro-prompt') : null;
                
                // Hide UI immediately
                if (playBtn && prompt) {
                    gsap.to([playBtn, prompt], { opacity: 0, duration: 0.6, pointerEvents: 'none' });
                }

                // Phase 1: Quick dramatic zoom-in (2 seconds)
                tl.to({}, {
                    duration: 2,
                    onUpdate: function() {
                        const p = this.progress();
                        // Zoom camera into the structure
                        camera.position.z = 180 - p * 140; // 180 -> 40
                        camera.position.x = Math.sin(p * 3) * 20 * p;
                        camera.lookAt(0, 0, 0);
                    },
                    ease: "power2.inOut"
                });

                // Phase 2: Camera traces every letter path (song duration)
                tl.to({}, {
                    duration: Math.max(songDuration - 6, 30), // Reserve 4s for exit
                    onUpdate: function() {
                        const p = this.progress();
                        
                        if (masterCameraPath) {
                            // Camera follows the master path through every letter
                            const point = masterCameraPath.getPointAt(p);
                            const tangent = masterCameraPath.getTangentAt(p);
                            
                            camera.position.copy(point);
                            
                            // Look slightly ahead along the path
                            const lookAheadP = Math.min(p + 0.01, 1);
                            const lookTarget = masterCameraPath.getPointAt(lookAheadP);
                            camera.lookAt(lookTarget);
                            
                            // Subtle camera roll for cinematic feel
                            camera.rotation.z = Math.sin(p * 20) * 0.08;
                        }
                        
                        // Subtle ribbon breathing during traversal
                        targetHover = Math.sin(p * 10) * 0.15;
                    },
                    ease: "none" // Linear traversal matches music tempo
                });

                // Phase 3: Dramatic exit explosion (4 seconds)
                tl.to({}, {
                    duration: 4,
                    onUpdate: function() {
                        const p = this.progress();
                        targetHover = -4.5 * p; // Explosion
                        
                        // Pull camera way back
                        camera.position.z = 40 + p * 300;
                        camera.position.x = Math.sin(p * 6) * 60 * p;
                        camera.position.y = Math.cos(p * 6) * 30 * p;
                        camera.lookAt(0, 0, 0);
                        camera.rotation.z = p * 1.5;

                        // Fade out overlay
                        if (p > 0.3) {
                            const fadeP = (p - 0.3) / 0.7;
                            if (introOverlay) introOverlay.style.opacity = (1 - fadeP).toString();
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

                // Also end on song finish if song is shorter
                if (currentAudio) {
                    currentAudio.addEventListener('ended', () => {
                        if (introPlaying) {
                            tl.progress(0.95); // Jump to exit phase
                        }
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

        // Scroll trigger: Acko recession (Z-depth + Opacity)
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: 'body',
                start: 'top top',
                end: '1200px top',
                onUpdate: (self) => {
                    const p = self.progress;
                    if (currentAudio && !introPlaying) currentAudio.volume = Math.max(0, 1 - p);
                    
                    if (canvas && !introPlaying) {
                        canvas.style.opacity = 1 - p;
                        canvas.style.pointerEvents = (p > 0.8) ? 'none' : 'auto';
                        
                        // Physical transition: Recession into space
                        ribbonsGroup.position.z = -p * 1200;
                        bgPlane.position.z = -200 - (p * 500);
                        ribbonsGroup.rotation.x = p * 0.6;
                        ribbonsGroup.rotation.y = rotationY + (p * 0.3);
                    }
                    if (introOverlay && !introPlaying) {
                        introOverlay.style.opacity = 1 - p;
                        introOverlay.style.pointerEvents = (p > 0.8) ? 'none' : 'auto';
                    }
                }
            });
        }

        // Settings - Mute logic
        const muteCb = document.getElementById('mute-cb');
        if (muteCb) {
            muteCb.addEventListener('change', (e) => {
                if (currentAudio) currentAudio.muted = e.target.checked;
            });
        }

        // Settings - Wireframe logic
        const styleSelect = document.querySelector('.settings-menu select');
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                const isWireframe = e.target.value === 'Wireframe';
                ribbonsGroup.children.forEach(mesh => {
                    mesh.material.wireframe = isWireframe;
                });
            });
        }

        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            currentHover += (targetHover - currentHover) * 0.05;

            // True Acko convergence: Pull towards play button point
            const aspect = window.innerWidth / window.innerHeight;
            const viewHeight = 2 * 150 * Math.tan((50 * 0.5 * Math.PI) / 180);
            const viewWidth = viewHeight * aspect;
            const playTarget = new THREE.Vector3(viewWidth * 0.38, -viewHeight * 0.35, 20);

            ribbonsGroup.children.forEach((mesh, idx) => {
                const geo = mesh.geometry;
                const pos = geo.attributes.position;
                const orig = geo.userData.origPositions;

                if (pos && orig) {
                    for (let i = 0; i < pos.count; i++) {
                        const ox = orig[i * 3];
                        const oy = orig[i * 3 + 1];
                        const oz = orig[i * 3 + 2];

                        // Elastic noise
                        const nx = ox + Math.sin(time * 1.5 + idx * 0.2) * 2;
                        const ny = oy + Math.cos(time * 1.5 + idx * 0.2) * 2;
                        const nz = oz + Math.sin(time * 3 + idx) * 4;

                        if (currentHover > 0.01) {
                            // "Sucking" into button effect (nonlinear lerp)
                            const intensity = Math.pow(currentHover, 1.5);
                            const bx = nx + (playTarget.x - nx) * intensity;
                            const by = ny + (playTarget.y - ny) * intensity;
                            const bz = nz + (playTarget.z - nz) * intensity;
                            pos.setXYZ(i, bx, by, bz);
                        } else if (currentHover < -0.01) {
                            // Violent Explosion sequence
                            const push = Math.abs(currentHover);
                            const ex = nx + (nx * push * 1.5);
                            const ey = ny + (ny * push * 1.5);
                            const ez = nz + push * 400;
                            pos.setXYZ(i, ex, ey, ez);
                        } else {
                            pos.setXYZ(i, nx, ny, nz);
                        }
                    }
                    pos.needsUpdate = true;
                }
            });

            // Smoothing rotation (only when not in cinematic mode)
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
            ambientLight, mouseLight, themeColors, buildStripeBg, stripeTex
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
                newTex.repeat.set(60, 60);
                ackoScene.bgMaterial.map = newTex;
                ackoScene.bgMaterial.needsUpdate = true;

                // Lighting
                ackoScene.ambientLight.color.set(tc.ambient);
                ackoScene.ambientLight.intensity = tc.ambientIntensity;
                ackoScene.mouseLight.color.set(tc.pointLight);
                ackoScene.mouseLight.intensity = tc.pointIntensity;

                // Ribbon colors
                ackoScene.ribbonsGroup.children.forEach((mesh, idx) => {
                    mesh.material.color.set(tc.palette[idx % tc.palette.length]);
                    mesh.material.roughness = tc.ribbonRoughness;
                    mesh.material.metalness = tc.ribbonMetalness;
                    mesh.material.needsUpdate = true;
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
