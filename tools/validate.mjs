#!/usr/bin/env node
// Validación de datos: ids únicos, páginas 1–21, fotos existentes, pares ES/EN completos, kinds válidos, i18n completa.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { families, mudPumpParts, partNames } = await import(path.join(root, 'data/catalog.js'));
const { systems, sources } = await import(path.join(root, 'data/systems.js'));
const { dictionary } = await import(path.join(root, 'src/i18n.js'));
const errors = [], warnings = [];
const isLoc = (o) => o && typeof o === 'object' && typeof o.es === 'string' && typeof o.en === 'string' && o.es && o.en;
const ids = new Set();
let variants = 0, photos = 0, specs = 0;
for (const f of families) {
  if (ids.has(f.id)) errors.push(`familia duplicada ${f.id}`); ids.add(f.id);
  for (const k of ['name', 'short', 'desc', 'role']) if (!isLoc(f[k])) errors.push(`${f.id}.${k} sin ES/EN`);
  if (!(f.page >= 1 && f.page <= 21)) errors.push(`${f.id}.page fuera de rango`);
  for (const p of f.photos || []) { photos++; if (!existsSync(path.join(root, p.src))) errors.push(`${f.id}: foto inexistente ${p.src}`); if (!isLoc(p.caption)) errors.push(`${f.id}: leyenda sin ES/EN ${p.src}`); }
  for (const v of f.variants) {
    variants++;
    if (ids.has(v.id)) errors.push(`variante duplicada ${v.id}`); ids.add(v.id);
    if (!isLoc(v.name)) errors.push(`${v.id}.name sin ES/EN`);
    if (!(v.page >= 1 && v.page <= 21)) errors.push(`${v.id}.page fuera de rango`);
    for (const s of v.specs || []) { specs++; if (!isLoc(s.k) || !isLoc(s.v)) errors.push(`${v.id}: spec sin ES/EN (${s.k?.es})`); if (!['published', 'inferred', 'pending'].includes(s.kind)) errors.push(`${v.id}: kind inválido en ${s.k?.es}`); if (s.kind === 'published' && !(s.page >= 1 && s.page <= 21)) errors.push(`${v.id}: spec publicada sin página (${s.k?.es})`); }
    for (const p of v.photos || []) { photos++; if (!existsSync(path.join(root, p.src))) errors.push(`${v.id}: foto inexistente ${p.src}`); if (!isLoc(p.caption)) errors.push(`${v.id}: leyenda sin ES/EN ${p.src}`); }
    if (!v.photos?.length && !f.photos?.length) warnings.push(`${v.id}: sin fotos`);
    if (v.explode) for (const k of v.explode.parts) if (!partNames[k]) warnings.push(`${v.id}: pieza de despiece sin nombre: ${k}`);
    if (v.model && !existsSync(path.join(root, v.model.src))) errors.push(`${v.id}: modelo inexistente ${v.model.src}`);
    if (v.matrix) { for (const r of v.matrix.rows) if (r.length !== v.matrix.series.length + 1) errors.push(`${v.id}: fila de matriz inconsistente ${r[0]}`); }
  }
}
for (const p of mudPumpParts) { if (!isLoc(p.name)) errors.push(`mudPumpParts.${p.key} sin ES/EN`); if (p.variant && !ids.has(p.variant)) errors.push(`mudPumpParts.${p.key}: variante inexistente ${p.variant}`); }
for (const s of systems) { for (const k of ['name', 'summary', 'vitalmet']) if (!isLoc(s[k])) errors.push(`sistema ${s.id}.${k} sin ES/EN`); if (!(Array.isArray(s.components?.es) && Array.isArray(s.components?.en))) errors.push(`sistema ${s.id}.components`); for (const f of s.families) if (!ids.has(f)) errors.push(`sistema ${s.id}: familia inexistente ${f}`); for (const src of s.sources) if (!sources[src]) errors.push(`sistema ${s.id}: fuente inexistente ${src}`); }
const esKeys = Object.keys(dictionary.es), enKeys = new Set(Object.keys(dictionary.en));
for (const k of esKeys) if (!enKeys.has(k)) errors.push(`i18n: falta EN para ${k}`);
for (const k of enKeys) if (!(k in dictionary.es)) errors.push(`i18n: falta ES para ${k}`);
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) if (!(m[1] in dictionary.es)) errors.push(`index.html: clave i18n desconocida ${m[1]}`);
for (let i = 1; i <= 21; i++) if (!existsSync(path.join(root, `assets/paginas/pagina-${String(i).padStart(2, '0')}.webp`))) errors.push(`falta página ${i}`);
console.log(`Familias: ${families.length} · Variantes: ${variants} · Datos: ${specs} · Fotos referenciadas: ${photos} · Sistemas: ${systems.length} · Claves i18n: ${esKeys.length}`);
warnings.forEach((w) => console.log('AVISO ' + w));
errors.forEach((e) => console.log('ERROR ' + e));
console.log(errors.length ? `FALLÓ con ${errors.length} errores` : 'OK sin errores');
process.exit(errors.length ? 1 : 0);
