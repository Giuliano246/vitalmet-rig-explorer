// Almacenamiento local: contenido editable (panel), lista de cotización y ajustes.
// Todo vive en localStorage de ESTE navegador. No es una base compartida ni un backend.
import { families as defaultFamilies, partNames, contact } from '../data/catalog.js';
import { systems as defaultSystems } from '../data/systems.js';

const KEYS = { content: 'vitalmet.rig.content.v1', quote: 'vitalmet.rig.quote.v1', settings: 'vitalmet.rig.settings.v1' };
const APP_ID = 'vitalmet-rig-explorer';
const CONTENT_VERSION = 1;

function read(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------- Contenido (catálogo + sistemas) con parche local ----------
// patch = { families: { [id]: { name, short, desc, role, photos } }, variants: { [id]: { name, specs, photos, sizes } }, systems: { [id]: {...} } }
let patch = read(KEYS.content, null)?.patch ?? { families: {}, variants: {}, systems: {} };
const listeners = new Set();

const EDITABLE = {
  family: ['name', 'short', 'desc', 'role', 'photos'],
  variant: ['name', 'specs', 'photos', 'sizes'],
  system: ['name', 'summary', 'components', 'vitalmet'],
};

function merged() {
  const fams = clone(defaultFamilies).map((f) => {
    const pf = patch.families?.[f.id] || {};
    for (const k of EDITABLE.family) if (pf[k] !== undefined) f[k] = pf[k];
    f.variants = f.variants.map((v) => {
      const pv = patch.variants?.[v.id] || {};
      for (const k of EDITABLE.variant) if (pv[k] !== undefined) v[k] = pv[k];
      v.familyId = f.id;
      return v;
    });
    return f;
  });
  const sys = clone(defaultSystems).map((s) => {
    const ps = patch.systems?.[s.id] || {};
    for (const k of EDITABLE.system) if (ps[k] !== undefined) s[k] = ps[k];
    return s;
  });
  return { families: fams, systems: sys };
}
let cache = merged();

export const getFamilies = () => cache.families;
export const getSystems = () => cache.systems;
export const getFamily = (id) => cache.families.find((f) => f.id === id);
export const getVariant = (id) => { for (const f of cache.families) { const v = f.variants.find((x) => x.id === id); if (v) return v; } return null; };
export const getPartNames = () => partNames;
export const getContact = () => contact;
export const defaultFamily = (id) => defaultFamilies.find((f) => f.id === id);
export const defaultVariant = (id) => { for (const f of defaultFamilies) { const v = f.variants.find((x) => x.id === id); if (v) return v; } return null; };
export const defaultSystem = (id) => defaultSystems.find((s) => s.id === id);

export function countOverrides() {
  let n = 0;
  for (const group of Object.values(patch)) for (const obj of Object.values(group || {})) n += Object.keys(obj).length;
  return n;
}
export const onContentChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
function commit() {
  cache = merged();
  write(KEYS.content, { app: APP_ID, version: CONTENT_VERSION, savedAt: new Date().toISOString(), patch });
  listeners.forEach((fn) => fn());
}

export function setField(kind, id, field, value) {
  const group = kind === 'family' ? 'families' : kind === 'variant' ? 'variants' : 'systems';
  if (!EDITABLE[kind].includes(field)) throw new Error(`Campo no editable: ${field}`);
  patch[group] ??= {};
  patch[group][id] ??= {};
  const original = (kind === 'family' ? defaultFamily(id) : kind === 'variant' ? defaultVariant(id) : defaultSystem(id))?.[field];
  if (JSON.stringify(original) === JSON.stringify(value)) delete patch[group][id][field];
  else patch[group][id][field] = value;
  if (!Object.keys(patch[group][id]).length) delete patch[group][id];
  commit();
}
export function resetContent() { patch = { families: {}, variants: {}, systems: {} }; commit(); }

export function exportContent() {
  return { app: APP_ID, version: CONTENT_VERSION, exportedAt: new Date().toISOString(), patch: clone(patch) };
}

// Validación del JSON importado: estructura, ids existentes, campos editables, tipos.
export function validateContent(json) {
  const errors = [];
  if (!json || typeof json !== 'object') return ['No es un objeto JSON'];
  if (json.app !== APP_ID) errors.push(`app debe ser "${APP_ID}"`);
  if (json.version !== CONTENT_VERSION) errors.push(`version debe ser ${CONTENT_VERSION}`);
  const p = json.patch;
  if (!p || typeof p !== 'object') return [...errors, 'Falta "patch"'];
  const isLoc = (v) => v && typeof v === 'object' && (typeof v.es === 'string' || typeof v.en === 'string');
  const check = (group, kind, exists) => {
    for (const [id, fields] of Object.entries(p[group] || {})) {
      if (!exists(id)) { errors.push(`${group}: id desconocido "${id}"`); continue; }
      if (!fields || typeof fields !== 'object') { errors.push(`${group}.${id}: debe ser objeto`); continue; }
      for (const [k, v] of Object.entries(fields)) {
        if (!EDITABLE[kind].includes(k)) { errors.push(`${group}.${id}.${k}: campo no editable`); continue; }
        if (['name', 'short', 'desc', 'role', 'summary', 'vitalmet'].includes(k) && !isLoc(v)) errors.push(`${group}.${id}.${k}: debe ser {es, en}`);
        if (k === 'components' && !(v && Array.isArray(v.es) && Array.isArray(v.en))) errors.push(`${group}.${id}.${k}: debe ser {es:[], en:[]}`);
        if (k === 'sizes' && !Array.isArray(v)) errors.push(`${group}.${id}.sizes: debe ser lista`);
        if (k === 'specs') {
          if (!Array.isArray(v)) errors.push(`${group}.${id}.specs: debe ser lista`);
          else v.forEach((s, i) => { if (!isLoc(s?.k) || !isLoc(s?.v)) errors.push(`${group}.${id}.specs[${i}]: k y v deben ser {es, en}`); if (s?.kind && !['published', 'inferred', 'pending'].includes(s.kind)) errors.push(`${group}.${id}.specs[${i}].kind inválido`); });
        }
        if (k === 'photos') {
          if (!Array.isArray(v)) errors.push(`${group}.${id}.photos: debe ser lista`);
          else v.forEach((ph, i) => { if (typeof ph?.src !== 'string' || !/^assets\//.test(ph.src) || /\.\./.test(ph.src)) errors.push(`${group}.${id}.photos[${i}].src debe ser una ruta dentro de assets/`); });
        }
      }
    }
  };
  check('families', 'family', (id) => !!defaultFamily(id));
  check('variants', 'variant', (id) => !!defaultVariant(id));
  check('systems', 'system', (id) => !!defaultSystem(id));
  return errors;
}
export function importContent(json) {
  const errors = validateContent(json);
  if (errors.length) return { ok: false, errors };
  patch = { families: json.patch.families || {}, variants: json.patch.variants || {}, systems: json.patch.systems || {} };
  commit();
  return { ok: true, count: countOverrides() };
}

// ---------- Lista de cotización ----------
let quote = read(KEYS.quote, { items: [], contact: { name: '', company: '', email: '', phone: '', country: '', notes: '' } });
const quoteListeners = new Set();
export const getQuote = () => quote;
export const onQuoteChange = (fn) => { quoteListeners.add(fn); return () => quoteListeners.delete(fn); };
function saveQuote() { write(KEYS.quote, quote); quoteListeners.forEach((fn) => fn(quote)); }
export function addQuoteItem({ variantId, size, qty, note }) {
  const v = getVariant(variantId); if (!v) return;
  const key = `${variantId}|${size || ''}`;
  const existing = quote.items.find((i) => `${i.variantId}|${i.size || ''}` === key);
  if (existing) existing.qty = Math.max(1, (existing.qty || 1) + (qty || 1));
  else quote.items.push({ variantId, familyId: v.familyId, size: size || '', qty: Math.max(1, qty || 1), note: note || '' });
  saveQuote();
}
export function updateQuoteItem(index, data) { if (quote.items[index]) { Object.assign(quote.items[index], data); saveQuote(); } }
export function removeQuoteItem(index) { quote.items.splice(index, 1); saveQuote(); }
export function clearQuote() { quote.items = []; saveQuote(); }
export function setQuoteContact(data) { Object.assign(quote.contact, data); saveQuote(); }

// ---------- Ajustes ----------
let settings = read(KEYS.settings, {});
export const getSetting = (k, fallback) => (settings[k] === undefined ? fallback : settings[k]);
export function setSetting(k, v) { settings[k] = v; write(KEYS.settings, settings); }

export const storageAvailable = (() => { try { const k = '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch { return false; } })();
