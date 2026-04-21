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
            icon: 'LOCK'
        },
        {
            key: 'chicken', label: 'CHICKEN',
            lines: ['lifeCycle.bootstrap()', 'hatch.seed(chicken)', 'iterate(instinct)'],
            tint: '#f59e0b',
            icon: 'CHICK'
        },
        {
            key: 'eggml', label: 'EGG ML',
            lines: ['egg.scan(hsi)', 'model.fit(features)', 'loss -> 0.03'],
            tint: '#60a5fa',
            icon: 'EGG-ML'
        },
        {
            key: 'algo', label: 'ALGOARENA',
            lines: ['battle.queue(opponents)', 'solve(dp | graphs)', 'rank.update(+42)'],
            tint: '#a78bfa',
            icon: 'ARENA'
        },
        {
            key: 'mosquito', label: 'MOSQUITO / EPG',
            lines: ['epg.trace(frequency)', 'sharpshooter.target(lock)', 'ml.predict(trajectory)'],
            tint: '#f43f5e',
            icon: 'EPG'
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
        renderedChapterIdx: 0,
        scrambleStart: 0,
        particles: [],
        beatShock: 0,
        colorShock: 0,
        palette: { bg: '#0a0b0d', fg: '#32f08c', line: 'rgba(255,255,255,0.08)' },
        iconDrifters: [],
        dissolveP: 0
    };

    /* ── 2D tile grid for localized distortion (like Trae.ai) ── */
    const TILE = 28;  // tile size in CSS pixels
    let tiles = [];   // flat array of { dx, dy } per tile
    let tileCols = 0;
    let tileRows = 0;

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

    function drawChipIcon(context, key, cx, cy, size, color, active) {
        const s = size;
        context.save();
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = Math.max(1.4, s * 0.12);
        switch (key) {
            case 'lockin': {
                roundRectPath(context, cx - s * 0.32, cy - s * 0.03, s * 0.64, s * 0.42, s * 0.1);
                context.stroke();
                context.beginPath();
                context.arc(cx, cy - s * 0.03, s * 0.22, Math.PI * 1.05, Math.PI * 1.95);
                context.stroke();
                context.beginPath();
                context.arc(cx, cy + s * 0.15, s * 0.05, 0, Math.PI * 2);
                context.fill();
                break;
            }
            case 'chicken': {
                context.beginPath();
                context.arc(cx - s * 0.02, cy + s * 0.03, s * 0.23, 0, Math.PI * 2);
                context.stroke();
                context.beginPath();
                context.moveTo(cx + s * 0.2, cy + s * 0.02);
                context.lineTo(cx + s * 0.36, cy + s * 0.1);
                context.lineTo(cx + s * 0.2, cy + s * 0.18);
                context.closePath();
                context.fill();
                context.beginPath();
                context.moveTo(cx - s * 0.14, cy - s * 0.18);
                context.lineTo(cx - s * 0.06, cy - s * 0.3);
                context.lineTo(cx + s * 0.02, cy - s * 0.18);
                context.stroke();
                break;
            }
            case 'eggml': {
                context.beginPath();
                context.ellipse(cx, cy + s * 0.03, s * 0.22, s * 0.31, 0, 0, Math.PI * 2);
                context.stroke();
                if (active) {
                    context.beginPath();
                    context.moveTo(cx - s * 0.08, cy + s * 0.05);
                    context.lineTo(cx, cy - s * 0.02);
                    context.lineTo(cx + s * 0.1, cy + s * 0.1);
                    context.stroke();
                }
                break;
            }
            case 'algo': {
                context.beginPath();
                context.moveTo(cx - s * 0.25, cy + s * 0.22);
                context.lineTo(cx + s * 0.2, cy - s * 0.25);
                context.stroke();
                context.beginPath();
                context.moveTo(cx + s * 0.25, cy + s * 0.22);
                context.lineTo(cx - s * 0.2, cy - s * 0.25);
                context.stroke();
                context.beginPath();
                context.moveTo(cx - s * 0.22, cy + s * 0.22);
                context.lineTo(cx - s * 0.1, cy + s * 0.32);
                context.moveTo(cx + s * 0.22, cy + s * 0.22);
                context.lineTo(cx + s * 0.1, cy + s * 0.32);
                context.stroke();
                break;
            }
            case 'mosquito': {
                context.beginPath();
                context.ellipse(cx, cy + s * 0.06, s * 0.1, s * 0.22, 0, 0, Math.PI * 2);
                context.stroke();
                context.beginPath();
                context.ellipse(cx - s * 0.12, cy - s * 0.06, s * 0.14, s * 0.08, -0.4, 0, Math.PI * 2);
                context.ellipse(cx + s * 0.12, cy - s * 0.06, s * 0.14, s * 0.08, 0.4, 0, Math.PI * 2);
                context.stroke();
                context.beginPath();
                context.moveTo(cx, cy + s * 0.23);
                context.lineTo(cx, cy + s * 0.36);
                context.moveTo(cx - s * 0.14, cy + s * 0.2);
                context.lineTo(cx - s * 0.2, cy + s * 0.34);
                context.moveTo(cx + s * 0.14, cy + s * 0.2);
                context.lineTo(cx + s * 0.2, cy + s * 0.34);
                context.stroke();
                break;
            }
            default:
                break;
        }
        context.restore();
    }

    function spawnDrifter(xOverride, keyOverride) {
        const keys = ['lockin', 'chicken', 'eggml', 'algo', 'mosquito'];
        const chosenKey = keyOverride || keys[Math.floor(Math.random() * keys.length)];
        return {
            key: chosenKey,
            x: typeof xOverride === 'number' ? xOverride : -120 - Math.random() * 420,
            y: state.h * (0.22 + Math.random() * 0.58),
            size: Math.max(120, Math.min(280, state.w * (0.12 + Math.random() * 0.08))),
            speed: 0.45 + Math.random() * 1.05,
            phase: Math.random() * Math.PI * 2
        };
    }

    function ensureDrifters(chapterKey) {
        const target = state.w < 900 ? 4 : 6;
        if (state.iconDrifters.length === target) return;
        state.iconDrifters = [];
        for (let i = 0; i < target; i += 1) {
            state.iconDrifters.push(spawnDrifter(-150 - i * (state.w / Math.max(1, target)), chapterKey));
        }
    }

    function drawDriftingIcons(chapter) {
        ensureDrifters(chapter.key);
        
        // Smooth the lift so the icons glide instead of jerking
        const targetLift = 0.45 + state.bands.bass * 0.75 + state.bands.spectralFlux * 0.4;
        state.smoothLift = state.smoothLift || 0;
        state.smoothLift += (targetLift - state.smoothLift) * 0.15;
        
        const dominantKey = chapter.key;
        state.iconDrifters.forEach((d, i) => {
            if (d.key !== dominantKey) d.key = dominantKey;
            
            // Approach target speed smoothly
            const targetSpeed = d.speed * (1.2 + state.smoothLift * 4.0);
            d.currentSpeed = d.currentSpeed || targetSpeed;
            d.currentSpeed += (targetSpeed - d.currentSpeed) * 0.08;
            d.x += d.currentSpeed;
            
            d.y += Math.sin(state.tSong * 2.5 + d.phase + i * 0.3) * (0.2 + state.bands.air * 0.85);
            
            if (d.x - d.size * 0.55 > state.w) {
                const reset = spawnDrifter(-d.size - 40 - Math.random() * 160, dominantKey);
                d.key = dominantKey;
                d.x = reset.x;
                d.y = reset.y;
                d.size = reset.size;
                d.speed = reset.speed;
                d.currentSpeed = 0;
                d.phase = reset.phase;
            }
            
            const alpha = 1.0;

            srcCtx.save();
            if (d.key === dominantKey) {
                srcCtx.shadowColor = rgb(chapter.tint, 0.55 + state.bands.beatFlash * 0.45);
                srcCtx.shadowBlur = 10 + state.bands.beatFlash * 25;
            }
            drawChipIcon(srcCtx, d.key, d.x, d.y, d.size, rgb(chapter.tint, alpha), d.key === dominantKey);
            srcCtx.restore();
        });
    }

    function pseudoRand(n) {
        const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
        return x - Math.floor(x);
    }

    function applyDissolveMask() {
        const d = Math.max(0, Math.min(1, state.dissolveP || 0));
        if (d <= 0.001) return;
        const cols = state.w < 768 ? 12 : 20;
        const rows = state.w < 768 ? 18 : 12;
        const cw = state.w / cols;
        const ch = state.h / rows;
        for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
                const i = r * cols + c;
                const order = pseudoRand(i);
                if (d <= order) continue;
                
                ctx.clearRect(
                    c * cw - 0.5,
                    r * ch - 0.5,
                    cw + 1,
                    ch + 1
                );
            }
        }
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

        // Build 2D tile grid
        tileCols = Math.ceil(state.w / TILE);
        tileRows = Math.ceil(state.h / TILE);
        const needed = tileCols * tileRows;
        tiles = [];
        for (let i = 0; i < needed; i += 1) {
            tiles.push({ dx: 0, dy: 0 });
        }
    }

    function drawBackgroundGrid() {
        const d = Math.max(0, Math.min(1, state.dissolveP || 0));
        const e = state.playing ? (state.bands.bass * 0.35 + state.bands.spectralFlux * 0.85 + state.beatShock * 0.65) : 0;
        // Reduce green tint as dissolve progresses so remaining tiles don't form a green orb
        const tintFade = Math.max(0, 1 - d * 1.5);
        const tintAmt = (state.playing ? 0.18 + e * 0.34 : 0.03) * tintFade;
        const g = srcCtx.createLinearGradient(0, 0, 0, state.h);
        g.addColorStop(0, state.palette.bg);
        g.addColorStop(0.58, mix('#101820', chapters[state.chapterIdx].tint, tintAmt));
        g.addColorStop(1, state.palette.bg);
        srcCtx.fillStyle = g;
        srcCtx.fillRect(0, 0, state.w, state.h);

        // Fade grid lines during dissolve
        const lineAlpha = Math.max(0, 1 - d * 2);
        if (lineAlpha > 0.01) {
            srcCtx.globalAlpha = lineAlpha;
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
            srcCtx.globalAlpha = 1;
        }
    }

    function scrambleString(txt, progress) {
        if (progress <= 0) return txt;
        let res = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#_';
        for (let i = 0; i < txt.length; i++) {
            if (txt[i] === ' ' || Math.random() > progress) res += txt[i];
            else res += chars[Math.floor(Math.random() * chars.length)];
        }
        return res;
    }

    function drawHeroText() {
        const d = Math.max(0, Math.min(1, state.dissolveP || 0));

        const leftPad = Math.max(18, state.w * 0.035);
        let baseSize = Math.max(76, Math.min(286, state.w * 0.215));
        srcCtx.font = `900 ${baseSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
        const chapter = chapters[state.chapterIdx];
        while (srcCtx.measureText('ELI YOUNG').width > state.w - leftPad * 2 && baseSize > 66) {
            baseSize *= 0.95;
            srcCtx.font = `900 ${baseSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
        }
        const huePulse = state.playing ? Math.min(1, state.bands.spectralFlux * 0.9 + state.beatShock * 0.7) : 0;
        const baseColor = huePulse > 0.02 ? mix('#c8ffe8', chapter.tint, Math.min(1, huePulse)) : state.palette.fg;
        srcCtx.textAlign = 'left';
        srcCtx.textBaseline = 'middle';
        const pulseY = state.playing ? 8 + state.bands.bass * 18 + state.beatShock * 14 : 2;
        const y = state.h * 0.5 + Math.sin(performance.now() * 0.0016) * pulseY;
        const split = state.playing ? Math.min(42, state.bands.treble * 16 + state.bands.spectralFlux * 28 + state.beatShock * 24) : 0;
        const textStartX = leftPad;

        const drawAberrationText = (text, tx, ty, fillBase) => {
            const aberration = state.playing ? Math.min(18, state.bands.beatFlash * 55 * state.beatShock) : 0;
            if (aberration > 1.0) {
                srcCtx.fillStyle = 'rgba(0, 255, 255, 0.7)';
                srcCtx.fillText(text, tx - aberration, ty);
                srcCtx.fillStyle = 'rgba(255, 0, 255, 0.7)';
                srcCtx.fillText(text, tx + aberration, ty);
            }
            srcCtx.fillStyle = fillBase;
            srcCtx.fillText(text, tx, ty);
        };

        if (split > 0.1) {
            let splitSize = baseSize;
            srcCtx.font = `900 ${splitSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
            let wEli = srcCtx.measureText('ELI').width;
            let wYoung = srcCtx.measureText('YOUNG').width;
            const desiredGap = Math.max(22, Math.min(84, state.w * 0.06)) + split * 1.45;
            const maxAllowed = state.w - leftPad * 2;
            const totalWidth = wEli + wYoung + desiredGap;
            if (totalWidth > maxAllowed) {
                const shrink = Math.max(0.72, maxAllowed / totalWidth);
                splitSize *= shrink;
                srcCtx.font = `900 ${splitSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
                wEli = srcCtx.measureText('ELI').width;
                wYoung = srcCtx.measureText('YOUNG').width;
            }
            const xEli = textStartX;
            const xYoung = xEli + wEli + desiredGap;
            
            drawAberrationText('ELI', xEli, y, rgb(chapter.tint, 0.85));
            drawAberrationText('YOUNG', xYoung, y, rgb(chapter.tint, 0.85));
            
            srcCtx.fillStyle = rgb('#ffffff', 0.12 + split / 80);
            srcCtx.fillRect(xEli + wEli + desiredGap * 0.5 - 1, y - splitSize * 0.34, 2, splitSize * 0.64);
        } else {
            srcCtx.font = `900 ${baseSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
            drawAberrationText('ELI YOUNG', textStartX, y, baseColor);
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
        
        const scrambleP = Math.max(0, 1 - (performance.now() - (state.scrambleStart || 0)) / 450);

        const iconSize = Math.max(22, Math.min(46, state.w * 0.027));
        srcCtx.font = `800 ${iconSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        srcCtx.textAlign = 'left';
        srcCtx.fillStyle = rgb(chapter.tint, 0.26 + state.bands.bass * 0.18 + state.bands.beatFlash * 0.2);
        srcCtx.fillText(scrambleString(`[${chapter.icon}]`, scrambleP), overlayX, Math.max(84, state.h * 0.6));

        srcCtx.font = `700 ${Math.max(14, Math.min(24, state.w * 0.018))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        srcCtx.textAlign = 'left';
        srcCtx.fillStyle = rgb(chapter.tint, 0.84 + state.bands.spectralFlux * 0.15);
        srcCtx.fillText(scrambleString(`// ${chapter.label}`, scrambleP), overlayX, Math.max(110, state.h * 0.66));

        srcCtx.font = `600 ${Math.max(12, Math.min(20, state.w * 0.015))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        chapter.lines.forEach((line, i) => {
            const phase = ((state.tSong * 1000 + i * 120) % 1000) / 1000;
            const alpha = 0.42 + (state.bands.spectralFlux || 0) * 0.56 + state.beatShock * 0.22 + Math.sin(phase * Math.PI * 2) * 0.16;
            srcCtx.fillStyle = rgb(chapter.tint, Math.max(0.3, Math.min(0.95, alpha)));
            srcCtx.fillText(scrambleString(line, scrambleP), overlayX, Math.max(138, state.h * 0.72) + i * 26);
        });
        drawDriftingIcons(chapter);
    }

    function drawWavelengths() {
        if (!state.playing) return;
        const d = Math.max(0, Math.min(1, state.dissolveP || 0));
        const lineAlpha = Math.max(0, 1 - d * 2);
        if (lineAlpha <= 0.01) return;

        srcCtx.save();
        const chapter = chapters[state.chapterIdx];
        const color = chapter.tint;
        const baseline = state.h * 0.88; 

        // Main EPG trace
        srcCtx.beginPath();
        srcCtx.strokeStyle = color;
        srcCtx.lineWidth = Math.max(1, state.w * 0.0012);
        srcCtx.lineJoin = 'round';
        srcCtx.globalAlpha = lineAlpha * 0.6;

        const points = Math.max(100, Math.floor(state.w / 5));
        const step = state.w / points;
        
        const time = performance.now() * 0.003;
        const b = state.bands.bass || 0;
        const m = state.bands.mid || 0;
        const t = state.bands.treble || 0;
        const flux = state.bands.spectralFlux || 0;

        for (let i = 0; i <= points; i++) {
            const x = i * step;
            const normX = i / points;
            
            let wave = 0;
            wave += Math.sin(normX * 8 - time * 1.5) * b * 65; 
            wave += Math.sin(normX * 35 + time * 2) * m * 35; 
            wave += Math.sin(normX * 90 - time * 4) * t * 18; 
            wave += (pseudoRand(i * 13 + Math.floor(time * 3)) - 0.5) * flux * 40;
            
            const envelope = Math.sin(normX * Math.PI);
            let y = baseline - (wave * envelope);
            
            // Pointer repulsion
            if (state.pointerX > 0 && state.pointerY > 0) {
                const dx = x - state.pointerX;
                const dy = y - state.pointerY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const repulseRad = 150 + state.bands.beatFlash * 80;
                if (dist < repulseRad) {
                    const force = Math.pow(1 - dist / repulseRad, 2);
                    y += force * (130 + state.bands.spectralFlux * 60); 
                }
            }
            
            if (i === 0) srcCtx.moveTo(x, y);
            else srcCtx.lineTo(x, y);
        }
        srcCtx.stroke();

        // Secondary fainter EPG trace (shifted phase)
        srcCtx.beginPath();
        srcCtx.globalAlpha = lineAlpha * 0.25;
        for (let i = 0; i <= points; i++) {
            const x = i * step;
            const normX = i / points;
            let wave = 0;
            wave += Math.sin(normX * 12 - time * 1.8) * b * 50; 
            wave += Math.sin(normX * 42 + time * 2.5) * m * 25; 
            wave += Math.sin(normX * 110 - time * 4.5) * t * 12; 
            wave += (pseudoRand(i * 17 + Math.floor(time * 4)) - 0.5) * flux * 25;
            const envelope = Math.sin(normX * Math.PI);
            let y = baseline - (wave * envelope);
            
            // Pointer repulsion
            if (state.pointerX > 0 && state.pointerY > 0) {
                const dx = x - state.pointerX;
                const dy = y - state.pointerY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const repulseRad = 150 + state.bands.beatFlash * 80;
                if (dist < repulseRad) {
                    const force = Math.pow(1 - dist / repulseRad, 2);
                    y += force * (80 + state.bands.spectralFlux * 40); 
                }
            }
            
            if (i === 0) srcCtx.moveTo(x, y);
            else srcCtx.lineTo(x, y);
        }
        srcCtx.stroke();

        // Hyperspectral style vertical bounds
        srcCtx.globalAlpha = lineAlpha * 0.15;
        const specBars = Math.floor(state.w / 12);
        const specStep = state.w / specBars;
        for (let i = 0; i < specBars; i++) {
            const x = i * specStep;
            const normX = i / specBars;
            let intensity = 0;
            if (normX < 0.3) intensity = b;
            else if (normX < 0.7) intensity = m;
            else intensity = t;
            
            intensity *= 0.3 + 0.7 * Math.sin(i * 0.8 - time * 0.8);
            
            if (intensity > 0.08) {
                const barH = intensity * 180;
                const g = srcCtx.createLinearGradient(0, baseline, 0, baseline - barH);
                g.addColorStop(0, mix(state.palette.bg, color, 0.85));
                g.addColorStop(1, state.palette.bg);
                srcCtx.fillStyle = g;
                srcCtx.fillRect(x, baseline - barH, specStep * 0.7, barH);
            }
        }
        srcCtx.restore();
    }

    function updateAndDrawParticles() {
        if (!state.particles) state.particles = [];
        for (let i = state.particles.length - 1; i >= 0; i--) {
            let p = state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35; // gravity
            p.life -= 0.02 + Math.random() * 0.02;
            if (p.life <= 0) {
                state.particles.splice(i, 1);
                continue;
            }
            srcCtx.fillStyle = p.color;
            srcCtx.globalAlpha = p.life;
            srcCtx.beginPath();
            srcCtx.arc(p.x, p.y, p.life * 2.5, 0, Math.PI * 2);
            srcCtx.fill();
        }
        srcCtx.globalAlpha = 1;
    }

    function drawSource() {
        srcCtx.clearRect(0, 0, state.w, state.h);
        drawBackgroundGrid();
        updateAndDrawParticles();
        drawWavelengths();
        drawHeroText();
    }

    /* ── Pointer: apply localized 2D force to tile grid ── */
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

        const radius = state.playing ? 240 : 140;
        const minCol = Math.max(0, Math.floor((x - radius) / TILE));
        const maxCol = Math.min(tileCols - 1, Math.ceil((x + radius) / TILE));
        const minRow = Math.max(0, Math.floor((y - radius) / TILE));
        const maxRow = Math.min(tileRows - 1, Math.ceil((y + radius) / TILE));

        for (let row = minRow; row <= maxRow; row += 1) {
            for (let col = minCol; col <= maxCol; col += 1) {
                const midX = col * TILE + TILE * 0.5;
                const midY = row * TILE + TILE * 0.5;
                const ddx = midX - x;
                const ddy = midY - y;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dist > radius) continue;
                const f = 1 - dist / radius;
                const chaos = state.playing ? (1.15 + state.bands.spectralFlux * 2.0 + state.bands.beatFlash * 1.1) : 0.55;
                const idx = row * tileCols + col;
                // Push tiles away from cursor (radial force)
                const angle = Math.atan2(ddy, ddx);
                tiles[idx].dx += Math.cos(angle) * f * (chaos + Math.random() * 0.35) * 0.7;
                tiles[idx].dy += Math.sin(angle) * f * (chaos + Math.random() * 0.35) * 0.7;
            }
        }
        
        // Spawn sparks on drag and strong transient features
        if (state.playing && state.bands.beatFlash > 0.4) {
            if (Math.random() < state.bands.beatFlash) {
                const chapter = chapters[state.chapterIdx];
                for (let i = 0; i < 4; i++) {
                    state.particles.push({
                        x: x,
                        y: y,
                        vx: (Math.random() - 0.5) * 12 + (x - (state.pointerLastX || x)) * 0.4,
                        vy: (Math.random() - 0.5) * 12 + (y - (state.pointerLastY || y)) * 0.4,
                        life: 1.0,
                        color: Math.random() > 0.4 ? chapter.tint : '#ffffff'
                    });
                }
            }
        }
        state.pointerLastX = x;
        state.pointerLastY = y;
    }

    function distortStep(now) {
        const idle = now - state.lastMoveAt > 120;
        const pull = idle ? (state.playing ? 0.9 : 0.84) : 0.94;
        state.motion *= pull;
        const damp = state.playing ? 0.88 : 0.82;
        state.beatShock *= 0.86;
        state.colorShock *= 0.91;
        for (let i = 0; i < tiles.length; i += 1) {
            const t = tiles[i];
            t.dx *= damp;
            t.dy *= damp;
            if (state.playing) {
                const col = i % tileCols;
                const row = Math.floor(i / tileCols);
                const pulse = Math.sin(now * 0.007 + col * 0.17 + row * 0.13) * (state.bands.bass * 0.5 + state.beatShock * 0.9);
                t.dx += pulse * 0.12;
                t.dy += Math.cos(now * 0.006 + row * 0.15 + col * 0.09) * (state.bands.mid * 0.3 + state.beatShock * 0.5) * 0.08;
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

        // Smoothly dim entire canvas content as dissolve progresses
        const d = Math.max(0, Math.min(1, state.dissolveP || 0));
        ctx.globalAlpha = 1;

        /* ── 2D tile-based rendering (localized XY distortion) ── */
        for (let row = 0; row < tileRows; row += 1) {
            for (let col = 0; col < tileCols; col += 1) {
                const idx = row * tileCols + col;
                const x = col * TILE;
                const y = row * TILE;
                const w = Math.min(TILE, state.w - x);
                const h = Math.min(TILE, state.h - y);
                if (w <= 0 || h <= 0) continue;

                const tileData = tiles[idx];
                const idxPhaseX = Math.sin(col * 0.07 + row * 0.05 + now * 0.0037) * (state.playing ? state.bands.mid * 3.2 + state.beatShock * 2.0 : 0.3);
                const idxPhaseY = Math.cos(row * 0.06 + col * 0.04 + now * 0.0032) * (state.playing ? state.bands.air * 2.4 + state.beatShock * 1.5 : 0.15);
                const dx = x + (tileData.dx + idxPhaseX) * amp * 0.065;
                const dy = y + (tileData.dy + idxPhaseY) * amp * 0.055;

                ctx.drawImage(
                    srcCanvas,
                    x * state.dpr, y * state.dpr,
                    w * state.dpr, h * state.dpr,
                    dx, dy,
                    w, h
                );
            }
        }

        // Reset globalAlpha before dissolve mask (clearRect ignores it but good practice)
        ctx.globalAlpha = 1;
        applyDissolveMask();
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
        state.dissolveP = typeof d.dissolveP === 'number' ? d.dissolveP : state.dissolveP;
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
        const newChapterIdx = pickChapterIndex(state.weights);
        if (state.renderedChapterIdx !== newChapterIdx) {
            state.renderedChapterIdx = newChapterIdx;
            state.scrambleStart = performance.now();
        }
        state.chapterIdx = newChapterIdx;
        applyThemePalette();
    });

    window.addEventListener('triggerTerminalShatter', () => {
        const chapter = chapters[state.chapterIdx] || chapters[0];
        const numParticles = prefersReducedMotion ? 60 : 350;
        const cx = state.w / 2;
        const cy = state.h / 2;
        
        state.beatShock = 1.0;
        state.motion = 450;
        if (!state.bands) state.bands = {};
        state.bands.beatFlash = 1.0;

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 7 + Math.random() * 30;
            state.particles.push({
                x: cx + (Math.random() - 0.5) * (state.w * 0.4),
                y: cy + (Math.random() - 0.5) * (state.h * 0.4),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0 + Math.random() * 1.5,
                color: Math.random() > 0.25 ? chapter.tint : '#ffffff'
            });
        }
        
        for (let i = 0; i < tiles.length; i++) {
            const col = i % tileCols;
            const row = Math.floor(i / tileCols);
            const midX = col * TILE + TILE * 0.5;
            const midY = row * TILE + TILE * 0.5;
            const dx = midX - cx;
            const dy = midY - cy;
            const dist = Math.sqrt(dx*dx + dy*dy) + 1;
            const force = 3000 / dist;
            tiles[i].dx += (dx / dist) * force;
            tiles[i].dy += (dy / dist) * force;
        }
    });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mo = new MutationObserver(() => applyThemePalette());
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    applyThemePalette();
    resize();
    requestAnimationFrame(render);
})();
