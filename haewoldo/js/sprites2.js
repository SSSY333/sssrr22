'use strict';
/* =========================================================
 *  해월도 v6 — 가구 다시 그리기 (쿼터뷰 블록 · 4방향 회전 · 여러 칸 가구)
 *  모든 가구는 같은 투영식 P(x,y,z) = (x−y)·16, (x+y)·8 − z 로 그려
 *  원근감과 픽셀 밀도가 통일된다. 찌그러지는 비균일 확대 없음.
 * ========================================================= */

/* 정준 좌표: u = 가로(폭), v = 깊이(앞쪽이 +v). rot 0: +y(왼쪽 아래)를 봄, 1: +x, 2: −y, 3: −x */
function rotPt(u, v, W, D, rot) {
  if (rot === 1) return [v, W - u];
  if (rot === 2) return [W - u, D - v];
  if (rot === 3) return [D - v, u];
  return [u, v];
}
function furnFoot(k, rot) { const F = FURN[k] || {}; const w = F.fw || 1, d = F.fd || 1; return (rot & 1) ? [d, w] : [w, d]; }

/* 블록 목록을 그린다. 블록: [u0, v0, u1, v1, z0, z1, top, left, right] */
function drawBlocks(g, ox, oy, blocks, W, D, rot) {
  const P = (x, y, z) => [ox + (x - y) * 16, oy + (x + y) * 8 - z];
  const list = blocks.map(b => {
    const a = rotPt(b[0], b[1], W, D, rot), c = rotPt(b[2], b[3], W, D, rot);
    const x0 = Math.min(a[0], c[0]), x1 = Math.max(a[0], c[0]), y0 = Math.min(a[1], c[1]), y1 = Math.max(a[1], c[1]);
    return { x0, x1, y0, y1, z0: b[4], z1: b[5], top: b[6], left: b[7] || shade(b[6], 0.84), right: b[8] || shade(b[6], 0.7), key: (x0 + x1) / 2 + (y0 + y1) / 2 + b[4] * 0.004 };
  });
  list.sort((p, q) => p.key - q.key);
  for (const b of list) {
    const { x0, x1, y0, y1, z0, z1 } = b;
    if (z1 > z0) {
      fillPoly(g, [P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)], b.left);
      fillPoly(g, [P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)], b.right);
    }
    fillPoly(g, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], b.top);
  }
}
const _blk = (u0, v0, u1, v1, z0, z1, top, left, right) => [u0, v0, u1, v1, z0, z1, top, left, right];
const WOOD_C = ['#c99a64', '#a87a4a', '#8a5f38'], DARKW = ['#8a5a3a', '#74492f', '#5f3b25'];
function legs(u0, v0, u1, v1, h, col, t = 0.09) { return [_blk(u0, v0, u0 + t, v0 + t, 0, h, col), _blk(u1 - t, v0, u1, v0 + t, 0, h, col), _blk(u0, v1 - t, u0 + t, v1, 0, h, col), _blk(u1 - t, v1 - t, u1, v1, 0, h, col)]; }

/* 새 가구 정의: blocks(rot 무관한 정준 블록) · fw/fd 크기 · cat 분류 */
const FURN2 = {
  bed: { name: '싱글 침대', price: 30000, fw: 1, fd: 2, cat: 'bed', act: 'sleep', sleep: true, blocks: () => [
    _blk(0.06, 0.06, 0.94, 1.94, 0, 6, '#9a6a42', '#8a5a3a', '#74492f'),                 // 프레임
    _blk(0.12, 0.14, 0.88, 1.88, 6, 10, '#fbf8f2', '#e9e3d8', '#d9d1c4'),                // 매트리스
    _blk(0.18, 0.2, 0.82, 0.58, 10, 13, '#ffffff', '#ece8e0', '#dcd6cc'),                 // 베개
    _blk(0.1, 0.72, 0.9, 1.9, 10, 12, '#f19ab5', '#d97f9a', '#c46a86'),                  // 이불
    _blk(0.1, 0.72, 0.9, 0.84, 12, 12.6, '#fbd3df'),                                     // 이불 접힌 단
    _blk(0.04, 0.0, 0.96, 0.1, 0, 20, '#a87a4a', '#946a40', '#7a5236'),                  // 머리판
  ] },
  bedS: { name: '싱글 침대 (하늘)', price: 30000, fw: 1, fd: 2, cat: 'bed', act: 'sleep', sleep: true, blocks: () => [
    _blk(0.06, 0.06, 0.94, 1.94, 0, 6, '#e9eef2', '#cfd8de', '#b9c4cc'), _blk(0.12, 0.14, 0.88, 1.88, 6, 10, '#fbf8f2', '#e9e3d8', '#d9d1c4'),
    _blk(0.18, 0.2, 0.82, 0.58, 10, 13, '#ffffff', '#ece8e0', '#dcd6cc'), _blk(0.1, 0.72, 0.9, 1.9, 10, 12, '#8fc3ea', '#74a8d0', '#5f93bb'), _blk(0.1, 0.72, 0.9, 0.84, 12, 12.6, '#cfe6f7'),
    _blk(0.04, 0.0, 0.96, 0.1, 0, 20, '#dfe7ec', '#c3ced5', '#aab7c0') ] },
  bedD: { name: '더블 침대', price: 52000, fw: 2, fd: 2, cat: 'bed', act: 'sleep', sleep: true, blocks: () => [
    _blk(0.06, 0.06, 1.94, 1.94, 0, 6, '#9a6a42', '#8a5a3a', '#74492f'), _blk(0.12, 0.14, 1.88, 1.88, 6, 10, '#fbf8f2', '#e9e3d8', '#d9d1c4'),
    _blk(0.2, 0.2, 0.9, 0.56, 10, 13, '#ffffff'), _blk(1.1, 0.2, 1.8, 0.56, 10, 13, '#ffffff'),
    _blk(0.1, 0.72, 1.9, 1.9, 10, 12, '#f2d06a', '#d9b44f', '#c49f3f'), _blk(0.1, 0.72, 1.9, 0.84, 12, 12.6, '#fff1b8'),
    _blk(0.04, 0.0, 1.96, 0.1, 0, 22, '#a87a4a', '#946a40', '#7a5236') ] },
  bedCouple: { name: '커플 침대', price: 68000, fw: 2, fd: 2, cat: 'couple', act: 'sleep', sleep: true, blocks: () => [
    _blk(0.06, 0.06, 1.94, 1.94, 0, 6, '#f4efe6', '#ddd5c8', '#c9bfb0'), _blk(0.12, 0.14, 1.88, 1.88, 6, 10, '#fffaf4', '#ede6dc', '#ddd4c8'),
    _blk(0.2, 0.2, 0.9, 0.56, 10, 13, '#fbd3df'), _blk(1.1, 0.2, 1.8, 0.56, 10, 13, '#cfe6f7'),
    _blk(0.1, 0.72, 1.9, 1.9, 10, 12, '#ff9ab5', '#e57f9c', '#cf6c88'), _blk(0.8, 1.15, 1.2, 1.45, 12, 13, '#ffffff'),
    _blk(0.04, 0.0, 1.96, 0.1, 0, 24, '#f7b9c9', '#e39fb2', '#cf8a9e'), _blk(0.8, 0.0, 1.2, 0.12, 20, 27, '#ff6f91') ] },
  nightstand: { name: '협탁', price: 9000, cat: 'bed', blocks: () => [_blk(0.18, 0.2, 0.82, 0.8, 0, 11, ...WOOD_C), _blk(0.22, 0.79, 0.78, 0.82, 4, 9, '#b98a58'), _blk(0.45, 0.82, 0.55, 0.86, 6, 7, '#f2d06a'), _blk(0.3, 0.35, 0.5, 0.55, 11, 15, '#fff1c2', '#e9d9a0', '#d9c58a')] },
  wardrobe: { name: '옷장', price: 26000, cat: 'bed', act: 'wardrobe', blocks: () => [_blk(0.06, 0.22, 0.94, 0.86, 0, 34, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.49, 0.85, 0.51, 0.88, 3, 31, '#7a5236'), _blk(0.4, 0.86, 0.46, 0.9, 16, 19, '#f2d06a'), _blk(0.54, 0.86, 0.6, 0.9, 16, 19, '#f2d06a'), _blk(0.02, 0.18, 0.98, 0.9, 34, 36, '#b98a58')] },
  lamp: { name: '스탠드 조명', price: 7000, cat: 'bed', light: true, blocks: () => [_blk(0.36, 0.36, 0.64, 0.64, 0, 2, '#5b5f69'), _blk(0.47, 0.47, 0.53, 0.53, 2, 20, '#5b5f69'), _blk(0.3, 0.3, 0.7, 0.7, 20, 27, '#fff1c2', '#f2dc94', '#e0c574')] },
  sofa: { name: '1인 소파', price: 16000, cat: 'living', act: 'sit', seat: true, blocks: () => [
    _blk(0.08, 0.14, 0.92, 0.92, 0, 7, '#6f93d6', '#5577b8', '#476aa8'), _blk(0.08, 0.14, 0.92, 0.36, 7, 17, '#7fa3e6', '#5f83c6', '#5577b8'),
    _blk(0.08, 0.36, 0.22, 0.92, 7, 11, '#7fa3e6'), _blk(0.78, 0.36, 0.92, 0.92, 7, 11, '#7fa3e6'), _blk(0.22, 0.36, 0.78, 0.9, 7, 9, '#9dbaf0')] },
  sofa2: { name: '2인 소파', price: 28000, fw: 2, fd: 1, cat: 'living', act: 'sit', seat: true, blocks: () => [
    _blk(0.06, 0.14, 1.94, 0.92, 0, 7, '#e3889a', '#c96c80', '#b35c70'), _blk(0.06, 0.14, 1.94, 0.36, 7, 17, '#f19ab5', '#d97f9a', '#c46a86'),
    _blk(0.06, 0.36, 0.2, 0.92, 7, 11, '#f19ab5'), _blk(1.8, 0.36, 1.94, 0.92, 7, 11, '#f19ab5'),
    _blk(0.2, 0.36, 0.98, 0.9, 7, 9, '#f8b9cb'), _blk(1.02, 0.36, 1.8, 0.9, 7, 9, '#f8b9cb'), _blk(0.4, 0.3, 0.7, 0.42, 9, 14, '#fff1b8')] },
  table: { name: '원목 테이블', price: 12000, cat: 'living', act: 'eat', blocks: () => [...legs(0.14, 0.14, 0.86, 0.86, 10, '#7a5236'), _blk(0.08, 0.08, 0.92, 0.92, 10, 13, '#d7a874', '#b98a58', '#a87a4a')] },
  tableR: { name: '카페 테이블', price: 10000, cat: 'living', act: 'eat', blocks: () => [_blk(0.42, 0.42, 0.58, 0.58, 0, 10, '#5b5f69'), _blk(0.3, 0.3, 0.7, 0.7, 0, 1, '#5b5f69'), _blk(0.14, 0.14, 0.86, 0.86, 10, 12, '#f4efe6', '#ddd5c8', '#c9bfb0'), _blk(0.4, 0.4, 0.52, 0.52, 12, 16, '#f19ab5')] },
  chair: { name: '나무 의자', price: 5000, cat: 'kitchen', act: 'sit', seat: true, blocks: () => [
    ...legs(0.24, 0.24, 0.76, 0.76, 7, '#7a5236', 0.08), _blk(0.2, 0.2, 0.8, 0.8, 7, 9, '#d7a874', '#b98a58', '#a87a4a'),
    _blk(0.2, 0.18, 0.8, 0.28, 9, 21, '#c99a64', '#a87a4a', '#946a40'), _blk(0.3, 0.17, 0.7, 0.2, 14, 18, '#e3b583')] },
  desk: { name: '책상', price: 15000, cat: 'living', act: 'read', blocks: () => [_blk(0.06, 0.2, 0.32, 0.86, 0, 12, ...WOOD_C), _blk(0.84, 0.2, 0.94, 0.86, 0, 12, ...WOOD_C), _blk(0.04, 0.18, 0.96, 0.88, 12, 14, '#d7a874', '#b98a58', '#a87a4a'), _blk(0.5, 0.3, 0.8, 0.5, 14, 15, '#f4efe2'), _blk(0.18, 0.32, 0.34, 0.46, 14, 19, '#3f6fb5')] },
  shelf: { name: '책장', price: 18000, cat: 'living', act: 'read', blocks: () => {
    const b = [_blk(0.06, 0.18, 0.94, 0.62, 0, 30, '#a87a4a', '#946a40', '#7a5236')];
    const cols = ['#e3615a', '#3f6fb5', '#f0c13e', '#5aa850', '#c08ad8', '#f19ab5'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) b.push(_blk(0.12 + i * 0.13, 0.62, 0.22 + i * 0.13, 0.66, 3 + r * 9, 9 + r * 9 - (i % 3), cols[(i + r) % 6]));
    return b; } },
  plant: { name: '몬스테라 화분', price: 6000, cat: 'living', blocks: () => [_blk(0.3, 0.3, 0.7, 0.7, 0, 7, '#c4704e', '#a65a3c', '#8f4c32'), _blk(0.33, 0.33, 0.67, 0.67, 7, 8, '#6a4a30'), _blk(0.22, 0.3, 0.6, 0.62, 9, 18, '#4f9e4a', '#3f8a3e', '#357634'), _blk(0.45, 0.4, 0.8, 0.75, 12, 20, '#6cbf62', '#4f9e4a', '#3f8a3e'), _blk(0.3, 0.5, 0.55, 0.78, 16, 24, '#5aaf55', '#469440', '#3a7f36')] },
  rug: { name: '동그란 러그', price: 8000, flat: true, cat: 'living', draw2(g, ox, oy) { fillEllipse(g, ox, oy + 8, 14, 7, '#f19ab5'); fillEllipse(g, ox, oy + 8, 10, 5, '#fbd3df'); fillEllipse(g, ox, oy + 8, 4, 2, '#f19ab5'); } },
  rugL: { name: '큰 러그', price: 14000, flat: true, fw: 2, fd: 2, cat: 'living', blocks: () => [_blk(0.1, 0.1, 1.9, 1.9, 0, 0.6, '#8fc3ea'), _blk(0.3, 0.3, 1.7, 1.7, 0.6, 1, '#cfe6f7'), _blk(0.6, 0.6, 1.4, 1.4, 1, 1.2, '#8fc3ea')] },
  cushion: { name: '방석', price: 3000, flat: true, cat: 'living', blocks: () => [_blk(0.22, 0.22, 0.78, 0.78, 0, 3, '#e3615a', '#c9484a', '#b33c3e'), _blk(0.45, 0.45, 0.55, 0.55, 3, 3.5, '#f7b9c9')] },
  tv: { name: '텔레비전', price: 25000, cat: 'living', act: 'tv', blocks: () => [_blk(0.06, 0.3, 0.94, 0.8, 0, 9, '#7a5236', '#6a4229', '#5a3a24'), _blk(0.12, 0.42, 0.88, 0.52, 9, 24, '#2b2f3a', '#3a3f4c', '#22252e'), _blk(0.16, 0.52, 0.84, 0.54, 11, 22, '#7fc4e8')] },
  dining: { name: '좌식 상', price: 14000, cat: 'kitchen', act: 'eat', blocks: () => [...legs(0.14, 0.2, 0.86, 0.8, 4, '#743a20'), _blk(0.1, 0.16, 0.9, 0.84, 4, 7, '#a0522d', '#8a4526', '#743a20'), _blk(0.25, 0.3, 0.42, 0.45, 7, 9, '#ffffff'), _blk(0.58, 0.5, 0.75, 0.65, 7, 9, '#ffffff')] },
  diningT: { name: '식탁', price: 24000, fw: 2, fd: 1, cat: 'kitchen', act: 'eat', blocks: () => [...legs(0.14, 0.16, 1.86, 0.84, 11, '#7a5236'), _blk(0.08, 0.1, 1.92, 0.9, 11, 14, '#e3b583', '#c99a64', '#a87a4a'), _blk(0.4, 0.35, 0.6, 0.55, 14, 17, '#ffffff'), _blk(1.4, 0.45, 1.6, 0.65, 14, 17, '#ffffff'), _blk(0.9, 0.3, 1.1, 0.5, 14, 20, '#f2d06a')] },
  kitchen: { name: '조리대', price: 28000, cat: 'kitchen', act: 'cook', blocks: () => [_blk(0.04, 0.22, 0.96, 0.9, 0, 16, '#eef3f5', '#c9d3d8', '#b7c3c9'), _blk(0.02, 0.2, 0.98, 0.92, 16, 18, '#9aa3b0'), _blk(0.15, 0.4, 0.42, 0.65, 18, 19, '#3b3f48'), _blk(0.55, 0.4, 0.82, 0.65, 18, 19, '#3b3f48'), _blk(0.2, 0.9, 0.8, 0.93, 6, 13, '#d6dee4')] },
  fridge: { name: '냉장고', price: 26000, cat: 'kitchen', blocks: () => [_blk(0.14, 0.2, 0.86, 0.84, 0, 32, '#f4f8fb', '#d6dee4', '#c3ccd3'), _blk(0.14, 0.84, 0.86, 0.86, 19, 20, '#b7c3c9'), _blk(0.7, 0.86, 0.76, 0.9, 22, 28, '#9aa3b0'), _blk(0.7, 0.86, 0.76, 0.9, 9, 15, '#9aa3b0'), _blk(0.25, 0.86, 0.35, 0.88, 25, 28, '#ff9ab5')] },
  kshelf: { name: '주방 선반', price: 9000, cat: 'kitchen', blocks: () => [_blk(0.06, 0.2, 0.94, 0.6, 0, 2, ...WOOD_C), _blk(0.06, 0.2, 0.12, 0.6, 2, 24, ...WOOD_C), _blk(0.88, 0.2, 0.94, 0.6, 2, 24, ...WOOD_C), _blk(0.06, 0.2, 0.94, 0.6, 12, 13, ...WOOD_C), _blk(0.06, 0.2, 0.94, 0.6, 23, 24, ...WOOD_C), _blk(0.2, 0.3, 0.35, 0.45, 13, 18, '#f19ab5'), _blk(0.5, 0.3, 0.66, 0.45, 13, 17, '#8fc3ea'), _blk(0.3, 0.3, 0.5, 0.45, 2, 8, '#f2d06a'), _blk(0.6, 0.3, 0.8, 0.45, 2, 7, '#ffffff')] },
  clock: { name: '벽시계', price: 7000, wall: true, cat: 'decor', blocks: () => [_blk(0.3, 0.0, 0.7, 0.08, 26, 36, '#f4efe6', '#ddd5c8', '#c9bfb0'), _blk(0.48, 0.08, 0.52, 0.1, 30, 35, '#3a2a26'), _blk(0.5, 0.08, 0.62, 0.1, 30, 31, '#3a2a26')] },
  frame: { name: '풍경 액자', price: 6000, wall: true, cat: 'decor', act: 'photo', blocks: () => [_blk(0.22, 0.0, 0.78, 0.08, 22, 36, '#a87a4a'), _blk(0.28, 0.08, 0.72, 0.1, 24, 34, '#7fc4e8'), _blk(0.28, 0.08, 0.72, 0.1, 24, 28, '#4f9e4a')] },
  frame4: { name: '네컷사진 액자', price: 5000, wall: true, cat: 'decor', act: 'photo', blocks: () => [_blk(0.38, 0.0, 0.62, 0.08, 18, 38, '#ffffff', '#e6e1d8', '#d6d0c6'), _blk(0.42, 0.08, 0.58, 0.1, 33, 36, '#f7b9c9'), _blk(0.42, 0.08, 0.58, 0.1, 28, 31, '#8fc3ea'), _blk(0.42, 0.08, 0.58, 0.1, 23, 26, '#f2d06a'), _blk(0.42, 0.08, 0.58, 0.1, 19, 21, '#c08ad8')] },
  curtain: { name: '커튼', price: 8000, wall: true, cat: 'decor', blocks: () => [_blk(0.05, 0.0, 0.95, 0.06, 38, 40, '#7a5236'), _blk(0.08, 0.04, 0.34, 0.1, 14, 38, '#f7b9c9', '#e39fb2', '#cf8a9e'), _blk(0.66, 0.04, 0.92, 0.1, 14, 38, '#f7b9c9', '#e39fb2', '#cf8a9e')] },
  vase: { name: '꽃병', price: 5000, cat: 'decor', blocks: () => [_blk(0.38, 0.38, 0.62, 0.62, 0, 9, '#8fc3ea', '#74a8d0', '#5f93bb'), _blk(0.42, 0.42, 0.58, 0.58, 9, 14, '#4f9e4a'), _blk(0.3, 0.32, 0.5, 0.52, 14, 18, '#f19ab5'), _blk(0.5, 0.45, 0.7, 0.65, 13, 17, '#f2d06a'), _blk(0.38, 0.55, 0.56, 0.72, 15, 19, '#ffffff')] },
  photoStand: { name: '사진 진열대', price: 12000, cat: 'decor', act: 'photo', blocks: () => [_blk(0.1, 0.3, 0.9, 0.7, 0, 14, ...WOOD_C), _blk(0.18, 0.45, 0.4, 0.5, 14, 22, '#ffffff'), _blk(0.22, 0.5, 0.36, 0.52, 16, 21, '#8fc3ea'), _blk(0.55, 0.45, 0.8, 0.5, 14, 20, '#ffffff'), _blk(0.59, 0.5, 0.76, 0.52, 15, 19, '#f7b9c9')] },
  photo: { name: '커플 액자', price: 6000, cat: 'decor', act: 'photo', blocks: () => [_blk(0.3, 0.42, 0.7, 0.56, 0, 14, '#f4efe2', '#d9cfba', '#c9bea8'), _blk(0.35, 0.56, 0.65, 0.58, 3, 12, '#7fc4e8'), _blk(0.45, 0.58, 0.55, 0.6, 6, 8, '#ff6f91')] },
  mugs: { name: '커플 머그컵', price: 6000, cat: 'couple', mug: true, blocks: () => [...legs(0.2, 0.2, 0.8, 0.8, 9, '#7a5236'), _blk(0.16, 0.16, 0.84, 0.84, 9, 11, '#f4efe6'), _blk(0.26, 0.4, 0.44, 0.58, 11, 16, '#ff9ab5'), _blk(0.56, 0.4, 0.74, 0.58, 11, 16, '#8fc3ea')] },
  souvenir: { name: '기념품 선반', price: 15000, cat: 'couple', act: 'photo', blocks: () => [_blk(0.06, 0.24, 0.94, 0.66, 0, 20, '#e3b583', '#c99a64', '#a87a4a'), _blk(0.15, 0.4, 0.32, 0.55, 20, 25, '#f7b9c9'), _blk(0.42, 0.4, 0.58, 0.55, 20, 27, '#8fc3ea'), _blk(0.68, 0.4, 0.86, 0.55, 20, 24, '#f2d06a'), _blk(0.2, 0.66, 0.8, 0.68, 6, 14, '#ffffff')] },
  seaChair: { name: '바닷가 선베드', price: 18000, fw: 1, fd: 2, cat: 'couple', act: 'sit', seat: true, blocks: () => [...legs(0.15, 0.2, 0.85, 1.8, 4, '#ffffff'), _blk(0.1, 0.2, 0.9, 1.85, 4, 6, '#8fd6b8', '#74bfa0', '#5faa8b'), _blk(0.1, 0.16, 0.9, 0.5, 6, 15, '#8fd6b8', '#74bfa0', '#5faa8b'), _blk(0.12, 0.6, 0.88, 0.7, 6, 7, '#ffffff'), _blk(0.12, 1.1, 0.88, 1.2, 6, 7, '#ffffff')] },
  festLamp: { name: '축제 등불', price: 0, cat: 'couple', light: true, blocks: () => [_blk(0.45, 0.45, 0.55, 0.55, 0, 22, '#7a5236'), _blk(0.3, 0.3, 0.7, 0.7, 22, 32, '#ff7a6a', '#e3615a', '#c9484a'), _blk(0.35, 0.35, 0.65, 0.65, 32, 34, '#f2d06a')] },
  catBed: { name: '고양이 방석', price: 0, flat: true, cat: 'couple', blocks: () => [_blk(0.16, 0.16, 0.84, 0.84, 0, 4, '#f2d06a', '#d9b44f', '#c49f3f'), _blk(0.26, 0.26, 0.74, 0.74, 3, 4.6, '#fff1b8')] },
  chest: { name: '해월도 보물 상자', price: 0, cat: 'couple', act: 'photo', blocks: () => [_blk(0.12, 0.25, 0.88, 0.8, 0, 11, '#8a5a3a', '#74492f', '#5f3b25'), _blk(0.1, 0.23, 0.9, 0.82, 11, 15, '#a87a4a', '#946a40', '#7a5236'), _blk(0.46, 0.8, 0.54, 0.84, 7, 12, '#f2d06a'), _blk(0.12, 0.4, 0.88, 0.44, 0, 15, '#f2d06a')] },
  shipModel: { name: '옛 범선 모형', price: 0, cat: 'couple', blocks: () => [_blk(0.15, 0.4, 0.85, 0.6, 0, 6, '#8a5a3a'), _blk(0.2, 0.42, 0.8, 0.58, 6, 9, '#a87a4a'), _blk(0.48, 0.47, 0.52, 0.53, 9, 28, '#5f3b25'), _blk(0.3, 0.49, 0.48, 0.51, 13, 25, '#ffffff'), _blk(0.52, 0.49, 0.72, 0.51, 15, 24, '#f4efe6')] },
  canolaVase: { name: '유채꽃 화병', price: 0, cat: 'couple', blocks: () => [_blk(0.36, 0.36, 0.64, 0.64, 0, 10, '#ffffff', '#e6e1d8', '#d6d0c6'), _blk(0.25, 0.3, 0.75, 0.7, 10, 20, '#f5e05a', '#e3c93f', '#cfb52f')] },
  medal: { name: '운동회 우승 트로피', price: 0, cat: 'couple', blocks: () => [_blk(0.34, 0.34, 0.66, 0.66, 0, 4, '#7a5236'), _blk(0.42, 0.42, 0.58, 0.58, 4, 10, '#f2d06a'), _blk(0.32, 0.32, 0.68, 0.68, 10, 18, '#f2d06a', '#d9b44f', '#c49f3f')] },
};
// 기존 소품은 그대로 쓰되 rot 1·3은 좌우 반전
for (const [k, F] of Object.entries(FURN2)) FURN[k] = Object.assign({}, FURN[k] || {}, F);
for (const F of Object.values(FURN)) if (!F.cat) F.cat = 'shop';

const _furnCache2 = new Map();
function furnSprite(k, rot) {
  rot = (rot | 0) & 3;
  const F = FURN[k], key = k + ':' + rot;
  if (_furnCache2.has(key)) return _furnCache2.get(key);
  let sp;
  if (F.blocks) {
    const [X, Y] = furnFoot(k, rot), blocks = F.blocks();
    const maxH = Math.max(8, ...blocks.map(b => b[5]));
    const W = (X + Y) * 16 + 10, H = (X + Y) * 8 + maxH + 10, ox = Y * 16 + 5, oy = maxH + 5;
    const c = mkCanvas(W, H), g = c.getContext('2d');
    drawBlocks(g, ox, oy, blocks, F.fw || 1, F.fd || 1, rot);
    autoOutline(c, '#3a2a26');
    sp = { c, ax: ox, ay: oy + 8 };
  } else if (F.draw2) {
    const c = mkCanvas(40, 40), g = c.getContext('2d'); F.draw2(g, 20, 20); autoOutline(c, '#3a2a26'); sp = { c, ax: 20, ay: 28 };
  } else {
    const c = mkCanvas(40, 50), g = c.getContext('2d'); F.draw(g, 20, 40); autoOutline(c, '#3a2a26');
    let out = c; if (rot & 1) { out = mkCanvas(40, 50); const og = out.getContext('2d'); og.translate(40, 0); og.scale(-1, 1); og.drawImage(c, 0, 0); }
    sp = { c: out, ax: 20, ay: 40 };
  }
  _furnCache2.set(key, sp);
  return sp;
}
/* 가구 미리보기 (상점 · 꾸미기) */
function furnPreview(k, rot = 0, scale = 3) {
  const sp = furnSprite(k, rot), c = mkCanvas(sp.c.width * scale, sp.c.height * scale), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(sp.c, 0, 0, c.width, c.height); return c.toDataURL();
}

/* ---------------- 새 타일: 골목(작은 돌길) · 산책로(나무 데크) ---------------- */
const _makeTile0 = makeTile;
makeTile = function (type, variant, frame = 0, season = 'summer') {
  if (type !== 'alley' && type !== 'board') return _makeTile0(type, variant, frame, season);
  const c = mkCanvas(TW, TH), g = c.getContext('2d'), img = g.createImageData(TW, TH), a = img.data;
  for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
    if (!inDiamond(px, py)) continue;
    const [u, v] = tileUV(px, py), n = hash2(px + variant * 31, py + variant * 17, 7);
    let col;
    if (type === 'alley') {
      const su = u * 4 + (Math.floor(v * 4) % 2) * 0.5, sv = v * 4, fu = su - Math.floor(su), fv = sv - Math.floor(sv);
      const cell = hash2(Math.floor(su) + variant * 3, Math.floor(sv), 5);
      col = (fu < 0.14 || fv < 0.14) ? '#9c8f7c' : cell < 0.4 ? '#c9bba3' : cell < 0.75 ? '#bfb096' : '#d3c6ae';
      if (season === 'winter' && n > 0.7) col = '#f2f6f9';
      if (season === 'autumn' && n > 0.95) col = '#d9843a';
    } else {
      const pv = v * 5, fv = pv - Math.floor(pv);
      col = fv < 0.13 ? '#8a6a48' : (Math.floor(pv) % 2 ? '#d9b98a' : '#cfae7c');
      if (n > 0.96) col = '#b8946a'; if (season === 'winter' && n > 0.82) col = '#f2f6f9';
    }
    const [r, gg, b] = hexRgb(col), i = (py * TW + px) * 4; a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
};

/* ---------------- 새 소품 스프라이트 ---------------- */
function sprBooth() {
  const c = mkCanvas(40, 62), g = c.getContext('2d'), ox = 20, oy = 26;
  drawBlocks(g, ox, oy, [
    _blk(0.04, 0.04, 0.96, 0.96, 0, 34, '#f4f6fb', '#d9deea', '#c3c9d8'),
    _blk(0.08, 0.95, 0.62, 0.99, 2, 30, '#3f6fb5', '#2f5a9a', '#2f5a9a'),       // 파란 커튼
    _blk(0.66, 0.95, 0.92, 0.99, 18, 26, '#2b2f3a'),                           // 화면
    _blk(0.68, 0.95, 0.9, 0.99, 6, 9, '#3a3f4c'),                              // 사진 출력구
    _blk(0.0, 0.0, 1.0, 1.0, 34, 37, '#ff9ab5', '#e57f9c', '#cf6c88'),
    _blk(0.3, 0.98, 0.7, 1.0, 37, 44, '#fff3a0', '#f2dc6a', '#e0c55a'),          // 조명 간판
  ], 1, 1, 0);
  g.fillStyle = '#ffffff'; g.fillRect(14, 10, 1, 1); g.fillRect(22, 13, 1, 1);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#ff6f91' : '#7fc4e8'; g.fillRect(9 + i * 2, 33 + i, 1, 2); }
  autoOutline(c, '#3a2a26'); return { c, ax: ox, ay: oy + 8 };
}
function sprCrosswalk() { const c = mkCanvas(32, 16), g = c.getContext('2d'); for (let i = 0; i < 4; i++) fillPoly(g, [[6 + i * 6, 3 + i * 3 - 1], [9 + i * 6, 3 + i * 3 + 0.5], [3 + i * 6 + 3, 9 + i * 3 - 1], [0 + i * 6 + 3, 7.5 + i * 3 - 1]], 'rgba(255,255,255,0.85)'); return { c, ax: 16, ay: 8 }; }
function sprTicket() {
  const c = mkCanvas(36, 52), g = c.getContext('2d'), ox = 18, oy = 20;
  drawBlocks(g, ox, oy, [_blk(0.1, 0.1, 0.9, 0.9, 0, 24, '#e9f0f5', '#c9d6df', '#b3c2cc'), _blk(0.2, 0.88, 0.8, 0.92, 10, 19, '#9fd6f2'), _blk(0.05, 0.05, 0.95, 0.95, 24, 28, '#2f6fa8', '#265b8a', '#1f4a72'), _blk(0.3, 0.9, 0.7, 0.94, 3, 7, '#f2d06a')], 1, 1, 0);
  autoOutline(c, '#3a2a26'); return { c, ax: ox, ay: oy + 8 };
}
function sprSignpost() { const c = mkCanvas(24, 40), g = c.getContext('2d'); g.fillStyle = '#7a5236'; g.fillRect(11, 8, 2, 30); g.fillStyle = '#f4efe2'; g.fillRect(3, 9, 12, 5); g.fillRect(9, 16, 12, 5); g.fillStyle = '#e3615a'; g.fillRect(5, 11, 6, 1); g.fillStyle = '#3f6fb5'; g.fillRect(11, 18, 7, 1); autoOutline(c, '#3a2a26'); return { c, ax: 12, ay: 36 }; }
function sprFlowerbed() {
  const se = season(), c = mkCanvas(36, 26), g = c.getContext('2d'), ox = 18, oy = 6;
  drawBlocks(g, ox, oy, [_blk(0.08, 0.08, 0.92, 0.92, 0, 4, '#b9a68a', '#9c8a70', '#85755e'), _blk(0.14, 0.14, 0.86, 0.86, 4, 5, '#6a4a30')], 1, 1, 0);
  const cols = { spring: ['#f2d84a', '#f19ab5', '#ffffff'], summer: ['#7fa3e6', '#f19ab5', '#c08ad8'], autumn: ['#e0a24a', '#d9583f', '#f2d06a'], winter: ['#d9404f', '#3f7f4a', '#ffffff'] }[se];
  for (let i = 0; i < 7; i++) { const x = 9 + (i * 5) % 18, y = 6 + (i * 3) % 6; g.fillStyle = '#4f8a3a'; g.fillRect(x, y + 1, 1, 2); fillEllipse(g, x, y, 2, 2, cols[i % 3]); }
  autoOutline(c, '#3a2a26'); return { c, ax: ox, ay: oy + 8 };
}
function sprBush() {
  const se = season(), c = mkCanvas(30, 26), g = c.getContext('2d');
  const base = se === 'autumn' ? '#a39d48' : se === 'winter' ? '#9fb8a8' : '#4f9e4a', hi = se === 'autumn' ? '#cfc46c' : se === 'winter' ? '#eef3f7' : '#6cbf62';
  fillEllipse(g, 15, 15, 11, 8, shade(base, 0.85)); fillEllipse(g, 12, 12, 7, 6, base); fillEllipse(g, 19, 13, 6, 5, base); fillEllipse(g, 13, 10, 4, 3, hi);
  if (se === 'spring' || se === 'summer') { g.fillStyle = se === 'spring' ? '#f7b9c9' : '#ffffff'; g.fillRect(9, 13, 1, 1); g.fillRect(18, 11, 1, 1); g.fillRect(21, 16, 1, 1); }
  autoOutline(c, '#2f3a26'); return { c, ax: 15, ay: 20 };
}
function sprLowFence() { const c = mkCanvas(34, 26), g = c.getContext('2d'); const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }; for (const x of [6, 16, 26]) P(x, 6 + (x - 6) / 2.6, 2, 11, '#f4efe6'); fillPoly(g, [[5, 9], [28, 17], [28, 19], [5, 11]], '#e6ddcb'); fillPoly(g, [[5, 13], [28, 21], [28, 22], [5, 14]], '#e6ddcb'); autoOutline(c, '#6a5a48'); return { c, ax: 17, ay: 18 }; }
function sprStone() { const c = mkCanvas(16, 10), g = c.getContext('2d'); fillEllipse(g, 8, 6, 5, 3, '#9aa3b0'); fillEllipse(g, 7, 5, 3, 2, '#c3c9d1'); autoOutline(c, '#4b4f59'); return { c, ax: 8, ay: 7 }; }
function sprGlowShell() { const c = mkCanvas(16, 12), g = c.getContext('2d'); fillEllipse(g, 8, 7, 4, 3, '#f7b9c9'); g.fillStyle = '#ffffff'; g.fillRect(7, 6, 2, 1); autoOutline(c, '#a0607a'); return { c, ax: 8, ay: 8 }; }
function sprFurnDisplay() { const sp = furnSprite('sofa2', 0); return sp; }
function sprFerry(night) {
  const c = mkCanvas(132, 74), g = c.getContext('2d'), ox = 50, oy = 34;
  drawBlocks(g, ox, oy, [
    _blk(0, 0, 3.6, 1.6, 0, 8, '#f4f6fb', '#2f6fa8', '#265b8a'),
    _blk(0.1, 0.1, 3.5, 1.5, 8, 10, '#e3484a', '#c03a3c', '#a83234'),
    _blk(0.6, 0.25, 2.6, 1.35, 10, 24, '#ffffff', '#dfe7ef', '#c9d4de'),
    _blk(0.8, 1.34, 2.4, 1.37, 15, 20, night ? '#fff1a0' : '#9fd6f2'),
    _blk(2.55, 0.5, 2.62, 1.1, 15, 20, night ? '#fff1a0' : '#9fd6f2'),
    _blk(0.7, 0.3, 2.5, 1.3, 24, 26, '#2f6fa8'),
    _blk(1.4, 0.6, 1.7, 0.9, 26, 36, '#f2d06a', '#d9b44f', '#c49f3f'),
  ], 3.6, 1.6, 0);
  g.font = '7px sans-serif'; autoOutline(c, '#23324a');
  return { c, ax: ox, ay: oy + 8 };
}
function sprClue() { const c = mkCanvas(16, 20), g = c.getContext('2d'); g.fillStyle = '#fff3a0'; g.fillRect(7, 2, 2, 12); g.fillRect(2, 7, 12, 2); g.fillStyle = '#ffffff'; g.fillRect(7, 7, 2, 2); return { c, ax: 8, ay: 14 }; }
function sprPortal(kind) {
  const c = mkCanvas(30, 30), g = c.getContext('2d');
  if (kind === 'cave') { fillEllipse(g, 15, 18, 11, 8, '#2b2f3a'); fillEllipse(g, 15, 19, 8, 5, '#14161c'); }
  else if (kind === 'cellar') { drawBlocks(g, 15, 8, [_blk(0.1, 0.2, 0.9, 0.8, 0, 3, '#8a5a3a'), _blk(0.2, 0.3, 0.8, 0.7, 3, 4, '#5f3b25')], 1, 1, 0); }
  else { for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#b9a68a' : '#cdbb9c'; fillEllipse(g, 6 + i * 4, 20 - i * 2, 3, 2, i % 2 ? '#b9a68a' : '#cdbb9c'); } }
  autoOutline(c, '#3a2a26'); return { c, ax: 15, ay: 22 };
}
function sprDig() { const c = mkCanvas(20, 12), g = c.getContext('2d'); fillEllipse(g, 10, 6, 7, 4, '#8a6a48'); g.fillStyle = '#e3484a'; g.fillRect(8, 4, 4, 1); g.fillRect(9, 3, 2, 3); return { c, ax: 10, ay: 7 }; }
/* 첫 만남 · 사건 소품 */
function sprProp(v) {
  const c = mkCanvas(24, 24), g = c.getContext('2d'), P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  switch (v) {
    case 'bag': P(6, 10, 12, 9, '#f4efe6'); P(6, 10, 12, 2, '#d9404f'); P(10, 13, 4, 4, '#e3484a'); P(11, 14, 2, 2, '#ffffff'); P(9, 7, 6, 3, '#7a5236'); break;
    case 'ball': fillEllipse(g, 12, 14, 5, 5, '#ffffff'); P(10, 12, 3, 3, '#2b2f3a'); P(14, 15, 2, 2, '#2b2f3a'); break;
    case 'slipper': P(5, 14, 10, 4, '#ffffff'); P(5, 13, 6, 3, '#7fa3e6'); break;
    case 'graffiti': P(3, 6, 18, 12, 'rgba(0,0,0,0)'); fillEllipse(g, 9, 11, 4, 4, '#f2d06a'); P(14, 8, 2, 8, '#e3615a'); P(12, 12, 6, 2, '#5aa850'); break;
    case 'books': P(5, 14, 14, 3, '#3f6fb5'); P(6, 11, 12, 3, '#e3615a'); P(7, 8, 10, 3, '#f2d06a'); break;
    case 'sign': P(11, 6, 2, 16, '#9aa3b0'); fillPoly(g, [[6, 4], [18, 2], [17, 9], [5, 11]], '#f2d06a'); P(9, 6, 5, 2, '#2b2f3a'); break;
    case 'ticket': P(7, 14, 10, 5, '#ffffff'); P(7, 14, 3, 5, '#7fc4e8'); break;
    case 'signboard': P(5, 6, 14, 9, '#f4efe2'); P(11, 15, 2, 7, '#7a5236'); for (let i = 0; i < 4; i++) P(7, 8 + i * 2, 10, 1, '#9aa3b0'); break;
    case 'hat': fillEllipse(g, 12, 15, 8, 3, '#f2d06a'); fillEllipse(g, 12, 12, 5, 3, '#f2d06a'); P(7, 13, 10, 1, '#e3615a'); break;
    case 'boxes': P(3, 10, 9, 9, '#c99a64'); P(12, 12, 9, 7, '#d7a874'); P(7, 4, 8, 6, '#c99a64'); P(3, 13, 9, 1, '#7a5236'); break;
    case 'parcel': P(6, 10, 12, 9, '#c99a64'); P(11, 10, 2, 9, '#f4efe2'); P(6, 14, 12, 1, '#f4efe2'); break;
    case 'net': fillEllipse(g, 12, 15, 8, 5, '#7a8a5a'); for (let i = 0; i < 5; i++) P(6 + i * 3, 11, 1, 8, '#5a6a3a'); break;
    case 'tangerines': fillEllipse(g, 9, 15, 3, 3, '#f39a2b'); fillEllipse(g, 15, 15, 3, 3, '#f39a2b'); fillEllipse(g, 12, 11, 3, 3, '#f7a93b'); P(12, 8, 1, 2, '#4f8a3a'); break;
    case 'conch': fillEllipse(g, 12, 15, 5, 3, '#f7b9c9'); P(14, 12, 3, 3, '#f7b9c9'); P(11, 15, 3, 1, '#e88aa4'); break;
    case 'cart': P(4, 14, 14, 3, '#7a5236'); fillEllipse(g, 7, 18, 2, 2, '#3a2a26'); fillEllipse(g, 16, 18, 2, 2, '#3a2a26'); break;
    case 'paper': P(7, 12, 9, 7, '#ffffff'); P(8, 14, 6, 1, '#9aa3b0'); P(8, 16, 4, 1, '#9aa3b0'); break;
    case 'orange1': fillEllipse(g, 12, 16, 3, 3, '#f39a2b'); break;
    case 'flashlight': P(6, 14, 10, 4, '#2b2f3a'); P(16, 13, 3, 6, '#9aa3b0'); P(19, 14, 2, 4, '#fff3a0'); break;
    case 'foot': for (let i = 0; i < 3; i++) { fillEllipse(g, 6 + i * 6, 16 - (i % 2) * 3, 2, 3, 'rgba(90,70,50,0.6)'); } break;
    case 'photoP': P(7, 11, 10, 8, '#ffffff'); P(8, 12, 8, 5, '#2b2f3a'); P(11, 13, 2, 2, '#fff3a0'); break;
    case 'bowl': fillEllipse(g, 12, 16, 6, 3, '#e3615a'); fillEllipse(g, 12, 15, 4, 1, '#c99a64'); break;
    case 'key': P(7, 15, 8, 2, '#a8743a'); fillEllipse(g, 16, 16, 3, 3, '#a8743a'); P(7, 17, 2, 2, '#a8743a'); break;
    case 'mapP': P(5, 11, 13, 9, '#e9d9b0'); P(9, 13, 2, 2, '#e3484a'); P(12, 15, 4, 1, '#8a6a48'); break;
    case 'mark': P(6, 10, 12, 2, '#e3484a'); P(11, 5, 2, 12, '#e3484a'); break;
    case 'list': P(7, 9, 10, 11, '#fff8e6'); for (let i = 0; i < 4; i++) P(9, 11 + i * 2, 6, 1, '#7a8090'); break;
    case 'oldbox': P(4, 10, 16, 9, '#7a5236'); P(4, 10, 16, 2, '#5f3b25'); P(11, 13, 2, 3, '#f2d06a'); break;
    default: fillEllipse(g, 12, 14, 4, 4, '#f2d06a');
  }
  autoOutline(c, '#3a2a26'); return { c, ax: 12, ay: 18 };
}
