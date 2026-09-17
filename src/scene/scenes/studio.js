// Escena "Pieza en detalle": la variante seleccionada sola, sobre un pedestal, con despiece y etiquetas.
import * as THREE from 'three';
import { M } from '../materials.js';
import { cyl, setShadows, bounds } from '../builders.js';
import { buildVariant } from '../parts.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildStudioScene(variant) {
  const group = new THREE.Group(); const context = new THREE.Group(); group.add(context);
  const obj = buildVariant(variant, { withFlanges: true, withContext: true, gap: true, size: variant.geometry?.type === 'union' ? 3 : undefined, len: 2.4 });
  group.add(obj);
  const ped = cyl(1.65, 0.06, M.painted('#d9dad3'), { pos: [0, 0.03, 0], seg: 64, cast: false }); context.add(ped);
  const instances = [{ familyId: variant.familyId, variantId: variant.id, obj, primary: true, anchor: V(0, 0.8, 0), explodable: false }];
  const scene = { id: 'studio', group, context, instances, camera: { pos: V(2.6, 1.9, 3.1), target: V(0, 0.8, 0) }, studio: true, radius: 1, model: !!variant.model };
  // Normalizar tamaño (radio útil ≈ 1 m) y apoyar sobre el pedestal; se repite cuando termina de cargar un modelo GLB.
  const fit = () => {
    obj.scale.setScalar(1); obj.position.set(0, 0, 0); obj.updateMatrixWorld(true);
    const r = obj.userData.radius || 0.5, k = 1.0 / r; obj.scale.setScalar(k); obj.updateMatrixWorld(true);
    const b = bounds(obj); const c = b.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -b.min.y + 0.06, -c.z); obj.updateMatrixWorld(true);
    setShadows(obj);
    const bb = new THREE.Box3().setFromObject(obj); const anchor = bb.getCenter(new THREE.Vector3()); const radius = bb.getSize(new THREE.Vector3()).length() / 2;
    instances[0].anchor = anchor; instances[0].explodable = !!(obj.userData.parts && obj.userData.parts.length > 1);
    scene.camera = { pos: V(2.6, 1.9, 3.1).multiplyScalar(Math.max(1, radius / 1.2)), target: V(0, anchor.y, 0) }; scene.radius = radius;
  };
  fit();
  if (obj.userData.modelPromise) scene.ready = obj.userData.modelPromise.then(() => { fit(); return scene; }).catch((e) => { console.warn('Modelo GLB no disponible, se usa geometría procedural', e); return scene; });
  return scene;
}
