/* ── NAVIGATION TOGGLE ─────────────────────────────── */
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    if (navLinks.classList.contains('open')) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

/* Close mobile nav on link click */
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    const spans = navToggle?.querySelectorAll('span');
    if (spans) spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ── ACTIVE NAV LINK ───────────────────────────────── */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

/* ── CART (localStorage) ───────────────────────────── */
function getCart() {
  try { return JSON.parse(localStorage.getItem('hp_cart') || '[]'); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('hp_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = total;
    el.style.display = total === 0 ? 'none' : 'flex';
  });
}

function addToCart(id, title, price, color, imageUrl) {
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  const img =
    imageUrl != null && String(imageUrl).trim() ? String(imageUrl).trim() : '';
  if (existing) {
    existing.qty += 1;
    if (img && !existing.imageUrl) existing.imageUrl = img;
  } else {
    const line = { id, title, price, color, qty: 1 };
    if (img) line.imageUrl = img;
    cart.push(line);
  }
  saveCart(cart);
  updateCartCount();
  showToast(`"${title}" added to cart`);
}

/* ── TOAST ─────────────────────────────────────────── */
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-dot"></span><span class="toast-msg"></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('.toast-msg').textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── SCROLL ANIMATIONS ─────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));

/* Init */
updateCartCount();
