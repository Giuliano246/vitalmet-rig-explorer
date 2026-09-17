#!/usr/bin/env node
// Prueba de validación e importación del panel de contenido (sin navegador): localStorage simulado.
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const store = await import('../src/store.js');
let fails = 0; const ok = (cond, msg) => { console.log((cond ? 'OK   ' : 'FALLA') + ' ' + msg); if (!cond) fails++; };
store.setField('family', 'union', 'desc', { es: 'Descripción editada', en: 'Edited description' });
ok(store.getFamily('union').desc.es === 'Descripción editada', 'setField aplica y se refleja en getFamily');
ok(store.countOverrides() === 1, 'countOverrides = 1');
const exported = store.exportContent();
ok(exported.app === 'vitalmet-rig-explorer' && exported.patch.families.union.desc.en === 'Edited description', 'exportContent contiene el parche');
store.resetContent();
ok(store.countOverrides() === 0 && store.getFamily('union').desc.es !== 'Descripción editada', 'resetContent vuelve a los datos originales');
const r1 = store.importContent(JSON.parse(JSON.stringify(exported)));
ok(r1.ok && r1.count === 1 && store.getFamily('union').desc.es === 'Descripción editada', 'importContent reimporta el JSON exportado sin errores');
const bad = { app: 'vitalmet-rig-explorer', version: 1, patch: { families: { inexistente: { name: { es: 'x', en: 'y' } } }, variants: { 'union-fig100': { specs: [{ k: 'sin-objeto', v: { es: 'a', en: 'b' } }], photos: [{ src: '../fuera.jpg' }] } } } };
const errs = store.validateContent(bad);
ok(errs.some((e) => e.includes('inexistente')) && errs.some((e) => e.includes('specs[0]')) && errs.some((e) => e.includes('photos[0]')), 'validateContent rechaza id inexistente, spec mal formada y ruta fuera de assets/: ' + errs.join(' | '));
ok(store.validateContent({ app: 'otra' }).length > 0, 'validateContent rechaza app distinta');
store.addQuoteItem({ variantId: 'union-fig1502', size: '3"', qty: 4 }); store.addQuoteItem({ variantId: 'union-fig1502', size: '3"', qty: 2 });
ok(store.getQuote().items.length === 1 && store.getQuote().items[0].qty === 6, 'addQuoteItem acumula cantidades del mismo ítem/medida');
console.log(fails ? `FALLÓ (${fails})` : 'TODO OK'); process.exit(fails ? 1 : 0);
