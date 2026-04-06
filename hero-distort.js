(() => {
    const canvas = document.getElementById('hero-distort-canvas') || document.getElementById('intro-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d');
    if (!ctx || !srcCtx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chapters = [
        {
            key: 'lockin', label: 'LOCK IN',
            lines: ['focus.lock(apps.social)', 'session.start(90m)', 'streak += 1'],
            tint: '#32f08c'
        },
        {
            key: 'chicken', label: 'CHICKEN',
            lines: ['lifeCycle.bootstrap()', 'hatch.seed(chicken)', 'iterate(instinct)'],
            tint: '#f59e0b'
        },
        {
            key: 'eggml', label: 'EGG ML',
            lines: ['egg.scan(hsi)', 'model.fit(features)', 'loss -> 0.03'],
            tint: '#60a5fa'
        },
        {
            key: 'algo', label: 'ALGOARENA',
            lines: ['battle.queue(opponents)', 'solve(dp | graphs)', 'rank.update(+42)'],
            tint: '#a78bfa'
        },
        {
            key: 'mosquito', label: 'MOSQUITO / EPG',
            lines: ['epg.trace(frequency)', 'sharpshooter.target(lock)', 'ml.predict(trajectory)'],
            tint: '#f43f5e'
        }
    ];

    const state = {
        dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
        w: 0,
        h: 0,
        pointerX: -9999,
        pointerY: -9999,
        motion: 0,
        lastMoveAt: 0,
        playing: false,
        mode: 'idle',
        tSong: 0,
        weights: { lockin: 1, chicken: 0, eggml: 0, algo: 0, mosquito: 0 },
        bands: { sub: 0, bass: 0, mid: 0, treble: 0, air: 0, spectralFlux: 0, beatFlash: 0 },
        chapterIdx: 0,
        palette: { bg: '#0a0b0d', fg: '#32f08c', line: 'rgba(255,255,255,0.08)' }
    };

    const slices = [];
    const SLICE_W = 5;

    function rgb(hex, alpha) {
        const h = hex.replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function mix(a, b, t) {
        const c1 = parseInt(a.slice(1), 16);
        const c2 = parseInt(b.slice(1), 16);
        const r = Math.round(((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t);
        const g = Math.round(((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t);
        const bl = Math.round((c1 & 255) * (1 - t) + (c2 & 255) * t);
        return `rgb(${r}, ${g}, ${bl})`;
    }

    function pickChapterIndex(weights) {
        let best = 0;
        let bestV = -1;
        chapters.forEach((ch, i) => {
            const v = weights[ch.key] || 0;
            if (v > bestV) {
                bestV = v;
                best = i;
            }
        });
        return best;
    }

    function applyThemePalette() {
        const theme = document.body.getAttribute('data-theme') || 'dark';
        const activeTint = chapters[state.chapterIdx].tint;
        if (theme === 'light') {
            state.palette.bg = '#f6f7f8';
            state.palette.fg = '#12151a';
            state.palette.line = 'rgba(0,0,0,0.09)';
        } else {
            state.palette.bg = '#050608';
            state.palette.fg = activeTint;
            state.palette.line = 'rgba(255,255,255,0.08)';
        }
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        state.w = Math.floor(rect.width);
        state.h = Math.floor(rect.height);
        const pxW = Math.max(1, Math.floor(state.w * state.dpr));
        const pxH = Math.max(1, Math.floor(state.h * state.dpr));
        canvas.width = pxW;
        canvas.height = pxH;
        srcCanvas.width = pxW;
        srcCanvas.height = pxH;
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        srcCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        const needed = Math.ceil(state.w / SLICE_W);
        slices.length = needed;
        for (let i = 0; i < needed; i += 1) {
            if (!slices[i]) slices[i] = { dx: 0, dy: 0 };
        }
    }

    function drawBackgroundGrid() {
        const g = srcCtx.createLinearGradient(0, 0, 0, state.h);
        g.addColorStop(0, state.palette.bg);
        g.addColorStop(0.58, mix('#101820', chapters[state.chapterIdx].tint, state.playing ? 0.12 : 0.03));
        g.addColorStop(1, state.palette.bg);
        srcCtx.fillStyle = g;
        srcCtx.fillRect(0, 0, state.w, state.h);

        srcCtx.strokeStyle = state.palette.line;
        srcCtx.lineWidth = 1;
        const step = Math.max(36, Math.round(state.w / 34));
        for (let x = 0; x < state.w; x += step) {
            srcCtx.beginPath();
            srcCtx.moveTo(x + 0.5, 0);
            srcCtx.lineTo(x + 0.5, state.h);
            srcCtx.stroke();
        }
        for (let y = 0; y < state.h; y += Math.max(42, Math.round(state.h / 16))) {
            srcCtx.beginPath();
            srcCtx.moveTo(0, y + 0.5);
            srcCtx.lineTo(state.w, y + 0.5);
            srcCtx.stroke();
        }
    }

    function drawHeroText() {
        const size = Math.max(76, Math.min(250, state.w * 0.2));
        srcCtx.font = `900 ${size}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
        srcCtx.fillStyle = state.palette.fg;
        srcCtx.textAlign = 'center';
        srcCtx.textBaseline = 'middle';
        const y = state.h * 0.48 + Math.sin(performance.now() * 0.0016) * (state.playing ? 4 + state.bands.bass * 5 : 2);
        srcCtx.fillText('ELI YOUNG', state.w * 0.5, y);

        if (!state.playing) return;
        const chapter = chapters[state.chapterIdx];
        srcCtx.font = `700 ${Math.max(14, Math.min(24, state.w * 0.018))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        srcCtx.textAlign = 'left';
        srcCtx.fillStyle = rgb(chapter.tint, 0.92);
        srcCtx.fillText(`// ${chapter.label}`, 36, Math.max(70, state.h * 0.12));

        srcCtx.font = `600 ${Math.max(12, Math.min(20, state.w * 0.015))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        chapter.lines.forEach((line, i) => {
            const phase = ((state.tSong * 1000 + i * 120) % 1000) / 1000;
            const alpha = 0.45 + (state.bands.spectralFlux || 0) * 0.4 + Math.sin(phase * Math.PI * 2) * 0.12;
            srcCtx.fillStyle = rgb(chapter.tint, Math.max(0.3, Math.min(0.95, alpha)));
            srcCtx.fillText(line, 36, Math.max(100, state.h * 0.18) + i * 26);
        });
    }

    function drawSource() {
        srcCtx.clearRect(0, 0, state.w, state.h);
        drawBackgroundGrid();
        drawHeroText();
    }

    function affectFromPointer(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
        state.pointerX = x;
        state.pointerY = y;
        state.lastMoveAt = performance.now();
        const gain = state.playing ? (1.15 + state.bands.treble * 0.9) : 1;
        state.motion = Math.min(220, state.motion + 24 * gain);

        const spread = state.playing ? 180 : 120;
        for (let i = 0; i < slices.length; i += 1) {
            const midX = i * SLICE_W + SLICE_W * 0.5;
            const dist = Math.abs(midX - x);
            if (dist > spread) continue;
            const f = 1 - dist / spread;
            const dir = midX < x ? -1 : 1;
            const chaos = state.playing ? (0.8 + state.bands.spectralFlux * 1.2) : 0.55;
            slices[i].dx += dir * f * (chaos + Math.random() * 0.55);
            slices[i].dy += (Math.random() - 0.5) * (state.playing ? 2.2 : 0.8) * f;
        }
    }

    function distortStep(now) {
        const idle = now - state.lastMoveAt > 120;
        const pull = idle ? (state.playing ? 0.88 : 0.84) : 0.92;
        state.motion *= pull;
        const damp = state.playing ? 0.84 : 0.8;
        for (let i = 0; i < slices.length; i += 1) {
            const s = slices[i];
            s.dx *= damp;
            s.dy *= damp;
        }
    }

    function render(now) {
        drawSource();
        distortStep(now);
        ctx.clearRect(0, 0, state.w, state.h);
        const audioAmp = state.playing
            ? (12 + state.bands.bass * 18 + state.bands.spectralFlux * 24 + state.bands.beatFlash * 12)
            : 9;
        const amp = prefersReducedMotion ? 2 : Math.min(56, state.motion * 0.12 + audioAmp);

        for (let i = 0; i < slices.length; i += 1) {
            const x = i * SLICE_W;
            const w = Math.min(SLICE_W, state.w - x);
            const sx = x;
            const idxPhase = Math.sin(i * 0.07 + now * 0.002) * (state.playing ? state.bands.mid * 2.4 : 0.4);
            const dx = x + (slices[i].dx + idxPhase) * amp * 0.06;
            const dy = (slices[i].dy + Math.cos(i * 0.05 + now * 0.0018) * (state.playing ? state.bands.air * 1.8 : 0.2)) * amp * 0.04;
            ctx.drawImage(srcCanvas, sx * state.dpr, 0, w * state.dpr, state.h * state.dpr, dx, dy, w, state.h);
        }
        requestAnimationFrame(render);
    }

    window.addEventListener('mousemove', (e) => affectFromPointer(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        affectFromPointer(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener('introDistortionFrame', (ev) => {
        const d = ev.detail || {};
        state.playing = !!d.playing;
        state.mode = d.mode || (state.playing ? 'playNarrative' : 'idleDistortion');
        state.tSong = typeof d.tSong === 'number' ? d.tSong : state.tSong;
        state.weights = d.weights || state.weights;
        if (d.bands) {
            state.bands = {
                sub: d.bands.sub || 0,
                bass: d.bands.bass || 0,
                mid: d.bands.mid || 0,
                treble: d.bands.treble || 0,
                air: d.bands.air || 0,
                spectralFlux: d.bands.spectralFlux || 0,
                beatFlash: d.bands.beatFlash || 0
            };
        }
        state.chapterIdx = pickChapterIndex(state.weights);
        applyThemePalette();
    });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mo = new MutationObserver(() => applyThemePalette());
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    applyThemePalette();
    resize();
    requestAnimationFrame(render);
})();
