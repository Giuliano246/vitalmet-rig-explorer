// Visor Three.js: renderer, cámara, controles, iluminación, entorno PMREM, postprocesado (GTAO), suelo/terreno,
// transiciones y proyección de etiquetas.
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Q, mesh } from './builders.js';
import { concreteTexture } from './materials.js';
import { createTerrain, createSky, SKY_PRESETS } from './environment.js';

export const QUALITY = {
  high: { dpr: 2, shadow: 4096, seg: 28, shadows: true, aa: true, ao: true, samples: 4 },
  medium: { dpr: 1.5, shadow: 2048, seg: 20, shadows: true, aa: true, ao: true, samples: 2 },
  low: { dpr: 1, shadow: 1024, seg: 12, shadows: false, aa: false, ao: false, samples: 0 },
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

// Entorno de reflejos procedural (sin HDRI externo): cielo + suelo cálido → PMREM.
function buildReflectionEnvironment(renderer) {
  const scene = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color('#6fa3e0').multiplyScalar(1.6) }, mid: { value: new THREE.Color('#c9dcee').multiplyScalar(1.5) }, bottom: { value: new THREE.Color('#b09468').multiplyScalar(0.9) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h < 0.0 ? bottom : (h < 0.25 ? mix(mid, mid, 1.0) : mix(mid, top, smoothstep(0.25, 0.9, h))); if (h < 0.0) c = mix(mid, bottom, smoothstep(0.0, -0.3, h)); gl_FragColor = vec4(c, 1.0); }',
  }));
  scene.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2d6').multiplyScalar(40) }));
  sunDisc.position.set(30, 40, 20); scene.add(sunDisc);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  return env;
}

export function createViewer(host, { quality = 'high', onContextLost } = {}) {
  let q = applyQuality(quality);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#d8dcd8', 60, 220);
  const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(1, host.clientHeight), 0.05, 2500);
  camera.position.set(40, 25, 50);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: q.aa, alpha: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
  } catch (e) { throw new Error('WebGL no disponible: ' + e.message); }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.dpr));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.setClearColor('#d8dcd8', 1);
  renderer.shadowMap.enabled = q.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onContextLost?.(); });

  scene.environment = buildReflectionEnvironment(renderer);
  scene.environmentIntensity = 0.75;
  const hemi = new THREE.HemisphereLight('#dfe9ff', '#a08a5c', 0.55); scene.add(hemi);
  const SUN_DIR = new THREE.Vector3(38, 46, 22);
  const sun = new THREE.DirectionalLight('#fff1d8', 3.0); sun.position.copy(SUN_DIR); sun.castShadow = q.shadows;
  sun.shadow.mapSize.set(q.shadow, q.shadow); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05; sun.shadow.radius = 2;
  Object.assign(sun.shadow.camera, { left: -95, right: 95, top: 110, bottom: -80, near: 5, far: 320 });
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight('#c9dcf0', 0.35); fill.position.set(-40, 20, -30); scene.add(fill);

  // Suelo neutro (escenas de taller) y cielo compartido.
  const ground = mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: concreteTexture(), color: '#cfd0ca', roughness: 0.95, metalness: 0 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = q.shadows; scene.add(ground);
  const sky = createSky(); scene.add(sky);
  let terrain = null; let environment = 'plain';
  function setEnvironment(kind) {
    environment = kind;
    const preset = kind === 'desert' ? SKY_PRESETS.desert : SKY_PRESETS.plain;
    sky.material.uniforms.top.value.set(preset.top); sky.material.uniforms.mid.value.set(preset.mid); sky.material.uniforms.bottom.value.set(preset.bottom);
    sky.userData.sun.visible = kind === 'desert';
    if (kind === 'desert') {
      if (!terrain) { terrain = createTerrain(); scene.add(terrain); }
      terrain.visible = true; ground.visible = false;
      scene.fog.color.set(preset.fog); scene.fog.near = 160; scene.fog.far = 1100;
      hemi.color.set('#dfe9ff'); hemi.groundColor.set('#a08a5c'); hemi.intensity = 0.55;
      renderer.setClearColor(preset.fog, 1);
    } else {
      if (terrain) terrain.visible = false;
      ground.visible = true; scene.fog.color.set(preset.fog); scene.fog.near = 60; scene.fog.far = 260;
      hemi.color.set('#eef3ff'); hemi.groundColor.set('#6d6a5f'); hemi.intensity = 0.7;
      renderer.setClearColor(preset.fog, 1);
    }
  }
  function rebuildTerrain() { if (terrain) { scene.remove(terrain); terrain = null; } if (environment === 'desert') setEnvironment('desert'); }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.05; controls.minDistance = 0.3; controls.maxDistance = 260;
  controls.target.set(0, 8, 0);
  const root = new THREE.Group(); scene.add(root);

  // ---------- Postprocesado ----------
  let composer = null, gtao = null;
  function buildComposer() {
    if (composer) { composer.dispose?.(); composer = null; gtao = null; }
    if (!q.ao) return;
    const w = host.clientWidth, h = host.clientHeight;
    const target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: q.samples });
    composer = new EffectComposer(renderer, target);
    composer.setPixelRatio(Math.min(devicePixelRatio || 1, q.dpr)); composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    gtao = new GTAOPass(scene, camera, w, h);
    gtao.output = GTAOPass.OUTPUT.Default;
    gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.2, scale: 1.1, samples: 12, distanceFallOff: 1.0, screenSpaceRadius: false });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 8 });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
    composer.addPass(new OutputPass());
  }
  buildComposer();

  // ---------- Transiciones de cámara ----------
  let transition = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function moveTo(position, target, { immediate = false, duration = 900 } = {}) {
    if (immediate || reduced) { camera.position.copy(position); controls.target.copy(target); transition = null; return; }
    transition = { from: camera.position.clone(), to: position.clone(), start: controls.target.clone(), target: target.clone(), t0: performance.now(), duration };
  }
  controls.addEventListener('start', () => { transition = null; });
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
    sun.target.position.copy(controls.target); sun.position.copy(controls.target).add(SUN_DIR);
    sky.position.copy(camera.position);
    if (composer) composer.render(); else renderer.render(scene, camera);
    frameCallbacks.forEach((fn) => fn(now));
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    if (composer) { composer.setSize(w, h); gtao?.setSize(w, h); }
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
  function setQualityLive(name) {
    q = applyQuality(name);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.dpr));
    renderer.shadowMap.enabled = q.shadows; sun.castShadow = q.shadows;
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    sun.shadow.mapSize.set(q.shadow, q.shadow);
    buildComposer();
  }
  function dispose() { cancelAnimationFrame(rafId); renderer.dispose(); renderer.domElement.remove(); }
  rafId = requestAnimationFrame(loop);
  return { scene, camera, renderer, controls, root, sun, setEnvironment, rebuildTerrain, setQualityLive, moveTo, frame, project, pick, resize, dispose, onFrame: (fn) => { frameCallbacks.add(fn); return () => frameCallbacks.delete(fn); }, get transitioning() { return !!transition; } };
}
