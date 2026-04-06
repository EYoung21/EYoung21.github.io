(() => {
    const canvas = document.getElementById('hero-distort-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d');
    if (!ctx || !srcCtx) return;

    const state = {
        dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
        w: 0,
        h: 0,
        pointerX: -9999,
        pointerY: -9999,
        motion: 0,
        lastMoveAt: 0,
        palette: {
            bg: '#0a0b0d',
            fg: '#32f08c',
            line: 'rgba(255,255,255,0.08)'
        }
    };

    const slices = [];
    const SLICE_W = 6;

    function applyThemePalette() {
        const theme = document.body.getAttribute('data-theme') || 'dark';
        if (theme === 'light') {
            state.palette.bg = '#f6f7f8';
            state.palette.fg = '#111317';
            state.palette.line = 'rgba(0,0,0,0.1)';
        } else {
            state.palette.bg = '#0a0b0d';
            state.palette.fg = '#32f08c';
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

    function drawSource() {
        srcCtx.clearRect(0, 0, state.w, state.h);
        srcCtx.fillStyle = state.palette.bg;
        srcCtx.fillRect(0, 0, state.w, state.h);

        srcCtx.strokeStyle = state.palette.line;
        srcCtx.lineWidth = 1;
        srcCtx.strokeRect(0.5, 0.5, state.w - 1, state.h - 1);

        const fontSize = Math.max(32, Math.min(116, state.w * 0.16));
        srcCtx.font = `800 ${fontSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
        srcCtx.fillStyle = state.palette.fg;
        srcCtx.textAlign = 'center';
        srcCtx.textBaseline = 'middle';
        srcCtx.fillText('ELI YOUNG', state.w * 0.5, state.h * 0.53);
    }

    function distortStep(now) {
        const idle = now - state.lastMoveAt > 120;
        const pull = idle ? 0.86 : 0.93;
        state.motion *= pull;

        for (let i = 0; i < slices.length; i += 1) {
            const s = slices[i];
            s.dx *= 0.82;
            s.dy *= 0.82;
        }
    }

    function render(now) {
        drawSource();
        distortStep(now);

        ctx.clearRect(0, 0, state.w, state.h);
        const amp = Math.min(24, state.motion * 0.18);

        for (let i = 0; i < slices.length; i += 1) {
            const x = i * SLICE_W;
            const w = Math.min(SLICE_W, state.w - x);
            const sx = x;
            const sy = 0;
            const dx = x + slices[i].dx * amp;
            const dy = slices[i].dy * amp;
            ctx.drawImage(srcCanvas, sx * state.dpr, sy, w * state.dpr, state.h * state.dpr, dx, dy, w, state.h);
        }

        requestAnimationFrame(render);
    }

    function affectFromPointer(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        state.pointerX = x;
        state.pointerY = y;
        state.lastMoveAt = performance.now();
        state.motion = Math.min(140, state.motion + 28);

        const spread = 120;
        for (let i = 0; i < slices.length; i += 1) {
            const midX = i * SLICE_W + SLICE_W * 0.5;
            const dist = Math.abs(midX - x);
            if (dist > spread) continue;
            const f = 1 - dist / spread;
            const dir = midX < x ? -1 : 1;
            slices[i].dx += dir * f * (0.55 + Math.random() * 0.4);
            slices[i].dy += (Math.random() - 0.5) * 0.8 * f;
        }

        const waveRows = 8;
        for (let r = 0; r < waveRows; r += 1) {
            const influence = 1 - Math.min(1, Math.abs((r / waveRows) * state.h - y) / (state.h * 0.6));
            if (influence <= 0) continue;
            const idx = Math.floor((x / state.w) * (slices.length - 1));
            if (slices[idx]) slices[idx].dy += (Math.random() - 0.5) * influence * 1.5;
        }
    }

    canvas.addEventListener('mousemove', (e) => affectFromPointer(e.clientX, e.clientY));
    canvas.addEventListener('touchmove', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        affectFromPointer(t.clientX, t.clientY);
    }, { passive: true });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mo = new MutationObserver(() => applyThemePalette());
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    applyThemePalette();
    resize();
    requestAnimationFrame(render);
})();
