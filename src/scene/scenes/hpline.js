// Escena "Línea de alta presión": línea temporaria de tratamiento (cementación / fractura / prueba) entre una unidad de
// bombeo y el árbol del pozo. Es donde se concentran las uniones, pup joints, codos y válvulas Vitalmet.
// Disposición ilustrativa; no representa un arreglo real ni una práctica recomendada.
import * as THREE from 'three';
import { M, COLORS } from '../materials.js';
import { box, cyl, beam, torus, pipeRun, flange, groupOf, setShadows } from '../builders.js';
import { buildUnion, buildPupJoint, buildElbow, buildSwivel, buildPlugValve, buildBX } from '../parts.js';
import { buildPad } from '../environment.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildHPLineScene() {
  const group = new THREE.Group(); const context = new THREE.Group(); group.add(context);
  const instances = [];
  const addInst = (familyId, obj, { primary = false, anchor, variantId = null, scale = 1, pos, rot } = {}) => {
    if (scale !== 1) obj.scale.setScalar(scale);
    if (pos) obj.position.set(...pos); if (rot) obj.rotation.set(...rot);
    group.add(obj);
    instances.push({ familyId, variantId, obj, primary, anchor: anchor ? V(...anchor) : obj.position.clone() });
    return obj;
  };
  const dark = M.steelDark(), grey = M.rigGrey(), tree = M.painted('#4b5560'), red = M.painted(COLORS.red);
  const S = 1.6;   // factor de escala de las piezas Vitalmet para legibilidad
  const LY = 0.85; // altura de la línea sobre el terreno

  // ---------- Árbol / cabezal ----------
  context.add(box(4, 0.15, 4, M.concrete(), { pos: [0, 0.075, 0] }));
  context.add(cyl(0.5, 0.8, tree, { pos: [0, 0.55, 0], seg: 32 }));
  context.add(flange(0.85, 0.24, dark, { bolts: 12, boltR: 0.04 }).translateY(1.0));
  addInst('anillo-bx', buildBX({ size: 7.0625, withFlanges: false, variantId: 'bx-serie' }), { scale: 1.6, pos: [0, 1.14, 0] });
  context.add(cyl(0.45, 0.9, tree, { pos: [0, 1.7, 0], seg: 32 }));
  addInst('anillo-bx', buildBX({ size: 7.0625, withFlanges: true, variantId: 'bx-serie' }), { primary: true, scale: 1.6, pos: [0, 2.35, 0], anchor: [0.9, 2.35, 0.6] });
  context.add(box(1.3, 1.0, 0.8, tree, { pos: [0, 3.1, 0] }));                                     // válvula maestra (contexto)
  for (const s of [-1, 1]) { context.add(cyl(0.12, 0.9, grey, { pos: [s * 0.9, 3.1, 0], rot: [0, 0, Math.PI / 2], seg: 10 })); context.add(torus(0.42, 0.035, grey, { pos: [s * 1.45, 3.1, 0], rot: [0, Math.PI / 2, 0], tSeg: 6, seg: 24 })); }
  context.add(cyl(0.42, 0.7, tree, { pos: [0, 3.95, 0], seg: 32 }));
  context.add(flange(0.7, 0.2, dark, { bolts: 8, boltR: 0.035 }).translateY(4.4));
  context.add(cyl(0.4, 0.9, tree, { pos: [0, 4.95, 0], seg: 32 }));                                 // cabeza de fractura
  for (const s of [-1, 1]) context.add(cyl(0.14, 0.7, tree, { pos: [s * 0.55, 4.95, 0], rot: [0, 0, Math.PI / 2], seg: 16 }));
  context.add(cyl(0.16, 0.6, grey, { pos: [0, 5.7, 0], seg: 16 })); context.add(cyl(0.2, 0.05, M.white(), { pos: [0, 6.05, 0], seg: 20 }));

  // ---------- Línea desde el árbol hacia la unidad de bombeo (−X) ----------
  addInst('codo', buildElbow({ fig: 1502, size: 2, nut: COLORS.blue, body: COLORS.red, variantId: 'codo-fig1502' }), { primary: true, scale: S, pos: [-1.05, 4.95, 0], rot: [Math.PI, 0, 0], anchor: [-1.6, 5.6, 0] });
  addInst('pup-joint', buildPupJoint({ size: 3, len: 2.6, nut: COLORS.blue, body: COLORS.red, variantId: 'pup-joint-std' }), { scale: S, pos: [-1.75, 3.0, 0] });
  addInst('codo', buildElbow({ fig: 1502, size: 2, nut: COLORS.blue, body: COLORS.red, variantId: 'codo-fig1502' }), { scale: S, pos: [-1.75, LY + 0.02, 0], rot: [0, Math.PI, 0] });
  const horiz = (x0, x1) => context.add(pipeRun([[x0, LY, 0], [x1, LY, 0]], 0.07, red));
  horiz(-2.3, -3.1);
  addInst('pup-joint', buildPupJoint({ size: 3, len: 2.8, nut: COLORS.blue, body: COLORS.red, variantId: 'pup-joint-std' }), { primary: true, scale: S, pos: [-5.0, LY, 0], rot: [0, 0, Math.PI / 2], anchor: [-5.0, LY + 0.9, 0] });
  addInst('union', buildUnion({ fig: 1502, size: 3, nut: COLORS.blue, body: COLORS.red, variantId: 'union-fig1502' }), { primary: true, scale: S, pos: [-7.5, LY, 0], rot: [0, 0, Math.PI / 2], anchor: [-7.5, LY + 0.9, 0] });
  horiz(-7.8, -8.4);
  addInst('valvula', buildPlugValve({ size: 2, integral: true, handle: 'wheel', body: COLORS.red, nut: COLORS.blue, variantId: 'vtb-integral' }), { primary: true, scale: S, pos: [-9.3, LY, 0], anchor: [-9.3, LY + 1.3, 0] });
  horiz(-10.2, -10.7);
  addInst('valvula', buildPlugValve({ size: 2, integral: true, handle: 'wheel', body: COLORS.red, nut: COLORS.blue, variantId: 'vtb-integral' }), { scale: S, pos: [-11.6, LY, 0] });
  horiz(-12.5, -13.0);
  context.add(groupOf(cyl(0.2, 0.9, dark, { pos: [-13.6, LY, 0], rot: [0, 0, Math.PI / 2], seg: 24 }), box(0.3, 0.55, 0.35, dark, { pos: [-13.6, LY + 0.3, 0] }))); // válvula de retención (contexto)
  horiz(-14.1, -14.6);
  addInst('union', buildUnion({ fig: 1502, size: 3, nut: COLORS.blue, body: COLORS.red, variantId: 'union-fig1502' }), { scale: S, pos: [-15.0, LY, 0], rot: [0, 0, Math.PI / 2] });
  addInst('pup-joint', buildPupJoint({ size: 3, len: 2.8, nut: COLORS.blue, body: COLORS.red, variantId: 'pup-joint-std' }), { scale: S, pos: [-17.6, LY, 0], rot: [0, 0, Math.PI / 2] });
  horiz(-19.9, -20.4);
  addInst('codo-giratorio', buildSwivel({ size: 2, swivels: 3, body: COLORS.vitalmet, variantId: 'codo-giratorio-2' }), { primary: true, scale: S, pos: [-20.4, LY, 0], rot: [0, 0, Math.PI / 2], anchor: [-21.3, LY + 1.4, 0] });
  addInst('codo-giratorio', buildSwivel({ size: 2, swivels: 3, body: COLORS.vitalmet, variantId: 'codo-giratorio-2' }), { scale: S, pos: [-22.0, LY + 0.9, 0.6], rot: [0, Math.PI / 2, Math.PI / 2] });
  for (const x of [-3.4, -6.6, -8.1, -10.45, -12.75, -14.35, -19.2]) context.add(groupOf(beam([x, 0, 0.45], [x, LY - 0.25, 0], 0.03, grey), beam([x, 0, -0.45], [x, LY - 0.25, 0], 0.03, grey), beam([x - 0.4, 0, 0], [x, LY - 0.25, 0], 0.03, grey), box(0.5, 0.08, 0.35, grey, { pos: [x, LY - 0.22, 0] })));
  context.add(groupOf(beam([-8.1, LY, 0], [-8.1, LY + 0.7, 0], 0.03, grey), cyl(0.14, 0.05, M.white(), { pos: [-8.1, LY + 0.8, 0], rot: [Math.PI / 2, 0, 0], seg: 20 }))); // manómetro

  // ---------- Unidad de bombeo (camión, contexto) ----------
  const TX = -26.9;
  context.add(box(9.5, 0.5, 2.6, dark, { pos: [TX, 1.05, 0] }));
  for (const x of [TX - 3.5, TX - 2.1, TX + 3.6]) for (const z of [-1.2, 1.2]) context.add(cyl(0.55, 0.4, M.rubber(), { pos: [x, 0.55, z], rot: [Math.PI / 2, 0, 0], seg: 24 }));
  context.add(box(2.3, 2.4, 2.5, M.painted('#c8242a'), { pos: [TX - 3.7, 2.5, 0] }));
  context.add(box(1.8, 1.0, 2.3, M.glass(), { pos: [TX - 3.7, 3.1, 0] }));
  context.add(box(3.2, 2.0, 2.4, M.painted('#6b747a'), { pos: [TX - 0.6, 2.3, 0] }));
  for (const z of [-0.6, 0.6]) context.add(cyl(0.18, 1.6, dark, { pos: [TX - 1.2, 4.1, z], seg: 12 }));
  context.add(box(2.6, 1.7, 2.2, M.painted('#8a2c28'), { pos: [TX + 2.9, 2.15, 0] }));
  for (const z of [-0.7, 0, 0.7]) { context.add(cyl(0.2, 0.3, dark, { pos: [TX + 4.3, 2.15, z], rot: [0, 0, Math.PI / 2], seg: 20 })); context.add(cyl(0.17, 0.3, dark, { pos: [TX + 3.4, 3.15, z], seg: 20 })); }
  context.add(pipeRun([[TX + 3.4, 3.35, -0.7], [TX + 3.4, 3.35, 1.1], [TX + 4.9, 3.35, 1.1], [TX + 4.9, LY + 0.9, 1.1], [TX + 4.9, LY + 0.9, 0.6]], 0.07, dark));
  context.add(box(9.5, 0.08, 2.8, grey, { pos: [TX, 1.34, 0] }));

  context.add(buildPad({ w: 64, d: 40, h: 0.5, x: -13, z: 0, road: false }));
  setShadows(context);
  instances.forEach((i) => setShadows(i.obj));
  return { id: 'hpline', group, context, instances, environment: 'desert', camera: { pos: V(-1.5, 7.5, 18), target: V(-8.5, 1.8, 0) } };
}
