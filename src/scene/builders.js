// Primitivas y ensamblajes geométricos reutilizables. Unidades: metros.
import * as THREE from 'three';
import { M } from './materials.js';

export const Q = { seg: 24, shadows: true }; // ajustado por el nivel de calidad
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function add(parent, obj, pos, rot) {
  if (pos) obj.position.set(...pos);
  if (rot) obj.rotation.set(...rot);
  parent.add(obj);
  return obj;
}
export function mesh(geometry, material, { pos, rot, cast = true, receive = true } = {}) {
  const o = new THREE.Mesh(geometry, material);
  if (pos) o.position.set(...pos);
  if (rot) o.rotation.set(...rot);
  o.castShadow = cast && Q.shadows; o.receiveShadow = receive && Q.shadows;
  return o;
}
export const box = (w, h, d, material = M.steel(), opts) => mesh(new THREE.BoxGeometry(w, h, d), material, opts);
export const cyl = (r, h, material = M.steel(), opts = {}) => mesh(new THREE.CylinderGeometry(opts.rTop ?? r, r, h, opts.seg ?? Q.seg, 1, opts.open ?? false), material, opts);
export const sphere = (r, material = M.steel(), opts = {}) => mesh(new THREE.SphereGeometry(r, opts.seg ?? Q.seg, Math.max(8, (opts.seg ?? Q.seg) / 2)), material, opts);
export const torus = (r, t, material = M.steel(), opts = {}) => mesh(new THREE.TorusGeometry(r, t, opts.tSeg ?? Math.max(8, Q.seg / 2), opts.seg ?? Q.seg * 2, opts.arc ?? Math.PI * 2), material, opts);

// Cilindro entre dos puntos (vigas, tubos rectos).
export function beam(a, b, r, material = M.steel(), opts = {}) {
  const av = V(...a), bv = V(...b), len = av.distanceTo(bv);
  const o = mesh(new THREE.CylinderGeometry(r, r, len, opts.seg ?? Math.max(6, Q.seg / 2)), material, opts);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), bv.clone().sub(av).normalize());
  return o;
}
// Perfil de sección rectangular entre dos puntos (perfiles IPN/UPN simplificados).
export function bar(a, b, w, h, material = M.steel(), opts = {}) {
  const av = V(...a), bv = V(...b), len = av.distanceTo(bv);
  const o = mesh(new THREE.BoxGeometry(w, len, h), material, opts);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), bv.clone().sub(av).normalize());
  return o;
}
// Pieza torneada: perfil [[r, y], ...] (LatheGeometry).
export function lathe(profile, material = M.steel(), opts = {}) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return mesh(new THREE.LatheGeometry(pts, opts.seg ?? Q.seg), material, opts);
}
// Anillo/arandela sólida: radio interior, exterior y altura.
export function ring(rIn, rOut, h, material = M.steel(), opts = {}) {
  return lathe([[rIn, -h / 2], [rOut, -h / 2], [rOut, h / 2], [rIn, h / 2], [rIn, -h / 2]], material, opts);
}
// Tubo a lo largo de una polilínea con codos redondeados.
export function pipeRun(points, r, material = M.steel(), { bend = r * 2.2, seg } = {}) {
  const g = new THREE.Group();
  const pts = points.map((p) => V(...p));
  if (pts.length === 2) { g.add(beam(points[0], points[1], r, material, { seg })); return g; }
  const path = new THREE.CurvePath();
  let prevPoint = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], cur = pts[i], next = pts[i + 1];
    const dIn = cur.clone().sub(prev).normalize(), dOut = next.clone().sub(cur).normalize();
    const bl = Math.min(bend, prev.distanceTo(cur) / 2, cur.distanceTo(next) / 2);
    const a = cur.clone().sub(dIn.multiplyScalar(bl)), b = cur.clone().add(dOut.multiplyScalar(bl));
    if (prevPoint.distanceTo(a) > 1e-4) path.add(new THREE.LineCurve3(prevPoint, a));
    path.add(new THREE.QuadraticBezierCurve3(a, cur, b));
    prevPoint = b;
  }
  path.add(new THREE.LineCurve3(prevPoint, pts[pts.length - 1]));
  const tubular = Math.max(12, Math.round(path.getLength() / (r * 1.5)));
  g.add(mesh(new THREE.TubeGeometry(path, Math.min(400, tubular), r, seg ?? Math.max(8, Q.seg / 2), false), material));
  return g;
}
// Manguera flexible (curva suave).
export function hose(points, r, material = M.rubber()) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => V(...p)), false, 'catmullrom', 0.5);
  return mesh(new THREE.TubeGeometry(curve, 48, r, Math.max(8, Q.seg / 2), false), material);
}
// Brida con bulones.
export function flange(r, h, material = M.steelDark(), { bolts = 8, boltR = 0.03, boltMat = M.steel() } = {}) {
  const g = new THREE.Group();
  g.add(cyl(r, h, material));
  for (let i = 0; i < bolts; i++) {
    const a = (i / bolts) * Math.PI * 2, rr = r * 0.78;
    g.add(cyl(boltR, h * 1.6, boltMat, { pos: [Math.cos(a) * rr, 0, Math.sin(a) * rr], seg: 6 }));
  }
  return g;
}
// Baranda a lo largo de una polilínea (en el plano XZ a altura y).
export function railing(points, y, h = 1.1, material = M.safety()) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    g.add(beam([x, y, z], [x, y + h, z], 0.02, material));
    if (i < points.length - 1) {
      const [x2, z2] = points[i + 1];
      const len = Math.hypot(x2 - x, z2 - z), n = Math.floor(len / 1.5);
      for (let k = 1; k <= n; k++) { const tt = k / (n + 1); g.add(beam([x + (x2 - x) * tt, y, z + (z2 - z) * tt], [x + (x2 - x) * tt, y + h, z + (z2 - z) * tt], 0.018, material)); }
      g.add(beam([x, y + h, z], [x2, y + h, z2], 0.022, material));
      g.add(beam([x, y + h * 0.5, z], [x2, y + h * 0.5, z2], 0.016, material));
    }
  }
  return g;
}
// Escalera vertical con guardahombre opcional.
export function ladder(x, z, y0, y1, dir = [0, 1], w = 0.5, material = M.rigGrey(), cage = true) {
  const g = new THREE.Group();
  const nx = -dir[1], nz = dir[0];
  const a = [x + nx * w / 2, z + nz * w / 2], b = [x - nx * w / 2, z - nz * w / 2];
  g.add(beam([a[0], y0, a[1]], [a[0], y1, a[1]], 0.025, material));
  g.add(beam([b[0], y0, b[1]], [b[0], y1, b[1]], 0.025, material));
  for (let y = y0 + 0.3; y < y1; y += 0.3) g.add(beam([a[0], y, a[1]], [b[0], y, b[1]], 0.014, material));
  if (cage) for (let y = y0 + 2.2; y < y1 - 0.5; y += 1.2) { const t = torus(w * 0.75, 0.012, material, { arc: Math.PI, seg: 16 }); t.position.set(x + dir[0] * 0.15, y, z + dir[1] * 0.15); t.rotation.set(Math.PI / 2, 0, Math.atan2(dir[1], dir[0]) + Math.PI / 2); g.add(t); }
  return g;
}
// Escalera inclinada con peldaños.
export function stairs(from, to, width = 1, material = M.rigGrey(), rail = true) {
  const g = new THREE.Group();
  const a = V(...from), b = V(...to), n = Math.max(3, Math.round(Math.abs(b.y - a.y) / 0.22));
  const dir = b.clone().sub(a); dir.y = 0; const len = dir.length(); dir.normalize();
  const side = V(-dir.z, 0, dir.x).multiplyScalar(width / 2);
  for (let i = 0; i <= n; i++) {
    const tt = i / n; const p = a.clone().lerp(b, tt);
    const step = box(width, 0.04, Math.max(0.22, len / n), material); step.position.copy(p); step.rotation.y = -Math.atan2(dir.z, dir.x); g.add(step);
  }
  for (const s of [1, -1]) {
    const p0 = a.clone().add(side.clone().multiplyScalar(s)), p1 = b.clone().add(side.clone().multiplyScalar(s));
    g.add(bar([p0.x, p0.y - 0.15, p0.z], [p1.x, p1.y - 0.15, p1.z], 0.05, 0.25, material));
    if (rail) { g.add(beam([p0.x, p0.y + 1, p0.z], [p1.x, p1.y + 1, p1.z], 0.02, M.safety())); g.add(beam([p0.x, p0.y, p0.z], [p0.x, p0.y + 1, p0.z], 0.02, M.safety())); g.add(beam([p1.x, p1.y, p1.z], [p1.x, p1.y + 1, p1.z], 0.02, M.safety())); }
  }
  return g;
}
// Mástil reticulado troncopiramidal con arriostramiento en X en las cuatro caras.
export function lattice({ x = 0, z = 0, y0 = 0, h = 40, w0 = 4.2, w1 = 1.6, d0 = 3.4, d1 = 1.6, levels = 14, legR = 0.13, braceR = 0.045, material = M.rigRed(), braceMat = M.rigGrey() }) {
  const g = new THREE.Group();
  const corner = (i, y) => { const tt = (y - y0) / h; const w = (w0 + (w1 - w0) * tt) / 2, d = (d0 + (d1 - d0) * tt) / 2; return [x + (i % 2 ? w : -w), y, z + (i < 2 ? -d : d)]; };
  for (let i = 0; i < 4; i++) g.add(beam(corner(i, y0), corner(i, y0 + h), legR, material, { seg: 10 }));
  for (let n = 0; n < levels; n++) {
    const y = y0 + (n * h) / levels, yy = y + h / levels;
    for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]]) {
      g.add(beam(corner(a, y), corner(b, y), braceR, braceMat, { seg: 6 }));
      g.add(beam(corner(a, y), corner(b, yy), braceR * 0.85, braceMat, { seg: 6 }));
      g.add(beam(corner(b, y), corner(a, yy), braceR * 0.85, braceMat, { seg: 6 }));
    }
  }
  for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]]) g.add(beam(corner(a, y0 + h), corner(b, y0 + h), braceR, braceMat, { seg: 6 }));
  g.userData.corner = corner;
  return g;
}
// Tanque rectangular con refuerzos.
export function tank(w, h, d, material = M.rigGrey(), ribs = 4) {
  const g = new THREE.Group();
  g.add(box(w, h, d, material, { pos: [0, h / 2, 0] }));
  for (let i = 0; i <= ribs; i++) { const xx = -w / 2 + (i * w) / ribs; g.add(box(0.06, h, d + 0.08, M.steelDark(), { pos: [xx, h / 2, 0] })); }
  g.add(box(w + 0.1, 0.06, d + 0.1, M.steelDark(), { pos: [0, h, 0] }));
  return g;
}
// Tuerca de tres aletas (uniones de golpe). r = radio exterior del cuerpo de la tuerca.
export function lugNut(r, h, material, lugs = 3, lugMat = material) {
  const g = new THREE.Group();
  g.add(lathe([[r * 0.62, -h / 2], [r, -h / 2], [r, h / 2], [r * 0.62, h / 2], [r * 0.62, -h / 2]], material));
  for (let i = 0; i < lugs; i++) {
    const a = (i / lugs) * Math.PI * 2 + Math.PI / 6;
    const lug = box(r * 0.5, h * 0.95, r * 0.36, lugMat); lug.position.set(Math.cos(a) * r * 1.05, 0, Math.sin(a) * r * 1.05); lug.rotation.y = -a; g.add(lug);
  }
  return g;
}
// Tuerca hexagonal.
export function hexNut(r, h, material = M.steel()) { return cyl(r, h, material, { seg: 6 }); }
// Marcado de textos en 3D no se usa (etiquetas HTML). Utilidades varias:
export function groupOf(...objs) { const g = new THREE.Group(); objs.forEach((o) => g.add(o)); return g; }
export function setShadows(obj, cast = true, receive = true) { obj.traverse((o) => { if (o.isMesh) { o.castShadow = cast && Q.shadows; o.receiveShadow = receive && Q.shadows; } }); return obj; }
export function bounds(obj) { return new THREE.Box3().setFromObject(obj); }
export const rotX = (o, a) => { o.rotation.x = a; return o; };
export const rotZ = (o, a) => { o.rotation.z = a; return o; };
export const rotY = (o, a) => { o.rotation.y = a; return o; };
