/**
 * Renders the home page hero mosaic and "Recent Pieces" cards from HughGallery (featured items, max 3).
 */
(function () {
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function thumbHtml(item) {
    if (item.imageUrl) {
      return `<img src="${escapeHtml(item.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />`;
    }
    return `<div class="img-placeholder" style="background:${item.gradient};"><span>${escapeHtml(item.title)}</span></div>`;
  }

  function pickDisplayItems(all) {
    const featured = all.filter((i) => i.featured);
    const featuredWithImages = featured.filter((i) => !!i.imageUrl);
    const fallbackWithImages = all.filter(
      (i) => !!i.imageUrl && !featured.some((f) => f.id === i.id)
    );
    return featuredWithImages.concat(fallbackWithImages).slice(0, 3);
  }

  function mosaicTag(item) {
    const price = HughGallery.formatMoney(item.price);
    const kind = String(item.label || 'Original').split('·')[0].trim() || 'Original';
    if (item.sold) return `${escapeHtml(kind)} · Sold`;
    return `${escapeHtml(kind)} · ${price}`;
  }

  function buildMosaicCell(item, index) {
    const loading = index === 0 ? 'eager' : 'lazy';
    const fetchPriority = index === 0 ? ' fetchpriority="high"' : '';
    const alt = escapeHtml(item.title) + ' artwork';
    const img = item.imageUrl
      ? `<img src="${escapeHtml(item.imageUrl)}" alt="${alt}" loading="${loading}"${fetchPriority} />`
      : `<div class="img-placeholder" style="background:${item.gradient};"><span>${escapeHtml(item.title)}</span></div>`;
    return `<div class="mosaic-cell">
      ${img}
      <span class="mosaic-tag">${mosaicTag(item)}</span>
    </div>`;
  }

  function buildCard(item, index) {
    const delay = index > 0 ? ` style="transition-delay:${index * 0.1}s"` : '';
    const price = HughGallery.formatMoney(item.price);
    const soldBlock = item.sold
      ? `<span class="art-price">${price}</span><button type="button" class="btn-add" disabled>Sold</button>`
      : `<span class="art-price">${price}</span>
         <button type="button" class="btn-add" data-home-add="${escapeHtml(item.id)}">+ Add</button>`;
    return `<div class="art-card fade-up"${delay}>
      <div class="art-card-img">${thumbHtml(item)}</div>
      <div class="art-card-info">
        <div class="art-card-title">${escapeHtml(item.title)}</div>
        <div class="art-card-medium">${escapeHtml(item.meta)}</div>
        <div class="art-card-footer">${soldBlock}</div>
      </div>
    </div>`;
  }

  function renderHeroMosaic(displayItems) {
    const mosaic = document.getElementById('hero-mosaic');
    if (!mosaic) return;
    mosaic.querySelectorAll('.mosaic-cell').forEach((el) => el.remove());
    displayItems.forEach((item, i) => {
      mosaic.insertAdjacentHTML('beforeend', buildMosaicCell(item, i));
    });
  }

  async function init() {
    if (!window.HughGallery) return;

    const all = await HughGallery.loadAsync();
    const displayItems = pickDisplayItems(all);

    renderHeroMosaic(displayItems);

    const grid = document.querySelector('.featured-grid');
    if (!grid) return;

    if (!displayItems.length) {
      grid.innerHTML =
        '<p class="fade-up">No featured works yet. Mark items as featured in the admin dashboard.</p>';
      return;
    }

    grid.innerHTML = displayItems.map((item, i) => buildCard(item, i)).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-home-add]');
      if (!btn) return;
      const id = btn.getAttribute('data-home-add');
      const item = HughGallery.load().find((x) => x.id === id);
      if (item && !item.sold) {
        addToCart(item.id, item.cartTitle, item.price, item.cartColor, item.imageUrl);
      }
    });

    const fadeObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    grid.querySelectorAll('.fade-up').forEach((el) => fadeObs.observe(el));
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
