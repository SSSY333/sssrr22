// 광화문 온기 오피스 — three.js 3D 웹페이지
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
  trees.forEach(([x, z]) => blob(g, x, 0.15, z, 2.2, 2.2));

  // 가로등
  const lamps = [];
  for (let x = -96; x <= 140; x += 18) { lamps.push([x + 4.5, 4.6, 0]); lamps.push([x + 4.5, 25.6, Math.PI]); }
  const poleIM = new THREE.InstancedMesh(CYL, std(0x2c2c33, { metalness: 0.6, roughness: 0.4 }), lamps.length);
  const headIM = new THREE.InstancedMesh(SPH, glow(0xffd08a), lamps.length);
  lamps.forEach(([x, z], i) => {
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
  addWallPlane(g, 2.2, 0.69, new THREE.MeshStandardMaterial({ map: sign, side: THREE.DoubleSide }), 8, 3.6, 4.82);

  // 중앙 광장: 금빛 동상 + 화단
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.32, envMap, envMapIntensity: 1.4 });
  const statue = new THREE.Group();
  statue.position.set(-42, 0.15, 15);
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
const SKINS = [0xf6d3b8, 0xefc3a2, 0xe2ad8a, 0xf8ddc8, 0xd59a74];
const SHIRTS = [0xe8774a, 0xf2b84b, 0x6aa7a0, 0xf4efe6, 0x9a7cc4, 0xe06b7a, 0x6a9be0, 0x9bbf6a, 0xffc9b0, 0x56637a, 0xf7d8e0, 0xbfe0f0];
const PANTS = [0x2f3542, 0x47505e, 0x7a6552, 0x2c3e66, 0x9b8a74, 0x4a3a5a];
const HAIRS = [0x241a15, 0x2e2019, 0x463024, 0x6b4630, 0x17120f, 0x8a5a3a, 0xc08a5a];
const HIP = 0.56; // 엉덩이(골반) 높이 — 짧은 다리의 귀여운 비율
const GEO = {
  torso: new THREE.CapsuleGeometry(0.2, 0.14, 8, 20),
  arm: new THREE.CapsuleGeometry(0.066, 0.18, 4, 12),
  thigh: new THREE.CapsuleGeometry(0.088, 0.12, 4, 12),
  shin: new THREE.CapsuleGeometry(0.078, 0.12, 4, 12),
  head: new THREE.SphereGeometry(0.27, 40, 28),
  hairTop: new THREE.SphereGeometry(0.287, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
  hairBack: new THREE.SphereGeometry(0.284, 32, 12, Math.PI * 0.82, Math.PI * 1.36, Math.PI * 0.45, Math.PI * 0.33),
  bangs: new THREE.SphereGeometry(1, 24, 12),
  hand: new THREE.SphereGeometry(0.064, 14, 10),
  eye: new THREE.SphereGeometry(0.046, 18, 14),
  shine: new THREE.SphereGeometry(0.015, 8, 6),
  blush: new THREE.CircleGeometry(0.05, 20),
  arc: new THREE.TorusGeometry(0.034, 0.009, 6, 18, Math.PI),
  ear: new THREE.SphereGeometry(0.058, 12, 10),
  shoe: new THREE.SphereGeometry(0.085, 14, 10),
};
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
// 귀여운 얼굴: 반짝이는 큰 눈, 볼터치, 작은 미소
function makeFace(hp, cy, o = {}) {
  const eyes = [];
  for (const sx of [-1, 1]) {
    if (o.closed) {
      const e = onFace(hp, GEO.arc, MOUTH_MAT, sx * 0.095, cy + 0.0, 0.255, cy, 0.9, 0.7, 0.7);
      e.rotateZ(Math.PI);
    } else {
      const e = onFace(hp, GEO.eye, EYE_MAT, sx * 0.095, cy + 0.005, 0.236, cy, 1, 1.15, 0.55);
      eyes.push(e);
      onFace(hp, GEO.shine, SHINE_MAT, sx * 0.095 + 0.016, cy + 0.03, 0.262, cy);
    }
    onFace(hp, GEO.blush, BLUSH_MAT, sx * 0.16, cy - 0.075, 0.205, cy, 1, 0.75, 1);
    onFace(hp, GEO.ear, hp.userData.skin, sx * 0.262, cy - 0.01, 0.0, cy, 0.7, 1, 1);
  }
  const mouth = onFace(hp, GEO.arc, MOUTH_MAT, 0, cy - 0.095, 0.255, cy, 0.7, 0.7, 0.7);
  mouth.rotateZ(Math.PI);
  return eyes;
}
function makeHair(hp, cy, mH, long) {
  addMesh(hp, GEO.hairTop, mH, 0, cy + 0.005, -0.012, 1, 1, 1, { rx: -0.22 });
  addMesh(hp, GEO.hairBack, mH, 0, cy, -0.005, 1, long ? 1.6 : 1, 1);
  addMesh(hp, GEO.bangs, mH, 0, cy + 0.17, 0.17, 0.23, 0.085, 0.12, { rx: -0.5 });
  if (long) for (const sx of [-1, 1]) addMesh(hp, GEO.bangs, mH, sx * 0.21, cy - 0.12, -0.04, 0.09, 0.2, 0.13);
}

function makePerson(o = {}) {
  const g = new THREE.Group();
  const mS = fabric(o.shirt ?? pick(SHIRTS));
  const mP = fabric(o.pants ?? pick(PANTS));
  const mK = skinMat(o.skin ?? pick(SKINS));
  const mH = std(o.hair ?? pick(HAIRS), { roughness: 0.55 });
  const torso = addMesh(g, GEO.torso, mS, 0, HIP + 0.2, 0, 1.06, 1, 0.92);
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.04;
  headPivot.userData.skin = mK;
  g.add(headPivot);
  const CY = 0.27;
  addMesh(headPivot, GEO.head, mK, 0, CY, 0, 1, 0.96, 0.98);
  makeHair(headPivot, CY, mH, o.longHair ?? Math.random() < 0.4);
  const eyes = makeFace(headPivot, CY, { closed: o.sleepy });
  const arms = [-1, 1].map((sx) => {
    const piv = new THREE.Group();
    piv.position.set(0.225 * sx, 0.97, 0);
    addMesh(piv, GEO.arm, mS, 0, -0.14, 0);
    addMesh(piv, GEO.hand, mK, 0, -0.29, 0);
    piv.rotation.z = 0.16 * sx;
    g.add(piv);
    return piv;
  });
  const shoeM = std(pick([0x2a2522, 0xf2efe8, 0x8a4b34, 0x3a4a6a]), { roughness: 0.5 });
  const legs = [-1, 1].map((sx) => {
    const hip = new THREE.Group();
    hip.position.set(0.095 * sx, HIP, 0);
    addMesh(hip, GEO.thigh, mP, 0, -0.13, 0);
    const knee = new THREE.Group();
    knee.position.y = -0.26;
    hip.add(knee);
    addMesh(knee, GEO.shin, mP, 0, -0.12, 0);
    addMesh(knee, GEO.shoe, shoeM, 0, -0.25, 0.035, 1, 0.62, 1.45);
    g.add(hip);
    return { hip, knee };
  });
  const P = {
    g, torso, headPivot, arms, legs, eyes,
    phase: Math.random() * 10,
    state: o.state || 'idle',
    zone: o.zone || 'work',
    baseY: 0, sitting: false, yawTarget: 0,
    bubble: null, bubbleT: 0, bubbleDur: 0, bubbleY: 1.72,
  };
  let groundY = 0;
  if (o.sit !== undefined) {
    P.sitting = true;
    P.sitOffset = o.sit + 0.07 - HIP;
    groundY = -P.sitOffset;
    legs.forEach((l) => { l.hip.rotation.x = -Math.PI / 2; l.knee.rotation.x = Math.PI / 2 - 0.25; });
  }
  if (o.mug) addCyl(arms[1], 0.05, 0.11, std(pick([0xffffff, 0xe8774a, 0x6aa7a0, 0xf2b84b]), { roughness: 0.25 }), 0, -0.33, 0.05);
  g.traverse((m) => {
    if (m.isMesh) {
      m.userData.person = P;
      if (o.cast) m.castShadow = true;
      clickables.push(m);
    }
  });
  if (!o.noBlob) blob(g, 0, groundY, 0.05, 0.75, 0.75);
  people.push(P);
  return P;
}
function place(P, parent, x, y, z, ry = 0) {
  P.baseY = y + (P.sitting ? P.sitOffset : 0);
  P.g.position.set(x, P.baseY, z);
  P.g.rotation.y = ry;
  P.bodyYaw = ry;
  parent.add(P.g);
  return P;
}
const faceTo = (dx, dz) => Math.atan2(dx, dz);

function makeSleeper(parent, x, y, z, blanketColor) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.6, -0.78);
  headPivot.rotation.x = -1.25;
  headPivot.scale.setScalar(0.82);
  const mK = skinMat(pick(SKINS));
  headPivot.userData.skin = mK;
  g.add(headPivot);
  addMesh(headPivot, GEO.head, mK, 0, 0, 0);
  addMesh(headPivot, GEO.hairTop, std(pick(HAIRS), { roughness: 0.55 }), 0, 0.005, -0.03, 1, 1, 1, { rx: -0.5 });
  makeFace(headPivot, 0, { closed: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.9, 6, 16), pbr('rough_linen', 2, 2, { color: blanketColor }));
  body.rotation.x = Math.PI / 2;
  body.scale.set(1.5, 1, 0.5);
  body.position.set(0, 0.52, 0.25);
  g.add(body);
  const P = { g, headPivot, body, state: 'sleep', zone: 'nap', phase: Math.random() * 10, baseY: y, bubble: null, bubbleT: 0, bubbleDur: 0, sleeper: true, bubbleY: 1.0 };
  g.traverse((m) => { if (m.isMesh) { m.userData.person = P; clickables.push(m); } });
  people.push(P);
  return P;
}

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
  const bg = style === 'sleep' ? '#d9e3ff' : style === 'me' ? '#ffe7a8' : '#fffaf2';
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
function say(P, text, dur = 3, style = 'normal') {
  if (!P.bubble) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    sp.center.set(0.5, 0);
    sp.position.y = P.bubbleY ?? 1.92;
    sp.renderOrder = 10;
    P.g.add(sp);
    P.bubble = sp;
  }
  const { tex, aspect } = bubbleTex(text, P.sleeper ? 'sleep' : style);
  P.bubble.material.map = tex;
  P.bubble.material.needsUpdate = true;
  P.bubbleAspect = aspect;
  P.bubbleT = 0;
  P.bubbleDur = dur;
  P.bubble.visible = true;
  P.lastText = text;
  if (/ㅋ|하하|😂|🤣|ㅎㅎ/.test(text)) P.laughT = dur;
}
const PHRASES = {
  work: ['보고서 어디까지 했어요?', '회의 5분 전!', '배포 성공 🎉', '점심 뭐 먹지?', '커피 수혈 필요…☕', '이거 버그 아니고 기능이에요', 'PPT 한 장만 더!', '오늘 칼퇴 가능?', '타닥타닥 ⌨️', '메일 확인했어요!', '아이디어 있어요 💡', '이번 주 금요일 회식!', '엑셀 왜 이래…', '숫자 맞췄다!'],
  lounge: ['ㅋㅋㅋㅋㅋ', '어제 그거 봤어?', '이 과자 맛있다!', '주말에 뭐 해?', '하하하 😂', '피자 한 조각 더!', '광화문 은행잎 예쁘더라 🍂', '생일 축하해요 🎂', '진짜요?!', '우리 팀 최고 👍', '나도 나도!', '아 배불러~', '다음 판은 내가 이긴다', '그래서 어떻게 됐어?'],
  pingpong: ['나이스! 🏓', '한 판 더!', '스매시!', '으앗!', '11 : 9!'],
  kitchen: ['라떼 드실 분?', '원두 새로 왔어요 ☕', '전자레인지 줄 서요~', '냉장고에 케이크 있어요'],
  nap: ['Zzz…', '5분만 더…', '💤', '음냐음냐…', 'Zzz… 회의…'],
  lobby: ['어서오세요! 😊', '방문증 여기 있어요', '좋은 하루 보내세요!'],
  street: ['광화문 도착!', '단풍 진짜 예쁘다 🍂', '저 빌딩 불빛 좋다', '점심 먹으러 가자', '버스 왔다!'],
  reply: ['안녕하세요! 👋', '반가워요!', '커피 한잔 하실래요?', '오늘도 화이팅! 💪', '어, 왔어요?', '같이 놀아요!', '헤헤 😊'],
  nap_reply: ['5분만…', '음냐… 누구세요…', 'Zzz…', '쉿… 🤫'],
};

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
    c.font = `800 140px ${FONT}`;
    c.textAlign = 'right';
    c.fillText('온기', w * 0.47, h / 2 + 6);
    c.textAlign = 'left';
    c.font = `600 74px ${FONT}`;
    c.fillText('ONGI Co.', w * 0.52, h / 2 + 4);
    c.fillStyle = '#f2b33d';
    c.beginPath(); c.arc(w * 0.495, h / 2 - 34, 14, 0, 7); c.fill();
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
  if (occupied) {
    const st = Math.random() < 0.7 ? 'type' : Math.random() < 0.5 ? 'phone' : 'talk';
    const P = makePerson({ sit: 0.5, state: st, zone: 'work' });
    place(P, g, 0, 0, 0.64, Math.PI);
  }
  return g;
}
function makePod(cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  interior.add(g);
  for (const [dx, dz, ry] of [[-0.78, 0.4, 0], [0.78, 0.4, 0], [-0.78, -0.4, Math.PI], [0.78, -0.4, Math.PI]]) {
    const d = makeDesk(Math.random() < 0.85);
    d.position.set(dx, 0, dz);
    d.rotation.y = ry;
    g.add(d);
  }
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
  textPlane(g, '함께라서 따뜻한 일터', 9, 1.1, -10, 3.4, -D + 0.33, 0, { color: '#fff1d6', size: 90 });
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
  textPlane(recep, '온기 ONGI', 1.6, 0.4, 0, 0.5, 0.41, 0, { color: '#fff1d6', size: 120 });
  addBox(recep, 0.4, 0.3, 0.05, std(0x1c1c20), 0.9, 1.1, -0.2, { rx: -0.2 });
  addModel(recep, 'ceramic_vase_01_1k', 0.35, -1.2, 0.95, 0.1);
  blob(recep, 0, 0, 0, 4.2, 1.6);
  addModel(g, 'concrete_cat_statue_1k', 0.45, 3.4, 0, -1.4, -0.6);
  const receptionist = makePerson({ state: 'talk', zone: 'lobby', shirt: 0xf2b84b });
  place(receptionist, recep, 0, 0, -0.9, 0);
  makePlant(g, -2.4, -1.0, 1.2);
  makePlant(g, 2.4, -1.0, 1.2);
  makePlant(g, -19, -1, 1.4);
  // 대기 공간 (스캔 소파 · 암체어 · 커피테이블)
  if (!addModel(g, 'sofa_02_2k', 0.85, -14.5, 0, -1.3, 0)) {
    addBox(g, 3, 0.45, 0.7, std(0x6aa7a0), -14.5, 0.225, -1.2);
    addBox(g, 3, 0.5, 0.15, std(0x5c958e), -14.5, 0.7, -1.5);
  }
  blob(g, -14.5, 0, -1.3, 3.2, 1.4);
  addModel(g, 'modern_arm_chair_01_1k', 0.85, -11.6, 0, -2.4, -1.9);
  blob(g, -11.6, 0, -2.4, 1.2, 1.2);
  addModel(g, 'coffee_table_round_01_2k', 0.45, -13.8, 0, -2.9, 0);
  addModel(g, 'food_apple_01_1k', 0.08, -13.7, 0.45, -2.85, 0);
  const visitor = makePerson({ sit: 0.45, state: 'phone', zone: 'lobby' });
  place(visitor, g, -15.0, 0, -1.25, 0);

  /* ---------- 업무 공간 ---------- */
  for (const px of [-14.5, -6.5]) for (const pz of [-10, -17, -24]) makePod(px, pz);
  // 화이트보드
  const wb = new THREE.Group();
  wb.position.set(-18.9, 0, -14);
  wb.rotation.y = Math.PI / 2;
  g.add(wb);
  addBox(wb, 3.1, 1.6, 0.06, std(0xaab0b6, { metalness: 0.5 }), 0, 1.7, 0);
  const wbTex = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#d33'; c.font = `800 40px ${FONT}`; c.fillText('Q4 목표 🎯', 20, 50);
    c.fillStyle = '#245'; c.font = `600 26px ${FONT}`;
    ['1. 고객 만족 120%', '2. 야근 없는 분기', '3. 금요일 피자 파티'].forEach((t, i) => c.fillText(t, 26, 100 + i * 40));
    ['#ffe27a', '#ffb3c1', '#a8e6cf', '#ffd3a5'].forEach((col, i) => { c.fillStyle = col; c.fillRect(330 + (i % 2) * 85, 40 + Math.floor(i / 2) * 85, 74, 74); });
    c.strokeStyle = '#2a7'; c.lineWidth = 4; c.beginPath(); c.moveTo(40, 230); c.bezierCurveTo(120, 180, 200, 240, 300, 200); c.stroke();
  });
  addWallPlane(wb, 3.0, 1.5, new THREE.MeshBasicMaterial({ map: wbTex }), 0, 1.7, 0.035);
  for (const sx of [-1, 1]) addBox(wb, 0.05, 0.9, 0.05, std(0x8a8f96), sx * 1.4, 0.45, 0);
  const t1 = makePerson({ state: 'talk', zone: 'work' });
  place(t1, g, -17.3, 0, -13.3, faceTo(-1, -0.5));
  const t2 = makePerson({ state: 'talk', zone: 'work', mug: true });
  place(t2, g, -17.0, 0, -14.9, faceTo(-0.9, 0.6));
  // 복합기 & 정수기
  addBox(g, 0.8, 1.0, 0.6, std(0xe7e3dc), 1.4, 0.5, -27.5);
  addBox(g, 0.7, 0.1, 0.5, std(0x3a3d42), 1.4, 1.05, -27.5);
  addCyl(g, 0.18, 1.0, std(0xf2f0eb), 1.6, 0.5, -20.5);
  addCyl(g, 0.16, 0.4, std(0x9fd3e8, { transparent: true, opacity: 0.7 }), 1.6, 1.2, -20.5);
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
  // 쇼파에 둘러앉은 사람들
  const sitN = 7;
  zones.loungeSitters = [];
  for (let i = 0; i < sitN; i++) {
    const a = a0 + 0.35 + (i / (sitN - 1)) * (a1 - a0 - 0.7);
    const r = 2.78;
    const P = makePerson({ sit: 0.43, state: 'chat', zone: 'lounge', mug: Math.random() < 0.35 });
    place(P, g, L.x + Math.cos(a) * r, 0, L.z - Math.sin(a) * r, faceTo(-Math.cos(a), Math.sin(a)));
    zones.loungeSitters.push(P);
  }
  // 빈백 + 사람
  addMesh(g, SPH, pbr('velour_velvet', 2, 2, { color: 0xf0bf55, noMap: true }), L.x + 4.9, 0.32, L.z + 0.4, 0.6, 0.38, 0.6);
  blob(g, L.x + 4.9, 0, L.z + 0.4, 1.5, 1.5);
  addModel(g, 'Ottoman_01_2k', 0.42, L.x + 4.4, 0, L.z + 2.2, 0.4);
  const bb = makePerson({ sit: 0.4, state: 'chat', zone: 'lounge' });
  place(bb, g, L.x + 4.9, 0, L.z + 0.4, faceTo(-1, -0.2));
  zones.loungeSitters.push(bb);
  // 서서 수다 떠는 사람들
  const st1 = makePerson({ state: 'talk', zone: 'lounge', mug: true });
  place(st1, g, L.x + 4.3, 0, L.z - 4.2, faceTo(-0.4, 1));
  const st2 = makePerson({ state: 'laugh', zone: 'lounge' });
  place(st2, g, L.x + 3.5, 0, L.z - 3.4, faceTo(0.7, -0.7));
  zones.loungeSitters.push(st1, st2);
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
  const barista = makePerson({ state: 'talk', zone: 'kitchen' });
  place(barista, g, 18.2, 0, -5.2, faceTo(1, 0));
  const kfriend = makePerson({ state: 'talk', zone: 'kitchen', mug: true });
  place(kfriend, g, 17.4, 0, -6.2, faceTo(0.6, 0.6));
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
  const pA = makePerson({ state: 'pingpong', zone: 'pingpong' });
  place(pA, pp, -1.85, 0, 0, faceTo(1, 0));
  const pB = makePerson({ state: 'pingpong', zone: 'pingpong' });
  place(pB, pp, 1.85, 0, 0, faceTo(-1, 0));
  [pA, pB].forEach((P) => addCyl(P.arms[1], 0.09, 0.015, std(0xc0392b), 0, -0.36, 0.06, { rx: Math.PI / 2 }));
  pingpong.players = [pA, pB];
  const fan = makePerson({ state: 'laugh', zone: 'pingpong', mug: true });
  place(fan, pp, 0.4, 0, 1.55, faceTo(0, -1));
  pingpong.fan = fan;
  makePlant(g, 19.2, -1.0, 1.3);
  makePlant(g, 3.4, -15.2, 1.0);
  // 네온사인
  textPlane(g, '다 같이 쉬어가요 ☕', 6, 1.0, 11.5, 3.0, -15.86, 0, { color: '#ffe3c4', glow: '#ff7b54', size: 120 });

  /* ---------- 수면실 ---------- */
  const wood = pbr('oak_veneer_01', 1, 1, { color: 0xc08a5c, rough: 0.6, fallback: 0xb07a4a });
  const frost = new THREE.MeshStandardMaterial({ color: 0xcfc0ad, transparent: true, opacity: 0.72, roughness: 1, side: THREE.DoubleSide, depthWrite: false });
  // z=-16 칸막이 (문 x 2.5~4.6)
  addBox(g, 15.4, 1.1, 0.12, wood, 12.3, 0.55, -16);
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
    if (i === 0 || i === 2) {
      const sl = makeSleeper(b, 0, 0, 0, blankets[i]);
      void sl;
    } else {
      addBox(b, 1.16, 0.08, 1.3, pbr('rough_linen', 2, 2, { color: blankets[i] }), 0, 0.54, 0.3);
    }
    // 협탁 & 무드등
    if (i < 3) {
      addBox(g, 0.45, 0.5, 0.45, wood, x + 1.7, 0.25, -29.3);
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
  });
  const dozer = makePerson({ sit: 0.42, state: 'doze', zone: 'nap' });
  place(dozer, g, 16.4, 0, -21.5, -0.4);
  for (let i = 0; i < 4; i++) addMesh(g, SPH, std(pick([0xf2b84b, 0xe8907a, 0xf4e6cf, 0x9bbf6a]), { roughness: 1 }), 14.4 + rand(-1, 1), 0.12, -23.4 + rand(-0.5, 0.5), 0.38, 0.12, 0.38);
  // 책 읽는 사람 (빈백)
  addMesh(g, SPH, pbr('velour_velvet', 2, 2, { color: 0x6aa7a0, noMap: true }), 4.6, 0.3, -24.6, 0.6, 0.36, 0.6);
  const reader = makePerson({ sit: 0.38, state: 'read', zone: 'nap' });
  place(reader, g, 4.6, 0, -24.6, faceTo(1, 0.4));
  addBox(reader.arms[0], 0.22, 0.28, 0.03, std(0xd65d6c), 0.15, -0.31, 0.08, { rx: -0.4 });
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

  /* ---------- 사무실을 오가는 사람들 ---------- */
  const loop = [[0.6, -4.4], [16.6, -4.4], [17.0, -11.8], [16.0, -14.4], [1.0, -14.6], [-2.2, -13.5], [-2.2, -5.0]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  for (let i = 0; i < 3; i++) {
    const P = makePerson({ state: 'walk', zone: 'walker', mug: i !== 1 });
    P.path = i === 1 ? [...loop].reverse() : loop;
    P.seg = (i * 2) % loop.length;
    P.speed = rand(0.9, 1.2);
    const st = P.path[P.seg];
    place(P, g, st.x, 0, st.z, 0);
    P.seg = (P.seg + 1) % P.path.length;
  }
}

/* ---------- 거리의 행인들 ---------- */
function buildPedestrians() {
  const lanes = [1.3, 2.6, 13.8, 16.2, 27.4, 29.6];
  const n = LOW ? 12 : 18;
  for (let i = 0; i < n; i++) {
    const z = lanes[i % lanes.length] + rand(-0.3, 0.3);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const P = makePerson({ state: 'walk', zone: 'street', cast: true });
    place(P, street, rand(-80, 90), 0.15, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    P.streetDir = dir;
    P.speed = rand(1.0, 1.5);
  }
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
   카메라 이동 / 모드
   ========================================================================= */
const VIEWS = {
  intro: { pos: [40, 21, 52], target: [-3, -1, -6] },
  street: { pos: [44, 15, 46], target: [-6, 9, -8] },
  lobby: { pos: [0.4, 3.5, -1.2], target: [3.5, 1.0, -11] },
  work: { pos: [0.6, 3.6, -6.0], target: [-10, 0.8, -17] },
  lounge: { pos: [5.0, 3.0, -4.4], target: [11, 0.6, -8.6] },
  nap: { pos: [4.4, 2.5, -17.4], target: [11.5, 0.6, -25.5] },
};
// 세로 화면(휴대폰)에서는 조금 더 뒤로 물러나서 보기
const VIEWS_PORTRAIT = {
  lobby: { pos: [0.6, 4.2, -0.9], target: [9, 0.3, -8.5] },
  work: { pos: [1.4, 4.5, -5.0], target: [-8.5, 0, -16.5] },
  nap: { pos: [8.5, 4.0, -16.5], target: [11, 0.2, -27] },
};
function viewFor(zone) {
  const a = innerWidth / innerHeight;
  if (a < 0.8 && VIEWS_PORTRAIT[zone]) return VIEWS_PORTRAIT[zone];
  const v = VIEWS[zone];
  const k = zone === 'street' || zone === 'intro' ? (a < 0.8 ? 1.25 : 1) : (a < 0.8 ? 1.4 : a < 1.2 ? 1.15 : 1);
  const p = v.pos.map((c, i) => v.target[i] + (c - v.target[i]) * k);
  if (mode.inside || zone !== 'street') { p[0] = clamp(p[0], -19.4, 19.4); p[1] = clamp(p[1], 0.8, 4.5); p[2] = clamp(p[2], -29.4, -0.6); }
  return { pos: p, target: v.target };
}
const ZONE_LABEL = { street: '광화문 거리', lobby: '로비', work: '업무공간', lounge: '휴게실', nap: '수면실' };
const mode = { inside: false, zone: 'street', busy: false };
let tween = null;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function flyTo(pos, target, dur = 2) {
  return new Promise((res) => {
    tween = {
      fp: camera.position.clone(), ft: controls.target.clone(),
      tp: new THREE.Vector3(...pos), tt: new THREE.Vector3(...target),
      t: 0, dur, res,
    };
  });
}
function setInside(v) {
  mode.inside = v;
  scene.environment = (v ? envIn : envOut) || envOut;
  scene.environmentIntensity = v ? 0.5 : 0.6;
  if (v) {
    controls.minDistance = 0.6; controls.maxDistance = 9; controls.maxPolarAngle = Math.PI * 0.53;
    controls.enablePan = true; controls.autoRotate = false;
  } else {
    controls.minDistance = 12; controls.maxDistance = 85; controls.maxPolarAngle = Math.PI * 0.47;
    controls.enablePan = false;
  }
  audio.setMix();
}
function setActive(zone) {
  mode.zone = zone;
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('active', b.dataset.zone === zone));
  $('#zoneLabel').textContent = ZONE_LABEL[zone];
}
async function enterBuilding() {
  controls.autoRotate = false;
  await flyTo([0, 2.6, 15], [0, 2.3, 0], 2.6);
  doors.target = 1;
  await wait(500);
  await flyTo([0, 2.0, -1.4], [0, 1.7, -10], 2.0);
  setInside(true);
  doors.target = 0;
}
async function exitBuilding() {
  doors.target = 1;
  await flyTo([0, 1.9, -2.2], [0, 1.9, 6], 1.4);
  await flyTo([0, 2.4, 9], [0, 2.4, 0], 1.6);
  setInside(false);
  doors.target = 0;
}
async function goTo(zone) {
  if (mode.busy || (zone === mode.zone && !tween)) return;
  mode.busy = true;
  controls.enabled = false;
  setActive(zone);
  try {
    if (zone === 'street') {
      if (mode.inside) await exitBuilding();
      const v = viewFor('street');
      await flyTo(v.pos, v.target, 2.4);
    } else {
      if (!mode.inside) await enterBuilding();
      const v = viewFor(zone);
      await flyTo(v.pos, v.target, zone === 'lobby' ? 1.4 : 2.0);
    }
  } finally {
    controls.enabled = true;
    mode.busy = false;
  }
}

/* =========================================================================
   상호작용 (사람 탭하기)
   ========================================================================= */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downXY = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downXY) return;
  const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved > 8 || !$('#intro').classList.contains('hidden')) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(clickables, false)[0];
  if (hit && hit.distance < 40) {
    const P = hit.object.userData.person;
    say(P, P.sleeper ? pick(PHRASES.nap_reply) : pick(PHRASES.reply), 2.8, 'me');
    P.waveT = 1.4;
    audio.pop();
  }
});

/* =========================================================================
   UI
   ========================================================================= */
$('#enter').addEventListener('click', async () => {
  $('#intro').classList.add('hidden');
  ['#brand', '#nav', '#sound'].forEach((s) => $(s).classList.remove('hidden'));
  audio.start();
  $('#sound').textContent = '🔊';
  await goTo('lobby');
  $('#hint').classList.remove('hidden');
  setTimeout(() => $('#hint').classList.add('hidden'), 6000);
});
document.querySelectorAll('#nav button').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.zone)));
$('#sound').addEventListener('click', () => {
  if (audio.on) { audio.stop(); $('#sound').textContent = '🔇'; }
  else { audio.start(); $('#sound').textContent = '🔊'; }
});

function onResize() {
  const a = innerWidth / innerHeight;
  camera.aspect = a;
  camera.fov = a < 0.8 ? 70 : a < 1.2 ? 62 : 55;
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
buildPedestrians();
interior.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });

// 데스크톱: 따뜻한 조명이 은은하게 번지는 블룸 (휴대폰은 가볍게 생략)
if (!LOW) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.5, 0.96));
  composer.addPass(new OutputPass());
}
onResize();
{
  const v = viewFor('intro');
  camera.position.set(...v.pos);
  controls.target.set(...v.target);
}
setInside(false);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
setActive('street');
$('#enter').disabled = false;
$('#enter').textContent = '회사로 입장하기 →';

/* =========================================================================
   애니메이션 루프
   ========================================================================= */
const BUBBLE_RATE = { work: 1.0, lounge: 0.5, kitchen: 4, pingpong: 3.5, nap: 3.0, lobby: 6, street: 2.5 };
const bubbleClock = {};
const byZone = {};
people.forEach((P) => { (byZone[P.zone] ||= []).push(P); });
Object.keys(BUBBLE_RATE).forEach((z) => { bubbleClock[z] = rand(0, 2); });
let loungeSpeaker = null;
const tmpV = new THREE.Vector3();
const camOffset = new THREE.Vector3();

function updatePerson(P, t, dt) {
  const ph = t + P.phase;
  if (P.sleeper) {
    const br = Math.sin(ph * 1.3);
    P.body.scale.y = 1 + br * 0.04;
    P.body.scale.x = 1.35 + br * 0.02;
    return;
  }
  const [aL, aR] = P.arms;
  const hp = P.headPivot;
  if (P.eyes?.length) {
    const b = (ph * 0.9) % 4.3 < 0.13 ? 0.12 : 1.15;
    P.eyes[0].scale.y = P.eyes[1].scale.y = b;
  }
  let bob = 0;
  switch (P.state) {
    case 'type':
      aL.rotation.x = -1.05 + Math.sin(ph * 17) * 0.07;
      aR.rotation.x = -1.05 + Math.sin(ph * 15 + 1) * 0.07;
      hp.rotation.x = 0.12 + Math.sin(ph * 0.6) * 0.05;
      hp.rotation.y = Math.sin(ph * 0.31) * 0.18;
      break;
    case 'phone':
      aL.rotation.x = -0.9;
      aR.rotation.x = -2.7; aR.rotation.z = -0.55;
      hp.rotation.y = Math.sin(ph * 0.8) * 0.3;
      hp.rotation.z = 0.1;
      break;
    case 'read':
      aL.rotation.x = -1.1; aR.rotation.x = -1.1;
      hp.rotation.x = 0.35 + Math.sin(ph * 0.4) * 0.04;
      break;
    case 'pingpong':
      break;
    case 'doze':
      aL.rotation.x = -0.5; aR.rotation.x = -0.5;
      hp.rotation.x = 0.45 + Math.sin(ph * 0.5) * 0.08;
      hp.rotation.z = 0.25;
      break;
    case 'walk': {
      const sw = Math.sin(ph * 6.5);
      P.legs[0].hip.rotation.x = sw * 0.5;
      P.legs[1].hip.rotation.x = -sw * 0.5;
      P.legs[0].knee.rotation.x = Math.max(0, -sw) * 0.7;
      P.legs[1].knee.rotation.x = Math.max(0, sw) * 0.7;
      aL.rotation.x = -sw * 0.4;
      if (!P.arms[1].children[2]) aR.rotation.x = sw * 0.4; else aR.rotation.x = -0.9;
      bob = Math.abs(Math.cos(ph * 6.5)) * 0.04;
      hp.rotation.y = Math.sin(ph * 0.5) * 0.2;
      break;
    }
    case 'chat': {
      // 말하는 사람을 바라보기
      const speaker = loungeSpeaker && loungeSpeaker !== P ? loungeSpeaker : null;
      let yaw = Math.sin(ph * 0.4) * 0.3;
      if (speaker) {
        P.g.getWorldPosition(tmpV);
        const sp = speaker.g.position, me = P.g.position;
        let rel = Math.atan2(sp.x - me.x, sp.z - me.z) - P.bodyYaw;
        rel = Math.atan2(Math.sin(rel), Math.cos(rel));
        yaw = clamp(rel, -1.1, 1.1);
      }
      hp.rotation.y += (yaw - hp.rotation.y) * Math.min(1, dt * 4);
      hp.rotation.x = Math.sin(ph * 1.7) * 0.06;
      aL.rotation.x = -0.35 + Math.sin(ph * 0.9) * 0.05;
      aR.rotation.x = P.arms[1].children[2] ? -1.1 + Math.max(0, Math.sin(ph * 0.5)) * -0.6 : -0.35;
      if (P.bubble?.visible) { aL.rotation.x = -0.7 + Math.sin(ph * 4) * 0.35; hp.rotation.x = Math.sin(ph * 5) * 0.1; }
      break;
    }
    case 'laugh':
    case 'talk':
    default:
      hp.rotation.y = Math.sin(ph * 1.1) * 0.35;
      hp.rotation.x = Math.sin(ph * 2.3) * 0.07;
      aL.rotation.x = -0.25 + Math.sin(ph * 2.6) * 0.25;
      aR.rotation.x = P.arms[1].children[2] ? -1.15 + Math.sin(ph * 0.7) * 0.15 : -0.5 + Math.sin(ph * 3.1) * 0.4;
      if (P.state === 'laugh') bob = Math.abs(Math.sin(ph * 8)) * 0.03;
      break;
  }
  if (P.laughT > 0) {
    P.laughT -= dt;
    bob = Math.abs(Math.sin(ph * 10)) * 0.045;
    hp.rotation.x = -0.25;
  }
  if (P.waveT > 0) {
    P.waveT -= dt;
    aR.rotation.x = -2.8; aR.rotation.z = -0.3 + Math.sin(ph * 14) * 0.35;
  } else if (P.state !== 'phone') aR.rotation.z = 0.08;
  P.g.position.y = P.baseY + bob;
}

function updateWalker(P, dt) {
  if (P.streetDir) {
    P.g.position.x += P.streetDir * P.speed * dt;
    if (P.g.position.x > 100) P.g.position.x = -90;
    if (P.g.position.x < -90) P.g.position.x = 100;
    return;
  }
  if (!P.path) return;
  const tgt = P.path[P.seg];
  const pos = P.g.position;
  const dx = tgt.x - pos.x, dz = tgt.z - pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.1) { P.seg = (P.seg + 1) % P.path.length; return; }
  const step = Math.min(dist, P.speed * dt);
  pos.x += (dx / dist) * step;
  pos.z += (dz / dist) * step;
  const want = Math.atan2(dx, dz);
  let d = want - P.g.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  P.g.rotation.y += d * Math.min(1, dt * 6);
}

function updateBubbles(t, dt) {
  for (const zone in BUBBLE_RATE) {
    bubbleClock[zone] -= dt;
    if (bubbleClock[zone] > 0) continue;
    bubbleClock[zone] = BUBBLE_RATE[zone] * rand(0.6, 1.4);
    const list = (byZone[zone] || []).filter((P) => !P.bubble?.visible);
    if (!list.length) continue;
    const P = pick(list);
    say(P, pick(PHRASES[zone]), rand(2.4, 3.8));
    if (zone === 'lounge') loungeSpeaker = P;
  }
  for (const P of people) {
    const b = P.bubble;
    if (!b || !b.visible) continue;
    P.bubbleT += dt;
    const k = P.bubbleT;
    const pop = k < 0.18 ? ease(k / 0.18) * 1.08 : k < 0.28 ? 1.08 - (k - 0.18) * 0.8 : 1;
    const fade = clamp((P.bubbleDur - k) / 0.35, 0, 1);
    const h = (P.sleeper ? 0.36 : 0.34) * (mode.inside ? 1 : 2.2) * (camera.aspect < 0.8 ? 1.3 : 1);
    b.scale.set(h * P.bubbleAspect * pop, h * pop, 1);
    b.material.opacity = fade;
    if (P.sleeper) b.position.y = P.bubbleY + k * 0.12;
    if (k > P.bubbleDur) { b.visible = false; if (loungeSpeaker === P) loungeSpeaker = null; }
  }
}

function updatePingPong(dt) {
  const pp = pingpong;
  pp.u += dt * pp.speed;
  if (pp.u >= 1) {
    pp.u -= 1; pp.dir *= -1;
    audio.tok(1);
    if (Math.random() < 0.08) say(pick([...pp.players, pp.fan]), pick(PHRASES.pingpong), 2);
  }
  const u = pp.u, u0 = 0.62;
  let x, y;
  const xs = -1.55 * pp.dir, xe = 1.55 * pp.dir;
  x = xs + (xe - xs) * u;
  if (u < u0) { const s = u / u0; y = 1.0 + (0.8 - 1.0) * s + 0.32 * Math.sin(Math.PI * s); }
  else { const s = (u - u0) / (1 - u0); y = 0.8 + (1.0 - 0.8) * s + 0.28 * Math.sin(Math.PI * s); }
  if (pp.lastHalf === 0 && u >= u0) audio.tok(0.6);
  pp.lastHalf = u >= u0 ? 1 : 0;
  pp.ball.position.set(x, y, Math.sin(u * Math.PI) * 0.25 * pp.dir);
  // 받는 쪽 선수의 스윙
  pp.players.forEach((P, i) => {
    const receiving = (i === 1) === (pp.dir > 0);
    const near = receiving ? Math.max(0, (u - 0.75) / 0.25) : Math.max(0, 1 - u / 0.2);
    P.arms[1].rotation.x = -0.6 - near * 0.9;
    P.arms[1].rotation.z = 0.2 - near * 0.6;
    P.arms[0].rotation.x = -0.4;
    P.headPivot.rotation.y = Math.sin(pp.ball.position.z * 2) * 0.2;
    P.g.position.z = pp.ball.position.z * 0.5;
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

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 카메라 트윈
  if (tween) {
    tween.t += dt / tween.dur;
    const k = ease(Math.min(tween.t, 1));
    camera.position.lerpVectors(tween.fp, tween.tp, k);
    controls.target.lerpVectors(tween.ft, tween.tt, k);
    if (tween.t >= 1) { const r = tween.res; tween = null; r(); }
  }
  controls.update();
  if (mode.inside && !tween) {
    // 실내에서는 벽/천장 밖으로 나가지 않도록
    const p = camera.position, tg = controls.target;
    camOffset.copy(p);
    p.x = clamp(p.x, -19.6, 19.6); p.y = clamp(p.y, 0.7, 4.6); p.z = clamp(p.z, -29.6, -0.4);
    tg.x = clamp(tg.x, -19.5, 19.5); tg.y = clamp(tg.y, 0.2, 4.4); tg.z = clamp(tg.z, -29.5, -0.5);
  } else if (!tween) {
    camera.position.y = Math.max(camera.position.y, 1.6);
  }

  // 자동문
  doors.open += (doors.target - doors.open) * Math.min(1, dt * 4);
  for (const d of [doors.L, doors.R]) d.position.x = d.userData.sx * (0.8 + doors.open * 1.55);

  // 차량
  for (const c of cars) {
    c.g.position.x += c.dir * c.speed * dt;
    if (c.dir > 0 && c.g.position.x > 220) c.g.position.x = -110;
    if (c.dir < 0 && c.g.position.x < -110) c.g.position.x = 220;
  }

  for (const P of people) {
    if (P.state === 'walk') updateWalker(P, dt);
    updatePerson(P, t, dt);
  }
  updateBubbles(t, dt);
  updatePingPong(dt);
  updateLeaves(t, dt);
  stars.mat.opacity = 0.75 + Math.sin(t * 2) * 0.2;
  blinkers.forEach((b) => { b.visible = Math.sin(t * 3) > 0; });

  if (composer) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 디버그/스크린샷용
window.__office = {
  goTo, VIEWS, camera, controls,
  jump(z) { setInside(z !== 'street'); const v = viewFor(z); camera.position.set(...v.pos); controls.target.set(...v.target); setActive(z); },
};
