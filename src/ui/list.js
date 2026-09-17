// Listado de familias y variantes con búsqueda.
import { L, t } from '../i18n.js';

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function createList({ host, countEl, noResultsEl, searchEl, getFamilies, onSelect }) {
  let active = { familyId: null, variantId: null };
  let query = '';

  function variantText(v) { return [L(v.name), ...(v.sizes || []), ...(v.specs || []).map((s) => `${L(s.k)} ${L(s.v)}`), v.code || ''].join(' '); }
  function render() {
    host.replaceChildren();
    const fams = getFamilies(); const q = norm(query); let shownFam = 0, shownVar = 0;
    for (const f of fams) {
      const famMatch = !q || norm(L(f.name) + ' ' + L(f.short) + ' ' + L(f.desc)).includes(q);
      const vars = f.variants.filter((v) => !q || famMatch || norm(variantText(v)).includes(q));
      if (!vars.length) continue;
      shownFam++; shownVar += vars.length;
      const det = document.createElement('details'); det.className = 'family'; det.dataset.family = f.id;
      det.open = f.id === active.familyId || !!q;
      const sum = document.createElement('summary');
      sum.innerHTML = `<span class="index">${String(f.order).padStart(2, '0')}</span><span class="name"></span><span class="n">${f.variants.length}</span><span class="arrow">↗</span>`;
      sum.querySelector('.name').textContent = L(f.name);
      sum.addEventListener('click', (e) => { e.preventDefault(); onSelect(f.id, f.id === active.familyId ? active.variantId : null, { fromList: true }); det.open = true; });
      det.append(sum);
      const ul = document.createElement('div'); ul.className = 'variants'; ul.setAttribute('role', 'list');
      for (const v of vars) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'variant'; b.dataset.variant = v.id; b.setAttribute('role', 'listitem');
        b.textContent = L(v.name); b.setAttribute('aria-pressed', String(v.id === active.variantId));
        b.onclick = () => onSelect(f.id, v.id, { fromList: true });
        ul.append(b);
      }
      det.append(ul); host.append(det);
    }
    countEl.textContent = String(shownFam).padStart(2, '0');
    noResultsEl.hidden = shownFam > 0; if (!shownFam) noResultsEl.textContent = t('ui.noResults', { q: query });
    highlight();
  }
  function highlight() {
    host.querySelectorAll('.family').forEach((d) => { const on = d.dataset.family === active.familyId; d.classList.toggle('active', on); if (on && !query) d.open = true; });
    host.querySelectorAll('.variant').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.variant === active.variantId)));
    const el = host.querySelector(`.variant[data-variant="${active.variantId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }
  searchEl.addEventListener('input', () => { query = searchEl.value.trim(); render(); });
  return { render, setActive(familyId, variantId) { active = { familyId, variantId }; highlight(); } };
}
