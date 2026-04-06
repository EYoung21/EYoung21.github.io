/**
 * Background wireframe hypercube (restored from pre–egg-only era).
 * Shown only after scrolling past the hero egg stage — opacity driven by `portfolioHeroScroll`.
 */
(function () {
    'use strict';
    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('theme-canvas');
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;

    let cubeOpacity = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const hypercubeGroup = new THREE.Group();
    scene.add(hypercubeGroup);

    const numPlanes = isMobile ? 14 : 24;
    const planeSize = 16;
    const spacing = 1.0;
    const planes = [];

    function themeHex() {
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        return {
            box: light ? 0x22c55e : 0x00ff66,
            particle: light ? 0x22c55e : 0x00ff66,
            outer: light ? 0x15803d : 0x00aa44
        };
    }

    let tc = themeHex();

    for (let i = 0; i < numPlanes; i++) {
        const geom = new THREE.PlaneGeometry(planeSize, planeSize, 8, 8);
        const hue = 0.4 + (i / numPlanes) * 0.2;
        const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.1 + (i === 0 || i === numPlanes - 1 ? 0.15 : 0)
        });
        const plane = new THREE.Mesh(geom, mat);
        plane.position.z = (i - numPlanes / 2) * spacing;
        hypercubeGroup.add(plane);
        planes.push({ mesh: plane, index: i, baseZ: plane.position.z });
    }

    const boxGeom = new THREE.BoxGeometry(planeSize, planeSize, numPlanes * spacing);
    const edges = new THREE.EdgesGeometry(boxGeom);
    const boxMat = new THREE.LineBasicMaterial({ color: tc.box, transparent: true, opacity: 0.3 });
    const boundingBox = new THREE.LineSegments(edges, boxMat);
    hypercubeGroup.add(boundingBox);

    const particleGeom = new THREE.BufferGeometry();
    const pCount = isMobile ? 120 : 200;
    const pPos = new Float32Array(pCount * 3);
    const pVel = [];
    for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * planeSize;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * planeSize;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * (numPlanes * spacing);
        pVel.push(new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1));
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
        color: tc.particle,
        size: isMobile ? 0.14 : 0.2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const coreParticles = new THREE.Points(particleGeom, pMat);
    hypercubeGroup.add(coreParticles);

    const outerGroup = new THREE.Group();
    scene.add(outerGroup);
    const outerPlanes = [];
    const outerNum = 8;
    for (let i = 0; i < outerNum; i++) {
        const geom = new THREE.PlaneGeometry(100, 100, 10, 10);
        const mat = new THREE.MeshBasicMaterial({ color: tc.outer, wireframe: true, transparent: true, opacity: 0.03 });
        const plane = new THREE.Mesh(geom, mat);
        plane.position.z = (i - outerNum / 2) * 5;
        outerGroup.add(plane);
        outerPlanes.push(plane);
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let time = 0;

    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        targetMouseX = (t.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(t.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    function applyTheme() {
        tc = themeHex();
        boundingBox.material.color.setHex(tc.box);
        coreParticles.material.color.setHex(tc.particle);
        outerPlanes.forEach((p) => p.material.color.setHex(tc.outer));
    }
    new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function onHeroScroll(ev) {
        const p = ev.detail && typeof ev.detail.p === 'number' ? ev.detail.p : 0;
        cubeOpacity = p < 0.48 ? 0 : Math.min(1, (p - 0.48) / 0.42);
        const vis = cubeOpacity * (document.documentElement.getAttribute('data-theme') === 'light' ? 0.72 : 0.88);
        canvas.style.opacity = String(vis);
    }
    window.addEventListener('portfolioHeroScroll', onHeroScroll);

    function animate() {
        if (cubeOpacity >= 0.02) {
            const rotSpeed = prefersReducedMotion ? 0.0008 : 0.0032;
            time += prefersReducedMotion ? 0.005 : 0.015;
            const follow = prefersReducedMotion ? 0.03 : 0.11;
            mouseX += (targetMouseX - mouseX) * follow;
            mouseY += (targetMouseY - mouseY) * follow;
            const mouseDist = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
            const expansion = 1 + mouseDist * 0.75;
            const parallaxX = mouseX * (isMobile ? 1.3 : 2.5);
            const parallaxY = mouseY * (isMobile ? 0.8 : 1.6);

            hypercubeGroup.rotation.y += rotSpeed;
            hypercubeGroup.rotation.x += (mouseY * 0.18 - hypercubeGroup.rotation.x) * 0.07;
            hypercubeGroup.rotation.y += (mouseX * 0.28 - hypercubeGroup.rotation.y) * 0.03;
            hypercubeGroup.position.x += (parallaxX - hypercubeGroup.position.x) * 0.08;
            hypercubeGroup.position.y += (parallaxY - hypercubeGroup.position.y) * 0.08;

            planes.forEach((p) => {
                const wave = Math.sin(time * 3 + p.index * 0.3);
                p.mesh.scale.setScalar(1 + wave * 0.045 * expansion);
                p.mesh.position.z = p.baseZ * (0.72 + 0.28 * expansion) + wave * 0.26;
                p.mesh.rotation.z = Math.sin(time + mouseX * 2.4) * 0.14 * (p.index / numPlanes) * expansion;
            });

            outerGroup.rotation.x = hypercubeGroup.rotation.x * 0.4;
            outerGroup.rotation.y = hypercubeGroup.rotation.y * 0.4;
            outerGroup.position.x += ((-parallaxX * 0.45) - outerGroup.position.x) * 0.06;
            outerGroup.position.y += ((-parallaxY * 0.45) - outerGroup.position.y) * 0.06;
            outerPlanes.forEach((plane) => {
                plane.position.z += 0.05;
                if (plane.position.z > (outerNum / 2) * 5) {
                    plane.position.z -= outerNum * 5;
                }
            });

            const positions = coreParticles.geometry.attributes.position.array;
            const halfSize = planeSize / 2;
            const halfDepth = (numPlanes * spacing) / 2;
            for (let i = 0; i < pCount; i++) {
                positions[i * 3] += pVel[i].x;
                positions[i * 3 + 1] += pVel[i].y;
                positions[i * 3 + 2] += pVel[i].z;
                if (Math.abs(positions[i * 3]) > halfSize) pVel[i].x *= -1;
                if (Math.abs(positions[i * 3 + 1]) > halfSize) pVel[i].y *= -1;
                if (Math.abs(positions[i * 3 + 2]) > halfDepth) pVel[i].z *= -1;
            }
            coreParticles.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
})();
