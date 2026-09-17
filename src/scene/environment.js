// Entorno de locación: terreno de arena con dunas y cordón montañoso, cielo con degradado, playón de ripio con talud,
// camino con huellas, arbustos, bandera, cargadora y campamento. Todo procedural (sin texturas ni modelos externos).
import * as THREE from 'three';
import { Q, mesh, box, cyl, beam, torus } from './builders.js';
import { M } from './materials.js';

// ---------- Ruido determinista ----------
let seed = 1234;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function makeNoise(size) {
  const g = new Float32Array(size * size); for (let i = 0; i < g.length; i++) g[i] = rnd();
  const lerp = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
  return (x, y) => {
    x = Math.abs(x); y = Math.abs(y);
    const xi = Math.floor(x) % size, yi = Math.floor(y) % size, xf = x - Math.floor(x), yf = y - Math.floor(y);
    const a = g[yi * size + xi], b = g[yi * size + ((xi + 1) % size)], c = g[((yi + 1) % size) * size + xi], d = g[((yi + 1) % size) * size + ((xi + 1) % size)];
    return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
  };
}
const noise = makeNoise(96);
const fbm = (x, y, oct = 4) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * noise(x * f + 31.7, y * f + 17.3); a *= 0.5; f *= 2; } return v; };
const ridged = (x, y, oct = 5) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * (1 - Math.abs(noise(x * f + 5.1, y * f + 9.7) * 2 - 1)); a *= 0.5; f *= 2.1; } return v; };

// ---------- Texturas procedurales ----------
function canvasTexture(size, paint, repeat) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'); paint(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat, repeat); tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
export function sandTexture(repeat = 80) {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#c4a874'; ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s), d = img.data;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const grain = (rnd() - 0.5) * 24;
      const ripple = Math.sin((x + 40 * Math.sin(y / 60)) / 9) * 5;
      const patch = (fbm(x / 90, y / 90, 3) - 0.5) * 44;
      d[i] += grain + ripple + patch; d[i + 1] += grain + ripple * 0.8 + patch * 0.9; d[i + 2] += grain * 0.8 + ripple * 0.5 + patch * 0.6;
    }
    ctx.putImageData(img, 0, 0);
    for (let k = 0; k < 900; k++) { ctx.fillStyle = rnd() > 0.5 ? 'rgba(120,100,70,0.35)' : 'rgba(235,222,190,0.35)'; ctx.beginPath(); ctx.arc(rnd() * s, rnd() * s, 0.8 + rnd() * 1.6, 0, Math.PI * 2); ctx.fill(); }
  }, repeat);
}
export function gravelTexture(repeat = 22) {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#a49b88'; ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 34; d[i] += n; d[i + 1] += n; d[i + 2] += n - 3; }
    ctx.putImageData(img, 0, 0);
    for (let k = 0; k < 3200; k++) { const r = 1 + rnd() * 2.4; ctx.fillStyle = rnd() > 0.5 ? 'rgba(80,74,64,0.55)' : 'rgba(225,220,205,0.5)'; ctx.beginPath(); ctx.arc(rnd() * s, rnd() * s, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(70,64,54,0.22)'; ctx.lineWidth = 8;
    for (const y of [120, 142, 330, 352]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(s * 0.3, y - 8, s * 0.6, y + 8, s, y); ctx.stroke(); }
  }, repeat);
}
export function gratingTexture() {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#5c6165'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#2a2d30';
    for (let y = 0; y < s; y += 16) for (let x = 0; x < s; x += 8) ctx.fillRect(x + 2, y + 3, 4, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 0; y < s; y += 16) ctx.fillRect(0, y, s, 1);
  }, 1);
}
export function corrugatedTexture(color = '#d9dcda') {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 8) { ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(x, 0, 3, s); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x + 4, 0, 2, s); }
  }, 1);
}

// ---------- Cielo ----------
export const SKY_PRESETS = {
  desert: { top: '#4f86c9', mid: '#b4cde6', bottom: '#e6d9c2', fog: '#dcd2bd' },
  plain: { top: '#c9d0cf', mid: '#e3e7e4', bottom: '#d3d8d4', fog: '#d8dcd8' },
};
export function createSky() {
  const geo = new THREE.SphereGeometry(1400, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY_PRESETS.plain.top) }, mid: { value: new THREE.Color(SKY_PRESETS.plain.mid) }, bottom: { value: new THREE.Color(SKY_PRESETS.plain.bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y, -0.1, 1.0); vec3 c = h < 0.12 ? mix(bottom, mid, smoothstep(-0.1, 0.12, h)) : mix(mid, top, smoothstep(0.12, 0.85, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(geo, mat); sky.name = 'sky'; sky.renderOrder = -10;
  const sun = new THREE.Mesh(new THREE.CircleGeometry(30, 24), new THREE.MeshBasicMaterial({ color: '#fff7e0', fog: false, transparent: true, opacity: 0.9 }));
  sun.position.set(38, 46, 22).normalize().multiplyScalar(1350); sun.lookAt(0, 0, 0); sky.add(sun); sky.userData.sun = sun;
  return sky;
}

// ---------- Terreno ----------
export function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const flat = THREE.MathUtils.smoothstep(r, 75, 140);
  const dunes = (fbm(x / 150 + 10, z / 150 + 10, 4) - 0.5) * 10 + (fbm(x / 45, z / 45, 3) - 0.5) * 2.4;
  // Cordón montañoso: empieza a ~380 m, más alto hacia el fondo (−Z y +X).
  const dir = Math.max(0, (-z * 0.7 + x * 0.35) / Math.max(1, r));
  const mount = THREE.MathUtils.smoothstep(r, 380, 620) * (0.35 + 0.65 * dir);
  const ridge = ridged(x / 260 + 3, z / 260 + 7, 5);
  const mountains = mount * (ridge * ridge * 210 + (fbm(x / 60, z / 60, 3) - 0.5) * 14);
  return -0.5 + dunes * flat + mountains;
}
export function createTerrain() {
  const g = new THREE.Group(); g.name = 'terrain';
  const size = 1800, segs = Q.seg >= 24 ? 260 : Q.seg >= 18 ? 180 : 110;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, n = pos.count;
  const colors = new Float32Array(n * 3);
  const sand = new THREE.Color('#e2c99c'), sandDark = new THREE.Color('#c7a878'), rock = new THREE.Color('#8f7a62'), rockDark = new THREE.Color('#6e5d4c'), cap = new THREE.Color('#b8a58c');
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = terrainHeight(x, z); pos.setY(i, h);
    const d = 3, sx = (terrainHeight(x + d, z) - terrainHeight(x - d, z)) / (2 * d), sz = (terrainHeight(x, z + d) - terrainHeight(x, z - d)) / (2 * d);
    const slope = Math.min(1, Math.hypot(sx, sz) * 1.6);
    const c = new THREE.Color();
    const v = fbm(x / 70, z / 70, 2);
    c.copy(sand).lerp(sandDark, v);
    if (h > 12) c.lerp(rock, THREE.MathUtils.smoothstep(h, 12, 45)).lerp(rockDark, slope * 0.7);
    if (h > 120) c.lerp(cap, THREE.MathUtils.smoothstep(h, 120, 200) * 0.6);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const sandMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: sandTexture(140), vertexColors: true, roughness: 1, metalness: 0 }));
  sandMesh.receiveShadow = Q.shadows; g.add(sandMesh);
  // Arbustos bajos fuera del playón y del camino.
  const shrubMat = new THREE.MeshStandardMaterial({ color: '#7d7a58', roughness: 0.98 });
  const shrubs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), shrubMat, 320); shrubs.castShadow = Q.shadows;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  let k = 0;
  while (k < 320) {
    const x = (rnd() - 0.5) * 640, z = (rnd() - 0.5) * 640;
    if (Math.abs(x + 4) < 62 && Math.abs(z - 2) < 52) continue;
    if (Math.abs(z - roadZ(x)) < 7 && x > 40) continue;
    if (terrainHeight(x, z) > 10) continue;
    const r = 0.35 + rnd() * 0.75;
    p3.set(x, terrainHeight(x, z) + r * 0.4, z); s3.set(r * (1 + rnd() * 0.6), r * 0.6, r * (1 + rnd() * 0.6)); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI);
    m.compose(p3, q, s3); shrubs.setMatrixAt(k++, m);
  }
  g.add(shrubs);
  // Rocas sueltas.
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#8b7d6a', roughness: 0.9, flatShading: true }), 90); rocks.castShadow = Q.shadows;
  k = 0;
  while (k < 90) {
    const x = (rnd() - 0.5) * 700, z = (rnd() - 0.5) * 700;
    if (Math.abs(x + 4) < 70 && Math.abs(z - 2) < 60) continue;
    const r = 0.4 + rnd() * 1.4;
    p3.set(x, terrainHeight(x, z) + r * 0.3, z); s3.set(r, r * 0.6, r * (0.7 + rnd() * 0.6)); q.setFromEuler(new THREE.Euler(rnd(), rnd() * 3, rnd()));
    m.compose(p3, q, s3); rocks.setMatrixAt(k++, m);
  }
  g.add(rocks);
  return g;
}
// Camino curvo de acceso: z en función de x (sale del playón hacia +X).
export function roadZ(x) { return 2 + Math.sin((x - 60) / 70) * 18 * THREE.MathUtils.smoothstep(x, 60, 140); }

// ---------- Plataforma de locación (playón) ----------
export function buildPad({ w = 110, d = 90, h = 0.5, x = 0, z = 0, road = true } = {}) {
  const g = new THREE.Group(); g.name = 'pad';
  const gravel = new THREE.MeshStandardMaterial({ map: gravelTexture(), color: '#bab19f', roughness: 0.98, metalness: 0 });
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, -d / 2); shape.lineTo(w / 2, -d / 2); shape.lineTo(w / 2, d / 2); shape.lineTo(-w / 2, d / 2); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: h * 0.8, bevelSize: 2.2, bevelSegments: 3, steps: 1 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -h - h * 0.8 + 0.001, 0);
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 6; uv[i * 2 + 1] = p.getZ(i) / 6; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const pad = new THREE.Mesh(geo, gravel); pad.position.set(x, 0, z); pad.receiveShadow = Q.shadows; g.add(pad);
  // Manchas de humedad/lodo y huellas sobre el playón (planos oscuros semitransparentes).
  const stain = new THREE.MeshStandardMaterial({ color: '#5f574a', roughness: 1, transparent: true, opacity: 0.28, depthWrite: false });
  for (let i = 0; i < 9; i++) { const sp = mesh(new THREE.CircleGeometry(2 + rnd() * 5, 18), stain, { cast: false }); sp.rotation.x = -Math.PI / 2; sp.position.set(x + (rnd() - 0.5) * (w - 20), 0.012, z + (rnd() - 0.5) * (d - 20)); sp.scale.x = 1 + rnd(); g.add(sp); }
  const trackMat = new THREE.MeshStandardMaterial({ color: '#6b6357', roughness: 1, transparent: true, opacity: 0.35, depthWrite: false });
  const track = (x0, z0, x1, z1) => { for (const off of [-0.9, 0.9]) { const len = Math.hypot(x1 - x0, z1 - z0), t = mesh(new THREE.PlaneGeometry(len, 0.45), trackMat, { cast: false }); t.rotation.x = -Math.PI / 2; const ang = Math.atan2(z1 - z0, x1 - x0); t.rotation.z = -ang; t.position.set((x0 + x1) / 2 - Math.sin(ang) * off, 0.014, (z0 + z1) / 2 + Math.cos(ang) * off); g.add(t); } };
  track(x + w / 2 - 2, z + 1, x + 22, z + 4); track(x + 22, z + 4, x + 8, z - 26); track(x + w / 2 - 2, z + 1, x + 30, z - 18); track(x + 30, z - 18, x - 20, z - 30);
  // Berma perimetral de arena con hueco de acceso.
  const bermMat = new THREE.MeshStandardMaterial({ map: sandTexture(30), color: '#b89d6c', roughness: 1 });
  const berm = (len, px, pz, rot) => { const b = mesh(new THREE.CylinderGeometry(0.55, 0.9, len, 8, 1), bermMat, { pos: [px, 0.35, pz], rot: [rot === 'x' ? 0 : Math.PI / 2, 0, rot === 'x' ? Math.PI / 2 : 0], cast: false }); g.add(b); };
  berm(w - 6, x, z - d / 2 + 1.5, 'x'); berm(w - 6, x, z + d / 2 - 1.5, 'x'); berm(d - 6, x - w / 2 + 1.5, z, 'z');
  berm(d * 0.35, x + w / 2 - 1.5, z - d * 0.32, 'z'); berm(d * 0.35, x + w / 2 - 1.5, z + d * 0.32, 'z');
  if (road) {
    // Camino curvo que sigue el relieve, con huellas.
    const pts = []; for (let rx = x + w / 2 - 4; rx <= 420; rx += 6) pts.push(new THREE.Vector3(rx, terrainHeight(rx, roadZ(rx)) + 0.08, roadZ(rx)));
    const roadGeo = ribbon(pts, 9), roadMesh = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ map: gravelTexture(), color: '#b2a892', roughness: 1 })); roadMesh.receiveShadow = Q.shadows; g.add(roadMesh);
    for (const off of [-1.1, 1.1]) { const tp = pts.map((v) => new THREE.Vector3(v.x, v.y + 0.02, v.z + off)); g.add(mesh(ribbon(tp, 0.5), trackMat, { cast: false })); }
  }
  return g;
}
// Cinta de ancho fijo a lo largo de una polilínea (para caminos/huellas).
function ribbon(pts, width) {
  const geo = new THREE.BufferGeometry(); const v = [], uvs = [], idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dir = new THREE.Vector3().subVectors(b, a); dir.y = 0; dir.normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2);
    const p = pts[i];
    v.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z);
    uvs.push(i * 0.5, 0, i * 0.5, 1);
    if (i < pts.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

// ---------- Elementos de locación (contexto) ----------
export function buildFlag(x, z, logoUrl = 'assets/logo.png') {
  const g = new THREE.Group();
  g.add(cyl(0.09, 12, M.steel(), { pos: [x, 6, z], seg: 10 })); g.add(cyl(0.3, 0.4, M.concrete(), { pos: [x, 0.2, z], seg: 12 }));
  const tex = new THREE.TextureLoader().load(logoUrl); tex.colorSpace = THREE.SRGBColorSpace;
  const flagMat = new THREE.MeshStandardMaterial({ map: tex, color: '#ffffff', side: THREE.DoubleSide, roughness: 0.8 });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6, 12, 4), flagMat); flag.position.set(x + 2.15, 10.5, z);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6, 12, 4), new THREE.MeshStandardMaterial({ color: '#1f3038', side: THREE.DoubleSide, roughness: 0.85 })); base.position.set(x + 2.15, 10.5, z - 0.01);
  flag.castShadow = base.castShadow = Q.shadows;
  const pos0 = flag.geometry.attributes.position.array.slice();
  flag.userData.animate = (t) => { const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const px = pos0[i * 3] + 2.1; p.setZ(i, Math.sin(px * 1.6 - t * 3) * 0.12 * (px / 4.2)); } p.needsUpdate = true; base.geometry.attributes.position.copy(p); base.geometry.attributes.position.needsUpdate = true; };
  g.add(flag, base); g.userData.flag = flag;
  return g;
}
export function buildLoader(x, z, rot = 0) {
  const g = new THREE.Group(); const yellow = M.painted('#e2a91c'), dark = M.castIron();
  g.add(box(3.2, 1.2, 2.2, yellow, { pos: [-0.3, 1.3, 0] })); g.add(box(1.6, 1.5, 1.6, M.painted('#2b2f33'), { pos: [-0.9, 2.6, 0] })); g.add(box(1.4, 1.0, 1.4, M.glass(), { pos: [-0.9, 2.75, 0] }));
  g.add(box(1.4, 0.8, 2.0, yellow, { pos: [-2.2, 1.0, 0] }));
  for (const [wx, wz] of [[-2.0, 1.3], [-2.0, -1.3], [1.2, 1.3], [1.2, -1.3]]) { g.add(cyl(0.75, 0.6, M.rubber(), { pos: [wx, 0.75, wz], rot: [Math.PI / 2, 0, 0], seg: 20 })); g.add(cyl(0.35, 0.62, dark, { pos: [wx, 0.75, wz], rot: [Math.PI / 2, 0, 0], seg: 12 })); }
  g.add(beam([1.0, 1.8, 0.7], [3.4, 1.2, 0.7], 0.14, yellow)); g.add(beam([1.0, 1.8, -0.7], [3.4, 1.2, -0.7], 0.14, yellow));
  g.add(box(0.5, 1.2, 2.6, dark, { pos: [3.7, 1.0, 0] })); g.add(box(1.0, 0.25, 2.6, dark, { pos: [4.1, 0.45, 0], rot: [0, 0, 0.1] }));
  g.position.set(x, 0, z); g.rotation.y = rot; g.traverse((o) => { if (o.isMesh) { o.castShadow = Q.shadows; o.receiveShadow = Q.shadows; } });
  return g;
}
export function buildCampExtras() {
  const g = new THREE.Group();
  const corr = corrugatedTexture('#d7dad8'), corrTan = corrugatedTexture('#d3cbb7');
  const cabin = (x, z, rot = 0, tex = corr) => {
    const c = new THREE.Group();
    const wall = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, metalness: 0.3 }); wall.map.repeat.set(9, 1);
    c.add(box(9, 2.8, 3, wall, { pos: [0, 1.75, 0] })); c.add(box(9.2, 0.12, 3.2, M.steelDark(), { pos: [0, 3.2, 0] }));
    for (const s of [-3, 0, 3]) c.add(box(1.0, 0.9, 0.05, M.glass(), { pos: [s, 2.0, 1.52] }));
    c.add(box(0.9, 2.0, 0.06, M.steelDark(), { pos: [-3.8, 1.35, 1.52] }));
    c.add(box(9, 0.45, 3, M.steelDark(), { pos: [0, 0.22, 0] }));
    c.add(box(0.9, 0.7, 0.9, M.steelDark(), { pos: [3.6, 3.6, -0.6] }));
    c.add(box(1.4, 0.05, 1.0, M.rigGrey(), { pos: [-3.8, 0.42, 2.2] })); // escalón
    c.position.set(x, 0, z); c.rotation.y = rot; return c;
  };
  g.add(cabin(28, 22, Math.PI / 2)); g.add(cabin(28, 33, Math.PI / 2, corrTan)); g.add(cabin(36, 27.5, Math.PI / 2)); g.add(cabin(-40, 14, 0, corrTan));
  const pickup = (x, z, rot, color) => {
    const p = new THREE.Group();
    p.add(box(5.4, 0.7, 2.0, M.painted(color), { pos: [0, 0.95, 0] })); p.add(box(2.2, 0.9, 1.9, M.painted(color), { pos: [-0.4, 1.75, 0] })); p.add(box(1.6, 0.7, 1.7, M.glass(), { pos: [-0.4, 1.8, 0] }));
    p.add(box(2.4, 0.5, 1.8, M.castIron(), { pos: [1.4, 1.5, 0] }));
    for (const [wx, wz] of [[-1.7, 1], [-1.7, -1], [1.7, 1], [1.7, -1]]) p.add(cyl(0.42, 0.3, M.rubber(), { pos: [wx, 0.42, wz], rot: [Math.PI / 2, 0, 0], seg: 18 }));
    p.position.set(x, 0, z); p.rotation.y = rot; return p;
  };
  g.add(pickup(24, -20, 0.3, '#eaeaea')); g.add(pickup(31, -21, 0.1, '#3a3f45')); g.add(pickup(-34, 30, 1.4, '#f2f2f2'));
  g.add(buildLoader(20, -34, -0.6));
  const flag = buildFlag(44, -14); g.add(flag); g.userData.animate = (t) => flag.userData.flag.userData.animate(t);
  // Contenedores, tanque de agua, bandejas de cables sobre el playón.
  const cont = (x, z, color) => { const w = new THREE.MeshStandardMaterial({ map: corrugatedTexture(color), roughness: 0.7, metalness: 0.3 }); w.map.repeat.set(12, 1); g.add(box(12, 2.6, 2.4, w, { pos: [x, 1.3, z] })); g.add(box(12.1, 0.1, 2.5, M.steelDark(), { pos: [x, 2.62, z] })); };
  cont(-30, 26, '#8a5238'); cont(-30, 30, '#4e6f8f'); cont(-16, 30, '#7c8388');
  g.add(cyl(3.2, 4.5, M.painted('#b9c3c6'), { pos: [-38, 2.25, -22], seg: 32 })); g.add(cyl(3.3, 0.2, M.steelDark(), { pos: [-38, 4.55, -22], seg: 32 }));
  for (const [x0, z0, x1, z1] of [[-24, 6, -8, 6], [-8, 6, -8, -14], [-24, 6, -24, -8]]) g.add(box(Math.max(0.5, Math.abs(x1 - x0)), 0.18, Math.max(0.5, Math.abs(z1 - z0)), M.steelDark(), { pos: [(x0 + x1) / 2, 0.12, (z0 + z1) / 2] }));
  g.add(box(0.15, 1.2, 2.2, M.white(), { pos: [46, 1.6, 0] })); g.add(cyl(0.05, 1.3, M.steelDark(), { pos: [46, 0.6, 0.9], seg: 8 })); g.add(cyl(0.05, 1.3, M.steelDark(), { pos: [46, 0.6, -0.9], seg: 8 }));
  g.traverse((o) => { if (o.isMesh) { o.castShadow = Q.shadows; o.receiveShadow = Q.shadows; } });
  return g;
}
