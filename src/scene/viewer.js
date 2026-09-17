// Visor Three.js: renderer, cámara, controles, iluminación, entorno, suelo, transiciones y proyección de etiquetas.
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { Q, mesh } from './builders.js';
import { M, concreteTexture } from './materials.js';
import { createTerrain } from './environment.js';

export const QUALITY = {
  high: { dpr: 2, shadow: 2048, seg: 28, shadows: true, aa: true },
  medium: { dpr: 1.5, shadow: 1024, seg: 20, shadows: true, aa: true },
  low: { dpr: 1, shadow: 512, seg: 12, shadows: false, aa: false },
};
export function detectQuality() {
  const ua = navigator.userAgent || '';
  const mobile = /Android|iPhone|iPad|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (mobile && (cores <= 4 || mem <= 3)) return 'low';
  if (mobile || cores <= 4) return 'medium';
  return 'high';
}
export function applyQuality(name) {
  const q = QUALITY[name] || QUALITY.medium;
  Q.seg = q.seg; Q.shadows = q.shadows;
  return q;
}

// Entorno procedural (sin HDRI externo): una "sala" con paneles luminosos → PMREM.
function buildEnvironment(renderer) {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshBasicMaterial({ color: '#9aa2a6', side: THREE.BackSide }));
  scene.add(room);
  const panel = (w, h, pos, rot, color = '#ffffff', intensity = 6) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
    m.material.color.multiplyScalar(intensity); m.position.set(...pos); m.rotation.set(...rot); scene.add(m);
  };
  panel(8, 4, [0, 5.9, 0], [Math.PI / 2, 0, 0], '#ffffff', 5);
  panel(6, 4, [-9.9, 2, 0], [0, Math.PI / 2, 0], '#dfe9ff', 3);
  panel(6, 4, [9.9, 2, 0], [0, -Math.PI / 2, 0], '#fff0dc', 3);
  panel(10, 3, [0, 1, -9.9], [0, 0, 0], '#e9f0f5', 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: '#5f6668' })); floor.rotation.x = -Math.PI / 2; floor.position.y = -5.9; scene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  return env;
}

export function createViewer(host, { quality = 'high', onContextLost } = {}) {
  const q = applyQuality(quality);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#d8dcd8', 60, 220);
  const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(1, host.clientHeight), 0.05, 600);
  camera.position.set(40, 25, 50);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: q.aa, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
  } catch (e) { throw new Error('WebGL no disponible: ' + e.message); }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.dpr));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = q.shadows; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onContextLost?.(); });

  scene.environment = buildEnvironment(renderer);
  const hemi = new THREE.HemisphereLight('#eef3ff', '#6d6a5f', 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e2', 2.4); sun.position.set(30, 60, 20); sun.castShadow = q.shadows;
  sun.shadow.mapSize.set(q.shadow, q.shadow); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 60, bottom: -30, near: 5, far: 200 });
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight('#cfe0f0', 0.6); fill.position.set(-40, 20, -30); scene.add(fill);

  // Suelo.
  const ground = mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: concreteTexture(), color: '#cfd0ca', roughness: 0.95, metalness: 0 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = q.shadows; scene.add(ground);
  // Entorno de locación (arena, cielo, arbustos) construido bajo demanda.
  let terrain = null; let environment = 'plain';
  const FOG_PLAIN = '#d8dcd8';
  function setEnvironment(kind) {
    environment = kind;
    if (kind === 'desert') {
      if (!terrain) { terrain = createTerrain(); scene.add(terrain); }
      terrain.visible = true; ground.visible = false;
      scene.fog.color.set(terrain.userData.fogColor); scene.fog.near = 120; scene.fog.far = 420;
      hemi.color.set('#dfe9ff'); hemi.groundColor.set('#a08a5c');
      host.classList.add('desert');
    } else {
      if (terrain) terrain.visible = false;
      ground.visible = true; scene.fog.color.set(FOG_PLAIN); scene.fog.near = 60; scene.fog.far = 220;
      hemi.color.set('#eef3ff'); hemi.groundColor.set('#6d6a5f');
      host.classList.remove('desert');
    }
  }
  function rebuildTerrain() { if (terrain) { scene.remove(terrain); terrain = null; } if (environment === 'desert') setEnvironment('desert'); }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.02; controls.minDistance = 0.3; controls.maxDistance = 220;
  controls.target.set(0, 8, 0);

  const root = new THREE.Group(); scene.add(root);

  // Transiciones de cámara.
  let transition = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function moveTo(position, target, { immediate = false, duration = 900 } = {}) {
    if (immediate || reduced) { camera.position.copy(position); controls.target.copy(target); transition = null; return; }
    transition = { from: camera.position.clone(), to: position.clone(), start: controls.target.clone(), target: target.clone(), t0: performance.now(), duration };
  }
  controls.addEventListener('start', () => { transition = null; });
  // Encuadre de un objeto/caja: dirección de vista opcional.
  function frame(target, { radius, dir = new THREE.Vector3(1, 0.55, 1.1), padding = 1.25, immediate = false } = {}) {
    let center, r = radius;
    if (target.isVector3) center = target.clone();
    else { const b = target.isBox3 ? target : new THREE.Box3().setFromObject(target); center = b.getCenter(new THREE.Vector3()); r ??= b.getSize(new THREE.Vector3()).length() / 2; }
    r = Math.max(0.2, r || 1);
    const dist = (r * padding) / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2);
    const pos = center.clone().add(dir.clone().normalize().multiplyScalar(dist));
    if (pos.y < 0.4) pos.y = 0.4;
    moveTo(pos, center, { immediate });
  }

  const frameCallbacks = new Set();
  let running = true, rafId = 0;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (!running) return;
    if (transition) {
      const t = Math.min(1, (now - transition.t0) / transition.duration), e = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(transition.from, transition.to, e);
      controls.target.lerpVectors(transition.start, transition.target, e);
      if (t >= 1) transition = null;
    }
    controls.update();
    sun.target.position.copy(controls.target); sun.position.copy(controls.target).add(new THREE.Vector3(30, 60, 20));
    renderer.render(scene, camera);
    frameCallbacks.forEach((fn) => fn(now));
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  }
  new ResizeObserver(resize).observe(host);

  const _v = new THREE.Vector3();
  function project(worldPos) {
    _v.copy(worldPos).project(camera);
    const w = host.clientWidth, h = host.clientHeight;
    return { x: (_v.x * 0.5 + 0.5) * w, y: (-_v.y * 0.5 + 0.5) * h, depth: _v.z, visible: _v.z > -1 && _v.z < 1 };
  }
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function pick(clientX, clientY, objects) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(objects, true)[0] || null;
  }
  function dispose() {
    cancelAnimationFrame(rafId);
    renderer.dispose();
    renderer.domElement.remove();
  }
  rafId = requestAnimationFrame(loop);
  return { scene, camera, renderer, controls, root, sun, setEnvironment, rebuildTerrain, moveTo, frame, project, pick, resize, dispose, onFrame: (fn) => { frameCallbacks.add(fn); return () => frameCallbacks.delete(fn); }, get transitioning() { return !!transition; } };
}
