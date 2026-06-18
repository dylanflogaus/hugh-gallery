/**
 * Gallery shop grid, filters, and modal. Requires gallery-store.js + main.js (addToCart).
 */
(function () {
  const BADGE_CLASS = {
    new: 'badge-new',
    sold: 'badge-sold',
    print: 'badge-print',
    last: 'badge-last',
  };

  const BADGE_LABELS = { new: 'New', sold: 'Sold', print: 'Print', last: '1 Left' };

  function formatBadgeLabel(key) {
    return key
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function artImageHtml(item) {
    const dim = item.imageDimmed || item.sold ? ' opacity:0.7;' : '';
    if (item.imageUrl) {
      return `<img src="${escapeHtml(item.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;${dim}" loading="lazy" />`;
    }
    return `<div class="img-placeholder" style="background:${item.gradient};height:100%;${dim}"><span>${escapeHtml(item.title)}</span></div>`;
  }

  function buildCardHtml(item, index) {
    const largeClass = item.large ? ' large' : '';
    const delay = ` style="transition-delay:${(index % 5) * 0.05}s"`;
    const tags = escapeHtml(item.tags);
    let badgeHtml = '';
    if (item.badge) {
      const badgeClass = BADGE_CLASS[item.badge] || 'badge-custom';
      const text = BADGE_LABELS[item.badge] || formatBadgeLabel(item.badge);
      badgeHtml = `<span class="badge ${badgeClass}">${escapeHtml(text)}</span>`;
    }

    const overlayHtml = item.sold
      ? ''
      : `<div class="shop-card-overlay">
          <button type="button" class="overlay-btn" data-open-modal="${escapeHtml(item.id)}">Quick View</button>
        </div>`;

    const priceStr = HughGallery.formatMoney(item.price);
    const footerSold = item.sold
      ? `<span class="shop-price sold">${priceStr}</span>
         <button type="button" class="btn-add-full" disabled>Sold</button>`
      : `<span class="shop-price">${priceStr}</span>
         <button type="button" class="btn-add-full" data-add-cart="${escapeHtml(item.id)}">+ Add to Cart</button>`;

    return `<div class="shop-card${largeClass} fade-up" data-id="${escapeHtml(item.id)}" data-tags="${tags}"${delay}>
      <div class="shop-card-img">
        ${artImageHtml(item)}
        ${badgeHtml}
        ${overlayHtml}
      </div>
      <div class="shop-card-body">
        <div class="shop-card-title">${escapeHtml(item.title)}</div>
        <div class="shop-card-meta">${escapeHtml(item.meta)}</div>
        <p class="shop-card-desc">${escapeHtml(item.description)}</p>
        <div class="shop-card-footer">${footerSold}</div>
      </div>
    </div>`;
  }

  function artworksMap(items) {
    const m = {};
    items.forEach((item) => {
      const detail = item.detailDescription || item.description;
      m[item.id] = {
        label: item.label,
        title: item.title,
        meta: item.meta,
        desc: detail,
        price: HughGallery.formatMoney(item.price),
        bg: item.gradient,
        id: item.id,
        numPrice: item.price,
        sold: item.sold,
      };
    });
    return m;
  }

  function openModal(id, map) {
    const art = map[id];
    if (!art || art.sold) return;
    document.getElementById('modal-label').textContent = art.label;
    document.getElementById('modal-title').textContent = art.title;
    document.getElementById('modal-meta').textContent = art.meta;
    document.getElementById('modal-desc').textContent = art.desc;
    document.getElementById('modal-price').textContent = art.price;
    const inner = HughGallery.load().find((i) => i.id === id);
    const imgHtml = inner && inner.imageUrl
      ? `<img src="${escapeHtml(inner.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" />`
      : `<div class="img-placeholder" style="background:${art.bg};height:100%;aspect-ratio:unset;"><span>${escapeHtml(art.title)}</span></div>`;
    document.getElementById('modal-img').innerHTML = imgHtml;
    const addBtn = document.getElementById('modal-add-btn');
    addBtn.onclick = () => {
      const full = HughGallery.load().find((i) => i.id === id);
      const cTitle = full ? full.cartTitle : art.title;
      const cColor = full ? full.cartColor : '';
      const cImg = full && full.imageUrl ? full.imageUrl : '';
      addToCart(art.id, cTitle, art.numPrice, cColor, cImg);
      closeModal();
    };
    addBtn.disabled = false;
    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function closeModalIfBg(e) {
    if (e.target.id === 'modal-overlay') closeModal();
  }

  function renderFilterBar(items) {
    const bar = document.querySelector('.filter-bar');
    if (!bar) return;
    const tagFilters = HughGallery.collectGalleryFilters(items);
    bar.innerHTML = '<span class="filter-label">Filter:</span>';
    const filters = [{ key: 'all', label: 'All Works' }, ...tagFilters];
    filters.forEach((f, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
      btn.dataset.filter = f.key;
      btn.textContent = f.label;
      bar.appendChild(btn);
    });
    bar.style.display = tagFilters.length ? '' : 'none';
  }

  function applyFilter(filter, grid, items) {
    const byId = new Map(items.map((item) => [item.id, item]));
    grid.querySelectorAll('.shop-card').forEach((card) => {
      const item = byId.get(card.dataset.id);
      const tags = item ? item.tags : card.dataset.tags || '';
      setCardVisible(card, HughGallery.tagMatches(tags, filter));
    });
  }

  function setCardVisible(card, show) {
    card.style.display = show ? '' : 'none';
    if (show) card.classList.add('visible');
  }

  function initFilter(items, artworks) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const grid = document.getElementById('gallery-grid');

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilter(btn.dataset.filter, grid, items);
      });
    });

    grid.addEventListener('click', (e) => {
      const modalBtn = e.target.closest('[data-open-modal]');
      if (modalBtn) {
        openModal(modalBtn.getAttribute('data-open-modal'), artworks);
        return;
      }
      const cartBtn = e.target.closest('[data-add-cart]');
      if (cartBtn) {
        const id = cartBtn.getAttribute('data-add-cart');
        const item = items.find((i) => i.id === id);
        if (item && !item.sold) {
          addToCart(item.id, item.cartTitle, item.price, item.cartColor, item.imageUrl);
        }
      }
    });
  }

  function revealFadeUp(elements) {
    if (!elements.length) return;
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('visible'));
      return;
    }
    const fadeObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    elements.forEach((el) => fadeObs.observe(el));
  }

  async function init() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const items = (await HughGallery.loadAsync()).slice().reverse();
    grid.innerHTML = items.map((item, i) => buildCardHtml(item, i)).join('');
    const map = artworksMap(items);
    renderFilterBar(items);
    initFilter(items, map);

    window.openModal = (id) => openModal(id, map);

    window.closeModal = closeModal;
    window.closeModalIfBg = closeModalIfBg;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    revealFadeUp(Array.from(grid.querySelectorAll('.fade-up')));
  }

  function start() {
    void init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
