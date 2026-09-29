import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const YEARS = [2023, 2024, 2025, 2026];
const CELL = 1;
const GAP = 0.12;
const MAX_H = 12;
const MIN_H = 0.35;
const BASE_PAD = 1.6;

const LEVELS = [
  { min: 0.01, color: 0x0e4429 },
  { min: 0.25, color: 0x006d32 },
  { min: 0.5, color: 0x26a641 },
  { min: 0.75, color: 0x39d353 },
];

const canvas = document.getElementById("canvas");
const yearsEl = document.getElementById("years");
const yearLabel = document.getElementById("year-label");
const totalLabel = document.getElementById("total-label");
const tooltip = document.getElementById("tooltip");

const cache = new Map();
let currentYear = 2026;
let buildings = [];
let buildingGroup = null;
let baseMesh = null;
let animProgress = 1;
let animStart = 0;
const ANIM_MS = 1100;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070b12, 0.018);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x070b12, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(48, 28, 42);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 18;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI * 0.48;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
controls.target.set(26, 2, 3.5);

const hemi = new THREE.HemisphereLight(0xb8d4ff, 0x1a2a1f, 0.55);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 1.15);
key.position.set(30, 50, 20);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 150;
key.shadow.camera.left = -60;
key.shadow.camera.right = 60;
key.shadow.camera.top = 40;
key.shadow.camera.bottom = -40;
scene.add(key);

const fill = new THREE.DirectionalLight(0x3fb950, 0.35);
fill.position.set(-25, 18, -15);
scene.add(fill);

addStarfield();
addGround();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function addStarfield() {
  const count = 900;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xd8ffe0,
    size: 0.35,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.75,
  });
  scene.add(new THREE.Points(geo, mat));
}

function addGround() {
  const geo = new THREE.PlaneGeometry(400, 400);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a1218,
    roughness: 1,
    metalness: 0,
  });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);
}

function levelColor(t) {
  let color = LEVELS[0].color;
  for (const level of LEVELS) {
    if (t >= level.min) color = level.color;
  }
  return color;
}

function normalizeHeight(count, maxCount) {
  if (count <= 0) return 0;
  if (maxCount <= 0) return MIN_H;
  const t = Math.sqrt(count) / Math.sqrt(maxCount);
  return MIN_H + t * (MAX_H - MIN_H);
}

async function loadYear(year) {
  if (cache.has(year)) return cache.get(year);
  const res = await fetch(`./data/${year}.json`);
  if (!res.ok) throw new Error(`Failed to load ${year}`);
  const data = await res.json();
  cache.set(year, data);
  return data;
}

function clearSkyline() {
  if (buildingGroup) {
    scene.remove(buildingGroup);
    buildingGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
  buildings = [];
  buildingGroup = null;
  baseMesh = null;
  hovered = null;
  tooltip.hidden = true;
}

function buildSkyline(data) {
  clearSkyline();

  const weeks = data.weeks;
  const counts = weeks.flatMap((w) => w.days.map((d) => d.count));
  const maxCount = Math.max(1, ...counts);

  buildingGroup = new THREE.Group();
  const width = weeks.length * CELL;
  const depth = 7 * CELL;
  const baseW = width + BASE_PAD * 2;
  const baseD = depth + BASE_PAD * 2;
  const baseH = 0.9;

  const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x161b22,
    roughness: 0.85,
    metalness: 0.15,
  });
  baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(width / 2, baseH / 2, depth / 2);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  buildingGroup.add(baseMesh);

  const rimGeo = new THREE.BoxGeometry(baseW + 0.15, 0.12, baseD + 0.15);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x238636,
    roughness: 0.4,
    metalness: 0.3,
    emissive: 0x0e4429,
    emissiveIntensity: 0.4,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.set(width / 2, baseH + 0.02, depth / 2);
  buildingGroup.add(rim);

  const sharedGeo = new THREE.BoxGeometry(CELL - GAP, 1, CELL - GAP);
  sharedGeo.translate(0, 0.5, 0);

  for (let wi = 0; wi < weeks.length; wi++) {
    const days = weeks[wi].days;
    for (let di = 0; di < days.length; di++) {
      const day = days[di];
      if (day.count <= 0) continue;

      const h = normalizeHeight(day.count, maxCount);
      const t = Math.sqrt(day.count) / Math.sqrt(maxCount);
      const mat = new THREE.MeshStandardMaterial({
        color: levelColor(t),
        roughness: 0.45,
        metalness: 0.08,
        emissive: levelColor(t),
        emissiveIntensity: 0.12 + t * 0.25,
      });

      const mesh = new THREE.Mesh(sharedGeo, mat);
      mesh.position.set(wi * CELL + CELL / 2, baseH, di * CELL + CELL / 2);
      mesh.scale.y = 0.001;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        targetH: h,
        date: day.date,
        count: day.count,
      };
      buildingGroup.add(mesh);
      buildings.push(mesh);
    }
  }

  scene.add(buildingGroup);

  const cx = width / 2;
  const cz = depth / 2;
  controls.target.set(cx, 3, cz);
  camera.position.set(cx + 28, 22, cz + 32);
  controls.update();

  yearLabel.textContent = String(data.year);
  totalLabel.textContent = `${data.total.toLocaleString()} contributions`;

  animStart = performance.now();
  animProgress = 0;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function updateAnimation(now) {
  if (animProgress >= 1) return;
  animProgress = Math.min(1, (now - animStart) / ANIM_MS);
  const e = easeOutCubic(animProgress);
  for (const mesh of buildings) {
    mesh.scale.y = Math.max(0.001, mesh.userData.targetH * e);
  }
}

function buildYearNav() {
  yearsEl.innerHTML = "";
  for (const y of YEARS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(y);
    if (y === currentYear) btn.setAttribute("aria-current", "true");
    btn.addEventListener("click", () => selectYear(y));
    yearsEl.appendChild(btn);
  }
}

async function selectYear(year) {
  if (year === currentYear && buildingGroup) return;
  currentYear = year;
  for (const btn of yearsEl.querySelectorAll("button")) {
    if (btn.textContent === String(year)) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  }
  const data = await loadYear(year);
  buildSkyline(data);
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(buildings, false);

  if (hovered && hovered !== hits[0]?.object) {
    hovered.material.emissiveIntensity = hovered.userData.baseEmissive ?? 0.2;
    hovered = null;
  }

  if (hits.length) {
    const mesh = hits[0].object;
    if (hovered !== mesh) {
      if (hovered) {
        hovered.material.emissiveIntensity =
          hovered.userData.baseEmissive ?? 0.2;
      }
      hovered = mesh;
      mesh.userData.baseEmissive = mesh.material.emissiveIntensity;
      mesh.material.emissiveIntensity = 0.85;
    }
    const { date, count } = mesh.userData;
    const pretty = new Date(date + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    tooltip.hidden = false;
    tooltip.innerHTML = `${pretty}<br><strong>${count}</strong> contribution${count === 1 ? "" : "s"}`;
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
    controls.autoRotate = false;
  } else {
    tooltip.hidden = true;
    controls.autoRotate = true;
  }
}

function onPointerLeave() {
  if (hovered) {
    hovered.material.emissiveIntensity = hovered.userData.baseEmissive ?? 0.2;
    hovered = null;
  }
  tooltip.hidden = true;
  controls.autoRotate = true;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function tick(now) {
  requestAnimationFrame(tick);
  updateAnimation(now);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", onResize);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerleave", onPointerLeave);
canvas.addEventListener("pointerdown", () => {
  controls.autoRotate = false;
});

buildYearNav();
selectYear(currentYear).catch((err) => {
  console.error(err);
  totalLabel.textContent = "failed to load data";
});
requestAnimationFrame(tick);
