// Escena "Equipo de perforación": rig terrestre ilustrativo (mástil reticulado, subestructura alta, BOP bajo el piso,
// bombas de lodo, tanques, casa de fuerza, manifold de estrangulación, acumulador, catwalk) con productos Vitalmet ubicados
// donde se usan. Proporciones verosímiles, NO validadas por un especialista ni contra un equipo real.
import * as THREE from 'three';
import { M, COLORS } from '../materials.js';
import { box, cyl, beam, bar, lathe, ring, torus, pipeRun, hose, flange, railing, ladder, stairs, lattice, tank, groupOf, sphere, setShadows } from '../builders.js';
import { buildUnion, buildPupJoint, buildElbow, buildSwivel, buildPlugValve, buildBX, buildDrum, buildPumpPart } from '../parts.js';
import { buildPad, buildCampExtras } from '../environment.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Bomba de lodo triplex (contexto). Origen: centro del skid a nivel de piso; vástagos según +X.
export function buildTriplexPump() {
  const g = new THREE.Group();
  const grey = M.rigGrey(), dark = M.steelDark(), red = M.painted('#8a2c28');
  g.add(box(6.2, 0.35, 2.7, dark, { pos: [-1.6, 0.175, 0] }));
  g.add(box(2.6, 1.9, 2.4, red, { pos: [-3.3, 1.3, 0] }));                   // power end
  g.add(cyl(1.15, 0.5, dark, { pos: [-3.3, 1.35, 1.45], rot: [Math.PI / 2, 0, 0], seg: 40 })); // volante/corona
  g.add(box(1.1, 1.3, 2.4, grey, { pos: [-1.45, 1.35, 0] }));                 // crossheads
  g.add(box(1.3, 1.5, 2.5, grey, { pos: [-0.25, 1.45, 0] }));                 // fluid end
  for (const z of [-0.8, 0, 0.8]) {
    g.add(cyl(0.24, 0.35, dark, { pos: [0.55, 1.45, z], rot: [0, 0, Math.PI / 2], seg: 24 })); // tapas de cilindro
    g.add(cyl(0.2, 0.32, dark, { pos: [-0.25, 2.35, z], seg: 24 }));          // pozos de válvula
    g.add(cyl(0.2, 0.32, dark, { pos: [-0.25, 0.55, z], seg: 24 }));
    g.add(cyl(0.085, 0.55, M.machined(), { pos: [-1.45, 1.55, z], rot: [0, 0, Math.PI / 2], seg: 12 })); // vástagos visibles
  }
  g.add(cyl(0.1, 2.6, dark, { pos: [-0.25, 2.62, 0], rot: [Math.PI / 2, 0, 0], seg: 16 }));  // manifold de descarga
  g.add(sphere(0.55, red, { pos: [-0.25, 3.25, 0], seg: 28 }));               // amortiguador de pulsaciones
  g.add(cyl(0.16, 2.6, dark, { pos: [-0.25, 0.5, 0], rot: [Math.PI / 2, 0, 0], seg: 16 }));  // manifold de succión
  for (const z of [-0.7, 0.7]) g.add(cyl(0.55, 1.3, dark, { pos: [-5.5, 0.9, z], rot: [0, 0, Math.PI / 2], seg: 24 })); // motores
  g.add(box(1.4, 0.4, 2.4, dark, { pos: [-5.5, 0.4, 0] }));
  g.add(box(2.2, 0.9, 0.2, grey, { pos: [-4.3, 1.9, 1.5] }));                 // guarda correas
  g.userData.fluidEndFace = V(0.9, 1.45, 0);
  return g;
}

export function buildRigScene() {
  const group = new THREE.Group(); const context = new THREE.Group(); group.add(context);
  const instances = [];
  const addInst = (familyId, obj, { primary = false, anchor, variantId = null, scale = 1, pos, rot } = {}) => {
    if (scale !== 1) obj.scale.setScalar(scale);
    if (pos) obj.position.set(...pos); if (rot) obj.rotation.set(...rot);
    group.add(obj);
    instances.push({ familyId, variantId, obj, primary, anchor: anchor ? V(...anchor) : obj.position.clone() });
    return obj;
  };
  const rigRed = M.rigRed(), grey = M.rigGrey(), dark = M.steelDark(), conc = M.concrete(), safety = M.safety();
  // Playón de ripio con talud, camino de acceso, casillas, camionetas y contenedores (contexto).
  context.add(buildPad({ w: 110, d: 90, h: 0.5, x: -4, z: 2, road: true }));
  context.add(buildCampExtras());

  // ---------- Subestructura y piso ----------
  const FL = 7.5; // altura del piso
  for (const x of [-6, 0, 6]) for (const z of [-5, 5]) { context.add(bar([x, 0, z], [x, FL - 0.4, z], 0.45, 0.45, rigRed)); context.add(box(1.2, 0.2, 1.2, conc, { pos: [x, 0.1, z] })); }
  for (const z of [-5, 5]) { context.add(bar([-6, FL - 0.45, z], [6, FL - 0.45, z], 0.5, 0.7, rigRed)); for (const [a, b] of [[-6, 0], [0, 6]]) { context.add(beam([a, 0.3, z], [b, FL - 0.8, z], 0.09, grey)); context.add(beam([b, 0.3, z], [a, FL - 0.8, z], 0.09, grey)); } }
  for (const x of [-6, 6]) { context.add(bar([x, FL - 0.45, -5], [x, FL - 0.45, 5], 0.5, 0.7, rigRed)); context.add(beam([x, 0.3, -5], [x, FL - 0.8, 5], 0.09, grey)); context.add(beam([x, 0.3, 5], [x, FL - 0.8, -5], 0.09, grey)); }
  context.add(box(13, 0.3, 11, dark, { pos: [0, FL - 0.15, 0] }));
  context.add(ring(0.55, 1.15, 0.12, M.castIron(), { pos: [0, FL + 0.06, 0], seg: 48 }));   // mesa rotaria
  context.add(cyl(0.2, 0.1, M.castIron(), { pos: [1.6, FL + 0.05, 1.3], seg: 16 }));            // mousehole
  context.add(railing([[-6.5, -5.5], [6.5, -5.5], [6.5, 5.5], [1.4, 5.5]], FL, 1.1));
  context.add(railing([[-1.4, 5.5], [-6.5, 5.5], [-6.5, -5.5]], FL, 1.1));
  // Casilla del perforador y consola.
  context.add(box(2.8, 2.7, 7, M.painted('#8e989c'), { pos: [7.9, FL + 1.35, -0.5] }));
  context.add(box(2.8, 0.15, 7, dark, { pos: [7.9, FL + 2.75, -0.5] }));
  context.add(box(0.9, 1.1, 1.4, dark, { pos: [4.9, FL + 0.55, 1.6] }));
  for (const z of [-2.5, 0.5]) context.add(box(0.05, 0.9, 1.2, M.glass(), { pos: [6.48, FL + 1.6, z] }));
  // Escalera principal (dos tramos) y plataforma.
  context.add(stairs([-11.2, 0, 3.8], [-6.7, 3.75, 3.8], 1.1));
  context.add(box(1.6, 0.12, 1.6, dark, { pos: [-7.3, 3.75, 3.8] }));
  context.add(stairs([-7.3, 3.75, 3.1], [-7.3, FL, -1.7], 1.1));
  context.add(box(1.6, 0.12, 1.6, dark, { pos: [-7.3, FL, -2.4] }));
  context.add(railing([[-8.1, -1.6], [-8.1, -3.2], [-6.5, -3.2]], FL, 1.1));
  // Rampa V-door y catwalk con caballetes.
  for (const x of [-0.8, 0.8]) context.add(bar([x, FL - 0.2, 5.5], [x, 1.2, 12.5], 0.25, 0.4, rigRed));
  for (let i = 0; i < 9; i++) context.add(box(1.7, 0.05, 0.12, grey, { pos: [0, FL - 0.2 - i * 0.7, 5.5 + i * 0.78], rot: [Math.atan2(6.3, 7), 0, 0] }));
  context.add(box(1.6, 0.9, 12, dark, { pos: [0, 0.75, 18.5] }));
  for (const s of [-1, 1]) { for (const z of [14, 20, 24]) context.add(box(0.35, 1.1, 0.35, grey, { pos: [s * 3.4, 0.55, z] })); for (let k = 0; k < 6; k++) context.add(cyl(0.065, 11, M.steel(), { pos: [s * (2.5 + k * 0.28), 1.2, 19.5], rot: [Math.PI / 2, 0, 0], seg: 10 })); }

  // ---------- Mástil ----------
  const H = 40, mast = lattice({ x: 0, z: 0, y0: FL, h: H, w0: 4.6, w1: 1.7, d0: 3.6, d1: 1.7, levels: 15 });
  context.add(mast);
  const top = FL + H;
  context.add(box(3.2, 0.9, 2.6, dark, { pos: [0, top + 0.45, 0] }));                        // corona
  for (let i = 0; i < 5; i++) context.add(cyl(0.48, 0.12, M.castIron(), { pos: [-0.8 + i * 0.4, top + 0.95, 0], rot: [0, 0, Math.PI / 2], seg: 24 }));
  context.add(box(3.0, 0.1, 2.4, grey, { pos: [0, top + 1.05, 0] }));
  // Guías del top drive (rieles) y aparejo.
  for (const x of [-0.9, 0.9]) context.add(bar([x, FL + 1, 1.9], [x, top - 2, 1.05], 0.12, 0.2, grey));
  const TB = 25;
  context.add(box(1.0, 2.2, 0.8, dark, { pos: [0, TB, 0] }));                                  // traveling block
  for (let i = 0; i < 4; i++) context.add(cyl(0.45, 0.1, M.castIron(), { pos: [-0.6 + i * 0.4, TB, 0], rot: [0, 0, Math.PI / 2], seg: 24 }));
  context.add(beam([0, TB - 1.1, 0], [0, TB - 2.4, 0], 0.16, dark));                          // gancho / bail
  context.add(box(1.5, 2.6, 1.3, M.painted('#6b747a'), { pos: [0, TB - 3.8, 0.1] }));        // top drive
  context.add(cyl(0.45, 1.5, dark, { pos: [0, TB - 2.9, 0.9], rot: [0, 0, 0], seg: 24 }));    // motor
  context.add(box(1.2, 0.5, 1.2, dark, { pos: [0, TB - 5.3, 0.1] }));
  context.add(box(1.4, 0.35, 0.5, grey, { pos: [0, TB - 3.6, 1.5] }));                        // carro guía
  context.add(cyl(0.085, TB - 5.55 - FL, M.steel(), { pos: [0, (TB - 5.55 + FL) / 2, 0], seg: 12 })); // tubería
  for (const x of [-0.35, 0.35]) context.add(beam([x, top + 0.9, 0], [x, TB + 1.1, 0], 0.022, M.castIron()));
  context.add(beam([0.9, top + 0.9, 0.2], [-3.6, FL + 1.55, 0.2], 0.026, M.castIron()));      // línea rápida al malacate
  context.add(beam([-0.9, top + 0.9, -0.2], [-1.7, FL + 0.3, -3.6], 0.02, M.castIron()));     // línea muerta
  // Encuelladero y viento-pared.
  const MB = FL + 24;
  context.add(box(4.2, 0.15, 1.6, dark, { pos: [0, MB, -2.6] }));
  for (let i = 0; i < 9; i++) context.add(box(0.06, 0.08, 2.2, grey, { pos: [-1.6 + i * 0.4, MB + 0.1, -1.1] }));
  context.add(railing([[-2.1, -3.3], [2.1, -3.3]], MB, 1.1));
  context.add(box(4.6, 2.4, 0.06, M.painted('#7c8a91'), { pos: [0, MB + 1.4, -3.4] }));
  context.add(ladder(2.55, 1.5, FL + 0.2, top - 3, [1, 0], 0.5, grey, true));

  // ---------- Malacate y campanas de freno ----------
  const DW = V(-3.9, FL, 0);
  context.add(box(3.8, 0.9, 3.4, rigRed, { pos: [DW.x, DW.y + 0.45, DW.z] }));
  const drum = cyl(0.62, 2.4, dark, { pos: [DW.x, DW.y + 1.55, DW.z], rot: [Math.PI / 2, 0, 0], seg: 36 }); context.add(drum);
  for (const z of [-1.25, 1.25]) context.add(cyl(0.95, 0.12, grey, { pos: [DW.x, DW.y + 1.55, DW.z + z], rot: [Math.PI / 2, 0, 0], seg: 40 }));
  context.add(box(1.4, 1.2, 3.6, dark, { pos: [DW.x - 1.6, DW.y + 1.5, DW.z] }));
  context.add(beam([DW.x + 1.3, DW.y + 0.9, DW.z + 1.9], [DW.x + 2.2, DW.y + 2.2, DW.z + 1.9], 0.03, grey)); // palanca de freno
  for (const [z, primary] of [[1.6, true], [-1.6, false]]) {
    const d = buildDrum({ diameter: 1.4, width: 0.32, withContext: true, variantId: 'campana-stcv' });
    d.rotation.x = z > 0 ? -Math.PI / 2 : Math.PI / 2; // eje del tambor = Z
    addInst('campana', d, { primary, pos: [DW.x, DW.y + 1.55, DW.z + z], anchor: [DW.x, DW.y + 2.4, DW.z + z] });
  }

  // ---------- BOP bajo el piso, anillos BX, línea de flujo ----------
  context.add(cyl(0.5, 1.1, dark, { pos: [0, 0.55, 0], seg: 32 }));
  context.add(flange(0.85, 0.28, dark, { bolts: 12, boltR: 0.045 }).translateY(1.2));
  const bx1 = buildBX({ size: 13.625, withFlanges: true, variantId: 'bx-serie' });
  addInst('anillo-bx', bx1, { primary: true, scale: 1.35, pos: [0, 1.75, 0], anchor: [0.7, 1.75, 0.7] });
  context.add(cyl(0.55, 0.9, dark, { pos: [0, 2.65, 0], seg: 32 }));                          // carretel
  context.add(box(2.6, 1.7, 1.5, M.painted('#4b5560'), { pos: [0, 4.0, 0] }));                  // preventor doble de esclusas
  for (const s of [-1, 1]) { context.add(cyl(0.45, 0.6, dark, { pos: [s * 1.6, 4.0, 0], rot: [0, 0, Math.PI / 2], seg: 24 })); context.add(cyl(0.12, 0.7, M.machined(), { pos: [s * 2.2, 4.0, 0], rot: [0, 0, Math.PI / 2], seg: 12 })); }
  context.add(flange(0.9, 0.25, dark, { bolts: 16, boltR: 0.04 }).translateY(4.95));
  const bx2 = buildBX({ size: 13.625, withFlanges: false, variantId: 'bx-serie' }); addInst('anillo-bx', bx2, { scale: 1.35, pos: [0, 5.1, 0] });
  context.add(lathe([[0.55, 0], [1.0, 0], [1.0, 0.7], [0.75, 1.5], [0.55, 1.5], [0.55, 0]], M.painted('#4b5560'), { pos: [0, 5.2, 0], seg: 36 })); // anular
  context.add(cyl(0.42, 0.9, dark, { pos: [0, 7.05, 0], seg: 24 }));                            // bell nipple
  context.add(pipeRun([[0.45, 6.4, 0], [1.6, 6.2, 0], [1.6, 5.6, -3], [-6.5, 4.6, -12.2]], 0.16, dark));   // línea de flujo a zarandas
  // Línea de estrangulación desde el BOP al manifold (uniones FIG 1502 y codos integrales).
  context.add(pipeRun([[1.2, 3.1, 0.75], [4.2, 3.1, 0.75], [9.6, 3.1, 0.75], [9.6, 3.1, -3.2], [9.6, 1.3, -3.2], [9.6, 1.3, -6.2]], 0.07, dark));
  addInst('union', buildUnion({ fig: 1502, size: 3, nut: COLORS.blue, body: COLORS.red, variantId: 'union-fig1502' }), { scale: 2.2, pos: [4.2, 3.1, 0.75], rot: [0, 0, -Math.PI / 2] });
  const elbowChoke = buildElbow({ fig: 1502, size: 2, nut: COLORS.blue, body: COLORS.red, variantId: 'codo-fig1502' });
  addInst('codo', elbowChoke, { primary: true, scale: 2.2, pos: [9.35, 3.1, 0.75], rot: [-Math.PI / 2, 0, Math.PI], anchor: [9.6, 3.6, 0.75] });
  // Manifold de estrangulación (válvulas de contexto + VTB Vitalmet).
  context.add(box(4.2, 0.3, 2.4, dark, { pos: [9.6, 0.15, -8] }));
  context.add(pipeRun([[7.8, 1.3, -6.2], [11.4, 1.3, -6.2]], 0.09, dark)); context.add(pipeRun([[7.8, 1.3, -9.8], [11.4, 1.3, -9.8]], 0.09, dark));
  for (const x of [8.4, 10.8]) { context.add(pipeRun([[x, 1.3, -6.2], [x, 1.3, -9.8]], 0.08, dark)); for (const z of [-7.1, -8.9]) { context.add(box(0.5, 0.6, 0.4, dark, { pos: [x, 1.3, z] })); context.add(cyl(0.06, 0.7, grey, { pos: [x, 1.8, z], seg: 8 })); context.add(torus(0.28, 0.03, grey, { pos: [x, 2.15, z], rot: [Math.PI / 2, 0, 0], tSeg: 6, seg: 20 })); } }
  context.add(box(0.6, 0.6, 0.6, M.painted('#4b5560'), { pos: [9.6, 1.3, -8] })); context.add(cyl(0.08, 0.6, grey, { pos: [9.6, 1.85, -8], seg: 8 }));
  addInst('valvula', buildPlugValve({ size: 2, integral: true, handle: 'wheel', body: COLORS.red, nut: COLORS.blue, variantId: 'vtb-integral' }), { scale: 2.0, pos: [9.6, 1.3, -4.9], rot: [0, Math.PI / 2, 0] });
  // Acumulador.
  context.add(box(4.2, 2.0, 1.7, M.painted('#8e989c'), { pos: [14.5, 1.0, -3] }));
  for (let i = 0; i < 8; i++) context.add(cyl(0.2, 1.5, M.painted('#c8242a'), { pos: [12.7 + i * 0.5, 2.75, -3], seg: 16 }));

  // ---------- Bombas de lodo, línea de descarga y standpipe ----------
  const pumps = [];
  for (const z of [-3.2, -8.6]) { const p = buildTriplexPump(); p.position.set(-14.8, 0, z); context.add(p); pumps.push(p); }
  // Línea de descarga de la bomba 1 hacia el manifold de standpipe.
  const PZ = -3.2, PY = 3.25;
  context.add(pipeRun([[-15.05, PY + 0.55, PZ], [-15.05, PY + 1.3, PZ], [-13.6, PY + 1.3, PZ]], 0.075, dark));
  const sw = buildSwivel({ size: 2, swivels: 3, body: COLORS.vitalmet, variantId: 'codo-giratorio-2' });
  addInst('codo-giratorio', sw, { primary: true, scale: 2.2, pos: [-13.6, PY + 1.3, PZ], rot: [0, 0, -Math.PI / 2], anchor: [-12.9, PY + 2.2, PZ] });
  const pj = buildPupJoint({ size: 3, len: 2.6, nut: COLORS.blue, body: COLORS.red, variantId: 'pup-joint-std' });
  addInst('pup-joint', pj, { primary: true, scale: 1.8, pos: [-10.2, PY + 1.3, PZ], rot: [0, 0, -Math.PI / 2], anchor: [-10.2, PY + 1.9, PZ] });
  context.add(pipeRun([[-7.9, PY + 1.3, PZ], [-7.9, PY + 1.3, 0.2], [-2.7, PY + 1.3, 2.4]], 0.075, dark));
  addInst('union', buildUnion({ fig: 602, size: 4, nut: '#1d1d1d', body: COLORS.red, variantId: 'union-fig602' }), { primary: true, scale: 2.2, pos: [-7.9, PY + 1.3, -1.6], rot: [Math.PI / 2, 0, 0], anchor: [-7.9, PY + 2.0, -1.6] });
  // Manifold de standpipe con válvulas VTB y manómetro.
  addInst('valvula', buildPlugValve({ size: 2, integral: true, handle: 'wheel', body: COLORS.red, nut: COLORS.blue, variantId: 'vtb-integral' }), { primary: true, scale: 2.0, pos: [-5.6, PY + 1.3, 1.1], rot: [0, -Math.atan2(2.2, 5.2), 0], anchor: [-5.6, PY + 2.3, 1.1] });
  context.add(cyl(0.16, 0.05, M.white(), { pos: [-4.2, PY + 2.1, 1.6], rot: [Math.PI / 2, 0, 0], seg: 20 })); context.add(beam([-4.2, PY + 1.3, 1.6], [-4.2, PY + 2.1, 1.6], 0.025, grey));
  const elbowSP = buildElbow({ fig: 602, size: 2, nut: '#1d1d1d', body: COLORS.red, variantId: 'codo-fig602' });
  addInst('codo', elbowSP, { scale: 2.2, pos: [-2.7, PY + 1.3, 2.4], rot: [0, Math.PI, 0] });
  const SPX = -2.7, SPZ = 2.4;
  context.add(pipeRun([[SPX, PY + 2.4, SPZ], [SPX, MB + 1.5, SPZ], [SPX, MB + 2.2, SPZ - 0.8]], 0.065, dark));   // standpipe
  for (let y = FL + 2; y < MB; y += 4) context.add(box(0.25, 0.1, 0.5, grey, { pos: [SPX + 0.15, y, SPZ - 0.25] }));
  context.add(hose([[SPX, MB + 2.2, SPZ - 0.8], [SPX - 0.4, MB + 0.5, SPZ + 1.2], [-1.2, TB - 2.0, 2.4], [0, TB - 2.4, 1.4]], 0.09));   // manguera rotaria
  // Repuestos de bomba (vástagos y grampas visibles entre crossheads y fluid end de la bomba 1).
  const spares = new THREE.Group();
  for (const z of [-0.8, 0, 0.8]) {
    const rod = buildPumpPart('pistonRod', { variantId: 'bombas-vastagos' }); rod.rotation.z = -Math.PI / 2; rod.position.set(-0.55, 0.05, z); spares.add(rod);
    const clamp = buildPumpPart('rodClamp', { variantId: 'bombas-grampa-vastagos' }); clamp.rotation.z = -Math.PI / 2; clamp.position.set(-0.28, 0, z); spares.add(clamp);
  }
  spares.traverse((o) => { if (o.isMesh) o.userData.vitalmet = true; });
  addInst('bombas', spares, { primary: true, scale: 1.25, pos: [-14.8 - 0.55, 1.55, PZ], anchor: [-15.5, 2.9, PZ] });
  // Succión desde tanques y tanques de lodo con zarandas y agitadores.
  for (const p of pumps) context.add(pipeRun([[p.position.x - 0.25, 0.5, p.position.z + 1.3], [p.position.x - 0.25, 0.5, -11.5], [p.position.x - 0.25, 1.2, -11.5]], 0.16, dark));
  for (const x of [-20.5, -12, -3.5]) { const t = tank(8, 3, 3.4, grey, 5); t.position.set(x, 0, -13.6); context.add(t); context.add(box(0.4, 0.4, 0.4, dark, { pos: [x - 2.5, 3.4, -13.6] })); context.add(cyl(0.3, 0.9, dark, { pos: [x + 2.5, 3.45, -13.6], seg: 16 })); }
  context.add(railing([[-24.5, -15.4], [0.6, -15.4], [0.6, -11.8], [-24.5, -11.8], [-24.5, -15.4]], 3.0, 1.0));
  context.add(box(3.2, 1.4, 2.2, M.painted('#5e6a70'), { pos: [-5.5, 3.9, -13.2] }));           // zaranda
  context.add(box(2.8, 0.08, 1.8, grey, { pos: [-5.5, 4.55, -13.2], rot: [0, 0, 0.12] }));
  context.add(box(2.4, 0.5, 0.9, M.painted('#5e6a70'), { pos: [-9.5, 3.55, -13.2] }));
  // Casa de fuerza, VFD y chimeneas.
  context.add(box(3.6, 3.3, 12, M.painted('#9aa4a8'), { pos: [-27, 1.65, 6] }));
  context.add(box(3.6, 0.2, 12, dark, { pos: [-27, 3.4, 6] }));
  for (const z of [2, 6, 10]) context.add(cyl(0.28, 2.0, dark, { pos: [-27.8, 4.4, z], seg: 16 }));
  context.add(box(3, 3.2, 6, M.painted('#9aa4a8'), { pos: [-21.5, 1.6, 8] }));
  for (const [x, z] of [[-24, 3], [-24, 9], [-23, 5]]) context.add(box(0.5, 0.2, 5, dark, { pos: [x, 0.3, z] }));
  // Tanques de agua y combustible.
  for (const z of [7.5, 11]) { context.add(cyl(1.2, 6, M.painted('#aeb6b8'), { pos: [14, 1.55, z], rot: [0, 0, Math.PI / 2], seg: 32 })); for (const x of [12, 16]) context.add(box(0.5, 0.6, 2.2, dark, { pos: [x, 0.3, z] })); }
  // Iluminación de mástil (mástiles de luz de contexto).
  for (const [x, z] of [[17, -14], [-30, -18], [18, 22]]) { context.add(cyl(0.1, 9, grey, { pos: [x, 4.5, z], seg: 8 })); context.add(box(1.4, 0.4, 0.5, dark, { pos: [x, 9, z] })); }

  setShadows(context);
  instances.forEach((i) => setShadows(i.obj));
  return {
    id: 'rig', group, context, instances, environment: 'desert',
    camera: { pos: V(74, 40, 82), target: V(-5, 14, -4) },
    views: { hoisting: { pos: V(10, 12, 12), target: V(-3, 9.5, 0) }, circulating: { pos: V(-8, 8, 8), target: V(-11, 3.5, -2) }, wellcontrol: { pos: V(9, 5, 7), target: V(3, 3, -2) } },
  };
}
