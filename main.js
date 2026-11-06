// 보장원 — 광화문 거리의 유리 빌딩 오피스 (three.js 멀티플레이 3D 웹페이지)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* =========================================================================
   기본 유틸
   ========================================================================= */
const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isTouch = matchMedia('(pointer: coarse)').matches;
const LOW = isTouch || Math.min(innerWidth, innerHeight) < 600;
if (LOW) document.body.classList.add('low'); // 휴대폰: 화면 가장자리를 살짝 어둡게 (깊이감)
const FONT = `'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif`;

try {
  await Promise.race([document.fonts?.load(`800 40px "Noto Sans KR"`), wait(1800)]);
} catch (e) { /* 폰트가 없으면 시스템 폰트 사용 */ }

/* =========================================================================
   렌더러 / 씬 / 카메라
   ========================================================================= */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#error').classList.remove('hidden');
  $('#intro').classList.add('hidden');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.25 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !LOW; // 휴대폰: 실시간 그림자 끔 (바닥 접지 그림자는 그대로)
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('#app').appendChild(renderer.domElement);
let composer = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0a982);
scene.fog = new THREE.Fog(0xf0a982, 150, 520);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = isTouch ? 0.55 : 0.7;

const pmrem = new THREE.PMREMGenerator(renderer);
/* =========================================================================
   에셋 로딩 (Poly Haven CC0 스캔 모델 · PBR 텍스처 · HDRI)
   ========================================================================= */
const ASSET = 'assets/';
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, loaded, total) => {
  const b = $('#enter');
  if (b.disabled) b.textContent = `불러오는 중… ${Math.round((loaded / total) * 100)}%`;
};
const gltfLoader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader(manager);
const exrLoader = new EXRLoader(manager);
const PBR_SETS = {
  asphalt_02: 'dna', herringbone_parquet: 'dna', red_brick_03: 'dn', velour_velvet: 'dn', rough_linen: 'dn',
  oak_veneer_01: 'dn', walnut_veneer: 'dn', large_floor_tiles_02: 'dna', large_sandstone_blocks: 'dn',
  grey_roof_tiles: 'dn', rough_wood: 'dn', pavement_02: 'dna', concrete_floor_02: 'dn',
};
const MODEL_LIST = [
  'potted_plant_01_1k', 'potted_plant_02_1k', 'potted_plant_04_2k', 'desk_lamp_arm_01_1k', 'throw_pillows_01_1k',
  'modern_ceiling_lamp_01_2k', 'rubber_duck_toy_1k', 'food_apple_01_1k', 'concrete_cat_statue_1k', 'alarm_clock_01_2k',
  'ceramic_vase_01_1k', 'Ottoman_01_2k',
];
const pbrTex = {};
const models = {};
const KEYS = { d: 'diff', n: 'nor', a: 'arm' };
await Promise.all([
  ...Object.entries(PBR_SETS).flatMap(([name, ks]) => [...ks].map(async (k) => {
    try {
      const t = await texLoader.loadAsync(`${ASSET}tex/${name}_${KEYS[k]}.webp`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = LOW ? 2 : 8;
      if (LOW && t.image && t.image.width > 256) { const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(t.image, 0, 0, 256, 256); t.image = c; t.needsUpdate = true; }
      if (k === 'd') t.colorSpace = THREE.SRGBColorSpace;
      (pbrTex[name] ||= {})[KEYS[k]] = t;
    } catch (e) { console.warn('texture', name, e); }
  })),
  ...MODEL_LIST.map(async (name) => {
    try { models[name] = (await gltfLoader.loadAsync(`${ASSET}models/${name}.glb`)).scene; }
    catch (e) { console.warn('model', name, e); }
  }),
]);
async function loadEnv(name) {
  try {
    const t = await exrLoader.loadAsync(`${ASSET}hdri/${name}.exr`);
    t.mapping = THREE.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(t).texture;
    t.dispose();
    return env;
  } catch (e) { console.warn('hdri', name, e); return null; }
}
const [envOut, envIn] = await Promise.all([loadEnv('sunset'), loadEnv('apartment')]);
const envMap = envOut;
scene.environment = envOut;
scene.environmentIntensity = 0.6;

// 실사 PBR 재질 (CC0 스캔 텍스처)
function pbr(name, rx = 1, ry = 1, o = {}) {
  const T = pbrTex[name];
  const m = new THREE.MeshStandardMaterial({ color: o.color ?? 0xffffff, roughness: o.rough ?? 1, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide });
  if (!T) { if (o.fallback) m.color.set(o.fallback); return m; }
  if (T.diff && !o.noMap) m.map = tiled(T.diff, rx, ry);
  if (T.nor && m.map) { m.normalMap = tiled(T.nor, rx, ry); const ns = o.normalScale ?? 1; m.normalScale.set(ns, ns); }
  if (T.arm) { const a = tiled(T.arm, rx, ry); m.roughnessMap = a; m.aoMap = a; m.aoMapIntensity = 0.7; }
  if (o.env !== undefined) m.envMapIntensity = o.env;
  return m;
}
// 스캔 모델 배치
function model(name, height) {
  const src = models[name];
  if (!src) return null;
  const m = src.clone(true);
  const box = new THREE.Box3().setFromObject(m);
  const size = box.getSize(new THREE.Vector3());
  const k = height ? height / size.y : 1;
  m.scale.setScalar(k);
  m.position.set((-(box.min.x + box.max.x) / 2) * k, -box.min.y * k, (-(box.min.z + box.max.z) / 2) * k);
  const g = new THREE.Group();
  g.add(m);
  return g;
}
function addModel(parent, name, height, x, y, z, ry = 0, cast = false) {
  const g = model(name, height);
  if (!g) return null;
  g.position.set(x, y, z);
  g.rotation.y = ry;
  if (cast) g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  parent.add(g);
  return g;
}
// 바닥 접지 그림자 (부드러운 블롭)
const BLOB_TEX = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.28)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const BLOB_MAT = new THREE.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
const BLOB_GEO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
function blob(parent, x, y, z, w, d, ry = 0) {
  const m = new THREE.Mesh(BLOB_GEO, BLOB_MAT);
  m.position.set(x, y + 0.012, z);
  m.scale.set(w, 1, d);
  m.rotation.y = ry;
  m.renderOrder = 1;
  parent.add(m);
  return m;
}
// 옷감 재질 (스캔 린넨 노멀)
const fabricNor = pbrTex.rough_linen?.nor ? tiled(pbrTex.rough_linen.nor, 3, 3) : null;
const fabricCache = new Map();
function fabric(color, rough = 0.92) {
  const key = color + '|' + rough;
  if (!fabricCache.has(key)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough });
    fabricCache.set(key, m);
  }
  return fabricCache.get(key);
}

/* =========================================================================
   지오메트리 / 머티리얼 헬퍼
   ========================================================================= */
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20);
const SPH = new THREE.SphereGeometry(1, 20, 14);

/* ---------- 충돌체 & 좌석 (x,z 평면) ---------- */
const colliders = [];
function colBox(x, z, w, d, rot = 0) { colliders.push({ t: 'b', x, z, hw: w / 2, hd: d / 2, c: Math.cos(rot), s: Math.sin(rot) }); }
function colCircle(x, z, r) { colliders.push({ t: 'c', x, z, r }); }
const seats = [];
function addSeat(kind, x, z, ry, o = {}) {
  const seat = { id: kind + seats.length, kind, x, z, ry, h: o.h ?? 0.45, ex: o.ex ?? x + Math.sin(ry) * 0.75, ez: o.ez ?? z + Math.cos(ry) * 0.75, ax: o.ax ?? x, az: o.az ?? z };
  seats.push(seat);
  return seat;
}
const matCache = new Map();
function std(color, o = {}) {
  const key = color + '|' + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o }));
  return matCache.get(key);
}
function glow(color) {
  const key = 'glow' + color;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  return matCache.get(key);
}
function addMesh(parent, geo, m, x, y, z, sx = 1, sy = 1, sz = 1, o = {}) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  if (o.ry) mesh.rotation.y = o.ry;
  if (o.rx) mesh.rotation.x = o.rx;
  if (o.rz) mesh.rotation.z = o.rz;
  if (o.cast) mesh.castShadow = true;
  if (o.receive) mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const addBox = (p, w, h, d, m, x, y, z, o) => addMesh(p, BOX, m, x, y, z, w, h, d, o);
const addCyl = (p, r, h, m, x, y, z, o) => addMesh(p, CYL, m, x, y, z, r, h, r, o);
const addSph = (p, r, m, x, y, z, o) => addMesh(p, SPH, m, x, y, z, r, r, r, o);
function addPlane(p, w, d, m, x, y, z, o = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = o.receive !== false;
  p.add(mesh);
  return mesh;
}
function addWallPlane(p, w, h, m, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  p.add(mesh);
  return mesh;
}

/* ---------- 캔버스 텍스처 ---------- */
// 휴대폰: 큰 그림(512px 초과)은 절반 크기로 줄여 GPU 메모리·대역폭을 아껴요
function shrinkForPhone(img) {
  if (!LOW || !img || !img.width || Math.max(img.width, img.height) <= 512) return img;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.width / 2)); c.height = Math.max(1, Math.round(img.height / 2));
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(shrinkForPhone(c));
  t.userData.src = c;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = LOW ? 2 : 4;
  return t;
}
function tiled(tex, rx, ry) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}
function speckle(g, w, h, n, colors, a = 0.15, size = 2) {
  g.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    g.fillStyle = pick(colors);
    g.fillRect(Math.random() * w, Math.random() * h, size, size);
  }
  g.globalAlpha = 1;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const TEX = {
  wood: canvasTex(512, 512, (g, w, h) => {
    const tones = ['#c89058', '#bd8450', '#d29c63', '#b57a47', '#c48a55'];
    const rowH = 64;
    for (let r = 0; r < h / rowH; r++) {
      let x = -Math.random() * 200;
      while (x < w) {
        const len = rand(160, 300);
        g.fillStyle = pick(tones);
        g.fillRect(x, r * rowH, len, rowH);
        g.strokeStyle = 'rgba(90,50,20,0.18)';
        for (let k = 0; k < 6; k++) {
          g.beginPath();
          const yy = r * rowH + rand(6, rowH - 6);
          g.moveTo(x, yy);
          g.bezierCurveTo(x + len * 0.3, yy + rand(-4, 4), x + len * 0.6, yy + rand(-4, 4), x + len, yy);
          g.stroke();
        }
        g.fillStyle = 'rgba(70,40,20,0.35)';
        g.fillRect(x, r * rowH, 2, rowH);
        x += len;
      }
      g.fillStyle = 'rgba(70,40,20,0.35)';
      g.fillRect(0, r * rowH, w, 2);
    }
  }),
  carpet: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#58606f'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 6000, ['#6b7484', '#474e5b', '#7a6f66'], 0.35, 2);
    g.strokeStyle = 'rgba(30,30,40,0.25)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  }),
  napCarpet: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7d6f73'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 6000, ['#8e7f82', '#6c5f63', '#9a8a80'], 0.35, 2);
  }),
  lobbyTile: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e8dccb'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1500, ['#d8cab6', '#f3e9dc', '#cdbca6'], 0.4, 3);
    g.fillStyle = 'rgba(150,130,110,0.45)';
    g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
  }),
  paving: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9d958b'; g.fillRect(0, 0, w, h);
    const bw = 64, bh = 32;
    for (let r = 0; r < h / bh; r++) {
      for (let c = -1; c < w / bw + 1; c++) {
        const x = c * bw + (r % 2 ? bw / 2 : 0);
        g.fillStyle = pick(['#b9b0a4', '#aea598', '#c2b9ad', '#a89f93']);
        g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
    speckle(g, w, h, 1500, ['#8a8277', '#cfc6bb'], 0.3, 2);
  }),
  brick: canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#d9c6b0'; g.fillRect(0, 0, w, h);
    const bw = 64, bh = 24;
    for (let r = 0; r < h / bh; r++) {
      for (let c = -1; c < w / bw + 1; c++) {
        const x = c * bw + (r % 2 ? bw / 2 : 0);
        g.fillStyle = pick(['#b5644a', '#a85a41', '#c0705a', '#9d5139', '#b8694d']);
        g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
    speckle(g, w, h, 2500, ['#7a3d2a', '#e0a58c'], 0.25, 2);
  }),
  rug: canvasTex(512, 512, (g, w, h) => {
    const cx = w / 2;
    const rings = ['#f3e2c7', '#e08a52', '#f3e2c7', '#e9b949', '#f3e2c7', '#c8603d', '#f6ead6'];
    rings.forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath(); g.arc(cx, cx, cx * (1 - i * 0.13), 0, Math.PI * 2); g.fill();
    });
    speckle(g, w, h, 4000, ['#ffffff', '#b57a50'], 0.12, 2);
  }),
  pizza: canvasTex(128, 128, (g, w) => {
    g.fillStyle = '#d99a4e'; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill();
    g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill();
    g.fillStyle = '#c0392b';
    for (let i = 0; i < 12; i++) { const a = rand(0, 7), r = rand(10, 44); g.beginPath(); g.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 6, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(120,60,20,.5)'; g.lineWidth = 2;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(i * Math.PI / 4) * 64, 64 + Math.sin(i * Math.PI / 4) * 64); g.moveTo(64, 64); g.lineTo(64 - Math.cos(i * Math.PI / 4) * 64, 64 - Math.sin(i * Math.PI / 4) * 64); g.stroke(); }
  }),
  leaf: canvasTex(64, 64, (g) => {
    g.fillStyle = '#f2c230';
    g.beginPath(); g.moveTo(32, 58); g.lineTo(6, 16); g.quadraticCurveTo(32, 0, 58, 16); g.closePath(); g.fill();
    g.fillStyle = '#e0a520'; g.fillRect(31, 34, 2, 26);
  }),
  stoneBlocks: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c8bba5'; g.fillRect(0, 0, w, h);
    const bh = 32;
    for (let r = 0; r < h / bh; r++) {
      let x = -rand(0, 40);
      while (x < w) {
        const bw = rand(40, 80);
        g.fillStyle = pick(['#d2c6b1', '#c4b69f', '#baac95', '#d9cdb8']);
        g.fillRect(x + 1.5, r * bh + 1.5, bw - 3, bh - 3);
        x += bw;
      }
    }
    speckle(g, w, h, 2500, ['#a99b85', '#e6dccb'], 0.3, 2);
  }),
};

/* ---------- 창문 파사드 텍스처 ---------- */
function facade(cols, floors, o = {}) {
  const cw = 16, ch = 32;
  const base = o.base || ['#2c4258', '#334c63', '#263a4e'];
  const lit = o.lit || ['#e9b878', '#e3a862', '#efc894', '#d9984f'];
  const frame = o.frame || '#7d8a93';
  const chance = o.chance ?? 0.45;
  const cells = [];
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) cells.push(Math.random() < chance ? pick(lit) : null);
  const draw = (emissive) => (g, w, h) => {
    g.fillStyle = emissive ? '#000' : frame; g.fillRect(0, 0, w, h);
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const col = cells[f * cols + c];
        const x = c * cw, y = f * ch;
        if (emissive) {
          if (col) { g.fillStyle = col; g.fillRect(x + 1, y + 3, cw - 2, ch - 7); }
        } else {
          if (col) { g.fillStyle = col; }
          else {
            const grd = g.createLinearGradient(x, y, x + cw, y + ch);
            grd.addColorStop(0, pick(base)); grd.addColorStop(1, '#1b2836');
            g.fillStyle = grd;
          }
          g.fillRect(x + 1, y + 3, cw - 2, ch - 7);
        }
      }
      if (!emissive) { g.fillStyle = 'rgba(20,25,35,0.6)'; g.fillRect(0, f * ch + ch - 4, w, 4); }
    }
  };
  return {
    map: canvasTex(cols * cw, floors * ch, draw(false)),
    emi: canvasTex(cols * cw, floors * ch, draw(true)),
  };
}
const NIGHT_MATS = []; // 밤이 되면 더 환해지는 창문들 { m, base }
function facadeMat(cols, floors, o = {}) {
  const f = facade(cols, floors, o);
  const m = new THREE.MeshStandardMaterial({
    map: f.map, emissiveMap: f.emi, emissive: 0xffd9a8, emissiveIntensity: o.emi ?? 0.42,
    roughness: o.rough ?? 0.12, metalness: o.metal ?? 0.6, envMap, envMapIntensity: 1.1,
  });
  NIGHT_MATS.push({ m, base: m.emissiveIntensity });
  return m;
}

/* =========================================================================
   하늘 / 빛
   ========================================================================= */
const SUN_DIR = new THREE.Vector3(90, 40, 70).normalize();
let skyMat;
{
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 32, 16),
    skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
      uniforms: {
        cTop: { value: new THREE.Color(0x2c3a6e) },
        cMid: { value: new THREE.Color(0xc98a9c) },
        cLow: { value: new THREE.Color(0xf6b07e) },
        sunDir: { value: new THREE.Vector3(0.73, 0.1, 0.57).normalize() },
        glow: { value: 1 },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 cTop,cMid,cLow,sunDir; uniform float glow; varying vec3 vDir;
        void main(){
          float h = vDir.y;
          vec3 c = mix(cLow, cMid, smoothstep(-0.02, 0.2, h));
          c = mix(c, cTop, smoothstep(0.2, 0.75, h));
          float s = max(dot(normalize(vDir), sunDir), 0.0);
          c += (vec3(1.0,0.62,0.32)*pow(s,60.0)*1.2 + vec3(1.0,0.66,0.4)*pow(s,6.0)*0.25) * glow;
          gl_FragColor = vec4(c,1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  scene.add(sky);
}

const LAMP_MAT = new THREE.MeshBasicMaterial({ color: 0xffd08a, toneMapped: false });
const MOON_LAMP = new THREE.MeshBasicMaterial({
  color: 0xffe2b8,
  map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff4e0'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(190,160,120,${0.08 + Math.random() * 0.14})`; x.beginPath(); x.arc(Math.random() * 128, Math.random() * 128, 3 + Math.random() * 10, 0, 7); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(),
});
// 휴대폰은 그림자가 없어 화면이 고르게 밝아 보이므로, 빛과 노출을 살짝 낮춰 깊이감을 살려요
const LOWK = LOW ? { sun: 0.82, hemi: 0.78, env: 0.8, exp: 0.9 } : { sun: 1, hemi: 1, env: 1, exp: 1 };
const envLevel = (inside) => (inside ? 0.5 * (0.6 + 0.4 * TOD.envK) : TOD.env) * LOWK.env;
const hemi = new THREE.HemisphereLight(0xffdcc0, 0x5b4636, 0.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffb27a, 2.6);
sun.position.copy(SUN_DIR).multiplyScalar(160);
sun.castShadow = !LOW;
sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 400 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun);

/* =========================================================================
   실제 시간 반영: 서울 시각에 맞춰 낮 · 노을 · 밤
   ========================================================================= */
const C = (h) => new THREE.Color(h);
const TOD_KEYS = (() => {
  const night = { top: C(0x060a1c), mid: C(0x121a36), low: C(0x262848), fog: C(0x171a2e), sun: C(0x9fb4ff), sunI: 0.22, elev: 38, hemiS: C(0x5a68a8), hemiG: C(0x15121a), hemiI: 0.2, env: 0.1, exp: 1.0, win: 1.7, lamp: 1, stars: 1, glow: 0, moon: 1 };
  const dawn = { top: C(0x45599a), mid: C(0xe6a3a6), low: C(0xffc38e), fog: C(0xe9b7a0), sun: C(0xffb07a), sunI: 1.6, elev: 8, hemiS: C(0xffd2c0), hemiG: C(0x5b4a44), hemiI: 0.42, env: 0.42, exp: 1.04, win: 0.6, lamp: 0.5, stars: 0.15, glow: 1, moon: 0.2 };
  const day = { top: C(0x3d7fd6), mid: C(0x9ccaf0), low: C(0xdcecf6), fog: C(0xcfe2ef), sun: C(0xfff3e2), sunI: 3.1, elev: 50, hemiS: C(0xcfe6ff), hemiG: C(0x8a7a68), hemiI: 0.75, env: 1.0, exp: 0.95, win: 0.18, lamp: 0, stars: 0, glow: 0.45, moon: 0 };
  const dusk = { top: C(0x2c3a6e), mid: C(0xc98a9c), low: C(0xf6b07e), fog: C(0xf0a982), sun: C(0xffb27a), sunI: 2.6, elev: 19, hemiS: C(0xffdcc0), hemiG: C(0x5b4636), hemiI: 0.45, env: 0.6, exp: 1.05, win: 1.0, lamp: 0.55, stars: 0, glow: 1, moon: 0 };
  const twi = { top: C(0x161c48), mid: C(0x4e4272), low: C(0xa8707a), fog: C(0x5a4a66), sun: C(0xff8a6a), sunI: 0.55, elev: 3, hemiS: C(0x9a8ac0), hemiG: C(0x2a2230), hemiI: 0.36, env: 0.3, exp: 1.1, win: 1.45, lamp: 1, stars: 0.45, glow: 0.6, moon: 0.5 };
  return [[0, night], [5, night], [6.5, dawn], [9, day], [16, day], [18, dusk], [19.5, twi], [21, night], [24, night]];
})();
const TOD = { hour: 18, env: 0.6, envK: 1, lamp: 0.55, override: null, label: '' };
const nightLights = [];
let starsSky, moon;
{
  // 밤하늘 별
  const n = 900, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.acos(rand(0.05, 1)), r = 1000;
    pos[i * 3] = Math.sin(v) * Math.cos(u) * r; pos[i * 3 + 1] = Math.cos(v) * r; pos[i * 3 + 2] = Math.sin(v) * Math.sin(u) * r;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starsSky = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false }));
  starsSky.renderOrder = -1;
  scene.add(starsSky);
  // 달
  const mt = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.32, 'rgba(255,246,220,1)'); gr.addColorStop(0.36, 'rgba(220,225,255,.35)'); gr.addColorStop(1, 'rgba(200,210,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false }));
  moon.scale.set(90, 90, 1);
  moon.position.set(-420, 520, 520);
  scene.add(moon);
}
function seoulHour() {
  if (TOD.override !== null) return TOD.override;
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return Number(p.hour) + Number(p.minute) / 60;
  } catch (e) {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }
}
const _c = new THREE.Color();
function applyTimeOfDay() {
  const h = seoulHour();
  TOD.hour = h;
  let i = 0;
  while (i < TOD_KEYS.length - 2 && h >= TOD_KEYS[i + 1][0]) i++;
  const [h0, a] = TOD_KEYS[i], [h1, b] = TOD_KEYS[i + 1];
  const k = clamp((h - h0) / (h1 - h0), 0, 1);
  const L = (x, y) => x + (y - x) * k;
  const LC = (x, y, out) => out.copy(x).lerp(y, k);
  LC(a.top, b.top, skyMat.uniforms.cTop.value);
  LC(a.mid, b.mid, skyMat.uniforms.cMid.value);
  LC(a.low, b.low, skyMat.uniforms.cLow.value);
  skyMat.uniforms.glow.value = L(a.glow, b.glow);
  LC(a.fog, b.fog, scene.fog.color);
  scene.background.copy(scene.fog.color);
  // 해(낮) / 달빛(밤) 방향
  const elev = THREE.MathUtils.degToRad(L(a.elev, b.elev));
  const az = h > 12 || h < 4 ? 0.66 : -0.35; // 오후엔 서쪽(+x), 아침엔 동쪽
  const dir = new THREE.Vector3(Math.cos(elev) * Math.cos(az), Math.sin(elev), Math.cos(elev) * Math.sin(az) + 0.55).normalize();
  sun.position.copy(dir).multiplyScalar(160);
  skyMat.uniforms.sunDir.value.set(dir.x, Math.max(0.02, dir.y * 0.4), dir.z).normalize();
  LC(a.sun, b.sun, sun.color);
  sun.intensity = L(a.sunI, b.sunI) * LOWK.sun;
  LC(a.hemiS, b.hemiS, hemi.color);
  LC(a.hemiG, b.hemiG, hemi.groundColor);
  hemi.intensity = L(a.hemiI, b.hemiI) * LOWK.hemi;
  TOD.env = L(a.env, b.env);
  TOD.envK = clamp(TOD.env / 0.6, 0.3, 1.4);
  scene.environmentIntensity = envLevel(!!mode?.inside);
  renderer.toneMappingExposure = L(a.exp, b.exp) * LOWK.exp;
  const win = L(a.win, b.win);
  for (const { m, base } of NIGHT_MATS) m.emissiveIntensity = base * win;
  TOD.lamp = L(a.lamp, b.lamp);
  LAMP_MAT.color.copy(_c.set(0x4a4540)).lerp(new THREE.Color(0xffd08a), clamp(0.15 + TOD.lamp, 0, 1));
  for (const l of nightLights) l.intensity = l.userData.max * TOD.lamp;
  starsSky.material.opacity = L(a.stars, b.stars) * 0.9;
  moon.material.opacity = L(a.moon, b.moon);
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  const icon = h >= 21 || h < 5 ? '🌙' : h < 7 ? '🌅' : h < 17 ? '☀️' : h < 19.5 ? '🌇' : '🌆';
  TOD.label = `${icon} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const el = document.getElementById('clock');
  if (el) el.textContent = TOD.label;
}

/* =========================================================================
   거리 (광화문 / 세종대로)
   ========================================================================= */
const street = new THREE.Group();
scene.add(street);
const cars = [];
const leaves = {};

function buildStreet() {
  const g = street;
  addPlane(g, 1600, 1600, pbr('concrete_floor_02', 200, 200, { color: 0x8c8178, fallback: 0x6e6157 }), 0, 0, 0);

  // 차도 (z 5~25), 중앙 광장 (z 11.5~18.5)
  const asphalt = pbr('asphalt_02', 420 / 5, 20 / 5, { color: 0x9a9aa0, fallback: 0x3b3a40 });
  addPlane(g, 420, 20, asphalt, 70, 0.02, 15);
  const pave = pbr('pavement_02', 420 / 2.5, 5 / 2.5, { fallback: 0xb9b0a4 });
  const paveFar = pbr('pavement_02', 420 / 2.5, 7 / 2.5, { fallback: 0xb9b0a4 });
  const paveMid = pbr('large_floor_tiles_02', 330 / 2.4, 7 / 2.4, { color: 0xf2e6d6, fallback: 0xd9cbb8 });
  const curb = std(0xb7afa4);
  // 넓은 보도 면이 아래 연석과 겹쳐 깜빡이지 않도록 살짝 앞으로 당겨 그려요
  for (const m of [pave, paveFar, paveMid]) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -4; }
  // 인도 (건물 쪽)
  addBox(g, 420, 0.144, 5, curb, 70, 0.072, 2.5, { receive: true });
  addPlane(g, 420, 5, pave, 70, 0.152, 2.5);
  // 중앙 광장
  addBox(g, 330, 0.144, 7, curb, 45, 0.072, 15, { receive: true });
  addPlane(g, 330, 7, paveMid, 45, 0.152, 15);
  // 건너편 인도
  addBox(g, 420, 0.144, 7, curb, 70, 0.072, 28.5, { receive: true });
  addPlane(g, 420, 7, paveFar, 70, 0.152, 28.5);
  // 건너편 너머 바닥
  addPlane(g, 420, 60, pbr('pavement_02', 420 / 3, 60 / 3, { color: 0xd8d0c6, fallback: 0x8a7f74 }), 70, 0.01, 62);

  // 차선
  const white = glow(0xe8e4dc);
  const dashGeo = new THREE.PlaneGeometry(3, 0.15);
  dashGeo.rotateX(-Math.PI / 2);
  const dashes = [];
  for (let x = -130; x < 280; x += 7) for (const z of [8.25, 21.75]) if (Math.abs(x) > 5) dashes.push([x, z]); // 횡단보도 위에서는 차선이 끊겨요
  const dashIM = new THREE.InstancedMesh(dashGeo, std(0xe9e5dd), dashes.length);
  const m4 = new THREE.Matrix4();
  dashes.forEach(([x, z], i) => dashIM.setMatrixAt(i, m4.makeTranslation(x, 0.03, z)));
  dashIM.receiveShadow = true;
  g.add(dashIM);
  // 횡단보도 (건물 입구 앞) — 실제처럼 흰 막대가 차가 다니는 방향으로 길게 놓이고, 건너는 방향으로 줄지어 있어요
  const stripes = [];
  for (const z0 of [5.75, 19.25]) for (let k = 0; k < 6; k++) stripes.push([0, z0 + k]);
  const stripeGeo = new THREE.PlaneGeometry(6, 0.5);
  stripeGeo.rotateX(-Math.PI / 2);
  const stIM = new THREE.InstancedMesh(stripeGeo, std(0xf0ece4), stripes.length);
  stripes.forEach(([x, z], i) => stIM.setMatrixAt(i, m4.makeTranslation(x, 0.031, z)));
  stIM.receiveShadow = true;
  g.add(stIM);
  void white;

  // 은행나무 (가을!) — 잎 카드 수천 장으로 만든 사실적인 수관
  const trees = [];
  for (let x = -100; x <= 140; x += 9) if (Math.abs(x) > 6) trees.push([x + rand(-0.5, 0.5), 4.3]);
  for (let x = -96; x <= 140; x += 10) trees.push([x, 27]);
  for (let x = -100; x <= 200; x += 12) { trees.push([x, 12.4]); trees.push([x + 6, 17.6]); }
  const bark = pbr('rough_wood', 1, 4, { color: 0x6a5546, fallback: 0x5a4232 });
  const trunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.22, 1, 10), bark, trees.length);
  const branchIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.08, 1, 6), bark, trees.length * 4);
  const clusterTex = canvasTex(256, 256, (c) => {
    // 은행잎 다발
    for (let i = 0; i < 26; i++) {
      const x = rand(40, 216), y = rand(40, 216), a = rand(0, 6.28), sz = rand(18, 30);
      c.save(); c.translate(x, y); c.rotate(a);
      const tone = pick(['#f2c230', '#f5cd3f', '#e9b021', '#f7d75c', '#e2a51c', '#d9c043']);
      const grd = c.createLinearGradient(0, -sz, 0, sz);
      grd.addColorStop(0, tone); grd.addColorStop(1, '#c8901a');
      c.fillStyle = grd;
      c.beginPath(); c.moveTo(0, sz * 0.9); c.lineTo(-sz * 0.85, -sz * 0.35);
      c.quadraticCurveTo(-sz * 0.2, -sz * 1.05, 0, -sz * 0.7); c.quadraticCurveTo(sz * 0.2, -sz * 1.05, sz * 0.85, -sz * 0.35);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(150,100,20,0.35)'; c.lineWidth = 1;
      for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(0, sz * 0.85); c.lineTo(k * sz * 0.22, -sz * 0.6); c.stroke(); }
      c.strokeStyle = '#8a6a2a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, sz * 0.9); c.lineTo(0, sz * 1.4); c.stroke();
      c.restore();
    }
  });
  const leafCard = new THREE.PlaneGeometry(1, 1);
  const PER = LOW ? 70 : 120;
  const crownIM = new THREE.InstancedMesh(leafCard, new THREE.MeshStandardMaterial({ map: clusterTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.75 }), trees.length * PER);
  const q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  const col = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  let li = 0;
  trees.forEach(([x, z], i) => {
    const h = rand(3.4, 4.2);
    trunkIM.setMatrixAt(i, m4.compose(p.set(x, 0.15 + h / 2, z), q.identity(), s.set(1, h, 1)));
    const cy = 0.15 + h + 1.3, rx = rand(1.6, 2.0), ry = rand(2.0, 2.6);
    for (let k = 0; k < 4; k++) {
      const a = k * 1.57 + rand(-0.4, 0.4);
      const dir = new THREE.Vector3(Math.cos(a) * 0.7, 1, Math.sin(a) * 0.7).normalize();
      q.setFromUnitVectors(up, dir);
      p.set(x, 0.15 + h * 0.8, z).addScaledVector(dir, 1.1);
      branchIM.setMatrixAt(i * 4 + k, m4.compose(p, q, s.set(1, 2.2, 1)));
    }
    for (let k = 0; k < PER; k++) {
      // 타원체 표면 근처에 분포 (속은 비워 둠)
      const u = rand(0, 6.28), v = Math.acos(rand(-0.75, 1)), rr = Math.pow(Math.random(), 0.35);
      p.set(x + Math.sin(v) * Math.cos(u) * rx * rr, cy + Math.cos(v) * ry * rr * 0.9, z + Math.sin(v) * Math.sin(u) * rx * rr);
      e.set(rand(-1.2, 1.2), rand(0, 6.28), rand(-1.2, 1.2));
      const sc = rand(0.75, 1.15);
      crownIM.setMatrixAt(li, m4.compose(p, q.setFromEuler(e), s.set(sc, sc, sc)));
      crownIM.setColorAt(li++, col.setHSL(rand(0.1, 0.13), rand(0.75, 0.95), rand(0.5, 0.68) * (0.75 + 0.25 * (p.y - cy + ry) / (2 * ry))));
    }
  });
  trunkIM.castShadow = branchIM.castShadow = crownIM.castShadow = true;
  trunkIM.receiveShadow = crownIM.receiveShadow = true;
  g.add(trunkIM, branchIM, crownIM);
  trees.forEach(([x, z]) => { blob(g, x, 0.15, z, 2.2, 2.2); colCircle(x, z, 0.35); });

  // 가로등
  const lamps = [];
  for (let x = -96; x <= 140; x += 18) { lamps.push([x + 4.5, 4.6, 0]); lamps.push([x + 4.5, 25.6, Math.PI]); }
  const poleIM = new THREE.InstancedMesh(CYL, std(0x2c2c33, { metalness: 0.6, roughness: 0.4 }), lamps.length);
  const headIM = new THREE.InstancedMesh(SPH, LAMP_MAT, lamps.length);
  lamps.forEach(([x, z], i) => {
    colCircle(x, z, 0.18);
    poleIM.setMatrixAt(i, m4.compose(p.set(x, 3.2, z), q.identity(), s.set(0.08, 6.2, 0.08)));
    headIM.setMatrixAt(i, m4.compose(p.set(x, 6.4, z), q.identity(), s.set(0.32, 0.22, 0.32)));
  });
  poleIM.castShadow = true;
  // 밤에 켜지는 가로등 불빛
  for (const [x, z] of LOW ? [[-12, 3.6], [12, 3.6], [0, 27]] : [[-34, 3.6], [-12, 3.6], [12, 3.6], [34, 3.6], [-20, 15], [20, 15]]) {
    const l = new THREE.PointLight(0xffc47a, 0, 20, 1.5);
    l.position.set(x, 5.8, z);
    l.userData.max = 26;
    g.add(l);
    nightLights.push(l);
  }
  g.add(poleIM, headIM);

  // 떨어진 은행잎
  const nL = LOW ? 500 : 900;
  const lg = new THREE.PlaneGeometry(0.16, 0.16);
  lg.rotateX(-Math.PI / 2);
  const leafIM = new THREE.InstancedMesh(lg, new THREE.MeshStandardMaterial({ map: TEX.leaf, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }), nL);
  for (let i = 0; i < nL; i++) {
    const zone = Math.random();
    const z = zone < 0.45 ? rand(0.2, 5) : zone < 0.75 ? rand(11.6, 18.4) : rand(25.2, 31.8);
    e.set(0, rand(0, 6.28), 0);
    const sc = rand(0.7, 1.4);
    leafIM.setMatrixAt(i, m4.compose(p.set(rand(-90, 120), 0.16 + Math.random() * 0.01, z), q.setFromEuler(e), s.set(sc, 1, sc)));
    leafIM.setColorAt(i, col.set(pick([0xffffff, 0xffe9a8, 0xffd27a, 0xf8c070])));
  }
  leafIM.receiveShadow = true;
  g.add(leafIM);

  // 흩날리는 은행잎
  const nF = LOW ? 160 : 300;
  const pos = new Float32Array(nF * 3);
  const ph = new Float32Array(nF);
  for (let i = 0; i < nF; i++) {
    pos[i * 3] = rand(-70, 70); pos[i * 3 + 1] = rand(0, 14); pos[i * 3 + 2] = rand(-1, 32);
    ph[i] = rand(0, 10);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const falling = new THREE.Points(fg, new THREE.PointsMaterial({ size: 0.32, map: TEX.leaf, alphaTest: 0.5, transparent: true, depthWrite: false }));
  falling.frustumCulled = false;
  g.add(falling);
  Object.assign(leaves, { pos, ph, n: nF, geo: fg });

  // 도로 표지판
  const sign = canvasTex(512, 160, (c, w, h) => {
    c.fillStyle = '#1f4fa0'; roundRect(c, 0, 0, w, h, 18); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 6; roundRect(c, 10, 10, w - 20, h - 20, 12); c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center';
    c.font = `800 62px ${FONT}`; c.fillText('세종대로', w / 2, 80);
    c.font = `600 30px ${FONT}`; c.fillText('Sejong-daero  ← 광화문', w / 2, 128);
  });
  addCyl(g, 0.06, 3.6, std(0x8a8f96, { metalness: 0.6 }), 8, 1.95, 4.75, { cast: true });
  colCircle(8, 4.75, 0.15);
  addWallPlane(g, 2.2, 0.69, new THREE.MeshStandardMaterial({ map: sign, side: THREE.DoubleSide }), 8, 3.6, 4.82);

  // 중앙 광장: 금빛 동상 + 화단
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.32, envMap, envMapIntensity: 1.4 });
  const statue = new THREE.Group();
  statue.position.set(-42, 0.15, 15);
  colBox(-42, 15, 4.2, 5.2);
  statue.rotation.y = Math.PI / 2;
  g.add(statue);
  addBox(statue, 5, 2.8, 4, std(0x8f8578), 0, 1.4, 0, { cast: true, receive: true });
  addBox(statue, 4.2, 0.4, 3.4, std(0xa59b8d), 0, 3.0, 0, { cast: true });
  addBox(statue, 2.6, 0.9, 2.0, gold, 0, 3.65, 0.1, { cast: true });
  addBox(statue, 1.9, 2.2, 1.3, gold, 0, 5.1, -0.2, { cast: true });
  addBox(statue, 2.0, 0.5, 1.2, gold, 0, 4.3, 0.6, { cast: true });
  addSph(statue, 0.55, gold, 0, 6.6, -0.15, { cast: true });
  addCyl(statue, 0.36, 0.5, gold, 0, 7.15, -0.15, { cast: true });
  for (let x = -90; x <= 160; x += 16) {
    if (Math.abs(x + 42) < 6) continue;
    addBox(g, 6, 0.5, 1.8, std(0x7c7064), x, 0.4, 15, { receive: true });
    colBox(x, 15, 6.1, 1.9);
    let ok = false;
    for (let k = 0; k < 3; k++) ok = !!addModel(g, pick(['potted_plant_01_1k', 'potted_plant_02_1k']), rand(0.9, 1.2), x - 2 + k * 2, 0.4, 15 + rand(-0.3, 0.3), rand(0, 6)) || ok;
    if (!ok) for (let k = 0; k < 6; k++) addSph(g, rand(0.35, 0.55), std(pick([0x5f8a3c, 0x6e9a4b])), x - 2.5 + k, 0.75, 15 + rand(-0.4, 0.4));
  }
}

/* ---------- 차량 ---------- */
const paintCache = new Map();
function carPaint(c) {
  if (!paintCache.has(c)) paintCache.set(c, new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.06 }));
  return paintCache.get(c);
}
function makeVehicle(type) {
  const g = new THREE.Group();
  const isBus = type === 'bus';
  const color = type === 'taxi' ? 0xf28c28 : isBus ? 0x2f6fd6 : pick([0xf4f4f2, 0x22252b, 0xa9adb3, 0x8a1f2a, 0x2e4e6e]);
  const body = carPaint(color);
  const glass = std(0x141b24, { roughness: 0.05, metalness: 0.9 });
  if (isBus) {
    addBox(g, 11, 2.6, 2.5, body, 0, 1.75, 0, { cast: true });
    addBox(g, 10.2, 0.9, 2.52, glass, -0.2, 2.25, 0);
    addBox(g, 11.02, 0.25, 2.52, std(0xffffff), 0, 1.15, 0);
  } else {
    const len = type === 'taxi' ? 4.5 : rand(4.1, 4.8);
    addBox(g, len, 0.75, 1.8, body, 0, 0.75, 0, { cast: true });
    addBox(g, len * 0.55, 0.62, 1.62, glass, -0.15, 1.42, 0, { cast: true });
    addBox(g, len * 0.5, 0.06, 1.64, body, -0.15, 1.75, 0);
    if (type === 'taxi') addBox(g, 0.5, 0.18, 0.3, glow(0xfff2c0), -0.15, 1.87, 0);
  }
  const L = isBus ? 5.5 : 2.2;
  const wheel = std(0x16161a);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addMesh(g, CYL, wheel, sx * (L - 0.8), 0.36, sz * (isBus ? 1.2 : 0.86), 0.36, 0.24, 0.36, { rx: Math.PI / 2 });
  for (const sz of [-0.6, 0.6]) {
    addBox(g, 0.05, 0.16, 0.36, glow(0xfff5d6), L + 0.01, isBus ? 0.9 : 0.8, sz);
    addBox(g, 0.05, 0.16, 0.36, glow(0xff3b30), -L - 0.01, isBus ? 0.9 : 0.85, sz);
  }
  return g;
}
function buildTraffic() {
  const lanes = [
    { z: 6.7, dir: -1 }, { z: 9.8, dir: -1 },
    { z: 20.2, dir: 1 }, { z: 23.3, dir: 1 },
  ];
  lanes.forEach((ln) => {
    const n = LOW ? 2 : 4; // 휴대폰: 차량 절반
    for (let i = 0; i < n; i++) {
      const type = Math.random() < 0.18 ? 'bus' : Math.random() < 0.35 ? 'taxi' : 'car';
      const v = makeVehicle(type);
      v.position.set(-100 + (i + Math.random() * 0.5) * (300 / n), 0.02, ln.z);
      v.rotation.y = ln.dir > 0 ? 0 : Math.PI;
      street.add(v);
      cars.push({ g: v, dir: ln.dir, speed: type === 'bus' ? rand(7, 9) : rand(9, 14) });
    }
  });
}

/* ---------- 이웃 건물들 ---------- */
function makeBuilding(w, h, d, x, z, o = {}) {
  const front = facadeMat(Math.round(w / 2), Math.round(h / 3.6), o);
  const side = facadeMat(Math.round(d / 2), Math.round(h / 3.6), o);
  const roof = std(0x5c5552);
  const mesh = new THREE.Mesh(BOX, [side, side, roof, roof, front, front]);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
/* ---------- 맞은편 맛집 거리 (카페 · 빵집 · 분식 · 식당) ---------- */
const SHOPS = [
  { name: '종로 칼국수', sub: '손칼국수 · 만두', w: 12, h: 8, wall: '#d9c3a5', brick: true, awn: ['#2f6b4f', '#f3ead8'], sign: '#2f6b4f', menu: ['바지락 칼국수', '왕만두', '비빔국수'], scene: 'kor' },
  { name: '광화문 빵집', sub: 'BAKERY', w: 11, h: 10, wall: '#f0e2cf', awn: ['#c0503a', '#fbf3e6'], sign: '#8a3b2a', menu: ['갓 구운 소금빵', '크루아상', '단팥빵'], scene: 'bakery', terrace: true },
  { name: '세종 떡볶이', sub: '분식', w: 11, h: 7, wall: '#f2cf5b', awn: ['#d6452f', '#ffffff'], sign: '#d6452f', menu: ['국물 떡볶이', '김말이 튀김', '순대'], scene: 'snack' },
  { name: '은행나무 커피', sub: 'COFFEE & DESSERT', w: 14, h: 9, wall: '#7a4e3a', brick: true, awn: ['#3b2a22', '#e9c46a'], sign: '#3b2a22', menu: ['은행잎 라떼', '바닐라 빈 라떼', '당근 케이크'], scene: 'cafe', terrace: true },
  { name: '달콤 디저트', sub: '케이크 · 마카롱', w: 12, h: 11, wall: '#f6d5d8', awn: ['#e889a0', '#fff6f8'], sign: '#c95c78', menu: ['딸기 생크림 케이크', '마카롱 세트', '푸딩'], scene: 'dessert', terrace: true },
  { name: '불판 고깃집', sub: '숯불구이', w: 13, h: 8, wall: '#3a3030', awn: ['#8a1f2a', '#2a1f1f'], sign: '#8a1f2a', menu: ['숯불 삼겹살', '된장찌개', '냉면'], scene: 'bbq' },
  { name: '브런치 하우스', sub: 'BRUNCH', w: 12, h: 9, wall: '#e6efe8', awn: ['#6aa7a0', '#ffffff'], sign: '#3e7c74', menu: ['팬케이크', '에그 베네딕트', '오렌지 주스'], scene: 'brunch', terrace: true },
  { name: '광장 피자', sub: 'PIZZA & PASTA', w: 13, h: 10, wall: '#e9d2b4', brick: true, awn: ['#2e7d32', '#f5f1e8', '#c62828'], sign: '#2e7d32', menu: ['마르게리타', '고르곤졸라', '토마토 파스타'], scene: 'pizza', terrace: true },
  { name: '한그릇 국밥', sub: '24시간', w: 11, h: 7, wall: '#c9b79c', awn: ['#1f4fa0', '#f3ead8'], sign: '#1f4fa0', menu: ['돼지국밥', '순대국밥', '수육'], scene: 'kor' },
  { name: '아이스크림 가게', sub: 'GELATO', w: 11, h: 8, wall: '#cfe6f2', awn: ['#7cc6e8', '#ffffff'], sign: '#3d8fb8', menu: ['피스타치오', '흑임자', '딸기 소르베'], scene: 'dessert', terrace: true },
];
function shopInterior(scene) {
  return canvasTex(512, 220, (c, w, h) => {
    const warm = { kor: '#f6c98a', bakery: '#ffd9a0', snack: '#ffcf8a', cafe: '#f2b874', dessert: '#ffd6dc', bbq: '#ff9f6a', brunch: '#ffe3b0', pizza: '#ffc27a' }[scene] || '#ffd29a';
    const grd = c.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, warm); grd.addColorStop(1, '#6b4632');
    c.fillStyle = grd; c.fillRect(0, 0, w, h);
    // 펜던트 조명
    for (let x = 50; x < w; x += 100) {
      c.fillStyle = 'rgba(60,40,30,.8)'; c.fillRect(x - 1, 0, 2, 40);
      const g2 = c.createRadialGradient(x, 50, 2, x, 50, 60); g2.addColorStop(0, 'rgba(255,240,200,1)'); g2.addColorStop(1, 'rgba(255,220,160,0)');
      c.fillStyle = g2; c.fillRect(x - 60, 0, 120, 120);
      c.fillStyle = '#3a2a22'; c.beginPath(); c.moveTo(x - 16, 52); c.lineTo(x + 16, 52); c.lineTo(x + 9, 38); c.lineTo(x - 9, 38); c.fill();
    }
    // 선반 · 진열대
    c.fillStyle = 'rgba(90,60,40,.85)';
    for (const y of [70, 105]) c.fillRect(20, y, w - 40, 5);
    const items = { bakery: ['#c98a43', '#e0a85a', '#b5732f'], dessert: ['#ffb3c1', '#fff1c1', '#c6e8ff', '#d9a1ff'], cafe: ['#f4efe6', '#7a4e3a', '#e9c46a'], pizza: ['#d9452f', '#f2c14e'], snack: ['#e2452f', '#f2b84b'], kor: ['#f4efe6', '#e8d3b0'], bbq: ['#8a3b2a', '#f4efe6'], brunch: ['#f2c14e', '#ffffff', '#e8774a'] }[scene] || ['#f4efe6'];
    for (const y of [56, 91]) for (let x = 30; x < w - 30; x += rand(16, 26)) { c.fillStyle = pick(items); c.beginPath(); c.ellipse(x, y + 8, rand(5, 9), rand(5, 8), 0, 0, 7); c.fill(); }
    // 카운터 + 손님 실루엣
    c.fillStyle = 'rgba(70,45,32,.95)'; c.fillRect(0, 160, w, 60);
    for (let i = 0; i < 4; i++) {
      const x = rand(40, w - 40);
      c.fillStyle = 'rgba(50,32,25,.75)';
      c.beginPath(); c.arc(x, 128, 13, 0, 7); c.fill();
      c.beginPath(); c.ellipse(x, 160, 20, 22, 0, Math.PI, 0); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 0, w * 0.35, h);
  });
}
function awningTex(cols) {
  return canvasTex(256, 64, (c, w, h) => {
    const n = 12;
    for (let i = 0; i < n; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect((i * w) / n, 0, w / n + 1, h); }
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, h - 6, w, 6);
  });
}
function valanceTex(cols) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  const n = 16, sw = c.width / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[i % cols.length];
    g.beginPath(); g.moveTo(i * sw, 0); g.lineTo((i + 1) * sw, 0); g.lineTo((i + 1) * sw, 34); g.arc(i * sw + sw / 2, 34, sw / 2, 0, Math.PI); g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function signTex(shop) {
  return canvasTex(512, 128, (c, w, h) => {
    c.fillStyle = shop.sign; roundRect(c, 0, 0, w, h, 22); c.fill();
    c.strokeStyle = 'rgba(255,240,210,.75)'; c.lineWidth = 5; roundRect(c, 8, 8, w - 16, h - 16, 16); c.stroke();
    c.fillStyle = '#fff6e4'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(255,200,120,.9)'; c.shadowBlur = 14;
    c.font = `800 52px ${FONT}`; c.fillText(shop.name, w / 2, 54);
    c.shadowBlur = 0; c.font = `600 22px ${FONT}`; c.fillStyle = 'rgba(255,246,228,.85)'; c.fillText(shop.sub, w / 2, 98);
  });
}
function menuTex(shop) {
  return canvasTex(256, 320, (c, w, h) => {
    c.fillStyle = '#2d3a33'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#a77b4f'; c.lineWidth = 14; c.strokeRect(0, 0, w, h);
    c.fillStyle = '#ffe9a8'; c.textAlign = 'center'; c.font = `800 30px ${FONT}`; c.fillText('오늘의 메뉴', w / 2, 52);
    c.font = `600 24px ${FONT}`; c.fillStyle = '#f4efe6';
    shop.menu.forEach((m, i) => c.fillText(m, w / 2, 110 + i * 52));
    c.fillStyle = '#ffb3a0'; c.font = `700 24px ${FONT}`; c.fillText('맛있어요 ♥', w / 2, 284);
  });
}
function facadeFront(shop) {
  const W = Math.round(shop.w * 24), H = Math.round(shop.h * 24);
  const day = Math.random();
  const emiCells = [];
  const draw = (emi) => (c, w, h) => {
    c.fillStyle = emi ? '#000' : shop.wall; c.fillRect(0, 0, w, h);
    if (!emi && shop.brick) {
      for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < w; x += 16) { c.fillStyle = `rgba(0,0,0,${0.04 + ((x * 7 + y * 3) % 5) * 0.012})`; c.fillRect(x + 1, y + 1, 14, 6); }
    }
    // 위층 창문 (1층 3.8m 위)
    const top = h - (3.9 * 24);
    const rows = Math.max(1, Math.floor(top / 72));
    for (let r = 0; r < rows; r++) for (let i = 0; i < Math.floor(shop.w / 2.6); i++) {
      const n = Math.floor(shop.w / 2.6), gap = w / n;
      const x = i * gap + gap * 0.22, y = top - (r + 1) * 72 + 14, ww = gap * 0.56, hh = 46;
      const lit = ((i * 13 + r * 7 + Math.floor(day * 10)) % 3) !== 0;
      if (emi) { if (lit) { c.fillStyle = '#ffcf8a'; c.fillRect(x, y, ww, hh); } }
      else {
        c.fillStyle = '#e9e1d4'; c.fillRect(x - 3, y - 3, ww + 6, hh + 6);
        c.fillStyle = lit ? '#ffd9a0' : '#3a4656'; c.fillRect(x, y, ww, hh);
        c.fillStyle = 'rgba(255,255,255,.65)'; c.fillRect(x + ww / 2 - 1, y, 2, hh);
        if (lit) { c.fillStyle = 'rgba(200,120,80,.35)'; c.fillRect(x, y, ww * 0.25, hh); c.fillRect(x + ww * 0.75, y, ww * 0.25, hh); }
      }
    }
    if (!emi) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, w, 6); }
    void emiCells;
  };
  const fm = new THREE.MeshStandardMaterial({ map: canvasTex(W, H, draw(false)), emissiveMap: canvasTex(W, H, draw(true)), emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.85 });
  NIGHT_MATS.push({ m: fm, base: 0.55 });
  return fm;
}
function buildFoodStreet() {
  const g = street;
  const FRONT = 32.25;
  let cursor = -66;
  const tableTop = pbr('walnut_veneer', 1, 1, { rough: 0.4, fallback: 0x7b4a2c });
  const metal = std(0x2b2b30, { metalness: 0.6, roughness: 0.4 });
  const bulbs = [];
  SHOPS.forEach((shop, si) => {
    const cx = cursor + shop.w / 2;
    cursor += shop.w + 1.2;
    const D = 10;
    const wallM = std(new THREE.Color(shop.wall).getHex(), { roughness: 0.9 });
    const bld = new THREE.Mesh(BOX, [wallM, wallM, std(0x4a4440), wallM, wallM, facadeFront(shop)]);
    bld.scale.set(shop.w, shop.h, D);
    bld.position.set(cx, shop.h / 2, FRONT + D / 2);
    bld.castShadow = bld.receiveShadow = true;
    g.add(bld);
    // 진열창 (따뜻한 실내)
    const winW = shop.w - 3.4;
    const win = addWallPlane(g, winW, 2.5, new THREE.MeshBasicMaterial({ map: shopInterior(shop.scene) }), cx + 0.9, 1.55, FRONT - 0.02, Math.PI);
    void win;
    addWallPlane(g, winW, 2.5, new THREE.MeshStandardMaterial({ color: 0xbfd6e2, transparent: true, opacity: 0.12, metalness: 0.9, roughness: 0.05, depthWrite: false }), cx + 0.9, 1.55, FRONT - 0.05, Math.PI).renderOrder = 2;
    for (const dx of [-winW / 2, winW / 2]) addBox(g, 0.1, 2.6, 0.12, metal, cx + 0.9 + dx, 1.55, FRONT - 0.06);
    addBox(g, winW, 0.1, 0.12, metal, cx + 0.9, 2.82, FRONT - 0.06);
    addBox(g, winW + 0.1, 0.3, 0.18, std(0x4a3a30), cx + 0.9, 0.3, FRONT - 0.08);
    // 문
    const doorX = cx - shop.w / 2 + 1.15;
    addWallPlane(g, 1.1, 2.4, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), doorX, 1.35, FRONT - 0.02, Math.PI);
    addBox(g, 1.25, 0.08, 0.12, metal, doorX, 2.6, FRONT - 0.05);
    for (const dx of [-0.6, 0.6]) addBox(g, 0.07, 2.5, 0.12, metal, doorX + dx, 1.35, FRONT - 0.05);
    addBox(g, 0.03, 0.5, 0.05, std(0xc9a46a, { metalness: 0.8, roughness: 0.3 }), doorX + 0.38, 1.3, FRONT - 0.12);
    // 어닝 (줄무늬 차양) + 물결 장식
    const awn = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ map: awningTex(shop.awn), roughness: 0.9, side: THREE.DoubleSide }));
    awn.scale.set(shop.w - 0.4, 0.05, 1.7);
    awn.position.set(cx, 3.25, FRONT - 0.8);
    awn.rotation.x = -0.32;
    g.add(awn);
    const val = addWallPlane(g, shop.w - 0.4, 0.32, new THREE.MeshStandardMaterial({ map: valanceTex(shop.awn), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }), cx, 2.82, FRONT - 1.62, Math.PI);
    void val;
    // 간판
    const sw = Math.min(shop.w - 2, 7.5);
    addWallPlane(g, sw, sw / 4, new THREE.MeshBasicMaterial({ map: signTex(shop), toneMapped: false }), cx, 4.2, FRONT - 0.04, Math.PI);
    // 메뉴 입간판
    const mx = cx + shop.w / 2 - 1.1, mz = 31.0;
    const board = new THREE.Group();
    board.position.set(mx, 0.15, mz);
    board.rotation.y = Math.PI + 0.25;
    g.add(board);
    addBox(board, 0.62, 0.95, 0.05, std(0x8a5a3a), 0, 0.5, 0, { rx: -0.12 });
    addWallPlane(board, 0.52, 0.65, new THREE.MeshStandardMaterial({ map: menuTex(shop), roughness: 0.9 }), 0, 0.55, 0.06).rotation.x = -0.12;
    colCircle(mx, mz, 0.36);
    // 문 옆 화분
    addModel(g, 'potted_plant_04_2k', 1.2, doorX - 0.95 + (si % 2 ? 0 : 0), 0.15, 31.6, rand(0, 6));
    colCircle(doorX - 0.95, 31.6, 0.4);
    // 테라스 자리 (앉을 수 있어요)
    if (shop.terrace) {
      for (const tx of [cx - 1.2, cx + 1.9]) {
        const tz = 30.35;
        addCyl(g, 0.42, 0.04, tableTop, tx, 0.88, tz);
        addCyl(g, 0.04, 0.72, metal, tx, 0.51, tz);
        addCyl(g, 0.24, 0.03, metal, tx, 0.165, tz);
        addCyl(g, 0.05, 0.09, std(pick([0xffffff, 0xf4efe6, 0xe8774a])), tx - 0.12, 0.945, tz + 0.05);
        if (Math.random() < 0.7) { addCyl(g, 0.12, 0.012, std(0xffffff), tx + 0.12, 0.91, tz - 0.05); addSph(g, 0.05, std(pick([0xf2c14e, 0xe889a0, 0x8a4b34])), tx + 0.12, 0.95, tz - 0.05); }
        blob(g, tx, 0.15, tz, 1.6, 1.0);
        colCircle(tx, tz, 0.45);
        for (const sx of [-1, 1]) {
          const chx = tx + sx * 0.68;
          const ch = new THREE.Group();
          ch.position.set(chx, 0.15, tz);
          ch.rotation.y = faceTo(-sx, 0);
          g.add(ch);
          const cm = std(pick([0x2b2b30, 0x3e7c74, 0x8a3b2a]), { roughness: 0.6 });
          addBox(ch, 0.42, 0.05, 0.42, cm, 0, 0.46, 0);
          addBox(ch, 0.42, 0.42, 0.04, cm, 0, 0.72, -0.2);
          for (const lx of [-0.18, 0.18]) for (const lz of [-0.18, 0.18]) addBox(ch, 0.03, 0.46, 0.03, metal, lx, 0.23, lz);
          addSeat('cafe', chx, tz, faceTo(-sx, 0), { h: 0.48, ex: chx + sx * 0.2, ez: tz - 0.85 });
        }
      }
    }
    // 가게 앞 줄조명
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      bulbs.push([cx - shop.w / 2 + t * shop.w, 5.0 - Math.sin(t * Math.PI) * 0.55, FRONT - 0.25]);
    }
  });
  const bulbIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), bulbs.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  bulbs.forEach(([x, y, z], i) => { bulbIM.setMatrixAt(i, m4.makeTranslation(x, y, z)); bulbIM.setColorAt(i, col.set(pick([0xffd59a, 0xffc070, 0xffe6b8, 0xff9f6b]))); });
  g.add(bulbIM);
  // 맛집 거리 조명 (따뜻하게)
  for (const x of LOW ? [] : [-40, 0, 40]) {
    const l = new THREE.PointLight(0xffb36b, 30, 22, 1.6);
    l.position.set(x, 4.5, 29.5);
    g.add(l);
  }
}

function buildNeighbors() {
  const stone = { frame: '#b9ab98', base: ['#3b4450', '#46505c'], chance: 0.4, metal: 0.1, rough: 0.6 };
  const brick = { frame: '#8e5a46', base: ['#33302f', '#3d3836'], chance: 0.35, metal: 0.05, rough: 0.7 };
  const blue = { frame: '#4f6578', base: ['#24384d', '#2c4560'], chance: 0.5 };
  makeBuilding(22, 34, 28, -35, -15, stone);
  makeBuilding(26, 26, 28, 37, -15, brick);
  makeBuilding(30, 48, 30, -68, -16, blue);
  makeBuilding(28, 40, 30, 70, -16, stone);
  makeBuilding(30, 30, 30, 104, -16, blue);
  makeBuilding(30, 36, 26, -60, 100, stone);
  makeBuilding(36, 52, 30, -15, 102, blue);
  makeBuilding(30, 30, 28, 28, 100, brick);
  makeBuilding(40, 44, 30, 75, 102, stone);
}

/* ---------- 광화문 (원경) + 북악산 ---------- */
function hipRoof(W, D, H) {
  const r = (W - D) / 2;
  const A = [-W / 2, 0, D / 2], B = [W / 2, 0, D / 2], C = [W / 2, 0, -D / 2], Dd = [-W / 2, 0, -D / 2];
  const R1 = [-r, H, 0], R2 = [r, H, 0];
  const tris = [A, B, R2, A, R2, R1, C, Dd, R1, C, R1, R2, B, C, R2, Dd, A, R1];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  const uv = [];
  for (let i = 0; i < tris.length; i++) uv.push(tris[i][0] / 3, (tris[i][2] + tris[i][1] * 1.6) / 3);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}
function buildGate() {
  const g = new THREE.Group();
  g.position.set(-132, 0, 15);
  scene.add(g);
  const stone = pbr('large_sandstone_blocks', 5, 1.4, { color: 0xe8dccb });
  const face = new THREE.MeshStandardMaterial({
    roughness: 0.95,
    map: canvasTex(1024, 256, (c, w, h) => {
      const img = pbrTex.large_sandstone_blocks?.diff?.image || TEX.stoneBlocks.image;
      for (let x = 0; x < w; x += 256) c.drawImage(img, x, 0, 256, 256);
      c.fillStyle = '#1a1714';
      [[w * 0.28, 70], [w * 0.5, 84], [w * 0.72, 70]].forEach(([cx, aw]) => {
        c.beginPath();
        c.moveTo(cx - aw / 2, h);
        c.lineTo(cx - aw / 2, h - 120);
        c.arc(cx, h - 120, aw / 2, Math.PI, 0);
        c.lineTo(cx + aw / 2, h);
        c.fill();
      });
    }),
  });
  const base = new THREE.Mesh(BOX, [face, stone, stone, stone, stone, stone]);
  base.scale.set(12, 9, 40);
  base.position.y = 4.5;
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  const red = std(0x8c2d22), green = std(0x2f7a68), roofM = pbr('grey_roof_tiles', 1, 1, { color: 0x8a8a90, side: THREE.DoubleSide, fallback: 0x3a3a40 });
  for (let z = -12; z <= 12; z += 3) for (const x of [-3, 3]) addCyl(g, 0.32, 3.4, red, x, 10.7, z);
  addBox(g, 5.6, 3.2, 24, std(0x9b3a2b), 0, 10.6, 0);
  addBox(g, 7.4, 0.6, 26, green, 0, 12.5, 0);
  const r1 = new THREE.Mesh(hipRoof(31, 11, 2.4), roofM); r1.rotation.y = Math.PI / 2; r1.position.y = 12.7; r1.castShadow = true; g.add(r1);
  addBox(g, 5, 2.6, 19, std(0x9b3a2b), 0, 15.0, 0);
  addBox(g, 6.2, 0.5, 20, green, 0, 16.3, 0);
  const r2 = new THREE.Mesh(hipRoof(28, 9.5, 3.4), roofM); r2.rotation.y = Math.PI / 2; r2.position.y = 16.5; r2.castShadow = true; g.add(r2);
  addBox(g, 0.5, 0.5, 19.5, std(0x2a2a2e), 0, 19.9, 0);
  const plaque = canvasTex(256, 96, (c, w, h) => {
    c.fillStyle = '#1d2433'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#c9a24a'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#f2d58a'; c.font = `800 58px serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('光化門', w / 2, h / 2 + 2);
  });
  addWallPlane(g, 3.6, 1.35, new THREE.MeshBasicMaterial({ map: plaque }), 2.55, 15.1, 0, Math.PI / 2);
  // 궁궐 담장
  for (const sz of [-1, 1]) {
    addBox(g, 3, 5, 70, std(0xb5a288), 0, 2.5, sz * 55, { cast: true });
    addBox(g, 3.8, 0.5, 70, std(0x3a3a40), 0, 5.2, sz * 55);
  }
  // 북악산 / 인왕산
  const mtn = std(0x56644f, { roughness: 1 });
  [[-300, 10, 120, 95], [-280, -110, 110, 70], [-290, 140, 130, 80], [-250, -220, 120, 60], [-260, 250, 120, 65]].forEach(([x, z, r, h]) => {
    const cg = new THREE.ConeGeometry(r, h, 48, 8);
    const pa = cg.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const y = pa.getY(i);
      if (y > -h / 2 + 0.1) { const n = 1 + Math.sin(pa.getX(i) * 0.08) * 0.08 + Math.cos(pa.getZ(i) * 0.11) * 0.08; pa.setX(i, pa.getX(i) * n); pa.setZ(i, pa.getZ(i) * n); pa.setY(i, y + Math.sin(pa.getX(i) * 0.05 + pa.getZ(i) * 0.07) * h * 0.05); }
    }
    cg.computeVertexNormals();
    const m = new THREE.Mesh(cg, mtn);
    m.position.set(x, h / 2 - 2, z);
    m.rotation.y = rand(0, 3);
    scene.add(m);
  });
}

/* =========================================================================
   사람 (캐릭터)
   ========================================================================= */
const people = [];
const clickables = [];
const HIP = 0.56; // 엉덩이(골반) 높이 — 짧은 다리의 귀여운 비율
const GEO = {
  torso: new THREE.CapsuleGeometry(0.2, 0.14, 8, 20),
  arm: new THREE.CapsuleGeometry(0.066, 0.18, 4, 12),
  thigh: new THREE.CapsuleGeometry(0.088, 0.12, 4, 12),
  shin: new THREE.CapsuleGeometry(0.078, 0.12, 4, 12),
  head: new THREE.SphereGeometry(0.27, 40, 28),
  hairTop: new THREE.SphereGeometry(0.287, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
  hairBack: new THREE.SphereGeometry(0.284, 40, 12, Math.PI - 0.14, Math.PI + 0.28, Math.PI * 0.44, Math.PI * 0.34),
  fringe: new THREE.SphereGeometry(0.293, 32, 6, Math.PI / 2 - 0.85, 1.7, Math.PI * 0.2, Math.PI * 0.2),
  hood: new THREE.SphereGeometry(0.318, 48, 24, Math.PI / 2 + 0.78, Math.PI * 2 - 1.56, 0, Math.PI * 0.8),
  hatTop: new THREE.SphereGeometry(0.306, 40, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
  brim: new THREE.CircleGeometry(0.19, 28, 0, Math.PI),
  bangs: new THREE.SphereGeometry(1, 24, 12),
  hand: new THREE.SphereGeometry(0.064, 14, 10),
  eye: new THREE.SphereGeometry(0.046, 18, 14),
  shine: new THREE.SphereGeometry(0.015, 8, 6),
  blush: new THREE.CircleGeometry(0.05, 20),
  arc: new THREE.TorusGeometry(0.034, 0.009, 6, 18, Math.PI),
  ring: new THREE.TorusGeometry(0.062, 0.009, 8, 24),
  band: new THREE.TorusGeometry(0.3, 0.025, 8, 32, Math.PI),
  ear: new THREE.SphereGeometry(0.058, 12, 10),
  shoe: new THREE.SphereGeometry(0.085, 14, 10),
};
// 고를 수 있는 캐릭터 5종 (성별 구분 없음)
const DESIGNS = [
  { skin: 0xf6d3b8, shirt: 0xf08a4b, pants: 0x4a3a5a, hair: 0x5a3a28, shoe: 0xf2efe8, acc: 'beanie', accColor: 0xf2c14e },
  { skin: 0xefc3a2, shirt: 0x7cc6b4, pants: 0x2f3542, hair: 0x17120f, shoe: 0x2a2522, acc: 'glasses', long: true },
  { skin: 0xf8ddc8, shirt: 0xc89b6d, pants: 0x6b5a4a, hair: 0x6b4630, shoe: 0x8a4b34, acc: 'none' },
  { skin: 0xe2ad8a, shirt: 0x2c3446, pants: 0x2c3446, hair: 0x15110f, shoe: 0x141210, acc: 'suit' },
  { skin: 0xf6dcc4, shirt: 0xb49ad8, pants: 0x2c3e66, hair: 0xc08a5a, shoe: 0xf2efe8, acc: 'phones', accColor: 0xf4efe6, long: true },
];
const skinCache = new Map();
function skinMat(c) {
  if (!skinCache.has(c)) skinCache.set(c, new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.58, sheen: 0.5, sheenColor: new THREE.Color(0xffb8a0), sheenRoughness: 0.5 }));
  return skinCache.get(c);
}
const ANGER_MAT = new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.32, depthWrite: false });
const VEIN_TEX = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = '96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💢', 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const STEAM_TEX = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const EYE_MAT = new THREE.MeshPhysicalMaterial({ color: 0x1a1210, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
const SHINE_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const BLUSH_MAT = new THREE.MeshBasicMaterial({ color: 0xff8a8a, transparent: true, opacity: 0.45, depthWrite: false });
const MOUTH_MAT = new THREE.MeshStandardMaterial({ color: 0x8a3b3b, roughness: 0.6 });
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
function onFace(parent, geo, mat, x, y, z, cy = 0.27, sx = 1, sy = 1, sz = 1) {
  const m = addMesh(parent, geo, mat, x, y, z, sx, sy, sz);
  _v.set(x, y - cy, z).normalize();
  m.quaternion.copy(_q.setFromUnitVectors(Z, _v));
  return m;
}
// 귀여운 얼굴: 반짝이는 큰 눈(뜬 눈/감은 눈), 볼터치, 작은 미소
function makeFace(hp, cy) {
  const open = new THREE.Group(), closed = new THREE.Group();
  hp.add(open, closed);
  const eyes = [];
  for (const sx of [-1, 1]) {
    eyes.push(onFace(open, GEO.eye, EYE_MAT, sx * 0.095, cy + 0.005, 0.236, cy, 1, 1.15, 0.55));
    onFace(open, GEO.shine, SHINE_MAT, sx * 0.095 + 0.016, cy + 0.03, 0.262, cy);
    onFace(closed, GEO.arc, MOUTH_MAT, sx * 0.095, cy, 0.255, cy, 0.9, 0.7, 0.7).rotateZ(Math.PI);
    onFace(hp, GEO.blush, BLUSH_MAT, sx * 0.16, cy - 0.075, 0.205, cy, 1, 0.75, 1);
    onFace(hp, GEO.ear, hp.userData.skin, sx * 0.262, cy - 0.01, 0.0, cy, 0.7, 1, 1);
  }
  closed.visible = false;
  onFace(hp, GEO.arc, MOUTH_MAT, 0, cy - 0.095, 0.255, cy, 0.7, 0.7, 0.7).rotateZ(Math.PI);
  return { eyes, open, closed };
}
function makeHair(hp, cy, mH, long) {
  addMesh(hp, GEO.hairTop, mH, 0, cy + 0.005, -0.012, 1, 1, 1, { rx: -0.22 });
  addMesh(hp, GEO.hairBack, mH, 0, cy, -0.005, 1, long ? 1.6 : 1, 1);
  addMesh(hp, GEO.fringe, mH, 0, cy, 0, 1, 1, 1, { rx: -0.08 });
  if (long) for (const sx of [-1, 1]) addMesh(hp, GEO.bangs, mH, sx * 0.21, cy - 0.12, -0.04, 0.09, 0.2, 0.13);
}
function makeAccessory(hp, cy, d) {
  const m = d.accColor !== undefined ? fabric(d.accColor, 0.85) : null;
  if (d.acc === 'beanie') {
    // 눈썹 위까지 내려쓴 니트 비니 + 접힌 단 + 방울
    addMesh(hp, GEO.hatTop, m, 0, cy + 0.07, -0.01, 1.0, 1.0, 1.0, { rx: -0.14 });
    addMesh(hp, new THREE.TorusGeometry(0.3, 0.036, 12, 56), m, 0, cy + 0.075, -0.01, 1, 1, 1, { rx: Math.PI / 2 - 0.14 });
    addSph(hp, 0.075, m, 0, cy + 0.39, -0.05);
  } else if (d.acc === 'glasses') {
    const gm = std(0x2a2522, { roughness: 0.3, metalness: 0.3 });
    for (const sx of [-1, 1]) onFace(hp, GEO.ring, gm, sx * 0.095, cy + 0.005, 0.262, cy);
    addBox(hp, 0.06, 0.012, 0.012, gm, 0, cy + 0.01, 0.272);
  } else if (d.acc === 'suit') {
    // 셔츠 깃 + 넥타이는 몸통(makePerson)에서
  } else if (d.acc === 'phones') {
    const pm = std(d.accColor, { roughness: 0.4 });
    addMesh(hp, GEO.band, pm, 0, cy + 0.02, -0.01, 1, 1, 1);
    for (const sx of [-1, 1]) addMesh(hp, CYL, std(0xe06b7a, { roughness: 0.4 }), sx * 0.29, cy - 0.02, 0, 0.09, 0.08, 0.09, { rz: Math.PI / 2 });
  }
}

const NAME_MAT_CACHE = new Map();
function nameTag(text, me) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `700 40px ${FONT}`;
  const w = Math.ceil(g.measureText(text).width) + 44;
  c.width = w; c.height = 64;
  g.fillStyle = me ? 'rgba(224,112,60,0.92)' : 'rgba(34,26,40,0.72)';
  roundRect(g, 0, 0, w, 64, 32); g.fill();
  g.fillStyle = '#fff';
  g.font = `700 40px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  sp.center.set(0.5, 0);
  sp.scale.set(0.16 * (w / 64), 0.16, 1);
  sp.position.y = 1.66;
  sp.renderOrder = 9;
  return sp;
}
void NAME_MAT_CACHE;

function makePerson(designIdx = 0, o = {}) {
  const d = DESIGNS[designIdx] || DESIGNS[0];
  const g = new THREE.Group();
  const body = new THREE.Group(); // 자세(눕기)용 피벗
  g.add(body);
  const mS = fabric(d.shirt);
  const mP = fabric(d.pants);
  const mK = skinMat(d.skin);
  const mH = std(d.hair, { roughness: 0.55 });
  const torso = addMesh(body, GEO.torso, mS, 0, HIP + 0.2, 0, 1.06, 1, 0.92);
  if (d.acc === 'suit') {
    const white = std(0xf6f4ef, { roughness: 0.6 });
    const vee = new THREE.Mesh(new THREE.CircleGeometry(0.085, 3), white);
    vee.position.set(0, HIP + 0.33, 0.186); vee.rotation.z = -Math.PI / 2; vee.scale.set(1.5, 0.9, 1);
    body.add(vee);
    for (const sx of [-1, 1]) addBox(body, 0.07, 0.028, 0.02, white, sx * 0.045, HIP + 0.39, 0.175, { rz: sx * 0.45 });
    addBox(body, 0.04, 0.03, 0.012, std(0xb0313a, { roughness: 0.5 }), 0, HIP + 0.37, 0.19);
    addMesh(body, new THREE.CylinderGeometry(0.012, 0.03, 0.15, 4), std(0xb0313a, { roughness: 0.5 }), 0, HIP + 0.28, 0.192, 1, 1, 0.4);
    for (const sx of [-1, 1]) addBox(body, 0.05, 0.22, 0.015, std(0x222936, { roughness: 0.7 }), sx * 0.085, HIP + 0.27, 0.178, { rz: -sx * 0.32 });
    for (const y of [0.19, 0.12]) addSph(body, 0.012, std(0x0e0e10), 0.02, HIP + y, 0.19);
  }
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.04;
  headPivot.userData.skin = mK;
  body.add(headPivot);
  const CY = 0.27;
  addMesh(headPivot, GEO.head, mK, 0, CY, 0, 1, 0.96, 0.98);
  if (d.acc === 'beanie') addMesh(headPivot, GEO.hairBack, mH, 0, CY, -0.005);
  else makeHair(headPivot, CY, mH, d.long);
  makeAccessory(headPivot, CY, d);
  const face = makeFace(headPivot, CY);
  // 화난 얼굴 (임금님 귀는 당나귀 귀)
  const anger = new THREE.Group();
  anger.visible = false;
  headPivot.add(anger);
  addMesh(anger, GEO.head, ANGER_MAT, 0, CY, 0, 1.012, 0.972, 0.992);
  for (const sx of [-1, 1]) onFace(anger, BOX, std(0x2a1410), sx * 0.095, CY + 0.085, 0.262, CY, 0.11, 0.024, 0.02).rotateZ(sx * 0.5);
  onFace(anger, SPH, std(0x5a1014, { roughness: 0.5 }), 0, CY - 0.1, 0.256, CY, 0.055, 0.04, 0.02);
  const vein = new THREE.Sprite(new THREE.SpriteMaterial({ map: VEIN_TEX, transparent: true, depthWrite: false }));
  vein.scale.set(0.2, 0.2, 1); vein.position.set(0.24, CY + 0.26, 0.08);
  anger.add(vein);
  const steam = [-1, 1].map((sx) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: STEAM_TEX, transparent: true, depthWrite: false }));
    sp.position.set(sx * 0.22, CY + 0.32, 0); sp.userData.sx = sx;
    anger.add(sp); return sp;
  });
  const arms = [-1, 1].map((sx) => {
    const piv = new THREE.Group();
    piv.position.set(0.225 * sx, 0.97, 0);
    addMesh(piv, GEO.arm, mS, 0, -0.14, 0);
    addMesh(piv, GEO.hand, mK, 0, -0.29, 0);
    piv.rotation.z = 0.16 * sx;
    body.add(piv);
    return piv;
  });
  const paddle = addCyl(arms[1], 0.09, 0.015, std(0xc0392b), 0, -0.36, 0.06, { rx: Math.PI / 2 });
  paddle.visible = false;
  const shoeM = std(d.shoe, { roughness: 0.5 });
  const legs = [-1, 1].map((sx) => {
    const hip = new THREE.Group();
    hip.position.set(0.095 * sx, HIP, 0);
    addMesh(hip, GEO.thigh, mP, 0, -0.13, 0);
    const knee = new THREE.Group();
    knee.position.y = -0.26;
    hip.add(knee);
    addMesh(knee, GEO.shin, mP, 0, -0.12, 0);
    addMesh(knee, GEO.shoe, shoeM, 0, -0.25, 0.035, 1, 0.62, 1.45);
    body.add(hip);
    return { hip, knee };
  });
  const P = {
    g, body, torso, headPivot, arms, legs, eyes: face.eyes, face, paddle, anger, steam, rantT: 0,
    design: designIdx, phase: Math.random() * 10,
    state: 'idle', pose: 'stand', baseY: 0, groundY: 0,
    bubble: null, bubbleT: 0, bubbleDur: 0, bubbleY: 1.9,
    hopT: 0, waveT: 0,
  };
  g.traverse((m) => { if (m.isMesh) m.userData.person = P; });
  P.blob = blob(g, 0, 0, 0.05, 0.75, 0.75);
  if (o.name) { P.tag = nameTag(o.name, o.me); g.add(P.tag); }
  if (o.cast !== false) g.traverse((m) => { if (m.isMesh && m !== P.blob) m.castShadow = true; });
  return P;
}
// 자세 전환: stand / sit / lie
function setPose(P, pose, seatH = 0.45) {
  P.pose = pose;
  P.body.rotation.set(0, 0, 0);
  P.body.position.set(0, 0, 0);
  P.face.open.visible = pose !== 'lie';
  P.face.closed.visible = pose === 'lie';
  P.blob.visible = pose !== 'lie';
  if (pose === 'sit') {
    P.sitOffset = seatH + 0.07 - HIP;
    P.legs.forEach((l) => { l.hip.rotation.x = -Math.PI / 2; l.knee.rotation.x = Math.PI / 2 - 0.25; });
    P.blob.position.y = 0.012 - P.sitOffset;
  } else if (pose === 'lie') {
    P.sitOffset = seatH + 0.2;
    P.legs.forEach((l) => { l.hip.rotation.x = 0; l.knee.rotation.x = 0; });
    P.body.rotation.x = -Math.PI / 2;
    P.body.position.z = 0.56;
  } else {
    P.sitOffset = 0;
    P.legs.forEach((l) => { l.hip.rotation.x = 0; l.knee.rotation.x = 0; });
    P.blob.position.y = 0.012;
  }
  P.tag && (P.tag.position.y = pose === 'lie' ? 0.55 : 1.66);
  if (P.bubble) P.bubble.position.y = pose === 'lie' ? 0.8 : P.bubbleY;
}
const faceTo = (dx, dz) => Math.atan2(dx, dz);

/* ---------- 말풍선 ---------- */
const bubbleCache = new Map();
function bubbleTex(text, style) {
  const key = style + text;
  if (bubbleCache.has(key)) return bubbleCache.get(key);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const fs = 44;
  g.font = `700 ${fs}px ${FONT}`;
  // 긴 말은 두 줄로
  let lines = [text];
  if (g.measureText(text).width > 400) {
    const ch = [...text], mid = Math.floor(ch.length / 2);
    let cut = mid;
    for (let d = 0; d < mid; d++) { if (ch[mid + d] === ' ') { cut = mid + d; break; } if (ch[mid - d] === ' ') { cut = mid - d; break; } }
    lines = [ch.slice(0, cut).join('').trim(), ch.slice(cut).join('').trim()];
  }
  const tw = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width)));
  const pad = 30, bh = lines.length > 1 ? 136 : 82, tail = 20;
  c.width = tw + pad * 2 + 8; c.height = bh + tail + 8;
  const bg = style === 'sleep' ? '#d9e3ff' : style === 'poke' ? '#ffe7a8' : style === 'angry' ? '#e53935' : '#fffaf2';
  g.fillStyle = 'rgba(40,20,20,0.25)';
  roundRect(g, 6, 7, c.width - 10, bh, 36); g.fill();
  g.fillStyle = bg;
  roundRect(g, 4, 4, c.width - 10, bh, 36); g.fill();
  g.beginPath();
  g.moveTo(c.width / 2 - 14, bh + 2); g.lineTo(c.width / 2, bh + tail + 2); g.lineTo(c.width / 2 + 12, bh + 2); g.closePath(); g.fill();
  g.fillStyle = style === 'angry' ? '#ffffff' : '#2b2230';
  g.font = `${style === 'angry' ? 900 : 700} ${fs}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, (c.width - 6) / 2, bh / 2 + 5 + (i - (lines.length - 1) / 2) * 52));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const res = { tex: t, aspect: c.width / c.height };
  bubbleCache.set(key, res);
  return res;
}
function say(P, text, dur = 3.4, style = 'normal') {
  if (!P.bubble) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    sp.center.set(0.5, 0);
    sp.position.y = P.pose === 'lie' ? 0.8 : P.bubbleY;
    sp.renderOrder = 10;
    P.g.add(sp);
    P.bubble = sp;
  }
  const { tex, aspect } = bubbleTex(text, P.pose === 'lie' ? 'sleep' : style);
  P.bubble.material.map = tex;
  P.bubble.material.needsUpdate = true;
  P.bubbleAspect = aspect;
  P.bubbleT = 0;
  P.bubbleDur = dur;
  P.bubble.visible = true;
  if (/ㅋ|하하|😂|🤣|ㅎㅎ/.test(text)) P.laughT = dur;
}
// 상황별 대사 (버튼으로 골라서 말하기)
const PHRASES = {
  work: ['회의 5분 전!', '배포 성공 🎉', '커피 수혈 필요…☕', '이거 버그 아니고 기능이에요....!', 'PPT 한 장만 더!', '오늘 칼퇴 가능?', '타닥타닥 ⌨️', '메일 확인했어요!', '아이디어 있어요 💡', '엑셀 왜 이래…', '숫자 맞췄다!', '네? 제가요?'],
  lobby: ['어서오세요! 😊', '좋은 하루 보내세요!', '이 쇼파 푹신하다~', '점심 뭐 먹지?', '오늘 날씨 좋네요!'],
  lounge: ['ㅋㅋㅋㅋㅋ', '이 과자 맛있다!', '주말에 뭐 해요?', '하하하 😂', '피자 한 조각 더!', '생일 축하해요 🎂', '진짜요?!', '우리 팀 최고 👍', '나도 나도!', '아 배불러~'],
  pingpong: ['나이스! 🏓', '한 판 더!', '스매시!', '으앗!', '11 : 9!', '봐주는 거야~'],
  nap: ['Zzz…', '5분만 더…', '💤', '음냐음냐…', 'Zzz…😇…', '깨우지 마세요 🤫'],
  food: ['맛있겠다! 😋', '여기 줄 서 있네!', '빵 냄새 너무 좋다 🥐', '떡볶이 먹고 싶다 🌶️', '커피 한 잔 할까? ☕', '디저트 배는 따로 있지', '오늘 점심은 여기다!', '냄새 미쳤다…'],
  cafe: ['맛있겠다! 😋', '이 집 라떼 맛집이래 ☕', '케이크 하나 더 시킬까? 🍰', '여기 분위기 좋다!', '한 입만~', '사진 먼저 찍고 먹자 📸', '배불러… 행복해', '잘 먹겠습니다!'],
  street: ['광화문 도착!', '은행잎 진짜 예쁘다 🍂', '점심 먹으러 가자', '버스 왔다!', '산책하기 딱 좋네', '퇴근하자!'],
  meeting: ['회의 시작할게요!', '다음 안건이요', '좋은 의견이네요 👍', '그건 다음 회의 때…', '결론 내 볼까요?', '오늘 회의는 여기까지!', '자료 공유할게요 📊', '잠깐, 질문 있어요 🙋'],
  vent: ['후련하다~', '다 타버려라! 🔥', '오늘도 버텼다 💪', '곰돌아 고마워 🧸', '힐링된다…', '내일은 괜찮을 거야', '심호흡… 후—'],
  office: ['안녕하세요! 👋', '반가워요!', '커피 한잔 하실래요?', '오늘도 화이팅! 💪', '같이 놀아요!', '헤헤 😊'],
};
const POKE_FROM = ['콕! 👉', '안녕~ 콕콕!', '나 여기 있어요!', '뭐 해~?', '톡톡!'];
const POKE_TO = ['앗, 깜짝이야! 😳', '누구야~?', '간지러워 ㅋㅋㅋ', '반가워요! 👋', '헉!', '왜 불러~?', '히힛 😆'];

/* =========================================================================
   유리 빌딩 (회사)
   ========================================================================= */
const W = 40, D = 30, GF = 5; // 건물 가로/세로, 1층 높이
const doors = { L: null, R: null, open: 0, target: 0 };
const blinkers = [];
const glassMat = new THREE.MeshStandardMaterial({
  color: 0xa9cbd8, transparent: true, opacity: 0.16, metalness: 0.9, roughness: 0.04,
  envMap, envMapIntensity: 1.3, depthWrite: false, side: THREE.DoubleSide,
});
const frameMat = std(0x2b2d33, { metalness: 0.7, roughness: 0.35 });

function buildTower() {
  const g = new THREE.Group();
  scene.add(g);
  // 위층 (커튼월)
  const TH = 58;
  const front = facadeMat(20, 13, { chance: 0.42, frame: '#4d6170', base: ['#3a5f7d', '#2f5470', '#47708f'] });
  const side = facadeMat(15, 13, { chance: 0.38, frame: '#4d6170', base: ['#3a5f7d', '#2f5470', '#47708f'] });
  const back = facadeMat(20, 13, { chance: 0.4, frame: '#596b78' });
  const ceiling = new THREE.MeshStandardMaterial({ color: 0xf3eadc, roughness: 0.95 });
  const roof = std(0x4a4a50);
  const tower = new THREE.Mesh(BOX, [side, side, roof, ceiling, front, back]);
  tower.scale.set(W, TH, D);
  tower.position.set(0, GF + TH / 2, -D / 2);
  tower.castShadow = true;
  g.add(tower);
  // 층간 밴드
  addBox(g, W + 0.6, 0.5, 0.3, frameMat, 0, GF + 0.05, 0.15, { cast: true });
  addBox(g, W + 0.6, 0.5, 0.3, frameMat, 0, GF + 0.05, -D - 0.15);
  addBox(g, 0.3, 0.5, D, frameMat, W / 2 + 0.15, GF + 0.05, -D / 2);
  addBox(g, 0.3, 0.5, D, frameMat, -W / 2 - 0.15, GF + 0.05, -D / 2);
  // 옥상
  addBox(g, W + 0.4, 1.2, D + 0.4, std(0x3a3b40), 0, GF + TH + 0.6, -D / 2, { cast: true });
  addBox(g, 10, 4, 8, std(0x55565c), 4, GF + TH + 3, -15, { cast: true });
  addCyl(g, 0.15, 12, std(0x888c92, { metalness: 0.8 }), -8, GF + TH + 7, -12);
  const bl = addSph(g, 0.35, glow(0xff3030), -8, GF + TH + 13.2, -12);
  blinkers.push(bl);

  // 1층 기둥
  for (const x of [-W / 2, W / 2]) for (const z of [0, -D]) addBox(g, 0.5, GF, 0.5, frameMat, x, GF / 2, z, { cast: true });
  // 1층 바닥 슬래브
  addBox(g, W, 0.15, D, std(0x8c8378), 0, 0.075, -D / 2, { receive: true });

  // 전면 유리
  const glassPane = (w, h, x, y, z, ry = 0) => {
    const m = addWallPlane(g, w, h, glassMat, x, y, z, ry);
    m.renderOrder = 2;
    return m;
  };
  const DW = 3.2; // 문 폭
  glassPane((W - DW) / 2, GF - 0.15, -(W + DW) / 4, 0.15 + (GF - 0.15) / 2, 0);
  glassPane((W - DW) / 2, GF - 0.15, (W + DW) / 4, 0.15 + (GF - 0.15) / 2, 0);
  glassPane(DW, GF - 3.35, 0, 3.3 + (GF - 3.3) / 2, 0);
  // 측면 유리
  for (const sx of [-1, 1]) glassPane(D, GF - 0.15, sx * W / 2, 0.15 + (GF - 0.15) / 2, -D / 2, Math.PI / 2);
  // 멀리언
  for (let x = -W / 2 + 2.5; x < W / 2; x += 2.5) {
    if (Math.abs(x) < DW / 2 + 0.1) continue;
    addBox(g, 0.07, GF - 0.15, 0.12, frameMat, x, 0.15 + (GF - 0.15) / 2, 0);
  }
  for (let z = -2.5; z > -D; z -= 2.5) for (const sx of [-1, 1]) addBox(g, 0.12, GF - 0.15, 0.07, frameMat, sx * W / 2, 0.15 + (GF - 0.15) / 2, z);
  addBox(g, W, 0.08, 0.12, frameMat, 0, 3.3, 0);
  for (const sx of [-1, 1]) addBox(g, 0.12, 0.08, D, frameMat, sx * W / 2, 3.3, -D / 2);
  addBox(g, W, 0.12, 0.14, frameMat, 0, 0.2, 0);
  for (const sx of [-1, 1]) addBox(g, 0.1, 3.15, 0.16, frameMat, sx * DW / 2, 0.15 + 1.575, 0);

  // 자동문
  const makeDoor = (sx) => {
    const d = new THREE.Group();
    d.position.set(sx * DW / 4, 0.15, -0.06);
    const pane = addWallPlane(d, DW / 2 - 0.06, 3.1, glassMat, 0, 1.55, 0);
    pane.renderOrder = 2;
    addBox(d, DW / 2, 0.06, 0.06, frameMat, 0, 3.1, 0);
    addBox(d, DW / 2, 0.06, 0.06, frameMat, 0, 0.03, 0);
    addBox(d, 0.05, 3.1, 0.06, frameMat, sx * (DW / 4 - 0.02), 1.55, 0);
    addBox(d, 0.04, 1.0, 0.08, std(0xc9a46a, { metalness: 0.8, roughness: 0.3 }), -sx * (DW / 4 - 0.12), 1.4, 0.04);
    g.add(d);
    d.userData.sx = sx;
    return d;
  };
  doors.L = makeDoor(-1);
  doors.R = makeDoor(1);

  // 캐노피 + 매트
  addBox(g, 9, 0.22, 3, frameMat, 0, 4.1, 1.5, { cast: true });
  for (let x = -3.5; x <= 3.5; x += 1.75) addCyl(g, 0.12, 0.02, glow(0xffe0b0), x, 3.98, 1.6);
  addPlane(g, 3.4, 1.6, std(0x5a3a2c), 0, 0.157, 1.1);

  // 간판
  const signTex = canvasTex(1024, 220, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.textBaseline = 'middle';
    c.shadowColor = 'rgba(255,170,80,0.9)'; c.shadowBlur = 24;
    c.fillStyle = '#fff1d6';
    c.font = `800 150px ${FONT}`;
    c.textAlign = 'center';
    c.fillText('보장원', w / 2, h / 2 + 8);
  });
  const sign = addWallPlane(g, 15, 3.2, new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false, depthWrite: false }), 0, 7.6, 0.08);
  sign.renderOrder = 3;
}

/* =========================================================================
   실내
   ========================================================================= */
const interior = new THREE.Group();
interior.position.y = 0.15;
scene.add(interior);
const pingpong = { ball: null, players: [], u: 0, dir: 1, speed: 0.9, lastHalf: 0 };
const stars = { mat: null };
const zones = {};

const SCREEN_TEX = [
  canvasTex(256, 160, (c, w, h) => { // 코드
    c.fillStyle = '#1e1f2b'; c.fillRect(0, 0, w, h);
    for (let y = 12; y < h - 6; y += 11) {
      let x = 10 + Math.floor(rand(0, 4)) * 12;
      while (x < w - 20 && Math.random() > 0.15) {
        const len = rand(12, 50);
        c.fillStyle = pick(['#f78c6c', '#c3e88d', '#82aaff', '#c792ea', '#ffcb6b', '#babed8']);
        c.fillRect(x, y, len, 5); x += len + 6;
      }
    }
  }),
  canvasTex(256, 160, (c, w, h) => { // 차트
    c.fillStyle = '#fbf7f0'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2b2230'; c.fillRect(0, 0, w, 18);
    const cols = ['#e8774a', '#f2b84b', '#6aa7a0', '#8f6fb5'];
    for (let i = 0; i < 9; i++) { const bh = rand(20, 100); c.fillStyle = cols[i % 4]; c.fillRect(20 + i * 25, h - 14 - bh, 16, bh); }
    c.strokeStyle = '#d65d6c'; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i < 9; i++) c.lineTo(28 + i * 25, 40 + Math.sin(i) * 18 + i * 3);
    c.stroke();
  }),
  canvasTex(256, 160, (c, w, h) => { // 스프레드시트
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#217346'; c.fillRect(0, 0, w, 16);
    c.strokeStyle = '#d6d6d6';
    for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 16); c.lineTo(x, h); c.stroke(); }
    for (let y = 16; y < h; y += 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = '#555';
    for (let i = 0; i < 40; i++) c.fillRect(Math.floor(rand(0, 8)) * 32 + 4, 20 + Math.floor(rand(0, 11)) * 12, rand(8, 22), 4);
    c.fillStyle = 'rgba(242,184,75,.5)'; c.fillRect(64, 52, 64, 12);
  }),
  canvasTex(256, 160, (c, w, h) => { // 화상회의
    c.fillStyle = '#222'; c.fillRect(0, 0, w, h);
    const cols = ['#e8a87c', '#85cdca', '#e27d60', '#c38d9e', '#41b3a3', '#f2c14e'];
    for (let i = 0; i < 6; i++) {
      const x = (i % 3) * 84 + 4, y = Math.floor(i / 3) * 76 + 6;
      c.fillStyle = cols[i]; c.fillRect(x, y, 80, 72);
      c.fillStyle = 'rgba(255,240,220,.85)'; c.beginPath(); c.arc(x + 40, y + 30, 14, 0, 7); c.fill();
      c.fillRect(x + 22, y + 48, 36, 24);
    }
  }),
];
const screenMats = SCREEN_TEX.map((t) => new THREE.MeshBasicMaterial({ map: t }));

let DESK_TOP = null;
const desks = new Map(); // key → { g, screen, chairMat, mug, slots, plate }
function makeDesk(key) {
  const g = new THREE.Group();
  const top = DESK_TOP ||= pbr('oak_veneer_01', 1, 0.5, { rough: 0.55, fallback: 0xdcc3a1 });
  const leg = std(0xf1ede6, { roughness: 0.4, metalness: 0.2 });
  addBox(g, 1.5, 0.04, 0.75, top, 0, 0.74, 0);
  for (const sx of [-1, 1]) addBox(g, 0.04, 0.72, 0.68, leg, sx * 0.72, 0.36, 0);
  // 모니터
  addBox(g, 0.18, 0.02, 0.14, std(0x2b2b2f), 0, 0.77, -0.22);
  addBox(g, 0.04, 0.24, 0.03, std(0x2b2b2f), 0, 0.88, -0.24);
  addBox(g, 0.62, 0.38, 0.03, std(0x1c1c20, { roughness: 0.4 }), 0, 1.07, -0.22);
  const screen = addWallPlane(g, 0.58, 0.34, pick(screenMats), 0, 1.07, -0.204);
  addBox(g, 0.42, 0.02, 0.14, std(0xe9e6e0), 0, 0.77, 0.17);
  addBox(g, 0.06, 0.02, 0.1, std(0xe9e6e0), 0.32, 0.77, 0.17);
  const mugMat = new THREE.MeshStandardMaterial({ color: pick([0xffffff, 0xe8774a, 0xf2b84b, 0x6aa7a0]), roughness: 0.25 });
  const mug = addCyl(g, 0.04, 0.1, mugMat, -0.36, 0.81, 0.12);
  mug.visible = Math.random() < 0.6;
  // 모든 책상에 스탠드
  addModel(g, 'desk_lamp_arm_01_1k', 0.45, -0.6, 0.76, -0.22, 2.3);
  addSph(g, 0.03, glow(0xfff0d0), -0.5, 1.08, -0.08);
  // 꾸미기 자리 (오른쪽 두 칸)
  const slots = [new THREE.Group(), new THREE.Group()];
  slots[0].position.set(0.56, 0.76, -0.2); slots[1].position.set(0.42, 0.76, 0.12);
  slots.forEach((sl) => g.add(sl));
  if (Math.random() < 0.5) addBox(g, 0.22, rand(0.02, 0.08), 0.3, std(0xf8f4ec), -0.45, 0.78, -0.15, { ry: rand(-0.3, 0.3) });
  // 의자
  const chair = new THREE.Group();
  chair.position.z = 0.64;
  chair.rotation.y = rand(-0.25, 0.25);
  g.add(chair);
  const cm = new THREE.MeshStandardMaterial({ color: pick([0x33363b, 0x33363b, 0xd2693c, 0x3e7c74]), roughness: 0.85 });
  addBox(chair, 0.5, 0.07, 0.48, cm, 0, 0.47, 0);
  addBox(chair, 0.48, 0.52, 0.06, cm, 0, 0.8, 0.25);
  addCyl(chair, 0.03, 0.38, std(0x777a80, { metalness: 0.7 }), 0, 0.25, 0);
  addCyl(chair, 0.28, 0.04, std(0x2a2a2e), 0, 0.05, 0);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.08), new THREE.MeshBasicMaterial({ transparent: true }));
  plate.position.set(0.12, 0.8, 0.33); plate.rotation.x = -0.5; plate.visible = false;
  g.add(plate);
  desks.set(key, { g, screen, chairMat: cm, chairBase: cm.color.getHex(), mug, mugBase: { c: mugMat.color.getHex(), v: mug.visible }, slots, plate, defaults: slots.map((sl) => [...sl.children]), screenBase: screen.material });
  return g;
}
function makePod(cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  interior.add(g);
  for (const [dx, dz, ry] of [[-0.78, 0.4, 0], [0.78, 0.4, 0], [-0.78, -0.4, Math.PI], [0.78, -0.4, Math.PI]]) {
    const key = `d${cx}_${cz}_${dx > 0 ? 'R' : 'L'}${dz > 0 ? 'S' : 'N'}`.replace(/\./g, 'p');
    const d = makeDesk(key);
    d.position.set(dx, 0, dz);
    d.rotation.y = ry;
    g.add(d);
    const sx = cx + dx + Math.sin(ry) * 0.64, sz = cz + dz + Math.cos(ry) * 0.64;
    const seat = addSeat('desk', sx, sz, ry + Math.PI, { h: 0.5, ex: cx + dx + Math.sin(ry) * 1.35, ez: cz + dz + Math.cos(ry) * 1.35 });
    seat.deskKey = key;
  }
  colBox(cx, cz, 3.15, 1.6);
  addBox(g, 3.1, 0.4, 0.04, fabric(pick([0xe9b949, 0x8fb39b, 0xd98a6a])), 0, 0.96, 0);
  blob(g, 0, 0, 0, 4.2, 3.6);
  // 펜던트 라이트 (리니어)
  addCyl(g, 0.006, 1.8, std(0x222222), -1, 3.95, 0);
  addCyl(g, 0.006, 1.8, std(0x222222), 1, 3.95, 0);
  addBox(g, 2.8, 0.06, 0.22, std(0x2b2b2f), 0, 3.05, 0);
  addBox(g, 2.7, 0.02, 0.16, glow(0xfff0d4), 0, 3.015, 0);
}
function makePlant(parent, x, z, s = 1) {
  const big = s >= 1.15;
  const name = big ? 'potted_plant_04_2k' : pick(['potted_plant_01_1k', 'potted_plant_02_1k']);
  if (parent === interior) colCircle(x, z, 0.36 * s);
  if (addModel(parent, name, big ? 1.45 * s : 0.95 * s, x, 0, z, rand(0, 6.28))) { blob(parent, x, 0, z, 1.1 * s, 1.1 * s); return; }
  addCyl(parent, 0.32 * s, 0.55 * s, std(pick([0xc96f4a, 0xe9e3d8, 0x3d3a3a])), x, 0.275 * s, z);
  const leafM = std(pick([0x4f8a3c, 0x5f9a4b, 0x3f7a3a]), { flatShading: true });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 * s, 0), leafM);
    m.position.set(x + rand(-0.25, 0.25) * s, (0.8 + i * 0.28) * s, z + rand(-0.25, 0.25) * s);
    m.scale.y = 1.3;
    m.rotation.set(rand(0, 3), rand(0, 3), 0);
    parent.add(m);
  }
}
function textPlane(parent, text, w, h, x, y, z, ry, o = {}) {
  const tex = canvasTex(o.cw || 1024, o.ch || Math.round(1024 * h / w), (c, cw, ch) => {
    c.clearRect(0, 0, cw, ch);
    if (o.bg) { c.fillStyle = o.bg; roundRect(c, 0, 0, cw, ch, o.radius ?? 20); c.fill(); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${o.weight || 800} ${o.size || ch * 0.55}px ${FONT}`;
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = 30; }
    c.fillStyle = o.color || '#2b2230';
    c.fillText(text, cw / 2, ch / 2 + 4);
    if (o.glow) c.fillText(text, cw / 2, ch / 2 + 4);
  });
  const m = addWallPlane(parent, w, h, new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: !o.glow, depthWrite: false }), x, y, z, ry);
  return m;
}

// 공간 이름 명패 (나무 판 + 금색 테두리)
function plaque(parent, text, x, y, z, ry = 0, o = {}) {
  const h = o.h ?? 0.42, w = o.w ?? h * (1.6 + [...text].length * 0.62);
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = ry;
  parent.add(g);
  if (o.style === 'glass') {
    // 유리벽에 어울리는 반투명 아크릴 사인 + 알루미늄 핀
    const tex = canvasTex(512, Math.round(512 * h / w), (c, cw, ch) => {
      c.clearRect(0, 0, cw, ch);
      c.fillStyle = 'rgba(255,255,255,0.8)'; roundRect(c, 4, 4, cw - 8, ch - 8, 18); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 4; roundRect(c, 4, 4, cw - 8, ch - 8, 18); c.stroke();
      c.fillStyle = o.accent || '#e0703c'; c.fillRect(cw * 0.3, ch * 0.8, cw * 0.4, 5);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${Math.round(ch * 0.5)}px ${FONT}`;
      c.fillStyle = o.color || '#3a3340'; c.fillText(text, cw / 2, ch * 0.47);
    });
    const m = addWallPlane(g, w, h, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }), 0, 0, 0.045);
    m.renderOrder = 4;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) addMesh(g, CYL, std(0xc8cdd2, { metalness: 0.85, roughness: 0.25 }), sx * (w / 2 - 0.06), sy * (h / 2 - 0.06), 0.024, 0.018, 0.05, 0.018, { rx: Math.PI / 2 });
    return g;
  }
  if (o.style === 'cute') {
    // 하트·별 벽지에 어울리는 파스텔 명패
    const tex = canvasTex(512, Math.round(512 * h / w), (c, cw, ch) => {
      c.clearRect(0, 0, cw, ch);
      const grd = c.createLinearGradient(0, 0, 0, ch); grd.addColorStop(0, '#ffe3ec'); grd.addColorStop(1, '#f7b3c8');
      c.fillStyle = grd; roundRect(c, 4, 4, cw - 8, ch - 8, ch * 0.42); c.fill();
      c.setLineDash([10, 8]); c.strokeStyle = '#ffffff'; c.lineWidth = 4; roundRect(c, 14, 14, cw - 28, ch - 28, ch * 0.34); c.stroke(); c.setLineDash([]);
      const heart = (hx, hy, sz, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(hx, hy + sz * 0.3); c.bezierCurveTo(hx, hy, hx - sz * 0.5, hy, hx - sz * 0.5, hy + sz * 0.3); c.bezierCurveTo(hx - sz * 0.5, hy + sz * 0.6, hx, hy + sz * 0.75, hx, hy + sz); c.bezierCurveTo(hx, hy + sz * 0.75, hx + sz * 0.5, hy + sz * 0.6, hx + sz * 0.5, hy + sz * 0.3); c.bezierCurveTo(hx + sz * 0.5, hy, hx, hy, hx, hy + sz * 0.3); c.fill(); };
      heart(cw * 0.1, ch * 0.32, ch * 0.32, '#f06f8a'); heart(cw * 0.9, ch * 0.32, ch * 0.32, '#f06f8a');
      c.fillStyle = '#f6c453';
      for (const [sx, sy] of [[0.17, 0.22], [0.83, 0.74]]) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 5 : 11; c.lineTo(cw * sx + Math.cos(a) * r, ch * sy + Math.sin(a) * r); } c.fill(); }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${Math.round(ch * 0.44)}px ${FONT}`;
      c.fillStyle = 'rgba(200,70,110,.45)'; c.fillText(text, cw / 2 + 2, ch / 2 + 5);
      c.fillStyle = '#ffffff'; c.fillText(text, cw / 2, ch / 2 + 2);
    });
    const m = addWallPlane(g, w, h, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, toneMapped: false }), 0, 0, 0.012);
    m.renderOrder = 4;
    return g;
  }
  const tex = canvasTex(512, Math.round(512 * h / w), (c, cw, ch) => {
    const grd = c.createLinearGradient(0, 0, 0, ch); grd.addColorStop(0, '#74472c'); grd.addColorStop(1, '#4b2b1a');
    c.fillStyle = grd; c.fillRect(0, 0, cw, ch);
    c.strokeStyle = 'rgba(30,15,8,.25)'; c.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const yy = rand(6, ch - 6); c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(cw * 0.3, yy + rand(-5, 5), cw * 0.7, yy + rand(-5, 5), cw, yy); c.stroke(); }
    c.strokeStyle = '#d8b46a'; c.lineWidth = 5; roundRect(c, 12, 12, cw - 24, ch - 24, 10); c.stroke();
    c.fillStyle = '#e9cf8c';
    for (const sx of [30, cw - 30]) { c.beginPath(); c.arc(sx, ch / 2, 7, 0, 7); c.fill(); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${Math.round(ch * 0.5)}px ${FONT}`;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillText(text, cw / 2 + 2, ch / 2 + 6);
    c.fillStyle = '#fbecd0'; c.fillText(text, cw / 2, ch / 2 + 3);
  });
  addBox(g, w + 0.04, h + 0.04, 0.035, std(0x3e2516, { roughness: 0.6 }), 0, 0, 0);
  addWallPlane(g, w, h, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05 }), 0, 0, 0.019);
  return g;
}
function buildInterior() {
  const g = interior;
  const CEIL = GF - 0.15;
  // 바닥
  addPlane(g, 22.5, 6, pbr('large_floor_tiles_02', 22.5 / 2.4, 6 / 2.4, { color: 0xf3ece2, env: 1.2 }), -8.75, 0.005, -3);
  addPlane(g, 22.5, 24, pbr('concrete_floor_02', 22.5 / 4, 24 / 4, { color: 0xf2f3f6, rough: 0.75, env: 1.5 }), -8.75, 0.005, -18);
  addPlane(g, 17.5, 16, pbr('herringbone_parquet', 17.5 / 2.2, 16 / 2.2, { color: 0xfff1e2 }), 11.25, 0.005, -8);
  addPlane(g, 17.5, 14, pbr('herringbone_parquet', 17.5 / 2.2, 14 / 2.2, { color: 0xb89a86 }), 11.25, 0.005, -23);

  // 뒷벽 (벽돌)
  addBox(g, W, CEIL, 0.3, std(0xd9c6b0), 0, CEIL / 2, -D + 0.15);
  // 벽돌 벽은 포스터 벽 구간을 빼고 양쪽으로 나눠 그리고, 무늬가 끊기지 않게 맞춰요
  const WALL_X0 = -W / 2 + 0.1;
  const brickSeg = (a, b) => {
    const m = pbr('red_brick_03', (b - a) / BRICK_TILE, CEIL / BRICK_TILE, { color: 0xf2e2d4 });
    for (const t of [m.map, m.normalMap]) if (t) t.offset.x = ((a - WALL_X0) / BRICK_TILE) % 1;
    addWallPlane(g, b - a, CEIL, m, (a + b) / 2, CEIL / 2, -D + 0.31);
  };
  brickSeg(WALL_X0, POSTER_WALL.x0);
  brickSeg(POSTER_WALL.x1, W / 2 - 0.1);
  buildPosterWall(g, WALL_X0, -D + 0.31, CEIL);
  // 벽시계
  const clockTex = canvasTex(128, 128, (c) => {
    c.fillStyle = '#fffaf2'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill();
    c.strokeStyle = '#2b2230'; c.lineWidth = 6; c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 24); c.moveTo(64, 64); c.lineTo(92, 74); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillStyle = '#2b2230'; c.fillRect(64 + Math.cos(a) * 50 - 2, 64 + Math.sin(a) * 50 - 2, 4, 4); }
  });
  addWallPlane(g, 0.7, 0.7, new THREE.MeshBasicMaterial({ map: clockTex, transparent: true }), -2.5, 3.4, -D + 0.33);
  // 액자들
  [[-17.2, 0xe8774a], [-15.8, 0x6aa7a0], [-14.4, 0xf2b84b]].forEach(([x, c]) => {
    addBox(g, 0.9, 0.7, 0.04, std(0x3a2a20), x, 2.1, -D + 0.34);
    addBox(g, 0.78, 0.58, 0.02, std(c), x, 2.1, -D + 0.37);
  });

  /* ---------- 로비 ---------- */
  makePlant(g, -2.4, -1.0, 1.2);
  makePlant(g, 2.4, -1.0, 1.2);

  /* ---------- 업무 공간 ---------- */
  for (const px of [-14.5, -6.5]) for (const pz of [-10, -17, -24]) if (!(px === -14.5 && pz === -24)) makePod(px, pz);
  // 복합기 & 정수기
  addCyl(g, 0.18, 1.0, std(0xf2f0eb), 1.6, 0.5, -20.5);
  addCyl(g, 0.16, 0.4, std(0x9fd3e8, { transparent: true, opacity: 0.7 }), 1.6, 1.2, -20.5);
  colCircle(1.6, -20.5, 0.25);
  makePlant(g, -19, -6.3, 1.1);
  // 업무 조명
  // 업무공간 조명 (밝고 따뜻하게: 천장 4곳)
  zones.workLights = (LOW ? [[-10.5, -12], [-10.5, -21]] : [[-14.5, -10.5], [-6.5, -10.5], [-14.5, -22.5], [-6.5, -22.5]]).map(([x, z]) => {
    const l = new THREE.PointLight(0xffe2bd, LOW ? 54 : 42, LOW ? 22 : 18, 1.4);
    l.position.set(x, 4.3, z);
    return l;
  });
  g.add(...zones.workLights);
  // 천장 조명 패널 (빛이 나는 면)
  for (const x of [-14.5, -6.5]) for (const z of [-13.5, -20.5]) addBox(g, 3.2, 0.03, 1.2, glow(0xfff4e2), x, GF - 0.17, z);
  if (!LOW) {
    const lobbyLight = new THREE.PointLight(0xffcf9a, 20, 13, 1.6);
    lobbyLight.position.set(-4, 4.2, -2.5);
    g.add(lobbyLight);
  }

  // 업무/휴게 구분 책장
  const shelf = new THREE.Group();
  shelf.position.set(2.5, 0, -9.8);
  g.add(shelf);
  addBox(shelf, 0.4, 1.3, 6.6, std(0xb07a4a), 0, 0.65, 0);
  colBox(2.5, -9.8, 0.45, 6.65);
  const bookIM = new THREE.InstancedMesh(BOX, std(0xffffff), 120);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let bi = 0;
  for (const lvl of [0.32, 0.92]) for (let z = -3.15; z < 3.15 && bi < 120; z += 0.11) {
    const h = rand(0.28, 0.42);
    bookIM.setMatrixAt(bi, m4.compose(p.set(0, lvl + h / 2 - 0.12, z), q.identity(), s.set(0.3, h, 0.08)));
    bookIM.setColorAt(bi++, col.set(pick([0xe8774a, 0xf2b84b, 0x6aa7a0, 0xf4efe6, 0x8f6fb5, 0xd65d6c, 0x2c3e66])));
  }
  bookIM.count = bi;
  shelf.add(bookIM);
  const shelfTop = new THREE.Group();
  shelfTop.position.y = 1.3;
  shelf.add(shelfTop);
  for (const z of [-2.6, 0, 2.6]) makePlant(shelfTop, 0, z, 0.55);

  /* ---------- 휴게실 ---------- */
  const L = new THREE.Vector3(11, 0, -8.5); // 쇼파 중앙
  addMesh(g, new THREE.CircleGeometry(3.95, 48), new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 1, normalMap: fabricNor }), L.x, 0.012, L.z, 1, 1, 1, { rx: -Math.PI / 2 });
  // 원형 쇼파
  const GAP = Math.PI + 0.47, HALF = 0.6;
  const a0 = GAP + HALF, a1 = GAP - HALF + Math.PI * 2;
  const sector = (rIn, rOut, h, bevel = 0.05) => {
    const sh = new THREE.Shape();
    sh.absarc(0, 0, rOut, a0, a1, false);
    sh.absarc(0, 0, rIn, a1, a0, true);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 64 });
    geo.rotateX(-Math.PI / 2);
    return geo;
  };
  const sofaM = pbr('velour_velvet', 1.4, 1.4, { color: 0xc8744a, noMap: true, normalScale: 1.4, fallback: 0xc0683f });
  const sofaBackM = pbr('velour_velvet', 1.4, 1.4, { color: 0xa95a35, noMap: true, normalScale: 1.4, fallback: 0xa9552f });
  blob(g, L.x, 0, L.z, 7.6, 7.6);
  addMesh(g, sector(2.35, 3.05, 0.36), sofaM, L.x, 0.06, L.z);
  addMesh(g, sector(3.05, 3.38, 0.82), sofaBackM, L.x, 0.06, L.z);
  addMesh(g, sector(2.4, 3.3, 0.04, 0.02), std(0x2a2522), L.x, 0.0, L.z);
  // 쿠션
  for (let i = 0; i < 9; i++) {
    const a = a0 + 0.3 + (i / 8) * (a1 - a0 - 0.6) + rand(-0.08, 0.08);
    const r = 2.95;
    if (i % 2 === 0 && addModel(g, 'throw_pillows_01_1k', 0.42, L.x + Math.cos(a) * (r - 0.05), 0.44, L.z - Math.sin(a) * (r - 0.05), faceTo(-Math.cos(a), Math.sin(a)))) continue;
    addBox(g, 0.44, 0.4, 0.14, fabric(pick([0xf4e6cf, 0xf2b84b, 0x3e7c74, 0xe9d3b8])), L.x + Math.cos(a) * r, 0.68, L.z - Math.sin(a) * r, { ry: faceTo(-Math.cos(a), Math.sin(a)), rx: -0.2 });
  }
  // 커피 테이블
  addCyl(g, 1.05, 0.07, pbr('walnut_veneer', 2, 2, { rough: 0.45, fallback: 0x7b4a2c }), L.x, 0.4, L.z);
  addModel(g, 'rubber_duck_toy_1k', 0.12, L.x - 0.6, 0.435, L.z + 0.35, 2.2);
  for (let i = 0; i < 3; i++) addModel(g, 'food_apple_01_1k', 0.08, L.x + 0.55 + i * 0.1, 0.435, L.z - 0.45 + (i % 2) * 0.1, rand(0, 6));
  addCyl(g, 0.45, 0.36, std(0x5e3820), L.x, 0.18, L.z);
  // 피자 & 간식 & 머그
  addBox(g, 0.5, 0.04, 0.5, std(0xe8d3b0), L.x + 0.2, 0.455, L.z + 0.1, { ry: 0.3 });
  addCyl(g, 0.22, 0.015, new THREE.MeshStandardMaterial({ map: TEX.pizza }), L.x + 0.2, 0.484, L.z + 0.1);
  addMesh(g, new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xf4efe6, { side: THREE.DoubleSide }), L.x - 0.45, 0.62, L.z - 0.3);
  for (let i = 0; i < 6; i++) addSph(g, 0.05, std(0xf2c14e), L.x - 0.45 + rand(-0.1, 0.1), 0.6, L.z - 0.3 + rand(-0.1, 0.1));
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.4;
    addCyl(g, 0.045, 0.1, std(pick([0xffffff, 0xe8774a, 0x6aa7a0, 0xf2b84b])), L.x + Math.cos(a) * 0.82, 0.49, L.z + Math.sin(a) * 0.82);
  }
  addBox(g, 0.35, 0.05, 0.25, std(0x2f6fd6), L.x - 0.2, 0.46, L.z + 0.6, { ry: 0.8 });
  // 쇼파 충돌체 (입구 틈은 비워 둠) + 둘러앉는 좌석
  {
    const n = Math.ceil((2.87 * (a1 - a0)) / 0.55);
    for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (a1 - a0); colCircle(L.x + Math.cos(a) * 2.88, L.z - Math.sin(a) * 2.88, 0.56); }
    colCircle(L.x, L.z, 1.12);
    const sitN = 10;
    for (let i = 0; i < sitN; i++) {
      const a = a0 + 0.3 + (i / (sitN - 1)) * (a1 - a0 - 0.6);
      addSeat('lounge', L.x + Math.cos(a) * 2.78, L.z - Math.sin(a) * 2.78, faceTo(-Math.cos(a), Math.sin(a)), { h: 0.43, ex: L.x + Math.cos(a) * 1.75, ez: L.z - Math.sin(a) * 1.75 });
    }
  }
  // 빈백 + 사람
  addMesh(g, SPH, pbr('velour_velvet', 2, 2, { color: 0xf0bf55, noMap: true }), L.x + 4.9, 0.32, L.z + 0.4, 0.6, 0.38, 0.6);
  blob(g, L.x + 4.9, 0, L.z + 0.4, 1.5, 1.5);
  addModel(g, 'Ottoman_01_2k', 0.42, L.x + 4.4, 0, L.z + 2.2, 0.4);
  colCircle(L.x + 4.9, L.z + 0.4, 0.55);
  colCircle(L.x + 4.4, L.z + 2.2, 0.38);
  addSeat('bean', L.x + 4.9, L.z + 0.4, faceTo(-1, -0.2), { h: 0.4, ex: L.x + 3.9, ez: L.z + 0.2 });
  zones.loungeCenter = L;
  // 링 펜던트
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 10, 64), glow(0xffd59a));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(L.x, 3.4, L.z);
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    addCyl(g, 0.006, CEIL - 3.4, std(0x222222), L.x + Math.cos(a) * 1.5, (CEIL + 3.4) / 2, L.z + Math.sin(a) * 1.5);
  }
  const loungeLight = new THREE.PointLight(0xffb36b, 45, 14, 1.5);
  loungeLight.position.set(L.x, 3.2, L.z);
  g.add(loungeLight);
  // 전구 줄조명
  const bulbs = [];
  const lines = [[[3, -1], [19.5, -1]], [[3, -5], [19.5, -5]], [[3, -12], [19.5, -12]], [[3, -1], [19.5, -15]], [[19.5, -1], [3, -15]]];
  lines.forEach(([[x0, z0], [x1, z1]]) => {
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      bulbs.push([x0 + (x1 - x0) * t, CEIL - 0.1 - Math.sin(t * Math.PI) * 0.7 - Math.abs(Math.sin(t * Math.PI * 4)) * 0.12, z0 + (z1 - z0) * t]);
    }
  });
  const bulbIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), bulbs.length);
  bulbs.forEach(([x, y, z], i) => {
    bulbIM.setMatrixAt(i, m4.makeTranslation(x, y, z));
    bulbIM.setColorAt(i, col.set(pick([0xffd59a, 0xffc070, 0xffe6b8, 0xff9f6b])));
  });
  g.add(bulbIM);
  // 주방 카운터
  const kit = new THREE.Group();
  kit.position.set(19.2, 0, -8);
  g.add(kit);
  addBox(kit, 0.75, 0.9, 9, std(0xf1ece3), 0, 0.45, 0);
  colBox(19.2, -8, 0.85, 9.15);
  colBox(19.2, -13.9, 0.9, 0.85);
  addBox(kit, 0.8, 0.05, 9.1, std(0x8a5a3a, { roughness: 0.4 }), 0, 0.92, 0);
  addBox(kit, 0.4, 0.04, 8, std(0x8a5a3a), 0.2, 2.1, 0);
  addBox(kit, 0.4, 0.04, 8, std(0x8a5a3a), 0.2, 2.6, 0);
  for (let z = -3.8; z < 3.8; z += 0.32) {
    if (Math.random() < 0.7) addCyl(kit, 0.07, rand(0.14, 0.26), std(pick([0xf4efe6, 0xe8774a, 0xf2b84b, 0x6aa7a0, 0xc9a46a])), 0.2, 2.22, z);
    if (Math.random() < 0.6) addCyl(kit, 0.06, 0.12, std(pick([0xffffff, 0xd65d6c, 0x5d8fd6])), 0.2, 2.68, z);
  }
  addBox(kit, 0.4, 0.5, 0.36, std(0x2b2b2f, { metalness: 0.6, roughness: 0.3 }), 0, 1.2, 3);
  addBox(kit, 0.02, 0.06, 0.06, glow(0xff4d3d), -0.21, 1.35, 2.9);
  addBox(kit, 0.45, 0.32, 0.6, std(0xe7e3dc), 0, 1.11, -1);
  addBox(kit, 0.02, 0.22, 0.36, std(0x1c1c20), -0.23, 1.11, -1.05);
  addMesh(kit, new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xf4efe6, { side: THREE.DoubleSide }), 0, 1.15, 1.2);
  for (let i = 0; i < 5; i++) if (!addModel(kit, 'food_apple_01_1k', 0.08, rand(-0.1, 0.1), 1.0 + (i > 2 ? 0.06 : 0), 1.2 + rand(-0.1, 0.1), rand(0, 6))) addSph(kit, 0.07, std(0xe74c3c), rand(-0.1, 0.1), 1.0, 1.2 + rand(-0.1, 0.1));
  for (const z of [-3, 0, 3]) addModel(kit, 'modern_ceiling_lamp_01_2k', 0.9, -0.6, CEIL - 0.9, z);
  addBox(g, 0.85, 2.0, 0.8, std(0x9fd3c7, { roughness: 0.4 }), 19.2, 1.0, -13.9);
  addBox(g, 0.04, 0.6, 0.04, std(0xdddddd, { metalness: 0.8 }), 18.75, 1.2, -13.6);
  // 탁구대
  const pp = new THREE.Group();
  pp.position.set(9.5, 0, -2.8);
  g.add(pp);
  addBox(pp, 2.74, 0.05, 1.525, std(0x1f6e5c, { roughness: 0.5 }), 0, 0.76, 0);
  addBox(pp, 2.74, 0.006, 0.02, glow(0xffffff), 0, 0.786, 0);
  for (const sx of [-1, 1]) addBox(pp, 0.02, 0.006, 1.525, glow(0xffffff), sx * 1.36, 0.786, 0);
  addBox(pp, 0.02, 0.15, 1.7, std(0xf4f4f4, { transparent: true, opacity: 0.8 }), 0, 0.86, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addBox(pp, 0.05, 0.74, 0.05, std(0x2b2b2f), sx * 1.2, 0.37, sz * 0.65);
  pingpong.ball = addSph(pp, 0.03, glow(0xfff2dc), 0, 1, 0);
  colBox(9.5, -2.8, 2.85, 1.65);
  pingpong.seats = [
    addSeat('pp', 9.5 - 1.85, -2.8, Math.PI / 2, { h: 0, ex: 9.5 - 2.4, ez: -2.8 }),
    addSeat('pp', 9.5 + 1.85, -2.8, -Math.PI / 2, { h: 0, ex: 9.5 + 2.4, ez: -2.8 }),
  ];
  makePlant(g, 19.2, -1.0, 1.3);
  // 네온사인
  plaque(g, '휴게실', 11.5, 2.9, -15.92, 0, { h: 0.6, style: 'glass', accent: '#e0703c', color: '#6a2e14' });

  /* ---------- 수면실 ---------- */
  const wood = pbr('oak_veneer_01', 1, 1, { color: 0xc08a5c, rough: 0.6, fallback: 0xb07a4a });
  const frost = new THREE.MeshStandardMaterial({ color: 0xcfc0ad, transparent: true, opacity: 0.72, roughness: 1, side: THREE.DoubleSide, depthWrite: false });
  // z=-16 칸막이 (문 x 2.5~4.6)
  addBox(g, 15.4, 1.1, 0.12, wood, 12.3, 0.55, -16);
  colBox(12.3, -16, 15.4, 0.2);
  colBox(2.5, -23, 0.2, 14.1);
  const fw = addWallPlane(g, 15.4, CEIL - 1.1, frost, 12.3, 1.1 + (CEIL - 1.1) / 2, -16);
  fw.renderOrder = 1;
  addBox(g, 2.1, CEIL - 2.6, 0.12, wood, 3.55, 2.6 + (CEIL - 2.6) / 2, -16);
  plaque(g, '수면실', 3.55, 3.15, -15.9, 0);
  // x=2.5 칸막이
  addBox(g, 0.12, 1.1, 14, wood, 2.5, 0.55, -23);
  const fw2 = addWallPlane(g, 14, CEIL - 1.1, frost, 2.5, 1.1 + (CEIL - 1.1) / 2, -23, Math.PI / 2);
  fw2.renderOrder = 1;
  // 침대
  const blankets = [0x9bbf6a, 0xf2b84b, 0xe8907a, 0xb9a6d9];
  const LINEN = pbr('rough_linen', 1, 1, { color: 0xfbf6ee, noMap: true, fallback: 0xfbf7f0 });
  [6.2, 9.6, 13.0, 16.4].forEach((x, i) => {
    const b = new THREE.Group();
    b.position.set(x, 0, -28.5);
    g.add(b);
    addBox(b, 1.3, 1.1, 0.08, wood, 0, 0.55, -1.12);
    addBox(b, 1.2, 0.3, 2.1, wood, 0, 0.15, 0);
    addBox(b, 1.12, 0.2, 2.02, LINEN, 0, 0.4, 0);
    addBox(b, 0.7, 0.12, 0.36, LINEN, 0, 0.56, -0.75);
    blob(b, 0, 0, 0, 1.8, 2.8);
    addBox(b, 1.16, 0.08, 1.2, pbr('rough_linen', 2, 2, { color: blankets[i] }), 0, 0.54, 0.4);
    colBox(x, -28.5, 1.3, 2.2);
    addSeat('bed', x, -28.5, 0, { h: 0.5, ex: x, ez: -26.9 });
    // 협탁 & 무드등
    if (i < 3) {
      addBox(g, 0.45, 0.5, 0.45, wood, x + 1.7, 0.25, -29.3);
      colBox(x + 1.7, -28.6, 0.12, 2.6);
      addCyl(g, 0.05, 0.25, std(0xc9a46a, { metalness: 0.6 }), x + 1.7, 0.62, -29.3);
      addSph(g, 0.15, MOON_LAMP, x + 1.7, 0.84, -29.3);
      addModel(g, 'alarm_clock_01_2k', 0.12, x + 1.55, 0.5, -29.1, 0.4);
    }
    // 커튼
    if (i < 3) {
      const c = addWallPlane(g, 2.3, 2.4, pbr('rough_linen', 2, 2, { color: 0xf1e4d2, side: THREE.DoubleSide, noMap: true }), x + 1.7, 1.2 + 0.4, -28.1, Math.PI / 2);
      c.renderOrder = 1;
      addCyl(g, 0.015, 2.4, std(0x8a8f96), x + 1.7, 2.82, -28.1, { rx: Math.PI / 2 });
    }
  });
  // 러그 + 리클라이너 + 쿠션
  addMesh(g, new THREE.CircleGeometry(2.6, 40), std(0xb9a6d9, { roughness: 1 }), 14.2, 0.012, -22.2, 1, 1, 1, { rx: -Math.PI / 2 });
  [[12.8, -21.8, 0.5], [16.4, -21.6, -0.4]].forEach(([x, z, ry], i) => {
    const r = new THREE.Group();
    r.position.set(x, 0, z);
    r.rotation.y = ry;
    g.add(r);
    const rm = pbr('velour_velvet', 1, 1, { color: i ? 0x6aa7a0 : 0xe8907a, noMap: true });
    addBox(r, 0.75, 0.3, 1.1, std(0x5a4232), 0, 0.15, 0);
    addBox(r, 0.75, 0.16, 0.9, rm, 0, 0.38, 0.2, { rx: -0.15 });
    addBox(r, 0.75, 0.9, 0.18, rm, 0, 0.75, -0.45, { rx: -0.55 });
    addBox(r, 0.75, 0.14, 0.5, rm, 0, 0.32, 0.78, { rx: 0.25 });
    colBox(x, z, 0.8, 1.2, ry);
    addSeat('recline', x, z, ry, { h: 0.42, ex: x + Math.cos(ry) * 0.9, ez: z - Math.sin(ry) * 0.9 });
  });
  for (let i = 0; i < 4; i++) addMesh(g, SPH, std(pick([0xf2b84b, 0xe8907a, 0xf4e6cf, 0x9bbf6a]), { roughness: 1 }), 14.4 + rand(-1, 1), 0.12, -23.4 + rand(-0.5, 0.5), 0.38, 0.12, 0.38);
  // 책 읽는 사람 (빈백)
  addMesh(g, SPH, pbr('velour_velvet', 2, 2, { color: 0x6aa7a0, noMap: true }), 4.6, 0.3, -24.6, 0.6, 0.36, 0.6);
  colCircle(4.6, -24.6, 0.5);
  addSeat('bean', 4.6, -24.6, faceTo(1, 0.4), { h: 0.38, ex: 5.6, ez: -24.2 });
  makePlant(g, 19.2, -17, 1.0);
  makePlant(g, 3.3, -29.2, 0.9);
  // 별빛 천장
  const sn = 260;
  const sp = new Float32Array(sn * 3);
  for (let i = 0; i < sn; i++) { sp[i * 3] = rand(2.8, 19.7); sp[i * 3 + 1] = CEIL - 0.07; sp[i * 3 + 2] = rand(-29.7, -16.3); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  stars.mat = new THREE.PointsMaterial({ color: 0xfff2c8, size: 0.06, transparent: true, toneMapped: false });
  g.add(new THREE.Points(sg, stars.mat));
  addPlane(g, 17.4, 13.9, new THREE.MeshBasicMaterial({ color: 0x2c2f52, side: THREE.DoubleSide }), 11.25, CEIL - 0.03, -23).rotation.x = Math.PI / 2;
  const napLight = new THREE.PointLight(0xffb27a, 6.5, 11, 1.6);
  napLight.position.set(11, 3, -23.5);
  g.add(napLight);
  /* 은은한 무드등: 종이 등 펜던트 · 플로어 스탠드 · 침대 밑 간접등 */
  const lantern = new THREE.MeshStandardMaterial({ color: 0xfff1dc, emissive: 0xffc98a, emissiveIntensity: 0.75, roughness: 0.9 });
  for (const [x, z, r] of [[7.2, -21.5, 0.32], [11.2, -24.2, 0.4], [15.4, -21.5, 0.32]]) {
    addCyl(g, 0.006, CEIL - 2.75 - r, std(0x3a3030), x, (CEIL + 2.75 + r) / 2, z);
    addMesh(g, SPH, lantern, x, 2.75, z, r, r * 0.9, r);
    for (let k = -2; k <= 2; k++) addMesh(g, new THREE.TorusGeometry(1, 0.012, 4, 32), std(0xe8d6bc, { roughness: 0.9 }), x, 2.75 + k * r * 0.33, z, r * Math.cos(k * 0.33) * 1.0, r * Math.cos(k * 0.33), r * Math.cos(k * 0.33) * 1.0, { rx: Math.PI / 2 });
  }
  const shade = new THREE.MeshStandardMaterial({ color: 0xf6e2c4, emissive: 0xffb870, emissiveIntensity: 0.6, roughness: 0.9, side: THREE.DoubleSide });
  for (const [x, z] of [[19.25, -25.0], [3.2, -21.2]]) {
    addCyl(g, 0.16, 0.03, std(0x3a3030), x, 0.015, z);
    addCyl(g, 0.018, 1.45, std(0xc9a46a, { metalness: 0.6, roughness: 0.4 }), x, 0.74, z);
    addMesh(g, new THREE.CylinderGeometry(0.2, 0.27, 0.34, 24, 1, true), shade, x, 1.55, z);
    addSph(g, 0.06, glow(0xffd8a0), x, 1.52, z);
    colCircle(x, z, 0.2);
    if (!LOW) {
      const l = new THREE.PointLight(0xffb070, 3.2, 6, 1.6);
      l.position.set(x, 1.5, z);
      g.add(l);
    }
  }
  // 침대 아래·벽 따라 번지는 따뜻한 빛 웅덩이
  const pool = new THREE.MeshBasicMaterial({ map: BLOB_TEX, color: 0xffa860, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  for (const x of [6.2, 9.6, 13.0, 16.4]) { const m = addMesh(g, BLOB_GEO, pool, x, 0.015, -27.3, 1.8, 1, 0.9); m.renderOrder = 1; }
  for (const [x, z] of [[19.25, -25.0], [3.2, -21.2]]) { const m = addMesh(g, BLOB_GEO, pool, x, 0.016, z, 2.4, 1, 2.4); m.renderOrder = 1; }

}

/* =========================================================================
   길고양이 — 시계로 계산되는 일정이라 모든 접속자에게 같은 곳에 보여요
   ========================================================================= */
const CAT_COATS = [
  { name: '치즈', base: 0xe9a35a, stripe: '#c9772f', belly: 0xfbecd6, eye: 0x9ac23c },
  { name: '고등어', base: 0x8a8a86, stripe: '#4a4a48', belly: 0xe8e4da, eye: 0xc8b23a },
  { name: '까망', base: 0x26221f, belly: 0x26221f, socks: 0xf4efe6, eye: 0xd8b02a },
  { name: '하양', base: 0xf6f2ea, belly: 0xffffff, eye: 0x6fb2e0 },
  { name: '삼색', base: 0xf6f0e4, belly: 0xffffff, patches: [0xd98a3a, 0x2a2420], eye: 0xb8a03a },
  { name: '턱시도', base: 0x1f1c1a, belly: 0xf6f2ea, socks: 0xf6f2ea, eye: 0x8fc23c },
  { name: '갈색 줄무늬', base: 0xa0764e, stripe: '#5e3f25', belly: 0xf0dcc0, eye: 0x9ac23c },
];
// 영역(길 위 1차원 경로): [x0, x1, z]
const CAT_ROUTES = [[-40, -6, 1.2], [6, 40, 1.4], [-34, 8, 13.4], [14, 52, 16.6], [-62, -24, 28.7], [-18, 20, 28.7], [24, 62, 28.7]];
const cats = [];
function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function stripeTex(col, base) {
  return canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = '#' + new THREE.Color(base).getHexString(); c.fillRect(0, 0, w, h);
    c.strokeStyle = col; c.lineCap = 'round';
    for (let x = 6; x < w; x += 14) { c.lineWidth = rand(4, 7); c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + rand(-6, 6), h / 2, x + rand(-4, 4), h * 0.78); c.stroke(); }
  });
}
function makeCat(i) {
  const coat = CAT_COATS[i % CAT_COATS.length];
  const g = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: coat.stripe ? 0xffffff : coat.base, map: coat.stripe ? stripeTex(coat.stripe, coat.base) : null, roughness: 0.95, normalMap: coat.stripe ? fabricNor : null });
  if (fabricNor && coat.stripe) fur.normalScale.set(0.6, 0.6);
  const furPlain = std(coat.base, { roughness: 0.95 });
  const belly = std(coat.belly, { roughness: 0.95 });
  const pink = std(0xf2a0a8, { roughness: 0.6 });
  // 몸통 피벗(엉덩이 기준) → 앉기·웅크리기
  const hip = new THREE.Group(); hip.position.set(0, 0.16, -0.12); g.add(hip);
  const body = new THREE.Group(); body.position.set(0, 0.04, 0.12); hip.add(body);
  const torso = addMesh(body, new THREE.CapsuleGeometry(0.1, 0.24, 6, 14), fur, 0, 0, 0, 1, 0.92, 1, { rx: Math.PI / 2 });
  addMesh(body, SPH, belly, 0, -0.04, 0.08, 0.075, 0.07, 0.1);
  if (coat.patches) coat.patches.forEach((pc, k) => addMesh(body, SPH, std(pc, { roughness: 0.95 }), (k ? -0.05 : 0.04), 0.06, k ? -0.07 : 0.05, 0.075, 0.05, 0.09));
  // 머리
  const head = new THREE.Group(); head.position.set(0, 0.1, 0.2); body.add(head);
  addMesh(head, SPH, furPlain, 0, 0, 0, 0.105, 0.095, 0.095);
  if (coat.stripe) addMesh(head, SPH, fur, 0, 0.02, -0.01, 0.1, 0.085, 0.09);
  addMesh(head, SPH, belly, 0, -0.03, 0.07, 0.055, 0.038, 0.04);
  addMesh(head, SPH, pink, 0, -0.008, 0.096, 0.012, 0.009, 0.008);
  for (const sx of [-1, 1]) {
    const ear = addMesh(head, new THREE.ConeGeometry(0.04, 0.075, 4), furPlain, sx * 0.058, 0.085, -0.005, 1, 1, 0.55, { rz: -sx * 0.25, ry: Math.PI / 4 });
    void ear;
    addMesh(head, new THREE.ConeGeometry(0.024, 0.05, 4), pink, sx * 0.056, 0.08, 0.006, 1, 1, 0.4, { rz: -sx * 0.25, ry: Math.PI / 4 });
    for (const wy of [-0.02, -0.035]) addBox(head, 0.09, 0.0018, 0.0018, std(0xf4f4f0), sx * 0.075, wy, 0.075, { rz: sx * (wy + 0.03) * 6, ry: -sx * 0.25 });
  }
  const eyesOpen = new THREE.Group(), eyesShut = new THREE.Group();
  head.add(eyesOpen, eyesShut);
  const irisM = new THREE.MeshPhysicalMaterial({ color: coat.eye, roughness: 0.1, clearcoat: 1 });
  for (const sx of [-1, 1]) {
    addMesh(eyesOpen, SPH, irisM, sx * 0.04, 0.018, 0.078, 0.022, 0.024, 0.014);
    addMesh(eyesOpen, SPH, std(0x0d0a08), sx * 0.04, 0.018, 0.09, 0.007, 0.019, 0.006);
    addMesh(eyesOpen, SPH, SHINE_MAT, sx * 0.04 + 0.007, 0.028, 0.094, 0.005, 0.005, 0.004);
    const arc = addMesh(eyesShut, GEO.arc, MOUTH_MAT, sx * 0.04, 0.018, 0.088, 0.5, 0.35, 0.4);
    arc.rotation.z = Math.PI;
  }
  eyesShut.visible = false;
  // 다리 (어깨/엉덩이 피벗)
  const legs = [];
  for (const [lx, lz, front] of [[-0.05, 0.13, 1], [0.05, 0.13, 1], [-0.055, -0.11, 0], [0.055, -0.11, 0]]) {
    const piv = new THREE.Group(); piv.position.set(lx, -0.02, lz); body.add(piv);
    addMesh(piv, new THREE.CapsuleGeometry(0.026, 0.1, 3, 8), furPlain, 0, -0.07, 0);
    addMesh(piv, SPH, coat.socks ? std(coat.socks) : furPlain, 0, -0.13, 0.008, 0.03, 0.022, 0.036);
    piv.userData.front = front;
    legs.push(piv);
  }
  // 꼬리 (관절 사슬)
  const tail = [];
  let parent = body;
  const tailGeo = new THREE.CapsuleGeometry(0.022, 0.05, 3, 8);
  for (let k = 0; k < 6; k++) {
    const piv = new THREE.Group();
    piv.position.set(0, k ? 0.068 : 0.03, k ? 0 : -0.2);
    if (!k) piv.rotation.x = -2.2;
    parent.add(piv);
    addMesh(piv, tailGeo, k % 2 && coat.stripe ? fur : furPlain, 0, 0.034, 0, 1 - k * 0.06, 1, 1 - k * 0.06);
    tail.push(piv);
    parent = piv;
  }
  g.traverse((m) => { if (m.isMesh) { m.castShadow = !LOW; m.userData.cat = i; } });
  const sh = blob(g, 0, 0.0, 0, 0.5, 0.65);
  sh.castShadow = false;
  street.add(g);
  const r = CAT_ROUTES[i % CAT_ROUTES.length];
  const C = { i, g, hip, body, head, legs, tail, eyesOpen, eyesShut, route: r, x: (r[0] + r[1]) / 2, z: r[2], ry: 0, mode: 'walk', petT: 0, phase: rand(0, 10), walkPh: 0, hearts: [] };
  cats.push(C);
  return C;
}
const CAT_BLOCK = 28; // 초
function catPlan(C, T) {
  // 각 블록 시작점은 해시로 정해진 경로 위 한 점, 걷는 블록이면 다음 점까지 이동
  const [x0, x1] = C.route;
  const b = Math.floor(T / CAT_BLOCK), f = T / CAT_BLOCK - b;
  const P = (n) => x0 + 1 + hash(C.i + 11, n) * (x1 - x0 - 2);
  const r = hash(C.i + 101, b);
  const pa = P(b), pb = P(b + 1);
  if (r < 0.5) {
    const dist = Math.abs(pb - pa), dur = Math.min(0.9, dist / 0.45 / CAT_BLOCK);
    if (f < dur) return { x: pa + (pb - pa) * (f / dur), mode: 'walk', dir: Math.sign(pb - pa) };
    return { x: pb, mode: 'sit', dir: Math.sign(pb - pa) };
  }
  // 쉬는 블록은 이전 블록 끝점(=P(b))에서: 웅크리기 / 그루밍 / 잠
  return { x: pa, mode: r < 0.67 ? 'loaf' : r < 0.84 ? 'groom' : 'sleep', dir: hash(C.i + 7, b) < 0.5 ? 1 : -1 };
}
function buildCats() { for (let i = 0; i < CAT_ROUTES.length; i++) makeCat(i); }
function nearestCat(A, max = 1.25) {
  let best = null, bd = max;
  for (const C of cats) { const d = Math.hypot(A.x - C.x, A.z - C.z); if (d < bd) { bd = d; best = C; } }
  return best;
}
const HEART_TEX = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.font = '48px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💕', 32, 36); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
function petCat(C, local) {
  C.petT = 4.5;
  if (local) audio.meow();
  for (let k = 0; k < 3; k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: HEART_TEX, transparent: true, depthWrite: false }));
    sp.scale.set(0.16, 0.16, 1);
    sp.userData = { t: -k * 0.45, x: rand(-0.12, 0.12) };
    sp.visible = false;
    C.g.add(sp);
    C.hearts.push(sp);
  }
}
const SERVER_T0 = 1730000000; // 기준 시각(초) — 모두 같은 일정을 보도록
function updateCats(t, dt) {
  const T = Date.now() / 1000 - SERVER_T0;
  for (const C of cats) {
    const plan = catPlan(C, T);
    const ph = t + C.phase;
    let mode = plan.mode;
    if (C.petT > 0) { C.petT -= dt; mode = mode === 'walk' || mode === 'sit' ? 'pet-sit' : 'pet-' + mode; }
    else {
      const k = Math.min(1, dt * 3);
      C.x += (plan.x - C.x) * k;
    }
    const z = C.route[2] + Math.sin(C.x * 0.6 + C.i) * 0.35;
    C.z += (z - C.z) * Math.min(1, dt * 3);
    const wantR = plan.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    let dr = wantR - C.ry; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    C.ry += dr * Math.min(1, dt * 4);
    C.g.position.set(C.x, 0.152, C.z);
    C.g.rotation.y = C.ry + (mode === 'walk' ? Math.sin(C.x * 0.6 + C.i) * 0.25 : 0);
    // 자세
    const base = mode.replace('pet-', '');
    const sitting = base === 'sit' || base === 'groom';
    const low = base === 'loaf' || base === 'sleep';
    C.hip.rotation.x += ((sitting ? -0.75 : 0) - C.hip.rotation.x) * Math.min(1, dt * 6);
    C.hip.position.y += ((low ? 0.08 : 0.16) - C.hip.position.y) * Math.min(1, dt * 6);
    const sleepy = base === 'sleep' || mode.startsWith('pet');
    C.eyesOpen.visible = !sleepy; C.eyesShut.visible = sleepy;
    if (mode === 'walk') {
      C.walkPh += dt * 9;
      C.legs.forEach((l, k) => { l.rotation.x = Math.sin(C.walkPh + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.55; l.scale.y = 1; });
    } else {
      C.legs.forEach((l) => {
        const front = l.userData.front;
        l.rotation.x = sitting ? (front ? 0.75 : -0.8) : 0;
        l.scale.y = low ? 0.25 : sitting && front ? 1.55 : 1;
      });
    }
    // 머리
    if (base === 'groom') {
      const fl = C.legs[1];
      fl.rotation.x = 0.75 - 1.9; fl.scale.y = 1.2;
      C.head.rotation.set(0.55 + Math.sin(ph * 7) * 0.12, -0.35, 0.15);
    } else if (base === 'sleep') C.head.rotation.set(0.35, 0.6, 0.35);
    else if (mode.startsWith('pet')) C.head.rotation.set(-0.35 + Math.sin(ph * 2) * 0.08, Math.sin(ph * 1.5) * 0.25, 0.25);
    else C.head.rotation.set(Math.sin(ph * 0.7) * 0.08, Math.sin(ph * 0.4) * 0.45, 0);
    C.head.position.y = sitting ? 0.13 : 0.1;
    // 꼬리
    C.tail.forEach((s, k) => {
      if (!k) { s.rotation.x = mode === 'walk' ? -0.55 : low ? -1.6 : -1.75; s.rotation.z = 0; return; }
      const sway = Math.sin(ph * (mode.startsWith('pet') ? 2 : 3) - k * 0.7) * (low ? 0.12 : 0.25);
      s.rotation.x = mode === 'walk' ? (k > 3 ? 0.35 : 0.05) : 0.1;
      s.rotation.z = low ? 0.35 + sway * 0.3 : sway;
    });
    // 숨쉬기
    C.body.scale.y = 1 + Math.sin(ph * (base === 'sleep' ? 1.6 : 2.6)) * 0.02;
    // 하트
    for (let k = C.hearts.length - 1; k >= 0; k--) {
      const sp = C.hearts[k];
      sp.userData.t += dt;
      const u = sp.userData.t;
      sp.visible = u > 0;
      if (u > 0) { sp.position.set(sp.userData.x + Math.sin(u * 4) * 0.04, 0.45 + u * 0.45, 0); sp.material.opacity = clamp(1.6 - u, 0, 1); }
      if (u > 1.6 || (C.petT <= 0 && u > 0)) { if (u > 1.6) { C.g.remove(sp); sp.material.dispose(); C.hearts.splice(k, 1); } }
    }
    if (C.petT > 0 && C.hearts.length < 2 && Math.random() < dt * 2) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: HEART_TEX, transparent: true, depthWrite: false }));
      sp.scale.set(0.16, 0.16, 1); sp.userData = { t: 0, x: rand(-0.12, 0.12) }; C.g.add(sp); C.hearts.push(sp);
    }
  }
}

/* =========================================================================
   불만창고 — 로비 구석의 은밀하고 반짝이는 스트레스 해소 공간
   (x -19.65 ~ -13.2, z -0.35 ~ -5.8 · 입구는 동쪽 벽 z -4.3 ~ -5.5)
   ========================================================================= */
const VENT = { x0: -19.65, x1: -13.2, z0: -5.8, z1: -0.35, ceil: 3.4 };
const inVent = (x, z) => x > VENT.x0 && x < VENT.x1 && z > VENT.z0 && z < VENT.z1;
const vent = { flames: [], fireLight: null, roomLight: null, boost: 0, embers: null, sparks: null, sparkles: [], fireWorld: new THREE.Vector3(-19.1, 0.55, -3.0) };
function sparkleTex() {
  return canvasTex(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,235,200,.8)'); g.addColorStop(1, 'rgba(255,200,160,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    c.fillStyle = 'rgba(255,255,255,.95)';
    c.beginPath(); c.moveTo(32, 0); c.lineTo(35, 29); c.lineTo(64, 32); c.lineTo(35, 35); c.lineTo(32, 64); c.lineTo(29, 35); c.lineTo(0, 32); c.lineTo(29, 29); c.closePath(); c.fill();
  });
}
function flameTex() {
  return canvasTex(64, 128, (c, w, h) => {
    const g = c.createRadialGradient(32, 96, 2, 32, 80, 60);
    g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.25, 'rgba(255,210,90,.95)'); g.addColorStop(0.55, 'rgba(255,110,30,.7)'); g.addColorStop(1, 'rgba(200,40,0,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(32, 4); c.bezierCurveTo(52, 40, 62, 80, 50, 110); c.quadraticCurveTo(32, 126, 14, 110); c.bezierCurveTo(2, 80, 12, 40, 32, 4); c.fill();
  });
}
function wallpaperTex() {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#f7dcd2'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 14, h);
    const heart = (x, y, s, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * 0.35); c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.35); c.bezierCurveTo(x - s * 0.5, y + s * 0.65, x, y + s * 0.8, x, y + s); c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.65, x + s * 0.5, y + s * 0.35); c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.35); c.fill(); };
    const star = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); };
    for (let y = 16; y < h; y += 64) for (let x = 16; x < w; x += 64) { heart(x + ((y / 64) % 2) * 32, y, 18, '#f08c94'); star(x + 32 - ((y / 64) % 2) * 32, y + 34, 8, '#f6c453'); }
  });
}
function makeBear(parent, x, y, z, s, ry, col = 0xb07a4e) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s);
  parent.add(g);
  const fur = fabric(col, 1), light = fabric(0xf0d4b0, 1), dark = std(0x221815, { roughness: 0.3 });
  addMesh(g, SPH, fur, 0, 0.36, 0, 0.32, 0.36, 0.28);
  addMesh(g, SPH, light, 0, 0.34, 0.2, 0.2, 0.24, 0.1);
  addMesh(g, SPH, fur, 0, 0.86, 0, 0.27, 0.25, 0.25);
  addMesh(g, SPH, light, 0, 0.8, 0.21, 0.12, 0.09, 0.08);
  addMesh(g, SPH, dark, 0, 0.83, 0.29, 0.035, 0.028, 0.03);
  for (const sx of [-1, 1]) {
    addMesh(g, SPH, dark, sx * 0.09, 0.92, 0.22, 0.03, 0.035, 0.02);
    addMesh(g, SPH, SHINE_MAT, sx * 0.09 + 0.01, 0.935, 0.238, 0.01, 0.01, 0.01);
    addMesh(g, SPH, fur, sx * 0.19, 1.07, 0, 0.09, 0.09, 0.06);
    addMesh(g, SPH, light, sx * 0.19, 1.07, 0.04, 0.05, 0.05, 0.03);
    addMesh(g, SPH, fur, sx * 0.3, 0.42, 0.08, 0.1, 0.18, 0.1, { rz: sx * 0.5 });
    addMesh(g, SPH, fur, sx * 0.16, 0.11, 0.2, 0.12, 0.11, 0.2);
    addMesh(g, SPH, light, sx * 0.16, 0.11, 0.38, 0.07, 0.07, 0.02);
    addMesh(g, SPH, BLUSH_MAT, sx * 0.15, 0.82, 0.2, 0.04, 0.025, 0.01);
    addMesh(g, SPH, std(0xd84a5a), sx * 0.07, 0.66, 0.22, 0.07, 0.05, 0.035);
  }
  addMesh(g, SPH, std(0xd84a5a), 0, 0.66, 0.24, 0.03, 0.03, 0.03);
  blob(g, 0, 0, 0.05, 0.9, 0.9);
  return g;
}
function buildVentRoom() {
  const g = interior;
  const { x0, x1, z0, z1, ceil } = VENT;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, Dp = z1 - z0;
  const H = GF - 0.15;
  const paper = new THREE.MeshStandardMaterial({ map: tiled(wallpaperTex(), 2, 1.5), roughness: 0.9 });
  const trim = pbr('walnut_veneer', 2, 1, { rough: 0.5, fallback: 0x7b4a2c });
  // 벽 (안쪽 유리도 가려서 은밀하게)
  const wall = (w, d, x, z, mat = paper) => { addMesh(g, BOX, mat, x, H / 2, z, w, H, d); addBox(g, w + 0.02, 0.14, d + 0.02, trim, x, 0.07, z); colBox(x, z, w, d); };
  // 유리 쪽 면은 평범한 벽으로 — 밖에서는 안이 보이지 않아요
  const plain = std(0xd8cfc4, { roughness: 0.9 });
  wall(W, 0.15, cx, z1, [paper, paper, paper, paper, plain, paper]);   // 앞(유리 쪽)
  wall(0.15, Dp, x0, cz, [paper, plain, paper, paper, paper, paper]);  // 왼쪽(유리 쪽)
  wall(W + 0.15, 0.15, cx, z0, [paper, paper, paper, paper, paper, plain]); // 업무공간 쪽 (바깥면은 평범하게)
  wall(0.15, z1 - -4.3, x1, (z1 + -4.3) / 2);  // 입구 옆 벽
  wall(0.15, -5.5 - z0, x1, (-5.5 + z0) / 2);
  addBox(g, 0.15, H - 2.4, 1.2, paper, x1, 2.4 + (H - 2.4) / 2, -4.9);  // 입구 위 상인방
  // 입구 커튼 (반짝이 비즈)
  const curtain = new THREE.MeshStandardMaterial({ color: 0xf6a5c0, roughness: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, emissive: 0x8a3050, emissiveIntensity: 0.3 });
  for (let i = 0; i < 12; i++) addBox(g, 0.02, 2.3, 0.035, curtain, x1, 1.2, -4.35 - i * 0.1).renderOrder = 2;
  // 바깥 네온 간판
  plaque(g, '불만창고', x1 + 0.08, 2.9, -3.0, Math.PI / 2, { style: 'cute', h: 0.46 });
  // 낮은 별빛 천장
  addPlane(g, W, Dp, new THREE.MeshBasicMaterial({ color: 0x3a2346, side: THREE.DoubleSide }), cx, ceil, cz).rotation.x = Math.PI / 2;
  {
    const n = 120, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = rand(x0 + 0.2, x1 - 0.2); pos[i * 3 + 1] = ceil - 0.03; pos[i * 3 + 2] = rand(z0 + 0.2, z1 - 0.2); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xfff0c8, size: 0.07, transparent: true, toneMapped: false });
    g.add(new THREE.Points(sg, m)); vent.sparkles.push({ m, base: 0.85, ph: 0 });
  }
  // 바닥 러그 + 방석
  addMesh(g, new THREE.CircleGeometry(1.8, 48), fabric(0xf7b8c6, 1), -16.6, 0.013, -2.9, 1, 1, 1, { rx: -Math.PI / 2 });
  addMesh(g, new THREE.CircleGeometry(1.35, 48), fabric(0xfde3e8, 1), -16.6, 0.016, -2.9, 1, 1, 1, { rx: -Math.PI / 2 });
  for (const [x, z, c] of [[-17.4, -2.0, 0xf2b84b], [-15.8, -3.6, 0x9ad0c2], [-17.6, -3.9, 0xe8907a]]) addMesh(g, SPH, fabric(c, 1), x, 0.12, z, 0.34, 0.12, 0.34);

  /* 벽난로 (동쪽을 바라봄) */
  const fp = new THREE.Group();
  fp.position.set(x0 + 0.42, 0, -3.0);
  fp.rotation.y = Math.PI / 2;
  g.add(fp);
  const brick = pbr('red_brick_03', 1.2, 1, { color: 0xf0d6c8, fallback: 0xd8b8a8 });
  for (const sx of [-1, 1]) addBox(fp, 0.45, 1.4, 0.7, brick, sx * 0.775, 0.7, 0);
  addBox(fp, 1.1, 0.55, 0.7, brick, 0, 1.125, 0);
  addBox(fp, 1.1, 0.85, 0.1, std(0x140b08), 0, 0.425, -0.3);
  addBox(fp, 1.1, 0.04, 0.6, std(0x1d120d), 0, 0.02, -0.02);
  addBox(fp, 2.3, 0.1, 0.85, trim, 0, 1.45, 0.05);
  addBox(fp, 1.6, ceil - 1.5, 0.5, brick, 0, 1.5 + (ceil - 1.5) / 2, -0.1);
  addBox(fp, 2.4, 0.06, 0.9, std(0xc9b8a5), 0, 0.03, 0.45);
  const logM = pbr('rough_wood', 1, 1, { color: 0x6b4a33, fallback: 0x5a3a28 });
  for (const [x, rz] of [[-0.18, 0.15], [0.16, -0.12]]) addMesh(fp, CYL, logM, x, 0.1, 0.0, 0.07, 0.7, 0.07, { rz: Math.PI / 2 + rz, ry: 0.2 });
  addMesh(fp, CYL, logM, 0, 0.2, -0.05, 0.06, 0.6, 0.06, { rz: Math.PI / 2, ry: -0.5 });
  const ft = flameTex();
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.center.set(0.5, 0.05);
    sp.position.set(-0.32 + i * 0.13, 0.12, 0.05 + (i % 2) * 0.05);
    sp.userData = { base: rand(0.4, 0.62), ph: rand(0, 6) };
    fp.add(sp);
    vent.flames.push(sp);
  }
  {
    const n = 26, pos = new Float32Array(n * 3), vel = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = rand(-0.4, 0.4); pos[i * 3 + 1] = rand(0.1, 0.8); pos[i * 3 + 2] = rand(-0.1, 0.15); vel[i] = rand(0.3, 0.7); }
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const em = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xffb35a, size: 0.035, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    fp.add(em);
    vent.embers = { pos, vel, n, geo: eg };
  }
  vent.fireLight = new THREE.PointLight(0xff8a3d, 9, 7, 1.5);
  vent.fireLight.position.set(x0 + 1.0, 0.7, -3.0);
  g.add(vent.fireLight);
  // 벽난로 위: 작은 곰인형 · 촛불 · 문구
  makeBear(fp, -0.75, 1.5, 0.1, 0.28, 0, 0xe6b98a);
  makeBear(fp, 0.75, 1.5, 0.1, 0.24, 0, 0xc99a6a);
  for (const x of [-0.3, 0.3]) { addCyl(fp, 0.04, 0.16, std(0xfff4e2), x, 1.58, 0.15); addSph(fp, 0.03, glow(0xffc070), x, 1.69, 0.15); }
  textPlane(fp, '다 태워버려!', 1.4, 0.36, 0, 2.3, 0.16, 0, { color: '#ffe8c8', glow: '#ff7b3d', size: 110 });
  colBox(x0 + 0.42, -3.0, 0.8, 2.3);

  /* 큰 곰인형 (안아 줄 수 있어요) */
  makeBear(g, -19.0, 0, -0.95, 1.0, faceTo(1, -0.75));
  colCircle(-19.0, -0.95, 0.5);
  addSeat('bear', -18.3, -1.55, faceTo(-0.75, 0.65), { h: 0, ex: -17.8, ez: -2.05 });
  makeBear(g, -18.95, 0, -5.3, 0.62, faceTo(1, 0.8), 0xd9b48a);
  colCircle(-18.95, -5.3, 0.34);

  /* 스트레스 적는 책상 */
  const desk = new THREE.Group();
  desk.position.set(-14.7, 0, -1.15);
  g.add(desk);
  addBox(desk, 1.2, 0.05, 0.6, trim, 0, 0.72, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addBox(desk, 0.05, 0.7, 0.05, trim, sx * 0.55, 0.35, sz * 0.25);
  addBox(desk, 0.3, 0.006, 0.4, std(0xfffaf0), -0.05, 0.75, -0.03, { ry: 0.15 });
  addBox(desk, 0.3, 0.006, 0.4, std(0xffe7f0), 0.12, 0.753, -0.05, { ry: -0.2 });
  addCyl(desk, 0.008, 0.16, std(0xf2b84b), 0.25, 0.76, 0.05, { rz: Math.PI / 2, ry: 0.6 });
  addCyl(desk, 0.07, 0.12, std(0xe889a0, { roughness: 0.4 }), -0.42, 0.81, -0.12);
  for (let i = 0; i < 4; i++) addCyl(desk, 0.006, 0.18, std(pick([0xf2b84b, 0x6a9be0, 0xe06b7a])), -0.42 + rand(-0.03, 0.03), 0.9, -0.12 + rand(-0.03, 0.03));
  const paperGeo = new THREE.IcosahedronGeometry(0.06, 1);
  { const pa = paperGeo.attributes.position; for (let i = 0; i < pa.count; i++) { const k = rand(0.75, 1.15); pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k, pa.getZ(i) * k); } paperGeo.computeVertexNormals(); }
  vent.paperGeo = paperGeo;
  vent.paperMat = std(0xfffaf0, { roughness: 0.9, flatShading: true });
  addCyl(g, 0.22, 0.3, pbr('rough_wood', 1, 1, { color: 0xc89a6a }), -13.85, 0.15, -0.85);
  for (let i = 0; i < 4; i++) addMesh(g, paperGeo, vent.paperMat, -13.85 + rand(-0.1, 0.1), 0.32 + i * 0.03, -0.85 + rand(-0.1, 0.1));
  colBox(-14.7, -1.15, 1.25, 0.65);
  colCircle(-13.85, -0.85, 0.25);
  const chair = new THREE.Group();
  chair.position.set(-14.7, 0, -1.8);
  g.add(chair);
  addBox(chair, 0.46, 0.06, 0.44, fabric(0xf6a5c0, 0.9), 0, 0.46, 0);
  addBox(chair, 0.46, 0.5, 0.06, fabric(0xf6a5c0, 0.9), 0, 0.74, -0.22);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addBox(chair, 0.04, 0.45, 0.04, trim, sx * 0.19, 0.22, sz * 0.18);
  addSeat('write', -14.7, -1.78, 0, { h: 0.5, ex: -14.7, ez: -2.65 });

  /* 대나무숲 · 임금님 귀는 당나귀 귀 구멍 */
  const bamboo = std(0x6f9a4a, { roughness: 0.55 }), node = std(0x557a38, { roughness: 0.6 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x5d8f3c, side: THREE.DoubleSide, roughness: 0.7 });
  for (let i = 0; i < 9; i++) {
    const bx = -17.9 + i * 0.36 + rand(-0.08, 0.08), bz = z0 + 0.25 + rand(0, 0.25), bh = rand(2.6, 3.3), br = rand(0.045, 0.065);
    addCyl(g, br, bh, bamboo, bx, bh / 2, bz);
    for (let y = 0.45; y < bh; y += rand(0.42, 0.55)) addCyl(g, br * 1.18, 0.03, node, bx, y, bz);
    for (let k = 0; k < 5; k++) addMesh(g, new THREE.PlaneGeometry(0.06, 0.36), leafM, bx + rand(-0.25, 0.25), bh - rand(0, 0.8), bz + rand(-0.05, 0.25), 1, 1, 1, { rz: rand(-1.2, 1.2), ry: rand(0, 3), rx: rand(-0.4, 0.4) });
  }
  colBox(-16.5, z0 + 0.4, 3.6, 0.55);
  addMesh(g, new THREE.CircleGeometry(0.34, 32), std(0x0e0806), -16.5, 0.014, -4.95, 1, 1, 1, { rx: -Math.PI / 2 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; addMesh(g, SPH, std(pick([0x9a948c, 0xb0a99e, 0x857f76]), { roughness: 0.9 }), -16.5 + Math.cos(a) * 0.42, 0.04, -4.95 + Math.sin(a) * 0.42, 0.09, 0.05, 0.08); }
  const sign = new THREE.Group();
  sign.position.set(-16.5, 0, z0 + 0.12);
  g.add(sign);
  addBox(sign, 1.9, 0.5, 0.05, trim, 0, 2.0, 0);
  textPlane(sign, '임금님 귀는 당나귀 귀', 1.8, 0.42, 0, 2.0, 0.03, 0, { color: '#fff1d6', size: 110 });
  addSeat('rant', -16.5, -4.45, Math.PI, { h: 0, ex: -16.5, ez: -3.7 });

  /* 반짝반짝: 꼬마전구 + 떠다니는 반짝이 */
  const bulbs = [];
  const edge = [[x0 + 0.15, z1 - 0.15], [x1 - 0.15, z1 - 0.15], [x1 - 0.15, z0 + 0.15], [x0 + 0.15, z0 + 0.15], [x0 + 0.15, z1 - 0.15]];
  for (let e = 0; e < 4; e++) {
    const [ax, az] = edge[e], [bx, bz] = edge[e + 1];
    const n = Math.round(Math.hypot(bx - ax, bz - az) / 0.22);
    for (let i = 0; i < n; i++) { const t = i / n; bulbs.push([ax + (bx - ax) * t, ceil - 0.12 - Math.abs(Math.sin(t * Math.PI * 3)) * 0.25, az + (bz - az) * t]); }
  }
  const bulbIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), bulbs.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  bulbs.forEach(([x, y, z], i) => { bulbIM.setMatrixAt(i, m4.makeTranslation(x, y, z)); bulbIM.setColorAt(i, col.set(pick([0xffd59a, 0xff9fc4, 0xfff0c8, 0xb8e0ff]))); });
  g.add(bulbIM);
  const st = sparkleTex();
  for (let k = 0; k < 2; k++) {
    const n = 45, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = rand(x0 + 0.3, x1 - 0.3); pos[i * 3 + 1] = rand(0.3, ceil - 0.3); pos[i * 3 + 2] = rand(z0 + 0.3, z1 - 0.3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: st, size: k ? 0.16 : 0.1, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: k ? 0xffd9ec : 0xfff2c8, toneMapped: false });
    const pts = new THREE.Points(sg, m);
    g.add(pts);
    vent.sparkles.push({ m, base: 0.75, ph: k * 2.1, pos, geo: sg, n });
  }
  vent.roomLight = new THREE.PointLight(0xffb6cc, 9, 9, 1.5);
  vent.roomLight.position.set(cx, ceil - 0.4, cz);
  if (!LOW) g.add(vent.roomLight); else { vent.fireLight.distance = 9; vent.fireLight.decay = 1.3; }
  // 불꽃 터짐(종이 던졌을 때)
  {
    const n = 60, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: st, color: 0xffb35a, size: 0.12, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const pts = new THREE.Points(sg, m);
    pts.frustumCulled = false;
    scene.add(pts);
    vent.sparks = { pos, vel, n, geo: sg, m, t: 0 };
  }
}

/* ---------- 불만창고 효과 ---------- */
const papers = [];
function throwPaper(A) {
  const m = new THREE.Mesh(vent.paperGeo, vent.paperMat);
  m.scale.setScalar(1.3);
  const from = new THREE.Vector3(A.x + Math.sin(A.ry) * 0.25, A.y + 0.95, A.z + Math.cos(A.ry) * 0.25);
  const to = vent.fireWorld.clone();
  scene.add(m);
  const vol = A === me.A ? 1 : nearMe(A);
  papers.push({ m, t: 0, from, to, dur: clamp(from.distanceTo(to) / 5, 0.6, 1.4), vol });
  A.P.waveT = 0.7;
  if (vol > 0.05) audio.whoosh(vol);
}
function burstSparks() {
  const s = vent.sparks;
  for (let i = 0; i < s.n; i++) {
    s.pos[i * 3] = vent.fireWorld.x; s.pos[i * 3 + 1] = vent.fireWorld.y; s.pos[i * 3 + 2] = vent.fireWorld.z;
    const a = rand(-1.3, 1.3), v = rand(1.2, 3.2);
    s.vel[i * 3] = Math.cos(a) * v * 0.6 + 0.6; s.vel[i * 3 + 1] = rand(1.5, 3.6); s.vel[i * 3 + 2] = Math.sin(a) * v * 0.6;
  }
  s.t = 1.4;
  s.geo.attributes.position.needsUpdate = true;
}
function updateVent(t, dt) {
  vent.boost = Math.max(0, vent.boost - dt * 0.6);
  const b = vent.boost;
  for (const f of vent.flames) {
    const u = f.userData;
    const k = 1 + Math.sin(t * 9 + u.ph) * 0.18 + Math.sin(t * 23 + u.ph * 2) * 0.08;
    f.scale.set(u.base * 0.55 * (1 + b * 0.5), u.base * k * (1 + b * 0.9), 1);
    f.material.opacity = 0.75 + Math.sin(t * 13 + u.ph) * 0.15;
  }
  vent.fireLight.intensity = 8 + Math.sin(t * 11) * 1.2 + Math.sin(t * 27) * 0.8 + b * 14;
  const e = vent.embers;
  for (let i = 0; i < e.n; i++) {
    e.pos[i * 3 + 1] += e.vel[i] * dt * (1 + b);
    e.pos[i * 3] += Math.sin(t * 3 + i) * dt * 0.1;
    if (e.pos[i * 3 + 1] > 0.82) { e.pos[i * 3 + 1] = 0.1; e.pos[i * 3] = rand(-0.4, 0.4); }
  }
  e.geo.attributes.position.needsUpdate = true;
  for (const s of vent.sparkles) {
    s.m.opacity = s.base + Math.sin(t * 2.3 + s.ph) * 0.25;
    if (s.pos) {
      for (let i = 0; i < s.n; i++) {
        s.pos[i * 3 + 1] += dt * 0.08;
        if (s.pos[i * 3 + 1] > VENT.ceil - 0.2) s.pos[i * 3 + 1] = 0.3;
      }
      s.geo.attributes.position.needsUpdate = true;
    }
  }
  const sp = vent.sparks;
  if (sp.t > 0) {
    sp.t -= dt;
    for (let i = 0; i < sp.n; i++) {
      sp.vel[i * 3 + 1] -= 4.5 * dt;
      sp.pos[i * 3] += sp.vel[i * 3] * dt; sp.pos[i * 3 + 1] += sp.vel[i * 3 + 1] * dt; sp.pos[i * 3 + 2] += sp.vel[i * 3 + 2] * dt;
      if (sp.pos[i * 3 + 1] < 0.2) sp.vel[i * 3 + 1] = Math.abs(sp.vel[i * 3 + 1]) * 0.3;
    }
    sp.m.opacity = clamp(sp.t / 0.6, 0, 1);
    sp.geo.attributes.position.needsUpdate = true;
  } else sp.m.opacity = 0;
  for (let i = papers.length - 1; i >= 0; i--) {
    const p = papers[i];
    p.t += dt / p.dur;
    const k = Math.min(1, p.t);
    p.m.position.lerpVectors(p.from, p.to, k);
    p.m.position.y += Math.sin(Math.PI * k) * 0.9;
    p.m.rotation.x += dt * 9; p.m.rotation.z += dt * 7;
    if (p.t >= 1) {
      scene.remove(p.m);
      papers.splice(i, 1);
      vent.boost = Math.min(2, vent.boost + 1.2);
      burstSparks();
      if (p.vol > 0.05) audio.fwoomp(p.vol);
    }
  }
}
const GRAWLIX = ['#@$%&!!', '%$#@!!', '@#$%^&*!', '!@#$%!!', '&%#@!?', '$#@%&*!!', '#$%!!!', '@!#$%&'];
function startRant(P, dur) {
  const A = P === me.A?.P ? me.A : [...remotes.values()].find((r) => r.A.P === P)?.A;
  const vol = P === me.A?.P ? 1 : nearMe(A);
  if (vol > 0.05) audio.bubbles(dur, vol * 0.9);
  P.rantT = dur;
  P.rantNext = 0;
  P.anger.visible = true;
}

/* ---------- 건물 외벽 · 도로 · 경계 충돌체 ---------- */
function buildWorldColliders() {
  // 빌딩 외벽 (정면 가운데 자동문만 통과)
  colBox(-10.8, 0, 18.4, 0.3); colBox(10.8, 0, 18.4, 0.3);
  colBox(-20, -15, 0.3, 30.3); colBox(20, -15, 0.3, 30.3); colBox(0, -30, 40.3, 0.3);
  // 건물 뒤편 블록 (이웃 빌딩)
  colBox(-112.6, -50, 185, 99.7); colBox(112.6, -50, 185, 99.7);
  // 차도: 횡단보도(|x|<5)만 건널 수 있음
  for (const [z0, z1] of [[5.05, 11.45], [18.55, 24.95]]) {
    colBox(-105, (z0 + z1) / 2, 200, z1 - z0); colBox(105, (z0 + z1) / 2, 200, z1 - z0);
  }
  // 바깥 경계
  colBox(30, 47, 300, 30.2); colBox(-120, 15, 20, 80); colBox(170, 15, 20, 80);
}

/* =========================================================================
   사운드 (WebAudio로 합성한 웅성거림)
   ========================================================================= */
const audio = {
  ctx: null, on: false,
  start() {
    if (!this.ctx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);
      musicInit(ctx, this.master);
    }
    this.ctx.resume();
    this.on = true;
    if (music.want || !music.cur) musicSet(music.want || musicZone());
  },
  setMix() {},
  sfx(fn, v = 1, ...args) {
    if (!this.ctx) return;
    const g = this.ctx.createGain(); g.gain.value = v; g.connect(this.master);
    fn(this.ctx, g, this.ctx.currentTime + 0.01, ...args);
    setTimeout(() => g.disconnect(), 15000);
  },
  pop(v = 1, pitch = 1) { this.sfx(popSound, v, 1, pitch); },
  whoosh(v = 1) { this.sfx(whooshSound, v); },
  fwoomp(v = 1) { this.sfx(fwoompSound, v); },
  bubbles(dur, v = 1) { this.sfx(bubbleSound, v, dur); },
  meow() {
    if (!this.ctx) return;
    this.ctx.resume();
    const g = this.ctx.createGain(); g.gain.value = 0.8; g.connect(this.master);
    mrrp(this.ctx, g, this.ctx.currentTime + 0.03);
  },
};

/* =========================================================================
   음악 — 장소와 시간에 맞춰 브라우저가 직접 연주하는 배경음악 (파일 0 KB)
   ========================================================================= */
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const NOISE_CACHE = new WeakMap();
function noiseBuf(ctx) {
  if (!NOISE_CACHE.has(ctx)) {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    NOISE_CACHE.set(ctx, b);
  }
  return NOISE_CACHE.get(ctx);
}
function makeImpulse(ctx, sec = 2.6, decay = 2.8) {
  const len = Math.floor(ctx.sampleRate * sec);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}
function env(ctx, t, peak, a, d, sustain = 0.0001, rel = 0) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
  if (rel) g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + rel);
  return g;
}
function osc(ctx, type, f, t, stop) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(stop); return o; }
function noiseSrc(ctx, t, dur) { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); s.start(t, Math.random() * 1.5, dur); return s; }
const INST = {
  // 일렉 피아노 (로즈 느낌): 기음 + 짧은 쇳소리(tine)
  epiano(ctx, out, t, n, dur, v = 1) {
    const f = midi(n), end = t + dur + 0.9;
    const g = env(ctx, t, 0.16 * v, 0.008, Math.max(0.3, dur), 0.0001, 0.6);
    osc(ctx, 'sine', f, t, end).connect(g);
    const g2 = env(ctx, t, 0.05 * v, 0.003, 0.18);
    osc(ctx, 'sine', f * 4.01, t, t + 0.4).connect(g2); g2.connect(g);
    const g3 = env(ctx, t, 0.03 * v, 0.01, dur * 0.8);
    osc(ctx, 'triangle', f * 2, t, end).connect(g3); g3.connect(g);
    g.connect(out);
  },
  pad(ctx, out, t, n, dur, v = 1) {
    const f = midi(n), end = t + dur + 1.6;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.4;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035 * v, t + 0.7); g.gain.setValueAtTime(0.035 * v, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
    for (const dt of [-6, 0, 7]) { const o = osc(ctx, 'sawtooth', f, t, end); o.detune.value = dt; o.connect(lp); }
    lp.connect(g); g.connect(out);
  },
  bass(ctx, out, t, n, dur, v = 1) {
    const f = midi(n), end = t + dur + 0.3;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(320, t + 0.25);
    const g = env(ctx, t, 0.22 * v, 0.006, dur, 0.0001, 0.12);
    osc(ctx, 'sawtooth', f, t, end).connect(lp);
    const sub = ctx.createGain(); sub.gain.value = 0.9; osc(ctx, 'sine', f, t, end).connect(sub); sub.connect(g);
    lp.connect(g); g.connect(out);
  },
  upright(ctx, out, t, n, dur, v = 1) {
    const f = midi(n), end = t + 0.9;
    const g = env(ctx, t, 0.26 * v, 0.008, 0.55);
    osc(ctx, 'triangle', f, t, end).connect(g);
    const g2 = env(ctx, t, 0.09 * v, 0.004, 0.12); osc(ctx, 'sine', f * 2, t, t + 0.3).connect(g2); g2.connect(g);
    g.connect(out);
  },
  marimba(ctx, out, t, n, dur, v = 1) {
    const f = midi(n);
    const g = env(ctx, t, 0.13 * v, 0.003, 0.45);
    osc(ctx, 'sine', f, t, t + 0.6).connect(g);
    const g2 = env(ctx, t, 0.05 * v, 0.002, 0.08); osc(ctx, 'sine', f * 3.98, t, t + 0.15).connect(g2); g2.connect(g);
    g.connect(out);
  },
  musicbox(ctx, out, t, n, dur, v = 1) {
    const f = midi(n);
    const g = env(ctx, t, 0.1 * v, 0.002, 1.4);
    osc(ctx, 'sine', f, t, t + 1.6).connect(g);
    const g2 = env(ctx, t, 0.035 * v, 0.002, 0.5); osc(ctx, 'sine', f * 3.01, t, t + 0.6).connect(g2); g2.connect(g);
    const g3 = env(ctx, t, 0.02 * v, 0.001, 0.2); osc(ctx, 'sine', f * 5.4, t, t + 0.3).connect(g3); g3.connect(g);
    g.connect(out);
  },
  vibes(ctx, out, t, n, dur, v = 1) {
    const f = midi(n), end = t + dur + 1.2;
    const g = env(ctx, t, 0.1 * v, 0.004, dur + 0.5, 0.0001, 0.5);
    const o = osc(ctx, 'sine', f, t, end);
    const lfo = osc(ctx, 'sine', 5.5, t, end); const lg = ctx.createGain(); lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g);
    const g2 = env(ctx, t, 0.025 * v, 0.002, 0.3); osc(ctx, 'sine', f * 4, t, t + 0.4).connect(g2); g2.connect(g);
    g.connect(out);
  },
  pluck(ctx, out, t, n, dur, v = 1) { // 나일론 기타 느낌
    const f = midi(n), end = t + 1.2;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(Math.min(6000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.35);
    const g = env(ctx, t, 0.1 * v, 0.003, 0.9);
    osc(ctx, 'sawtooth', f, t, end).connect(lp);
    const o2 = osc(ctx, 'triangle', f * 2, t, end); const g2 = ctx.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(lp);
    lp.connect(g); g.connect(out);
  },
  flute(ctx, out, t, n, dur, v = 1) {
    const f = midi(n), end = t + dur + 0.4;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * v, t + 0.07); g.gain.setValueAtTime(0.06 * v, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
    const o = osc(ctx, 'sine', f, t, end);
    const lfo = osc(ctx, 'sine', 5, t, end); const lg = ctx.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
    const nb = ctx.createGain(); nb.gain.value = 0.15; noiseSrc(ctx, t, dur + 0.3).connect(bp); bp.connect(nb); nb.connect(g);
    g.connect(out);
  },
  chime(ctx, out, t, n, dur, v = 1) {
    const f = midi(n);
    const g = env(ctx, t, 0.05 * v, 0.002, 2.2);
    osc(ctx, 'sine', f, t, t + 2.4).connect(g);
    const g2 = env(ctx, t, 0.02 * v, 0.002, 0.9); osc(ctx, 'sine', f * 2.76, t, t + 1).connect(g2); g2.connect(g);
    g.connect(out);
  },
  kick(ctx, out, t, v = 1) {
    const o = osc(ctx, 'sine', 120, t, t + 0.4); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = env(ctx, t, 0.55 * v, 0.003, 0.3); o.connect(g); g.connect(out);
  },
  snare(ctx, out, t, v = 1) {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.8;
    const g = env(ctx, t, 0.22 * v, 0.002, 0.16); noiseSrc(ctx, t, 0.25).connect(bp); bp.connect(g);
    const tg = env(ctx, t, 0.1 * v, 0.002, 0.08); osc(ctx, 'triangle', 190, t, t + 0.12).connect(tg); tg.connect(g);
    g.connect(out);
  },
  brush(ctx, out, t, v = 1) {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    noiseSrc(ctx, t, 0.3).connect(bp); bp.connect(g); g.connect(out);
  },
  rim(ctx, out, t, v = 1) {
    const g = env(ctx, t, 0.09 * v, 0.001, 0.04); osc(ctx, 'square', 1700, t, t + 0.06).connect(g);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 6; g.connect(bp); bp.connect(out);
  },
  hat(ctx, out, t, v = 1, open = false) {
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = env(ctx, t, 0.08 * v, 0.001, open ? 0.22 : 0.04); noiseSrc(ctx, t, open ? 0.3 : 0.06).connect(hp); hp.connect(g); g.connect(out);
  },
  ride(ctx, out, t, v = 1) {
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
    const g = env(ctx, t, 0.05 * v, 0.001, 0.35); noiseSrc(ctx, t, 0.4).connect(hp); hp.connect(g);
    const g2 = env(ctx, t, 0.012 * v, 0.001, 0.5); osc(ctx, 'square', 5200, t, t + 0.5).connect(g2); g2.connect(g);
    g.connect(out);
  },
  shaker(ctx, out, t, v = 1) {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 6500; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05 * v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    noiseSrc(ctx, t, 0.1).connect(bp); bp.connect(g); g.connect(out);
  },
  crackle(ctx, out, t, v = 1) {
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const g = env(ctx, t, 0.04 * v, 0.0005, 0.006); noiseSrc(ctx, t, 0.01).connect(hp); hp.connect(g); g.connect(out);
  },
};
// 결정적 난수 (같은 마디는 같은 멜로디)
const R = (a, b, c = 0) => hash(a * 7919 + c * 104729, b * 31 + 17);
const walk = (tr, list, r) => { tr.mi = clamp((tr.mi ?? 2) + (r < 0.45 ? -1 : r < 0.9 ? 1 : 2), 0, list.length - 1); return list[tr.mi]; };
const TRACKS = {
  // 낮의 광화문 거리 — 산뜻한 시티팝
  citypop: {
    title: '세종대로 햇살', bpm: 104, swing: 0, vol: 0.72, rev: 0.22,
    chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [55, 59, 62, 65], [57, 60, 64, 67], [50, 53, 57, 60], [58, 62, 65, 69], [48, 52, 55, 58]],
    roots: [41, 40, 38, 43, 45, 38, 46, 36],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s === 0 || s === 8 || (s === 11 && R(bar, s) < 0.5)) INST.kick(ctx, out, t, 0.9);
      if (s === 4 || s === 12) INST.snare(ctx, out, t, 0.8);
      if (s % 2 === 0) INST.hat(ctx, out, t, s % 4 === 2 ? 0.8 : 0.45, s === 14 && R(bar, 1) < 0.5);
      const bs = { 0: root, 3: root + 12, 6: root, 8: root + 7, 10: root + 12, 14: root - 1 }[s];
      if (bs !== undefined) INST.bass(ctx, out, t, bs, sp * 1.6, s === 0 ? 1 : 0.75);
      if (s === 0 || s === 6 || s === 10) c.forEach((n) => INST.epiano(ctx, out, t, n + 12, sp * (s === 0 ? 3 : 2), 0.55));
      if (s % 2 === 0 && R(bar, s, 3) > 0.68) INST.vibes(ctx, out, t, walk(this, [65, 67, 69, 72, 74, 77, 79, 81], R(bar, s, 5)), sp * 2, 0.75);
    },
  },
  // 밤의 광화문 — 잔잔한 로파이
  lofi: {
    title: '밤의 광화문', bpm: 74, swing: 0.32, vol: 0.85, rev: 0.32,
    chords: [[53, 57, 60, 64], [53, 55, 59, 62], [52, 55, 59, 62], [52, 55, 57, 61]],
    roots: [38, 43, 36, 45],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s === 0 || s === 10 || (s === 7 && R(bar, s) < 0.6)) INST.kick(ctx, out, t, 0.65);
      if (s === 4 || s === 12) INST.rim(ctx, out, t, 0.8);
      if (s % 2 === 0) INST.hat(ctx, out, t, 0.28);
      else if (R(bar, s, 2) < 0.25) INST.hat(ctx, out, t, 0.14);
      if (s === 0) INST.bass(ctx, out, t, root, sp * 8, 0.7);
      if (s === 10) INST.bass(ctx, out, t, root, sp * 3, 0.55);
      if (s === 13) INST.bass(ctx, out, t, root + 7, sp * 2, 0.5);
      if (s === 0) c.forEach((n, i) => INST.epiano(ctx, out, t + i * 0.012, n + 12, sp * 12, 0.55));
      if (s === 10 && R(bar, 4) < 0.6) c.slice(1).forEach((n) => INST.epiano(ctx, out, t, n + 12, sp * 4, 0.3));
      if (s % 2 === 0 && R(bar, s, 6) > 0.8) INST.vibes(ctx, out, t, walk(this, [62, 65, 67, 69, 72, 74, 77], R(bar, s, 7)), sp * 3, 0.7);
    },
  },
  // 로비 — 밝은 마림바
  office: {
    title: '보장원 로비', bpm: 96, swing: 0, vol: 0.8, rev: 0.3,
    chords: [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 52]],
    roots: [36, 33, 41, 43],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s === 0) c.forEach((n) => INST.pad(ctx, out, t, n + 12, sp * 15, 0.8));
      const arp = [0, 1, 2, 3, 2, 1, 2, 3];
      if (R(bar, s, 1) > 0.12) INST.marimba(ctx, out, t, c[arp[s % 8]] + 24, sp, s % 4 === 0 ? 1 : 0.6);
      if (s % 2 === 1) INST.shaker(ctx, out, t, 0.7);
      if (s === 0 || s === 8) INST.marimba(ctx, out, t, root + 12, sp * 2, 0.9);
    },
  },
  // 업무공간 — 집중용 소프트 키즈
  work: {
    title: '집중 모드', bpm: 84, swing: 0.1, vol: 0.97, rev: 0.3,
    chords: [[51, 55, 58, 62], [48, 51, 55, 58], [44, 48, 51, 55], [46, 50, 53, 55]],
    roots: [39, 36, 44, 46],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s === 0) { c.forEach((n) => INST.pad(ctx, out, t, n + 12, sp * 15, 0.7)); INST.bass(ctx, out, t, root, sp * 6, 0.5); }
      if (s === 0 || s === 8) INST.kick(ctx, out, t, s ? 0.25 : 0.35);
      if (s % 2 === 0) INST.hat(ctx, out, t, 0.14);
      if ((s % 4 === 0 && R(bar, s) < 0.55) || (s % 4 === 2 && R(bar, s) < 0.2)) INST.epiano(ctx, out, t, c[Math.floor(R(bar, s, 4) * 4)] + 24, sp * 3, 0.6);
    },
  },
  // 휴게실 — 신나는 스윙 재즈
  lounge: {
    title: '휴게실 스윙', bpm: 118, swing: 0.3, vol: 1.12, rev: 0.25,
    chords: [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [57, 61, 64, 67], [50, 53, 57, 60], [55, 59, 62, 65], [52, 55, 59, 62], [57, 61, 64, 67]],
    roots: [38, 43, 36, 45, 38, 43, 40, 45],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s % 4 === 0) {
        const next = this.roots[(bar + 1) % this.roots.length];
        const n = [root, root + (c[1] - c[0] + 0), root + 7, next + (R(bar, 2) < 0.5 ? 1 : -1)][s / 4];
        INST.upright(ctx, out, t, n, sp * 4, 0.9);
      }
      if (s === 0 || s === 4 || s === 8 || s === 12) INST.ride(ctx, out, t, 0.8);
      if (s === 6 || s === 14) INST.ride(ctx, out, t, 0.55);
      if (s === 4 || s === 12) INST.brush(ctx, out, t, 1);
      if (s === 0) INST.kick(ctx, out, t, 0.2);
      if ((s === 6 || s === 14) && R(bar, s) < 0.75) c.forEach((n) => INST.epiano(ctx, out, t, n + 12, sp * 1.5, 0.5));
      if (s % 2 === 0 && R(bar, s, 8) > 0.7) INST.vibes(ctx, out, t, walk(this, [72, 74, 75, 76, 79, 81, 84], R(bar, s, 9)), sp * 2, 0.8);
    },
  },
  // 수면실 — 오르골 자장가
  nap: {
    title: '꿀잠 오르골', bpm: 64, swing: 0, vol: 1.0, rev: 0.45,
    chords: [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]],
    roots: [41, 38, 46, 36],
    mel: [[81, 0, 77, 0, 72, 77, 81, 0], [79, 0, 77, 0, 74, 77, 81, 0], [82, 0, 81, 0, 79, 77, 74, 0], [76, 0, 79, 0, 77, 0, 0, 0]],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s === 0) c.forEach((n) => INST.pad(ctx, out, t, n + 12, sp * 15, 0.6));
      if (s % 2 === 0) { const m = this.mel[bar % 4][s / 2]; if (m) INST.musicbox(ctx, out, t, m, sp * 2, 0.9); }
      if (s % 4 === 2) INST.musicbox(ctx, out, t, c[(s / 2) % 3] + 12, sp, 0.35);
    },
  },
  // 맞은편 맛집 거리 — 카페 보사노바
  cafe: {
    title: '맛집 거리 보사노바', bpm: 112, swing: 0, vol: 1.3, rev: 0.25,
    chords: [[57, 60, 64, 67], [54, 57, 60, 64], [55, 59, 62, 66], [52, 55, 59, 64], [54, 57, 60, 64], [51, 54, 57, 59], [52, 55, 59, 62], [52, 56, 59, 62]],
    roots: [45, 38, 43, 48, 42, 47, 40, 40],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s === 0) INST.pluck(ctx, out, t, root, sp * 4, 1);
      if (s === 8) INST.pluck(ctx, out, t, root + 7, sp * 4, 0.9);
      if ([0, 3, 6, 10, 13].includes(s)) c.forEach((n, i) => INST.pluck(ctx, out, t + i * 0.008, n, sp * 2, 0.55));
      INST.shaker(ctx, out, t, s % 2 ? 0.35 : 0.55);
      if (s === 3 || s === 10) INST.rim(ctx, out, t, 0.55);
      if (s % 2 === 0 && R(bar, s, 4) > 0.76) INST.flute(ctx, out, t, walk(this, [67, 69, 71, 74, 76, 79, 81], R(bar, s, 5)), sp * 3, 0.8);
    },
  },
  // 불만창고 — 벽난로 옆 포근한 오르골
  vent: {
    title: '불만창고 벽난로', bpm: 70, swing: 0, vol: 1.05, rev: 0.4,
    chords: [[48, 52, 55, 59], [52, 55, 59, 62], [53, 57, 60, 64], [55, 59, 62, 64]],
    roots: [36, 40, 41, 43],
    step(s, bar, t, sp, c, root, out, ctx) {
      if (s === 0) { c.forEach((n) => INST.epiano(ctx, out, t, n + 12, sp * 14, 0.4)); c.forEach((n) => INST.pad(ctx, out, t, n, sp * 15, 0.5)); }
      if (s % 2 === 0 && R(bar, s) > 0.2) INST.musicbox(ctx, out, t, c[(s / 2) % 4] + 24, sp, 0.5);
      if (R(bar, s, 3) < 0.1) INST.chime(ctx, out, t, [84, 86, 88, 91, 93, 96][Math.floor(R(bar, s, 4) * 6)], 1, 0.7);
    },
  },
};
const music = { on: true, cur: null, bus: null, rev: null, comp: null, timer: null, want: null };
function musicChain(ctx, dest) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  const bus = ctx.createGain(); bus.gain.value = 0.6;
  const rev = ctx.createConvolver(); rev.buffer = makeImpulse(ctx);
  const rg = ctx.createGain(); rg.gain.value = 1;
  rev.connect(rg); rg.connect(comp); bus.connect(comp); comp.connect(dest);
  return { bus, rev, comp };
}
function musicInit(ctx, dest) {
  Object.assign(music, musicChain(ctx, dest));
  music.timer = setInterval(musicTick, 30);
}
function trackOut(ctx, name, bus, rev) {
  const tr = TRACKS[name];
  const gain = ctx.createGain(); gain.gain.value = 0;
  gain.connect(bus);
  const send = ctx.createGain(); send.gain.value = tr.rev; gain.connect(send); send.connect(rev);
  return gain;
}
function scheduleStep(tr, step, t, sp, out) {
  const s = step % 16, bar = Math.floor(step / 16);
  const i = bar % tr.chords.length;
  const sw = s % 2 === 1 ? sp * (tr.swing || 0) : 0;
  tr.step(s, bar, t + sw, sp, tr.chords[i], tr.roots[i], out, out.context);
}
function musicSet(name) {
  if (!audio.ctx || !music.bus) { music.want = name; return; }
  if (music.cur?.name === name) return;
  const ctx = audio.ctx, now = ctx.currentTime;
  if (music.cur) {
    const old = music.cur;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setTargetAtTime(0, now, 0.7);
    setTimeout(() => old.gain.disconnect(), 5000);
  }
  const gain = trackOut(ctx, name, music.bus, music.rev);
  gain.gain.setTargetAtTime(TRACKS[name].vol, now + 0.05, 0.9);
  music.cur = { name, tr: TRACKS[name], gain, next: now + 0.1, step: 0 };
}
function musicTick() {
  const p = music.cur;
  if (!p || !audio.on || !music.on || !audio.ctx) return;
  const ctx = audio.ctx;
  const sp = 60 / p.tr.bpm / 4;
  if (p.next < ctx.currentTime - 0.25) p.next = ctx.currentTime + 0.05;
  while (p.next < ctx.currentTime + 0.18) { scheduleStep(p.tr, p.step, p.next, sp, p.gain); p.next += sp; p.step++; }
}
function musicZone() {
  const A = me?.A;
  const h = TOD.hour;
  const outside = () => (h >= 6 && h < 17.5 ? 'citypop' : 'lofi');
  if (!A) return outside();
  if (inVent(A.x, A.z)) return 'vent';
  if (isInsideXZ(A.x, A.z)) {
    if (A.x > 2.5 && A.z < -16) return 'nap';
    if (A.x > 2.5) return 'lounge';
    if (A.z < -6) return 'work';
    return 'office';
  }
  return A.z > 24.5 ? 'cafe' : outside();
}
// 오프라인 렌더링 (미리 듣기 WAV 만들기)
async function renderAudio(list, sr = 22050) {
  const total = list.reduce((a, x) => a + x.sec, 0);
  const ctx = new OfflineAudioContext(1, Math.ceil(total * sr), sr);
  const { bus, rev } = musicChain(ctx, ctx.destination);
  let t0 = 0;
  for (const item of list) {
    if (item.track) {
      const tr = TRACKS[item.track];
      const gain = trackOut(ctx, item.track, bus, rev);
      gain.gain.setValueAtTime(0, t0); gain.gain.linearRampToValueAtTime(tr.vol, t0 + 0.6);
      gain.gain.setValueAtTime(tr.vol, t0 + item.sec - 1.5); gain.gain.linearRampToValueAtTime(0, t0 + item.sec - 0.2);
      const sp = 60 / tr.bpm / 4;
      const saved = tr.mi;
      for (let k = 0, t = t0 + 0.05; t < t0 + item.sec - 0.6; k++, t += sp) scheduleStep(tr, k, t, sp, gain);
      tr.mi = saved;
    } else if (item.sfx) {
      const g = ctx.createGain(); g.gain.value = 1; g.connect(ctx.destination);
      const fns = { pop: () => popSound(ctx, g, t0 + 0.1), poke: () => { popSound(ctx, g, t0 + 0.1); popSound(ctx, g, t0 + 0.21, 1, 1.5); }, paper: () => { whooshSound(ctx, g, t0 + 0.1); fwoompSound(ctx, g, t0 + 1.0); }, bubbles: () => bubbleSound(ctx, g, t0 + 0.1, item.sec - 0.4) };
      fns[item.sfx]();
    } else if (item.purr) {
      const g = ctx.createGain(); g.gain.value = 1; g.connect(ctx.destination);
      mrrp(ctx, g, t0 + 0.2);
    }
    t0 += item.sec;
  }
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0);
  let peak = 0, sum = 0;
  for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; }
  // 16-bit WAV
  const n = d.length, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); wr(8, 'WAVE'); wr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); wr(36, 'data'); v.setUint32(40, n * 2, true);
  const norm = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, clamp(d[i] * norm, -1, 1) * 32767, true);
  let bin = '';
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { wav: btoa(bin), peak, rms: Math.sqrt(sum / n) };
}

/* ---------- 효과음 (잡음 없이 깨끗한 소리만) ---------- */
function popSound(ctx, out, t, v = 1, pitch = 1) {
  // 말할 때 '뾱'
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(520 * pitch, t); o.frequency.exponentialRampToValueAtTime(1250 * pitch, t + 0.06);
  const g = env(ctx, t, 0.32 * v, 0.004, 0.09);
  const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.setValueAtTime(1040 * pitch, t); o2.frequency.exponentialRampToValueAtTime(2300 * pitch, t + 0.05);
  const g2 = env(ctx, t, 0.06 * v, 0.003, 0.05);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
  o.start(t); o.stop(t + 0.16); o2.start(t); o2.stop(t + 0.1);
}
function whooshSound(ctx, out, t) {
  // 종이 휙 — 부드러운 바람 소리 + 사인 글라이드
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(1400, t + 0.35); bp.frequency.exponentialRampToValueAtTime(600, t + 0.7);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
  src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(out);
  src.start(t, 0.3, 0.8);
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.4);
  const og = env(ctx, t, 0.05, 0.12, 0.45); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.65);
}
function fwoompSound(ctx, out, t) {
  // 불 속에 들어가며 '화르륵' — 낮은 울림 + 위로 퍼지는 따뜻한 소리
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.25);
  const g = env(ctx, t, 0.45, 0.02, 0.5); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.6);
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(1600, t + 0.3); lp.frequency.exponentialRampToValueAtTime(500, t + 0.9);
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.28, t + 0.08); ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
  src.connect(lp); lp.connect(ng); ng.connect(out); src.start(t, 0.7, 1.1);
  for (let i = 0; i < 3; i++) popSound(ctx, out, t + 0.12 + i * 0.09, 0.35, 1.3 + i * 0.25);
}
function bubbleSound(ctx, out, t0, dur, v = 1) {
  // 욕할 때 '보글보글' — 위로 튀는 물방울 소리를 빠르게 이어서
  let t = t0;
  let k = 0;
  while (t < t0 + dur) {
    const f = 380 + hash(k, 3) * 700;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (1.7 + hash(k, 5) * 0.6), t + 0.045);
    const g = env(ctx, t, (0.16 + hash(k, 7) * 0.1) * v, 0.003, 0.06);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.09);
    t += 0.055 + hash(k, 9) * 0.075;
    k++;
  }
}
/* ---------- 고양이 소리: '삐용~' ---------- */
function mrrp(ctx, out, t) {
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(430, t); o.frequency.linearRampToValueAtTime(700, t + 0.13); o.frequency.linearRampToValueAtTime(560, t + 0.32);
  const trill = ctx.createGain(); trill.gain.value = 1;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 32;
  const lg = ctx.createGain(); lg.gain.setValueAtTime(0.6, t); lg.gain.linearRampToValueAtTime(0, t + 0.12);
  lfo.connect(lg); lg.connect(trill.gain);
  const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 950; f1.Q.value = 5;
  const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2100; f2.Q.value = 7;
  const g2 = ctx.createGain(); g2.gain.value = 0.55;
  const g = env(ctx, t, 0.9, 0.02, 0.32);
  o.connect(trill); trill.connect(f1); trill.connect(f2); f2.connect(g2); f1.connect(g); g2.connect(g); g.connect(out);
  o.start(t); o.stop(t + 0.45); lfo.start(t); lfo.stop(t + 0.2);
}

/* =========================================================================
   모드 / 카메라 트윈
   ========================================================================= */
const mode = { inside: false, playing: false, modal: false };
let tween = null;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function flyTo(pos, target, dur = 2) {
  if (tween) { const r = tween.res; tween = null; r(); }
  return new Promise((res) => {
    tween = { fp: camera.position.clone(), ft: controls.target.clone(), tp: pos.clone(), tt: target.clone(), t: 0, dur, res };
  });
}
function setInside(v) {
  if (mode.inside === v) return;
  mode.inside = v;
  scene.environment = (v ? envIn : envOut) || envOut;
  scene.environmentIntensity = envLevel(v);
  audio.setMix();
}
const isInsideXZ = (x, z) => x > -20 && x < 20 && z < 0 && z > -30;

/* =========================================================================
   물리: 원(플레이어) vs 박스/원 충돌, 바닥 높이
   ========================================================================= */
const PR = 0.28;
function overlaps(p) {
  for (const c of colliders) {
    const dx = p.x - c.x, dz = p.z - c.z;
    if (c.t === 'c') { const m = c.r + PR - 0.01; if (dx * dx + dz * dz < m * m) return true; continue; }
    const R = c.hw + c.hd + PR;
    if (Math.abs(dx) > R || Math.abs(dz) > R) continue;
    const lx = dx * c.c - dz * c.s, lz = dx * c.s + dz * c.c;
    const ex = lx - clamp(lx, -c.hw, c.hw), ez = lz - clamp(lz, -c.hd, c.hd);
    if (ex * ex + ez * ez < (PR - 0.01) ** 2) return true;
  }
  return false;
}
function resolveCollisions(p) {
  for (let it = 0; it < 8; it++) {
    let moved = false;
    for (const c of colliders) {
      const dx = p.x - c.x, dz = p.z - c.z;
      if (c.t === 'c') {
        const min = c.r + PR;
        if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
        const d2 = dx * dx + dz * dz;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 1e-4;
        const push = min - d;
        p.x += (dx / d) * push; p.z += (dz / d) * push;
        moved = true;
      } else {
        const R = c.hw + c.hd + PR;
        if (Math.abs(dx) > R || Math.abs(dz) > R) continue;
        const lx = dx * c.c - dz * c.s, lz = dx * c.s + dz * c.c;
        const qx = clamp(lx, -c.hw, c.hw), qz = clamp(lz, -c.hd, c.hd);
        let ox = 0, oz = 0;
        if (qx === lx && qz === lz) {
          // 박스 안쪽: 가장 얕은 방향으로 밀어냄
          const px = c.hw - Math.abs(lx), pz = c.hd - Math.abs(lz);
          if (px < pz) ox = (px + PR) * Math.sign(lx || 1); else oz = (pz + PR) * Math.sign(lz || 1);
        } else {
          const ex = lx - qx, ez = lz - qz, d2 = ex * ex + ez * ez;
          if (d2 >= PR * PR) continue;
          const d = Math.sqrt(d2) || 1e-4;
          ox = (ex / d) * (PR - d); oz = (ez / d) * (PR - d);
        }
        p.x += ox * c.c + oz * c.s;
        p.z += -ox * c.s + oz * c.c;
        moved = true;
      }
    }
    if (!moved) break;
  }
}
function groundY(x, z) {
  if (isInsideXZ(x, z)) return 0.155;
  if ((z >= -0.6 && z <= 5.05) || (z >= 11.45 && z <= 18.55) || z >= 24.95) return 0.152;
  return 0.03;
}

/* =========================================================================
   아바타 (나 + 다른 접속자)
   ========================================================================= */
const SEAT_INFO = {
  desk: { label: '💻 앉아서 일하기', pose: 'sit', state: 'type', ph: 'work' },
  lounge: { label: '🛋️ 둘러앉기', pose: 'sit', state: 'sit', ph: 'lounge' },
  bean: { label: '🫘 빈백에 앉기', pose: 'sit', state: 'sit', ph: 'lounge' },
  pp: { label: '🏓 탁구 치기', pose: 'stand', state: 'pp', ph: 'pingpong' },
  bed: { label: '🛏️ 눕기', pose: 'lie', state: 'sleep', ph: 'nap' },
  recline: { label: '😌 기대 쉬기', pose: 'sit', state: 'doze', ph: 'nap' },
  cafe: { label: '☕ 테라스에 앉기', pose: 'sit', state: 'sit', ph: 'cafe' },
  meeting: { label: '💼 회의 자리에 앉기', pose: 'sit', state: 'sit', ph: 'meeting' },
  write: { label: '✍️ 책상에 앉기', pose: 'sit', state: 'write', ph: 'vent' },
  rant: { label: '🎋 대나무숲 앞에 서기', pose: 'stand', state: 'idle', ph: 'vent' },
  bear: { label: '🧸 곰인형 꼭 안기', pose: 'stand', state: 'hug', ph: 'vent' },
};
const seatById = new Map();
function placeOnSeat(A, seat) {
  const info = SEAT_INFO[seat.kind];
  setPose(A.P, info.pose, seat.h);
  A.P.state = info.state;
  A.P.paddle.visible = seat.kind === 'pp';
  A.x = seat.x; A.z = seat.z; A.ry = seat.ry;
  A.y = 0.155 + A.P.sitOffset;
  A.seat = seat;
}
function leaveSeat(A) {
  const s = A.seat;
  if (!s) return;
  A.seat = null;
  setPose(A.P, 'stand');
  A.P.state = 'idle';
  A.P.paddle.visible = false;
  A.x = s.ex; A.z = s.ez;
  A.ry = Math.atan2(s.ex - s.x, s.ez - s.z) || A.ry;
  A.y = groundY(A.x, A.z);
}
function makeAvatar(design, name, me) {
  const P = makePerson(design, { name, me });
  scene.add(P.g);
  people.push(P);
  return { P, x: 0, z: 0, y: 0.152, ry: 0, seat: null, vx: 0, vz: 0, moving: false };
}
function disposeAvatar(A) {
  scene.remove(A.P.g);
  const i = people.indexOf(A.P);
  if (i >= 0) people.splice(i, 1);
  A.P.g.traverse((m) => { const j = clickables.indexOf(m); if (j >= 0) clickables.splice(j, 1); });
  A.P.tag?.material.map.dispose();
}
function syncAvatar(A) {
  A.P.g.position.set(A.x, A.y + (A.P.hopY || 0), A.z);
  A.P.g.rotation.y = A.ry;
  A.P.bodyYaw = A.ry;
}

/* =========================================================================
   나(플레이어)
   ========================================================================= */
const me = { A: null, name: '', design: 0, target: null, auto: null, run: false };
const keys = new Set();
const joy = { x: 0, y: 0, active: false };
let sayN = 0, pokeN = 0;
let lastSay = null, lastPoke = null, lastFx = null, fxN = 0, lastPet = null, petN = 0;
const SPOTS = {
  street: { x: 0, z: 3.4, ry: Math.PI, label: '🏙️ 광화문 거리' },
  lobby: { x: 0, z: -4.2, ry: Math.PI, label: '🚪 로비' },
  work: { x: -2.2, z: -13.5, ry: -Math.PI / 2, label: '💻 업무공간' },
  lounge: { x: 6.4, z: -5.6, ry: faceTo(1, -0.6), label: '🛋️ 휴게실' },
  nap: { x: 5.4, z: -18.6, ry: faceTo(0.6, -1), label: '🛏️ 수면실' },
  food: { x: -9, z: 28.6, ry: 0, label: '🍰 맛집 거리' },
  vent: { x: -15.6, z: -3.6, ry: -Math.PI / 2, label: '🔥 불만창고' },
};
function cameraBehind(dur = 0) {
  const A = me.A;
  const dist = mode.inside ? 4.2 : 6.5;
  const tgt = new THREE.Vector3(A.x, A.y + 1.15, A.z);
  const pos = new THREE.Vector3(A.x - Math.sin(A.ry) * dist, A.y + (mode.inside ? 2.4 : 3.2), A.z - Math.cos(A.ry) * dist);
  if (dur) return flyTo(pos, tgt, dur);
  if (tween) { const r = tween.res; tween = null; r(); }
  camera.position.copy(pos); controls.target.copy(tgt);
  return Promise.resolve();
}
function teleport(key) {
  const s = SPOTS[key];
  if (!s || !me.A) return;
  leaveSeat(me.A);
  me.target = null; me.auto = null;
  Object.assign(me.A, { x: s.x, z: s.z, ry: s.ry, y: groundY(s.x, s.z) });
  setInside(isInsideXZ(s.x, s.z));
  cameraBehind();
  sendPresence(true);
  refreshContext(true);
}
function nearestFreeSeat() {
  if (!me.A || me.A.seat) return null;
  const taken = new Set([...remotes.values()].map((r) => r.A.seat?.id).filter(Boolean));
  let best = null, bd = 1.35;
  for (const s of seats) {
    if (taken.has(s.id)) continue;
    const d = Math.min(Math.hypot(me.A.x - s.ex, me.A.z - s.ez), Math.hypot(me.A.x - s.x, me.A.z - s.z) - 0.3);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
// 앉으면 그 자리에 어울리는 시점으로
function seatCamera(seat) {
  const fx = Math.sin(seat.ry), fz = Math.cos(seat.ry);
  let d = 2.9, h = 1.0, side = 0.3;
  const yOff = seat.kind === 'bed' ? 0.75 : seat.kind === 'pp' ? 1.15 : 0.95;
  if (seat.kind === 'desk') { d = -2.0; h = 1.0; side = 0.9; }
  else if (seat.kind === 'pp') { d = -2.4; h = 1.0; side = 0.9; }
  else if (seat.kind === 'bed') { d = 2.4; h = 1.8; side = 0.4; }
  else if (seat.kind === 'rant') { d = 0.45; h = 0.75; side = 2.1; }
  if (inVent(seat.x, seat.z)) {
    const tgt2 = new THREE.Vector3(seat.x, 0.155 + yOff, seat.z);
    const p2 = new THREE.Vector3(seat.x + fx * d + fz * side, tgt2.y + h, seat.z + fz * d - fx * side);
    p2.x = clamp(p2.x, VENT.x0 + 0.25, VENT.x1 - 0.25); p2.y = clamp(p2.y, 0.8, VENT.ceil - 0.2); p2.z = clamp(p2.z, VENT.z0 + 0.25, VENT.z1 - 0.25);
    flyTo(p2, tgt2, 0.8);
    return;
  }
  if (camera.aspect < 0.8) side *= 0.25;
  const tgt = new THREE.Vector3(seat.x, 0.155 + yOff, seat.z);
  const pos = new THREE.Vector3(seat.x + fx * d + fz * side, tgt.y + h, seat.z + fz * d - fx * side);
  if (isInsideXZ(seat.x, seat.z)) { pos.x = clamp(pos.x, -19.4, 19.4); pos.y = clamp(pos.y, 0.8, 4.5); pos.z = clamp(pos.z, -29.4, -0.6); }
  flyTo(pos, tgt, 0.8);
}
function doAction() {
  if (!me.A || !mode.playing) return;
  if (me.A.seat) { leaveSeat(me.A); sendPresence(true); refreshContext(true); return; }
  const stn = nearestStation(me.A, me.A.P.holding);
  const buddy = stn ? null : nearestRemote(me.A);
  if (buddy) { poke(buddy); return; }
  if (stn) {
    me.target = null; me.auto = null;
    const r = stn.kind === 'printer' ? (Math.random() < 0.5 ? 'ok' : Math.random() < 0.5 ? 'jam' : 'run') : '';
    runStation(me.A, stn, r, true);
    lastFx = { k: 'st', s: stn.id, r, n: ++fxN };
    sendPresence(true);
    refreshContext(false);
    return;
  }
  const s = nearestFreeSeat();
  const cat = nearestCat(me.A);
  if (cat && (!s || Math.hypot(me.A.x - cat.x, me.A.z - cat.z) < Math.hypot(me.A.x - s.ex, me.A.z - s.ez))) {
    // 고양이 쓰다듬기
    me.target = null; me.auto = null;
    me.A.ry = Math.atan2(cat.x - me.A.x, cat.z - me.A.z);
    me.petT = 3.6; me.petCat = cat.i;
    petCat(cat, true);
    lastPet = { c: cat.i, n: ++petN };
    sendPresence(true);
    setTimeout(() => mySay(pick(['귀여워 😻', '말랑말랑 🐾', '착하다 착해', '냐옹~'])), 600);
    return;
  }
  if (s) {
    me.target = null; me.auto = null;
    placeOnSeat(me.A, s);
    seatCamera(s);
    sendPresence(true);
    refreshContext(true);
  }
}
const nearMe = (A) => (me.A && A ? clamp(1.15 - Math.hypot(A.x - me.A.x, A.z - me.A.z) / 14, 0, 1) : 0);
function mySay(text, style = 'normal') {
  if (!me.A) return;
  say(me.A.P, text, 3.4, style);
  audio.pop();
  lastSay = { t: text, n: ++sayN };
  sendPresence(true);
}

function updatePlayer(dt) {
  const A = me.A;
  if (!A) return;
  // 입력 → 카메라 기준 이동 방향
  let ix = 0, iy = 0;
  if (keys.has('ArrowUp') || keys.has('KeyW')) iy += 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) iy -= 1;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) ix -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) ix += 1;
  if (joy.active) { ix += joy.x; iy += joy.y; }
  if (mode.modal) ix = iy = 0;
  let mag = Math.hypot(ix, iy);
  const run = keys.has('ShiftLeft') || keys.has('ShiftRight') || (joy.active && Math.hypot(joy.x, joy.y) > 0.92);
  if (mag > 0.05) { me.target = null; me.auto = null; }
  let wx = 0, wz = 0;
  if (mag > 0.05) {
    if (mag > 1) { ix /= mag; iy /= mag; mag = 1; }
    const fx = controls.target.x - camera.position.x, fz = controls.target.z - camera.position.z;
    const fl = Math.hypot(fx, fz) || 1;
    const nx = fx / fl, nz = fz / fl;
    wx = nx * iy - nz * ix; wz = nz * iy + nx * ix;
  } else {
    const goal = me.auto?.[0] || me.target;
    if (goal) {
      const dx = goal.x - A.x, dz = goal.z - A.z, d = Math.hypot(dx, dz);
      if (d < 0.18) {
        if (me.auto) { me.auto.shift(); if (!me.auto.length) { me.auto = null; onArrived(); } }
        else me.target = null;
      } else { wx = dx / d; wz = dz / d; mag = Math.min(1, d / 0.6 + 0.3); }
    }
  }
  if (A.seat && (wx || wz)) { leaveSeat(A); refreshContext(true); }
  if (A.seat) { A.vx = A.vz = 0; A.moving = false; return; }
  const speed = (run ? 4.3 : 2.5) * Math.min(1, mag);
  A.vx += (wx * speed - A.vx) * Math.min(1, dt * 10);
  A.vz += (wz * speed - A.vz) * Math.min(1, dt * 10);
  const sp = Math.hypot(A.vx, A.vz);
  const before = { x: A.x, z: A.z };
  const p = { x: A.x + A.vx * dt, z: A.z + A.vz * dt };
  resolveCollisions(p);
  // 그래도 겹치면(좁은 틈) 움직이지 않음 → 벽·가구 관통 불가
  if (!overlaps(p)) { A.x = p.x; A.z = p.z; } else { A.vx *= 0.3; A.vz *= 0.3; }
  // 막혔으면 클릭 목적지 포기 (벽에 비비지 않도록)
  if (me.target && sp > 0.5 && Math.hypot(A.x - before.x, A.z - before.z) < sp * dt * 0.15) me.target = null;
  A.y += (groundY(A.x, A.z) - A.y) * Math.min(1, dt * 14);
  if (sp > 0.15) {
    let d = Math.atan2(A.vx, A.vz) - A.ry;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    A.ry += d * Math.min(1, dt * 12);
  }
  const wasMoving = A.moving;
  A.moving = sp > 0.25;
  if (wasMoving !== A.moving) sendPresence(true);
  else if (A.moving) {
    const h = Math.atan2(A.vx, A.vz);
    if (Math.abs(Math.atan2(Math.sin(h - (A.lastSentH ?? h)), Math.cos(h - (A.lastSentH ?? h)))) > 0.5) { A.lastSentH = h; sendPresence(true); }
  }
  if (me.petT > 0) { me.petT -= dt; if (A.moving) me.petT = 0; }
  if (A.moving) A.P.actT = 0;
  A.P.state = A.moving ? 'walk' : A.P.actT > 0 ? A.P.actState : me.petT > 0 ? 'pet' : 'idle';
  A.P.walkRate = clamp(sp / 2.5, 0.6, 1.8);
  setInside(isInsideXZ(A.x, A.z));
}
function onArrived() {
  mode.playing = true;
  controls.enabled = true;
  refreshContext(true);
}

/* =========================================================================
   멀티플레이: room 캡ability (같이 접속한 사람들) — 없으면 혼자 동작
   ========================================================================= */
let room = null, myPeer = null;
const remotes = new Map();
let presenceDirty = false, presenceT = 0;
function sendPresence(force) {
  presenceDirty = true;
  if (force) presenceT = 1;
}
function flushPresence(dt) {
  presenceT += dt;
  if (!room || !me.A || !presenceDirty || presenceT < (RELAY.relay ? 0.15 : 0.1)) return;
  presenceT = 0; presenceDirty = false;
  const A = me.A;
  const data = {
    v: 1, n: me.name, d: me.design,
    x: Math.round(A.x * 100) / 100, z: Math.round(A.z * 100) / 100, r: Math.round(A.ry * 100) / 100,
    k: A.seat ? A.seat.id : null,
    h: A.P.holding ? 1 : 0,
    vx: A.seat ? 0 : Math.round(A.vx * 100) / 100, vz: A.seat ? 0 : Math.round(A.vz * 100) / 100,
  };
  if (lastSay) data.say = lastSay;
  if (lastPoke) data.poke = lastPoke;
  if (lastFx) data.fx = lastFx;
  if (lastPet) data.pet = lastPet;
  room.presence(data).catch(() => {});
}
const cleanText = (t, n) => String(t ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n);
function applyRemote(peer) {
  const pr = peer.presence || {};
  let R = remotes.get(peer.peer);
  if (pr.v !== 1) { if (R) { disposeAvatar(R.A); remotes.delete(peer.peer); } return; }
  const design = Number.isInteger(pr.d) && pr.d >= 0 && pr.d < DESIGNS.length ? pr.d : 0;
  const name = cleanText(pr.n, 10) || '방문자';
  if (R && (R.design !== design || R.name !== name)) { disposeAvatar(R.A); remotes.delete(peer.peer); R = null; }
  const num = (v, a, b) => (Number.isFinite(v) ? clamp(v, a, b) : 0);
  if (!R) {
    const A = makeAvatar(design, name, false);
    A.P.g.traverse((m) => { if (m.isMesh) clickables.push(m); });
    R = { A, design, name, peer: peer.peer, tx: num(pr.x, -110, 165), tz: num(pr.z, -30, 32), tr: num(pr.r, -10, 10), sayN: pr.say?.n, pokeN: pr.poke?.n, fxN: pr.fx?.n, petN: pr.pet?.n };
    A.x = R.tx; A.z = R.tz; A.ry = R.tr; A.y = groundY(A.x, A.z);
    remotes.set(peer.peer, R);
  }
  R.tx = num(pr.x, -110, 165); R.tz = num(pr.z, -30, 32); R.tr = num(pr.r, -10, 10);
  R.vx = num(pr.vx, -6, 6); R.vz = num(pr.vz, -6, 6); R.at = performance.now();
  if (!!pr.h !== !!R.A.P.holding) setHolding(R.A.P, !!pr.h);
  const seat = typeof pr.k === 'string' ? seatById.get(pr.k) : null;
  if (seat && R.A.seat !== seat) placeOnSeat(R.A, seat);
  else if (!seat && R.A.seat) { R.A.seat = null; setPose(R.A.P, 'stand'); R.A.P.paddle.visible = false; R.A.P.state = 'idle'; }
  // 말풍선
  if (pr.say && pr.say.n !== R.sayN) {
    R.sayN = pr.say.n;
    const t = cleanText(pr.say.t, 40);
    if (t) { say(R.A.P, t, 3.4, POKE_FROM.includes(t) || POKE_TO.includes(t) ? 'poke' : 'normal'); const v = nearMe(R.A) * 0.6; if (v > 0.05) audio.pop(v, 0.9); }
  }
  // 나를 찔렀나?
  // 고양이 쓰다듬기
  if (pr.pet && pr.pet.n !== R.petN) {
    R.petN = pr.pet.n;
    const C = cats[pr.pet.c];
    if (C) { petCat(C, false); R.petUntil = performance.now() + 3600; R.petCatI = C.i; }
  }
  // 불만창고 효과 (내용 없이 동작만 전달됨)
  if (pr.fx && pr.fx.n !== R.fxN) {
    R.fxN = pr.fx.n;
    if (pr.fx.k === 'st' && stations[pr.fx.s]) runStation(R.A, stations[pr.fx.s], ['ok', 'jam', 'run'].includes(pr.fx.r) ? pr.fx.r : 'ok', false);
    else if (pr.fx.k === 'sip') { startAct(R.A.P, 'sip', 1.2); playSfx('sip', R.A); }
    else if (pr.fx.k === 'burn') throwPaper(R.A);
    else if (pr.fx.k === 'rant') startRant(R.A.P, clamp(Number(pr.fx.d) || 3, 1.5, 12));
  }
  if (pr.poke && pr.poke.n !== R.pokeN) {
    R.pokeN = pr.poke.n;
    if (myPeer && pr.poke.to === myPeer && me.A && mode.playing) {
      me.A.P.hopT = 0.55;
      setTimeout(() => audio.pop(1, 1.5), 110);
      if (!me.A.seat) me.A.ry = Math.atan2(R.A.x - me.A.x, R.A.z - me.A.z);
      mySay(pick(POKE_TO), 'poke');
    }
  }
}
function onPeers(change) {
  const mine = change.peers.find((p) => p.sameTab);
  if (mine) myPeer = mine.peer;
  for (const p of change.left) { const R = remotes.get(p.peer); if (R) { disposeAvatar(R.A); remotes.delete(p.peer); } }
  for (const p of [...change.joined, ...change.updated]) if (!p.sameTab && p.kind === 'viewer') applyRemote(p);
  updateOnline();
}
/* ---------- 네트워크 상태 (실제 접속자 지연 확인) ---------- */
const NET = { peers: new Map(), sent: 0, firstFrom: [0, 0], t0: performance.now() };
function netPeer(id) { if (!NET.peers.has(id)) NET.peers.set(id, { rtt: [], times: [] }); return NET.peers.get(id); }
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const latClass = (ms) => (ms == null ? '' : ms < 300 ? 'good' : ms < 600 ? 'ok' : 'bad');
function renderNet() {
  const box = $('#netBody');
  if (!box || $('#netSheet').hidden) return;
  const now = performance.now();
  box.replaceChildren();
  const line = (cls, ...cells) => { const r = document.createElement('div'); r.className = 'net-row ' + (cls || ''); for (const c of cells) { const s = document.createElement('span'); s.textContent = c; r.appendChild(s); } box.appendChild(r); return r; };
  if (!RELAY.relay) {
    const p = document.createElement('p'); p.className = 'sheet-note';
    p.textContent = room ? 'claude.ai 아티팩트 연결을 쓰고 있어요. 지연 측정은 GitHub Pages 주소에서 볼 수 있어요.' : '멀티플레이에 연결되어 있지 않아요 (혼자 모드).';
    box.appendChild(p);
    return;
  }
  const names = ['HiveMQ', 'EMQX'];
  const tot = NET.firstFrom[0] + NET.firstFrom[1] || 1;
  line('net-head', '중계소', '상태', '먼저 도착');
  (RELAY.clients || []).forEach((c, i) => line(c.connected ? 'good' : 'bad', names[i], c.connected ? '연결됨' : '끊김', `${Math.round((100 * NET.firstFrom[i]) / tot)}%`));
  const secs = (now - NET.t0) / 1000;
  line('', '내가 보내는 횟수', `${(NET.sent / Math.max(1, secs)).toFixed(1)}/초`, '');
  line('net-head', '접속자', '왕복 지연', '받는 횟수 · 마지막');
  const all = [];
  for (const R of remotes.values()) {
    const P = NET.peers.get(R.peer) || { rtt: [], times: [] };
    P.times = P.times.filter((t) => now - t < 5000);
    const rtt = median(P.rtt); if (rtt != null) all.push(rtt);
    const last = P.times.length ? ((now - P.times[P.times.length - 1]) / 1000).toFixed(1) + '초 전' : '-';
    line(latClass(rtt), R.name, rtt == null ? '재는 중…' : `${Math.round(rtt)} ms`, `${(P.times.length / 5).toFixed(1)}/초 · ${last}`);
  }
  if (!remotes.size) line('', '다른 접속자가 없어요', '', '');
  const sum = $('#netSum');
  if (all.length) {
    const avg = all.reduce((a, b) => a + b, 0) / all.length, worst = Math.max(...all);
    sum.textContent = `평균 ${Math.round(avg)} ms · 가장 느린 사람 ${Math.round(worst)} ms — ${worst < 300 ? '끊김 없이 좋아요 👍' : worst < 600 ? '조금 늦지만 괜찮아요' : '느려요 (끊겨 보일 수 있어요)'}`;
    sum.className = 'net-sum ' + latClass(worst);
  } else { sum.textContent = '왕복 지연은 이 창을 열어 둔 동안 2초마다 재요.'; sum.className = 'net-sum'; }
}
setInterval(renderNet, 1000);
function updateOnline() {
  $('#online').textContent = `👥 ${remotes.size + (me.A ? 1 : 0)}명`;
}
function updateRemotes(dt) {
  for (const R of remotes.values()) {
    const A = R.A;
    if (A.seat) { syncAvatar(A); continue; }
    // 받은 위치 + 속도로 '지금쯤 여기 있겠지'를 예측해 따라가요 (중계 지연 보정)
    const age = Math.min(0.6, ((performance.now() - (R.at || 0)) / 1000) + (RELAY.relay ? 0.2 : 0.05));
    const px = R.tx + (R.vx || 0) * age, pz = R.tz + (R.vz || 0) * age;
    const p = { x: px, z: pz };
    if (R.vx || R.vz) resolveCollisions(p); // 예측이 벽을 넘지 않게
    const dx = p.x - A.x, dz = p.z - A.z, d = Math.hypot(dx, dz);
    if (d > 8) { A.x = p.x; A.z = p.z; }
    else { const k = Math.min(1, dt * 14); A.x += dx * k; A.z += dz * k; }
    const sp = Math.max(Math.hypot(R.vx || 0, R.vz || 0), d * 4);
    A.moving = sp > 0.35;
    A.P.state = A.moving ? 'walk' : A.P.actT > 0 ? A.P.actState : R.petUntil > performance.now() ? 'pet' : 'idle';
    A.P.walkRate = clamp(sp / 2.5, 0.6, 1.8);
    let dr = R.tr - A.ry; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    A.ry += dr * Math.min(1, dt * 10);
    A.y += (groundY(A.x, A.z) - A.y) * Math.min(1, dt * 14);
    syncAvatar(A);
  }
}
/* 아티팩트 밖(GitHub Pages 등)에서는 무료 공개 MQTT 중계소를 거쳐 주고받아요 (가입·서버 없음)
   두 곳(HiveMQ · EMQX)에 동시에 보내고 받은 쪽은 중복을 버려요 → 한 곳이 멈춰도 계속돼요 */
const RELAY = {
  brokers: ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'],
  base: 'bojangwon-gwanghwamun/v1/lobby/',
  status: 'connecting',
};
async function relayJoinRoom() {
  const mqtt = (await import('https://cdn.jsdelivr.net/npm/mqtt@5.16.0/dist/mqtt.esm.js')).default;
  const selfId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const topic = RELAY.base + selfId;
  const actions = {};
  const seen = new Map(); // peerId → { s, t }
  let seq = 0;
  const room = { selfId, onPeerJoin: null, onPeerLeave: null };
  const clients = RELAY.clients = RELAY.brokers.map((url) => mqtt.connect(url, {
    clientId: 'bjw_' + selfId + '_' + Math.random().toString(36).slice(2, 6),
    keepalive: 30, reconnectPeriod: 3000, connectTimeout: 9000, clean: true,
    will: { topic, payload: JSON.stringify({ a: '_bye' }), qos: 0, retain: false },
  }));
  const publish = (a, d) => {
    const msg = JSON.stringify({ a, s: ++seq, d });
    if (msg.length > 6000) return;
    for (const c of clients) if (c.connected) c.publish(topic, msg, { qos: 0 });
    NET.sent++;
  };
  const updateStatus = () => {
    const n = clients.filter((c) => c.connected).length;
    RELAY.status = n ? 'ok' : 'connecting';
    setNetBadge();
  };
  for (const c of clients) {
    c.on('connect', () => { c.subscribe(RELAY.base + '+', { qos: 0 }); publish('_hi'); updateStatus(); });
    c.on('close', updateStatus);
    c.on('offline', updateStatus);
    c.on('error', () => {});
    c.on('message', (t, buf) => {
      const id = t.slice(RELAY.base.length);
      if (!id || id === selfId || id.includes('/') || buf.length > 6000) return;
      let m; try { m = JSON.parse(new TextDecoder().decode(buf)); } catch (e) { return; }
      if (!m || typeof m.a !== 'string') return;
      if (m.a === '_bye') { if (seen.delete(id)) room.onPeerLeave?.(id); return; }
      const prev = seen.get(id);
      if (prev && typeof m.s === 'number' && m.s <= prev.s && m.a !== '_hi') return; // 다른 중계소에서 온 중복
      const isNew = !prev;
      seen.set(id, { s: typeof m.s === 'number' ? m.s : (prev?.s || 0), t: Date.now() });
      if (isNew || m.a === '_hi') room.onPeerJoin?.(id);
      if (m.a === 'pres') netPeer(id).times.push(performance.now());
      NET.firstFrom[RELAY.clients.indexOf(c)]++;
      if (m.a[0] !== '_') actions[m.a]?.onMessage?.(m.d, { peerId: id });
    });
  }
  // 살아 있다는 신호 (3초) · 10초 동안 소식 없으면 나간 걸로
  setInterval(() => {
    publish('_hb');
    const now = Date.now();
    for (const [id, v] of seen) if (now - v.t > 10000) { seen.delete(id); room.onPeerLeave?.(id); }
  }, 3000);
  room.makeAction = (name) => (actions[name] = { onMessage: null, send(data) { publish(name, data); } });
  room.leave = () => { publish('_bye'); for (const c of clients) c.end(true); };
  return room;
}
function setNetBadge() {
  const el = document.getElementById('online');
  if (!el || !room || !RELAY.relay) return;
  el.title = RELAY.status === 'ok' ? '멀티플레이 연결됨' : '멀티플레이 연결 중…';
  el.classList.toggle('net-wait', RELAY.status !== 'ok');
}
const P2P = { tr: null };
async function connectP2P() {
  const tr = await relayJoinRoom();
  RELAY.relay = true;
  const selfId = tr.selfId;
  P2P.tr = tr;
  const pres = tr.makeAction('pres');
  const peersMap = new Map();
  const subs = [];
  let mine = {};
  const mk = (id, presence, isMe) => Object.freeze({ peer: id, by: null, isMe, sameTab: isMe, kind: 'viewer', guest: false, presence: Object.freeze(presence), updatedAt: Date.now() });
  peersMap.set(selfId, mk(selfId, {}, true));
  const emit = (ch) => { const peers = [...peersMap.values()]; subs.forEach((f) => f({ peers, joined: ch.joined || [], left: ch.left || [], updated: ch.updated || [] })); };
  // 왕복 지연 재기: 3초마다 '핑' → 받은 사람이 '퐁' (내 시계로만 재서 정확해요)
  const ping = tr.makeAction('ping');
  ping.onMessage = (d, meta) => {
    const id = meta?.peerId;
    if (!id || !d || typeof d !== 'object') return;
    if (d.k === 'q' && typeof d.ts === 'number') ping.send({ k: 'r', to: d.from, ts: d.ts });
    else if (d.k === 'r' && d.to === selfId && typeof d.ts === 'number') {
      const rtt = performance.now() - d.ts;
      if (rtt >= 0 && rtt < 30000) { const P = netPeer(id); P.rtt.push(rtt); if (P.rtt.length > 10) P.rtt.shift(); }
    }
  };
  P2P.pingNow = () => ping.send({ k: 'q', from: selfId, ts: performance.now() });
  // 네트워크 창을 열어 둔 동안만 재요 (평소 부담 0)
  setInterval(() => { if (!document.getElementById('netSheet').hidden) ping.send({ k: 'q', from: selfId, ts: performance.now() }); }, 2000);
  pres.onMessage = (data, meta) => {
    const id = meta?.peerId;
    if (!id || !data || typeof data !== 'object' || Array.isArray(data)) return;
    if (JSON.stringify(data).length > 4096) return;
    const isNew = !peersMap.has(id);
    const p = mk(id, data, false);
    peersMap.set(id, p);
    emit(isNew ? { joined: [p] } : { updated: [p] });
  };
  tr.onPeerJoin = (id) => { pres.send(mine, { target: id }); };
  tr.onPeerLeave = (id) => {
    const p = peersMap.get(id);
    if (p) { peersMap.delete(id); emit({ left: [p] }); }
  };
  addEventListener('pagehide', () => { try { tr.leave(); } catch (e) { /* 무시 */ } });
  return {
    presence(patch) {
      mine = { ...mine, ...patch };
      for (const k of Object.keys(mine)) if (mine[k] === null) delete mine[k];
      peersMap.set(selfId, mk(selfId, mine, true));
      pres.send(mine);
      return Promise.resolve();
    },
    onPeers(f) { subs.push(f); setTimeout(() => emit({ joined: [...peersMap.values()] }), 0); return () => {}; },
  };
}
(async () => {
  try {
    if (window.claude?.use) {
      room = await window.claude.use('room');
      if (room) { room.onPeers(onPeers, () => { room = null; }); return; }
    }
    if (location.protocol === 'file:') return;
    room = await connectP2P();
    room.onPeers(onPeers);
  } catch (e) { console.warn('멀티플레이 연결 실패 — 혼자 모드로 계속해요', e); room = null; }
})();

/* =========================================================================
   상호작용: 클릭/탭 → 콕 찌르기 또는 그 자리로 걷기
   ========================================================================= */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPt = new THREE.Vector3();
let downXY = null;
const _tapV = new THREE.Vector3();
renderer.domElement.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downXY || !mode.playing) return;
  const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved > 8) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(clickables, false)[0];
  if (hit) {
    const R = [...remotes.values()].find((r) => r.A.P === hit.object.userData.person);
    if (R) { poke(R); return; }
  }
  // 캐릭터를 정확히 못 눌러도, 화면에서 가까우면 콕 찌르기
  {
    const rect = renderer.domElement.getBoundingClientRect();
    let best = null, bd = 46;
    for (const R of remotes.values()) {
      const v = _tapV.set(R.A.x, R.A.y + 0.85, R.A.z).project(camera);
      if (v.z > 1) continue;
      const d = Math.hypot((v.x + 1) / 2 * rect.width + rect.left - e.clientX, (1 - v.y) / 2 * rect.height + rect.top - e.clientY);
      if (d < bd) { bd = d; best = R; }
    }
    if (best) { poke(best); return; }
  }
  plane.constant = -me.A.y;
  if (raycaster.ray.intersectPlane(plane, hitPt) && hitPt.distanceTo(camera.position) < 40) {
    me.target = { x: hitPt.x, z: hitPt.z };
    me.auto = null;
  }
});
function nearestRemote(A, max = 1.8) {
  let best = null, bd = max;
  for (const R of remotes.values()) { const d = Math.hypot(R.A.x - A.x, R.A.z - A.z); if (d < bd) { bd = d; best = R; } }
  return best;
}
function poke(R) {
  pokeN++;
  lastPoke = { to: R.peer, n: pokeN };
  R.A.P.hopT = 0.45;
  if (!me.A.seat) me.A.ry = Math.atan2(R.A.x - me.A.x, R.A.z - me.A.z);
  me.A.P.waveT = 0.9;
  mySay(pick(POKE_FROM), 'poke');
  setTimeout(() => audio.pop(1, 1.5), 110);
}

/* =========================================================================
   UI: 입장 화면(닉네임 · 캐릭터), 조이스틱, 행동 버튼, 대사 버튼
   ========================================================================= */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 무시 */ } },
};
me.design = clamp(parseInt(store.get('bjw.design') ?? '', 10) || 0, 0, DESIGNS.length - 1);
$('#nick').value = store.get('bjw.nick') || '';
const THUMBS = [];
function renderThumbs() {
  const box = $('#designs');
  let r;
  try {
    r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (e) { r = null; }
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff4e8, 0x8a7060, 2.2));
  const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(1.5, 3, 3); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(28, 140 / 170, 0.1, 20);
  cam.position.set(0.9, 1.2, 3.1); cam.lookAt(0, 0.82, 0);
  if (r) {
    r.setPixelRatio(1); r.setSize(140, 170);
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  }
  DESIGNS.forEach((_d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'design';
    b.setAttribute('role', 'radio');
    b.dataset.i = i;
    b.setAttribute('aria-label', `캐릭터 ${i + 1}`);
    if (r) {
      const P = makePerson(i, { cast: false });
      P.blob.visible = false;
      P.arms[0].rotation.z = -0.35; P.arms[1].rotation.z = 0.35;
      sc.add(P.g);
      r.render(sc, cam);
      const img = document.createElement('img');
      img.alt = '';
      img.src = r.domElement.toDataURL('image/png');
      THUMBS[i] = img.src;
      b.appendChild(img);
      sc.remove(P.g);
    }
    b.addEventListener('click', () => pickDesign(i));
    box.appendChild(b);
  });
  if (r) { r.dispose(); r.forceContextLoss?.(); }
  pickDesign(me.design);
}
function pickDesign(i) {
  me.design = i;
  document.querySelectorAll('.design').forEach((b) => {
    const on = Number(b.dataset.i) === i;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}
async function enterGame() {
  const raw = cleanText($('#nick').value, 10).trim();
  me.name = raw || `방문자${Math.floor(rand(100, 999))}`;
  store.set('bjw.nick', raw);
  store.set('bjw.design', String(me.design));
  $('#nick').blur();
  $('#intro').classList.add('hidden');
  audio.start();
  controls.autoRotate = false;
  controls.enabled = false;
  me.A = makeAvatar(me.design, me.name, true);
  Object.assign(me.A, { x: 0, z: 3.6, ry: Math.PI, y: 0.152 });
  seats.forEach((s) => seatById.set(s.id, s));
  syncAvatar(me.A);
  updateOnline();
  mode.playing = true;
  // 회사로 걸어 들어가기 (아무 키나 누르거나 행동하면 바로 조작)
  me.auto = [{ x: 0, z: 1.2 }, { x: 0, z: -4.2 }];
  cameraBehind(1.8);
  ['#brand', '#topbtns', '#actions'].forEach((s) => $(s).classList.remove('hidden'));
  if (isTouch) $('#joy').classList.remove('hidden');
  $('#hint').textContent = isTouch ? '왼쪽 핸들로 이동 · 친구를 탭하면 콕 찌르기 👉' : '방향키·WASD 이동 · Shift 달리기 · E 행동 · 드래그로 시점 · 친구 클릭은 콕!';
  $('#hint').classList.remove('hidden');
  setTimeout(() => $('#hint').classList.add('hidden'), 7000);
  controls.enabled = true;
  mode.playing = true;
  sendPresence(true);
  refreshContext(true);
}
$('#enter').addEventListener('click', enterGame);
$('#nick').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('#enter').disabled) enterGame(); });
$('#music').addEventListener('click', () => {
  music.on = !music.on;
  $('#music').classList.toggle('off', !music.on);
  $('#music').setAttribute('aria-pressed', music.on ? 'true' : 'false');
  if (music.on) audio.start();
  if (music.cur && audio.ctx) music.cur.gain.gain.setTargetAtTime(music.on ? music.cur.tr.vol : 0, audio.ctx.currentTime, 0.4);
});
$('#tp').addEventListener('click', () => $('#tpPanel').classList.toggle('hidden'));
Object.entries(SPOTS).forEach(([k, s]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = s.label;
  b.addEventListener('click', () => { teleport(k); $('#tpPanel').classList.add('hidden'); });
  $('#tpPanel').appendChild(b);
});
$('#act').addEventListener('click', doAction);

/* ---------- 캐릭터 바꾸기 ---------- */
function openCharSheet() {
  const box = $('#charPick'); box.replaceChildren();
  DESIGNS.forEach((_d, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'design'; b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', `캐릭터 ${i + 1}`);
    b.setAttribute('aria-checked', i === me.design ? 'true' : 'false');
    if (i === me.design) b.classList.add('on');
    if (THUMBS[i]) { const img = document.createElement('img'); img.alt = ''; img.src = THUMBS[i]; b.appendChild(img); }
    b.addEventListener('click', () => { changeCharacter(i); closeCharSheet(); });
    box.appendChild(b);
  });
  $('#charSheet').hidden = false; mode.modal = true; keys.clear();
}
function closeCharSheet() { $('#charSheet').hidden = true; mode.modal = false; refreshContext(false); }
function changeCharacter(i) {
  if (!me.A || i === me.design) return;
  const old = me.A;
  me.design = i;
  store.set('bjw.design', String(i));
  const A = makeAvatar(i, me.name, true);
  Object.assign(A, { x: old.x, z: old.z, y: old.y, ry: old.ry, vx: 0, vz: 0 });
  if (old.seat) placeOnSeat(A, old.seat);
  if (old.P.holding) setHolding(A.P, true);
  disposeAvatar(old);
  me.A = A;
  syncAvatar(A);
  A.P.hopT = 0.5;
  sendPresence(true);
  mySay(pick(['짜잔! ✨', '변신 완료!', '어때요? 😎']));
}
$('#char').addEventListener('click', openCharSheet);
const openNet = () => { $('#netSheet').hidden = false; mode.modal = true; keys.clear(); renderNet(); P2P.pingNow?.(); };
$('#brand').addEventListener('click', openNet);
$('#brand').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNet(); } });
document.querySelector('.net-close').addEventListener('click', () => { $('#netSheet').hidden = true; mode.modal = false; });
$('#netSheet').addEventListener('click', (e) => { if (e.target === $('#netSheet')) { $('#netSheet').hidden = true; mode.modal = false; } });
document.querySelector('.char-cancel').addEventListener('click', closeCharSheet);
$('#charSheet').addEventListener('click', (e) => { if (e.target === $('#charSheet')) closeCharSheet(); });

/* ---------- 사진 찍기 (스크린샷) ---------- */
let shotPending = null;
let downloadsCap;
function takePhoto() {
  const flash = $('#flash');
  flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  audio.pop(0.8, 1.9);
  shotPending = async (blob) => {
    if (!blob) return;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const filename = `보장원_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
    const url = URL.createObjectURL(blob);
    $('#shotImg').src = url;
    $('#shotSheet').hidden = false; mode.modal = true; keys.clear();
    $('#shotInfo').textContent = '';
    const save = $('#shotSave');
    save.onclick = async () => {
      try {
        if (downloadsCap === undefined) downloadsCap = window.claude?.use ? await window.claude.use('downloads') : null;
        if (downloadsCap) { await downloadsCap.save({ filename, data: blob }); $('#shotInfo').textContent = '사진을 저장했어요 📸'; }
        else { const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); $('#shotInfo').textContent = '사진을 저장했어요 📸'; }
      } catch (e) {
        $('#shotInfo').textContent = e?.code === 'declined' ? '저장을 취소했어요.' : '여기서는 저장할 수 없어요. 사진을 길게 눌러(또는 오른쪽 클릭) 저장해 주세요.';
      }
    };
  };
}
function closeShot() { $('#shotSheet').hidden = true; mode.modal = false; const u = $('#shotImg').src; if (u.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(u), 1000); refreshContext(false); }
$('#shot').addEventListener('click', takePhoto);
document.querySelector('.shot-close').addEventListener('click', closeShot);
$('#shotSheet').addEventListener('click', (e) => { if (e.target === $('#shotSheet')) closeShot(); });
$('#talk').addEventListener('click', () => {
  const open = $('#phrases').hidden;
  $('#phrases').hidden = !open;
  $('#talk').setAttribute('aria-expanded', open ? 'true' : 'false');
  $('#talk').textContent = open ? '💬 대화 닫기' : '💬 대화하기';
});

// 불만창고 입력: 내용은 어디에도 저장·전송되지 않고, 버튼을 누르는 즉시 지워져요
const ventUI = { wrap: $('#vent'), text: document.querySelector('.vent-text'), kind: '' };
function openVent(kind) {
  if (!me.A) return;
  ventUI.kind = kind;
  $('#ventTitle').textContent = kind === 'burn' ? '스트레스 적기' : '임금님 귀는 당나귀 귀';
  document.querySelector('.sheet-go').textContent = kind === 'burn' ? '🔥 벽난로에 던지기' : '🗯️ 마구 외치기';
  ventUI.text.placeholder = kind === 'burn' ? '오늘 나를 힘들게 한 일을 적어 보세요' : '하고 싶은 말을 마구 쏟아내세요';
  ventUI.text.value = '';
  ventUI.wrap.hidden = false;
  mode.modal = true;
  keys.clear();
  refreshContext(false);
  setTimeout(() => ventUI.text.focus(), 30);
}
function closeVent() {
  ventUI.text.value = '';
  ventUI.wrap.hidden = true;
  mode.modal = false;
  ventUI.text.blur();
  refreshContext(false);
}
function submitVent() {
  const len = ventUI.text.value.trim().length;
  if (!len) {
    const sh = document.querySelector('.sheet');
    sh.classList.remove('shake'); void sh.offsetWidth; sh.classList.add('shake');
    return;
  }
  const kind = ventUI.kind;
  closeVent(); // 내용 즉시 삭제
  if (kind === 'burn') {
    throwPaper(me.A);
    // 종이가 불 속으로 날아가는 모습을 잠깐 보여 주고 다시 내 자리로
    flyTo(new THREE.Vector3(-14.0, 2.2, -0.75), new THREE.Vector3(-17.4, 0.9, -2.5), 0.6);
    setTimeout(() => { if (me.A.seat?.kind === 'write' && !mode.modal) seatCamera(me.A.seat); }, 2600);
    lastFx = { k: 'burn', n: ++fxN };
    setTimeout(() => mySay('활활 타라~ 🔥'), 900);
  } else {
    const d = clamp(len * 0.12, 2.5, 12);
    startRant(me.A.P, d);
    lastFx = { k: 'rant', n: ++fxN, d: Math.round(d * 10) / 10 };
  }
  sendPresence(true);
}
$('#act2').addEventListener('click', () => {
  const k = $('#act2').dataset.k;
  if (k === 'sip') { startAct(me.A.P, 'sip', 1.2); playSfx('sip', me.A); lastFx = { k: 'sip', n: ++fxN }; sendPresence(true); if (Math.random() < 0.5) setTimeout(() => mySay(pick(['캬~ 좋다', '후루룩 ☕', '살 것 같다'])), 700); }
  else openVent(k);
});
document.querySelector('.sheet-go').addEventListener('click', submitVent);
document.querySelector('.sheet-cancel').addEventListener('click', closeVent);
ventUI.wrap.addEventListener('click', (e) => { if (e.target === ventUI.wrap) closeVent(); });
ventUI.text.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeVent();
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitVent();
});
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (!mode.playing || mode.modal) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { if (!e.repeat) doAction(); return; }
  if (/^Digit[1-9]$/.test(e.code)) { const b = document.querySelectorAll('#phrases button')[Number(e.code.slice(5)) - 1]; b?.click(); return; }
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// 조이스틱 (휴대폰)
{
  const pad = $('#joy'), knob = $('#knob');
  let id = null, cx = 0, cy = 0;
  const R = 46;
  pad.addEventListener('pointerdown', (e) => {
    id = e.pointerId; pad.setPointerCapture(id);
    const r = pad.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    move(e);
  });
  const move = (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / R; joy.y = -dy / R; joy.active = true;
  };
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null; joy.active = false; joy.x = joy.y = 0;
    knob.style.transform = '';
  };
  pad.addEventListener('pointermove', move);
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
}

// 상황에 맞는 행동 버튼 + 대사 버튼
let ctxKey = '';
function phraseKey() {
  const A = me.A;
  if (!A) return '';
  if (A.seat) return SEAT_INFO[A.seat.kind].ph;
  if (inVent(A.x, A.z)) return 'vent';
  if (isInsideXZ(A.x, A.z)) return 'office';
  return A.z > 24.5 ? 'food' : 'street';
}
function refreshContext(force) {
  if (!me.A) return;
  const A = me.A;
  const s = A.seat ? null : nearestFreeSeat();
  const cat = A.seat ? null : nearestCat(A);
  const catFirst = cat && (!s || Math.hypot(A.x - cat.x, A.z - cat.z) < Math.hypot(A.x - s.ex, A.z - s.ez));
  const stn = nearestStation(A, A.P.holding);
  const buddy = A.seat || stn ? null : nearestRemote(A);
  const label = A.seat ? '🚶 일어나기' : stn ? stationLabel(stn) : buddy ? `👉 ${buddy.name} 콕 찌르기` : catFirst ? '🐱 쓰다듬기' : s ? SEAT_INFO[s.kind].label : '';
  const act = $('#act');
  if (act.textContent !== label) act.textContent = label;
  act.hidden = !label;
  const k2 = A.seat?.kind === 'write' ? 'burn' : A.seat?.kind === 'rant' ? 'rant' : A.P.holding ? 'sip' : '';
  const act2 = $('#act2');
  if (act2.dataset.k !== k2) { act2.dataset.k = k2; act2.textContent = { burn: '✍️ 스트레스 적기', rant: '🗯️ 마구 외치기', sip: '☕ 한 모금' }[k2] || ''; }
  act2.hidden = !k2 || mode.modal;
  const k = phraseKey();
  if (!force && k === ctxKey) return;
  ctxKey = k;
  const box = $('#phrases');
  box.replaceChildren();
  (PHRASES[k] || []).forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t;
    if (!isTouch && i < 9) b.title = `키보드 ${i + 1}`;
    b.addEventListener('click', () => mySay(t));
    box.appendChild(b);
  });
}

function onResize() {
  const a = innerWidth / innerHeight;
  camera.aspect = a;
  camera.fov = a < 0.8 ? 68 : a < 1.2 ? 60 : 52;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer?.setSize(innerWidth, innerHeight);
}
addEventListener('resize', onResize);

/* =========================================================================
   업무공간 포스터 벽 — 벽돌 벽 그림에 포스터를 함께 그려 넣어 벽과 한 몸이에요
   ========================================================================= */
const POSTER_WALL = { x0: -11.5, x1: 2.5 }; // 회의실 옆 유리벽 ~ 수면실 벽 사이 뒷벽
const BRICK_TILE = 2.6, BRICK_TINT = '#f2e2d4';
function drawPoster(kind, c, W, H) {
  const T = (txt, x, y, size, color, weight = 800, align = 'center') => { c.fillStyle = color; c.font = `${weight} ${size}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(txt, x, y); };
  if (kind === 'cheer') {
      c.fillStyle = '#c9e8dc'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(W * 0.5, H * 0.36, W * 0.3, 0, 7); c.fill();
      T('오늘도', W / 2, H * 0.3, W * 0.13, '#2f6b4f');
      T('수고했어요', W / 2, H * 0.44, W * 0.13, '#2f6b4f');
      T('☺', W / 2, H * 0.66, W * 0.22, '#e0703c', 400);
      T('물 한 잔 · 스트레칭 한 번', W / 2, H * 0.88, W * 0.06, '#3e7c74', 600);
  } else if (kind === 'lunch') {
      c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#f2b33d'; c.fillRect(0, 0, W, H * 0.16);
      T('🍚 오늘 점심 뭐 먹지?', W / 2, H * 0.08, W * 0.08, '#3b2a22');
      const menu = [['칼국수', 5], ['떡볶이', 7], ['국밥', 4], ['피자', 3], ['샐러드', 2]];
      menu.forEach(([m, n], i) => {
        const y = H * (0.27 + i * 0.14);
        T(m, W * 0.1, y, W * 0.075, '#2b2230', 600, 'left');
        c.strokeStyle = '#d6452f'; c.lineWidth = W * 0.008;
        for (let k = 0; k < n; k++) { const x = W * 0.55 + (k % 5) * W * 0.05 + Math.floor(k / 5) * W * 0.3; c.beginPath(); if (k % 5 === 4) { c.moveTo(x - W * 0.22, y + W * 0.02); c.lineTo(x + W * 0.01, y - W * 0.03); } else { c.moveTo(x, y - W * 0.035); c.lineTo(x, y + W * 0.035); } c.stroke(); }
      });
  } else if (kind === 'sports') {
      c.fillStyle = '#2f6fd6'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) c.fillRect(0, H * (0.6 + i * 0.07), W, H * 0.02);
      c.fillStyle = '#f2b33d'; c.beginPath(); c.moveTo(W * 0.32, H * 0.18); c.lineTo(W * 0.68, H * 0.18); c.quadraticCurveTo(W * 0.68, H * 0.42, W * 0.5, H * 0.45); c.quadraticCurveTo(W * 0.32, H * 0.42, W * 0.32, H * 0.18); c.fill();
      c.fillRect(W * 0.46, H * 0.44, W * 0.08, H * 0.06); c.fillRect(W * 0.38, H * 0.5, W * 0.24, H * 0.04);
      T('보장원 체육대회', W / 2, H * 0.08, W * 0.095, '#fff');
      T('탁구 · 줄다리기 · 계주', W / 2, H * 0.56, W * 0.06, '#fff', 600);
  } else {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#1e8c5a'; c.fillRect(0, 0, W, H * 0.22);
      T('공지', W / 2, H * 0.11, W * 0.13, '#fff');
      T('퇴근 전 모니터 끄기', W / 2, H * 0.42, W * 0.08, '#2b2230', 600);
      T('탕비실 컵은 제자리에', W / 2, H * 0.58, W * 0.08, '#2b2230', 600);
      T('프린터가 화나면 살살 달래기', W / 2, H * 0.74, W * 0.07, '#2b2230', 600);
      T('— 총무팀', W * 0.9, H * 0.9, W * 0.06, '#6e5f62', 400, 'right');
  }
}
// 벽돌 무늬를 실제 벽과 같은 위치·간격으로 이어 그려요
function tileBrick(c, img, W, H, PX, x0, wallX0, tint) {
  const tile = BRICK_TILE * PX;
  const i0 = Math.floor((x0 - wallX0) / BRICK_TILE);
  for (let i = i0; (wallX0 + i * BRICK_TILE - x0) * PX < W; i++) {
    const dx = (wallX0 + i * BRICK_TILE - x0) * PX;
    for (let k = 0; H - k * tile > 0; k++) c.drawImage(img, dx, H - (k + 1) * tile, tile, tile);
  }
  if (tint) { c.globalCompositeOperation = 'multiply'; c.fillStyle = tint; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
}
function buildPosterWall(g, wallX0, wallZ, ceil) {
  const { x0, x1 } = POSTER_WALL, PX = 200;
  const W = Math.round((x1 - x0) * PX), H = Math.round(ceil * PX);
  const T = pbrTex.red_brick_03;
  // 반듯하게 한 줄로 (윗선 맞춤) — [종류, 왼쪽 x(m, 벽 구간 기준), 폭, 높이]
  const TOP = 2.95;
  const posters = [['cheer', 3.41, 1.24, 1.65], ['lunch', 5.0, 1.29, 1.65], ['sports', 6.64, 1.21, 1.65], ['notice', 8.2, 1.6, 1.3]];
  const rectPx = ([, lx, w, h]) => [lx * PX, (ceil - TOP) * PX, w * PX, h * PX];
  const map = canvasTex(W, H, (c) => {
    if (T?.diff?.image) tileBrick(c, T.diff.image, W, H, PX, x0, wallX0, BRICK_TINT); else { c.fillStyle = '#c8806a'; c.fillRect(0, 0, W, H); }
    // 포스터 (벽에 딱 붙은 종이 + 아주 얇은 그림자)
    for (const p of posters) {
      const [x, y, w, h] = rectPx(p);
      c.fillStyle = 'rgba(40,20,20,0.28)'; c.fillRect(x + 3, y + 4, w, h);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.translate(x, y); drawPoster(p[0], c, w, h); c.restore();
    }
  });
  let normalMap = null;
  if (T?.nor?.image) {
    normalMap = canvasTex(W, H, (c) => {
      tileBrick(c, T.nor.image, W, H, PX, x0, wallX0, null);
      c.fillStyle = 'rgb(128,128,255)'; // 포스터 부분은 평평하게
      for (const p of posters) { const [x, y, w, h] = rectPx(p); c.fillRect(x, y, w, h); }
    }, false);
  }
  const m = new THREE.MeshStandardMaterial({ map, normalMap, roughness: 1 });
  addWallPlane(g, x1 - x0, ceil, m, (x0 + x1) / 2, ceil / 2, wallZ);
}

/* =========================================================================
   업무공간 꾸미기: 회의실 · 탕비코너 · 프린터 3대 · 파쇄기 · 책상 꾸미기
   ========================================================================= */
const stations = [];
const printers = [];
const flyers = [];
const shredder = { strips: [], sheet: null, t: 0 };
function addStation(kind, sx, sz, face, o = {}) { const st = { kind, x: sx, z: sz, face, busyUntil: 0, ...o }; st.id = stations.length; stations.push(st); return st; }

/* ---------- 책상 소품 ---------- */
const SCREEN_EXTRA = [
  canvasTex(256, 160, (c, w, h) => { // 고양이 사진
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe3c4'); g.addColorStop(1, '#f2b38a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e9a35a'; c.beginPath(); c.ellipse(128, 112, 62, 42, 0, 0, 7); c.fill(); c.beginPath(); c.arc(128, 70, 36, 0, 7); c.fill();
    c.beginPath(); c.moveTo(98, 50); c.lineTo(104, 22); c.lineTo(120, 42); c.fill(); c.beginPath(); c.moveTo(158, 50); c.lineTo(152, 22); c.lineTo(136, 42); c.fill();
    c.fillStyle = '#2b2230'; for (const x of [114, 142]) { c.beginPath(); c.arc(x, 68, 5, 0, 7); c.fill(); }
    c.fillStyle = '#e06b7a'; c.beginPath(); c.arc(128, 80, 4, 0, 7); c.fill();
  }),
  canvasTex(256, 160, (c, w, h) => { // 바다 풍경
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9ad0f0'); g.addColorStop(0.55, '#ffe0b0'); g.addColorStop(0.56, '#2f7fb8'); g.addColorStop(1, '#1d5a8a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff3c0'; c.beginPath(); c.arc(190, 70, 18, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for (let y = 100; y < h; y += 12) { c.beginPath(); c.moveTo(20, y); c.lineTo(236, y); c.stroke(); }
  }),
].map((t) => new THREE.MeshBasicMaterial({ map: t }));
const SCREENS = [['code', '코드'], ['chart', '차트'], ['sheet', '엑셀'], ['call', '화상회의'], ['cat', '고양이'], ['sea', '바다']];
const screenMat = (k) => { const i = SCREENS.findIndex((s) => s[0] === k); return i < 0 ? null : i < 4 ? screenMats[i] : SCREEN_EXTRA[i - 4]; };
const DECOR_ITEMS = [['none', '없음'], ['plant', '화분 🪴'], ['cactus', '선인장 🌵'], ['bear', '곰인형 🧸'], ['duck', '고무오리 🦆'], ['cat', '고양이 🐱'], ['frame', '액자 🖼️'], ['trophy', '트로피 🏆'], ['books', '책 📚'], ['flower', '꽃병 💐']];
const MUG_COLORS = [null, 0xffffff, 0xe8774a, 0xf2b84b, 0x6aa7a0, 0x8f6fb5, 0xe06b7a];
const CHAIR_COLORS = [0x33363b, 0xd2693c, 0x3e7c74, 0xe9b949, 0x6a9be0, 0xe889a0];
const FRAME_TEX = canvasTex(64, 80, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffcf9a'); g.addColorStop(1, '#e07a8a'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2a30'; for (const x of [24, 42]) { c.beginPath(); c.arc(x, 46, 7, 0, 7); c.fill(); c.fillRect(x - 8, 54, 16, 26); } c.fillStyle = '#ff6b8a'; c.font = '16px sans-serif'; c.fillText('♥', 26, 26); });
function deskItem(kind) {
  const g = new THREE.Group();
  if (kind === 'plant') addModel(g, 'potted_plant_02_1k', 0.32, 0, 0, 0, rand(0, 6));
  else if (kind === 'duck') addModel(g, 'rubber_duck_toy_1k', 0.1, 0, 0, 0, rand(-0.8, 0.8));
  else if (kind === 'cat') addModel(g, 'concrete_cat_statue_1k', 0.2, 0, 0, 0, 0.6);
  else if (kind === 'bear') makeBear(g, 0, 0, 0, 0.2, 0.3, 0xc9935e);
  else if (kind === 'cactus') {
    addCyl(g, 0.05, 0.07, std(0xc96f4a), 0, 0.035, 0);
    const gm = std(0x5f9a4b, { roughness: 0.7 });
    addMesh(g, new THREE.CapsuleGeometry(0.03, 0.09, 4, 10), gm, 0, 0.13, 0);
    addMesh(g, new THREE.CapsuleGeometry(0.016, 0.04, 3, 8), gm, 0.035, 0.14, 0, 1, 1, 1, { rz: -0.7 });
    addSph(g, 0.015, std(0xff8ab0), 0, 0.2, 0);
  } else if (kind === 'frame') {
    addBox(g, 0.13, 0.16, 0.015, std(0x8a5a3a), 0, 0.085, 0, { rx: -0.18 });
    addWallPlane(g, 0.105, 0.135, new THREE.MeshBasicMaterial({ map: FRAME_TEX }), 0, 0.087, 0.01).rotation.x = -0.18;
  } else if (kind === 'trophy') {
    const gold = new THREE.MeshStandardMaterial({ color: 0xe0b040, metalness: 1, roughness: 0.25, envMap });
    addBox(g, 0.08, 0.03, 0.08, std(0x3a2a20), 0, 0.015, 0);
    addCyl(g, 0.012, 0.05, gold, 0, 0.055, 0);
    addMesh(g, new THREE.CylinderGeometry(0.045, 0.02, 0.07, 16), gold, 0, 0.115, 0);
  } else if (kind === 'books') {
    [0xd65d6c, 0x2c3e66, 0xf2b84b].forEach((c, i) => addBox(g, 0.18 - i * 0.02, 0.035, 0.13, std(c), 0, 0.018 + i * 0.036, 0, { ry: (i - 1) * 0.15 }));
  } else if (kind === 'flower') {
    addModel(g, 'ceramic_vase_01_1k', 0.14, 0, 0, 0);
    for (let i = 0; i < 4; i++) addSph(g, 0.022, std(pick([0xff8ab0, 0xffd34d, 0xff6b5a, 0xf4efe6])), rand(-0.03, 0.03), 0.16 + rand(0, 0.04), rand(-0.03, 0.03));
  }
  return g;
}
function plateTex(text) {
  return canvasTex(256, 64, (c, w, h) => {
    c.fillStyle = '#7a4e33'; roundRect(c, 0, 0, w, h, 10); c.fill();
    c.fillStyle = '#fff1d6'; c.font = `800 38px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 2);
  });
}
function applyDecor(key, d) {
  const D = desks.get(key);
  if (!D) return;
  D.slots.forEach((sl) => { while (sl.children.length) sl.remove(sl.children[0]); });
  if (!d) {
    D.defaults.forEach((list, i) => list.forEach((m) => D.slots[i].add(m)));
    D.screen.material = D.screenBase;
    D.chairMat.color.setHex(D.chairBase);
    D.mug.visible = D.mugBase.v; D.mug.material.color.setHex(D.mugBase.c);
    D.plate.visible = false;
    return;
  }
  [d.l, d.r].forEach((k, i) => { if (k && k !== 'none') D.slots[i].add(deskItem(k)); });
  D.screen.material = screenMat(d.scr) || D.screenBase;
  D.chairMat.color.setHex(CHAIR_COLORS[d.chair] ?? D.chairBase);
  const mc = MUG_COLORS[d.mug];
  D.mug.visible = !!mc; if (mc) D.mug.material.color.setHex(mc);
  if (d.plate && d.nick) {
    D.plate.material.map?.dispose();
    D.plate.material.map = plateTex(d.nick); D.plate.material.needsUpdate = true;
    D.plate.visible = true;
  } else D.plate.visible = false;
}
/* ---------- 효과음 (톤 위주 · 고음 잡음 없음) ---------- */
function toneAM(ctx, out, t, dur, type, f, amHz, depth, lpf, v) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = lpf;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.06); g.gain.setValueAtTime(v, t + dur - 0.12); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const am = ctx.createGain(); am.gain.value = 1 - depth;
  const lfo = ctx.createOscillator(); lfo.frequency.value = amHz; const lg = ctx.createGain(); lg.gain.value = depth;
  lfo.connect(lg); lg.connect(am.gain);
  o.connect(lp); lp.connect(am); am.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
  return o;
}
function beep(ctx, out, t, f, d = 0.09, v = 0.18) { const o = osc(ctx, 'sine', f, t, t + d + 0.05); const g = env(ctx, t, v, 0.005, d); o.connect(g); g.connect(out); }
function softNoise(ctx, out, t, dur, bp, v) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = bp; f.Q.value = 0.8;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(lp); lp.connect(g); g.connect(out); src.start(t, Math.random() * 1.5, dur + 0.05);
}
const SFX = {
  brew(ctx, out, t) { // 원두 갈고 → 졸졸 → 띵
    toneAM(ctx, out, t, 0.9, 'sawtooth', 150, 23, 0.6, 650, 0.12);
    for (let i = 0; i < 14; i++) { const tt = t + 1.0 + i * 0.1 + hash(i, 2) * 0.04; const f = 240 + hash(i, 4) * 160; const o = osc(ctx, 'sine', f, tt, tt + 0.09); o.frequency.exponentialRampToValueAtTime(f * 1.45, tt + 0.06); const g = env(ctx, tt, 0.09, 0.004, 0.06); o.connect(g); g.connect(out); }
    beep(ctx, out, t + 2.55, 1320, 0.5, 0.12); beep(ctx, out, t + 2.55, 1760, 0.4, 0.06);
  },
  crunch(ctx, out, t) { // 와삭와삭 4번
    for (let b = 0; b < 4; b++) {
      const tt = t + b * 0.42;
      for (let k = 0; k < 3; k++) softNoise(ctx, out, tt + k * 0.035, 0.05, 1300 + k * 400, 0.28);
      const o = osc(ctx, 'sine', 170, tt, tt + 0.12); o.frequency.exponentialRampToValueAtTime(80, tt + 0.1); const g = env(ctx, tt, 0.18, 0.003, 0.09); o.connect(g); g.connect(out);
    }
  },
  sip(ctx, out, t) { for (let i = 0; i < 5; i++) { const tt = t + i * 0.07; const o = osc(ctx, 'sine', 230 + i * 25, tt, tt + 0.08); o.frequency.exponentialRampToValueAtTime(380 + i * 30, tt + 0.06); const g = env(ctx, tt, 0.08, 0.004, 0.06); o.connect(g); g.connect(out); } },
  thunk(ctx, out, t) { const o = osc(ctx, 'sine', 190, t, t + 0.25); o.frequency.exponentialRampToValueAtTime(55, t + 0.18); const g = env(ctx, t, 0.4, 0.003, 0.18); o.connect(g); g.connect(out); softNoise(ctx, out, t, 0.06, 900, 0.12); },
  print(ctx, out, t, r) {
    beep(ctx, out, t, 1500, 0.07, 0.14);
    if (r === 'ok') { toneAM(ctx, out, t + 0.15, 2.0, 'square', 110, 8, 0.7, 480, 0.08); beep(ctx, out, t + 2.3, 1200, 0.08, 0.12); beep(ctx, out, t + 2.45, 1600, 0.12, 0.12); }
    else if (r === 'jam') { toneAM(ctx, out, t + 0.15, 0.7, 'square', 110, 8, 0.7, 480, 0.08); const o = osc(ctx, 'sawtooth', 90, t + 0.85, t + 1.15); const g = env(ctx, t + 0.85, 0.12, 0.01, 0.25); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; o.connect(lp); lp.connect(g); g.connect(out); for (let i = 0; i < 6; i++) beep(ctx, out, t + 1.2 + i * 0.28, i % 2 ? 1150 : 1750, 0.16, 0.14); }
    else { const o = toneAM(ctx, out, t + 0.15, 3.6, 'square', 110, 13, 0.7, 520, 0.09); o.frequency.linearRampToValueAtTime(190, t + 3.5); for (let i = 0; i < 10; i++) { const tt = t + 0.4 + i * 0.32; const p = osc(ctx, 'sine', 600, tt, tt + 0.1); p.frequency.exponentialRampToValueAtTime(1400, tt + 0.06); const g = env(ctx, tt, 0.1, 0.003, 0.06); p.connect(g); g.connect(out); } }
  },
  shred(ctx, out, t) { // 갈갈갈
    toneAM(ctx, out, t, 2.0, 'sawtooth', 72, 15, 0.75, 1100, 0.2);
    toneAM(ctx, out, t, 2.0, 'square', 146, 15, 0.6, 900, 0.07);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const am = ctx.createGain(); am.gain.value = 0.3; const lfo = osc(ctx, 'sine', 15, t, t + 2.1); const lg = ctx.createGain(); lg.gain.value = 0.3; lfo.connect(lg); lg.connect(am.gain);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.1); g.gain.setValueAtTime(0.16, t + 1.85); g.gain.linearRampToValueAtTime(0.0001, t + 2.0);
    src.connect(lp); lp.connect(am); am.connect(g); g.connect(out); src.start(t, 0.2, 2.1);
  },
};
function playSfx(name, A, ...args) {
  const v = A === me.A ? 1 : nearMe(A);
  if (v > 0.05) audio.sfx(SFX[name], v, ...args);
}

/* ---------- 만들기 ---------- */
function buildWorkExtras() {
  const g = interior;
  const CEIL = GF - 0.15;
  const glassIn = new THREE.MeshStandardMaterial({ color: 0xcfe3ec, transparent: true, opacity: 0.22, metalness: 0.6, roughness: 0.08, envMap, side: THREE.DoubleSide, depthWrite: false });
  const frost = new THREE.MeshStandardMaterial({ color: 0xf4f6f6, transparent: true, opacity: 0.7, roughness: 1, side: THREE.DoubleSide, depthWrite: false });
  const alu = std(0x9aa3aa, { metalness: 0.7, roughness: 0.35 });

  /* 회의실 (업무공간 왼쪽 안쪽 구석) */
  const MX0 = -19.85, MX1 = -11.5, MZ0 = -29.7, MZ1 = -23.6;
  const glassWall = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = Math.atan2(-(z1 - z0), x1 - x0);
    const p = addWallPlane(g, len, CEIL, glassIn, cx, CEIL / 2, cz, ry); p.renderOrder = 2;
    const f = addWallPlane(g, len, 0.32, frost, cx, 1.25, cz, ry); f.renderOrder = 3;
    addMesh(g, BOX, alu, cx, CEIL - 0.03, cz, len, 0.06, 0.08, { ry });
    addMesh(g, BOX, alu, cx, 0.03, cz, len, 0.06, 0.08, { ry });
    for (let k = 0; k <= Math.round(len / 1.6); k++) { const u = k / Math.round(len / 1.6); addBox(g, 0.05, CEIL, 0.06, alu, x0 + (x1 - x0) * u, CEIL / 2, z0 + (z1 - z0) * u); }
    colBox(cx, cz, Math.abs(x1 - x0) + 0.12, Math.abs(z1 - z0) + 0.12);
  };
  glassWall(MX0, MZ1, -13.3, MZ1);   // 정면 (문은 오른쪽 끝)
  glassWall(MX1, MZ1, MX1, MZ0);     // 옆면
  addBox(g, 1.8, CEIL - 2.4, 0.08, alu, -12.4, 2.4 + (CEIL - 2.4) / 2, MZ1);
  plaque(g, '회의실', -12.4, 2.8, MZ1 + 0.045, 0, { style: 'glass', accent: '#3e5c7a', color: '#1f2738' });
  addPlane(g, MX1 - MX0, MZ1 - MZ0, fabric(0x6f7a8a, 1), (MX0 + MX1) / 2, 0.009, (MZ0 + MZ1) / 2);
  const TX = -15.7, TZ = -26.75;
  addBox(g, 4.2, 0.06, 1.3, pbr('walnut_veneer', 2, 1, { rough: 0.4, fallback: 0x7b4a2c }), TX, 0.74, TZ);
  for (const sx of [-1.5, 1.5]) addBox(g, 0.08, 0.7, 0.9, std(0x2b2b30, { metalness: 0.5 }), TX + sx, 0.36, TZ);
  colBox(TX, TZ, 4.25, 1.35);
  for (let i = 0; i < 4; i++) { addBox(g, 0.32, 0.01, 0.22, std(0xf8f4ec), TX - 1.4 + i * 0.95, 0.775, TZ + (i % 2 ? 0.3 : -0.3), { ry: rand(-0.3, 0.3) }); }
  addCyl(g, 0.05, 0.25, std(0xf4efe6), TX + 0.3, 0.9, TZ);
  for (let i = 0; i < 3; i++) addSph(g, 0.03, std(pick([0xff8ab0, 0xffd34d, 0xff6b5a])), TX + 0.3 + rand(-0.03, 0.03), 1.06, TZ + rand(-0.03, 0.03));
  const chairM = fabric(0x3e5c7a, 0.9);
  const mchair = (x, z, ry) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
    addBox(c, 0.5, 0.08, 0.48, chairM, 0, 0.47, 0); addBox(c, 0.48, 0.55, 0.07, chairM, 0, 0.8, -0.24);
    addCyl(c, 0.03, 0.4, alu, 0, 0.24, 0); addCyl(c, 0.26, 0.03, std(0x2a2a2e), 0, 0.03, 0);
    addSeat('meeting', x + Math.sin(ry) * 0.03, z + Math.cos(ry) * 0.03, ry, { h: 0.5, ex: x - Math.sin(ry) * 0.8, ez: z - Math.cos(ry) * 0.8 });
  };
  for (const x of [-1.4, 0, 1.4]) { mchair(TX + x, TZ + 1.0, Math.PI); mchair(TX + x, TZ - 1.0, 0); }
  mchair(TX - 2.55, TZ, Math.PI / 2); mchair(TX + 2.55, TZ, -Math.PI / 2);
  // 발표 화면
  const slide = canvasTex(768, 432, (c, w, h) => {
    c.fillStyle = '#f7f8fa'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1f4fa0'; c.fillRect(0, 0, w, 64);
    c.fillStyle = '#fff'; c.font = `800 34px ${FONT}`; c.fillText('보장원 주간 회의', 28, 44);
    c.fillStyle = '#2b2230'; c.font = `700 26px ${FONT}`;
    ['• 지난주 성과 공유', '• 이번 주 할 일', '• 점심 메뉴 정하기 🍱'].forEach((t, i) => c.fillText(t, 36, 130 + i * 52));
    const cols = ['#e8774a', '#f2b84b', '#6aa7a0', '#6a9be0'];
    [120, 170, 140, 210].forEach((v, i) => { c.fillStyle = cols[i]; c.fillRect(470 + i * 64, 380 - v, 44, v); });
    c.strokeStyle = '#ccd'; c.beginPath(); c.moveTo(455, 380); c.lineTo(740, 380); c.stroke();
  });
  addBox(g, 2.8, 1.65, 0.06, std(0x15151a, { roughness: 0.3 }), TX, 1.95, MZ0 + 0.06);
  addWallPlane(g, 2.68, 1.52, new THREE.MeshBasicMaterial({ map: slide }), TX, 1.95, MZ0 + 0.1);
  for (const x of [-1.2, 0, 1.2]) { addCyl(g, 0.006, CEIL - 3.0, std(0x222222), TX + x, (CEIL + 3.0) / 2, TZ); addMesh(g, new THREE.CylinderGeometry(0.08, 0.24, 0.22, 20, 1, true), std(0x2b2b30, { side: THREE.DoubleSide }), TX + x, 2.95, TZ); addSph(g, 0.06, glow(0xfff0d0), TX + x, 2.88, TZ); }
  const ml = new THREE.PointLight(0xffe2bd, 14, 9, 1.5); ml.position.set(TX, 3.6, TZ); g.add(ml);
  makePlant(g, -19.2, -24.3, 1.0);
  makePlant(g, -12.2, -29.1, 1.0);

  /* 탕비 코너 (왼쪽 창가) */
  const kx = -19.35, kz0 = -7.6, kz1 = -13.3, kcz = (kz0 + kz1) / 2, klen = kz0 - kz1;
  addBox(g, 0.7, 0.9, klen, std(0xf4efe6, { roughness: 0.5 }), kx, 0.45, kcz);
  addBox(g, 0.75, 0.05, klen + 0.1, pbr('oak_veneer_01', 2, 0.5, { rough: 0.45, fallback: 0xc8a070 }), kx, 0.925, kcz);
  for (let z = kz1 + 0.4; z < kz0 - 0.3; z += 0.9) addBox(g, 0.02, 0.7, 0.82, std(0xe0d8cc), kx + 0.36, 0.45, z);
  addBox(g, 0.3, 0.04, klen - 0.4, std(0x8a5a3a), kx - 0.15, 2.0, kcz);
  for (let z = kz1 + 0.5; z < kz0 - 0.3; z += 0.3) if (Math.random() < 0.75) addCyl(g, 0.05, rand(0.1, 0.22), std(pick([0xf4efe6, 0xe8774a, 0xf2b84b, 0x6aa7a0, 0xc9a46a])), kx - 0.15, 2.02 + 0.06, z);
  colBox(kx, kcz, 0.8, klen + 0.1);
  // 커피 머신
  const cm = new THREE.Group(); cm.position.set(kx + 0.02, 0.95, -8.5); g.add(cm);
  addBox(cm, 0.42, 0.55, 0.4, std(0x2b2b2f, { metalness: 0.6, roughness: 0.3 }), 0, 0.275, 0);
  addBox(cm, 0.2, 0.12, 0.28, std(0x9aa3aa, { metalness: 0.8, roughness: 0.25 }), 0.2, 0.32, 0);
  const cmLight = addBox(cm, 0.02, 0.05, 0.05, glow(0x60ff8a), 0.22, 0.47, 0.12);
  addCyl(cm, 0.04, 0.09, std(0xffffff, { roughness: 0.2 }), 0.22, 0.045, 0);
  for (let i = 0; i < 5; i++) addCyl(g, 0.045, 0.1, std(0xffffff, { roughness: 0.2 }), kx + 0.05, 1.0 + i * 0.002, -9.25 + (i % 2) * 0.1);
  plaque(g, '탕비실', kx - 0.32, 2.45, kcz, Math.PI / 2, { style: 'glass', accent: '#f2b33d', color: '#4a2c1a' });
  // 간식 바구니
  const basket = new THREE.Group(); basket.position.set(kx + 0.05, 0.95, -10.4); g.add(basket);
  addMesh(basket, new THREE.CylinderGeometry(0.22, 0.17, 0.14, 20, 1, true), pbr('rough_wood', 1, 1, { color: 0xd8b27a, side: THREE.DoubleSide }), 0, 0.07, 0);
  addCyl(basket, 0.17, 0.01, std(0xc89a6a), 0, 0.005, 0);
  for (let i = 0; i < 10; i++) addMesh(basket, CYL, std(pick([0xc98a43, 0x8a5a3a, 0xe0b070])), rand(-0.12, 0.12), 0.1 + rand(0, 0.05), rand(-0.12, 0.12), 0.045, 0.012, 0.045, { rx: rand(-0.5, 0.5), rz: rand(-0.5, 0.5) });
  for (let i = 0; i < 3; i++) addBox(basket, 0.05, 0.12, 0.03, std(pick([0xe53935, 0x1e63d6, 0xf2b84b])), rand(-0.08, 0.08), 0.15, rand(-0.08, 0.08), { ry: rand(0, 3) });
  addModel(g, 'food_apple_01_1k', 0.08, kx + 0.1, 0.95, -11.4, 0);
  addModel(g, 'food_apple_01_1k', 0.08, kx - 0.02, 0.95, -11.5, 2);
  // 쓰레기통
  const bin = (x, z) => { addMesh(g, new THREE.CylinderGeometry(0.2, 0.17, 0.5, 20, 1, true), std(0x8a8f96, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }), x, 0.25, z); addCyl(g, 0.17, 0.01, std(0x5a5f66), x, 0.01, z); colCircle(x, z, 0.24); return { x, z }; };
  const b1 = bin(-19.15, -13.9), b2 = bin(1.85, -22.2), b3 = bin(17.85, -13.4);
  addStation('coffee', -18.35, -8.5, Math.PI / 2 * -1, { mach: cmLight });
  addStation('snack', -18.35, -10.4, -Math.PI / 2, { food: 'snack' });
  addStation('snack', -18.35, -11.45, -Math.PI / 2, { food: 'apple' });
  for (const b of [b1, b2, b3]) addStation('bin', b.x, b.z, 0, { r: 1.0, bin: true });
  // 휴게실 주방도 같은 기능
  addStation('coffee', 18.3, -5.0, Math.PI / 2);
  addStation('snack', 18.3, -6.8, Math.PI / 2, { food: 'apple' });

  /* 프린터 3대 + 파쇄기 (오른쪽 벽) */
  for (const [i, z] of [-25.2, -26.8, -28.4].entries()) {
    const p = new THREE.Group(); p.position.set(1.85, 0, z); p.rotation.y = -Math.PI / 2; g.add(p);
    addBox(p, 0.72, 0.7, 0.6, std(0xe9e6e0, { roughness: 0.5 }), 0, 0.35, 0);
    addBox(p, 0.72, 0.28, 0.55, std(0xdedad2, { roughness: 0.5 }), 0, 0.84, -0.02);
    addBox(p, 0.6, 0.02, 0.32, std(0x3a3d42), 0, 0.72, 0.36);
    addBox(p, 0.5, 0.05, 0.02, std(0x1c1c20), 0, 0.8, 0.29);
    addBox(p, 0.16, 0.08, 0.02, std(0x1c2a3a), 0.22, 0.95, 0.27);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x40e070, toneMapped: false });
    addBox(p, 0.035, 0.035, 0.02, lightMat, 0.05, 0.95, 0.28);
    textPlane(p, `프린터 ${i + 1}`, 0.4, 0.1, -0.18, 0.95, 0.281, 0, { color: '#2b2230', size: 70 });
    for (let k = 0; k < 6; k++) addBox(p, 0.5, 0.004, 0.3, std(0xffffff), 0, 0.7 + k * 0.004, 0.36);
    colBox(1.85, z, 0.65, 0.8);
    const st = addStation('printer', 0.95, z, Math.PI / 2, { pi: i });
    printers.push({ i, g: p, lightMat, st, blink: 0, blinkCol: 0, x: 1.85, z });
  }
  {
    const s = new THREE.Group(); s.position.set(1.95, 0, -23.45); s.rotation.y = -Math.PI / 2; g.add(s);
    addMesh(s, BOX, new THREE.MeshStandardMaterial({ color: 0x9aa3aa, transparent: true, opacity: 0.45, roughness: 0.3, depthWrite: false }), 0, 0.3, 0, 0.5, 0.6, 0.4).renderOrder = 2;
    addBox(s, 0.52, 0.18, 0.42, std(0x2b2b30, { metalness: 0.5, roughness: 0.35 }), 0, 0.69, 0);
    addBox(s, 0.34, 0.012, 0.03, std(0x0a0a0c), 0, 0.785, 0.02);
    addBox(s, 0.03, 0.03, 0.02, glow(0x60ff8a), 0.18, 0.72, 0.21);
    textPlane(s, '파쇄기', 0.3, 0.08, -0.1, 0.72, 0.211, 0, { color: '#e9e6e0', size: 80 });
    colBox(1.95, -23.45, 0.45, 0.55);
    shredder.g = s;
    shredder.st = addStation('shredder', 1.15, -23.45, Math.PI / 2);
  }
}

/* ---------- 동작 ---------- */
const nearestStation = (A, holding) => {
  if (!A || A.seat || !isInsideXZ(A.x, A.z)) return null;
  let best = null, bd = 1.0;
  const now = performance.now();
  for (const s of stations) {
    if (s.kind === 'bin' && !holding) continue;
    if (s.kind === 'coffee' && holding) continue;
    if ((s.kind === 'printer' || s.kind === 'shredder') && s.busyUntil > now) continue;
    const d = Math.hypot(A.x - s.x, A.z - s.z);
    if (d < (s.r || bd) && d < bd + 0.01) { bd = d; best = s; }
  }
  return best;
};
const STATION_LABEL = { coffee: '☕ 커피 뽑기', bin: '🗑️ 컵 버리기', printer: '🖨️ 출력하기', shredder: '✂️ 문서 파쇄하기' };
const stationLabel = (s) => (s.kind === 'snack' ? (s.food === 'apple' ? '🍎 사과 먹기' : '🍪 간식 먹기') : s.kind === 'printer' ? `🖨️ 프린터 ${s.pi + 1}로 출력하기` : STATION_LABEL[s.kind]);
function startAct(P, state, dur) { P.actState = state; P.actT = dur; }
function setHolding(P, v) {
  P.holding = v;
  if (!P.handMug) P.handMug = addCyl(P.arms[1], 0.05, 0.11, std(0xffffff, { roughness: 0.2 }), 0, -0.33, 0.06);
  P.handMug.visible = v;
}
function runStation(A, st, r, local) {
  const P = A.P;
  if (local) A.ry = st.kind === 'bin' ? Math.atan2(st.x - A.x, st.z - A.z) : st.face;
  if (st.kind === 'coffee') {
    startAct(P, 'brew', 2.8); playSfx('brew', A);
    if (st.mach) { st.mach.material = glow(0xffb040); setTimeout(() => { st.mach.material = glow(0x60ff8a); }, 2700); }
    setTimeout(() => { setHolding(P, true); if (local) { mySay(pick(['커피 나왔다 ☕', '향 좋다~', '오늘 첫 잔!', '카페인 충전 완료'])); sendPresence(true); } }, 2700);
  } else if (st.kind === 'snack') {
    startAct(P, 'eat', 2.1); playSfx('crunch', A);
    if (local) setTimeout(() => mySay(pick(st.food === 'apple' ? ['아삭아삭 🍎', '사과 달다!', '비타민 충전~'] : ['냠냠 😋', '바삭바삭!', '하나만 더…', '당 충전 완료!'])), 300);
  } else if (st.kind === 'bin') {
    setHolding(P, false); playSfx('thunk', A);
    if (local) { mySay(pick(['잘 마셨다~', '분리수거 완료 ♻️'])); sendPresence(true); }
  } else if (st.kind === 'printer') {
    const pr = printers[st.pi];
    st.busyUntil = performance.now() + (r === 'run' ? 4500 : 3000);
    startAct(P, 'print', r === 'ok' ? 2.6 : 1.4); playSfx('print', A, r);
    if (r === 'run') P.shakeT = 3.6;
    printerAnim(pr, r);
    if (local) setTimeout(() => mySay(r === 'ok' ? pick(['출력 완료!', '오 빠르다', '서류 챙겼어요 📄']) : r === 'jam' ? pick(['종이 걸림!! 😱', '왜 빈종이가 나와....', '왜 나한테만!']) : pick(['멈춰!!! 😵', '종이가 날아다녀요!', '누가 100장 눌렀어?!'])), r === 'ok' ? 2400 : 1000);
  } else if (st.kind === 'shredder') {
    st.busyUntil = performance.now() + 2400;
    startAct(P, 'print', 1.2); playSfx('shred', A);
    shredAnim();
    if (local) setTimeout(() => mySay(pick(['갈갈갈~', '증거 인멸 완료 🤫', '속이 다 시원하네', '잘 가라 보고서야', '아 봉투 비워야겠다'])), 1400);
  }
}
const PAPER_GEO = new THREE.PlaneGeometry(0.21, 0.29);
const PAPER_MAT = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
function addFlyer(pos, vel, life, o = {}) {
  const m = new THREE.Mesh(PAPER_GEO, o.mat || PAPER_MAT);
  m.position.copy(pos); m.rotation.set(-Math.PI / 2, 0, rand(0, 6));
  interior.add(m);
  flyers.push({ m, vel, life, t: 0, spin: o.spin ?? rand(-6, 6), slide: o.slide || null, floor: o.floor ?? 0.01 });
}
function printerAnim(pr, r) {
  const out = new THREE.Vector3(pr.x - 0.42, 0.76, pr.z);
  if (r === 'ok') {
    for (let k = 0; k < 3; k++) setTimeout(() => addFlyer(new THREE.Vector3(pr.x - 0.15, 0.8, pr.z), new THREE.Vector3(0, 0, 0), 5, { spin: 0, slide: { to: new THREE.Vector3(pr.x - 0.36, 0.74 + k * 0.004, pr.z), dur: 0.7 } }), 300 + k * 650);
    pr.blink = 2.4; pr.blinkCol = 0x40e070;
  } else if (r === 'jam') {
    addFlyer(new THREE.Vector3(pr.x - 0.25, 0.8, pr.z), new THREE.Vector3(0, 0, 0), 3.2, { spin: 0, slide: { to: new THREE.Vector3(pr.x - 0.28, 0.79, pr.z), dur: 0.6, crumple: true } });
    pr.blink = 3.4; pr.blinkCol = 0xff3030;
  } else {
    for (let k = 0; k < 16; k++) setTimeout(() => addFlyer(out.clone(), new THREE.Vector3(-rand(1.2, 3.2), rand(1.2, 3.0), rand(-1.6, 1.6)), 6), 250 + k * 190);
    pr.blink = 4.2; pr.blinkCol = 0xffa030;
  }
}
function shredAnim() {
  const s = shredder.g;
  const wp = new THREE.Vector3(); s.getWorldPosition(wp);
  const top = new THREE.Vector3(1.95 - 0.02, 1.0, -23.45);
  const m = new THREE.Mesh(PAPER_GEO, PAPER_MAT); m.position.copy(top); m.rotation.set(0, Math.PI / 2, 0); interior.add(m);
  shredder.sheet = { m, t: 0 };
  for (let k = 0; k < 14; k++) setTimeout(() => {
    const st = addMesh(interior, BOX, PAPER_MAT, 1.95 + rand(-0.14, 0.14), 0.58, -23.45 + rand(-0.1, 0.1), 0.012, 0.2, 0.004, { ry: rand(0, 3) });
    shredder.strips.push({ m: st, v: 0, y0: 0.04 + Math.min(0.3, shredder.strips.length * 0.004) });
    if (shredder.strips.length > 70) interior.remove(shredder.strips.shift().m);
  }, 500 + k * 100);
}
function updateWorkExtras(t, dt) {
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i];
    f.t += dt;
    if (f.slide) {
      const k = Math.min(1, f.t / f.slide.dur);
      if (!f.from) f.from = f.m.position.clone();
      f.m.position.lerpVectors(f.from, f.slide.to, k);
      if (f.slide.crumple) f.m.rotation.y = Math.sin(t * 30) * 0.15 * k;
    } else {
      f.vel.y -= 5.5 * dt;
      f.vel.multiplyScalar(1 - dt * 0.6);
      f.m.position.addScaledVector(f.vel, dt);
      if (f.m.position.y <= f.floor) { f.m.position.y = f.floor; f.vel.set(0, 0, 0); f.m.rotation.set(-Math.PI / 2, 0, f.m.rotation.z); }
      else { f.m.rotation.x += f.spin * dt * 0.4; f.m.rotation.z += f.spin * dt; }
    }
    if (f.t > f.life) { interior.remove(f.m); flyers.splice(i, 1); }
  }
  for (const pr of printers) {
    if (pr.blink > 0) { pr.blink -= dt; pr.lightMat.color.setHex(pr.blinkCol === 0x40e070 || Math.sin(t * 16) > 0 ? pr.blinkCol : 0x301010); }
    else pr.lightMat.color.setHex(0x40e070);
  }
  if (shredder.sheet) {
    const s = shredder.sheet; s.t += dt;
    s.m.position.y = 1.0 - Math.min(1, s.t / 1.3) * 0.28;
    s.m.scale.y = Math.max(0.01, 1 - s.t / 1.3);
    if (s.t > 1.3) { interior.remove(s.m); shredder.sheet = null; }
  }
  for (const st of shredder.strips) {
    if (st.m.position.y > st.y0) { st.v += 4 * dt; st.m.position.y = Math.max(st.y0, st.m.position.y - st.v * dt); if (st.m.position.y === st.y0) st.m.rotation.set(Math.PI / 2, rand(0, 3), 0); }
  }
}

/* =========================================================================
   빌드
   ========================================================================= */
buildStreet();
buildTraffic();
buildNeighbors();
buildFoodStreet();
buildCats();
buildGate();
buildTower();
buildInterior();
buildVentRoom();
buildWorkExtras();
// 모든 책상을 무작위로 다채롭게 꾸며요 (모든 접속자에게 같은 모습)
[...desks.keys()].forEach((key, i) => {
  const r = (k) => hash(i * 13 + 5, k);
  const items = DECOR_ITEMS.slice(1).map((x) => x[0]);
  const pickI = (arr, k) => arr[Math.floor(r(k) * arr.length) % arr.length];
  applyDecor(key, {
    l: r(1) < 0.9 ? pickI(items, 2) : 'none',
    r: r(3) < 0.65 ? pickI(items.filter((x) => x !== 'plant' && x !== 'flower'), 4) : 'none',
    scr: pickI(SCREENS, 5)[0],
    mug: r(6) < 0.75 ? 1 + Math.floor(r(7) * (MUG_COLORS.length - 1)) : 0,
    chair: Math.floor(r(8) * CHAIR_COLORS.length),
    plate: false,
  });
});
buildWorldColliders();
interior.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });
// 휴대폰: 거리의 움직이지 않는 물건들을 재질별로 한 덩어리로 합쳐 그리기 횟수를 줄여요 (모양은 그대로)
function mergeStatic(root, skip) {
  const CELL = 48, buckets = new Map(), v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  const walk = (o) => {
    if (skip.has(o)) return;
    for (const c of o.children) walk(c);
    const m = o;
    if (!m.isMesh || m.isInstancedMesh || m.isSkinnedMesh || Array.isArray(m.material) || !m.visible) return;
    const mat = m.material, geo = m.geometry;
    if (mat.transparent && mat !== BLOB_MAT) return;
    if (geo.morphAttributes && Object.keys(geo.morphAttributes).length) return;
    const pos = geo.attributes.position;
    if (!pos || !(pos.array instanceof Float32Array) || pos.isInterleavedBufferAttribute) return;
    const names = Object.keys(geo.attributes).sort();
    if (names.some((n) => { const a = geo.attributes[n]; return a.isInterleavedBufferAttribute || !(a.array instanceof Float32Array); })) return;
    geo.boundingSphere || geo.computeBoundingSphere();
    v.copy(geo.boundingSphere.center).applyMatrix4(m.matrixWorld);
    const key = [mat.uuid, names.map((n) => n + geo.attributes[n].itemSize).join(','), !!geo.index, m.renderOrder, m.frustumCulled, Math.floor(v.x / CELL), Math.floor(v.z / CELL)].join('|');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(m);
  };
  walk(root);
  let before = 0, after = 0;
  for (const list of buckets.values()) {
    before += list.length;
    if (list.length < 2) { after++; continue; }
    const geos = list.map((m) => { const g = m.geometry.clone(); g.clearGroups(); g.applyMatrix4(m.matrixWorld); return g; });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) { after += list.length; continue; }
    const src = list[0], mm = new THREE.Mesh(merged, src.material);
    mm.renderOrder = src.material.transparent ? src.renderOrder : src.renderOrder - 1; // 합친 덩어리를 먼저 그려 얇게 겹친 면(보도블록 등)이 위로 보이게 mm.frustumCulled = src.frustumCulled;
    mm.receiveShadow = src.receiveShadow; mm.castShadow = src.castShadow;
    mm.matrixAutoUpdate = false;
    scene.add(mm);
    list.forEach((m) => m.parent.remove(m));
    after++;
  }
  return { before, after };
}
// 코드가 손잡이를 쥐고 있는 물체(문·고양이·차·프린터·커피머신 등 움직이거나 바뀌는 것)는 합치지 않아요
function heldObjects(roots, keep) {
  const out = new Set(), seen = new Set();
  const scan = (v, d) => {
    if (!v || typeof v !== 'object' || seen.has(v) || d > 7) return;
    seen.add(v);
    if (v.isObject3D) { if (!keep.has(v)) out.add(v); return; }
    if (v.isMaterial || v.isTexture || v.isBufferGeometry || v.isColor || v.isVector3 || ArrayBuffer.isView(v)) return;
    if (v instanceof Map || v instanceof Set) { for (const x of v.values()) scan(x, d + 1); return; }
    for (const k in v) { try { scan(v[k], d + 1); } catch {} }
  };
  roots.forEach((r) => scan(r, 0));
  return out;
}
if (LOW) {
  const skip = heldObjects([cars, cats, doors, blinkers, pingpong, zones, vent, papers, stations, printers, flyers, shredder, nightLights, people, leaves, stars, seats], new Set([scene, street, interior]));
  const a = mergeStatic(street, skip), b = mergeStatic(interior, skip);
  window.__mergeInfo = { street: a, interior: b, held: skip.size };
}
seats.forEach((s) => seatById.set(s.id, s));

// 데스크톱: 따뜻한 조명이 은은하게 번지는 블룸 (휴대폰은 가볍게 생략)
if (!LOW) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.5, 0.96));
  composer.addPass(new OutputPass());
}
onResize();
{
  const a = innerWidth / innerHeight;
  const k = a < 0.8 ? 1.25 : 1;
  const tgt = new THREE.Vector3(-3, -1, -6);
  camera.position.set(-3 + 43 * k, -1 + 22 * k, -6 + 58 * k);
  controls.target.copy(tgt);
}
controls.minDistance = 2;
controls.maxDistance = 90;
controls.maxPolarAngle = Math.PI * 0.47;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
renderThumbs();
$('#enter').disabled = false;
$('#enter').textContent = '회사로 들어가기';
applyTimeOfDay();
setInterval(applyTimeOfDay, 15000);

/* =========================================================================
   애니메이션
   ========================================================================= */
function updatePerson(P, t, dt) {
  const ph = t + P.phase;
  const [aL, aR] = P.arms;
  const hp = P.headPivot;
  if (P.eyes?.length && P.pose !== 'lie') {
    const b = (ph * 0.9) % 4.3 < 0.13 ? 0.12 : 1.15;
    P.eyes[0].scale.y = P.eyes[1].scale.y = b;
  }
  aR.rotation.z = 0.16; aL.rotation.z = -0.16;
  hp.rotation.z = 0;
  if (P.pose === 'stand' && P.rantT <= 0) P.body.rotation.x = P.state === 'pet' ? 0.38 : 0;
  let bob = 0;
  switch (P.state) {
    case 'type':
      aL.rotation.x = -1.05 + Math.sin(ph * 17) * 0.07;
      aR.rotation.x = -1.05 + Math.sin(ph * 15 + 1) * 0.07;
      hp.rotation.x = 0.12 + Math.sin(ph * 0.6) * 0.05;
      hp.rotation.y = Math.sin(ph * 0.31) * 0.18;
      break;
    case 'walk': {
      P.walkPh = (P.walkPh || 0) + dt * 6.5 * (P.walkRate || 1);
      const sw = Math.sin(P.walkPh);
      P.legs[0].hip.rotation.x = sw * 0.55;
      P.legs[1].hip.rotation.x = -sw * 0.55;
      P.legs[0].knee.rotation.x = Math.max(0, -sw) * 0.7;
      P.legs[1].knee.rotation.x = Math.max(0, sw) * 0.7;
      aL.rotation.x = -sw * 0.5;
      aR.rotation.x = sw * 0.5;
      bob = Math.abs(Math.cos(P.walkPh)) * 0.045;
      hp.rotation.x = 0; hp.rotation.y = 0;
      break;
    }
    case 'pp':
      break;
    case 'pet':
      aR.rotation.x = -0.75 + Math.sin(ph * 5) * 0.28;
      aL.rotation.x = -0.5;
      P.legs.forEach((l) => { l.hip.rotation.x = -0.35; l.knee.rotation.x = 0.55; });
      hp.rotation.x = 0.4; hp.rotation.y = Math.sin(ph * 1.2) * 0.12;
      break;
    case 'write':
      aL.rotation.x = -1.0; aL.rotation.z = -0.3;
      aR.rotation.x = -1.05 + Math.sin(ph * 9) * 0.12; aR.rotation.z = 0.2 + Math.sin(ph * 6) * 0.1;
      hp.rotation.x = 0.35; hp.rotation.y = Math.sin(ph * 0.5) * 0.1;
      break;
    case 'hug':
      aL.rotation.x = -1.3; aR.rotation.x = -1.3;
      aL.rotation.z = 0.55; aR.rotation.z = -0.55;
      hp.rotation.x = 0.15; hp.rotation.z = Math.sin(ph * 1.2) * 0.12;
      bob = Math.abs(Math.sin(ph * 2)) * 0.015;
      break;
    case 'sleep': {
      const br = Math.sin(ph * 1.3);
      P.torso.scale.set(1.06 + br * 0.02, 1, 0.92 + br * 0.03);
      aL.rotation.x = aR.rotation.x = 0;
      hp.rotation.x = 0; hp.rotation.y = 0;
      break;
    }
    case 'doze':
      aL.rotation.x = -0.5; aR.rotation.x = -0.5;
      hp.rotation.x = 0.45 + Math.sin(ph * 0.5) * 0.08;
      hp.rotation.z = 0.25;
      break;
    case 'sit':
      aL.rotation.x = -0.45 + Math.sin(ph * 0.9) * 0.05;
      aR.rotation.x = -0.45 + Math.sin(ph * 0.8 + 1) * 0.05;
      hp.rotation.y = Math.sin(ph * 0.4) * 0.35;
      hp.rotation.x = Math.sin(ph * 1.7) * 0.05;
      if (P.bubble?.visible) { aL.rotation.x = -0.8 + Math.sin(ph * 4) * 0.35; }
      break;
    case 'idle':
    default:
      if (P.pose === 'stand') P.legs.forEach((l) => { l.hip.rotation.x *= 0.8; l.knee.rotation.x *= 0.8; });
      aL.rotation.x = Math.sin(ph * 1.2) * 0.06;
      aR.rotation.x = Math.sin(ph * 1.2 + 1) * 0.06;
      hp.rotation.y = Math.sin(ph * 0.45) * 0.3;
      hp.rotation.x = Math.sin(ph * 0.9) * 0.05;
      bob = Math.sin(ph * 2) * 0.006;
      break;
  }
  if (P.actT > 0) P.actT -= dt;
  if (P.pose === 'stand' || P.pose === 'sit') {
    if (P.state === 'brew' || P.state === 'print') { aL.rotation.x = -1.0 + Math.sin(ph * 3) * 0.08; aR.rotation.x = -1.1 + Math.sin(ph * 3 + 1) * 0.08; hp.rotation.x = 0.25; hp.rotation.y = 0; }
    else if (P.state === 'eat') { aR.rotation.x = -2.25 + Math.abs(Math.sin(ph * 7.5)) * 0.35; aR.rotation.z = -0.25; hp.rotation.x = 0.1 + Math.abs(Math.sin(ph * 7.5)) * 0.08; bob += Math.abs(Math.sin(ph * 7.5)) * 0.012; }
    else if (P.state === 'sip') { aR.rotation.x = -2.35; aR.rotation.z = -0.3; hp.rotation.x = -0.2; }
    else if (P.holding && P.state !== 'type') { aR.rotation.x = -1.05; aR.rotation.z = 0.12; }
  }
  if (P.shakeT > 0) {
    // 프린터 폭주: 살짝 통통 뛰며 부르르
    P.shakeT -= dt;
    P.body.rotation.z = Math.sin(t * 42) * 0.06;
    bob += Math.abs(Math.sin(t * 9)) * 0.035;
    aL.rotation.x = -1.6 + Math.sin(t * 30) * 0.2; aR.rotation.x = -1.6 + Math.sin(t * 30 + 1.5) * 0.2;
    aL.rotation.z = -0.45; aR.rotation.z = 0.45;
    if (P.shakeT <= 0) P.body.rotation.z = 0;
  }
  if (P.rantT > 0) {
    // 마구 화내기: 빨간 얼굴, 💢, 김 모락, 부들부들, 욕 말풍선(가려짐)
    P.rantT -= dt;
    P.anger.children[0].material.opacity = 0.26 + Math.sin(t * 8) * 0.08;
    P.steam.forEach((sp, i) => {
      const k = ((t * 1.6 + i * 0.5) % 1);
      sp.position.set(sp.userData.sx * (0.22 + k * 0.12), 0.27 + 0.3 + k * 0.35, 0);
      sp.scale.setScalar(0.12 + k * 0.2);
      sp.material.opacity = 1 - k;
    });
    if (P.pose !== 'lie') P.body.rotation.z = Math.sin(t * 38) * 0.07;
    if (P.state !== 'write') { aL.rotation.x = -2.3 + Math.sin(t * 18) * 0.6; aR.rotation.x = -2.3 + Math.sin(t * 18 + 2) * 0.6; aL.rotation.z = -0.5; aR.rotation.z = 0.5; }
    bob += Math.abs(Math.sin(t * 14)) * 0.05;
    P.rantNext -= dt;
    if (P.rantNext <= 0 && P.rantT > 0.3) { P.rantNext = 0.48; say(P, pick(GRAWLIX), 0.62, 'angry'); }
    if (P.rantT <= 0) { P.anger.visible = false; if (P.pose !== 'lie') P.body.rotation.z = 0; }
  }
  if (P.laughT > 0) {
    P.laughT -= dt;
    bob += Math.abs(Math.sin(ph * 10)) * 0.04;
    if (P.pose !== 'lie') hp.rotation.x = -0.25;
  }
  if (P.waveT > 0 && P.state !== 'type') {
    P.waveT -= dt;
    aR.rotation.x = -2.8; aR.rotation.z = -0.3 + Math.sin(ph * 14) * 0.35;
  }
  P.hopY = bob;
  if (P.hopT > 0) {
    P.hopT -= dt;
    P.hopY += Math.sin((1 - P.hopT / 0.55) * Math.PI) * 0.22;
  }
}

const _bw = new THREE.Vector3(), _bp = new THREE.Vector3();
function updateBubbles(dt) {
  for (const P of people) {
    const b = P.bubble;
    if (!b || !b.visible) continue;
    P.bubbleT += dt;
    const k = P.bubbleT;
    const pop = k < 0.18 ? ease(k / 0.18) * 1.08 : k < 0.28 ? 1.08 - (k - 0.18) * 0.8 : 1;
    const fade = clamp((P.bubbleDur - k) / 0.35, 0, 1);
    // 화면 밖으로 잘리지 않게: 카메라와 가까우면 화면 크기에 맞춰 줄여요
    b.getWorldPosition(_bw);
    const dist = Math.max(0.5, _bw.distanceTo(camera.position));
    const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), visW = visH * camera.aspect;
    const h = Math.min(0.32 * (camera.aspect < 0.8 ? 1.15 : 1), (visW * 0.62) / P.bubbleAspect, visH * 0.13);
    b.scale.set(h * P.bubbleAspect * pop, h * pop, 1);
    // 화면 가장자리에 걸리면 말풍선을 화면 안쪽으로 밀어 넣어요
    _bp.copy(_bw).project(camera);
    let cx = 0.5, cy = 0;
    if (_bp.z < 1) {
      const hw = (h * P.bubbleAspect) / visW, hh = (2 * h) / visH, m = 0.96;
      if (_bp.x - hw < -m) cx = 0.5 - (-m - (_bp.x - hw)) / (2 * hw);
      else if (_bp.x + hw > m) cx = 0.5 + (_bp.x + hw - m) / (2 * hw);
      if (_bp.y + hh > 0.9) cy = Math.min(0.95, (_bp.y + hh - 0.9) / hh);
    }
    b.center.set(clamp(cx, -4, 5), cy);
    b.material.opacity = fade;
    if (k > P.bubbleDur) b.visible = false;
  }
}

function allAvatars() {
  const list = [...remotes.values()].map((r) => r.A);
  if (me.A) list.push(me.A);
  return list;
}
function updatePingPong(dt, avatars) {
  const pp = pingpong;
  const players = pp.seats.map((s) => avatars.find((A) => A.seat === s) || null);
  const active = players.some(Boolean);
  pp.ball.visible = active;
  if (!active) return;
  pp.u += dt * pp.speed;
  if (pp.u >= 1) { pp.u -= 1; pp.dir *= -1; }
  const u = pp.u, u0 = 0.62;
  const xs = -1.55 * pp.dir, xe = 1.55 * pp.dir;
  const x = xs + (xe - xs) * u;
  let y;
  if (u < u0) { const s = u / u0; y = 1.0 + (0.8 - 1.0) * s + 0.32 * Math.sin(Math.PI * s); }
  else { const s = (u - u0) / (1 - u0); y = 0.8 + (1.0 - 0.8) * s + 0.28 * Math.sin(Math.PI * s); }
  pp.lastHalf = u >= u0 ? 1 : 0;
  pp.ball.position.set(x, y, Math.sin(u * Math.PI) * 0.25 * pp.dir);
  players.forEach((A, i) => {
    if (!A) return;
    const P = A.P;
    const receiving = (i === 1) === (pp.dir > 0);
    const near = receiving ? Math.max(0, (u - 0.75) / 0.25) : Math.max(0, 1 - u / 0.2);
    P.arms[1].rotation.x = -0.6 - near * 0.9;
    P.arms[1].rotation.z = 0.2 - near * 0.6;
    P.arms[0].rotation.x = -0.4;
    P.headPivot.rotation.y = Math.sin(pp.ball.position.z * 2) * 0.2;
  });
}

function updateLeaves(t, dt) {
  const { pos, ph, n, geo } = leaves;
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    pos[k + 1] -= dt * (0.6 + (i % 5) * 0.12);
    pos[k] += (Math.sin(t * 1.3 + ph[i]) * 0.6 - 0.25) * dt;
    pos[k + 2] += Math.cos(t * 0.9 + ph[i]) * 0.3 * dt;
    if (pos[k + 1] < 0.18) { pos[k + 1] = rand(10, 15); pos[k] = rand(-70, 70); pos[k + 2] = rand(-1, 32); }
  }
  geo.attributes.position.needsUpdate = true;
}

function updateCars(dt, avatars) {
  // 횡단보도에 누가 있으면 차가 멈춰요
  const onCross = avatars.some((A) => Math.abs(A.x) < 5.3 && ((A.z > 4.8 && A.z < 11.7) || (A.z > 18.3 && A.z < 25.2)));
  for (const c of cars) {
    const p = c.g.position;
    let step = c.dir * c.speed * dt;
    // 앞차와 간격 유지
    for (const o of cars) {
      if (o === c || o.dir !== c.dir || Math.abs(o.g.position.z - p.z) > 0.5) continue;
      const gap = (o.g.position.x - p.x) * c.dir;
      if (gap > 0 && gap < 13) step *= clamp((gap - 7.5) / 5.5, 0, 1);
    }
    if (onCross) {
      const stopX = c.dir < 0 ? 8.5 : -8.5;
      const dist = (stopX - p.x) * c.dir;
      if (dist >= 0 && dist < 25) step = c.dir * Math.min(Math.abs(step), Math.max(0, dist));
    }
    p.x += step;
    if (c.dir > 0 && p.x > 220) p.x = -110;
    if (c.dir < 0 && p.x < -110) p.x = 220;
  }
}

const clock = new THREE.Clock();
const camDelta = new THREE.Vector3();
let ctxT = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (me.A) {
    updatePlayer(dt);
    syncAvatar(me.A);
    if (me.A.moving || me.A.seat) sendPresence();
  }
  updateRemotes(dt);
  flushPresence(dt);

  // 카메라: 트윈 또는 내 캐릭터 따라가기
  if (tween) {
    tween.t += dt / tween.dur;
    const k = ease(Math.min(tween.t, 1));
    camera.position.lerpVectors(tween.fp, tween.tp, k);
    controls.target.lerpVectors(tween.ft, tween.tt, k);
    if (tween.t >= 1) { const r = tween.res; tween = null; r(); }
  } else if (me.A) {
    const A = me.A;
    camDelta.set(A.x, A.y + (A.P.pose === 'lie' ? 0.75 : A.P.pose === 'sit' ? 0.95 : 1.15), A.z).sub(controls.target);
    controls.target.add(camDelta);
    camera.position.add(camDelta);
    controls.minDistance = 1.6;
    controls.maxDistance += ((mode.inside ? 7 : 16) - controls.maxDistance) * Math.min(1, dt * 2.5);
    controls.maxPolarAngle = Math.PI * 0.49;
  }
  controls.update();
  if (me.A && !tween) {
    const p = camera.position;
    if (inVent(me.A.x, me.A.z)) {
      p.x = clamp(p.x, VENT.x0 + 0.2, VENT.x1 - 0.2); p.y = clamp(p.y, 0.6, VENT.ceil - 0.15); p.z = clamp(p.z, VENT.z0 + 0.2, VENT.z1 - 0.2);
    } else {
      // 문 근처에서는 카메라가 유리문 안팎을 자연스럽게 따라가요 (순간이동 방지)
      const nearDoor = Math.abs(me.A.x) < 3.2 && me.A.z > -4.5 && me.A.z < 4.5;
      if (mode.inside) {
        p.x = clamp(p.x, -19.6, 19.6); p.y = clamp(p.y, 0.6, 4.6);
        p.z = nearDoor ? clamp(p.z, -29.6, 7) : clamp(p.z, -29.6, -0.4);
      } else {
        p.y = Math.max(p.y, me.A.y + 0.5);
        if (!nearDoor && p.x > -20.6 && p.x < 20.6 && p.z < 0.45 && p.z > -31) p.z = 0.45;
        if (nearDoor) p.y = Math.min(p.y, 4.6);
      }
    }
  }

  const avatars = allAvatars();
  // 자동문: 누군가 가까이 오면 열림
  doors.target = avatars.some((A) => Math.abs(A.x) < 3 && Math.abs(A.z) < 3.2) ? 1 : 0;
  doors.open += (doors.target - doors.open) * Math.min(1, dt * 5);
  for (const d of [doors.L, doors.R]) d.position.x = d.userData.sx * (0.8 + doors.open * 1.55);

  updateCars(dt, avatars);
  for (const P of people) updatePerson(P, t, dt);
  updatePingPong(dt, avatars);
  for (const A of avatars) syncAvatar(A);
  updateBubbles(dt);
  updateLeaves(t, dt);
  updateVent(t, dt);
  updateCats(t, dt);
  updateWorkExtras(t, dt);
  stars.mat.opacity = 0.75 + Math.sin(t * 2) * 0.2;
  blinkers.forEach((b) => { b.visible = Math.sin(t * 3) > 0; });
  ctxT += dt;
  if (ctxT > 0.2) {
    ctxT = 0;
    refreshContext(false);
    if (audio.ctx) { const z = musicZone(); if (music.cur?.name !== z) musicSet(z); }
  }

  if (composer) composer.render(); else renderer.render(scene, camera);
  if (shotPending) {
    const cb = shotPending; shotPending = null;
    const url = renderer.domElement.toDataURL('image/png'); // 같은 프레임 안에서 바로 읽어요
    try {
      const bin = atob(url.split(',')[1]), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      cb(new Blob([u8], { type: 'image/png' }));
    } catch (e) { cb(null); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 디버그/스크린샷용
window.__office = {
  stations, desks,
  changeCharacter, takePhoto, onPeers, renderer, remotes, scene, street, interior, raycaster,
  camera, controls, me, teleport, doAction, seats, mySay, enterGame, keys, colliders, groundY, isInsideXZ, openVent, submitVent, cats,
  setHour(h) { TOD.override = h; applyTimeOfDay(); },
  renderAudio, tracks: () => Object.keys(TRACKS), musicZone,
  look(p, t) { return flyTo(new THREE.Vector3(...p), new THREE.Vector3(...t), 0.05); },
  headShot(i, ang, elev = 0.05, size = 360) {
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.setSize(size, size); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0xd8d0c8);
    sc.add(new THREE.HemisphereLight(0xfff4e8, 0x8a7060, 2.0));
    const dl = new THREE.DirectionalLight(0xffffff, 2.0); dl.position.set(1.5, 3, 3); sc.add(dl);
    const P = makePerson(i, { cast: false }); P.blob.visible = false; sc.add(P.g);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
    cam.position.set(Math.sin(ang) * 1.6, 1.31 + elev * 2, Math.cos(ang) * 1.6); cam.lookAt(0, 1.3, 0);
    r.render(sc, cam);
    const url = r.domElement.toDataURL('image/png'); r.dispose(); r.forceContextLoss?.();
    return url;
  },
  step: (dt) => updatePlayer(dt),
  pokeFirst() { const R = [...remotes.values()][0]; if (!R) return 'no remote'; poke(R); return 'poked ' + R.name; },
};
