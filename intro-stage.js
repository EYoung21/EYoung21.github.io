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
    const DISTORTION_ONLY = true;

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
    let syntaxConstellation, focusLockGroup;
    let syntaxGlyphs = [];
    let satelliteEgg;
    let rimLight;
    let time = 0;
    let mouseX = 0, mouseY = 0;
    let dragYaw = 0;
    let dragPitch = 0;
    let dragYawVel = 0;
    let dragPitchVel = 0;
    let dragActive = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let bass = 0, mid = 0, treble = 0;
    let bassPrev = 0;
    let sub = 0;
    let air = 0;
    let bandEnergyPrev = 0;
    let themeLight = false;
    let narrativePhase01 = 0;
    let hatchAmount = 0;
    let hsiPhase = 0;
    let beatFlash = 0;
    let spectralFlux = 0;
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

    function smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    function chapterWeight(t01, start, end, feather) {
        const a = smoothstep(start - feather, start + feather, t01);
        const b = 1 - smoothstep(end - feather, end + feather, t01);
        return Math.max(0, Math.min(1, a * b));
    }

    /** 0..1 over estimated song length */
    function songProgress01() {
        if (!audioEl || !musicPlaying) return 0;
        const dur = audioEl.duration;
        if (!dur || !isFinite(dur) || dur <= 0) return (time * 0.03) % 1;
        return Math.min(1, audioEl.currentTime / dur);
    }

    /**
     * Story-first chapters:
     * 1) Lock In (focus lock) -> 2) Chicken/Lifecycle -> 3) Egg+ML scan/hatch
     * -> 4) AlgoArena syntax/operator -> 5) Mosquito/sharpshooter EPG + ML.
     */
    function narrativeWeights(t01) {
        const feather = 0.05;
        const wLockIn = chapterWeight(t01, 0.00, 0.18, feather);
        const wChicken = chapterWeight(t01, 0.16, 0.36, feather);
        const wEggMl = chapterWeight(t01, 0.34, 0.58, feather);
        const wAlgo = chapterWeight(t01, 0.56, 0.78, feather);
        const wMosq = chapterWeight(t01, 0.76, 1.00, feather);
        const ph = Math.sin(t01 * Math.PI * 2 * 6) * 0.08;
        return {
            // Final insect/EPG story chapter is explicit and dominant near track end.
            insect: Math.max(0, wMosq * 1.1 + wEggMl * 0.18 + ph),
            // Chicken + egg lifecycle occupies early-mid track.
            egg: Math.max(0, wChicken * 0.95 + wEggMl * 0.88 + wLockIn * 0.12),
            // Hatch is mostly in egg+ML chapter and late mosquito chapter.
            hatch: Math.max(0, wEggMl * 1.05 + wMosq * 0.22 + Math.max(0, ph)),
            // ML appears in egg+ML then intensifies in mosquito EPG chapter.
            ml: Math.max(0, wEggMl * 0.72 + wMosq * 0.9 + wAlgo * 0.22),
            // Product glyph chapter blends Lock In then AlgoArena.
            products: Math.max(0, wLockIn * 0.85 + wAlgo * 1.0 + wMosq * 0.12),
            lockin: wLockIn,
            chicken: wChicken,
            eggml: wEggMl,
            algo: wAlgo,
            mosquito: wMosq
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
            analyser.smoothingTimeConstant = 0.48;
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
            bandEnergyPrev = 0;
            return { sub: 0.12, b: 0.15, m: 0.12, t: 0.1, air: 0.08, flux: 0 };
        }
        analyser.getByteFrequencyData(freqData);
        const n = freqData.length;
        const ia = 0;
        const ib = Math.floor(n * 0.05);
        const ic = Math.floor(n * 0.12);
        const id = Math.floor(n * 0.35);
        const ie = Math.floor(n * 0.65);
        const iz = n;
        let sSub = 0, sBass = 0, sMid = 0, sTreble = 0, sAir = 0;
        for (let i = ia; i < ib; i++) sSub += freqData[i];
        for (let i = ib; i < ic; i++) sBass += freqData[i];
        for (let i = ic; i < id; i++) sMid += freqData[i];
        for (let i = id; i < ie; i++) sTreble += freqData[i];
        for (let i = ie; i < iz; i++) sAir += freqData[i];
        const cSub = Math.max(1, ib - ia);
        const cB = Math.max(1, ic - ib);
        const cM = Math.max(1, id - ic);
        const cT = Math.max(1, ie - id);
        const cA = Math.max(1, iz - ie);
        const eSub = (sSub / cSub / 255) || 0;
        const eB = (sBass / cB / 255) || 0;
        const eM = (sMid / cM / 255) || 0;
        const eT = (sTreble / cT / 255) || 0;
        const eA = (sAir / cA / 255) || 0;
        const total = eSub + eB + eM + eT + eA + 1e-6;
        const prev = bandEnergyPrev;
        let flux = 0;
        if (prev > 0) {
            flux = Math.max(0, total - prev) * 5.5;
        }
        bandEnergyPrev = total;
        return {
            sub: eSub,
            b: Math.min(1, eB * 1.05 + eSub * 0.35),
            m: eM,
            t: Math.min(1, eT * 1.05 + eA * 0.25),
            air: eA,
            flux: Math.min(1, flux)
        };
    }

    function fakeBands(t) {
        return {
            sub: 0.08 + Math.sin(t * 1.4) * 0.05,
            b: 0.12 + Math.sin(t * 1.7) * 0.08 + Math.sin(t * 3.1) * 0.04,
            m: 0.1 + Math.sin(t * 2.3 + 1) * 0.06,
            t: 0.08 + Math.sin(t * 4.2 + 0.5) * 0.05,
            air: 0.06 + Math.sin(t * 5.1) * 0.04,
            flux: 0
        };
    }

    function drawSpectrogramColumn(intensity, scrollMul, songPhaseBoost) {
        const ctx = specCtx, W = SPEC_W, H = SPEC_H;
        const sb = 1 + (songPhaseBoost || 0);
        const steps = Math.max(1, Math.round((1 + scrollMul * 2) * sb));
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
        ctx.fillStyle = `rgba(${themeLight ? '74,222,128' : '0,255,170'},${0.35 + intensity * 0.45 * sb})`;
        const barH = Math.max(4, intensity * H * 0.85 * (0.92 + 0.08 * sb));
        ctx.fillRect(W - 1, H - barH, 1, barH);
    }

    function drawEpg2Spikes(midVal, trebleVal, t01, fluxAmt) {
        const ctx = epg2Ctx, W = EPG2_W, H = EPG2_H;
        ctx.fillStyle = themeLight ? '#e2e8f0' : '#020617';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = themeLight ? 'rgba(22,163,74,0.85)' : 'rgba(0,255,102,0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const n = 48;
        const fx = fluxAmt || 0;
        for (let i = 0; i < n; i++) {
            const x = (i / (n - 1)) * W;
            const songRipple = Math.sin(t01 * Math.PI * 2 * 10 + i * 0.08) * 0.1;
            const h = (0.12 + midVal * 0.68 + Math.sin(time * 6 + i * 0.4) * 0.1 + trebleVal * 0.38 + songRipple + fx * 0.35) * H * 0.46;
            ctx.moveTo(x, H);
            ctx.lineTo(x, H - h);
        }
        ctx.stroke();
    }

    function addSyntaxConstellation(parent) {
        const tc = themeColors();
        syntaxConstellation = new THREE.Group();
        syntaxConstellation.position.set(0, 0.2, 0);
        parent.add(syntaxConstellation);

        const pairs = [
            ['{', '}', 0.95, 0.2],
            ['[', ']', 1.18, 1.7],
            ['<', '/>', 1.42, 3.3],
            ['(', ')', 1.65, 4.6],
            ['=>', '::', 1.92, 5.7]
        ];

        pairs.forEach((pair, i) => {
            const radius = pair[2];
            const phase = pair[3];
            pair.slice(0, 2).forEach((token, j) => {
                const sprite = document.createElement('canvas');
                sprite.width = 256;
                sprite.height = 128;
                const sctx = sprite.getContext('2d');
                sctx.clearRect(0, 0, sprite.width, sprite.height);
                sctx.fillStyle = themeLight ? 'rgba(22,163,74,0.92)' : 'rgba(0,255,136,0.95)';
                sctx.font = '700 66px ui-monospace, Menlo, Consolas, monospace';
                sctx.textAlign = 'center';
                sctx.textBaseline = 'middle';
                sctx.fillText(token, sprite.width / 2, sprite.height / 2 + 4);
                const tex = new THREE.CanvasTexture(sprite);
                tex.minFilter = THREE.LinearFilter;
                const mat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    opacity: 0,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), mat);
                mesh.userData = { radius, phase: phase + j * Math.PI, tokenIndex: i };
                syntaxConstellation.add(mesh);
                syntaxGlyphs.push(mesh);
            });
        });

        const rail = new THREE.Mesh(
            new THREE.TorusGeometry(1.75, 0.03, 12, 80),
            new THREE.MeshBasicMaterial({ color: tc.wire, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        rail.rotation.x = Math.PI * 0.65;
        syntaxConstellation.add(rail);
    }

    function addFocusLockObjects(parent) {
        const tc = themeColors();
        focusLockGroup = new THREE.Group();
        focusLockGroup.position.set(0, -0.72, 0.22);
        parent.add(focusLockGroup);

        const mkRing = (r, t, opacity) =>
            new THREE.Mesh(
                new THREE.TorusGeometry(r, t, 16, 96),
                new THREE.MeshBasicMaterial({
                    color: tc.ml,
                    transparent: true,
                    opacity,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );

        const ringA = mkRing(0.42, 0.022, 0.14);
        const ringB = mkRing(0.58, 0.016, 0.1);
        ringA.rotation.x = 0.22;
        ringB.rotation.x = 0.22;
        ringB.rotation.y = Math.PI * 0.22;
        focusLockGroup.add(ringA);
        focusLockGroup.add(ringB);

        const shackle = new THREE.Mesh(
            new THREE.TorusGeometry(0.19, 0.028, 14, 56, Math.PI),
            new THREE.MeshBasicMaterial({ color: tc.wire, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        shackle.position.set(0, 0.2, 0.02);
        shackle.rotation.z = Math.PI;
        focusLockGroup.add(shackle);

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.34, 0.26, 0.08),
            new THREE.MeshBasicMaterial({ color: tc.ml, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        body.position.set(0, -0.03, 0);
        focusLockGroup.add(body);

        const latch = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.11, 0.08),
            new THREE.MeshBasicMaterial({ color: tc.specHi, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        latch.position.set(0, -0.03, 0.05);
        focusLockGroup.add(latch);

        focusLockGroup.userData = { ringA, ringB, latch, shackle, body };
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
        addSyntaxConstellation(scene);
        addFocusLockObjects(scene);
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
        if (focusLockGroup && focusLockGroup.userData) {
            focusLockGroup.userData.ringA.material.color.setHex(tc.ml);
            focusLockGroup.userData.ringB.material.color.setHex(tc.ml);
            focusLockGroup.userData.latch.material.color.setHex(tc.specHi);
            if (focusLockGroup.userData.shackle) focusLockGroup.userData.shackle.material.color.setHex(tc.wire);
            if (focusLockGroup.userData.body) focusLockGroup.userData.body.material.color.setHex(tc.ml);
        }
        if (syntaxConstellation) {
            syntaxConstellation.traverse((obj) => {
                if (obj.isMesh && obj.material && obj.material.color && !obj.material.map) {
                    obj.material.color.setHex(tc.wire);
                }
            });
        }
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

    function emitDistortionFrame(detail) {
        try {
            window.dispatchEvent(new CustomEvent('introDistortionFrame', { detail }));
        } catch (e) { /* ignore */ }
    }

    function animate() {
        if (DISTORTION_ONLY) {
            const now = performance.now();
            const dt = now - lastFrameTime;
            lastFrameTime = now;
            const dtSec = Math.min(0.05, dt / 1000);
            time += dtSec;
            if (!prefersReducedMotion) {
                introEntranceT += dtSec;
            }

            const bands = musicPlaying ? bandsFromAnalyser() : fakeBands(time);
            const followK = musicPlaying ? 0.27 : 0.1;
            sub = smoothToward(sub, Math.max(0, bands.sub), followK);
            bass = smoothToward(bass, Math.max(0, bands.b), followK);
            mid = smoothToward(mid, Math.max(0, bands.m), followK);
            treble = smoothToward(treble, Math.max(0, bands.t), followK);
            air = smoothToward(air, Math.max(0, bands.air), followK);
            spectralFlux = smoothToward(spectralFlux, Math.max(0, bands.flux), 0.25);
            beatFlash = Math.max(0, Math.min(1, (bass - bassPrev) * 4.2 + spectralFlux * 0.9));
            bassPrev = bass;
            const tSong = songProgress01();
            const w = musicPlaying && !prefersReducedMotion ? narrativeWeights(tSong) : {
                insect: 0.15, egg: 0.1, hatch: 0.08, ml: 0.1, products: 0.08,
                lockin: 0.4, chicken: 0.2, eggml: 0.2, algo: 0.1, mosquito: 0.1
            };

            updateHandoffOpacity();
            syncIntroFrameDom();
            emitDistortionFrame({
                mode: introMode,
                playing: musicPlaying,
                tSong,
                weights: w,
                bands: { sub, bass, mid, treble, air, spectralFlux, beatFlash },
                muted,
                themeLight
            });

            requestAnimationFrame(animate);
            return;
        }
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
            bands = { sub: 0.09, b: 0.1, m: 0.09, t: 0.08, air: 0.07, flux: 0 };
        } else if (musicPlaying && analyser) {
            bands = bandsFromAnalyser();
        } else {
            bands = fakeBands(time);
        }

        const followK = musicPlaying && !prefersReducedMotion ? 0.27 : 0.11;
        bass = smoothToward(bass, bands.b, followK);
        mid = smoothToward(mid, bands.m, followK);
        treble = smoothToward(treble, bands.t, followK);
        sub = smoothToward(sub, bands.sub != null ? bands.sub : bass * 0.6, followK);
        air = smoothToward(air, bands.air != null ? bands.air : treble * 0.5, followK);
        spectralFlux = smoothToward(spectralFlux, bands.flux != null ? bands.flux : 0, 0.4);

        const beatDeriv = Math.max(0, bass - bassPrev - 0.012);
        bassPrev = bass;
        const transientHit = Math.min(1, beatDeriv * 9 + spectralFlux * 1.1 + sub * 0.35);
        beatFlash = smoothToward(beatFlash, transientHit, 0.3);

        const tSong = songProgress01();
        const w = musicPlaying && !prefersReducedMotion ? narrativeWeights(tSong) : { insect: 0.15, egg: 0.1, hatch: 0.08, ml: 0.1, products: 0.08 };
        narrativePhase01 = tSong;

        const wLock = w.lockin || 0;
        const wChicken = w.chicken || 0;
        const wEggMl = w.eggml || 0;
        const wAlgo = w.algo || 0;
        const wMosquito = w.mosquito || 0;
        const wInsect = Math.min(1, w.insect * (musicPlaying ? 1 : 0.3));
        const wEgg = w.egg;
        const wHatch = w.hatch;
        const wMl = w.ml + w.products * 0.5;
        const wProd = w.products;

        const songArc = musicPlaying ? bell(tSong, 0.5, 0.32) : 0;
        hatchAmount = smoothToward(
            hatchAmount,
            Math.min(1, wHatch * 1.45 + treble * 0.48 + beatFlash * 0.38 + songArc * 0.22 + tSong * 0.1 * (musicPlaying ? 1 : 0)),
            0.095
        );
        hsiPhase += 0.008 + treble * 0.055 + air * 0.035 + (musicPlaying ? tSong * 0.032 + spectralFlux * 0.045 : 0);

        const spin = prefersReducedMotion
            ? 0.0004
            : 0.0018 + mid * (0.005 + wInsect * 0.004) + sub * 0.003 + (musicPlaying ? 0.0014 * Math.sin(tSong * Math.PI * 2 * 2) : 0);
        const mx = prefersReducedMotion ? 0 : mouseX;
        const my = prefersReducedMotion ? 0 : mouseY;

        const tc = themeColors();
        const colInt = Math.min(1, bass * 0.55 + mid * 0.32 + treble * 0.2 + sub * 0.28 + spectralFlux * 0.42);
        const scrollMul =
            1 +
            mid * (0.95 + wInsect * 0.7) +
            bass * 0.4 +
            (musicPlaying ? 0.35 * Math.sin(tSong * Math.PI * 2 * 4) + 0.15 * songArc : 0);
        const specSongBoost = musicPlaying ? songArc * 0.85 + spectralFlux * 0.5 : 0;

        if (eggMesh) {
            eggMesh.rotation.y += spin + mx * 0.008;
            eggMesh.rotation.x += Math.sin(time * 0.4) * 0.001 + my * 0.006;
            const pulse = 1 + bass * 0.09 + treble * 0.05 + sub * 0.06 + (musicPlaying ? 0.04 * Math.sin(tSong * Math.PI * 2 * 6) : 0);
            const eggStoryGain = 0.72 + wChicken * 0.28 + wEggMl * 0.42 + wMosquito * 0.1;
            eggMesh.scale.set(1.12 * pulse * eggStoryGain, 1.52 * pulse * eggStoryGain, 1.05 * pulse * eggStoryGain);
            eggMesh.material.transparent = false;
            eggMesh.material.opacity = 1;

            const em = eggMesh.material;
            const hue = (hsiPhase * 0.08 + wEgg * 0.14 + treble * 0.18 + (musicPlaying ? tSong * 0.12 : 0)) % 1;
            em.emissive.setHSL(0.28 + hue * 0.18, 0.45 + wEgg * 0.22, 0.14 + treble * 0.28 + air * 0.08);
            em.emissiveIntensity = (themeLight ? 0.08 : 0.16) + wEgg * 0.18 + beatFlash * 0.32 + spectralFlux * 0.15;
        }

        if (eggWire) {
            eggWire.rotation.copy(eggMesh.rotation);
            eggWire.scale.copy(eggMesh.scale);
            eggWire.material.opacity = (themeLight ? 0.22 : 0.35) * (1 - hatchAmount * 0.45) + treble * 0.15;
        }

        const showSplit = hatchAmount > 0.45 && wHatch > 0.34;
        if (eggTop && eggBot && eggMesh) {
            eggTop.visible = showSplit;
            eggBot.visible = showSplit;
            // Keep the core shell visible to avoid intermittent “opacity drop” artifacts.
            eggMesh.visible = true;
            if (eggWire) eggWire.visible = true;
            if (showSplit) {
                eggTop.scale.copy(eggMesh.scale);
                eggBot.scale.copy(eggMesh.scale);
                eggTop.rotation.copy(eggMesh.rotation);
                eggBot.rotation.copy(eggMesh.rotation);
                eggTop.material.transparent = false;
                eggTop.material.opacity = 1;
                eggTop.material.emissive.copy(eggMesh.material.emissive);
                eggTop.material.emissiveIntensity = eggMesh.material.emissiveIntensity;
                eggBot.material.transparent = false;
                eggBot.material.opacity = 1;
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
            const orbit = time * (0.38 + wEgg * 0.48) + (musicPlaying ? tSong * Math.PI * 2 * 4 : 0) + bass * 0.85;
            const r = 1.45 + wEgg * 0.2;
            satelliteEgg.position.x = Math.cos(orbit) * r;
            satelliteEgg.position.z = Math.sin(orbit) * r * 0.85;
            satelliteEgg.position.y = -0.35 + Math.sin(orbit * 2) * 0.15;
            satelliteEgg.scale.setScalar(0.9 + wEgg * 0.15 + bass * 0.08);
        }

        if (!prefersReducedMotion || Math.floor(time * 10) % 24 === 0) {
            drawSpectrogramColumn(colInt, scrollMul, specSongBoost);
            if (specTexture) specTexture.needsUpdate = true;
            drawEpg2Spikes(mid, treble, tSong, spectralFlux);
            if (epg2Texture) epg2Texture.needsUpdate = true;
        }

        if (specPlane) {
            specPlane.position.y =
                -1.35 +
                Math.sin(time * 0.9) * 0.04 * (prefersReducedMotion ? 0.2 : 1) +
                (musicPlaying ? Math.sin(tSong * Math.PI * 2 * 4) * 0.07 : 0);
            specPlane.material.opacity = (themeLight ? 0.88 : 0.92) * (0.65 + colInt * 0.35 + wInsect * 0.15);
        }
        if (epg2Plane) {
            epg2Plane.material.opacity = 0.45 + wInsect * 0.45 + mid * 0.15;
            epg2Plane.position.x = Math.sin(time * 0.35) * 0.08 * wInsect + (musicPlaying ? Math.sin(tSong * Math.PI * 2 * 3) * 0.06 : 0);
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

        if (syntaxConstellation && syntaxGlyphs.length) {
            const centroid = (sub * 0.1 + bass * 0.25 + mid * 0.5 + treble * 0.75 + air * 0.95) / Math.max(0.001, sub + bass + mid + treble + air);
            const swirl = 0.45 + (wAlgo * 1.1 + wProd * 0.5) + centroid * 0.6;
            syntaxConstellation.rotation.y += 0.0035 * swirl;
            syntaxConstellation.rotation.x = Math.sin(time * 0.35 + centroid * 3) * 0.22;
            const alpha = Math.min(0.92, 0.04 + wAlgo * 0.85 + wProd * 0.35 + spectralFlux * 0.3);
            syntaxGlyphs.forEach((glyph, i) => {
                const ud = glyph.userData;
                const ang = time * (0.38 + swirl) + ud.phase + tSong * Math.PI * 2 * (0.6 + i * 0.02);
                glyph.position.set(
                    Math.cos(ang) * ud.radius,
                    Math.sin(ang * 1.7 + i * 0.3) * 0.26 + Math.cos(ang * 0.7) * 0.09,
                    Math.sin(ang) * ud.radius * 0.64
                );
                glyph.lookAt(camera.position);
                glyph.material.opacity = alpha * (0.72 + 0.28 * Math.sin(time * 3 + i));
            });
        }

        if (focusLockGroup && focusLockGroup.userData) {
            const d = focusLockGroup.userData;
            const gate = Math.min(1, wLock * 1.3 + wProd * 0.45 + wMl * 0.2);
            const lockPulse = 0.75 + beatFlash * 0.5 + spectralFlux * 0.35;
            focusLockGroup.rotation.y += 0.002 + gate * 0.006;
            focusLockGroup.rotation.x = Math.sin(time * 0.5 + tSong * Math.PI * 2) * 0.3;
            d.ringA.material.opacity = 0.06 + gate * 0.28 * lockPulse;
            d.ringB.material.opacity = 0.05 + gate * 0.22 * (0.85 + air * 0.4);
            d.ringA.scale.setScalar(0.96 + gate * 0.12 + beatFlash * 0.08);
            d.ringB.scale.setScalar(0.98 + gate * 0.14 + spectralFlux * 0.1);
            d.latch.material.opacity = 0.08 + gate * 0.4;
            d.latch.position.y = -0.03 + Math.sin(time * 4 + beatFlash * 6) * 0.03 + gate * 0.02;
            if (d.shackle) d.shackle.material.opacity = 0.08 + gate * 0.35;
            if (d.body) d.body.material.opacity = 0.06 + gate * 0.3;
            focusLockGroup.position.y = -0.72 + wLock * 0.08 + Math.sin(time * 1.6) * 0.03;
        }

        if (rimLight) {
            rimLight.intensity = (themeLight ? 0.4 : 0.65) * (1 + beatFlash * 0.5 + wHatch * 0.3);
        }

        if (!dragActive) {
            dragYaw += dragYawVel;
            dragPitch += dragPitchVel;
            dragYawVel *= 0.92;
            dragPitchVel *= 0.9;
            dragPitch = Math.max(-0.5, Math.min(0.5, dragPitch));
            if (Math.abs(dragYawVel) < 0.00002) dragYawVel = 0;
            if (Math.abs(dragPitchVel) < 0.00002) dragPitchVel = 0;
        }

        const dragX = Math.sin(dragYaw) * 0.95;
        const dragY = -dragPitch * 0.7;
        const dragZ = (1 - Math.cos(dragYaw)) * 0.35 + Math.abs(dragPitch) * 0.12;
        const musicZ = musicPlaying && !prefersReducedMotion ? Math.sin(tSong * Math.PI * 2 * 3) * 0.14 + songArc * 0.08 : 0;
        const targetZ = baseCameraZ + scrollHandoff01 * 0.85 + musicZ + dragZ;
        const targetY = 0.15 + my * 0.22 + dragY;
        const targetX = mx * 0.35 + dragX;
        if (camera) {
            camera.position.x += (targetX - camera.position.x) * 0.04;
            camera.position.y += (targetY - camera.position.y) * 0.04;
            camera.position.z += (targetZ - camera.position.z) * 0.06;
            camera.lookAt(
                Math.sin(tSong * Math.PI * 2 * 2) * 0.04 * (musicPlaying ? 1 : 0) + dragX * 0.15,
                -0.05 + wEgg * 0.05 + (musicPlaying ? Math.sin(tSong * Math.PI * 2 * 8) * 0.07 : 0) + dragY * 0.16,
                0
            );
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
        const dissolveP = Math.max(0, Math.min(1, (p - 0.38) / 0.34));
        scrollP = p;
        scrollHandoff01 = p;

        try {
            window.dispatchEvent(new CustomEvent('portfolioHeroScroll', { detail: { p, dissolveP, scrolledPast, heroHeight: total } }));
        } catch (e) { /* ignore */ }

        const heroContent = hero.querySelector('.hero-content');
        const infoReached = heroContent ? heroContent.getBoundingClientRect().top <= window.innerHeight * 0.9 : false;
        if ((infoReached || dissolveP > 0.86) && musicPlaying && audioEl && !audioEl.paused) {
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
        const dissolveP = Math.max(0, Math.min(1, (p - 0.38) / 0.34));
        const sidelineT = Math.min(1, Math.max(0, (p - 0.1) / 0.62));
        const tyVh = -sidelineT * 46;
        const sc = (1 - sidelineT * 0.54) * (1 - dissolveP * 0.2);
        const opacity = Math.max(0, 1 - dissolveP);
        const ent = easeOutCubic(Math.min(1, introEntranceT / 1.14));
        const flowInX = prefersReducedMotion ? 0 : (1 - ent) * 0.32 * window.innerWidth;
        handoffEl.style.transformOrigin = '50% 0%';
        handoffEl.style.transform = `translate3d(${flowInX}px, ${tyVh}vh, 0) scale(${sc})`;
        handoffEl.style.opacity = String(Math.max(0, Math.min(1, opacity)));
        handoffEl.style.filter = `blur(${(dissolveP * 6).toFixed(2)}px)`;
    }

    function stopTrackFromScroll() {
        musicPlaying = false;
        bandEnergyPrev = 0;
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
        emitDistortionFrame({ mode: introMode, playing: musicPlaying, muted });
    }

    function userPauseTrack() {
        musicPlaying = false;
        bandEnergyPrev = 0;
        introMode = 'idle';
        document.body.classList.remove('intro-play-active', 'intro-narrative-playing');
        if (songPopup) songPopup.classList.remove('active');
        if (audioEl) audioEl.pause();
        if (playBtn) {
            playBtn.setAttribute('aria-label', 'Play music and reactive visuals');
            playBtn.classList.remove('playing');
        }
        emitDistortionFrame({ mode: introMode, playing: musicPlaying, muted });
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
        bandEnergyPrev = 0;
        introMode = 'playing';
        document.body.classList.add('intro-play-active', 'intro-narrative-playing');
        if (songPopup) songPopup.classList.add('active');
        playBtn.setAttribute('aria-label', 'Pause music');
        playBtn.classList.add('playing');
        emitDistortionFrame({ mode: introMode, playing: musicPlaying, muted });
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
        emitDistortionFrame({ mode: introMode, playing: musicPlaying, muted });
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

    function onDragStart(e) {
        if (!canvasEl) return;
        dragActive = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        if (typeof canvasEl.setPointerCapture === 'function') {
            try { canvasEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
    }

    function onDragMove(e) {
        onPointerMove(e);
        if (!dragActive) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        const sens = isMobile ? 0.0032 : 0.0024;
        dragYaw += dx * sens;
        dragPitch += dy * sens * 0.85;
        dragPitch = Math.max(-0.48, Math.min(0.48, dragPitch));
        dragYawVel = dx * sens;
        dragPitchVel = dy * sens * 0.85;
    }

    function onDragEnd(e) {
        dragActive = false;
        if (!canvasEl) return;
        if (typeof canvasEl.releasePointerCapture === 'function') {
            try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
    }

    document.addEventListener('visibilitychange', () => {
        tabHidden = document.hidden;
    });

    function start() {
        if (started) return;
        started = true;
        introEntranceT = 0;
        if (!DISTORTION_ONLY) buildScene();
        pickPlaylist().then(() => {});

        document.addEventListener('mousemove', onPointerMove, { passive: true });
        if (!DISTORTION_ONLY) {
            canvasEl.addEventListener('pointerdown', onDragStart);
            canvasEl.addEventListener('pointermove', onDragMove);
            canvasEl.addEventListener('pointerup', onDragEnd);
            canvasEl.addEventListener('pointercancel', onDragEnd);
            canvasEl.addEventListener('pointerleave', onDragEnd);
            window.addEventListener('resize', onResize);
        }

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
