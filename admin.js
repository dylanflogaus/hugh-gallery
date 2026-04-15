/**
 * Gallery admin — calls Worker /api/* + D1. Login uses ADMIN_API_SECRET (wrangler secret).
 */
(function () {
  const SESSION_KEY = 'hugh_admin_token';
  /** Badge values handled by the preset dropdown (empty = none). */
  const PRESET_BADGE_KEYS = new Set(['', 'new', 'print', 'last', 'sold']);

  const $ = (sel, el = document) => el.querySelector(sel);

  const FIELD_TIP_MARGIN = 12;
  const FIELD_TIP_GAP = 8;

  let fieldTooltipEl = null;
  /** @type {HTMLElement | null} */
  let fieldTooltipForBtn = null;
  let fieldTipsRepositionScheduled = false;

  function getFieldTooltipEl() {
    if (!fieldTooltipEl) {
      fieldTooltipEl = document.createElement('div');
      fieldTooltipEl.id = 'field-info-tooltip';
      fieldTooltipEl.className = 'field-info-tooltip';
      fieldTooltipEl.setAttribute('role', 'tooltip');
      document.body.appendChild(fieldTooltipEl);
    }
    return fieldTooltipEl;
  }

  function hideFieldTooltip() {
    if (fieldTooltipEl) {
      fieldTooltipEl.classList.remove('is-visible');
      fieldTooltipEl.textContent = '';
    }
    if (fieldTooltipForBtn) {
      fieldTooltipForBtn.removeAttribute('aria-describedby');
      fieldTooltipForBtn = null;
    }
  }

  function positionFieldInfoTip(btn) {
    if (!btn || !btn.classList.contains('field-info')) return;
    const text = btn.getAttribute('data-tooltip') || '';
    if (!text) {
      hideFieldTooltip();
      return;
    }
    const el = getFieldTooltipEl();
    el.textContent = text;
    el.classList.remove('is-visible');
    el.style.left = '-9999px';
    el.style.top = '0px';
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = FIELD_TIP_MARGIN;
    const gap = FIELD_TIP_GAP;

    let left = rect.left + rect.width / 2 - w / 2;
    const maxLeft = Math.max(m, vw - m - w);
    left = Math.min(Math.max(left, m), maxLeft);

    let top = rect.top - gap - h;
    if (top < m) {
      top = rect.bottom + gap;
    }
    if (top + h > vh - m) {
      top = vh - m - h;
    }
    if (top < m) {
      top = m;
    }

    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
    if (fieldTooltipForBtn && fieldTooltipForBtn !== btn) {
      fieldTooltipForBtn.removeAttribute('aria-describedby');
    }
    fieldTooltipForBtn = btn;
    btn.setAttribute('aria-describedby', 'field-info-tooltip');
    el.classList.add('is-visible');
  }

  function clearFieldInfoTip(btn) {
    if (fieldTooltipForBtn !== btn) return;
    hideFieldTooltip();
  }

  function scheduleRepositionFieldTips() {
    if (fieldTipsRepositionScheduled) return;
    fieldTipsRepositionScheduled = true;
    requestAnimationFrame(() => {
      fieldTipsRepositionScheduled = false;
      if (
        fieldTooltipForBtn &&
        fieldTooltipEl &&
        fieldTooltipEl.classList.contains('is-visible') &&
        (fieldTooltipForBtn.matches(':hover') || document.activeElement === fieldTooltipForBtn)
      ) {
        positionFieldInfoTip(fieldTooltipForBtn);
      }
    });
  }

  function setupFieldInfoTips() {
    document.querySelectorAll('.field-info').forEach((btn) => {
      btn.addEventListener('mouseenter', () => positionFieldInfoTip(btn));
      btn.addEventListener('mouseleave', () => clearFieldInfoTip(btn));
      btn.addEventListener('focus', () => positionFieldInfoTip(btn));
      btn.addEventListener('blur', () => clearFieldInfoTip(btn));
    });
    window.addEventListener('resize', scheduleRepositionFieldTips);
    window.addEventListener('scroll', scheduleRepositionFieldTips, { capture: true, passive: true });
  }

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
      badge: (() => {
        const custom = $('#field-badge-custom').value.trim();
        if (custom) return custom;
        return $('#field-badge').value;
      })(),
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
    const b = item.badge || '';
    if (PRESET_BADGE_KEYS.has(b)) {
      $('#field-badge').value = b;
      $('#field-badge-custom').value = '';
    } else {
      $('#field-badge').value = '';
      $('#field-badge-custom').value = b;
    }
    $('#field-large').checked = item.large;
    $('#field-featured').checked = item.featured;
    $('#field-sold').checked = item.sold;
    $('#field-cart-color').value = item.cartColor;
    $('#field-image-url').value = item.imageUrl || '';
    $('#field-image-dimmed').checked = item.imageDimmed;
    refreshImagePreview();
    setImageUploadStatus('');
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
    $('#field-badge-custom').value = '';
    $('#field-large').checked = false;
    $('#field-featured').checked = false;
    $('#field-sold').checked = false;
    $('#field-cart-color').value = b.cartColor;
    $('#field-image-url').value = '';
    $('#field-image-dimmed').checked = false;
    $('#form-title-text').textContent = 'New piece';
    refreshImagePreview();
    setImageUploadStatus('');
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

  function setImageUploadStatus(msg) {
    const el = $('#image-upload-status');
    if (el) el.textContent = msg || '';
  }

  function refreshImagePreview() {
    const field = $('#field-image-url');
    const wrap = $('#image-preview-wrap');
    const img = $('#image-preview');
    if (!field || !wrap || !img) return;
    const url = (field.value || '').trim();
    if (url) {
      img.src = url;
      wrap.hidden = false;
    } else {
      img.removeAttribute('src');
      wrap.hidden = true;
    }
  }

  const MAX_LONG_EDGE = 1800;
  const WEBP_QUALITY = 0.76;
  const JPEG_QUALITY = 0.82;

  async function optimizeImageForWeb(file) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (_) {
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        throw new Error('Could not read this image. Try another file or format.');
      }
    }
    try {
      let w = bitmap.width;
      let h = bitmap.height;
      const long = Math.max(w, h);
      if (long > MAX_LONG_EDGE) {
        const s = MAX_LONG_EDGE / long;
        w = Math.max(1, Math.round(w * s));
        h = Math.max(1, Math.round(h * s));
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not prepare image canvas.');
      ctx.drawImage(bitmap, 0, 0, w, h);

      const webpBlob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY);
      });
      if (webpBlob && webpBlob.size > 0) return webpBlob;

      const jpegBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b && b.size > 0) resolve(b);
            else reject(new Error('Could not encode image (try a different browser).'));
          },
          'image/jpeg',
          JPEG_QUALITY
        );
      });
      return jpegBlob;
    } finally {
      bitmap.close();
    }
  }

  async function uploadOptimizedImage(blob) {
    const token = getToken();
    if (!token.trim()) throw new Error('Admin session missing. Log in again.');
    const ext = blob.type && blob.type.includes('jpeg') ? 'jpg' : 'webp';
    const fd = new FormData();
    fd.append('file', blob, 'gallery.' + ext);
    const r = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token.trim() },
      body: fd,
    });
    if (!r.ok) {
      let msg = 'Upload failed (' + r.status + ')';
      try {
        const j = await r.json();
        if (j && j.error) msg = j.error;
      } catch {
        try {
          const t = await r.text();
          if (t) msg = t;
        } catch (_) {}
      }
      throw new Error(msg);
    }
    const data = await r.json();
    if (!data.url) throw new Error('Invalid response from server');
    return data.url;
  }

  async function handleArtworkImageFile(file) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    setImageUploadStatus('Optimizing…');
    try {
      const blob = await optimizeImageForWeb(file);
      setImageUploadStatus('Uploading…');
      const url = await uploadOptimizedImage(blob);
      $('#field-image-url').value = url;
      refreshImagePreview();
      setImageUploadStatus('Image ready — save the piece to persist.');
      showStatus('Image uploaded.');
    } catch (err) {
      setImageUploadStatus('');
      alert(err.message || String(err));
    }
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
    setupFieldInfoTips();

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

    $('#btn-pick-image').addEventListener('click', () => {
      $('#field-image-file').click();
    });

    $('#btn-clear-image').addEventListener('click', () => {
      $('#field-image-url').value = '';
      refreshImagePreview();
      setImageUploadStatus('');
    });

    $('#field-image-file').addEventListener('change', async (e) => {
      const input = e.target;
      const file = input.files && input.files[0];
      input.value = '';
      await handleArtworkImageFile(file);
    });

    const imageDropzone = $('#image-upload-dropzone');
    if (imageDropzone) {
      imageDropzone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        imageDropzone.classList.add('drag-over');
      });
      imageDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        imageDropzone.classList.add('drag-over');
      });
      imageDropzone.addEventListener('dragleave', (e) => {
        if (!imageDropzone.contains(e.relatedTarget)) {
          imageDropzone.classList.remove('drag-over');
        }
      });
      imageDropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        imageDropzone.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        await handleArtworkImageFile(file);
      });
    }

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
