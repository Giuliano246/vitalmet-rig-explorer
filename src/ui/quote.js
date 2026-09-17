// Lista de solicitud de cotización: ítems, datos de contacto, texto preparado para correo o WhatsApp. Sin envío automático.
import { L, t, getLang } from '../i18n.js';
import { getQuote, updateQuoteItem, removeQuoteItem, clearQuote, setQuoteContact, onQuoteChange, getVariant, getFamily, getContact } from '../store.js';

export function createQuotePanel({ dialog, body, countEl, toast }) {
  function text() {
    const q = getQuote(); const lines = [t('quote.hello'), ''];
    q.items.forEach((it, i) => { const v = getVariant(it.variantId), f = getFamily(it.familyId); if (!v) return; lines.push(`${i + 1}. ${L(f?.name)} — ${L(v.name)}${it.size ? ` — ${it.size}` : ''} — x${it.qty}${it.note ? ` (${it.note})` : ''}${v.page ? ` [cat. p. ${v.page}]` : ''}`); });
    const c = q.contact; lines.push('');
    if (c.name) lines.push(`${t('quote.name')}: ${c.name}`); if (c.company) lines.push(`${t('quote.company')}: ${c.company}`); if (c.email) lines.push(`${t('quote.email')}: ${c.email}`); if (c.phone) lines.push(`${t('quote.phone')}: ${c.phone}`); if (c.country) lines.push(`${t('quote.country')}: ${c.country}`); if (c.notes) lines.push(`${t('quote.notes')}: ${c.notes}`);
    lines.push('', `Vitalmet Rig Explorer · ${new Date().toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'es-AR')}`);
    return lines.join('\n');
  }
  function render() {
    const q = getQuote(); const contact = getContact();
    countEl.textContent = String(q.items.reduce((n, i) => n + i.qty, 0)); countEl.hidden = q.items.length === 0;
    body.replaceChildren();
    const intro = document.createElement('p'); intro.className = 'muted'; intro.textContent = t('quote.note'); body.append(intro);
    const h = document.createElement('h3'); h.textContent = t('quote.items'); body.append(h);
    if (!q.items.length) { const e = document.createElement('p'); e.className = 'empty'; e.textContent = t('quote.empty'); body.append(e); }
    else {
      const tbl = document.createElement('table'); tbl.className = 'quote-table';
      tbl.innerHTML = `<thead><tr><th>#</th><th>${t('inspector.variant')}</th><th>${t('inspector.size')}</th><th>${t('inspector.qty')}</th><th></th></tr></thead>`;
      const tb = document.createElement('tbody');
      q.items.forEach((it, i) => {
        const v = getVariant(it.variantId), f = getFamily(it.familyId); if (!v) return;
        const tr = document.createElement('tr');
        const td = (html) => { const c = document.createElement('td'); c.append(html); return c; };
        tr.append(td(String(i + 1)));
        const name = document.createElement('div'); name.innerHTML = `<strong></strong><br><small></small>`; name.querySelector('strong').textContent = L(v.name); name.querySelector('small').textContent = L(f?.name); tr.append(td(name));
        const sizeSel = document.createElement('select'); const o0 = document.createElement('option'); o0.value = ''; o0.textContent = t('inspector.sizeAny'); sizeSel.append(o0); (v.sizes || []).forEach((s) => { const o = document.createElement('option'); o.value = s; o.textContent = s; sizeSel.append(o); }); sizeSel.value = it.size || ''; sizeSel.onchange = () => updateQuoteItem(i, { size: sizeSel.value }); tr.append(td(sizeSel));
        const qty = document.createElement('input'); qty.type = 'number'; qty.min = '1'; qty.value = it.qty; qty.onchange = () => updateQuoteItem(i, { qty: Math.max(1, parseInt(qty.value, 10) || 1) }); tr.append(td(qty));
        const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'link danger'; rm.textContent = t('quote.remove'); rm.onclick = () => removeQuoteItem(i); tr.append(td(rm));
        tb.append(tr);
      });
      tbl.append(tb); body.append(tbl);
    }
    const h2 = document.createElement('h3'); h2.textContent = t('quote.contact'); body.append(h2);
    const form = document.createElement('div'); form.className = 'contact-form';
    for (const [k, type] of [['name', 'text'], ['company', 'text'], ['email', 'email'], ['phone', 'tel'], ['country', 'text']]) {
      const lab = document.createElement('label'); lab.innerHTML = `<span></span>`; lab.querySelector('span').textContent = t('quote.' + k);
      const inp = document.createElement('input'); inp.type = type; inp.value = q.contact[k] || ''; inp.autocomplete = k === 'name' ? 'name' : k === 'email' ? 'email' : k === 'phone' ? 'tel' : k === 'company' ? 'organization' : 'country-name';
      inp.onchange = () => setQuoteContact({ [k]: inp.value.trim() }); lab.append(inp); form.append(lab);
    }
    const notes = document.createElement('label'); notes.className = 'full'; notes.innerHTML = '<span></span>'; notes.querySelector('span').textContent = t('quote.notes');
    const ta = document.createElement('textarea'); ta.rows = 3; ta.value = q.contact.notes || ''; ta.onchange = () => setQuoteContact({ notes: ta.value.trim() }); notes.append(ta); form.append(notes);
    body.append(form);
    const actions = document.createElement('div'); actions.className = 'quote-actions';
    const mk = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; b.onclick = fn; b.disabled = !q.items.length; actions.append(b); return b; };
    mk(t('quote.send.email'), 'primary', () => { location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Solicitud de cotización — Vitalmet Rig Explorer')}&body=${encodeURIComponent(text())}`; });
    mk(t('quote.send.wa'), 'primary', () => { window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text())}`, '_blank', 'noopener'); });
    mk(t('quote.copy'), 'secondary', async () => { try { await navigator.clipboard.writeText(text()); toast(t('quote.copied')); } catch { const ta2 = document.createElement('textarea'); ta2.value = text(); document.body.append(ta2); ta2.select(); document.execCommand('copy'); ta2.remove(); toast(t('quote.copied')); } });
    mk(t('quote.clear'), 'secondary danger', () => { clearQuote(); });
    body.append(actions);
    const pre = document.createElement('pre'); pre.className = 'quote-preview'; pre.textContent = text(); body.append(pre);
    const foot = document.createElement('p'); foot.className = 'muted'; foot.textContent = `${t('quote.stored')} · ${contact.email} · WhatsApp +${contact.whatsapp}`; body.append(foot);
  }
  onQuoteChange(render);
  return { open() { render(); dialog.showModal(); }, render };
}
