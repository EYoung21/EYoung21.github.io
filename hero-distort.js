(() => {
    const canvas = document.getElementById('hero-distort-canvas') || document.getElementById('intro-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const playBtnEl = document.getElementById('intro-play-btn');
    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d');
    if (!ctx || !srcCtx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chapters = [
        {
            key: 'lockin', label: 'LOCK IN',
            lines: ['focus.lock(apps.social)', 'session.start(90m)', 'streak += 1'],
            tint: '#32f08c',
            icon: 'LOCK',
            persona: 'Founder building focus products',
            impact: 'Shipped cross-platform productivity app with streak mechanics'
        },
        {
            key: 'chicken', label: 'CHICKEN',
            lines: ['lifeCycle.bootstrap()', 'hatch.seed(chicken)', 'iterate(instinct)'],
            tint: '#f59e0b',
            icon: 'CHICK',
            persona: 'Applied ML in ag + lifecycle data',
            impact: 'Research from signal mountain roots to real-world farms'
        },
        {
            key: 'eggml', label: 'EGG ML',
            lines: ['egg.scan(hsi)', 'model.fit(features)', 'loss -> 0.03'],
            tint: '#60a5fa',
            icon: 'EGG-ML',
            persona: 'Research engineer (UIUC x USDA)',
            impact: 'Built interpretable pipelines for egg viability prediction'
        },
        {
            key: 'algo', label: 'ALGOARENA',
            lines: ['battle.queue(opponents)', 'solve(dp | graphs)', 'rank.update(+42)'],
            tint: '#a78bfa',
            icon: 'ARENA',
            persona: 'Builder + competitor + full-stack cofounder',
            impact: 'Designed and shipped real-time coding battles at scale'
        },
        {
            key: 'mosquito', label: 'MOSQUITO / EPG',
            lines: ['epg.trace(frequency)', 'sharpshooter.target(lock)', 'ml.predict(trajectory)'],
            tint: '#f43f5e',
            icon: 'EPG',
            persona: 'Signal processing + ML systems',
            impact: 'Extracted robust EPG features with measurable F1 gains'
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
        beatShock: 0,
        colorShock: 0,
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

    function roundRectPath(context, x, y, w, h, r) {
        const radius = Math.max(0, Math.min(r, Math.min(w, h) * 0.5));
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + w - radius, y);
        context.quadraticCurveTo(x + w, y, x + w, y + radius);
        context.lineTo(x + w, y + h - radius);
        context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        context.lineTo(x + radius, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    }

    function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        if (!words.length) return 0;
        const lines = [''];
        words.forEach((word) => {
            const current = lines[lines.length - 1];
            const candidate = current ? `${current} ${word}` : word;
            if (context.measureText(candidate).width <= maxWidth) {
                lines[lines.length - 1] = candidate;
            } else if (lines.length < maxLines) {
                lines.push(word);
            } else {
                let last = `${lines[maxLines - 1]} ${word}`.trim();
                while (context.measureText(`${last}...`).width > maxWidth && last.length > 1) {
                    last = last.slice(0, -1);
                }
                lines[maxLines - 1] = `${last.trimEnd()}...`;
            }
        });
        if (lines.length > maxLines) {
            lines.length = maxLines;
        }
        lines.slice(0, maxLines).forEach((ln, idx) => context.fillText(ln, x, y + idx * lineHeight));
        return Math.min(lines.length, maxLines);
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
        const e = state.playing ? (state.bands.bass * 0.35 + state.bands.spectralFlux * 0.85 + state.beatShock * 0.65) : 0;
        const g = srcCtx.createLinearGradient(0, 0, 0, state.h);
        g.addColorStop(0, state.palette.bg);
        g.addColorStop(0.58, mix('#101820', chapters[state.chapterIdx].tint, state.playing ? 0.18 + e * 0.34 : 0.03));
        g.addColorStop(1, state.palette.bg);
        srcCtx.fillStyle = g;
        srcCtx.fillRect(0, 0, state.w, state.h);

        srcCtx.strokeStyle = state.palette.line;
        srcCtx.lineWidth = 1;
        const step = Math.max(32, Math.round(state.w / 34));
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
        const size = Math.max(76, Math.min(286, state.w * 0.215));
        srcCtx.font = `900 ${size}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
        const chapter = chapters[state.chapterIdx];
        const huePulse = state.playing ? Math.min(1, state.bands.spectralFlux * 0.9 + state.beatShock * 0.7) : 0;
        srcCtx.fillStyle = huePulse > 0.02 ? mix('#c8ffe8', chapter.tint, Math.min(1, huePulse)) : state.palette.fg;
        srcCtx.textAlign = 'center';
        srcCtx.textBaseline = 'middle';
        const pulseY = state.playing ? 8 + state.bands.bass * 18 + state.beatShock * 14 : 2;
        const y = state.h * 0.5 + Math.sin(performance.now() * 0.0016) * pulseY;
        const split = state.playing ? Math.min(42, state.bands.treble * 16 + state.bands.spectralFlux * 28 + state.beatShock * 24) : 0;
        if (split > 0.1) {
            srcCtx.fillStyle = rgb(chapter.tint, 0.85);
            srcCtx.fillText('ELI', state.w * 0.31 - split, y);
            srcCtx.fillText('YOUNG', state.w * 0.67 + split, y);
            srcCtx.fillStyle = rgb('#ffffff', 0.12 + split / 80);
            srcCtx.fillRect(state.w * 0.5 - 1, y - size * 0.34, 2, size * 0.64);
        } else {
            srcCtx.fillText('ELI YOUNG', state.w * 0.5, y);
        }

        if (!state.playing) return;
        const canvasRect = canvas.getBoundingClientRect();
        let overlayX = 36;
        if (playBtnEl && canvasRect.width > 0) {
            const playRect = playBtnEl.getBoundingClientRect();
            if (playRect.width > 0 && playRect.height > 0) {
                const right = playRect.right - canvasRect.left;
                overlayX = Math.max(36, Math.min(state.w * 0.52, right + 22));
            }
        }
        const iconSize = Math.max(22, Math.min(46, state.w * 0.027));
        srcCtx.font = `800 ${iconSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        srcCtx.textAlign = 'left';
        srcCtx.fillStyle = rgb(chapter.tint, 0.26 + state.bands.bass * 0.18 + state.bands.beatFlash * 0.2);
        srcCtx.fillText(`[${chapter.icon}]`, overlayX, Math.max(84, state.h * 0.6));

        srcCtx.font = `700 ${Math.max(14, Math.min(24, state.w * 0.018))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        srcCtx.textAlign = 'left';
        srcCtx.fillStyle = rgb(chapter.tint, 0.84 + state.bands.spectralFlux * 0.15);
        srcCtx.fillText(`// ${chapter.label}`, overlayX, Math.max(110, state.h * 0.66));

        srcCtx.font = `600 ${Math.max(12, Math.min(20, state.w * 0.015))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        chapter.lines.forEach((line, i) => {
            const phase = ((state.tSong * 1000 + i * 120) % 1000) / 1000;
            const alpha = 0.42 + (state.bands.spectralFlux || 0) * 0.56 + state.beatShock * 0.22 + Math.sin(phase * Math.PI * 2) * 0.16;
            srcCtx.fillStyle = rgb(chapter.tint, Math.max(0.3, Math.min(0.95, alpha)));
            srcCtx.fillText(line, overlayX, Math.max(138, state.h * 0.72) + i * 26);
        });

        const narrow = state.w < 820;
        const tiny = state.w < 560;
        const hudW = narrow ? Math.min(state.w - 28, 360) : Math.min(520, state.w * 0.48);
        const hudH = narrow ? 116 : 96;
        const hudY = narrow ? Math.max(212, state.h * 0.81) : Math.max(224, state.h * 0.84);
        roundRectPath(srcCtx, overlayX - 16, hudY - 34, hudW, hudH, 14);
        srcCtx.fillStyle = rgb('#050608', 0.44 + state.bands.bass * 0.2);
        srcCtx.fill();
        srcCtx.strokeStyle = rgb(chapter.tint, 0.35 + state.bands.beatFlash * 0.28);
        srcCtx.lineWidth = 1;
        srcCtx.stroke();

        srcCtx.font = `600 ${Math.max(10, Math.min(13, state.w * (narrow ? 0.017 : 0.011)))}px Inter, system-ui, sans-serif`;
        srcCtx.fillStyle = rgb('#ffffff', 0.86);
        srcCtx.fillText(chapter.persona, overlayX, hudY - 10);

        srcCtx.font = `500 ${Math.max(9, Math.min(12, state.w * (narrow ? 0.015 : 0.01)))}px Inter, system-ui, sans-serif`;
        srcCtx.fillStyle = rgb('#d1d5db', 0.78);
        const linesUsed = drawWrappedText(
            srcCtx,
            chapter.impact,
            overlayX,
            hudY + 12,
            hudW - 28,
            narrow ? 14 : 13,
            narrow ? 2 : 1
        );

        const skills = [
            ['build', Math.min(1, (state.weights.algo || 0) * 0.9 + (state.weights.lockin || 0) * 0.45 + state.bands.bass * 0.35)],
            ['research', Math.min(1, (state.weights.eggml || 0) * 0.95 + (state.weights.mosquito || 0) * 0.55 + state.bands.mid * 0.28)],
            ['ship', Math.min(1, (state.weights.lockin || 0) * 0.65 + (state.weights.algo || 0) * 0.52 + state.bands.spectralFlux * 0.4)]
        ];
        const meterY = hudY + (narrow ? 18 + linesUsed * 14 : 36);
        const meterGap = tiny ? 8 : 12;
        const meterW = Math.min(narrow ? 100 : 132, (hudW - 24 - meterGap * 2) / 3);
        skills.forEach((item, i) => {
            const x = overlayX + i * (meterW + meterGap);
            srcCtx.font = `600 ${Math.max(9, Math.min(11, state.w * 0.009))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
            srcCtx.fillStyle = rgb('#9ca3af', 0.95);
            srcCtx.fillText(item[0], x, meterY);

            roundRectPath(srcCtx, x, meterY + 8, meterW, 10, 6);
            srcCtx.fillStyle = rgb('#111827', 0.84);
            srcCtx.fill();

            roundRectPath(srcCtx, x, meterY + 8, meterW * item[1], 10, 6);
            srcCtx.fillStyle = rgb(chapter.tint, 0.78 + state.bands.beatFlash * 0.18);
            srcCtx.fill();
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
        state.motion = Math.min(320, state.motion + 35 * gain + state.bands.spectralFlux * 20);

        const spread = state.playing ? 240 : 120;
        for (let i = 0; i < slices.length; i += 1) {
            const midX = i * SLICE_W + SLICE_W * 0.5;
            const dist = Math.abs(midX - x);
            if (dist > spread) continue;
            const f = 1 - dist / spread;
            const dir = midX < x ? -1 : 1;
            const chaos = state.playing ? (1.15 + state.bands.spectralFlux * 2.0 + state.bands.beatFlash * 1.1) : 0.55;
            slices[i].dx += dir * f * (chaos + Math.random() * 0.55);
            slices[i].dy += (Math.random() - 0.5) * (state.playing ? 3.6 : 0.8) * f;
        }
    }

    function distortStep(now) {
        const idle = now - state.lastMoveAt > 120;
        const pull = idle ? (state.playing ? 0.9 : 0.84) : 0.94;
        state.motion *= pull;
        const damp = state.playing ? 0.86 : 0.8;
        state.beatShock *= 0.86;
        state.colorShock *= 0.91;
        for (let i = 0; i < slices.length; i += 1) {
            const s = slices[i];
            s.dx *= damp;
            s.dy *= damp;
            if (state.playing) {
                const pulse = Math.sin(now * 0.007 + i * 0.17) * (state.bands.bass * 0.7 + state.beatShock * 1.3);
                s.dx += pulse * 0.22;
            }
        }
    }

    function render(now) {
        drawSource();
        distortStep(now);
        ctx.clearRect(0, 0, state.w, state.h);
        const audioAmp = state.playing
            ? (16 + state.bands.bass * 38 + state.bands.spectralFlux * 46 + state.bands.beatFlash * 30 + state.beatShock * 36)
            : 9;
        const amp = prefersReducedMotion ? 2 : Math.min(96, state.motion * 0.18 + audioAmp);

        for (let i = 0; i < slices.length; i += 1) {
            const x = i * SLICE_W;
            const w = Math.min(SLICE_W, state.w - x);
            const sx = x;
            const idxPhase = Math.sin(i * 0.07 + now * 0.0037) * (state.playing ? state.bands.mid * 4.6 + state.beatShock * 3.1 : 0.4);
            const dx = x + (slices[i].dx + idxPhase) * amp * 0.085;
            const dy = (slices[i].dy + Math.cos(i * 0.05 + now * 0.0032) * (state.playing ? state.bands.air * 3.2 + state.beatShock * 2.2 : 0.2)) * amp * 0.055;
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
            const incomingBeat = d.bands.beatFlash || 0;
            state.bands = {
                sub: d.bands.sub || 0,
                bass: d.bands.bass || 0,
                mid: d.bands.mid || 0,
                treble: d.bands.treble || 0,
                air: d.bands.air || 0,
                spectralFlux: d.bands.spectralFlux || 0,
                beatFlash: incomingBeat
            };
            if (incomingBeat > 0.12 || state.bands.spectralFlux > 0.16) {
                state.beatShock = Math.min(1, state.beatShock + incomingBeat * 1.5 + state.bands.spectralFlux * 0.9);
                state.colorShock = Math.min(1, state.colorShock + incomingBeat * 1.2);
                state.motion = Math.min(360, state.motion + 28 + incomingBeat * 80 + state.bands.spectralFlux * 65);
            }
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
