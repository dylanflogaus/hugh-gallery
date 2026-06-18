/**
 * Shared gallery data: defaults + localStorage override (set from Admin).
 * Client bundles call HughGallery.load() / loadAsync() for the active list.
 */
(function () {
  const STORAGE_KEY = 'hugh_gallery_items';
  const API_GALLERY = '/api/gallery';
  const API_TIMEOUT_MS = 2500;

  const FALLBACK_IMAGE_BY_ID = Object.freeze({
    'garden-reverie': '/artwork/web/flowers.webp',
    drift: '/artwork/web/sea.webp',
    'peach-blossom': '/artwork/web/flowers-abstract.webp',
    'morning-mist': '/artwork/web/cloud.webp',
    'reverie-4': '/artwork/web/abstract.webp',
    'wild-meadow': '/artwork/web/plains.webp',
    'warm-study': '/artwork/web/orange.webp',
    spectrum: '/artwork/web/mosaic.webp',
    'rose-study': '/artwork/web/more-flowers.webp',
    'lavender-haze': '/artwork/web/blue.webp',
    'first-light': '/artwork/web/scenic.webp',
    'bloom-3': '/artwork/web/flowers-vase.webp',
  });

  function splitTagParts(raw) {
    const str = String(raw ?? '').trim().toLowerCase();
    if (!str) return [];
    const parts = (str.includes(',') ? str.split(',') : str.split(/\s+/))
      .map((t) => t.trim())
      .filter(Boolean);
    return parts;
  }

  function normalizeTags(raw) {
    const unique = [...new Set(splitTagParts(raw))];
    return unique.join(', ');
  }

  function parseTags(tagsStr) {
    return [...new Set(splitTagParts(tagsStr))];
  }

  function formatFilterLabel(tag) {
    return tag
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /** Unique filter buttons derived from tags saved on gallery items. */
  function collectGalleryFilters(items) {
    const seen = new Set();
    const filters = [];
    (items || []).forEach((item) => {
      parseTags(item.tags).forEach((tag) => {
        if (seen.has(tag)) return;
        seen.add(tag);
        filters.push({ key: tag, label: formatFilterLabel(tag) });
      });
    });
    return filters;
  }

  function tagMatches(tagsStr, filterKey) {
    if (filterKey === 'all') return true;
    return parseTags(tagsStr).includes(String(filterKey || '').toLowerCase());
  }

  function formatMoney(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  }

  /** @returns {object[]} */
  function getDefaultItems() {
    return [
      {
        id: 'garden-reverie',
        title: 'Garden Reverie',
        meta: 'Watercolour on cold-press · 60×80 cm · 2025',
        description: 'A lush celebration of midsummer — petals dissolving into soft pools of colour, referencing the abundance and impermanence of bloom.',
        detailDescription: 'A lush celebration of midsummer — petals dissolving into soft pools of colour, referencing the abundance and impermanence of bloom. Unframed; framing available on request.',
        label: 'Original · 2025',
        price: 1850,
        cartTitle: 'Garden Reverie',
        gradient: 'linear-gradient(135deg, #f7c5c0 0%, #d5c9e8 35%, #bfd9f0 70%, #c5e4d8 100%)',
        tags: 'original watercolour floral',
        badge: 'new',
        large: true,
        featured: false,
        sold: false,
        cartColor: '#d5c9e8',
        imageUrl: '/artwork/web/flowers.webp',
      },
      {
        id: 'drift',
        title: 'Drift',
        meta: 'Acrylic wash · 40×50 cm · 2025',
        description: 'Layers of translucent blue and violet, exploring movement and stillness at once.',
        detailDescription: 'Layers of translucent blue and violet, exploring movement and stillness at once. Ships on canvas, ready to hang.',
        label: 'Original · 2025',
        price: 980,
        cartTitle: 'Drift',
        gradient: 'linear-gradient(160deg, #bfd9f0 0%, #c4a8d8 60%, #f7c5c0 100%)',
        tags: 'original abstract',
        badge: '',
        large: false,
        featured: false,
        sold: false,
        cartColor: '#bfd9f0',
        imageUrl: '/artwork/web/sea.webp',
      },
      {
        id: 'peach-blossom',
        title: 'Peach Blossom',
        meta: 'Giclee print · Ed. of 25 · A2',
        description: 'A delicate study of spring stone-fruit blossoms, rendered in warm peach and rose tones.',
        detailDescription: 'A delicate study of spring stone-fruit blossoms, rendered in warm peach and rose tones. Each print is hand-signed and numbered.',
        label: 'Print · Edition of 25',
        price: 290,
        cartTitle: 'Peach Blossom (Print)',
        gradient: 'linear-gradient(135deg, #f2c9a0 0%, #f7c5c0 50%, #e8a8b0 100%)',
        tags: 'print floral',
        badge: 'print',
        large: false,
        featured: false,
        sold: false,
        cartColor: '#f2c9a0',
        imageUrl: '/artwork/web/flowers-abstract.webp',
      },
      {
        id: 'morning-mist',
        title: 'Morning Mist',
        meta: 'Watercolour · 30×40 cm · 2024',
        description: 'Soft seafoam and mint evoke the hush of a morning garden before the world wakes.',
        detailDescription: 'Soft seafoam and mint evoke the hush of a morning garden before the world wakes. Only 1 left — this is the last available original.',
        label: 'Original · 2024',
        price: 780,
        cartTitle: 'Morning Mist',
        gradient: 'linear-gradient(160deg, #c5e4d8 0%, #bfd9f0 50%, #f5eac0 100%)',
        tags: 'original watercolour',
        badge: 'last',
        large: false,
        featured: false,
        sold: false,
        cartColor: '#c5e4d8',
        imageUrl: '/artwork/web/cloud.webp',
      },
      {
        id: 'reverie-4',
        title: 'Reverie No. 4',
        meta: 'Mixed media · 50×50 cm · 2025',
        description: 'Part of an ongoing abstract series meditating on memory and colour temperature.',
        detailDescription: 'Part of an ongoing abstract series meditating on memory and colour temperature. Ink, watercolour, and soft pastel on cotton rag.',
        label: 'Original · 2025',
        price: 1200,
        cartTitle: 'Reverie No. 4',
        gradient: 'linear-gradient(125deg, #c4a8d8 0%, #f7c5c0 50%, #f5eac0 100%)',
        tags: 'original abstract',
        badge: '',
        large: false,
        featured: false,
        sold: false,
        cartColor: '#c4a8d8',
        imageUrl: '/artwork/web/abstract.webp',
      },
      {
        id: 'wild-meadow',
        title: 'Wild Meadow',
        meta: 'Watercolour · 40×55 cm · 2024',
        description: 'A joyful scatter of wildflowers in sage, mint, and sky blue. This piece has found its home.',
        detailDescription: 'A joyful scatter of wildflowers in sage, mint, and sky blue. This piece has found its home.',
        label: 'Original · 2024',
        price: 1050,
        cartTitle: 'Wild Meadow',
        gradient: 'linear-gradient(140deg, #a8c5b0 0%, #c5e4d8 40%, #bfd9f0 100%)',
        tags: 'original floral watercolour',
        badge: 'sold',
        large: false,
        featured: false,
        sold: true,
        cartColor: '#a8c5b0',
        imageUrl: '/artwork/web/plains.webp',
        imageDimmed: true,
      },
      {
        id: 'warm-study',
        title: 'Warm Study',
        meta: 'Giclee print \u00b7 Ed. of 15 \u00b7 A3',
        description: 'Golden butter, peach, and rose — a study in warmth and late afternoon light.',
        detailDescription: 'Golden butter, peach, and rose — a study in warmth and late afternoon light. Printed on heavyweight matte paper.',
        label: 'Print · Edition of 15',
        price: 195,
        cartTitle: 'Warm Study (Print)',
        gradient: 'linear-gradient(170deg, #f5eac0 0%, #f2c9a0 40%, #e8a8b0 100%)',
        tags: 'print abstract',
        badge: 'print',
        large: false,
        featured: false,
        sold: false,
        cartColor: '#f5eac0',
        imageUrl: '/artwork/web/orange.webp',
      },
      {
        id: 'spectrum',
        title: 'Spectrum',
        meta: 'Watercolour & Ink · 70×100 cm · 2025',
        description: 'A full-spectrum wash from lavender through sky, mint, blush, and butter — Hugh\'s most ambitious piece of the year.',
        detailDescription: 'A full-spectrum wash from lavender through sky, mint, blush, and butter. Hugh\'s most ambitious piece of the year. Professionally stretched on linen.',
        label: 'Original · 2025',
        price: 2400,
        cartTitle: 'Spectrum',
        gradient: 'linear-gradient(115deg, #d5c9e8 0%, #bfd9f0 25%, #c5e4d8 50%, #f7c5c0 75%, #f5eac0 100%)',
        tags: 'original abstract watercolour',
        badge: 'new',
        large: true,
        featured: false,
        sold: false,
        cartColor: '#d5c9e8',
        imageUrl: '/artwork/web/mosaic.webp',
      },
      {
        id: 'rose-study',
        title: 'Rose Study I',
        meta: 'Watercolour · 25×35 cm · 2024',
        description: 'A close, intimate look at the unfurling rose — blush into deep rose, lavender shadows.',
        detailDescription: 'A close, intimate look at the unfurling rose — blush into deep rose, lavender shadows. Delicate and luminous. Perfect for a small wall or hallway.',
        label: 'Original · 2024',
        price: 620,
        cartTitle: 'Rose Study I',
        gradient: 'linear-gradient(150deg, #e8a8b0 0%, #f7c5c0 40%, #c4a8d8 100%)',
        tags: 'original floral',
        badge: '',
        large: false,
        featured: false,
        sold: false,
        cartColor: '#e8a8b0',
        imageUrl: '/artwork/web/more-flowers.webp',
      },
      {
        id: 'lavender-haze',
        title: 'Lavender Haze',
        meta: 'Watercolour on paper · 40×50 cm',
        description: 'Soft violet atmospheres layered over warm paper — luminous and calm.',
        detailDescription: 'Soft violet atmospheres layered over warm paper — luminous and calm. Unframed; float framing recommended.',
        label: 'Original',
        price: 1100,
        cartTitle: 'Lavender Haze',
        gradient: 'linear-gradient(145deg, #f7c5c0, #d5c9e8, #bfd9f0)',
        tags: 'original watercolour abstract',
        badge: '',
        large: false,
        featured: true,
        sold: false,
        cartColor: '#d5c9e8',
        imageUrl: '/artwork/web/blue.webp',
      },
      {
        id: 'first-light',
        title: 'First Light',
        meta: 'Acrylic wash · 30×40 cm',
        description: 'Cool mint and sky opening into a warm horizon — the quiet of early day.',
        detailDescription: 'Cool mint and sky opening into a warm horizon — the quiet of early day.',
        label: 'Original',
        price: 860,
        cartTitle: 'First Light',
        gradient: 'linear-gradient(145deg, #c5e4d8, #bfd9f0, #f5eac0)',
        tags: 'original abstract',
        badge: '',
        large: false,
        featured: true,
        sold: false,
        cartColor: '#c5e4d8',
        imageUrl: '/artwork/web/scenic.webp',
      },
      {
        id: 'bloom-3',
        title: 'Bloom Study III',
        meta: 'Mixed media · 50×60 cm',
        description: 'Warm peach and orchid — an abstracted bloom with tactile surface.',
        detailDescription: 'Warm peach and orchid — an abstracted bloom with tactile surface. Mixed media on cradled panel.',
        label: 'Original',
        price: 1450,
        cartTitle: 'Bloom Study III',
        gradient: 'linear-gradient(145deg, #f2c9a0, #f7c5c0, #c4a8d8)',
        tags: 'original floral abstract',
        badge: '',
        large: false,
        featured: true,
        sold: false,
        cartColor: '#f2c9a0',
        imageUrl: '/artwork/web/flowers-vase.webp',
      },
    ];
  }

  function normalizeItem(raw) {
    const d = getDefaultItems()[0];
    const id = String(raw.id || '').trim() || 'piece-' + Math.random().toString(36).slice(2, 9);
    const fallbackImageUrl = FALLBACK_IMAGE_BY_ID[id] || '';
    return {
      id,
      title: String(raw.title ?? '').trim() || 'Untitled',
      meta: String(raw.meta ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      detailDescription: String(raw.detailDescription ?? raw.description ?? '').trim(),
      label: String(raw.label ?? 'Original').trim() || 'Original',
      price: Number(raw.price) || 0,
      cartTitle: String(raw.cartTitle ?? raw.title ?? '').trim() || 'Untitled',
      gradient: String(raw.gradient ?? 'linear-gradient(135deg, #f7c5c0, #d5c9e8)').trim(),
      tags: normalizeTags(raw.tags ?? ''),
      badge: String(raw.badge ?? '').trim().toLowerCase(),
      large: !!raw.large,
      featured: !!raw.featured,
      sold: !!raw.sold,
      cartColor: String(raw.cartColor ?? '#d5c9e8').trim(),
      imageUrl: raw.imageUrl ? String(raw.imageUrl).trim() : fallbackImageUrl,
      imageDimmed: !!raw.imageDimmed,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map(normalizeItem);
        }
      }
    } catch (_) {}
    return getDefaultItems().map(normalizeItem);
  }

  /**
   * Fetch gallery from D1 (GET /api/gallery). Updates local cache on success.
   * Falls back to load() if the API is missing or returns an error.
   */
  async function loadAsync() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const r = await fetch(API_GALLERY, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (r.ok) {
        const data = await r.json();
        // Never replace the catalog with an empty list; fall back to cache/defaults.
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeItem);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
      return load();
    } catch (e) {
      console.warn('HughGallery.loadAsync: API unavailable, using cache/defaults.', e);
      return load();
    } finally {
      clearTimeout(timer);
    }
  }

  function save(items) {
    const clean = items.map(normalizeItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return clean;
  }

  /**
   * Write through to local cache and D1 (PUT /api/gallery). Requires admin Bearer token.
   */
  async function persist(items, bearerToken) {
    const clean = items.map(normalizeItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    if (!bearerToken || !String(bearerToken).trim()) {
      throw new Error('Admin session missing. Log in again.');
    }
    const r = await fetch(API_GALLERY, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + String(bearerToken).trim(),
      },
      body: JSON.stringify({ items: clean }),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(t || 'Save failed (' + r.status + ')');
    }
    return clean;
  }

  function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'piece';
  }

  window.HughGallery = {
    STORAGE_KEY,
    API_GALLERY,
    load,
    loadAsync,
    save,
    persist,
    clearStorage,
    getDefaultItems,
    normalizeItem,
    normalizeTags,
    parseTags,
    collectGalleryFilters,
    formatFilterLabel,
    tagMatches,
    formatMoney,
    slugify,
  };
})();
