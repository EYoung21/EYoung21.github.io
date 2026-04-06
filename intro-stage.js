/**
 * Full-viewport intro: narrative play mode — insects/EPG, egg lifecycle, hyperspectral,
 * ML data cloud, product billboards; optional playlist audio + analyser.
 *
 * State: Idle (ambient) | Playing (narrative phases driven by song time + bass/mid/treble).
 * Playlist: ./playlist.json · MP3s: ./music/ (see music/README.txt)
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

    /** @typedef {'idle'|'playing'} IntroMode */
    /** Narrative segment weights (insect EPG, egg scan, hatch, ML/products) — smoothed by song phase */

    let scene, camera, renderer, eggGroup;
    let eggMesh, eggWire, eggTop, eggBot, hatchSeam;
    let specPlane, specTexture, epg2Plane, epg2Texture;
    let coreParticles, mlParticles;
    let insectLines = [];
    let billboardAA, billboardLI;
    let satelliteEgg;
    let rimLight;
    let time = 0;
    let mouseX = 0, mouseY = 0;
    let bass = 0, mid = 0, treble = 0;
    let bassPrev = 0;
    let themeLight = false;
    let narrativePhase01 = 0;
    let hatchAmount = 0;
    let hsiPhase = 0;
    let beatFlash = 0;
    let scrollHandoff01 = 0;
    /** 0..1 hero scroll progress (for sideline / background cube) */
    let scrollP = 0;
    let baseCameraZ = 4.2;
    /** Seconds since intro WebGL started — drives “flow in from the side” entrance */
    let introEntranceT = 0;

    const SPEC_W = 256;
    const SPEC_H = 96;
    const EPG2_W = 128;
    const EPG2_H = 48;

    const specCanvas = document.createElement('canvas');
    specCanvas.width = SPEC_W;
    specCanvas.height = SPEC_H;
    const specCtx = specCanvas.getContext('2d');
    specCtx.fillStyle = '#020617';
    specCtx.fillRect(0, 0, SPEC_W, SPEC_H);

    const epg2Canvas = document.createElement('canvas');
    epg2Canvas.width = EPG2_W;
    epg2Canvas.height = EPG2_H;
    const epg2Ctx = epg2Canvas.getContext('2d');

    let pCount = isMobile ? 48 : 140;
    let mlCount = isMobile ? 80 : 220;
    let insectCount = isMobile ? 8 : 16;
    let insectSegs = isMobile ? 24 : 40;

    let audioEl = null;
    let audioCtx = null;
    let mediaSrc = null;
    let analyser = null;
    let gainNode = null;
    let freqData = null;
    let audioGraphReady = false;
    let musicPlaying = false;
    /** @type {IntroMode} */
    let introMode = 'idle';
    let muted = false;
    let playlist = [];
    let selectedMeta = null;
    let started = false;
    let tabHidden = false;

    let currentDpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
    const frameTimes = [];
    let lastFrameTime = performance.now();

    function themeColors() {
        themeLight = document.documentElement.getAttribute('data-theme') === 'light';
        return {
            fog: themeLight ? 0xf0f2f4 : 0x050508,
            egg: themeLight ? 0xb8c4bc : 0x122018,
            eggEmis: themeLight ? 0x228844 : 0x003318,
            wire: themeLight ? 0x16a34a : 0x00ff66,
            specHi: themeLight ? 0x15803d : 0x00ff88,
            ml: themeLight ? 0x6366f1 : 0x8844ff
        };
    }

    function smoothToward(cur, target, k) {
        return cur + (target - cur) * k;
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function bell(t, center, width) {
        const x = (t - center) / width;
        return Math.exp(-x * x);
    }

    /** 0..1 over estimated song length */
    function songProgress01() {
        if (!audioEl || !musicPlaying) return 0;
        const dur = audioEl.duration;
        if (!dur || !isFinite(dur) || dur <= 0) return (time * 0.03) % 1;
        return Math.min(1, audioEl.currentTime / dur);
    }

    /** Weights for four narrative beats (overlap for smooth blends) */
    function narrativeWeights(t01) {
        return {
            insect: bell(t01, 0.12, 0.14) + bell(t01, 0.55, 0.2) * 0.35,
            egg: bell(t01, 0.35, 0.16),
            hatch: bell(t01, 0.58, 0.14),
            ml: bell(t01, 0.78, 0.16),
            products: bell(t01, 0.9, 0.12)
        };
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
        if (!analyser || !freqData || !musicPlaying || !audioEl || audioEl.paused) {
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

    function drawSpectrogramColumn(intensity, scrollMul) {
        const ctx = specCtx, W = SPEC_W, H = SPEC_H;
        const steps = Math.max(1, Math.round(1 + scrollMul * 2));
        for (let s = 0; s < steps; s++) {
            ctx.drawImage(specCanvas, 1, 0, W - 1, H, 0, 0, W - 1, H);
        }
        const g = ctx.createLinearGradient(0, 0, 0, H);
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

    function drawEpg2Spikes(midVal, trebleVal) {
        const ctx = epg2Ctx, W = EPG2_W, H = EPG2_H;
        ctx.fillStyle = themeLight ? '#e2e8f0' : '#020617';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = themeLight ? 'rgba(22,163,74,0.85)' : 'rgba(0,255,102,0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const n = 48;
        for (let i = 0; i < n; i++) {
            const x = (i / (n - 1)) * W;
            const h = (0.15 + midVal * 0.65 + Math.sin(time * 6 + i * 0.4) * 0.08 + trebleVal * 0.35) * H * 0.45;
            ctx.moveTo(x, H);
            ctx.lineTo(x, H - h);
        }
        ctx.stroke();
    }

    function makeTextBillboard(text, sub, color) {
        const c = document.createElement('canvas');
        const w = 512;
        const h = 128;
        c.width = w;
        c.height = h;
        const x = c.getContext('2d');
        x.fillStyle = 'rgba(0,0,0,0.45)';
        x.fillRect(0, 0, w, h);
        x.strokeStyle = color;
        x.lineWidth = 3;
        x.strokeRect(4, 4, w - 8, h - 8);
        x.fillStyle = 'rgba(240,245,240,0.95)';
        x.font = 'bold 42px system-ui, "Space Grotesk", sans-serif';
        x.fillText(text, 24, 72);
        x.fillStyle = 'rgba(180,200,180,0.75)';
        x.font = '22px ui-monospace, monospace';
        x.fillText(sub, 24, 108);
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), mat);
        return mesh;
    }

    function buildInsectTrails(parent) {
        const tc = themeColors();
        const mat = new THREE.LineBasicMaterial({
            color: tc.wire,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending
        });
        for (let L = 0; L < insectCount; L++) {
            const pts = [];
            const seed = L * 17.17;
            for (let i = 0; i < insectSegs; i++) {
                pts.push(new THREE.Vector3(
                    Math.sin(seed + i * 0.3) * 1.8,
                    (i / insectSegs - 0.5) * 2.2,
                    Math.cos(seed * 1.1 + i * 0.25) * 1.5
                ));
            }
            const geom = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geom, mat.clone());
            line.userData.seed = seed;
            line.userData.phase = L * 0.4;
            parent.add(line);
            insectLines.push(line);
        }
    }

    function buildScene() {
        const tc = themeColors();
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(tc.fog, themeLight ? 0.045 : 0.052);

        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0.15, baseCameraZ);

        renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: false, antialias: !isMobile, powerPreference: 'high-performance' });
        renderer.setPixelRatio(currentDpr);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(tc.fog, 1);

        const amb = new THREE.AmbientLight(0xffffff, themeLight ? 0.55 : 0.35);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, themeLight ? 0.85 : 0.55);
        dir.position.set(2, 4, 5);
        scene.add(dir);
        rimLight = new THREE.PointLight(tc.wire, themeLight ? 0.4 : 0.65, 12, 2);
        rimLight.position.set(-2, 1, 3);
        scene.add(rimLight);

        eggGroup = new THREE.Group();
        scene.add(eggGroup);

        const eggSeg = isMobile ? 28 : 40;
        const eggH = Math.floor(eggSeg * 0.75);
        const eggGeom = new THREE.SphereGeometry(1, eggSeg, eggH);
        eggMesh = new THREE.Mesh(
            eggGeom,
            new THREE.MeshStandardMaterial({
                color: tc.egg,
                metalness: 0.35,
                roughness: 0.55,
                emissive: new THREE.Color(tc.eggEmis),
                emissiveIntensity: themeLight ? 0.08 : 0.18
            })
        );
        eggMesh.scale.set(1.12, 1.52, 1.05);
        eggMesh.position.y = 0;
        eggGroup.add(eggMesh);

        const fullSphere = new THREE.SphereGeometry(1, eggSeg, eggH);
        const edgeGeom = new THREE.EdgesGeometry(fullSphere, 25);
        eggWire = new THREE.LineSegments(
            edgeGeom,
            new THREE.LineBasicMaterial({ color: tc.wire, transparent: true, opacity: themeLight ? 0.22 : 0.35 })
        );
        eggWire.scale.copy(eggMesh.scale);
        eggGroup.add(eggWire);

        const halfH = Math.floor(eggSeg * 0.5);
        const halfGeom = new THREE.SphereGeometry(1, eggSeg, halfH, 0, Math.PI / 2);
        eggTop = new THREE.Mesh(
            halfGeom,
            eggMesh.material.clone()
        );
        eggTop.scale.copy(eggMesh.scale);
        eggTop.position.y = 0.02;
        eggTop.visible = false;
        eggGroup.add(eggTop);

        const halfGeomBot = new THREE.SphereGeometry(1, eggSeg, halfH, Math.PI / 2, Math.PI / 2);
        eggBot = new THREE.Mesh(
            halfGeomBot,
            eggMesh.material.clone()
        );
        eggBot.scale.copy(eggMesh.scale);
        eggBot.position.y = -0.02;
        eggBot.visible = false;
        eggGroup.add(eggBot);

        const ringGeom = new THREE.RingGeometry(0.35, 0.42, 48);
        hatchSeam = new THREE.Mesh(
            ringGeom,
            new THREE.MeshBasicMaterial({ color: tc.wire, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
        );
        hatchSeam.rotation.x = Math.PI / 2;
        hatchSeam.position.y = 0;
        eggGroup.add(hatchSeam);

        satelliteEgg = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 16, 12),
            new THREE.MeshStandardMaterial({ color: tc.egg, metalness: 0.4, roughness: 0.5, emissive: tc.eggEmis, emissiveIntensity: 0.12 })
        );
        satelliteEgg.position.set(1.35, -0.45, 0.6);
        eggGroup.add(satelliteEgg);

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

        epg2Texture = new THREE.CanvasTexture(epg2Canvas);
        epg2Texture.minFilter = THREE.LinearFilter;
        const epg2Mat = new THREE.MeshBasicMaterial({
            map: epg2Texture,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        epg2Plane = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.45), epg2Mat);
        epg2Plane.position.set(0, -1.85, 1.05);
        epg2Plane.rotation.x = -0.1;
        scene.add(epg2Plane);

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
                size: isMobile ? 0.032 : 0.026,
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        scene.add(coreParticles);
        coreParticles.userData.vels = vels;

        const mlGeom = new THREE.BufferGeometry();
        const mlPos = new Float32Array(mlCount * 3);
        const mlVel = [];
        for (let i = 0; i < mlCount; i++) {
            mlPos[i * 3] = (Math.random() - 0.5) * 4.5;
            mlPos[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
            mlPos[i * 3 + 2] = (Math.random() - 0.5) * 3.5 - 0.5;
            mlVel.push(new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.015, (Math.random() - 0.5) * 0.02));
        }
        mlGeom.setAttribute('position', new THREE.BufferAttribute(mlPos, 3));
        mlParticles = new THREE.Points(
            mlGeom,
            new THREE.PointsMaterial({
                color: tc.ml,
                size: isMobile ? 0.04 : 0.032,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        scene.add(mlParticles);
        mlParticles.userData.vels = mlVel;

        buildInsectTrails(scene);

        billboardAA = makeTextBillboard('AlgoArena', 'competitive programming', '#00ff66');
        billboardAA.position.set(-2.1, 0.9, 0.5);
        billboardAA.rotation.y = 0.35;
        scene.add(billboardAA);

        billboardLI = makeTextBillboard('Lock In', 'focus · shipped', '#66a3ff');
        billboardLI.position.set(2.1, 0.55, 0.4);
        billboardLI.rotation.y = -0.4;
        scene.add(billboardLI);
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
        if (mlParticles && mlParticles.material) mlParticles.material.color.setHex(tc.ml);
    }

    new MutationObserver(() => updateThemeScene()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function updateInsects(wInsect, midVal) {
        const speed = 0.018 * (0.5 + wInsect) * (1 + midVal * 2);
        insectLines.forEach((line) => {
            const pos = line.geometry.attributes.position;
            if (!pos) return;
            const arr = pos.array;
            const seed = line.userData.seed;
            for (let i = 0; i < arr.length / 3; i++) {
                const iy = i * 3 + 1;
                arr[iy] += Math.sin(time * 2 + seed + i * 0.5) * speed * 0.4;
                arr[i * 3] += Math.cos(time * 1.7 + seed + i * 0.3) * speed * 0.35;
                arr[i * 3 + 2] += Math.sin(time * 1.4 + seed * 0.8 + i * 0.2) * speed * 0.3;
                arr[i * 3] = Math.max(-2.2, Math.min(2.2, arr[i * 3]));
                arr[iy] = Math.max(-1.8, Math.min(1.8, arr[iy]));
                arr[i * 3 + 2] = Math.max(-2, Math.min(2, arr[i * 3 + 2]));
            }
            pos.needsUpdate = true;
        });
    }

    function updateAdaptiveDpr() {
        if (frameTimes.length < 24) return;
        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        if (avg > 26 && currentDpr > 1) {
            currentDpr = Math.max(1, currentDpr - 0.25);
            renderer.setPixelRatio(currentDpr);
            frameTimes.length = 0;
        }
    }

    function animate() {
        if (!scene) return;
        const now = performance.now();
        const dt = now - lastFrameTime;
        lastFrameTime = now;
        frameTimes.push(dt);
        if (frameTimes.length > 40) frameTimes.shift();

        const dtSec = Math.min(0.05, dt / 1000);
        if (!prefersReducedMotion) {
            introEntranceT += dtSec;
        } else {
            introEntranceT = 1.25;
        }

        if (tabHidden) {
            syncIntroFrameDom();
            requestAnimationFrame(animate);
            if (renderer && scene && camera) renderer.render(scene, camera);
            return;
        }

        time += prefersReducedMotion ? 0.006 : 0.014;
        syncIntroFrameDom();

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

        const beatDeriv = Math.max(0, bass - bassPrev - 0.02);
        bassPrev = bass;
        beatFlash = smoothToward(beatFlash, Math.min(1, beatDeriv * 8), 0.25);

        const tSong = songProgress01();
        const w = musicPlaying && !prefersReducedMotion ? narrativeWeights(tSong) : { insect: 0.15, egg: 0.1, hatch: 0.08, ml: 0.1, products: 0.08 };
        narrativePhase01 = tSong;

        const wInsect = Math.min(1, w.insect * (musicPlaying ? 1 : 0.3));
        const wEgg = w.egg;
        const wHatch = w.hatch;
        const wMl = w.ml + w.products * 0.5;
        const wProd = w.products;

        hatchAmount = smoothToward(hatchAmount, Math.min(1, wHatch * 1.2 + treble * 0.4 + beatFlash * 0.3), 0.08);
        hsiPhase += 0.008 + treble * 0.04;

        const spin = prefersReducedMotion ? 0.0004 : 0.0018 + mid * (0.004 + wInsect * 0.003);
        const mx = prefersReducedMotion ? 0 : mouseX;
        const my = prefersReducedMotion ? 0 : mouseY;

        const tc = themeColors();
        const colInt = Math.min(1, bass * 0.7 + mid * 0.35 + treble * 0.2);
        const scrollMul = 1 + mid * (0.8 + wInsect * 0.6);

        if (eggMesh) {
            eggMesh.rotation.y += spin + mx * 0.008;
            eggMesh.rotation.x += Math.sin(time * 0.4) * 0.001 + my * 0.006;
            const pulse = 1 + bass * 0.07 + treble * 0.04;
            eggMesh.scale.set(1.12 * pulse, 1.52 * pulse, 1.05 * pulse);

            const em = eggMesh.material;
            const hue = (hsiPhase * 0.08 + wEgg * 0.12 + treble * 0.15) % 1;
            em.emissive.setHSL(0.28 + hue * 0.15, 0.45 + wEgg * 0.2, 0.15 + treble * 0.25);
            em.emissiveIntensity = (themeLight ? 0.08 : 0.16) + wEgg * 0.15 + beatFlash * 0.25;
        }

        if (eggWire) {
            eggWire.rotation.copy(eggMesh.rotation);
            eggWire.scale.copy(eggMesh.scale);
            eggWire.material.opacity = (themeLight ? 0.22 : 0.35) * (1 - hatchAmount * 0.45) + treble * 0.15;
        }

        const showSplit = hatchAmount > 0.35;
        if (eggTop && eggBot && eggMesh) {
            eggTop.visible = showSplit;
            eggBot.visible = showSplit;
            eggMesh.visible = !showSplit;
            if (eggWire) eggWire.visible = !showSplit;
            if (showSplit) {
                eggTop.scale.copy(eggMesh.scale);
                eggBot.scale.copy(eggMesh.scale);
                eggTop.rotation.copy(eggMesh.rotation);
                eggBot.rotation.copy(eggMesh.rotation);
                eggTop.material.emissive.copy(eggMesh.material.emissive);
                eggTop.material.emissiveIntensity = eggMesh.material.emissiveIntensity;
                eggBot.material.emissive.copy(eggMesh.material.emissive);
                eggBot.material.emissiveIntensity = eggMesh.material.emissiveIntensity;
                const gap = hatchAmount * 0.35;
                eggTop.position.y = gap * 0.5;
                eggBot.position.y = -gap * 0.5;
            }
        }

        if (hatchSeam) {
            hatchSeam.material.opacity = hatchAmount * 0.85 * (0.4 + treble);
            hatchSeam.scale.setScalar(1 + hatchAmount * 0.4);
        }

        if (satelliteEgg) {
            const orbit = time * (0.35 + wEgg * 0.4);
            const r = 1.45 + wEgg * 0.2;
            satelliteEgg.position.x = Math.cos(orbit) * r;
            satelliteEgg.position.z = Math.sin(orbit) * r * 0.85;
            satelliteEgg.position.y = -0.35 + Math.sin(orbit * 2) * 0.15;
            satelliteEgg.scale.setScalar(0.9 + wEgg * 0.15 + bass * 0.08);
        }

        if (!prefersReducedMotion || Math.floor(time * 10) % 24 === 0) {
            drawSpectrogramColumn(colInt, scrollMul);
            if (specTexture) specTexture.needsUpdate = true;
            drawEpg2Spikes(mid, treble);
            if (epg2Texture) epg2Texture.needsUpdate = true;
        }

        if (specPlane) {
            specPlane.position.y = -1.35 + Math.sin(time * 0.9) * 0.04 * (prefersReducedMotion ? 0.2 : 1);
            specPlane.material.opacity = (themeLight ? 0.88 : 0.92) * (0.65 + colInt * 0.35 + wInsect * 0.15);
        }
        if (epg2Plane) {
            epg2Plane.material.opacity = 0.45 + wInsect * 0.45 + mid * 0.15;
            epg2Plane.position.x = Math.sin(time * 0.35) * 0.08 * wInsect;
        }

        if (coreParticles && coreParticles.userData.vels) {
            const pos = coreParticles.geometry.attributes.position.array;
            const vels = coreParticles.userData.vels;
            const lim = 1.35;
            const speed = prefersReducedMotion ? 0.12 : 0.85 + wMl * 0.35;
            for (let i = 0; i < pCount; i++) {
                pos[i * 3] += vels[i].x * speed * (1 + treble * 2);
                pos[i * 3 + 1] += vels[i].y * speed;
                pos[i * 3 + 2] += vels[i].z * speed * (1 + bass * 2);
                if (Math.abs(pos[i * 3]) > lim) vels[i].x *= -1;
                if (Math.abs(pos[i * 3 + 1]) > lim) vels[i].y *= -1;
                if (Math.abs(pos[i * 3 + 2]) > lim) vels[i].z *= -1;
            }
            coreParticles.geometry.attributes.position.needsUpdate = true;
            coreParticles.material.opacity = 0.4 + colInt * 0.35 + wHatch * 0.15;
        }

        if (mlParticles && mlParticles.userData.vels) {
            const pos = mlParticles.geometry.attributes.position.array;
            const vels = mlParticles.userData.vels;
            const lim = 2.8;
            const wm = wMl * (musicPlaying ? 1 : 0.25);
            for (let i = 0; i < mlCount; i++) {
                const sp = (0.3 + treble * 1.2) * (0.2 + wm);
                pos[i * 3] += vels[i].x * sp + Math.sin(time + i) * 0.002 * wm;
                pos[i * 3 + 1] += vels[i].y * sp * 0.8;
                pos[i * 3 + 2] += vels[i].z * sp;
                if (Math.abs(pos[i * 3]) > lim) vels[i].x *= -1;
                if (Math.abs(pos[i * 3 + 1]) > lim) vels[i].y *= -1;
                if (Math.abs(pos[i * 3 + 2]) > lim) vels[i].z *= -1;
            }
            mlParticles.geometry.attributes.position.needsUpdate = true;
            mlParticles.material.opacity = 0.12 + wm * 0.45 + treble * 0.2;
        }

        insectLines.forEach((line) => {
            line.material.opacity = 0.15 + wInsect * 0.55 + mid * 0.15;
        });
        if (musicPlaying && !prefersReducedMotion) updateInsects(wInsect, mid);

        if (billboardAA) {
            billboardAA.material.opacity = Math.min(0.85, wProd * 0.9 + beatFlash * 0.2);
            billboardAA.rotation.y = 0.35 + Math.sin(time * 0.4) * 0.08;
        }
        if (billboardLI) {
            billboardLI.material.opacity = Math.min(0.85, wProd * 0.85 + mid * 0.1);
            billboardLI.rotation.y = -0.4 + Math.sin(time * 0.35) * 0.06;
        }

        if (rimLight) {
            rimLight.intensity = (themeLight ? 0.4 : 0.65) * (1 + beatFlash * 0.5 + wHatch * 0.3);
        }

        const targetZ = baseCameraZ + scrollHandoff01 * 0.85;
        const targetY = 0.15 + my * 0.22;
        const targetX = mx * 0.35;
        if (camera) {
            camera.position.x += (targetX - camera.position.x) * 0.04;
            camera.position.y += (targetY - camera.position.y) * 0.04;
            camera.position.z += (targetZ - camera.position.z) * 0.06;
            camera.lookAt(0, -0.05 + wEgg * 0.04, 0);
        }

        if (renderer && scene && camera) renderer.render(scene, camera);

        updateAdaptiveDpr();
        requestAnimationFrame(animate);
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
        scrollP = p;
        scrollHandoff01 = p;

        try {
            window.dispatchEvent(new CustomEvent('portfolioHeroScroll', { detail: { p, scrolledPast, heroHeight: total } }));
        } catch (e) { /* ignore */ }

        if (p > 0.08 && musicPlaying && audioEl && !audioEl.paused) {
            stopTrackFromScroll();
        }
    }

    /**
     * Acko-like: after terminal boot, stage eases in from the side; on scroll, sideline to top then fade out.
     * Called every animation frame so entrance + scroll transforms stay merged.
     */
    function syncIntroFrameDom() {
        if (!handoffEl) return;
        const p = scrollP;
        const sidelineT = Math.min(1, Math.max(0, (p - 0.1) / 0.62));
        const tyVh = -sidelineT * 46;
        const sc = 1 - sidelineT * 0.54;
        let opacity = 1;
        if (p > 0.72) {
            opacity = Math.max(0, 1 - (p - 0.72) / 0.28);
        }
        const ent = easeOutCubic(Math.min(1, introEntranceT / 1.14));
        const flowInX = prefersReducedMotion ? 0 : (1 - ent) * 0.32 * window.innerWidth;
        handoffEl.style.transformOrigin = '50% 0%';
        handoffEl.style.transform = `translate3d(${flowInX}px, ${tyVh}vh, 0) scale(${sc})`;
        handoffEl.style.opacity = String(Math.max(0, Math.min(1, opacity)));
    }

    function stopTrackFromScroll() {
        musicPlaying = false;
        introMode = 'idle';
        document.body.classList.remove('intro-play-active', 'intro-narrative-playing');
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
        introMode = 'idle';
        document.body.classList.remove('intro-play-active', 'intro-narrative-playing');
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
        introMode = 'playing';
        document.body.classList.add('intro-play-active', 'intro-narrative-playing');
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

    document.addEventListener('visibilitychange', () => {
        tabHidden = document.hidden;
    });

    function start() {
        if (started) return;
        started = true;
        introEntranceT = 0;
        buildScene();
        pickPlaylist().then(() => {});

        document.addEventListener('mousemove', onPointerMove, { passive: true });
        window.addEventListener('resize', onResize);

        playBtn?.addEventListener('click', onPlayClick);
        muteBtn?.addEventListener('click', onMuteClick);

        bindScrollHandoff();
        lastFrameTime = performance.now();
        requestAnimationFrame(animate);
        updateHandoffOpacity();
    }

    window.addEventListener('terminalBootComplete', start, { once: true });

    window.addEventListener('load', function () {
        setTimeout(function () {
            if (!started) start();
        }, 3200);
    });
})();
