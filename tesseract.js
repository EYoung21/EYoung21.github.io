// A small four-dimensional cube beside the name, a nod to the hypercube on the old site.
// It turns for about four seconds after the page loads and then holds still, so it never
// competes with the text (WCAG 2.2.2 covers motion that runs longer than five seconds).
// Drag it to spin it. With "reduce motion" turned on, it only moves while being dragged.
(() => {
    const h1 = document.querySelector('h1');
    if (!h1 || !document.createElement('canvas').getContext) return;

    const c = document.createElement('canvas');
    c.className = 'tesseract';
    c.setAttribute('aria-hidden', 'true');
    c.title = 'Drag to spin';
    h1.append(c);
    const ctx = c.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');

    // 16 corners at (±1, ±1, ±1, ±1); an edge joins corners that differ in one coordinate.
    const V = [];
    for (let i = 0; i < 16; i++) V.push([0, 1, 2, 3].map(b => (i >> b) & 1 ? 1 : -1));
    const E = [];
    for (let i = 0; i < 16; i++) {
        for (let b = 0; b < 4; b++) {
            const j = i ^ (1 << b);
            if (i < j) E.push([i, j]);
        }
    }

    let xw = 0.5, yz = 0.35;                 // rotation angles, radians
    let vx = reduce.matches ? 0 : 1.7;       // angular speed, radians per second
    let vy = reduce.matches ? 0 : 0.6;
    let last = 0, running = false, dragging = false, px = 0, py = 0;

    function size() {
        const dpr = window.devicePixelRatio || 1;
        const px = Math.round(c.clientWidth * dpr);
        if (c.width !== px) c.width = c.height = px;
    }

    function project([x, y, z, w]) {
        const x1 = x * Math.cos(xw) - w * Math.sin(xw);
        const w1 = x * Math.sin(xw) + w * Math.cos(xw);
        const y1 = y * Math.cos(yz) - z * Math.sin(yz);
        const z1 = y * Math.sin(yz) + z * Math.cos(yz);
        const p4 = 1 / (3 - w1);             // 4D to 3D perspective
        const X = x1 * p4, Y = y1 * p4, Z = z1 * p4;
        const t = 0.55;                       // fixed tilt so the cube reads as 3D
        const X2 = X * Math.cos(t) - Z * Math.sin(t);
        const Z2 = X * Math.sin(t) + Z * Math.cos(t);
        const p3 = 1 / (2.4 - Z2);            // 3D to 2D perspective
        return [X2 * p3, Y * p3, w1];
    }

    function draw() {
        size();
        const s = c.width, k = s * 1.15;
        ctx.clearRect(0, 0, s, s);
        ctx.strokeStyle = getComputedStyle(c).color;
        ctx.lineWidth = Math.max(1, s / 40);
        ctx.lineCap = 'round';
        const P = V.map(project);
        for (const [i, j] of E) {
            // edges deeper in the fourth dimension are drawn fainter
            ctx.globalAlpha = 0.35 + 0.65 * (((P[i][2] + P[j][2]) / 2 + 1.5) / 3);
            ctx.beginPath();
            ctx.moveTo(s / 2 + P[i][0] * k, s / 2 + P[i][1] * k);
            ctx.lineTo(s / 2 + P[j][0] * k, s / 2 + P[j][1] * k);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!dragging) {
            xw += vx * dt;
            yz += vy * dt;
            const decay = Math.exp(-dt / 1.1); // slows to a stop in about four seconds
            vx *= decay;
            vy *= decay;
        }
        draw();
        if (dragging || Math.abs(vx) + Math.abs(vy) > 0.01) {
            requestAnimationFrame(frame);
        } else {
            running = false;
        }
    }

    function start() {
        if (running) return;
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
    }

    c.addEventListener('pointerdown', e => {
        dragging = true;
        px = e.clientX;
        py = e.clientY;
        vx = vy = 0;
        c.setPointerCapture(e.pointerId);
        start();
    });
    c.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - px, dy = e.clientY - py;
        px = e.clientX;
        py = e.clientY;
        xw += dx * 0.03;
        yz += dy * 0.03;
        if (!reduce.matches) {
            vx = dx * 1.2;
            vy = dy * 1.2;
        }
    });
    const release = () => { dragging = false; };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
    window.addEventListener('resize', draw);

    draw();
    if (!reduce.matches) start();
})();
