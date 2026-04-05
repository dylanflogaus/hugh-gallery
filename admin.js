/**
 * Gallery admin — calls Worker /api/* + D1. Login uses ADMIN_API_SECRET (wrangler secret).
 */
(function () {
  const SESSION_KEY = 'hugh_admin_token';

  const $ = (sel, el = document) => el.querySelector(sel);

  function getToken() {
    return sessionStorage.getItem(SESSION_KEY) || '';
  }

  function isAuthed() {
    return !!getToken().trim();
  }

  function setToken(value) {
    sessionStorage.setItem(SESSION_KEY, value);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  function blankFormItem() {
    return HughGallery.normalizeItem({
      id: '',
      title: '',
      meta: '',
      description: '',
      detailDescription: '',
      label: 'Original · 2025',
      price: 0,
      cartTitle: '',
      gradient: 'linear-gradient(145deg, #f7c5c0, #d5c9e8, #bfd9f0)',
      tags: 'original',
      badge: '',
      large: false,
      featured: false,
      sold: false,
      cartColor: '#d5c9e8',
      imageUrl: '',
      imageDimmed: false,
    });
  }

  function uniqueId(base, items) {
    let id = base || 'piece';
    const ids = new Set(items.map((i) => i.id));
    if (!ids.has(id)) return id;
    let n = 2;
    while (ids.has(`${id}-${n}`)) n += 1;
    return `${id}-${n}`;
  }

  function readForm() {
    const items = HughGallery.load();
    const editingId = $('#form-editing-id').value.trim();
    let id = $('#field-id').value.trim() || HughGallery.slugify($('#field-title').value);
    id = uniqueId(id, editingId ? items.filter((i) => i.id !== editingId) : items);

    return HughGallery.normalizeItem({
      id: editingId || id,
      title: $('#field-title').value,
      meta: $('#field-meta').value,
      description: $('#field-desc').value,
      detailDescription: $('#field-detail').value || $('#field-desc').value,
      label: $('#field-label').value,
      price: $('#field-price').value,
      cartTitle: $('#field-cart-title').value || $('#field-title').value,
      gradient: $('#field-gradient').value,
      tags: $('#field-tags').value,
      badge: $('#field-badge').value,
      large: $('#field-large').checked,
      featured: $('#field-featured').checked,
      sold: $('#field-sold').checked,
      cartColor: $('#field-cart-color').value,
      imageUrl: $('#field-image-url').value,
      imageDimmed: $('#field-image-dimmed').checked,
    });
  }

  function fillForm(item) {
    $('#form-editing-id').value = item.id;
    $('#field-id').value = item.id;
    $('#field-id').readOnly = true;
    $('#field-title').value = item.title;
    $('#field-meta').value = item.meta;
    $('#field-desc').value = item.description;
    $('#field-detail').value = item.detailDescription;
    $('#field-label').value = item.label;
    $('#field-price').value = item.price;
    $('#field-cart-title').value = item.cartTitle;
    $('#field-gradient').value = item.gradient;
    $('#field-tags').value = item.tags;
    $('#field-badge').value = item.badge || '';
    $('#field-large').checked = item.large;
    $('#field-featured').checked = item.featured;
    $('#field-sold').checked = item.sold;
    $('#field-cart-color').value = item.cartColor;
    $('#field-image-url').value = item.imageUrl || '';
    $('#field-image-dimmed').checked = item.imageDimmed;
  }

  function clearForm() {
    $('#form-editing-id').value = '';
    const b = blankFormItem();
    $('#field-id').readOnly = false;
    $('#field-id').value = '';
    $('#field-title').value = '';
    $('#field-meta').value = '';
    $('#field-desc').value = '';
    $('#field-detail').value = '';
    $('#field-label').value = b.label;
    $('#field-price').value = '';
    $('#field-cart-title').value = '';
    $('#field-gradient').value = b.gradient;
    $('#field-tags').value = b.tags;
    $('#field-badge').value = '';
    $('#field-large').checked = false;
    $('#field-featured').checked = false;
    $('#field-sold').checked = false;
    $('#field-cart-color').value = b.cartColor;
    $('#field-image-url').value = '';
    $('#field-image-dimmed').checked = false;
    $('#form-title-text').textContent = 'New piece';
  }

  function renderList() {
    const tbody = $('#item-list');
    const items = HughGallery.load();
    if (!items.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="muted">No items in the database yet. Use <strong>Reset to defaults</strong> or add a piece below.</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map((item, index) => {
        const feat = item.featured ? ' ★' : '';
        const bad = item.sold ? '<span class="tag tag-sold">Sold</span>' : '';
        const thumb = item.imageUrl
          ? `<img src="${escapeAttr(item.imageUrl)}" alt="" class="thumb" />`
          : `<div class="thumb-gradient" style="background:${escapeAttr(item.gradient)}"></div>`;
        return `<tr>
          <td>${thumb}</td>
          <td><strong>${escapeHtml(item.title)}</strong>${feat}${bad}<br><code>${escapeHtml(item.id)}</code></td>
          <td>${escapeHtml(HughGallery.formatMoney(item.price))}</td>
          <td class="muted">${escapeHtml(item.tags)}</td>
          <td class="row-actions">
            <button type="button" class="btn-icon" data-move="${index}" data-dir="-1" title="Move up" aria-label="Move up">↑</button>
            <button type="button" class="btn-icon" data-move="${index}" data-dir="1" title="Move down" aria-label="Move down">↓</button>
            <button type="button" class="btn-sm" data-edit="${index}">Edit</button>
            <button type="button" class="btn-sm danger" data-del="${index}">Delete</button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  async function saveAll(items) {
    try {
      await HughGallery.persist(items, getToken());
      await HughGallery.loadAsync();
      renderList();
      showStatus('Saved to D1.');
      return true;
    } catch (err) {
      alert(err.message || String(err));
      return false;
    }
  }

  function bindList() {
    $('#item-list').addEventListener('click', (e) => {
      const move = e.target.closest('[data-move]');
      if (move) {
        const i = parseInt(move.getAttribute('data-move'), 10);
        const dir = parseInt(move.getAttribute('data-dir'), 10);
        const items = HughGallery.load();
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j], items[i]];
        void saveAll(items);
        return;
      }
      const ed = e.target.closest('[data-edit]');
      if (ed) {
        const i = parseInt(ed.getAttribute('data-edit'), 10);
        const item = HughGallery.load()[i];
        fillForm(item);
        $('#form-title-text').textContent = 'Edit piece';
        $('#field-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const del = e.target.closest('[data-del]');
      if (del) {
        const i = parseInt(del.getAttribute('data-del'), 10);
        if (!confirm('Delete this piece from the database?')) return;
        const items = HughGallery.load();
        items.splice(i, 1);
        void saveAll(items);
      }
    });
  }

  function showStatus(msg) {
    const el = $('#status-toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  async function showApp() {
    $('#login-screen').hidden = true;
    $('#admin-app').hidden = false;
    try {
      await HughGallery.loadAsync();
    } catch (e) {
      console.warn(e);
    }
    renderList();
  }

  function showLogin() {
    $('#login-screen').hidden = false;
    $('#admin-app').hidden = true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = $('#login-password').value.trim();
      $('#login-error').hidden = true;
      if (!token) return;
      try {
        const r = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!r.ok) {
          $('#login-error').hidden = false;
          return;
        }
        setToken(token);
        $('#login-password').value = '';
        await showApp();
      } catch {
        $('#login-error').hidden = false;
      }
    });

    $('#btn-logout').addEventListener('click', logout);

    $('#piece-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const next = readForm();
      const items = HughGallery.load();
      const editingId = $('#form-editing-id').value.trim();
      if (editingId) {
        const idx = items.findIndex((x) => x.id === editingId);
        if (idx === -1) return;
        items[idx] = next;
      } else {
        items.push(next);
      }
      if (await saveAll(items)) clearForm();
    });

    $('#btn-cancel-edit').addEventListener('click', () => clearForm());

    $('#btn-export').addEventListener('click', () => {
      const data = JSON.stringify(HughGallery.load(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gallery-items.json';
      a.click();
      URL.revokeObjectURL(a.href);
      showStatus('Download started.');
    });

    $('#btn-import').addEventListener('click', () => $('#import-file').click());

    $('#import-file').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!Array.isArray(parsed)) throw new Error('Not an array');
          const clean = parsed.map((x) => HughGallery.normalizeItem(x));
          if (await saveAll(clean)) {
            clearForm();
            showStatus('Import saved to D1.');
          }
        } catch (err) {
          alert('Invalid JSON: ' + (err.message || err));
        }
      };
      reader.readAsText(file);
    });

    $('#btn-reset').addEventListener('click', async () => {
      if (
        !confirm(
          'Replace all gallery rows in D1 with the built-in default set? This cannot be undone.'
        )
      )
        return;
      const defaults = HughGallery.getDefaultItems().map(HughGallery.normalizeItem);
      if (await saveAll(defaults)) clearForm();
    });

    $('#btn-preview').addEventListener('click', () => {
      window.open('gallery.html', '_blank');
    });

    bindList();

    if (isAuthed()) void showApp();
    else showLogin();
  });
})();
