// Escena "Bomba de lodo": bomba triplex de contexto con el despiece ESQUEMÁTICO de una cámara del fluid end.
// Las piezas en naranja figuran en el catálogo Vitalmet (p. 20). No es un plano ni un manual de montaje.
import * as THREE from 'three';
import { setShadows } from '../builders.js';
import { buildFluidEnd } from '../parts.js';
import { buildTriplexPump } from './rig.js';
import { mudPumpParts } from '../../../data/catalog.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildMudPumpScene() {
  const group = new THREE.Group(); const context = new THREE.Group(); group.add(context);
  const pump = buildTriplexPump(); context.add(pump);
  const variantIds = Object.fromEntries(mudPumpParts.filter((p) => p.variant).map((p) => [p.key, p.variant]));
  const fe = buildFluidEnd({ variantIds });
  fe.scale.setScalar(1.0); fe.position.set(2.1, 1.45, 0.8);
  group.add(fe);
  const instances = [{ familyId: 'bombas', variantId: null, obj: fe, primary: true, anchor: V(2.1, 2.9, 0.8), explodable: true }];
  setShadows(context); setShadows(fe);
  return { id: 'mudpump', group, context, instances, camera: { pos: V(6.2, 3.6, 5.4), target: V(1.2, 1.5, 0.5) }, explodeNote: 'explode.mudpump' };
}
