// Entorno de locación: terreno de arena con relieve, cielo con degradado, plataforma (playón) de ripio, camino y arbustos.
// Todo procedural (sin texturas ni modelos externos). Unidades: metros.
import * as THREE from 'three';
import { Q, mesh, box, cyl } from './builders.js';
import { M } from './materials.js';

// ---------- Ruido determinista ----------
let seed = 1234;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function makeNoise(size) {
  const g = new Float32Array(size * size); for (let i = 0; i < g.length; i++) g[i] = rnd();
  const lerp = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
  return (x, y) => {
    const xi = Math.floor(x) % size, yi = Math.floor(y) % size, xf = x - Math.floor(x), yf = y - Math.floor(y);
    const a = g[yi * size + xi], b = g[yi * size + ((xi + 1) % size)], c = g[((yi + 1) % size) * size + xi], d = g[((yi + 1) % size) * size + ((xi + 1) % size)];
    return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
  };
}
const noise = makeNoise(64);
const fbm = (x, y, oct = 4) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * noise(x * f, y * f); a *= 0.5; f *= 2; } return v; };

// ---------- Texturas procedurales ----------
function canvasTexture(size, paint, repeat) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'); paint(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat, repeat); tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
export function sandTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#c9ad78'; ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s), d = img.data;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const grain = (rnd() - 0.5) * 26;
      const ripple = Math.sin((x + 40 * Math.sin(y / 60)) / 9) * 6;           // ondulaciones del viento
      const patch = (fbm(x / 90, y / 90, 3) - 0.5) * 40;                     // manchas claras/oscuras
      d[i] += grain + ripple + patch; d[i + 1] += grain + ripple * 0.8 + patch * 0.9; d[i + 2] += grain * 0.8 + ripple * 0.5 + patch * 0.6;
    }
    ctx.putImageData(img, 0, 0);
  }, 70);
}
export function gravelTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#a9a08d'; ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 34; d[i] += n; d[i + 1] += n; d[i + 2] += n - 3; }
    ctx.putImageData(img, 0, 0);
    for (let k = 0; k < 2600; k++) { const r = 1 + rnd() * 2.2; ctx.fillStyle = rnd() > 0.5 ? 'rgba(90,84,74,0.55)' : 'rgba(225,220,205,0.5)'; ctx.beginPath(); ctx.arc(rnd() * s, rnd() * s, r, 0, Math.PI * 2); ctx.fill(); }
    // huellas de neumáticos tenues
    ctx.strokeStyle = 'rgba(80,74,64,0.18)'; ctx.lineWidth = 7;
    for (const y of [130, 150, 330, 350]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(s * 0.3, y - 8, s * 0.6, y + 8, s, y); ctx.stroke(); }
  }, 22);
}

// ---------- Terreno ----------
export function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const flat = THREE.MathUtils.smoothstep(r, 70, 130); // plano cerca de la locación
  const dunes = (fbm(x / 140 + 10, z / 140 + 10, 4) - 0.5) * 9 + (fbm(x / 45, z / 45, 3) - 0.5) * 2.2;
  return -0.5 + dunes * flat;
}
export function createTerrain() {
  const g = new THREE.Group(); g.name = 'terrain';
  const size = 900, segs = Q.seg >= 24 ? 180 : 100;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const sand = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: sandTexture(), color: '#d9c396', roughness: 1, metalness: 0 }));
  sand.receiveShadow = Q.shadows; g.add(sand);
  // Arbustos bajos (matas) fuera de la plataforma.
  const shrubMat = new THREE.MeshStandardMaterial({ color: '#6f7a4a', roughness: 0.95 });
  const shrubGeo = new THREE.IcosahedronGeometry(1, 1);
  const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, 220); shrubs.castShadow = Q.shadows;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  let n = 0;
  while (n < 220) {
    const x = (rnd() - 0.5) * 520, z = (rnd() - 0.5) * 520;
    if (Math.abs(x) < 62 && Math.abs(z) < 52) continue;           // no sobre el playón
    if (Math.abs(z) < 7 && x > 40) continue;                        // no sobre el camino
    const r = 0.5 + rnd() * 1.1;
    p3.set(x, terrainHeight(x, z) + r * 0.45, z); s3.set(r * (1 + rnd() * 0.6), r * 0.7, r * (1 + rnd() * 0.6)); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI);
    m.compose(p3, q, s3); shrubs.setMatrixAt(n++, m);
  }
  g.add(shrubs);
  // Cielo: cúpula con degradado (cenit azul → horizonte cálido).
  const skyGeo = new THREE.SphereGeometry(430, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#5d8fcf') }, mid: { value: new THREE.Color('#b9d2e8') }, bottom: { value: new THREE.Color('#e7dcc6') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y, -0.05, 1.0); vec3 c = h < 0.18 ? mix(bottom, mid, smoothstep(-0.05, 0.18, h)) : mix(mid, top, smoothstep(0.18, 0.9, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(skyGeo, skyMat); sky.name = 'sky'; g.add(sky);
  // Sol: disco tenue.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshBasicMaterial({ color: '#fff6dc', fog: false, transparent: true, opacity: 0.85 }));
  sun.position.set(150, 300, 100).normalize().multiplyScalar(420); sun.lookAt(0, 0, 0); g.add(sun);
  g.userData.fogColor = '#e2d8c4';
  return g;
}

// ---------- Plataforma de locación (playón) ----------
export function buildPad({ w = 110, d = 90, h = 0.5, x = 0, z = 0, road = true } = {}) {
  const g = new THREE.Group(); g.name = 'pad';
  const gravel = new THREE.MeshStandardMaterial({ map: gravelTexture(), color: '#bdb4a2', roughness: 0.98, metalness: 0 });
  // Playón con talud (rectángulo extruido con bisel).
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, -d / 2); shape.lineTo(w / 2, -d / 2); shape.lineTo(w / 2, d / 2); shape.lineTo(-w / 2, d / 2); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: h * 0.8, bevelSize: 2.2, bevelSegments: 3, steps: 1 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -h - h * 0.8 + 0.001, 0);
  // Coordenadas UV planas para que el ripio no se estire.
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 6; uv[i * 2 + 1] = p.getZ(i) / 6; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const pad = new THREE.Mesh(geo, gravel); pad.position.set(x, 0, z); pad.receiveShadow = Q.shadows; g.add(pad);
  // Berma perimetral de arena (contención) sobre el borde del playón.
  const bermMat = new THREE.MeshStandardMaterial({ map: sandTexture(), color: '#b89d6c', roughness: 1 });
  const berm = (len, px, pz, rot) => { const b = mesh(new THREE.CylinderGeometry(0.55, 0.9, len, 8, 1), bermMat, { pos: [px, 0.35, pz], rot: [rot === 'x' ? 0 : Math.PI / 2, 0, rot === 'x' ? Math.PI / 2 : 0], cast: false }); b.scale.y = 1; g.add(b); };
  berm(w - 6, x, z - d / 2 + 1.5, 'x'); berm(w - 6, x, z + d / 2 - 1.5, 'x'); berm(d - 6, x - w / 2 + 1.5, z, 'z');
  berm(d * 0.35, x + w / 2 - 1.5, z - d * 0.32, 'z'); berm(d * 0.35, x + w / 2 - 1.5, z + d * 0.32, 'z');   // hueco para el acceso
  if (road) {
    const rg = new THREE.PlaneGeometry(260, 9, 40, 1); rg.rotateX(-Math.PI / 2);
    const rp = rg.attributes.position; for (let i = 0; i < rp.count; i++) { const rx = rp.getX(i) + x + w / 2 + 130; rp.setY(i, terrainHeight(rx, z) + 0.06); rp.setX(i, rp.getX(i)); }
    rg.computeVertexNormals();
    const roadMesh = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: gravelTexture(), color: '#b8ad98', roughness: 1 })); roadMesh.position.set(x + w / 2 + 130, 0, z); roadMesh.receiveShadow = Q.shadows; g.add(roadMesh);
  }
  return g;
}

// ---------- Elementos de locación (contexto) ----------
export function buildCampExtras() {
  const g = new THREE.Group();
  const cabin = (x, z, rot = 0, color = '#dfe2df') => {
    const c = new THREE.Group();
    c.add(box(9, 2.8, 3, M.painted(color), { pos: [0, 1.75, 0] })); c.add(box(9.2, 0.12, 3.2, M.steelDark(), { pos: [0, 3.2, 0] }));
    for (const s of [-3, 0, 3]) c.add(box(1.0, 0.9, 0.05, M.glass(), { pos: [s, 2.0, 1.52] }));
    c.add(box(0.9, 2.0, 0.06, M.steelDark(), { pos: [-3.8, 1.35, 1.52] }));
    c.add(box(9, 0.45, 3, M.steelDark(), { pos: [0, 0.22, 0] }));
    c.add(cyl(0.2, 1.4, M.steelDark(), { pos: [3.6, 3.9, -0.8], seg: 10 }));                    // aire acondicionado / chimenea
    c.position.set(x, 0, z); c.rotation.y = rot; return c;
  };
  g.add(cabin(28, 22, Math.PI / 2, '#dfe2df')); g.add(cabin(28, 33, Math.PI / 2, '#d8d3c5')); g.add(cabin(36, 27.5, Math.PI / 2, '#dfe2df'));
  const pickup = (x, z, rot, color) => {
    const p = new THREE.Group();
    p.add(box(5.4, 0.7, 2.0, M.painted(color), { pos: [0, 0.95, 0] })); p.add(box(2.2, 0.9, 1.9, M.painted(color), { pos: [-0.4, 1.75, 0] })); p.add(box(1.6, 0.7, 1.7, M.glass(), { pos: [-0.4, 1.8, 0] }));
    for (const [wx, wz] of [[-1.7, 1], [-1.7, -1], [1.7, 1], [1.7, -1]]) p.add(cyl(0.42, 0.3, M.rubber(), { pos: [wx, 0.42, wz], rot: [Math.PI / 2, 0, 0], seg: 18 }));
    p.position.set(x, 0, z); p.rotation.y = rot; return p;
  };
  g.add(pickup(24, -20, 0.3, '#eaeaea')); g.add(pickup(31, -21, 0.1, '#3a3f45'));
  // Contenedores y tanque de agua de locación.
  g.add(box(12, 2.6, 2.4, M.painted('#7d4a2f'), { pos: [-30, 1.3, 26] })); g.add(box(12, 2.6, 2.4, M.painted('#4a6a8a'), { pos: [-30, 1.3, 30] }));
  g.add(cyl(3.2, 4.5, M.painted('#b9c3c6'), { pos: [-38, 2.25, -22], seg: 32 }));
  // Mástil de bandera / antena y cartel de locación.
  g.add(cyl(0.06, 9, M.steel(), { pos: [40, 4.5, 8], seg: 8 })); g.add(box(0.15, 1.2, 2.2, M.white(), { pos: [46, 1.6, 0] })); g.add(cyl(0.05, 1.3, M.steelDark(), { pos: [46, 0.6, 0.9], seg: 8 })); g.add(cyl(0.05, 1.3, M.steelDark(), { pos: [46, 0.6, -0.9], seg: 8 }));
  g.traverse((o) => { if (o.isMesh) { o.castShadow = Q.shadows; o.receiveShadow = Q.shadows; } });
  return g;
}
