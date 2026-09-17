// Orquestador 3D: escenas, selección, resalte, aislamiento, despiece, encuadre, marcadores y picking.
import * as THREE from 'three';
import { createViewer, applyQuality, QUALITY } from './viewer.js';
import { M } from './materials.js';
import { setExplode } from './parts.js';
import { buildRigScene } from './scenes/rig.js';
import { buildHPLineScene } from './scenes/hpline.js';
import { buildMudPumpScene } from './scenes/mudpump.js';
import { buildStudioScene } from './scenes/studio.js';

const BUILDERS = { rig: buildRigScene, hpline: buildHPLineScene, mudpump: buildMudPumpScene };
const _pos = new THREE.Vector3();

export function createExplorer({ host, labelHost, quality = 'high', onSelect, onHover, getFamilies, getVariant, labelText, familyLabel }) {
  const viewer = createViewer(host, { quality, onContextLost: () => host.dispatchEvent(new CustomEvent('contextlost')) });
  const state = { sceneId: null, familyId: null, variantId: null, highlight: true, isolate: false, explode: 0, labels: true, quality };
  const cache = {};
  let current = null;
  let studioVariantId = null;

  function ensureBase(obj) { obj.traverse((o) => { if (o.isMesh && !o.userData.baseMat) o.userData.baseMat = o.material; }); }
  function getScene(id) {
    if (id === 'studio') {
      const v = getVariant(state.variantId) || getFamilies()[0].variants[0];
      if (!cache.studio || studioVariantId !== v.id) { cache.studio = buildStudioScene(v); studioVariantId = v.id; }
      return cache.studio;
    }
    if (!cache[id]) cache[id] = BUILDERS[id]();
    return cache[id];
  }
  function showScene(id, { keepCamera = false } = {}) {
    if (current) viewer.root.remove(current.group);
    current = getScene(id); state.sceneId = id;
    viewer.root.add(current.group);
    viewer.setEnvironment(current.environment || 'plain');
    current.instances.forEach((i) => ensureBase(i.obj)); ensureBase(current.context);
    state.explode = 0; applyExplode();
    applyMaterials();
    rebuildMarkers();
    if (!keepCamera) resetCamera();
    if (current.ready) { const sc = current; sc.ready.then(() => { if (current !== sc) return; sc.instances.forEach((i) => ensureBase(i.obj)); applyMaterials(); rebuildMarkers(); resetCamera(); }); }
  }
  function resetCamera(immediate = false) {
    if (!current) return;
    viewer.moveTo(current.camera.pos, current.camera.target, { immediate });
  }
  function selectedInstances() { return current ? current.instances.filter((i) => i.familyId === state.familyId) : []; }
  function primaryInstance() { const list = selectedInstances(); return list.find((i) => i.primary) || list[0] || null; }

  function applyMaterials() {
    if (!current) return;
    const ctxGhost = state.isolate;
    current.context.traverse((o) => { if (o.isMesh) o.material = ctxGhost ? M.ghost() : o.userData.baseMat; });
    for (const inst of current.instances) {
      const selected = inst.familyId === state.familyId;
      inst.obj.visible = !state.isolate || selected;
      inst.obj.traverse((o) => {
        if (!o.isMesh) return;
        const isVital = o.userData.vitalmet !== false;
        if (!isVital) { o.material = ctxGhost && !selected ? M.ghost() : o.userData.baseMat; return; }
        if (selected) o.material = state.highlight ? M.vitalmetSel() : o.userData.baseMat;
        else o.material = state.highlight ? M.vitalmet() : o.userData.baseMat;
      });
    }
  }
  function applyExplode() {
    if (!current) return;
    for (const inst of current.instances) if (inst.obj.userData.parts) setExplode(inst.obj, inst.familyId === state.familyId || current.studio ? state.explode : 0);
  }

  // ---------- Marcadores y etiquetas (HTML) ----------
  let markers = [];
  function rebuildMarkers() {
    labelHost.replaceChildren(); markers = [];
    if (!current) return;
    if (!current.studio) {
      const seen = new Set();
      current.instances.filter((i) => i.primary).forEach((inst) => {
        if (seen.has(inst.familyId)) return; seen.add(inst.familyId);
        const fam = getFamilies().find((f) => f.id === inst.familyId); if (!fam) return;
        const b = document.createElement('button'); b.className = 'marker'; b.type = 'button';
        b.dataset.family = inst.familyId; b.textContent = String(fam.order).padStart(2, '0');
        b.title = familyLabel(fam); b.setAttribute('aria-label', familyLabel(fam));
        b.onclick = () => select(inst.familyId, inst.variantId, { fromScene: true });
        labelHost.append(b); markers.push({ el: b, inst, kind: 'family' });
      });
    }
    // Etiquetas de piezas (despiece) para la instancia seleccionada / estudio.
    const inst = current.studio ? current.instances[0] : primaryInstance();
    if (inst?.obj.userData.parts) {
      const seen = new Set();
      for (const p of inst.obj.userData.parts) {
        if (seen.has(p.key)) continue; seen.add(p.key);
        const el = document.createElement('span'); el.className = 'part-label' + (p.vitalmet ? '' : ' context');
        el.textContent = labelText(p.key, inst); el.hidden = true;
        labelHost.append(el); markers.push({ el, inst, part: p, kind: 'part' });
      }
    }
  }
  viewer.onFrame((now) => {
    current?.animate?.(now);
    const w = host.clientWidth, h = host.clientHeight;
    for (const m of markers) {
      if (m.kind === 'family') {
        if (!m.inst.obj.visible) { m.el.hidden = true; continue; }
        const pr = viewer.project(m.inst.anchor);
        m.el.hidden = !pr.visible || pr.x < 10 || pr.x > w - 10 || pr.y < 70 || pr.y > h - 120;
        m.el.style.transform = `translate(${pr.x}px, ${pr.y}px)`;
        m.el.classList.toggle('active', m.inst.familyId === state.familyId);
      } else {
        const show = state.labels && (state.explode > 0.04 || current.studio) && m.inst.obj.visible;
        if (!show) { m.el.hidden = true; continue; }
        m.part.obj.getWorldPosition(_pos);
        const pr = viewer.project(_pos);
        m.el.hidden = !pr.visible || pr.x < 0 || pr.x > w || pr.y < 60 || pr.y > h - 80;
        m.el.style.transform = `translate(${pr.x}px, ${pr.y}px)`;
      }
    }
  });

  // ---------- Selección ----------
  function select(familyId, variantId = null, { switchScene = true, fromScene = false } = {}) {
    const fam = getFamilies().find((f) => f.id === familyId); if (!fam) return;
    if (variantId && !fam.variants.some((v) => v.id === variantId)) variantId = null;
    const prevVariant = state.variantId;
    state.familyId = familyId; state.variantId = variantId || fam.variants[0].id;
    if (current?.studio) {
      if (state.variantId !== prevVariant) showScene('studio');
    } else if (switchScene && current && !current.instances.some((i) => i.familyId === familyId)) {
      showScene(fam.scenes?.[0] || 'rig');
    }
    applyMaterials(); applyExplode();
    if (!current?.studio) rebuildMarkers();
    if (state.isolate) focus();
    onSelect?.({ familyId: state.familyId, variantId: state.variantId, fromScene });
  }
  function focus() {
    const inst = current?.studio ? current.instances[0] : primaryInstance();
    if (!inst) { resetCamera(); return; }
    const b = new THREE.Box3().setFromObject(inst.obj);
    const size = b.getSize(new THREE.Vector3()).length() / 2;
    const dir = current.studio ? new THREE.Vector3(1, 0.7, 1.2) : new THREE.Vector3(1, 0.6, 1.1);
    viewer.frame(b, { radius: Math.max(0.35, size), dir, padding: current.studio ? 1.35 : 1.6 });
  }
  function reset() { state.isolate = false; state.explode = 0; applyMaterials(); applyExplode(); resetCamera(); }
  function setHighlight(b) { state.highlight = b; applyMaterials(); }
  function setIsolate(b) { state.isolate = b; applyMaterials(); if (b) focus(); else resetCamera(); }
  function setExplodeAmount(t) { state.explode = Math.max(0, Math.min(1, t)); applyExplode(); }
  function setLabels(b) { state.labels = b; }
  function canExplode() { const inst = current?.studio ? current.instances[0] : primaryInstance(); return !!(inst?.obj.userData.parts && inst.obj.userData.parts.length > 1); }

  // ---------- Picking / hover ----------
  let down = null;
  const el = viewer.renderer.domElement;
  el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  el.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    if (!current) return;
    const hit = viewer.pick(e.clientX, e.clientY, current.instances.filter((i) => i.obj.visible).map((i) => i.obj));
    if (!hit) return;
    let o = hit.object, inst = null;
    while (o && !inst) { inst = current.instances.find((i) => i.obj === o); o = o.parent; }
    if (!inst) return;
    const variantId = hit.object.userData.variantId || inst.variantId || null;
    select(inst.familyId, variantId, { fromScene: true, switchScene: false });
  });
  let hoverTimer = 0;
  el.addEventListener('pointermove', (e) => {
    if (hoverTimer) return;
    hoverTimer = setTimeout(() => {
      hoverTimer = 0; if (!current) return;
      const hit = viewer.pick(e.clientX, e.clientY, current.instances.filter((i) => i.obj.visible).map((i) => i.obj));
      el.style.cursor = hit ? 'pointer' : '';
      onHover?.(hit ? { partKey: hit.object.userData.partKey, variantId: hit.object.userData.variantId, vitalmet: hit.object.userData.vitalmet !== false } : null);
    }, 60);
  });

  function setQuality(name) {
    if (!QUALITY[name]) return;
    state.quality = name; viewer.setQualityLive(name);
    for (const k of Object.keys(cache)) delete cache[k];
    viewer.rebuildTerrain();
    const id = state.sceneId; if (id) showScene(id, { keepCamera: true });
  }
  function familiesInScene() { return current ? [...new Set(current.instances.map((i) => i.familyId))] : []; }
  function currentSceneMeta() { return current ? { id: current.id, studio: !!current.studio, explodeNote: current.explodeNote } : null; }
  function views() { return current?.views || null; }
  function goToView(name) { const v = current?.views?.[name]; if (v) viewer.moveTo(v.pos, v.target); }

  return { viewer, state, showScene, select, focus, reset, familiesInScene, setHighlight, setIsolate, setExplode: setExplodeAmount, setLabels, canExplode, setQuality, currentSceneMeta, views, goToView, rebuildMarkers, resetCamera };
}
