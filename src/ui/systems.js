// Panel de sistemas del equipo: explicación, componentes, aporte Vitalmet y fuentes.
import { L, t } from '../i18n.js';
import { sources } from '../../data/systems.js';

export function createSystemsPanel({ host, getSystems, getFamilies, onFamily, onView, currentSceneId }) {
  function render() {
    host.replaceChildren();
    const h = document.createElement('h3'); h.textContent = t('systems.title'); host.append(h);
    const p = document.createElement('p'); p.className = 'muted'; p.textContent = t('systems.intro'); host.append(p);
    const sceneId = currentSceneId();
    for (const s of getSystems()) {
      const det = document.createElement('details'); det.className = 'system' + (s.scene === sceneId ? '' : ' other');
      const sum = document.createElement('summary'); sum.textContent = L(s.name); det.append(sum);
      const b = document.createElement('div'); b.className = 'system-body';
      const sm = document.createElement('p'); sm.textContent = L(s.summary); b.append(sm);
      const c = document.createElement('div'); c.innerHTML = `<span class="detail-label"></span><ul></ul>`; c.querySelector('.detail-label').textContent = t('systems.components');
      L(s.components).forEach((x) => { const li = document.createElement('li'); li.textContent = x; c.querySelector('ul').append(li); }); b.append(c);
      const v = document.createElement('div'); v.innerHTML = `<span class="detail-label"></span><p></p>`; v.querySelector('.detail-label').textContent = t('systems.vitalmet'); v.querySelector('p').textContent = L(s.vitalmet); b.append(v);
      if (s.families?.length) { const chips = document.createElement('div'); chips.className = 'chips'; for (const fid of s.families) { const f = getFamilies().find((x) => x.id === fid); if (!f) continue; const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'chip link'; btn.textContent = L(f.short); btn.onclick = () => onFamily(fid); chips.append(btn); } b.append(chips); }
      if (s.scene === sceneId && onView) { const vb = document.createElement('button'); vb.type = 'button'; vb.className = 'link'; vb.textContent = '⊕ ' + t('tools.focus'); vb.onclick = () => onView(s.id); if (['hoisting', 'circulating', 'wellcontrol'].includes(s.id)) b.append(vb); }
      const src = document.createElement('div'); src.className = 'sources'; src.innerHTML = `<span class="detail-label"></span><ul></ul>`; src.querySelector('.detail-label').textContent = t('systems.sources');
      for (const k of s.sources || []) { const r = sources[k]; if (!r) continue; const li = document.createElement('li'); if (r.url) { const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.label; li.append(a); } else li.textContent = r.label; src.querySelector('ul').append(li); }
      b.append(src); det.append(b); host.append(det);
    }
  }
  return { render };
}
