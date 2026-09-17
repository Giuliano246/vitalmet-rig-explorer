// Punto de entrada: idioma, datos, listado, ficha, escenas 3D (o modo sin WebGL), cotización, panel y offline.
import { initLang, setLang, getLang, onLangChange, applyDom, t, L } from './src/i18n.js';
import { getFamilies, getFamily, getVariant, getSystems, getPartNames, addQuoteItem, onContentChange, getSetting, setSetting } from './src/store.js';
import { vaePartNames, mudPumpParts, catalogSource } from './data/catalog.js';
import { createList } from './src/ui/list.js';
import { createInspector } from './src/ui/inspector.js';
import { createQuotePanel } from './src/ui/quote.js';
import { createAdminPanel } from './src/ui/admin.js';
import { createSystemsPanel } from './src/ui/systems.js';

const $ = (id) => document.getElementById(id);
const toastEl = $('toast'); let toastTimer = 0;
function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600); }

initLang();
let explorer = null; let fallbackMode = false;
const state = { familyId: null, variantId: null };

// ---------- Etiquetas de piezas ----------
function partLabel(key, inst) {
  const names = getPartNames();
  if (inst?.variantId === 'vae' && vaePartNames[key]) return L(vaePartNames[key]);
  const mp = mudPumpParts.find((p) => p.key === key); if (mp) return L(mp.name);
  if (key === 'anilloBX') return L({ es: 'Anillo BX (Vitalmet)', en: 'BX ring (Vitalmet)' });
  if (key === 'brida6BX') return L({ es: 'Brida 6BX (contexto)', en: '6BX flange (context)' });
  const variant = inst?.variantId ? getVariant(inst.variantId) : null;
  if (variant?.geometry?.type === 'pumpPart') return L(variant.name);
  return names[key] ? L(names[key]) : key;
}

// ---------- Listado y ficha ----------
const list = createList({ host: $('products'), countEl: $('count'), noResultsEl: $('no-results'), searchEl: $('search'), getFamilies, onSelect: (f, v) => select(f, v, { fromList: true }) });
const inspector = createInspector({
  getFamilies, getFamily, getVariant,
  onVariantChange: (f, v) => select(f, v),
  onLocate: (f, v) => { if (fallbackMode) return; const fam = getFamily(f); const target = fam.scenes?.includes(explorer.state.sceneId) && explorer.state.sceneId !== 'studio' ? explorer.state.sceneId : (fam.scenes?.[0] || 'rig'); setScene(target); explorer.select(f, v, { switchScene: false }); explorer.focus(); $('canvas').scrollIntoView({ block: 'center', behavior: reduced() ? 'instant' : 'smooth' }); },
  onStudio: (f, v) => { if (fallbackMode) return; select(f, v); setScene('studio'); $('canvas').scrollIntoView({ block: 'center', behavior: reduced() ? 'instant' : 'smooth' }); },
  onAddQuote: (item) => { addQuoteItem(item); quotePanel.render(); },
  onOpenPhoto: (src, caption) => { $('large-photo').src = src; $('large-photo').alt = caption; $('large-title').textContent = caption; $('photo-dialog').showModal(); },
});
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function select(familyId, variantId = null, { fromList = false, fromScene = false } = {}) {
  const fam = getFamily(familyId); if (!fam) return;
  const v = (variantId && fam.variants.find((x) => x.id === variantId)) || fam.variants[0];
  state.familyId = fam.id; state.variantId = v.id;
  list.setActive(fam.id, v.id); inspector.show(fam.id, v.id);
  if (fallbackMode) { $('fallback-page').src = catalogSource.pageImage(v.page || fam.page); $('fallback-page').alt = t('ui.page', { n: v.page || fam.page }); return; }
  if (explorer && !fromScene) explorer.select(fam.id, v.id, { switchScene: fromList });
  updateTools();
}

// ---------- Escenas ----------
function setScene(id) {
  if (fallbackMode || !explorer) return;
  explorer.showScene(id);
  const present = explorer.familiesInScene();
  if (id !== 'studio' && state.familyId && !present.includes(state.familyId) && present.length) { select(present[0], null); }
  else if (state.familyId) explorer.select(state.familyId, state.variantId, { switchScene: false });
  document.querySelectorAll('.scene-tabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scene === id)));
  $('scene-eyebrow').textContent = t('scene.' + id); $('scene-eyebrow').dataset.i18n = 'scene.' + id;
  $('isolate').setAttribute('aria-pressed', 'false'); $('explode').value = 0;
  setSetting('scene', id);
  updateTools(); systemsPanel.render();
}
function updateTools() {
  if (!explorer) return;
  const meta = explorer.currentSceneMeta(); if (!meta) return;
  const can = explorer.canExplode();
  $('explode-wrap').hidden = !can; $('labels-toggle').hidden = !can;
  const note = $('explode-note');
  const v = getVariant(state.variantId);
  if ((can || (v?.model && meta.studio)) && (meta.studio || meta.id === 'mudpump') && (explorer.state.explode > 0.04 || meta.studio)) {
    let text = '';
    if (meta.id === 'mudpump') text = t('explode.mudpump');
    else if (v?.model && meta.studio) text = L(v.model.note);
    else if (v?.geometry?.type === 'drum') text = t('explode.drum');
    else if (v?.explode?.documented) text = t('explode.documented', { page: v.explode.source });
    else text = t('explode.schematic', { page: v?.explode?.source ?? v?.page ?? '' });
    note.textContent = text; note.hidden = false;
  } else note.hidden = true;
  $('view-title').textContent = meta.studio ? L(v?.name) : (explorer.state.isolate ? L(getFamily(state.familyId)?.name) : t('scene.overview'));
}

// ---------- 3D o modo alternativo ----------
function startExplorer() {
  const q = getSetting('quality', null) || detectQualityCached;
  $('quality').value = q;
  if (new URLSearchParams(location.search).get('nowebgl') === '1') { enableFallback(); return; } // prueba del modo alternativo
  try {
    explorer = createExplorerSync(q);
  } catch (err) {
    console.error('No se pudo iniciar WebGL:', err); enableFallback(); return;
  }
  $('loading').remove();
  $('canvas').addEventListener('contextlost', () => { toast(t('fallback.title')); });
  setScene(getSetting('scene', 'rig') === 'studio' ? 'rig' : getSetting('scene', 'rig'));
}
let detectQualityCached = 'high'; let createExplorerSync = null;
function enableFallback() {
  fallbackMode = true; $('loading')?.remove(); $('fallback').hidden = false;
  ['highlight', 'isolate', 'focus', 'labels-toggle', 'reset', 'systems-toggle'].forEach((id) => { $(id).disabled = true; });
  $('explode-wrap').hidden = true; document.querySelector('.quality').hidden = true; document.querySelector('.legend').hidden = true;
  document.querySelectorAll('.scene-tabs button').forEach((b) => { b.disabled = true; });
  $('locate').disabled = true; $('studio').disabled = true;
  if (state.familyId) select(state.familyId, state.variantId);
}

// ---------- Paneles ----------
const quotePanel = createQuotePanel({ dialog: $('quote-dialog'), body: $('quote-body'), countEl: $('quote-count'), toast });
const adminPanel = createAdminPanel({ dialog: $('admin-dialog'), body: $('admin-body'), toast, onChange: () => { list.render(); inspector.refresh(); systemsPanel.render(); explorer?.rebuildMarkers(); quotePanel.render(); } });
const systemsPanel = createSystemsPanel({ host: $('systems-panel'), getSystems, getFamilies, onFamily: (f) => select(f, null, { fromList: true }), onView: (id) => explorer?.goToView(id), currentSceneId: () => explorer?.state.sceneId || 'rig' });
$('quote-open').onclick = () => quotePanel.open();
$('admin-open').onclick = () => adminPanel.open('family', state.familyId);
document.querySelectorAll('dialog [data-close]').forEach((b) => { b.onclick = () => b.closest('dialog').close(); });
document.querySelectorAll('dialog').forEach((d) => { d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); });
$('photo-close').onclick = () => $('photo-dialog').close();
$('systems-toggle').onclick = () => { const p = $('systems-panel'); p.hidden = !p.hidden; $('systems-toggle').setAttribute('aria-pressed', String(!p.hidden)); $('systems-toggle').querySelector('span:last-child').textContent = p.hidden ? t('systems.show') : t('systems.hide'); if (!p.hidden) systemsPanel.render(); };

// ---------- Herramientas 3D ----------
document.querySelectorAll('.scene-tabs button').forEach((b) => { b.onclick = () => setScene(b.dataset.scene); });
$('highlight').onclick = () => { const on = $('highlight').getAttribute('aria-pressed') !== 'true'; $('highlight').setAttribute('aria-pressed', String(on)); explorer?.setHighlight(on); };
$('isolate').onclick = () => { const on = $('isolate').getAttribute('aria-pressed') !== 'true'; $('isolate').setAttribute('aria-pressed', String(on)); explorer?.setIsolate(on); updateTools(); };
$('focus').onclick = () => explorer?.focus();
$('reset').onclick = () => { $('isolate').setAttribute('aria-pressed', 'false'); $('explode').value = 0; explorer?.reset(); updateTools(); };
$('explode').oninput = (e) => { explorer?.setExplode(Number(e.target.value) / 100); updateTools(); };
$('labels-toggle').onclick = () => { const on = $('labels-toggle').getAttribute('aria-pressed') !== 'true'; $('labels-toggle').setAttribute('aria-pressed', String(on)); explorer?.setLabels(on); };
$('quality').onchange = (e) => { setSetting('quality', e.target.value); explorer?.setQuality(e.target.value); };
window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if (k === 'r') $('reset').click(); else if (k === 'f') explorer?.focus(); else if (k === 'e' && !$('explode-wrap').hidden) { $('explode').value = Number($('explode').value) > 50 ? 0 : 100; $('explode').dispatchEvent(new Event('input')); }
  else if (e.key === 'Escape' && explorer?.state.isolate) $('reset').click();
});

// ---------- Idioma ----------
$('lang-toggle').onclick = () => setLang(getLang() === 'es' ? 'en' : 'es');
onLangChange(() => { list.render(); inspector.refresh(); systemsPanel.render(); explorer?.rebuildMarkers(); quotePanel.render(); updateTools(); if (explorer) $('scene-eyebrow').textContent = t('scene.' + explorer.state.sceneId); const st = $('systems-toggle'); st.querySelector('span:last-child').textContent = $('systems-panel').hidden ? t('systems.show') : t('systems.hide'); });
onContentChange(() => { list.render(); inspector.refresh(); });

// ---------- Offline (service worker) ----------
async function registerSW() {
  const el = $('offline-status');
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) { el.textContent = t('offline.unsupported'); return; }
  try {
    el.textContent = t('offline.installing');
    const reg = await navigator.serviceWorker.register('./sw.js');
    const done = () => { el.textContent = '✓ ' + t('offline.ready'); };
    if (reg.active && !reg.installing) done();
    else (reg.installing || reg.waiting)?.addEventListener('statechange', (e) => { if (e.target.state === 'activated') done(); });
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'cached') done(); });
  } catch (err) { el.textContent = t('offline.unsupported'); console.warn('SW', err); }
}

// ---------- Arranque ----------
(async () => {
  list.render();
  const first = getFamilies()[0];
  const startFamily = new URLSearchParams(location.search).get('familia') || 'union';
  try {
    const { createExplorer } = await import('./src/scene/explorer.js');
    const { detectQuality } = await import('./src/scene/viewer.js');
    detectQualityCached = detectQuality();
    createExplorerSync = (q) => createExplorer({ host: $('canvas'), labelHost: $('labels'), quality: q, getFamilies, getVariant, labelText: partLabel, familyLabel: (f) => t('ui.marker', { name: L(f.name) }),
      onSelect: ({ familyId, variantId, fromScene }) => { if (fromScene) select(familyId, variantId, { fromScene: true }); },
      onHover: (h) => { const tip = $('hover-tip'); if (!h || !h.partKey) { tip.hidden = true; return; } tip.textContent = partLabel(h.partKey, { variantId: h.variantId }) + (h.vitalmet ? '' : ' · ' + t('ui.context')); tip.hidden = false; } });
    startExplorer();
  } catch (err) { console.error(err); enableFallback(); }
  select(getFamily(startFamily) ? startFamily : first.id, null, { fromList: true });
  document.addEventListener('pointermove', (e) => { const tip = $('hover-tip'); if (!tip.hidden) { tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px'; } });
  registerSW();
})();
