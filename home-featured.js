/**
 * Renders the home page "Recent Pieces" cards from HughGallery (featured items, max 3).
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

  async function init() {
    const grid = document.querySelector('.featured-grid');
    if (!grid || !window.HughGallery) return;

    const all = await HughGallery.loadAsync();
    const featured = all.filter((i) => i.featured);
    const featuredWithImages = featured.filter((i) => !!i.imageUrl);
    const fallbackWithImages = all.filter((i) => !!i.imageUrl && !featured.some((f) => f.id === i.id));
    const displayItems = featuredWithImages.concat(fallbackWithImages).slice(0, 3);
    if (!displayItems.length) {
      grid.innerHTML = '<p class="fade-up">No featured works yet. Mark items as featured in the admin dashboard.</p>';
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
