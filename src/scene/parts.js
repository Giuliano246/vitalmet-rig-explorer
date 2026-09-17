// Geometrías de los productos Vitalmet. Ilustrativas: proporciones verosímiles, no reproducciones CAD.
// Cada builder devuelve un Group con userData.parts = [{ key, obj, home, dir, dist, vitalmet }]
// para el despiece (setExplode). Convención: eje principal de las piezas axiales = +Y local.
import * as THREE from 'three';
import { M, COLORS } from './materials.js';
import { Q, mesh, box, cyl, torus, lathe, ring, lugNut, hexNut, beam, groupOf } from './builders.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const IN = 0.0254;

function reg(g, key, obj, dir = [0, 0, 0], dist = 0, vitalmet = true, variantId = null) {
  obj.traverse((o) => { if (o.isMesh) { o.userData.partKey = key; o.userData.vitalmet = vitalmet; if (variantId) o.userData.variantId = variantId; } });
  obj.userData.partKey = key; obj.userData.vitalmet = vitalmet;
  g.userData.parts ??= [];
  g.userData.parts.push({ key, obj, home: obj.position.clone(), dir: V(...dir).normalize(), dist, vitalmet, variantId });
  g.add(obj);
  return obj;
}
const EXPLODE_FACTOR = 0.6; // atenúa las distancias de despiece para mantener las piezas en cuadro
export function setExplode(g, t) {
  for (const p of g.userData.parts || []) p.obj.position.copy(p.home).addScaledVector(p.dir, p.dist * t * EXPLODE_FACTOR);
  g.userData.explode = t;
}
// Ranuras de rosca (anillos finos) sobre un cilindro.
function threads(r, y0, y1, material, n = 6) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) g.add(ring(r * 0.97, r * 1.03, (y1 - y0) / n * 0.4, material, { pos: [0, y0 + ((i + 0.5) * (y1 - y0)) / n, 0], seg: Q.seg }));
  return g;
}
// Segmentos + aro de retención (subconjunto de tuerca de unión de alta presión).
function segmentsAndRing(g, r, y, nutMat, dist = 1, radialDist = 0.6) {
  for (let i = 0; i < 3; i++) {
    const seg = torus(r, r * 0.16, M.machined(), { arc: Math.PI * 0.6, tSeg: 8, seg: 24 });
    seg.rotation.set(Math.PI / 2, 0, (i / 3) * Math.PI * 2); seg.position.y = y;
    const a = (i / 3) * Math.PI * 2 + Math.PI * 0.3;
    reg(g, 'segmentosUnion', seg, [Math.cos(a), 0, -Math.sin(a)], r * 2.6 * radialDist);
  }
  const aro = torus(r * 1.12, r * 0.05, M.castIron(), { tSeg: 6, seg: 32 }); aro.rotation.x = Math.PI / 2; aro.position.y = y;
  reg(g, 'aroRetencion', aro, [0, 1, 0], r * 4.5 * dist);
}

// ---------- Unión doble rápida ----------
export function buildUnion({ fig = 602, size = 2, nut = COLORS.blue, body = COLORS.red, lugs = 3, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2;            // radio interior
  const R1 = r0 * 1.55, R2 = r0 * 2.55, H = r0 * 2.1, L = r0 * 3.2;
  const bodyMat = M.painted(body), nutMat = M.painted(nut), mach = M.machined();
  const isBowen = fig === 'bowen';
  // Extremo hembra (roscado internamente): abajo.
  const hembra = groupOf(
    lathe([[r0, -L], [R1, -L], [R1, -r0 * 0.4], [R1 * 1.22, -r0 * 0.4], [R1 * 1.22, 0], [r0 * 1.15, 0], [r0 * 1.15, -r0 * 0.5], [r0, -r0 * 0.5], [r0, -L]], bodyMat),
    threads(R1 * 1.22, -r0 * 0.4, 0, mach, 4),
  );
  reg(g, 'extremoHembra', hembra, [0, -1, 0], L * 1.6, true, variantId);
  // Extremo macho con cara de sello: arriba.
  const macho = groupOf(
    lathe([[r0, 0], [r0 * 1.12, 0], [R1 * 1.05, r0 * 0.15], [R1 * 1.05, r0 * 0.8], [R1, r0 * 0.9], [R1, L], [r0, L], [r0, 0]], bodyMat),
  );
  reg(g, 'extremoMacho', macho, [0, 1, 0], L * 1.9, true, variantId);
  // Sello (o-ring o empaquetadura).
  const sello = torus(r0 * 1.1, r0 * 0.09, M.rubber(), { tSeg: 8, seg: 32 }); sello.rotation.x = Math.PI / 2; sello.position.y = 0.002;
  reg(g, 'sello', sello, [0, 1, 0], L * 1.0, true, variantId);
  // Tuerca de tres aletas (o collar liso en Bowen).
  const tuerca = isBowen
    ? lathe([[R1 * 1.1, -H * 0.55], [R2 * 0.85, -H * 0.55], [R2 * 0.85, H * 0.55], [R1 * 1.1, H * 0.55], [R1 * 1.1, -H * 0.55]], nutMat)
    : lugNut(R2, H, nutMat, lugs || 3, nutMat);
  tuerca.position.y = r0 * 0.35;
  reg(g, 'tuerca', tuerca, [0, 1, 0], L * 2.9, true, variantId);
  if (fig === 1502 || fig === 1002 || fig === 1003) segmentsAndRing(g, R1 * 1.02, r0 * 1.05, nutMat, 1.4);
  g.userData.radius = Math.max(R2 * 1.3, L * 1.1);
  g.userData.axis = 'y';
  return g;
}

// ---------- Pup joint ----------
export function buildPupJoint({ size = 3, len = 2.4, nut = COLORS.blue, body = COLORS.red, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2, R1 = r0 * 1.55, R2 = r0 * 2.55, H = r0 * 2.1, L = r0 * 3.2;
  const bodyMat = M.painted(body), nutMat = M.painted(nut), mach = M.machined();
  const tubo = cyl(r0 * 1.32, len - 2 * L, bodyMat, { pos: [0, 0, 0] });
  reg(g, 'tubo', tubo, [0, 0, 0], 0, true, variantId);
  // Extremo con tuerca (arriba).
  const macho = lathe([[r0, 0], [r0 * 1.12, 0], [R1 * 1.05, r0 * 0.15], [R1 * 1.05, r0 * 0.8], [R1, r0 * 0.9], [R1, L], [r0 * 1.32, L], [r0 * 1.32, 0], [r0, 0]], bodyMat);
  macho.rotation.x = Math.PI; macho.position.y = len / 2;
  reg(g, 'extremoMacho', macho, [0, 1, 0], L * 1.2, true, variantId);
  const tuerca = lugNut(R2, H, nutMat, 3, nutMat); tuerca.position.y = len / 2 - r0 * 0.35;
  reg(g, 'tuerca', tuerca, [0, 1, 0], L * 2.6, true, variantId);
  // Extremo hembra (abajo).
  const hembra = groupOf(
    lathe([[r0, -L], [R1, -L], [R1, -r0 * 0.4], [R1 * 1.22, -r0 * 0.4], [R1 * 1.22, 0], [r0 * 1.15, 0], [r0 * 1.15, -r0 * 0.5], [r0, -r0 * 0.5], [r0, -L]], bodyMat),
    threads(R1 * 1.22, -r0 * 0.4, 0, mach, 4),
  );
  hembra.rotation.x = Math.PI; hembra.position.y = -len / 2 + L;
  reg(g, 'extremoHembra', hembra, [0, -1, 0], L * 1.4, true, variantId);
  g.userData.radius = len * 0.55; g.userData.axis = 'y';
  return g;
}

// ---------- Codo integral ----------
export function buildElbow({ fig = 1502, size = 2, nut = COLORS.blue, body = COLORS.red, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2, R1 = r0 * 1.55, R2 = r0 * 2.55, H = r0 * 2.1, L = r0 * 2.4, Rb = r0 * 4.2;
  const bodyMat = M.painted(body), nutMat = M.painted(nut), mach = M.machined();
  // Cuerpo: arco de 90° + tramos rectos; extremo A (con tuerca) en +Y, extremo B (macho) en +X.
  const arc = torus(Rb, r0 * 1.35, bodyMat, { arc: Math.PI / 2, tSeg: Q.seg, seg: 32 });
  arc.position.set(Rb, 0, 0); arc.rotation.z = Math.PI / 2;
  const legA = cyl(r0 * 1.35, L, bodyMat, { pos: [0, L / 2, 0] });
  const legB = cyl(r0 * 1.35, L, bodyMat, { pos: [Rb + L / 2, -Rb, 0], rot: [0, 0, Math.PI / 2] });
  const machoB = lathe([[r0, 0], [r0 * 1.12, 0], [R1 * 1.05, r0 * 0.15], [R1 * 1.05, r0 * 0.8], [R1, r0 * 0.9], [R1, L * 0.9], [r0 * 1.35, L * 0.9], [r0 * 1.35, 0], [r0, 0]], bodyMat);
  machoB.rotation.z = -Math.PI / 2; machoB.position.set(Rb + L * 1.9, -Rb, 0);
  const machoA = lathe([[r0, 0], [r0 * 1.12, 0], [R1 * 1.05, r0 * 0.15], [R1 * 1.05, r0 * 0.8], [R1, r0 * 0.9], [R1, L * 0.9], [r0 * 1.35, L * 0.9], [r0 * 1.35, 0], [r0, 0]], bodyMat);
  machoA.rotation.x = Math.PI; machoA.position.set(0, L * 1.9, 0);
  reg(g, 'cuerpoCodo', groupOf(arc, legA, legB, machoA, machoB, threads(R1, -Rb - r0 * 0.1, -Rb + r0 * 0.1, mach, 1)), [0, 0, 0], 0, true, variantId);
  const tuerca = lugNut(R2, H, nutMat, 3, nutMat); tuerca.position.y = L * 1.9 - r0 * 0.35;
  reg(g, 'tuerca', tuerca, [0, 1, 0], L * 3, true, variantId);
  segmentsAndRing(g, R1 * 1.02, L * 1.9 - r0 * 1.0, nutMat, 1.6, 0.9);
  g.userData.radius = Rb + L * 2.2; g.userData.axis = 'y'; g.userData.center = V(Rb / 2, 0, 0);
  return g;
}

// ---------- Codo giratorio (estilo 3 giratorios) ----------
export function buildSwivel({ size = 2, swivels = 3, body = COLORS.vitalmet, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2, rp = r0 * 1.35, Rh = r0 * 2.3, Rb = r0 * 3.4;
  const bodyMat = M.painted(body);
  const cuerpo = new THREE.Group();
  const elbow = (pos, rot) => { const a = torus(Rb, rp, bodyMat, { arc: Math.PI / 2, tSeg: Q.seg, seg: 24 }); a.position.set(...pos); a.rotation.set(...rot); return a; };
  // Tramo: entrada (+Y) → giratorio 1 → codo → recto → giratorio 2 → codo → giratorio 3 → salida.
  const L1 = r0 * 3.5, Ls = r0 * 6;
  cuerpo.add(cyl(rp, L1, bodyMat, { pos: [0, L1 / 2, 0] }));
  cuerpo.add(elbow([Rb, L1, 0], [0, 0, Math.PI / 2]));
  cuerpo.add(cyl(rp, Ls, bodyMat, { pos: [Rb + Ls / 2, L1 + Rb, 0], rot: [0, 0, Math.PI / 2] }));
  cuerpo.add(elbow([Rb + Ls, L1 + Rb + Rb, 0], [0, 0, -Math.PI]));
  cuerpo.add(cyl(rp, L1, bodyMat, { pos: [Rb + Ls + Rb, L1 + Rb + Rb + L1 / 2, 0] }));
  // extremos roscados
  cuerpo.add(lathe([[r0, 0], [rp * 1.15, 0], [rp * 1.15, r0 * 1.4], [r0, r0 * 1.4], [r0, 0]], M.machined(), { pos: [0, -r0 * 1.4, 0] }));
  cuerpo.add(lathe([[r0, 0], [rp * 1.15, 0], [rp * 1.15, r0 * 1.4], [r0, r0 * 1.4], [r0, 0]], M.machined(), { pos: [Rb + Ls + Rb, L1 + Rb + Rb + L1, 0] }));
  reg(g, 'cuerpoGiratorio', cuerpo, [0, 0, 0], 0, true, variantId);
  const housings = [[0, L1 * 0.55, 0, [0, 0, 0]], [Rb + Ls * 0.5, L1 + Rb, 0, [0, 0, Math.PI / 2]], [Rb + Ls + Rb, L1 + Rb + Rb + L1 * 0.45, 0, [0, 0, 0]]].slice(0, swivels);
  housings.forEach(([x, y, z, rot], i) => {
    const h = lathe([[rp, -r0 * 1.1], [Rh, -r0 * 1.1], [Rh, -r0 * 0.9], [Rh * 1.08, -r0 * 0.9], [Rh * 1.08, r0 * 0.9], [Rh, r0 * 0.9], [Rh, r0 * 1.1], [rp, r0 * 1.1], [rp, -r0 * 1.1]], bodyMat);
    h.position.set(x, y, z); h.rotation.set(...rot);
    const dir = i === 1 ? [0, 0, 1] : [0, 0, 1];
    reg(g, 'rodamiento', h, dir, Rh * 3, true, variantId);
    const emp = torus(rp * 1.05, r0 * 0.12, M.rubber(), { tSeg: 8, seg: 24 }); emp.position.set(x, y, z); emp.rotation.set(rot[0] + Math.PI / 2, rot[1], rot[2]);
    reg(g, 'empaquetadura', emp, [0, 0, 1], Rh * 4.5, true, variantId);
    const al = hexNut(r0 * 0.18, r0 * 0.3, M.machined()); al.position.set(x + (i === 1 ? 0 : Rh * 1.05), y + (i === 1 ? Rh * 1.05 : 0), z);
    reg(g, 'alemite', al, [0, 0, 1], Rh * 6, true, variantId);
  });
  g.userData.radius = (Rb * 2 + Ls) * 0.7; g.userData.axis = 'y'; g.userData.center = V((Rb * 2 + Ls) / 2, (L1 * 2 + Rb * 2) / 2, 0);
  return g;
}

// ---------- Válvula tapón balanceado (VTB) ----------
export function buildPlugValve({ size = 2, integral = false, handle = 'T', body = COLORS.red, nut = COLORS.blue, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2, R1 = r0 * 1.55, R2 = r0 * 2.55, H = r0 * 2.1, L = r0 * 2.6;
  const B = r0 * 4.6; // lado del cuerpo
  const bodyMat = M.painted(body), nutMat = M.painted(nut), mach = M.machined(), dark = M.castIron();
  // Cuerpo: bloque con aristas suavizadas (caja + cilindros) y puertos en ±X.
  const cuerpo = groupOf(
    box(B, B * 1.15, B * 0.9, bodyMat),
    cyl(B * 0.44, B, bodyMat, { rot: [Math.PI / 2, 0, 0], pos: [0, B * 0.25, 0] }),
    cyl(r0 * 1.9, L, bodyMat, { pos: [-B / 2 - L / 2, 0, 0], rot: [0, 0, Math.PI / 2] }),
    cyl(r0 * 1.9, L, bodyMat, { pos: [B / 2 + L / 2, 0, 0], rot: [0, 0, Math.PI / 2] }),
    integral ? new THREE.Group() : threads(r0 * 1.9, -L * 0.35, L * 0.35, mach, 4),
  );
  if (!integral) { cuerpo.children[4].rotation.z = Math.PI / 2; cuerpo.children[4].position.x = -B / 2 - L * 0.55; const t2 = threads(r0 * 1.9, -L * 0.35, L * 0.35, mach, 4); t2.rotation.z = Math.PI / 2; t2.position.x = B / 2 + L * 0.55; cuerpo.add(t2); }
  reg(g, 'cuerpo', cuerpo, [0, 0, 0], 0, true, variantId);
  // Tapón (vástago pistón) vertical con pasaje.
  const tapon = groupOf(cyl(r0 * 1.5, B * 0.9, mach), cyl(r0 * 0.55, B * 0.6, dark, { pos: [0, B * 0.75, 0] }), hexNut(r0 * 0.7, r0 * 0.5, dark, { pos: [0, B * 1.05, 0] }));
  tapon.children[2].position.y = B * 1.05;
  reg(g, 'tapon', tapon, [0, 1, 0], B * 1.9, true, variantId);
  // Segmentos: 2 asiento (±X) y 2 separadores (±Z).
  for (const [key, ang, dir] of [['segAsiento', 0, [1, 0, 0]], ['segAsiento', Math.PI, [-1, 0, 0]], ['segSeparador', Math.PI / 2, [0, 0, -1]], ['segSeparador', -Math.PI / 2, [0, 0, 1]]]) {
    const s = cyl(r0 * 1.62, B * 0.8, mach, { open: true, seg: 24 });
    s.geometry = new THREE.CylinderGeometry(r0 * 1.62, r0 * 1.62, B * 0.8, 16, 1, true, ang - Math.PI * 0.32, Math.PI * 0.64);
    s.material = M.machined(); s.material.side = THREE.DoubleSide;
    reg(g, key, s, dir, B * 1.3, true, variantId);
  }
  // Sellos.
  const sel = groupOf(torus(r0 * 1.7, r0 * 0.08, M.rubber(), { tSeg: 6, seg: 24, pos: [0, B * 0.45, 0], rot: [Math.PI / 2, 0, 0] }), torus(r0 * 1.7, r0 * 0.08, M.rubber(), { tSeg: 6, seg: 24, pos: [0, -B * 0.45, 0], rot: [Math.PI / 2, 0, 0] }));
  reg(g, 'sellos', sel, [0, 0, 1], B * 1.2, true, variantId);
  // Tapa con topes.
  const tapa = groupOf(lathe([[0, 0], [B * 0.42, 0], [B * 0.42, B * 0.28], [B * 0.32, B * 0.4], [r0 * 0.6, B * 0.4], [r0 * 0.6, 0], [0, 0]], dark), box(r0 * 0.5, B * 0.2, r0 * 0.5, dark, { pos: [B * 0.3, B * 0.42, 0] }), box(r0 * 0.5, B * 0.2, r0 * 0.5, dark, { pos: [0, B * 0.42, B * 0.3] }));
  tapa.position.y = B * 0.575;
  reg(g, 'tapa', tapa, [0, 1, 0], B * 2.8, true, variantId);
  // Manija en T o volante.
  let man;
  if (handle === 'wheel') {
    man = groupOf(torus(B * 0.45, r0 * 0.14, dark, { tSeg: 8, seg: 32, rot: [Math.PI / 2, 0, 0] }), cyl(r0 * 0.75, r0 * 0.7, dark), beam([-B * 0.45, 0, 0], [B * 0.45, 0, 0], r0 * 0.1, dark), beam([0, 0, -B * 0.45], [0, 0, B * 0.45], r0 * 0.1, dark));
  } else {
    man = groupOf(cyl(r0 * 0.75, r0 * 0.8, dark), beam([-B * 0.7, 0, 0], [B * 0.7, 0, 0], r0 * 0.14, dark));
  }
  man.position.y = B * 1.25;
  reg(g, handle === 'wheel' ? 'volante' : 'manija', man, [0, 1, 0], B * 3.6, true, variantId);
  if (integral) {
    // Extremo macho con tuerca de unión (−X) y extremo hembra (+X).
    const macho = lathe([[r0, 0], [r0 * 1.12, 0], [R1 * 1.05, r0 * 0.15], [R1 * 1.05, r0 * 0.8], [R1, r0 * 0.9], [R1, L * 0.7], [r0 * 1.9, L * 0.7], [r0 * 1.9, 0], [r0, 0]], bodyMat);
    macho.rotation.z = Math.PI / 2; macho.position.x = -B / 2 - L * 1.65;
    cuerpo.add(macho);
    const tuerca = lugNut(R2, H, nutMat, 3, nutMat); tuerca.rotation.z = Math.PI / 2; tuerca.position.x = -B / 2 - L * 1.65 + r0 * 0.35;
    reg(g, 'tuerca', tuerca, [-1, 0, 0], L * 3.2, true, variantId);
    const segG = new THREE.Group(); segG.rotation.z = Math.PI / 2; segG.position.x = -B / 2 - L * 1.65 + r0 * 1.0; g.add(segG);
    segmentsAndRing(segG, R1 * 1.02, 0, nutMat, 1.6, 0.9);
    g.userData.parts.push(...segG.userData.parts);
    const hem = threads(r0 * 1.95, -L * 0.3, L * 0.3, mach, 4); hem.rotation.z = Math.PI / 2; hem.position.x = B / 2 + L * 0.6; cuerpo.add(hem);
  }
  g.userData.radius = B * 1.9; g.userData.axis = 'y';
  return g;
}

// ---------- Válvula de asiento expandible (VAE) — piezas según plano p. 14 ----------
export function buildGateValve({ size = 2, body = COLORS.red, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2, B = r0 * 4.8, L = r0 * 2.2;
  const bodyMat = M.painted(body), mach = M.machined(), dark = M.castIron(), rub = M.rubber();
  const cuerpo = groupOf(
    box(B * 0.95, B * 1.3, B * 0.75, bodyMat, { pos: [0, B * 0.1, 0] }),
    cyl(r0 * 1.85, L, bodyMat, { pos: [-B / 2 - L / 2 + 0.01, 0, 0], rot: [0, 0, Math.PI / 2] }),
    cyl(r0 * 1.85, L, bodyMat, { pos: [B / 2 + L / 2 - 0.01, 0, 0], rot: [0, 0, Math.PI / 2] }),
    cyl(B * 0.4, B * 0.2, bodyMat, { pos: [0, B * 0.85, 0] }),
  );
  const t1 = threads(r0 * 1.86, -L * 0.3, L * 0.3, mach, 4); t1.rotation.z = Math.PI / 2; t1.position.x = -B / 2 - L * 0.6; cuerpo.add(t1);
  const t2 = threads(r0 * 1.86, -L * 0.3, L * 0.3, mach, 4); t2.rotation.z = Math.PI / 2; t2.position.x = B / 2 + L * 0.6; cuerpo.add(t2);
  reg(g, 'cuerpo', cuerpo, [0, 0, 0], 0, true, variantId);
  reg(g, 'espina', cyl(r0 * 0.18, r0 * 0.9, mach, { pos: [B * 0.5, -B * 0.35, 0], rot: [0, 0, Math.PI / 2] }), [1, 0, 0], B * 0.9, true, variantId);
  reg(g, 'asiento', ring(r0, r0 * 1.5, r0 * 0.5, mach, { pos: [-r0 * 1.0, 0, 0], rot: [0, 0, Math.PI / 2] }), [-1, 0, 0], B * 1.3, true, variantId);
  reg(g, 'asiento', ring(r0, r0 * 1.5, r0 * 0.5, mach, { pos: [r0 * 1.0, 0, 0], rot: [0, 0, Math.PI / 2] }), [1, 0, 0], B * 1.3, true, variantId);
  reg(g, 'esclusa', box(r0 * 0.7, B * 0.9, r0 * 2.6, mach, { pos: [0, B * 0.05, 0] }), [0, 0, 1], B * 1.6, true, variantId);
  reg(g, 'empCuerpo', ring(B * 0.3, B * 0.4, r0 * 0.12, rub, { pos: [0, B * 0.96, 0] }), [0, 1, 0], B * 0.5, true, variantId);
  const bonete = lathe([[r0 * 0.9, 0], [B * 0.4, 0], [B * 0.4, B * 0.25], [B * 0.28, B * 0.9], [B * 0.28, B * 1.0], [r0 * 0.9, B * 1.0], [r0 * 0.9, 0]], bodyMat, { pos: [0, B * 0.97, 0] });
  reg(g, 'bonete', bonete, [0, 1, 0], B * 0.95, true, variantId);
  reg(g, 'tapaRoscada', lathe([[r0 * 0.75, 0], [B * 0.31, 0], [B * 0.31, r0 * 0.55], [r0 * 0.75, r0 * 0.55], [r0 * 0.75, 0]], dark, { pos: [0, B * 1.97, 0] }), [0, 1, 0], B * 1.35, true, variantId);
  { const ev = groupOf(torus(r0 * 0.62, r0 * 0.1, rub, { tSeg: 6, seg: 20, rot: [Math.PI / 2, 0, 0] }), torus(r0 * 0.62, r0 * 0.1, rub, { tSeg: 6, seg: 20, rot: [Math.PI / 2, 0, 0], pos: [0, r0 * 0.25, 0] })); ev.position.y = B * 2.05; reg(g, 'empVastago', ev, [0, 1, 0], B * 1.75, true, variantId); }
  reg(g, 'bujeEmpaquetadura', lathe([[r0 * 0.55, 0], [r0 * 0.95, 0], [r0 * 0.95, r0 * 0.7], [r0 * 0.55, r0 * 0.7], [r0 * 0.55, 0]], mach, { pos: [0, B * 2.25, 0] }), [0, 1, 0], B * 2.1, true, variantId);
  reg(g, 'tornilloTraba', hexNut(r0 * 0.14, r0 * 0.4, mach, { pos: [r0 * 1.05, B * 2.4, 0], rot: [0, 0, Math.PI / 2] }), [1, 0, 0], B * 1.2, true, variantId);
  reg(g, 'anilloReten', ring(r0 * 0.55, r0 * 0.85, r0 * 0.25, mach, { pos: [0, B * 2.62, 0] }), [0, 1, 0], B * 2.45, true, variantId);
  reg(g, 'empAnilloReten', torus(r0 * 0.7, r0 * 0.07, rub, { tSeg: 6, seg: 20, rot: [Math.PI / 2, 0, 0], pos: [0, B * 2.76, 0] }), [0, 1, 0], B * 2.75, true, variantId);
  reg(g, 'empCapuchon', torus(r0 * 0.8, r0 * 0.07, rub, { tSeg: 6, seg: 20, rot: [Math.PI / 2, 0, 0], pos: [0, B * 2.86, 0] }), [0, 1, 0], B * 3.0, true, variantId);
  reg(g, 'capuchon', lathe([[r0 * 0.5, 0], [r0 * 1.0, 0], [r0 * 1.0, r0 * 1.1], [r0 * 0.5, r0 * 1.1], [r0 * 0.5, 0]], dark, { pos: [0, B * 2.9, 0] }), [0, 1, 0], B * 3.3, true, variantId);
  reg(g, 'alemite', hexNut(r0 * 0.12, r0 * 0.35, mach, { pos: [r0 * 1.05, B * 3.05, 0], rot: [0, 0, Math.PI / 2] }), [1, 0, 0], B * 1.4, true, variantId);
  reg(g, 'buje', ring(r0 * 0.45, r0 * 0.7, r0 * 0.5, mach, { pos: [0, B * 3.42, 0] }), [0, 1, 0], B * 3.7, true, variantId);
  reg(g, 'vastago', cyl(r0 * 0.42, B * 3.2, mach, { pos: [0, B * 2.2, 0] }), [0, 1, 0], B * 2.9, true, variantId);
  reg(g, 'chaveta', box(r0 * 0.25, r0 * 0.6, r0 * 0.12, mach, { pos: [0, B * 3.75, r0 * 0.42] }), [0, 0, 1], B * 1.0, true, variantId);
  { const vo = groupOf(cyl(r0 * 0.9, r0 * 0.7, dark), torus(r0 * 1.6, r0 * 0.12, dark, { tSeg: 8, seg: 28, rot: [Math.PI / 2, 0, 0] })); vo.position.y = B * 3.75; reg(g, 'volante', vo, [0, 1, 0], B * 4.3, true, variantId); }
  { const ma = beam([-B * 1.0, 0, 0], [B * 1.0, 0, 0], r0 * 0.16, dark); ma.position.y = B * 3.75; reg(g, 'manija', ma, [0, 1, 0], B * 4.9, true, variantId); }
  g.userData.radius = B * 2.6; g.userData.axis = 'y'; g.userData.center = V(0, B * 1.6, 0);
  return g;
}

// ---------- Anillo BX (con bridas 6BX de contexto) ----------
export function buildBX({ size = 4.0625, withFlanges = true, gap = false, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2, rr = r0 * 1.45, t = r0 * 0.22; // radio medio y semiancho del octógono
  const oct = [];
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; oct.push([rr + Math.cos(a) * t, Math.sin(a) * t * 1.15]); }
  const anillo = lathe(oct, M.brass(), { seg: 48 });
  reg(g, 'anilloBX', anillo, [0, 0, 0], 0, true, variantId);
  if (withFlanges) {
    const Rf = r0 * 3.2, hf = r0 * 0.9;
    const mk = (y, dir, dist) => {
      const f = groupOf(cyl(Rf, hf, M.steelDark(), { pos: [0, y, 0] }), ring(rr - t * 1.15, rr + t * 1.15, t * 0.5, M.steel(), { pos: [0, y + (dir > 0 ? -hf / 2 : hf / 2), 0] }));
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; f.add(cyl(r0 * 0.22, hf * 1.5, M.steel(), { pos: [Math.cos(a) * Rf * 0.82, y, Math.sin(a) * Rf * 0.82], seg: 6 })); }
      reg(g, 'brida6BX', f, [0, dir, 0], dist, false);
    };
    const gp = gap ? r0 * 0.9 : 0;
    mk(hf / 2 + t * 0.5 + gp, 1, r0 * 3.5); mk(-hf / 2 - t * 0.5 - gp, -1, r0 * 1.5);
    g.userData.radius = Rf * 1.25;
  } else g.userData.radius = rr * 1.4;
  g.userData.axis = 'y';
  return g;
}

// ---------- Kit de suplementos (tuerca + segmentos + aro) ----------
export function buildKit({ size = 2, nut = COLORS.blue, variantId } = {}) {
  const g = new THREE.Group();
  const r0 = size * IN / 2, R1 = r0 * 1.55, R2 = r0 * 2.55, H = r0 * 2.1;
  const tuerca = lugNut(R2, H, M.painted(nut), 3, M.painted(nut));
  reg(g, 'tuerca', tuerca, [0, 1, 0], H * 1.6, true, variantId);
  segmentsAndRing(g, R1 * 1.02, -H * 0.9, M.painted(nut), 0.9, 0.9);
  g.userData.radius = R2 * 1.8; g.userData.axis = 'y';
  return g;
}

// ---------- Campana de freno (con tambor y cinta de contexto) ----------
export function buildDrum({ diameter = 1.17, width = 0.28, withContext = true, variantId } = {}) {
  const g = new THREE.Group();
  const R = diameter / 2;
  const campana = lathe([[R * 0.86, -width / 2], [R, -width / 2], [R, width / 2], [R * 0.86, width / 2], [R * 0.86, width * 0.3], [R * 0.7, width * 0.3], [R * 0.7, width * 0.18], [R * 0.86, width * 0.18], [R * 0.86, -width / 2]], M.machined(), { seg: 64 });
  reg(g, 'campana', campana, [0, 1, 0], width * 5, true, variantId);
  if (withContext) {
    const tambor = groupOf(cyl(R * 0.62, width * 5.2, M.steelDark(), { pos: [0, -width * 2.9, 0], seg: 48 }), cyl(R * 0.82, width * 0.35, M.rigGrey(), { pos: [0, -width * 5.4, 0], seg: 48 }), cyl(R * 0.82, width * 0.35, M.rigGrey(), { pos: [0, -width * 0.55, 0], seg: 48 }));
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; tambor.add(cyl(R * 0.06, width * 4.8, M.steel(), { pos: [Math.cos(a) * R * 0.66, -width * 2.9, Math.sin(a) * R * 0.66], seg: 8 })); }
    reg(g, 'tamborMalacate', tambor, [0, -1, 0], width * 3, false);
    const cinta = groupOf(torus(R * 1.03, width * 0.02, M.castIron(), { tSeg: 6, seg: 64, arc: Math.PI * 1.7, rot: [Math.PI / 2, 0, Math.PI * 0.65] }));
    cinta.children[0].geometry = new THREE.CylinderGeometry(R * 1.05, R * 1.05, width * 0.9, 64, 1, true, 0, Math.PI * 1.7); cinta.children[0].rotation.set(0, Math.PI * 0.65, 0); cinta.children[0].material = M.castIron(); cinta.children[0].material.side = THREE.DoubleSide;
    for (let i = 0; i < 12; i++) { const a = Math.PI * 0.65 + (i / 12) * Math.PI * 1.7; cinta.add(box(width * 0.9, width * 0.12, R * 0.45, M.rubber(), { pos: [Math.cos(a) * R * 1.09, 0, -Math.sin(a) * R * 1.09], rot: [0, a, 0] })); }
    reg(g, 'cintaFreno', cinta, [0, 1, 0], width * 9, false);
  }
  g.userData.radius = R * 1.5; g.userData.axis = 'y';
  return g;
}

// ---------- Repuestos de bomba (piezas sueltas) ----------
export function buildPumpPart(part, { variantId } = {}) {
  const g = new THREE.Group();
  const mach = M.machined(), red = M.painted(COLORS.red), dark = M.castIron(), rub = M.rubber();
  const P = (key, obj, dir = [0, 1, 0], dist = 0) => reg(g, key, obj, dir, dist, true, variantId);
  switch (part) {
    case 'plug': P('tapon', groupOf(cyl(0.11, 0.16, mach, { pos: [0, 0.08, 0] }), threads(0.11, 0, 0.16, dark, 5), hexNut(0.09, 0.05, mach, { pos: [0, 0.185, 0] })), [0, 1, 0], 0); g.userData.radius = 0.22; break;
    case 'flange': { const f = ring(0.09, 0.24, 0.05, red, { seg: 40 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; f.add(cyl(0.016, 0.06, dark, { pos: [Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19], seg: 10 })); } P('bridaRoscada', groupOf(f, threads(0.09, -0.02, 0.02, mach, 3))); g.userData.radius = 0.3; break; }
    case 'linerNut': { const n = ring(0.13, 0.19, 0.3, red, { seg: 40 }); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; n.add(cyl(0.035, 0.14, dark, { pos: [Math.cos(a) * 0.19, 0.05, Math.sin(a) * 0.19], rot: [Math.PI / 2, 0, a], seg: 12 })); } P('tuercaCamisa', groupOf(n, threads(0.19, -0.15, -0.02, mach, 5))); g.userData.radius = 0.3; break; }
    case 'valveCover': P('tapaValvula', groupOf(lathe([[0, 0], [0.12, 0], [0.12, 0.14], [0.09, 0.18], [0.03, 0.18], [0.03, 0.26], [0, 0.26], [0, 0]], red, { seg: 40 }), threads(0.12, 0.0, 0.1, mach, 4))); g.userData.radius = 0.25; break;
    case 'wearPlate': P('platoDesgaste', ring(0.06, 0.15, 0.03, mach, { seg: 40 })); g.userData.radius = 0.2; break;
    case 'ponyRod': P('portaVastago', groupOf(cyl(0.035, 0.5, mach, { pos: [0, 0.25, 0] }), ring(0.03, 0.09, 0.04, mach, { pos: [0, 0.02, 0] }), threads(0.035, 0.42, 0.5, dark, 4), cyl(0.05, 0.05, mach, { pos: [0, 0.3, 0] }))); g.userData.radius = 0.4; break;
    case 'pistonRod': P('vastago', groupOf(cyl(0.03, 0.55, mach, { pos: [0, 0.275, 0] }), threads(0.03, 0.45, 0.55, dark, 5), ring(0.028, 0.06, 0.03, mach, { pos: [0, 0.35, 0] }), cyl(0.045, 0.06, mach, { pos: [0, 0.03, 0] }))); g.userData.radius = 0.4; break;
    case 'rodClamp': { const mk = (s) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 24, 1, false, s > 0 ? 0 : Math.PI, Math.PI), dark); h.castShadow = h.receiveShadow = Q.shadows; h.add(box(0.19, 0.1, 0.05, dark, { pos: [0, 0, s * 0.02] })); for (const x of [-0.06, 0.06]) h.add(cyl(0.012, 0.09, mach, { pos: [x, 0, s * 0.045], rot: [Math.PI / 2, 0, 0], seg: 8 })); return h; }; P('grampaVastago', mk(1), [0, 0, 1], 0.2); P('grampaVastago', mk(-1), [0, 0, -1], 0.2); g.userData.radius = 0.2; break; }
    case 'linerClamp': { const mk = (s) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 32, 1, false, s > 0 ? 0 : Math.PI, Math.PI), red); h.castShadow = h.receiveShadow = Q.shadows; h.add(box(0.36, 0.08, 0.04, red, { pos: [0, 0, s * 0.02] })); for (const x of [-0.13, 0.13]) h.add(cyl(0.014, 0.1, mach, { pos: [x, 0, s * 0.04], rot: [Math.PI / 2, 0, 0], seg: 8 })); return h; }; P('grampaCamisa', mk(1), [0, 0, 1], 0.3); P('grampaCamisa', mk(-1), [0, 0, -1], 0.3); g.userData.radius = 0.28; break; }
    case 'valveGuide': { const gd = groupOf(cyl(0.02, 0.18, mach, { pos: [0, 0.09, 0] }), ring(0.11, 0.13, 0.02, mach)); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; gd.add(beam([0, 0, 0], [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12], 0.008, mach)); } P('guiaValvula', gd); g.userData.radius = 0.2; break; }
    case 'piston': P('piston', groupOf(cyl(0.075, 0.09, mach, { pos: [0, 0.045, 0] }), ring(0.04, 0.115, 0.06, rub, { pos: [0, 0.03, 0], seg: 40 }), cyl(0.035, 0.05, mach, { pos: [0, 0.11, 0] }), hexNut(0.045, 0.03, mach, { pos: [0, 0.15, 0] }))); g.userData.radius = 0.2; break;
    case 'gateShaft': P('ejeEsclusa', groupOf(cyl(0.05, 0.9, mach, { pos: [0, 0.45, 0] }), threads(0.05, 0.75, 0.9, dark, 6), box(0.09, 0.06, 0.03, mach, { pos: [0, 0.06, 0.05] }))); g.userData.radius = 0.6; break;
    case 'manualStem': P('vastagoManual', groupOf(cyl(0.028, 0.5, mach, { pos: [0, 0.25, 0] }), threads(0.028, 0.02, 0.32, dark, 10), ring(0.026, 0.05, 0.03, red, { pos: [0, 0.34, 0] }), cyl(0.04, 0.2, mach, { pos: [0, 0.45, 0] }), beam([-0.2, 0.52, 0], [0.2, 0.52, 0], 0.016, mach))); g.userData.radius = 0.4; break;
    case 'spring': { const pts = []; for (let i = 0; i <= 200; i++) { const a = (i / 200) * Math.PI * 2 * 7; pts.push(V(Math.cos(a) * 0.06, (i / 200) * 0.22, Math.sin(a) * 0.06)); } const s = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.007, 8, false), mach); P('resorte', s); g.userData.radius = 0.2; break; }
    case 'plunger': P('emboloBuzo', groupOf(cyl(0.05, 0.7, M.chrome(), { pos: [0, 0.35, 0] }), cyl(0.06, 0.06, mach, { pos: [0, 0.03, 0] }), threads(0.05, 0.6, 0.7, dark, 5))); g.userData.radius = 0.5; break;
    case 'washPipe': P('canoLavador', groupOf(cyl(0.045, 0.5, M.chrome(), { pos: [0, 0.25, 0] }), ring(0.04, 0.075, 0.05, mach, { pos: [0, 0.03, 0] }), ring(0.04, 0.075, 0.05, mach, { pos: [0, 0.47, 0] }))); g.userData.radius = 0.35; break;
    case 'economiser': P('economizador', groupOf(cyl(0.11, 0.55, red, { pos: [0, 0.275, 0] }), cyl(0.125, 0.14, red, { pos: [0, 0.45, 0] }), cyl(0.09, 0.2, red, { pos: [0, 0.65, 0] }), cyl(0.035, 0.28, red, { pos: [0, 0.72, 0], rot: [0, 0, Math.PI / 2] }), cyl(0.07, 0.08, mach, { pos: [0, -0.04, 0] }), threads(0.07, -0.08, 0, dark, 5))); g.userData.radius = 0.55; break;
    case 'economiserPump': P('bombaEconomizador', groupOf(box(0.42, 0.03, 0.34, red, { pos: [0, 0.015, 0] }), box(0.16, 0.42, 0.14, red, { pos: [-0.02, 0.24, 0] }), cyl(0.045, 0.22, red, { pos: [0.11, 0.2, 0.04] }), beam([0.11, 0.33, 0.04], [-0.22, 0.38, 0.04], 0.018, red), cyl(0.05, 0.02, M.white(), { pos: [0.2, 0.16, 0.14], rot: [Math.PI / 2, 0, 0] }), cyl(0.035, 0.04, red, { pos: [0.11, 0.06, 0.16], rot: [Math.PI / 2, 0, 0] }))); g.userData.radius = 0.4; break;
    default: P('pieza', box(0.2, 0.2, 0.2, mach)); g.userData.radius = 0.2;
  }
  g.userData.axis = 'y';
  return g;
}

// ---------- Fluid end de bomba triplex: despiece esquemático (una cámara) ----------
// Eje del vástago = X (potencia a la izquierda, fluid end a la derecha). Válvulas en Y.
export function buildFluidEnd({ variantIds = {} } = {}) {
  const g = new THREE.Group();
  const mach = M.machined(), red = M.painted(COLORS.red), dark = M.castIron(), rub = M.rubber(), ctx = M.rigGrey();
  const P = (key, obj, dir, dist, vitalmet = true) => reg(g, key, obj, dir, dist, vitalmet, variantIds[key] || null);
  // Cuerpo del módulo (contexto): bloque con alojamiento de camisa y pozos de válvula.
  const body = groupOf(box(0.9, 1.1, 0.6, ctx, { pos: [0.45, 0, 0] }), cyl(0.2, 0.3, ctx, { pos: [0.55, 0.7, 0], seg: 32 }), cyl(0.2, 0.3, ctx, { pos: [0.55, -0.7, 0], seg: 32 }));
  P('fluidEndBody', body, [0, 0, -1], 0.9, false);
  // Camisa (contexto) dentro del cuerpo.
  P('liner', ring(0.09, 0.14, 0.75, ctx, { pos: [-0.2, 0, 0], rot: [0, 0, Math.PI / 2], seg: 40 }), [-1, 0, 0], 1.4, false);
  // Válvula y asiento (contexto) en pozo de descarga.
  P('valveSeat', groupOf(ring(0.05, 0.11, 0.08, ctx, { pos: [0.55, 0.62, 0], seg: 32 }), lathe([[0, 0], [0.1, 0], [0.11, 0.05], [0.03, 0.09], [0.03, 0.14], [0, 0.14], [0, 0]], ctx, { pos: [0.55, 0.66, 0], seg: 32 })), [0, 1, 0], 1.0, false);
  P('spring', (() => { const pts = []; for (let i = 0; i <= 160; i++) { const a = (i / 160) * Math.PI * 2 * 6; pts.push(V(0.55 + Math.cos(a) * 0.05, 0.8 + (i / 160) * 0.16, Math.sin(a) * 0.05)); } return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, 0.006, 8, false), mach); })(), [0, 1, 0], 1.35);
  P('valveGuide', (() => { const gd = groupOf(cyl(0.018, 0.16, mach, { pos: [0.55, 0.9, 0] }), ring(0.1, 0.12, 0.02, mach, { pos: [0.55, 0.82, 0] })); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; gd.add(beam([0.55, 0.82, 0], [0.55 + Math.cos(a) * 0.11, 0.82, Math.sin(a) * 0.11], 0.007, mach)); } return gd; })(), [0, 1, 0], 1.7);
  P('valveCover', groupOf(lathe([[0, 0], [0.19, 0], [0.19, 0.12], [0.15, 0.17], [0.05, 0.17], [0.05, 0.24], [0, 0.24], [0, 0]], red, { pos: [0.55, 0.85, 0], seg: 40 }), threads(0.19, 0.86, 0.94, mach, 3)), [0, 1, 0], 2.1);
  P('plug', groupOf(cyl(0.07, 0.1, mach, { pos: [0.55, 1.12, 0] }), hexNut(0.06, 0.04, mach, { pos: [0.55, 1.19, 0] })), [0, 1, 0], 2.5);
  P('flange', (() => { const f = ring(0.07, 0.2, 0.04, red, { pos: [0.55, -0.87, 0], seg: 40 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; f.add(cyl(0.013, 0.06, dark, { pos: [0.55 + Math.cos(a) * 0.16, -0.87, Math.sin(a) * 0.16], seg: 8 })); } return f; })(), [0, -1, 0], 1.0);
  // Tren de vástago (eje X): pistón → vástago → grampa → porta vástago.
  P('wearPlate', ring(0.05, 0.135, 0.03, mach, { pos: [0.18, 0, 0], rot: [0, 0, Math.PI / 2], seg: 40 }), [1, 0, 0], 0.55);
  P('piston', groupOf(cyl(0.07, 0.08, mach, { pos: [-0.05, 0, 0], rot: [0, 0, Math.PI / 2] }), ring(0.035, 0.088, 0.055, rub, { pos: [-0.06, 0, 0], rot: [0, 0, Math.PI / 2], seg: 40 }), hexNut(0.04, 0.03, mach, { pos: [0.0, 0, 0], rot: [0, 0, Math.PI / 2] })), [-1, 0, 0], 0.5);
  P('pistonRod', groupOf(cyl(0.028, 0.6, mach, { pos: [-0.4, 0, 0], rot: [0, 0, Math.PI / 2] }), ring(0.027, 0.05, 0.03, mach, { pos: [-0.68, 0, 0], rot: [0, 0, Math.PI / 2] })), [-1, 0, 0], 1.1);
  P('linerNut', (() => { const n = ring(0.145, 0.2, 0.22, red, { pos: [-0.62, 0, 0], rot: [0, 0, Math.PI / 2], seg: 40 }); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; n.add(cyl(0.03, 0.12, dark, { pos: [-0.62, Math.cos(a) * 0.2, Math.sin(a) * 0.2], rot: [a + Math.PI / 2, 0, 0], seg: 10 })); } return n; })(), [-1, 0, 0], 0.75);
  P('linerClamp', (() => { const c = new THREE.Group(); for (const s of [1, -1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 32, 1, false, s > 0 ? 0 : Math.PI, Math.PI), red); h.castShadow = h.receiveShadow = Q.shadows; h.rotation.z = Math.PI / 2; h.position.set(-0.3, 0, 0); c.add(h); } return c; })(), [0, 0, 1], 0.9);
  P('rodClamp', (() => { const c = new THREE.Group(); for (const s of [1, -1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.1, 24, 1, false, s > 0 ? 0 : Math.PI, Math.PI), dark); h.castShadow = h.receiveShadow = Q.shadows; h.rotation.z = Math.PI / 2; h.position.set(-0.72, 0, 0); h.add(box(0.1, 0.16, 0.04, dark, { pos: [0, 0, s * 0.02] })); c.add(h); } return c; })(), [0, 0, 1], 1.2);
  P('ponyRod', groupOf(cyl(0.032, 0.5, mach, { pos: [-1.02, 0, 0], rot: [0, 0, Math.PI / 2] }), ring(0.03, 0.08, 0.04, mach, { pos: [-1.29, 0, 0], rot: [0, 0, Math.PI / 2] }), cyl(0.045, 0.06, mach, { pos: [-0.8, 0, 0], rot: [0, 0, Math.PI / 2] })), [-1, 0, 0], 1.6);
  g.userData.radius = 1.6; g.userData.axis = 'x'; g.userData.center = V(-0.2, 0, 0);
  return g;
}

// Modelo GLB (exportado desde CAD): se carga de forma asíncrona sobre un grupo; g.userData.modelPromise resuelve al terminar.
const gltfLoader = new GLTFLoader();
export function buildModel(variant, { variantId } = {}) {
  const g = new THREE.Group(); const m = variant.model;
  g.userData.parts = []; g.userData.radius = 0.5; g.userData.axis = 'y';
  g.userData.modelPromise = new Promise((resolve, reject) => {
    gltfLoader.load(m.src, (gltf) => {
      const root = gltf.scene; root.scale.setScalar(m.unit ?? 0.001);
      root.updateMatrixWorld(true);
      const b0 = new THREE.Box3().setFromObject(root), s0 = b0.getSize(new THREE.Vector3());
      if ((m.up === 'z') || (m.up !== 'y' && s0.z > s0.y * 1.5)) root.rotation.x = -Math.PI / 2;   // Z arriba → Y arriba
      if (m.lay) root.rotation.z = -Math.PI / 2;                                                    // piezas largas: acostadas (eje Y → X)
      root.traverse((o) => { if (o.isMesh) { o.material = M.machined(); o.castShadow = o.receiveShadow = Q.shadows; o.userData.partKey = 'modelo'; o.userData.vitalmet = true; if (variantId) o.userData.variantId = variantId; } });
      // Piezas: un GLB puede traer varios nodos con nombre (model.parts); si no, todo el modelo es una pieza.
      // `dir` se expresa en el sistema del modelo (Z arriba en los planos), porque la traslación de despiece se aplica en el nodo padre sin rotar.
      const specs = m.parts || [{ name: null, key: 'modelo', dir: [0, 0, 1], dist: 0 }];
      const parts = [];
      for (const sp of specs) {
        const obj = sp.name ? root.getObjectByName(sp.name) : root;
        if (!obj) { console.warn('Modelo', m.src, ': no se encontró la pieza', sp.name); continue; }
        const mat = sp.color ? M.painted(sp.color) : M.machined();
        obj.traverse((o) => { if (o.isMesh) { o.material = mat; o.userData.partKey = sp.key; } });
        obj.userData.partKey = sp.key; obj.userData.vitalmet = true;
        parts.push({ key: sp.key, obj, home: obj.position.clone(), dir: V(...(sp.dir || [0, 0, 1])).normalize(), dist: sp.dist || 0, vitalmet: true, variantId });
      }
      root.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(root); const c = b.getCenter(new THREE.Vector3());
      root.position.sub(c);
      g.add(root);
      g.userData.parts = parts.length ? parts : [{ key: 'modelo', obj: root, home: root.position.clone(), dir: V(0, 1, 0), dist: 0, vitalmet: true, variantId }];
      g.userData.radius = b.getSize(new THREE.Vector3()).length() / 2;
      resolve(g);
    }, undefined, reject);
  });
  return g;
}

// Builder por variante (usado en escenas y en el estudio).
export function buildVariant(variant, opts = {}) {
  const geo = variant.geometry || {};
  const o = { variantId: variant.id, ...opts };
  if (variant.model && opts.preferModel !== false) return buildModel(variant, o);
  switch (geo.type) {
    case 'union': return buildUnion({ fig: geo.fig, size: opts.size ?? 3, nut: geo.nut, body: geo.body, lugs: geo.lugs ?? 3, ...o });
    case 'pupjoint': return buildPupJoint({ size: opts.size ?? 3, len: opts.len ?? 2.4, nut: geo.nut, body: geo.body, ...o });
    case 'elbow': return buildElbow({ fig: geo.fig, size: 2, nut: geo.nut, body: geo.body, ...o });
    case 'swivel': return buildSwivel({ size: 2, swivels: geo.swivels ?? 3, body: geo.body, ...o });
    case 'plugvalve': return buildPlugValve({ size: opts.size ?? 2, integral: geo.integral, handle: geo.handle, body: geo.body, nut: geo.nut, ...o });
    case 'gatevalve': return buildGateValve({ size: 2, body: geo.body, ...o });
    case 'bx': return buildBX({ size: opts.size ?? 4.0625, withFlanges: opts.withFlanges ?? true, gap: opts.gap ?? false, ...o });
    case 'kit': return buildKit({ size: geo.size ?? 2, nut: geo.nut, ...o });
    case 'drum': return buildDrum({ withContext: opts.withContext ?? true, ...o });
    case 'pumpPart': return buildPumpPart(geo.part, o);
    default: { const g = new THREE.Group(); g.add(box(0.2, 0.2, 0.2, M.vitalmet())); g.userData.radius = 0.2; g.userData.axis = 'y'; return g; }
  }
}
