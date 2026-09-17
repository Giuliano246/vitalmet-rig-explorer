// Panel de contenido local: edita textos, fichas y fotos en ESTE navegador; exporta/importa JSON validado.
// No es un CMS compartido ni tiene autenticación (ver PENDIENTES.md).
import { L, t, getLang, languages } from '../i18n.js';
import { getFamilies, getSystems, setField, exportContent, importContent, resetContent, countOverrides, defaultFamily, defaultVariant, defaultSystem, storageAvailable } from '../store.js';

const KIND_RE = /^(published|inferred|pending)$/;

export function createAdminPanel({ dialog, body, toast, onChange }) {
  let editLang = getLang();
  let sel = { kind: 'family', id: null };

  function specsToText(specs) { return (specs || []).map((s) => `${s.k?.[editLang] ?? ''} = ${s.v?.[editLang] ?? ''} | p.${s.page ?? ''} | ${s.kind || 'published'}`).join('\n'); }
  function textToSpecs(text, base) {
    const out = []; const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, i) => {
      const [kv, pageRaw, kindRaw] = line.split('|').map((s) => s.trim());
      const eq = kv.indexOf('='); if (eq < 0) throw new Error(`Línea ${i + 1}: falta "="`);
      const k = kv.slice(0, eq).trim(), v = kv.slice(eq + 1).trim();
      const prev = base?.[i] || {};
      const other = languages.filter((l) => l !== editLang);
      const kObj = { ...(prev.k || {}), [editLang]: k }, vObj = { ...(prev.v || {}), [editLang]: v };
      for (const l of other) { kObj[l] ??= k; vObj[l] ??= v; }
      const page = pageRaw ? parseInt(pageRaw.replace(/[^0-9]/g, ''), 10) : prev.page;
      const kind = kindRaw && KIND_RE.test(kindRaw) ? kindRaw : (prev.kind || 'published');
      out.push({ k: kObj, v: vObj, page: Number.isFinite(page) ? page : prev.page, kind });
    });
    return out;
  }
  function photosToText(ph) { return (ph || []).map((p) => `${p.src} | ${p.caption?.[editLang] ?? ''}`).join('\n'); }
  function textToPhotos(text, base) {
    return text.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) => {
      const [src, cap] = line.split('|').map((s) => s.trim());
      if (!/^assets\//.test(src) || src.includes('..')) throw new Error(`Foto ${i + 1}: la ruta debe empezar con assets/`);
      const prev = base?.find((p) => p.src === src) || {};
      const caption = { ...(prev.caption || {}), [editLang]: cap || '' }; for (const l of languages) caption[l] ??= cap || '';
      return { src, caption, origin: prev.origin || 'web', page: prev.page };
    });
  }
  function locField(label, value, multi = false) {
    const lab = document.createElement('label'); lab.className = 'admin-field';
    const s = document.createElement('span'); s.textContent = label; lab.append(s);
    const inp = document.createElement(multi ? 'textarea' : 'input'); if (multi) inp.rows = 3; inp.value = value ?? ''; lab.append(inp);
    return { lab, inp };
  }
  function current() {
    if (sel.kind === 'family') return getFamilies().find((f) => f.id === sel.id);
    if (sel.kind === 'variant') { for (const f of getFamilies()) { const v = f.variants.find((x) => x.id === sel.id); if (v) return v; } }
    if (sel.kind === 'system') return getSystems().find((s) => s.id === sel.id);
    return null;
  }
  function render() {
    body.replaceChildren();
    const intro = document.createElement('p'); intro.className = 'muted'; intro.textContent = t('admin.intro') + (storageAvailable ? '' : ' ⚠ localStorage no disponible en este navegador.'); body.append(intro);
    const meta = document.createElement('p'); meta.className = 'muted'; meta.textContent = t('admin.overrides', { n: countOverrides() }); body.append(meta);
    const bar = document.createElement('div'); bar.className = 'admin-bar';
    const langSel = document.createElement('label'); langSel.innerHTML = '<span></span>'; langSel.querySelector('span').textContent = t('admin.lang');
    const ls = document.createElement('select'); languages.forEach((l) => { const o = document.createElement('option'); o.value = l; o.textContent = l.toUpperCase(); ls.append(o); }); ls.value = editLang; ls.onchange = () => { editLang = ls.value; render(); }; langSel.append(ls); bar.append(langSel);
    const pick = document.createElement('select'); pick.className = 'admin-pick';
    const og1 = document.createElement('optgroup'); og1.label = t('admin.family');
    for (const f of getFamilies()) { const o = document.createElement('option'); o.value = `family:${f.id}`; o.textContent = `${String(f.order).padStart(2, '0')} ${L(f.name)}`; og1.append(o); }
    const og2 = document.createElement('optgroup'); og2.label = t('admin.variant');
    for (const f of getFamilies()) for (const v of f.variants) { const o = document.createElement('option'); o.value = `variant:${v.id}`; o.textContent = `${L(f.short)} › ${L(v.name)}`; og2.append(o); }
    const og3 = document.createElement('optgroup'); og3.label = t('systems.title');
    for (const s of getSystems()) { const o = document.createElement('option'); o.value = `system:${s.id}`; o.textContent = L(s.name); og3.append(o); }
    pick.append(og1, og2, og3);
    if (!sel.id) sel = { kind: 'family', id: getFamilies()[0].id };
    pick.value = `${sel.kind}:${sel.id}`; pick.onchange = () => { const [k, id] = pick.value.split(':'); sel = { kind: k, id }; render(); }; bar.append(pick);
    body.append(bar);
    const item = current(); if (!item) return;
    const form = document.createElement('form'); form.className = 'admin-form';
    const fields = [];
    const addLoc = (field, label, multi) => { const { lab, inp } = locField(label, item[field]?.[editLang], multi); form.append(lab); fields.push({ field, inp, kind: 'loc' }); };
    if (sel.kind === 'family') { addLoc('name', t('admin.field.name')); addLoc('short', t('admin.field.name') + ' (corto)'); addLoc('desc', t('admin.field.desc'), true); addLoc('role', t('admin.field.role'), true); const { lab, inp } = locField(t('admin.field.photos'), photosToText(item.photos), true); form.append(lab); fields.push({ field: 'photos', inp, kind: 'photos' }); }
    if (sel.kind === 'variant') { addLoc('name', t('admin.field.name')); const s = locField(t('admin.field.specs'), specsToText(item.specs), true); s.inp.rows = 10; form.append(s.lab); fields.push({ field: 'specs', inp: s.inp, kind: 'specs' }); const z = locField(t('admin.field.sizes'), (item.sizes || []).join(', ')); form.append(z.lab); fields.push({ field: 'sizes', inp: z.inp, kind: 'sizes' }); const p = locField(t('admin.field.photos'), photosToText(item.photos), true); form.append(p.lab); fields.push({ field: 'photos', inp: p.inp, kind: 'photos' }); }
    if (sel.kind === 'system') { addLoc('name', t('admin.field.name')); addLoc('summary', t('admin.field.desc'), true); addLoc('vitalmet', t('systems.vitalmet'), true); const c = locField(t('systems.components') + ' (una por línea)', (item.components?.[editLang] || []).join('\n'), true); form.append(c.lab); fields.push({ field: 'components', inp: c.inp, kind: 'components' }); }
    const save = document.createElement('button'); save.type = 'submit'; save.className = 'primary'; save.textContent = t('admin.save'); form.append(save);
    const err = document.createElement('p'); err.className = 'error'; err.hidden = true; form.append(err);
    form.onsubmit = (e) => {
      e.preventDefault(); err.hidden = true;
      try {
        for (const f of fields) {
          const orig = item[f.field];
          let value;
          if (f.kind === 'loc') { value = { ...(orig || {}), [editLang]: f.inp.value.trim() }; for (const l of languages) value[l] ??= f.inp.value.trim(); }
          else if (f.kind === 'specs') value = textToSpecs(f.inp.value, orig);
          else if (f.kind === 'photos') value = textToPhotos(f.inp.value, orig);
          else if (f.kind === 'sizes') value = f.inp.value.split(',').map((s) => s.trim()).filter(Boolean);
          else if (f.kind === 'components') { value = { ...(orig || {}), [editLang]: f.inp.value.split('\n').map((s) => s.trim()).filter(Boolean) }; for (const l of languages) value[l] ??= value[editLang]; }
          setField(sel.kind, sel.id, f.field, value);
        }
        toast(t('admin.saved')); onChange?.(); render();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    };
    body.append(form);
    const io = document.createElement('div'); io.className = 'admin-io';
    const exp = document.createElement('button'); exp.type = 'button'; exp.className = 'secondary'; exp.textContent = t('admin.export');
    exp.onclick = () => { const blob = new Blob([JSON.stringify(exportContent(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vitalmet-rig-explorer-contenido-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
    const impLab = document.createElement('label'); impLab.className = 'secondary file'; impLab.textContent = t('admin.import');
    const impInp = document.createElement('input'); impInp.type = 'file'; impInp.accept = 'application/json,.json'; impInp.hidden = true;
    impInp.onchange = async () => { const f = impInp.files?.[0]; if (!f) return; try { const json = JSON.parse(await f.text()); const r = importContent(json); if (!r.ok) throw new Error(r.errors.slice(0, 5).join('; ')); toast(t('admin.imported', { n: r.count })); onChange?.(); render(); } catch (ex) { toast(t('admin.invalid', { error: ex.message })); } impInp.value = ''; };
    impLab.append(impInp);
    const rst = document.createElement('button'); rst.type = 'button'; rst.className = 'secondary danger'; rst.textContent = t('admin.reset');
    rst.onclick = () => { if (confirm(t('admin.resetConfirm'))) { resetContent(); toast(t('admin.saved')); onChange?.(); render(); } };
    io.append(exp, impLab, rst); body.append(io);
    const docs = document.createElement('p'); docs.className = 'muted'; docs.textContent = t('admin.docs'); body.append(docs);
  }
  return { open(kind, id) { if (kind && id) sel = { kind, id }; editLang = getLang(); render(); dialog.showModal(); }, render };
}
