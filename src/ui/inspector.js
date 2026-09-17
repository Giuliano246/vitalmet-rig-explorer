// Ficha del producto: variante, datos con procedencia, medidas, matriz BX, fotos, página del catálogo, cotización.
import { L, t } from '../i18n.js';
import { catalogSource } from '../../data/catalog.js';

const $ = (id) => document.getElementById(id);

export function createInspector({ getFamilies, getFamily, getVariant, onVariantChange, onLocate, onStudio, onAddQuote, onOpenPhoto }) {
  let family = null, variant = null, photoIndex = 0;

  function photosOf() { const list = [...(variant?.photos || [])]; if (!list.length && family?.photos) list.push(...family.photos); return list; }
  function renderPhotos() {
    const photos = photosOf(); photoIndex = Math.min(photoIndex, Math.max(0, photos.length - 1));
    const img = $('product-image'); const cur = photos[photoIndex];
    if (cur) { img.src = cur.src; img.alt = L(cur.caption); $('photo-caption').textContent = L(cur.caption); }
    else { img.removeAttribute('src'); img.alt = ''; $('photo-caption').textContent = t('kind.pending'); }
    const th = $('photo-thumbs'); th.replaceChildren();
    if (photos.length > 1) photos.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'thumb' + (i === photoIndex ? ' active' : ''); b.setAttribute('aria-label', L(p.caption)); const im = new Image(); im.src = p.src; im.alt = ''; im.loading = 'lazy'; b.append(im); b.onclick = () => { photoIndex = i; renderPhotos(); }; th.append(b); });
  }
  function renderSpecs() {
    const dl = $('specifications'); dl.replaceChildren();
    for (const s of variant.specs || []) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = L(s.k);
      const badge = document.createElement('span'); badge.className = 'kind ' + (s.kind || 'published'); badge.textContent = (s.kind === 'published' || !s.kind) ? `p. ${s.page ?? variant.page}` : t('kind.' + s.kind); badge.title = t('kind.' + (s.kind || 'published'));
      dt.append(badge);
      dd.textContent = L(s.v); dl.append(dt, dd);
    }
    const sizes = $('sizes'); sizes.replaceChildren();
    if (variant.sizes?.length) { const lab = document.createElement('span'); lab.className = 'detail-label'; lab.textContent = t('inspector.sizes'); sizes.append(lab); const wrap = document.createElement('div'); wrap.className = 'chips'; variant.sizes.forEach((s) => { const c = document.createElement('span'); c.className = 'chip'; c.textContent = s; wrap.append(c); }); sizes.append(wrap); }
    const mx = $('matrix'); mx.hidden = !variant.matrix; mx.replaceChildren();
    if (variant.matrix) {
      const lab = document.createElement('div'); lab.className = 'detail-label'; lab.textContent = t('inspector.matrix'); mx.append(lab);
      const wrap = document.createElement('div'); wrap.className = 'table-wrap';
      const tb = document.createElement('table');
      tb.innerHTML = `<thead><tr><th>Ø</th>${variant.matrix.series.map((s) => `<th>${s}</th>`).join('')}</tr></thead>`;
      const body = document.createElement('tbody');
      for (const row of variant.matrix.rows) { const tr = document.createElement('tr'); tr.innerHTML = `<th>${row[0]}</th>${row.slice(1).map((c) => `<td class="${c ? 'ok' : 'na'}">${c || '—'}</td>`).join('')}`; body.append(tr); }
      tb.append(body); wrap.append(tb); mx.append(wrap);
    }
    const page = variant.page || family.page;
    $('catalog-source').href = `${catalogSource.file}#page=${page}`; $('catalog-source').textContent = t('inspector.catalog', { page }) + ' ↗';
    $('source-preview').href = $('catalog-source').href; $('source-image').src = catalogSource.pageImage(page); $('source-image').alt = t('ui.page', { n: page });
    const sel = $('quote-size'); sel.replaceChildren();
    const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = t('inspector.sizeAny'); sel.append(opt0);
    (variant.sizes || []).forEach((s) => { const o = document.createElement('option'); o.value = s; o.textContent = s; sel.append(o); });
    if (variant.sizes?.length === 1) sel.value = variant.sizes[0];
  }
  function render() {
    if (!family || !variant) return;
    const fams = getFamilies();
    $('part-number').textContent = `${String(family.order).padStart(2, '0')} / ${String(fams.length).padStart(2, '0')}`;
    $('product-title').textContent = L(family.name);
    $('description').textContent = L(family.desc);
    $('function').textContent = L(family.role);
    const sel = $('variant'); sel.replaceChildren();
    family.variants.forEach((v) => { const o = document.createElement('option'); o.value = v.id; o.textContent = L(v.name); sel.append(o); });
    sel.value = variant.id;
    renderSpecs(); renderPhotos();
    $('add-feedback').hidden = true;
  }
  $('variant').addEventListener('change', (e) => { onVariantChange(family.id, e.target.value); });
  $('locate').addEventListener('click', () => onLocate(family.id, variant.id));
  $('studio').addEventListener('click', () => onStudio(family.id, variant.id));
  $('photo-open').addEventListener('click', () => { const p = photosOf()[photoIndex]; if (p) onOpenPhoto(p.src, L(p.caption)); });
  $('add-quote').addEventListener('submit', (e) => {
    e.preventDefault();
    const qty = Math.max(1, parseInt($('quote-qty').value, 10) || 1);
    onAddQuote({ variantId: variant.id, size: $('quote-size').value, qty });
    const fb = $('add-feedback'); fb.textContent = '✓ ' + t('inspector.added'); fb.hidden = false; setTimeout(() => { fb.hidden = true; }, 2500);
  });
  return {
    show(familyId, variantId) {
      const f = getFamily(familyId); if (!f) return;
      const v = (variantId && f.variants.find((x) => x.id === variantId)) || f.variants[0];
      if (v.id !== variant?.id) photoIndex = 0;
      family = f; variant = v; render();
    },
    refresh() { if (family) { family = getFamily(family.id); variant = family.variants.find((x) => x.id === variant.id) || family.variants[0]; render(); } },
    get current() { return { family, variant }; },
  };
}
