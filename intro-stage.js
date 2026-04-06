/**
 * Full-viewport intro: egg + scrolling spectrogram (EPG-style read), optional playlist audio.
 *
 * Playlist editing / bulk MP3 source (development): ~/Desktop/saved/
 *   - archive-pre-5b806cb-revert-2026/playlist.json
 *   - music/*.mp3  →  copy into site ./music/ for production (see music/README.txt)
 * Shipped metadata: ./playlist.json (paths are ./music/<file>).
 */
(function () {
    'use strict';

    if (typeof THREE === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isMobile = window.innerWidth < 768 || isCoarse;

    const introStage = document.getElementById('intro-stage');
    const introFixedFrame = document.getElementById('intro-fixed-frame');
    const handoffEl = introFixedFrame || introStage;
    const canvasEl = document.getElementById('intro-canvas');
    const playBtn = document.getElementById('intro-play-btn');
    const songPopup = document.getElementById('intro-song-popup');
    const songNameEl = document.getElementById('intro-song-name');
    const songArtistEl = document.getElementById('intro-song-artist');
    const songLinkEl = document.getElementById('intro-song-link');
    const muteBtn = document.getElementById('intro-mute-btn');

    if (!introStage || !canvasEl) return;

    let scene, camera, renderer, eggMesh, eggWire, specPlane, specTexture;
    let coreParticles, pCount = isMobile ? 40 : 120;
    let time = 0;
    let mouseX = 0, mouseY = 0;
    let bass = 0, mid = 0, treble = 0;
    let themeLight = false;

    const SPEC_W = 256;
    const SPEC_H = 96;
    const specCanvas = document.createElement('canvas');
    specCanvas.width = SPEC_W;
    specCanvas.height = SPEC_H;
    const specCtx = specCanvas.getContext('2d');
    specCtx.fillStyle = '#020617';
    specCtx.fillRect(0, 0, SPEC_W, SPEC_H);

    let audioEl = null;
    let audioCtx = null;
    let mediaSrc = null;
    let analyser = null;
    let gainNode = null;
    let freqData = null;
    let audioGraphReady = false;
    let musicPlaying = false;
    let muted = false;
    let playlist = [];
    let selectedMeta = null;
    let rafId = 0;
    let disposed = false;
    let started = false;

    function themeColors() {
        themeLight = document.documentElement.getAttribute('data-theme') === 'light';
        return {
            fog: themeLight ? 0xf0f2f4 : 0x050508,
            egg: themeLight ? 0xb8c4bc : 0x122018,
            eggEmis: themeLight ? 0x228844 : 0x003318,
            wire: themeLight ? 0x16a34a : 0x00ff66,
            specHi: themeLight ? 0x15803d : 0x00ff88
        };
    }

    function smoothToward(cur, target, k) {
        return cur + (target - cur) * k;
    }

    function initAudioGraph() {
        if (audioGraphReady || !audioEl) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) throw new Error('No AudioContext');
            audioCtx = new AudioCtx();
            mediaSrc = audioCtx.createMediaElementSource(audioEl);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = isMobile ? 256 : 512;
            analyser.smoothingTimeConstant = 0.65;
            gainNode = audioCtx.createGain();
            gainNode.gain.value = muted ? 0 : 1;
            mediaSrc.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioCtx.destination);
            freqData = new Uint8Array(analyser.frequencyBinCount);
            audioGraphReady = true;
        } catch (e) {
            console.warn('Web Audio setup skipped:', e);
        }
    }

    function bandsFromAnalyser() {
        if (!analyser || !freqData || !musicPlaying || audioEl.paused) {
            return { b: 0.15, m: 0.12, t: 0.1 };
        }
        analyser.getByteFrequencyData(freqData);
        const n = freqData.length;
        const i0 = 0, i1 = Math.floor(n * 0.08), i2 = Math.floor(n * 0.35), i3 = Math.floor(n * 0.7);
        let s0 = 0, s1 = 0, s2 = 0;
        for (let i = i0; i < i1; i++) s0 += freqData[i];
        for (let i = i1; i < i2; i++) s1 += freqData[i];
        for (let i = i2; i < i3; i++) s2 += freqData[i];
        const c0 = i1 - i0, c1 = i2 - i1, c2 = i3 - i2;
        return {
            b: (s0 / c0 / 255) || 0,
            m: (s1 / c1 / 255) || 0,
            t: (s2 / c2 / 255) || 0
        };
    }

    function fakeBands(t) {
        return {
            b: 0.12 + Math.sin(t * 1.7) * 0.08 + Math.sin(t * 3.1) * 0.04,
            m: 0.1 + Math.sin(t * 2.3 + 1) * 0.06,
            t: 0.08 + Math.sin(t * 4.2 + 0.5) * 0.05
        };
    }

    function drawSpectrogramColumn(intensity) {
        const { ctx, W, H } = { ctx: specCtx, W: SPEC_W, H: SPEC_H };
        ctx.drawImage(specCanvas, 1, 0, W - 1, H, 0, 0, W - 1, H);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        const c = themeColors();
        const base = themeLight ? '#0f172a' : '#020617';
        g.addColorStop(0, base);
        g.addColorStop(0.35, `rgba(${themeLight ? '22,101,52' : '0,255,102'},${0.15 + intensity * 0.5})`);
        g.addColorStop(0.65, `rgba(${themeLight ? '34,197,94' : '0,255,136'},${0.2 + intensity * 0.55})`);
        g.addColorStop(1, base);
        ctx.fillStyle = g;
        ctx.fillRect(W - 2, 0, 2, H);
        ctx.fillStyle = `rgba(${themeLight ? '74,222,128' : '0,255,170'},${0.35 + intensity * 0.45})`;
        const barH = Math.max(4, intensity * H * 0.85);
        ctx.fillRect(W - 1, H - barH, 1, barH);
    }

    function buildScene() {
        const tc = themeColors();
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(tc.fog, themeLight ? 0.045 : 0.052);

        const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0.15, 4.2);

        renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: false, antialias: !isMobile, powerPreference: 'high-performance' });
        renderer.setPixelRatio(dpr);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(tc.fog, 1);

        const amb = new THREE.AmbientLight(0xffffff, themeLight ? 0.55 : 0.35);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, themeLight ? 0.85 : 0.55);
        dir.position.set(2, 4, 5);
        scene.add(dir);
        const rim = new THREE.PointLight(tc.wire, themeLight ? 0.4 : 0.65, 12, 2);
        rim.position.set(-2, 1, 3);
        scene.add(rim);

        const eggGeom = new THREE.SphereGeometry(1, isMobile ? 28 : 48, isMobile ? 22 : 32);
        eggMesh = new THREE.Mesh(
            eggGeom,
            new THREE.MeshStandardMaterial({
                color: tc.egg,
                metalness: 0.35,
                roughness: 0.55,
                emissive: tc.eggEmis,
                emissiveIntensity: themeLight ? 0.08 : 0.18
            })
        );
        eggMesh.scale.set(1.12, 1.52, 1.05);
        scene.add(eggMesh);

        const edgeGeom = new THREE.EdgesGeometry(eggGeom, 32);
        eggWire = new THREE.LineSegments(
            edgeGeom,
            new THREE.LineBasicMaterial({ color: tc.wire, transparent: true, opacity: themeLight ? 0.22 : 0.35 })
        );
        eggWire.scale.copy(eggMesh.scale);
        eggWire.position.copy(eggMesh.position);
        scene.add(eggWire);

        specTexture = new THREE.CanvasTexture(specCanvas);
        specTexture.minFilter = THREE.LinearFilter;
        specTexture.magFilter = THREE.LinearFilter;
        const spGeom = new THREE.PlaneGeometry(3.6, 0.85);
        const spMat = new THREE.MeshBasicMaterial({
            map: specTexture,
            transparent: true,
            opacity: themeLight ? 0.88 : 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        specPlane = new THREE.Mesh(spGeom, spMat);
        specPlane.position.set(0, -1.35, 1.15);
        specPlane.rotation.x = -0.12;
        scene.add(specPlane);

        const pGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(pCount * 3);
        const vels = [];
        for (let i = 0; i < pCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2.2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2.8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
            vels.push(new THREE.Vector3((Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012));
        }
        pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        coreParticles = new THREE.Points(
            pGeom,
            new THREE.PointsMaterial({
                color: tc.specHi,
                size: isMobile ? 0.035 : 0.028,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        scene.add(coreParticles);
        coreParticles.userData.vels = vels;
    }

    function updateThemeScene() {
        const tc = themeColors();
        if (scene && scene.fog) scene.fog.color.setHex(tc.fog);
        if (renderer) renderer.setClearColor(tc.fog, 1);
        if (eggMesh && eggMesh.material) {
            eggMesh.material.color.setHex(tc.egg);
            eggMesh.material.emissive.setHex(tc.eggEmis);
        }
        if (eggWire && eggWire.material) {
            eggWire.material.color.setHex(tc.wire);
            eggWire.material.opacity = themeLight ? 0.22 : 0.35;
        }
        if (specPlane && specPlane.material) specPlane.material.opacity = themeLight ? 0.88 : 0.92;
    }

    new MutationObserver(() => updateThemeScene()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function animate() {
        if (disposed) return;
        rafId = requestAnimationFrame(animate);
        time += prefersReducedMotion ? 0.008 : 0.014;

        let bands;
        if (prefersReducedMotion) {
            bands = { b: 0.1, m: 0.09, t: 0.08 };
        } else if (musicPlaying && analyser) {
            bands = bandsFromAnalyser();
        } else {
            bands = fakeBands(time);
        }

        bass = smoothToward(bass, bands.b, 0.12);
        mid = smoothToward(mid, bands.m, 0.12);
        treble = smoothToward(treble, bands.t, 0.12);

        const spin = prefersReducedMotion ? 0.0004 : 0.0022 + mid * 0.004;
        const mx = prefersReducedMotion ? 0 : mouseX;
        const my = prefersReducedMotion ? 0 : mouseY;

        if (eggMesh) {
            eggMesh.rotation.y += spin + mx * 0.008;
            eggMesh.rotation.x += Math.sin(time * 0.4) * 0.001 + my * 0.006;
            const pulse = 1 + bass * 0.06 + treble * 0.03;
            eggMesh.scale.set(1.12 * pulse, 1.52 * pulse, 1.05 * pulse);
        }
        if (eggWire) {
            eggWire.rotation.copy(eggMesh.rotation);
            eggWire.scale.copy(eggMesh.scale);
        }

        const colInt = Math.min(1, bass * 0.7 + mid * 0.35 + treble * 0.2);
        if (!prefersReducedMotion || Math.floor(time * 10) % 20 === 0) {
            drawSpectrogramColumn(colInt);
            if (specTexture) specTexture.needsUpdate = true;
        }

        if (specPlane) {
            specPlane.position.y = -1.35 + Math.sin(time * 0.9) * 0.04 * (prefersReducedMotion ? 0.2 : 1);
            specPlane.material.opacity = (themeLight ? 0.88 : 0.92) * (0.75 + colInt * 0.25);
        }

        if (coreParticles && coreParticles.userData.vels) {
            const pos = coreParticles.geometry.attributes.position.array;
            const vels = coreParticles.userData.vels;
            const lim = 1.35;
            const speed = prefersReducedMotion ? 0.15 : 1;
            for (let i = 0; i < pCount; i++) {
                pos[i * 3] += vels[i].x * speed * (1 + treble * 2);
                pos[i * 3 + 1] += vels[i].y * speed;
                pos[i * 3 + 2] += vels[i].z * speed * (1 + bass * 2);
                if (Math.abs(pos[i * 3]) > lim) vels[i].x *= -1;
                if (Math.abs(pos[i * 3 + 1]) > lim) vels[i].y *= -1;
                if (Math.abs(pos[i * 3 + 2]) > lim) vels[i].z *= -1;
            }
            coreParticles.geometry.attributes.position.needsUpdate = true;
        }

        if (camera) {
            const tx = mx * 0.35;
            const ty = my * 0.22;
            camera.position.x += (tx - camera.position.x) * 0.04;
            camera.position.y += (0.15 + ty - camera.position.y) * 0.04;
            camera.lookAt(0, -0.05, 0);
        }

        if (renderer && scene && camera) renderer.render(scene, camera);
    }

    function onResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function updateHandoffOpacity() {
        const hero = document.getElementById('hero');
        if (!hero || !handoffEl) return;
        const rect = hero.getBoundingClientRect();
        const total = rect.height;
        const scrolledPast = Math.max(0, -rect.top);
        const p = Math.min(1, scrolledPast / Math.max(total * 0.65, 1));
        const o = 1 - p;
        handoffEl.style.opacity = String(Math.max(0, Math.min(1, o)));

        if (p > 0.08 && musicPlaying && audioEl && !audioEl.paused) {
            stopTrackFromScroll();
        }
    }

    function stopTrackFromScroll() {
        musicPlaying = false;
        document.body.classList.remove('intro-play-active');
        if (songPopup) songPopup.classList.remove('active');
        if (audioEl) {
            audioEl.pause();
            audioEl.currentTime = 0;
        }
        if (playBtn) {
            playBtn.setAttribute('aria-label', 'Play music and reactive visuals');
            playBtn.classList.remove('playing');
        }
    }

    function userPauseTrack() {
        musicPlaying = false;
        document.body.classList.remove('intro-play-active');
        if (songPopup) songPopup.classList.remove('active');
        if (audioEl) audioEl.pause();
        if (playBtn) {
            playBtn.setAttribute('aria-label', 'Play music and reactive visuals');
            playBtn.classList.remove('playing');
        }
    }

    async function pickPlaylist() {
        try {
            const res = await fetch('./playlist.json', { cache: 'no-store' });
            playlist = await res.json();
        } catch (e) {
            console.warn('playlist.json unavailable', e);
            playlist = [];
        }
        if (!playlist.length) return;
        const idx = Math.floor(Math.random() * playlist.length);
        selectedMeta = playlist[idx];
        if (songNameEl) songNameEl.textContent = selectedMeta.title;
        if (songArtistEl) songArtistEl.textContent = selectedMeta.artist;
        if (songLinkEl) {
            songLinkEl.href = selectedMeta.url || '#';
            songLinkEl.setAttribute('aria-label', `Open ${selectedMeta.artist} — ${selectedMeta.title} in a new tab`);
        }
        const path = String(selectedMeta.file)
            .split('/')
            .filter(Boolean)
            .map(encodeURIComponent)
            .join('/');
        audioEl = new Audio(`music/${path}`);
        audioEl.preload = 'auto';
        audioEl.addEventListener('ended', stopTrackFromScroll);
    }

    async function onPlayClick() {
        if (!playlist.length) await pickPlaylist();
        if (!audioEl) return;
        initAudioGraph();
        if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();

        if (audioEl && !audioEl.paused) {
            userPauseTrack();
            return;
        }

        musicPlaying = true;
        document.body.classList.add('intro-play-active');
        if (songPopup) songPopup.classList.add('active');
        playBtn.setAttribute('aria-label', 'Pause music');
        playBtn.classList.add('playing');
        try {
            await audioEl.play();
        } catch (e) {
            console.warn('Playback failed (add MP3 files under ./music/)', e);
            userPauseTrack();
        }
    }

    function onMuteClick() {
        if (!muteBtn) return;
        muted = !muted;
        if (gainNode) gainNode.gain.value = muted ? 0 : 1;
        if (audioEl) audioEl.muted = muted;
        muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
        muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
        muteBtn.classList.toggle('muted', muted);
        const icon = muteBtn.querySelector('i');
        if (icon) {
            icon.className = muted ? 'fas fa-volume-xmark' : 'fas fa-volume-high';
        }
    }

    function bindScrollHandoff() {
        const fn = () => updateHandoffOpacity();
        if (window.__portfolioLenis) window.__portfolioLenis.on('scroll', fn);
        window.addEventListener('scroll', fn, { passive: true });
        window.addEventListener('resize', fn);
        fn();
    }

    function onPointerMove(e) {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    function start() {
        if (started) return;
        started = true;
        buildScene();
        pickPlaylist().then(() => {});

        document.addEventListener('mousemove', onPointerMove, { passive: true });
        window.addEventListener('resize', onResize);

        playBtn?.addEventListener('click', onPlayClick);
        muteBtn?.addEventListener('click', onMuteClick);

        bindScrollHandoff();
        animate();
        updateHandoffOpacity();
    }

    window.addEventListener('terminalBootComplete', start, { once: true });

    window.addEventListener('load', function () {
        setTimeout(function () {
            if (!started) start();
        }, 3200);
    });
})();
