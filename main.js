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
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
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
  'ceramic_vase_01_1k', 'Ottoman_01_2k', 'coffee_table_round_01_2k', 'modern_arm_chair_01_1k', 'sofa_02_2k',
];
const pbrTex = {};
const models = {};
const KEYS = { d: 'diff', n: 'nor', a: 'arm' };
await Promise.all([
  ...Object.entries(PBR_SETS).flatMap(([name, ks]) => [...ks].map(async (k) => {
    try {
      const t = await texLoader.loadAsync(`${ASSET}tex/${name}_${KEYS[k]}.webp`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
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
  if (T.nor) { m.normalMap = tiled(T.nor, rx, ry); const ns = o.normalScale ?? 1; m.normalScale.set(ns, ns); }
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
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, normalMap: fabricNor });
    if (fabricNor) m.normalScale.set(0.8, 0.8);
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
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
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
function facadeMat(cols, floors, o = {}) {
  const f = facade(cols, floors, o);
  return new THREE.MeshStandardMaterial({
    map: f.map, emissiveMap: f.emi, emissive: 0xffd9a8, emissiveIntensity: o.emi ?? 0.42,
    roughness: o.rough ?? 0.12, metalness: o.metal ?? 0.6, envMap, envMapIntensity: 1.1,
  });
}

/* =========================================================================
   하늘 / 빛
   ========================================================================= */
const SUN_DIR = new THREE.Vector3(90, 40, 70).normalize();
{
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
      uniforms: {
        cTop: { value: new THREE.Color(0x2c3a6e) },
        cMid: { value: new THREE.Color(0xc98a9c) },
        cLow: { value: new THREE.Color(0xf6b07e) },
        sunDir: { value: new THREE.Vector3(0.73, 0.1, 0.57).normalize() },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 cTop,cMid,cLow,sunDir; varying vec3 vDir;
        void main(){
          float h = vDir.y;
          vec3 c = mix(cLow, cMid, smoothstep(-0.02, 0.2, h));
          c = mix(c, cTop, smoothstep(0.2, 0.75, h));
          float s = max(dot(normalize(vDir), sunDir), 0.0);
          c += vec3(1.0,0.62,0.32)*pow(s,60.0)*1.2 + vec3(1.0,0.66,0.4)*pow(s,6.0)*0.25;
          gl_FragColor = vec4(c,1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  scene.add(sky);
}

const hemi = new THREE.HemisphereLight(0xffdcc0, 0x5b4636, 0.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffb27a, 2.6);
sun.position.copy(SUN_DIR).multiplyScalar(160);
sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 400 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun);

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
  // 인도 (건물 쪽)
  addBox(g, 420, 0.15, 5, curb, 70, 0.075, 2.5, { receive: true });
  addPlane(g, 420, 5, pave, 70, 0.152, 2.5);
  // 중앙 광장
  addBox(g, 330, 0.15, 7, curb, 45, 0.075, 15, { receive: true });
  addPlane(g, 330, 7, paveMid, 45, 0.152, 15);
  // 건너편 인도
  addBox(g, 420, 0.15, 7, curb, 70, 0.075, 28.5, { receive: true });
  addPlane(g, 420, 7, paveFar, 70, 0.152, 28.5);
  // 건너편 너머 바닥
  addPlane(g, 420, 60, pbr('pavement_02', 420 / 3, 60 / 3, { color: 0xd8d0c6, fallback: 0x8a7f74 }), 70, 0.01, 62);

  // 차선
  const white = glow(0xe8e4dc);
  const dashGeo = new THREE.PlaneGeometry(3, 0.15);
  dashGeo.rotateX(-Math.PI / 2);
  const dashes = [];
  for (let x = -130; x < 280; x += 7) for (const z of [8.25, 21.75]) dashes.push([x, z]);
  const dashIM = new THREE.InstancedMesh(dashGeo, std(0xe9e5dd), dashes.length);
  const m4 = new THREE.Matrix4();
  dashes.forEach(([x, z], i) => dashIM.setMatrixAt(i, m4.makeTranslation(x, 0.03, z)));
  dashIM.receiveShadow = true;
  g.add(dashIM);
  // 횡단보도 (건물 입구 앞)
  const stripes = [];
  for (let x = -4.5; x <= 4.5; x += 1) for (const z of [8.25, 21.75]) stripes.push([x, z]);
  const stripeGeo = new THREE.PlaneGeometry(0.5, 5.6);
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
  const headIM = new THREE.InstancedMesh(SPH, glow(0xffd08a), lamps.length);
  lamps.forEach(([x, z], i) => {
    colCircle(x, z, 0.18);
    poleIM.setMatrixAt(i, m4.compose(p.set(x, 3.2, z), q.identity(), s.set(0.08, 6.2, 0.08)));
    headIM.setMatrixAt(i, m4.compose(p.set(x, 6.4, z), q.identity(), s.set(0.32, 0.22, 0.32)));
  });
  poleIM.castShadow = true;
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
    const n = 4;
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
  hairBack: new THREE.SphereGeometry(0.284, 32, 12, Math.PI * 0.82, Math.PI * 1.36, Math.PI * 0.45, Math.PI * 0.33),
  hood: new THREE.SphereGeometry(0.32, 36, 18, Math.PI * 0.75, Math.PI * 1.5, 0, Math.PI * 0.72),
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
  { skin: 0xf8ddc8, shirt: 0xc89b6d, pants: 0x6b5a4a, hair: 0x6b4630, shoe: 0x8a4b34, acc: 'bear', accColor: 0xb07e55 },
  { skin: 0xe2ad8a, shirt: 0x6a9be0, pants: 0xe8e2d6, hair: 0x241a15, shoe: 0x3a4a6a, acc: 'cap', accColor: 0xe06b7a },
  { skin: 0xf6dcc4, shirt: 0xb49ad8, pants: 0x2c3e66, hair: 0xc08a5a, shoe: 0xf2efe8, acc: 'phones', accColor: 0xf4efe6, long: true },
];
const skinCache = new Map();
function skinMat(c) {
  if (!skinCache.has(c)) skinCache.set(c, new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.58, sheen: 0.5, sheenColor: new THREE.Color(0xffb8a0), sheenRoughness: 0.5 }));
  return skinCache.get(c);
}
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
  addMesh(hp, GEO.bangs, mH, 0, cy + 0.17, 0.17, 0.23, 0.085, 0.12, { rx: -0.5 });
  if (long) for (const sx of [-1, 1]) addMesh(hp, GEO.bangs, mH, sx * 0.21, cy - 0.12, -0.04, 0.09, 0.2, 0.13);
}
function makeAccessory(hp, cy, d) {
  const m = d.accColor !== undefined ? fabric(d.accColor, 0.85) : null;
  if (d.acc === 'beanie') {
    addMesh(hp, GEO.hairTop, m, 0, cy + 0.03, -0.01, 1.05, 0.95, 1.05, { rx: -0.3 });
    addSph(hp, 0.07, m, 0, cy + 0.32, -0.06);
  } else if (d.acc === 'glasses') {
    const gm = std(0x2a2522, { roughness: 0.3, metalness: 0.3 });
    for (const sx of [-1, 1]) onFace(hp, GEO.ring, gm, sx * 0.095, cy + 0.005, 0.262, cy);
    addBox(hp, 0.06, 0.012, 0.012, gm, 0, cy + 0.01, 0.272);
  } else if (d.acc === 'bear') {
    addMesh(hp, GEO.hood, m, 0, cy + 0.0, -0.02, 1, 1, 1, { rx: -0.35 });
    for (const sx of [-1, 1]) {
      addSph(hp, 0.085, m, sx * 0.2, cy + 0.24, -0.04);
      addSph(hp, 0.045, std(0xf2c6a8), sx * 0.2, cy + 0.25, 0.02);
    }
  } else if (d.acc === 'cap') {
    addMesh(hp, GEO.hairTop, m, 0, cy + 0.03, 0, 1.03, 0.9, 1.03, { rx: -0.15 });
    addMesh(hp, CYL, m, 0, cy + 0.14, 0.27, 0.2, 0.025, 0.16, { rx: 0.12 });
    addSph(hp, 0.03, m, 0, cy + 0.3, 0);
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
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.04;
  headPivot.userData.skin = mK;
  body.add(headPivot);
  const CY = 0.27;
  addMesh(headPivot, GEO.head, mK, 0, CY, 0, 1, 0.96, 0.98);
  if (d.acc !== 'bear') makeHair(headPivot, CY, mH, d.long);
  else addMesh(headPivot, GEO.bangs, mH, 0, CY + 0.17, 0.17, 0.23, 0.085, 0.12, { rx: -0.5 });
  makeAccessory(headPivot, CY, d);
  const face = makeFace(headPivot, CY);
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
    g, body, torso, headPivot, arms, legs, eyes: face.eyes, face, paddle,
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
  const tw = Math.ceil(g.measureText(text).width);
  const pad = 30, bh = 82, tail = 20;
  c.width = tw + pad * 2 + 8; c.height = bh + tail + 8;
  const bg = style === 'sleep' ? '#d9e3ff' : style === 'poke' ? '#ffe7a8' : '#fffaf2';
  g.fillStyle = 'rgba(40,20,20,0.25)';
  roundRect(g, 6, 7, c.width - 10, bh, 36); g.fill();
  g.fillStyle = bg;
  roundRect(g, 4, 4, c.width - 10, bh, 36); g.fill();
  g.beginPath();
  g.moveTo(c.width / 2 - 14, bh + 2); g.lineTo(c.width / 2, bh + tail + 2); g.lineTo(c.width / 2 + 12, bh + 2); g.closePath(); g.fill();
  g.fillStyle = '#2b2230';
  g.font = `700 ${fs}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, (c.width - 6) / 2, bh / 2 + 5);
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
  work: ['보고서 어디까지 했어요?', '회의 5분 전!', '배포 성공 🎉', '커피 수혈 필요…☕', '이거 버그 아니고 기능이에요', 'PPT 한 장만 더!', '오늘 칼퇴 가능?', '타닥타닥 ⌨️', '메일 확인했어요!', '아이디어 있어요 💡', '엑셀 왜 이래…', '숫자 맞췄다!'],
  lobby: ['어서오세요! 😊', '누구 기다리는 중~', '좋은 하루 보내세요!', '이 쇼파 푹신하다', '점심 뭐 먹지?', '오늘 날씨 좋네요'],
  lounge: ['ㅋㅋㅋㅋㅋ', '어제 그거 봤어?', '이 과자 맛있다!', '주말에 뭐 해?', '하하하 😂', '피자 한 조각 더!', '생일 축하해요 🎂', '진짜요?!', '우리 팀 최고 👍', '나도 나도!', '아 배불러~', '그래서 어떻게 됐어?'],
  pingpong: ['나이스! 🏓', '한 판 더!', '스매시!', '으앗!', '11 : 9!', '봐주는 거야~'],
  nap: ['Zzz…', '5분만 더…', '💤', '음냐음냐…', 'Zzz… 회의…', '깨우지 마세요 🤫'],
  street: ['광화문 도착!', '은행잎 진짜 예쁘다 🍂', '저 빌딩 불빛 좋다', '점심 먹으러 가자', '버스 왔다!', '산책하기 딱 좋네'],
  office: ['안녕하세요! 👋', '반가워요!', '커피 한잔 하실래요?', '오늘도 화이팅! 💪', '같이 놀아요!', '헤헤 😊'],
};
const POKE_FROM = ['콕! 👉', '안녕~ 콕콕!', '나 여기 있지롱', '같이 놀자!', '뭐 해~?', '톡톡!'];
const POKE_TO = ['앗, 깜짝이야! 😳', '누구야~?', '간지러워 ㅋㅋ', '반가워요! 👋', '헉!', '왜 불러~?', '히힛 😆'];

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
function makeDesk(occupied) {
  const g = new THREE.Group();
  const top = DESK_TOP ||= pbr('oak_veneer_01', 1, 0.5, { rough: 0.55, fallback: 0xdcc3a1 });
  const leg = std(0xf1ede6, { roughness: 0.4, metalness: 0.2 });
  addBox(g, 1.5, 0.04, 0.75, top, 0, 0.74, 0);
  for (const sx of [-1, 1]) addBox(g, 0.04, 0.72, 0.68, leg, sx * 0.72, 0.36, 0);
  // 모니터
  addBox(g, 0.18, 0.02, 0.14, std(0x2b2b2f), 0, 0.77, -0.22);
  addBox(g, 0.04, 0.24, 0.03, std(0x2b2b2f), 0, 0.88, -0.24);
  addBox(g, 0.62, 0.38, 0.03, std(0x1c1c20, { roughness: 0.4 }), 0, 1.07, -0.22);
  addWallPlane(g, 0.58, 0.34, pick(screenMats), 0, 1.07, -0.204);
  addBox(g, 0.42, 0.02, 0.14, std(0xe9e6e0), 0, 0.77, 0.17);
  addBox(g, 0.06, 0.02, 0.1, std(0xe9e6e0), 0.32, 0.77, 0.17);
  if (Math.random() < 0.6) addCyl(g, 0.04, 0.1, std(pick([0xffffff, 0xe8774a, 0xf2b84b, 0x6aa7a0]), { roughness: 0.25 }), rand(-0.6, -0.4), 0.81, rand(-0.1, 0.15));
  const deco = Math.random();
  if (deco < 0.3) addModel(g, 'potted_plant_02_1k', 0.32, 0.56, 0.76, -0.18, rand(0, 6));
  else if (deco < 0.55) addModel(g, 'desk_lamp_arm_01_1k', 0.45, 0.58, 0.76, -0.2, -2.4);
  else if (deco < 0.75) addModel(g, 'rubber_duck_toy_1k', 0.09, 0.5, 0.76, 0.05, rand(-0.6, 0.6));
  if (Math.random() < 0.5) addBox(g, 0.22, rand(0.02, 0.08), 0.3, std(0xf8f4ec), -0.45, 0.78, -0.15, { ry: rand(-0.3, 0.3) });
  // 의자
  const chair = new THREE.Group();
  chair.position.z = 0.64;
  chair.rotation.y = rand(-0.25, 0.25);
  g.add(chair);
  const cm = std(pick([0x33363b, 0x33363b, 0xd2693c, 0x3e7c74]));
  addBox(chair, 0.5, 0.07, 0.48, cm, 0, 0.47, 0);
  addBox(chair, 0.48, 0.52, 0.06, cm, 0, 0.8, 0.25);
  addCyl(chair, 0.03, 0.38, std(0x777a80, { metalness: 0.7 }), 0, 0.25, 0);
  addCyl(chair, 0.28, 0.04, std(0x2a2a2e), 0, 0.05, 0);
  void occupied;
  return g;
}
function makePod(cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  interior.add(g);
  for (const [dx, dz, ry] of [[-0.78, 0.4, 0], [0.78, 0.4, 0], [-0.78, -0.4, Math.PI], [0.78, -0.4, Math.PI]]) {
    const d = makeDesk(false);
    d.position.set(dx, 0, dz);
    d.rotation.y = ry;
    g.add(d);
    const sx = cx + dx + Math.sin(ry) * 0.64, sz = cz + dz + Math.cos(ry) * 0.64;
    addSeat('desk', sx, sz, ry + Math.PI, { h: 0.5, ex: cx + dx + Math.sin(ry) * 1.35, ez: cz + dz + Math.cos(ry) * 1.35 });
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

function buildInterior() {
  const g = interior;
  const CEIL = GF - 0.15;
  // 바닥
  addPlane(g, 22.5, 6, pbr('large_floor_tiles_02', 22.5 / 2.4, 6 / 2.4, { color: 0xf3ece2, env: 1.2 }), -8.75, 0.005, -3);
  addPlane(g, 22.5, 24, pbr('concrete_floor_02', 22.5 / 4, 24 / 4, { color: 0xc9ccd2, rough: 0.8, env: 1.2 }), -8.75, 0.005, -18);
  addPlane(g, 17.5, 16, pbr('herringbone_parquet', 17.5 / 2.2, 16 / 2.2, { color: 0xfff1e2 }), 11.25, 0.005, -8);
  addPlane(g, 17.5, 14, pbr('herringbone_parquet', 17.5 / 2.2, 14 / 2.2, { color: 0xb89a86 }), 11.25, 0.005, -23);

  // 뒷벽 (벽돌)
  addBox(g, W, CEIL, 0.3, std(0xd9c6b0), 0, CEIL / 2, -D + 0.15);
  addWallPlane(g, W - 0.2, CEIL, pbr('red_brick_03', (W - 0.2) / 2.6, CEIL / 2.6, { color: 0xf2e2d4 }), 0, CEIL / 2, -D + 0.31);
  // 벽시계
  const clockTex = canvasTex(128, 128, (c) => {
    c.fillStyle = '#fffaf2'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill();
    c.strokeStyle = '#2b2230'; c.lineWidth = 6; c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 24); c.moveTo(64, 64); c.lineTo(92, 74); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillStyle = '#2b2230'; c.fillRect(64 + Math.cos(a) * 50 - 2, 64 + Math.sin(a) * 50 - 2, 4, 4); }
  });
  addWallPlane(g, 0.7, 0.7, new THREE.MeshBasicMaterial({ map: clockTex, transparent: true }), -2.5, 3.4, -D + 0.33);
  // 액자들
  [[-17, 0xe8774a], [-15.6, 0x6aa7a0], [-4.6, 0xf2b84b]].forEach(([x, c]) => {
    addBox(g, 0.9, 0.7, 0.04, std(0x3a2a20), x, 2.1, -D + 0.34);
    addBox(g, 0.78, 0.58, 0.02, std(c), x, 2.1, -D + 0.37);
  });

  /* ---------- 로비 ---------- */
  const recep = new THREE.Group();
  recep.position.set(-6.2, 0, -3.2);
  g.add(recep);
  const walnut = pbr('walnut_veneer', 2, 1, { rough: 0.5, fallback: 0xb07a4a });
  addBox(recep, 3.4, 0.9, 0.8, walnut, 0, 0.45, 0);
  addBox(recep, 3.6, 0.05, 1.0, std(0xf4efe6, { roughness: 0.2 }), 0, 0.925, 0);
  textPlane(recep, '보장원', 1.6, 0.4, 0, 0.5, 0.41, 0, { color: '#fff1d6', size: 130 });
  colBox(-6.2, -3.2, 3.7, 1.1);
  colCircle(3.4, -1.4, 0.32);
  addBox(recep, 0.4, 0.3, 0.05, std(0x1c1c20), 0.9, 1.1, -0.2, { rx: -0.2 });
  addModel(recep, 'ceramic_vase_01_1k', 0.35, -1.2, 0.95, 0.1);
  blob(recep, 0, 0, 0, 4.2, 1.6);
  addModel(g, 'concrete_cat_statue_1k', 0.45, 3.4, 0, -1.4, -0.6);
  makePlant(g, -2.4, -1.0, 1.2);
  makePlant(g, 2.4, -1.0, 1.2);
  makePlant(g, -19, -1, 1.4);
  // 대기 공간 (스캔 소파 · 암체어 · 커피테이블)
  if (!addModel(g, 'sofa_02_2k', 0.85, -14.5, 0, -1.0, Math.PI)) {
    addBox(g, 3, 0.45, 0.7, std(0x6aa7a0), -14.5, 0.225, -1.2);
    addBox(g, 3, 0.5, 0.15, std(0x5c958e), -14.5, 0.7, -1.5);
  }
  blob(g, -14.5, 0, -1.3, 3.2, 1.4);
  addModel(g, 'modern_arm_chair_01_1k', 0.85, -11.6, 0, -2.4, -1.9);
  blob(g, -11.6, 0, -2.4, 1.2, 1.2);
  addModel(g, 'coffee_table_round_01_2k', 0.45, -13.8, 0, -2.9, 0);
  addModel(g, 'food_apple_01_1k', 0.08, -13.7, 0.45, -2.85, 0);
  colBox(-14.5, -1.0, 2.2, 1.0);
  colCircle(-11.6, -2.4, 0.5);
  colCircle(-13.8, -2.9, 0.45);
  for (const x of [-15.05, -14.5, -13.95]) addSeat('sofa', x, -1.12, Math.PI, { h: 0.47, ex: x, ez: -2.0 });
  addSeat('sofa', -11.6 + Math.sin(-1.9) * 0.06, -2.4 + Math.cos(-1.9) * 0.06, -1.9, { h: 0.47, ex: -11.6 + Math.sin(-1.9) * 0.9, ez: -2.4 + Math.cos(-1.9) * 0.9 });

  /* ---------- 업무 공간 ---------- */
  for (const px of [-14.5, -6.5]) for (const pz of [-10, -17, -24]) makePod(px, pz);
  // 복합기 & 정수기
  addBox(g, 0.8, 1.0, 0.6, std(0xe7e3dc), 1.4, 0.5, -27.5);
  addBox(g, 0.7, 0.1, 0.5, std(0x3a3d42), 1.4, 1.05, -27.5);
  addCyl(g, 0.18, 1.0, std(0xf2f0eb), 1.6, 0.5, -20.5);
  addCyl(g, 0.16, 0.4, std(0x9fd3e8, { transparent: true, opacity: 0.7 }), 1.6, 1.2, -20.5);
  colBox(1.4, -27.5, 0.85, 0.65);
  colCircle(1.6, -20.5, 0.25);
  makePlant(g, -19, -29, 1.4);
  makePlant(g, -19, -6.6, 1.1);
  // 업무 조명
  zones.workLights = [
    new THREE.PointLight(0xffd7a8, 30, 16, 1.6),
    new THREE.PointLight(0xffd7a8, 30, 16, 1.6),
  ];
  zones.workLights[0].position.set(-10, 4.2, -11);
  zones.workLights[1].position.set(-10, 4.2, -23);
  g.add(...zones.workLights);
  const lobbyLight = new THREE.PointLight(0xffcf9a, 20, 13, 1.6);
  lobbyLight.position.set(-4, 4.2, -2.5);
  g.add(lobbyLight);

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
  makePlant(g, 3.4, -15.2, 1.0);
  // 네온사인
  textPlane(g, '다 같이 쉬어가요 ☕', 6, 1.0, 11.5, 3.0, -15.86, 0, { color: '#ffe3c4', glow: '#ff7b54', size: 120 });

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
  textPlane(g, '쉿! 꿀잠 존 💤', 1.9, 0.5, 3.55, 3.1, -15.93, 0, { color: '#fff1d6', size: 110 });
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
      addSph(g, 0.14, glow(0xffb870), x + 1.7, 0.82, -29.3);
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
  const napLight = new THREE.PointLight(0xffa56b, 5, 10, 1.7);
  napLight.position.set(11, 3, -23.5);
  g.add(napLight);

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
      this.master = ctx.createGain(); this.master.gain.value = 0.0;
      this.master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      // 웅성웅성
      this.murmur = ctx.createGain(); this.murmur.gain.value = 0.3; this.murmur.connect(this.master);
      for (let i = 0; i < 6; i++) {
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        src.playbackRate.value = rand(0.8, 1.2);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(280, 1100); bp.Q.value = rand(2, 5);
        const gn = ctx.createGain(); gn.gain.value = 0.0;
        const lfo = ctx.createOscillator(); lfo.frequency.value = rand(1.5, 4.5);
        const lg = ctx.createGain(); lg.gain.value = 0.35;
        lfo.connect(lg); lg.connect(gn.gain);
        const lfo2 = ctx.createOscillator(); lfo2.frequency.value = rand(0.1, 0.35);
        const lg2 = ctx.createGain(); lg2.gain.value = 120;
        lfo2.connect(lg2); lg2.connect(bp.frequency);
        src.connect(bp); bp.connect(gn); gn.connect(this.murmur);
        src.start(0, rand(0, 1.5)); lfo.start(); lfo2.start();
      }
      // 차량 소음
      this.traffic = ctx.createGain(); this.traffic.gain.value = 0.1; this.traffic.connect(this.master);
      const tsrc = ctx.createBufferSource(); tsrc.buffer = buf; tsrc.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      tsrc.connect(lp); lp.connect(this.traffic); tsrc.start();
      // 키보드 타닥
      this.fx = ctx.createGain(); this.fx.gain.value = 0.25; this.fx.connect(this.master);
      const typing = () => {
        if (this.on && mode.inside) {
          const burst = Math.floor(rand(3, 9));
          for (let i = 0; i < burst; i++) this.click(ctx.currentTime + i * rand(0.07, 0.16));
        }
        setTimeout(typing, rand(250, 1100));
      };
      typing();
    }
    this.ctx.resume();
    this.on = true;
    this.setMix();
  },
  stop() { this.on = false; if (this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); },
  setMix() {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(0.9, t, 0.3);
    this.murmur.gain.setTargetAtTime(mode.inside ? 0.38 : 0.05, t, 0.6);
    this.traffic.gain.setTargetAtTime(mode.inside ? 0.03 : 0.22, t, 0.6);
  },
  click(when) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = rand(1800, 3500);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, when);
    gn.gain.linearRampToValueAtTime(rand(0.08, 0.16), when + 0.002);
    gn.gain.exponentialRampToValueAtTime(0.001, when + 0.035);
    src.connect(hp); hp.connect(gn); gn.connect(this.fx);
    src.start(when, rand(0, 1.5), 0.05);
  },
  tok(vol = 1) {
    if (!this.on || !mode.inside) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.05);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.18 * vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(gn); gn.connect(this.fx); o.start(t); o.stop(t + 0.08);
  },
  pop() {
    if (!this.on) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(rand(500, 800), t); o.frequency.exponentialRampToValueAtTime(rand(900, 1300), t + 0.08);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.06, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(gn); gn.connect(this.fx); o.start(t); o.stop(t + 0.13);
  },
};

/* =========================================================================
   모드 / 카메라 트윈
   ========================================================================= */
const mode = { inside: false, playing: false };
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
  scene.environmentIntensity = v ? 0.5 : 0.6;
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
  sofa: { label: '🛋️ 쇼파에 앉기', pose: 'sit', state: 'sit', ph: 'lobby' },
  lounge: { label: '🛋️ 둘러앉기', pose: 'sit', state: 'sit', ph: 'lounge' },
  bean: { label: '🫘 빈백에 앉기', pose: 'sit', state: 'sit', ph: 'lounge' },
  pp: { label: '🏓 탁구 치기', pose: 'stand', state: 'pp', ph: 'pingpong' },
  bed: { label: '🛏️ 눕기', pose: 'lie', state: 'sleep', ph: 'nap' },
  recline: { label: '😌 기대 쉬기', pose: 'sit', state: 'doze', ph: 'nap' },
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
let lastSay = null, lastPoke = null;
const SPOTS = {
  street: { x: 0, z: 3.4, ry: Math.PI, label: '🏙️ 광화문 거리' },
  lobby: { x: 0, z: -4.2, ry: Math.PI, label: '🚪 로비' },
  work: { x: -2.2, z: -13.5, ry: -Math.PI / 2, label: '💻 업무공간' },
  lounge: { x: 6.4, z: -5.6, ry: faceTo(1, -0.6), label: '🛋️ 휴게실' },
  nap: { x: 5.4, z: -18.6, ry: faceTo(0.6, -1), label: '🛏️ 수면실' },
};
function cameraBehind(dur = 0) {
  const A = me.A;
  const dist = mode.inside ? 4.2 : 6.5;
  const tgt = new THREE.Vector3(A.x, A.y + 1.15, A.z);
  const pos = new THREE.Vector3(A.x - Math.sin(A.ry) * dist, A.y + (mode.inside ? 2.4 : 3.2), A.z - Math.cos(A.ry) * dist);
  if (dur) return flyTo(pos, tgt, dur);
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
  const tgt = new THREE.Vector3(seat.x, 0.155 + yOff, seat.z);
  const pos = new THREE.Vector3(seat.x + fx * d + fz * side, tgt.y + h, seat.z + fz * d - fx * side);
  pos.x = clamp(pos.x, -19.4, 19.4); pos.y = clamp(pos.y, 0.8, 4.5); pos.z = clamp(pos.z, -29.4, -0.6);
  flyTo(pos, tgt, 0.8);
}
function doAction() {
  if (!me.A || !mode.playing) return;
  if (me.A.seat) { leaveSeat(me.A); sendPresence(true); refreshContext(true); return; }
  const s = nearestFreeSeat();
  if (s) {
    me.target = null; me.auto = null;
    placeOnSeat(me.A, s);
    seatCamera(s);
    sendPresence(true);
    refreshContext(true);
  }
}
function mySay(text, style = 'normal') {
  if (!me.A) return;
  say(me.A.P, text, 3.4, style);
  lastSay = { t: text, n: ++sayN };
  sendPresence(true);
  audio.pop();
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
  A.moving = sp > 0.25;
  A.P.state = A.moving ? 'walk' : 'idle';
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
  if (!room || !me.A || !presenceDirty || presenceT < 0.1) return;
  presenceT = 0; presenceDirty = false;
  const A = me.A;
  const data = {
    v: 1, n: me.name, d: me.design,
    x: Math.round(A.x * 100) / 100, z: Math.round(A.z * 100) / 100, r: Math.round(A.ry * 100) / 100,
    k: A.seat ? A.seat.id : null,
  };
  if (lastSay) data.say = lastSay;
  if (lastPoke) data.poke = lastPoke;
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
    R = { A, design, name, peer: peer.peer, tx: num(pr.x, -110, 165), tz: num(pr.z, -30, 32), tr: num(pr.r, -10, 10), sayN: pr.say?.n, pokeN: pr.poke?.n };
    A.x = R.tx; A.z = R.tz; A.ry = R.tr; A.y = groundY(A.x, A.z);
    remotes.set(peer.peer, R);
  }
  R.tx = num(pr.x, -110, 165); R.tz = num(pr.z, -30, 32); R.tr = num(pr.r, -10, 10);
  const seat = typeof pr.k === 'string' ? seatById.get(pr.k) : null;
  if (seat && R.A.seat !== seat) placeOnSeat(R.A, seat);
  else if (!seat && R.A.seat) { R.A.seat = null; setPose(R.A.P, 'stand'); R.A.P.paddle.visible = false; R.A.P.state = 'idle'; }
  // 말풍선
  if (pr.say && pr.say.n !== R.sayN) {
    R.sayN = pr.say.n;
    const t = cleanText(pr.say.t, 40);
    if (t) say(R.A.P, t, 3.4, POKE_FROM.includes(t) || POKE_TO.includes(t) ? 'poke' : 'normal');
  }
  // 나를 찔렀나?
  if (pr.poke && pr.poke.n !== R.pokeN) {
    R.pokeN = pr.poke.n;
    if (myPeer && pr.poke.to === myPeer && me.A && mode.playing) {
      me.A.P.hopT = 0.55;
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
function updateOnline() {
  $('#online').textContent = `👥 ${remotes.size + (me.A ? 1 : 0)}명`;
}
function updateRemotes(dt) {
  for (const R of remotes.values()) {
    const A = R.A;
    if (A.seat) { syncAvatar(A); continue; }
    const dx = R.tx - A.x, dz = R.tz - A.z, d = Math.hypot(dx, dz);
    if (d > 8) { A.x = R.tx; A.z = R.tz; }
    else { const k = Math.min(1, dt * 8); A.x += dx * k; A.z += dz * k; }
    const sp = d * 8;
    A.moving = sp > 0.35;
    A.P.state = A.moving ? 'walk' : 'idle';
    A.P.walkRate = clamp(sp / 2.5, 0.6, 1.8);
    let dr = R.tr - A.ry; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    A.ry += dr * Math.min(1, dt * 10);
    A.y += (groundY(A.x, A.z) - A.y) * Math.min(1, dt * 14);
    syncAvatar(A);
  }
}
(async () => {
  try {
    if (!window.claude?.use) return;
    room = await window.claude.use('room');
    if (!room) return;
    room.onPeers(onPeers, () => { room = null; });
  } catch (e) { room = null; }
})();

/* =========================================================================
   상호작용: 클릭/탭 → 콕 찌르기 또는 그 자리로 걷기
   ========================================================================= */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPt = new THREE.Vector3();
let downXY = null;
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
  plane.constant = -me.A.y;
  if (raycaster.ray.intersectPlane(plane, hitPt) && hitPt.distanceTo(camera.position) < 40) {
    me.target = { x: hitPt.x, z: hitPt.z };
    me.auto = null;
  }
});
function poke(R) {
  pokeN++;
  lastPoke = { to: R.peer, n: pokeN };
  R.A.P.hopT = 0.45;
  if (!me.A.seat) me.A.ry = Math.atan2(R.A.x - me.A.x, R.A.z - me.A.z);
  me.A.P.waveT = 0.9;
  mySay(pick(POKE_FROM), 'poke');
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
  $('#sound').textContent = '🔊';
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
$('#sound').addEventListener('click', () => {
  if (audio.on) { audio.stop(); $('#sound').textContent = '🔇'; }
  else { audio.start(); $('#sound').textContent = '🔊'; }
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
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (!mode.playing) return;
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
  return isInsideXZ(A.x, A.z) ? 'office' : 'street';
}
function refreshContext(force) {
  if (!me.A) return;
  const A = me.A;
  const s = A.seat ? null : nearestFreeSeat();
  const label = A.seat ? '🚶 일어나기' : s ? SEAT_INFO[s.kind].label : '';
  const act = $('#act');
  if (act.textContent !== label) act.textContent = label;
  act.hidden = !label;
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
   빌드
   ========================================================================= */
buildStreet();
buildTraffic();
buildNeighbors();
buildGate();
buildTower();
buildInterior();
buildWorldColliders();
interior.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });
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

function updateBubbles(dt) {
  for (const P of people) {
    const b = P.bubble;
    if (!b || !b.visible) continue;
    P.bubbleT += dt;
    const k = P.bubbleT;
    const pop = k < 0.18 ? ease(k / 0.18) * 1.08 : k < 0.28 ? 1.08 - (k - 0.18) * 0.8 : 1;
    const fade = clamp((P.bubbleDur - k) / 0.35, 0, 1);
    const h = 0.32 * (camera.aspect < 0.8 ? 1.25 : 1);
    b.scale.set(h * P.bubbleAspect * pop, h * pop, 1);
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
  if (pp.u >= 1) { pp.u -= 1; pp.dir *= -1; audio.tok(1); }
  const u = pp.u, u0 = 0.62;
  const xs = -1.55 * pp.dir, xe = 1.55 * pp.dir;
  const x = xs + (xe - xs) * u;
  let y;
  if (u < u0) { const s = u / u0; y = 1.0 + (0.8 - 1.0) * s + 0.32 * Math.sin(Math.PI * s); }
  else { const s = (u - u0) / (1 - u0); y = 0.8 + (1.0 - 0.8) * s + 0.28 * Math.sin(Math.PI * s); }
  if (pp.lastHalf === 0 && u >= u0) audio.tok(0.6);
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
    controls.maxDistance = mode.inside ? 7 : 16;
    controls.maxPolarAngle = Math.PI * 0.49;
  }
  controls.update();
  if (me.A && !tween) {
    const p = camera.position;
    if (mode.inside) {
      p.x = clamp(p.x, -19.6, 19.6); p.y = clamp(p.y, 0.6, 4.6); p.z = clamp(p.z, -29.6, -0.4);
    } else {
      p.y = Math.max(p.y, me.A.y + 0.5);
      if (p.x > -20.6 && p.x < 20.6 && p.z < 0.45 && p.z > -31) p.z = 0.45;
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
  stars.mat.opacity = 0.75 + Math.sin(t * 2) * 0.2;
  blinkers.forEach((b) => { b.visible = Math.sin(t * 3) > 0; });
  ctxT += dt;
  if (ctxT > 0.2) { ctxT = 0; refreshContext(false); }

  if (composer) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 디버그/스크린샷용
window.__office = {
  camera, controls, me, teleport, doAction, seats, mySay, enterGame, keys, colliders, groundY, isInsideXZ,
  step: (dt) => updatePlayer(dt),
  pokeFirst() { const R = [...remotes.values()][0]; if (!R) return 'no remote'; poke(R); return 'poked ' + R.name; },
};
