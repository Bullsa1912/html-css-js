// Simple cart implementation using localStorage
(function () {
  function getCart() {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
  }
  function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }
  function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const cart = getCart();
    countEl.textContent = cart.reduce((sum, it) => sum + (it.qty || 1), 0);
  }

  function addToCart(item) {
    const cart = getCart();
    // try to merge by name
    const idx = cart.findIndex(c => c.name === item.name);
    if (idx > -1) { cart[idx].qty = (cart[idx].qty || 1) + (item.qty || 1); }
    else { cart.push(Object.assign({ qty: 1 }, item)); }
    saveCart(cart);
    updateCartCount();
  }

  function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    updateCartCount();
    renderCartContents();
  }

  function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
    renderCartContents();
  }


  // Format price as '20,04 € / 39,19 лв.'
  function formatPriceEURBGN(eur, bgn) {
    // Always show valid numbers, fallback to 0 if NaN
    if (!isFinite(eur)) eur = 0;
    if (!isFinite(bgn)) bgn = 0;
    return `${eur.toFixed(2).replace('.', ',')} € / ${bgn.toFixed(2).replace('.', ',')} лв.`;
  }

  // Example: 1 EUR = 1.95583 BGN
  const EUR_TO_BGN = 1.95583;

  function parsePrice(str) {
    // Accepts both '25,05 € / 48,99 лв.' and '48,99 лв. / 25,05 €' (or with swapped order)
    if (!str) return {eur: 0, bgn: 0};
    let eur = 0, bgn = 0;
    // Try EUR first
    let m = str.match(/([\d.,]+)\s*€\s*\/\s*([\d.,]+)\s*лв/);
    if (m) {
      eur = parseFloat(m[1].replace(',', '.'));
      bgn = parseFloat(m[2].replace(',', '.'));
    } else {
      // Try BGN first
      m = str.match(/([\d.,]+)\s*лв\.?\s*\/\s*([\d.,]+)\s*€/);
      if (m) {
        bgn = parseFloat(m[1].replace(',', '.'));
        eur = parseFloat(m[2].replace(',', '.'));
      }
    }
    if (!isFinite(eur)) eur = 0;
    if (!isFinite(bgn)) bgn = 0;
    return {eur, bgn};
  }

  function renderCartContents() {
    const container = document.getElementById('cart-contents');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    if (!container) return;
    const cart = getCart();
    if (!cart.length) {
      container.innerHTML = '<p>Количката е празна.</p>';
      if (subtotalEl) subtotalEl.textContent = formatPriceEURBGN(0, 0);
      if (totalEl) totalEl.textContent = formatPriceEURBGN(0, 0);
      return;
    }
    const list = document.createElement('div');
    list.className = 'cart-list';
    let subtotalEur = 0, subtotalBgn = 0;
    cart.forEach((it, i) => {
      // Accept price as '25,05 € / 48,99 лв.' or fallback
      let price = parsePrice(it.price);
      if (!price.eur && !price.bgn && it.price) {
        // fallback: try to parse as EUR only
        let val = parseFloat((it.price + '').replace(',', '.'));
        if (!isFinite(val)) val = 0;
        price = {eur: val, bgn: val * EUR_TO_BGN};
      }
      subtotalEur += price.eur * (it.qty || 1);
      subtotalBgn += price.bgn * (it.qty || 1);
      const row = document.createElement('div');
      row.className = 'cart-item';
      // Support both `image` and `images` (comma-separated) fields from different pages
      let imgSrc = '';
      if (it.image) imgSrc = it.image;
      else if (it.images) {
        if (Array.isArray(it.images)) imgSrc = it.images[0] || '';
        else imgSrc = (it.images + '').split(',')[0].trim();
      }
      row.innerHTML = `
        <img src="${imgSrc || ''}" alt="" />
        <div style="flex:1;min-width:120px;">
          <strong>${escapeHtml(it.name)}</strong>
          <div class="cart-item-meta">${formatPriceEURBGN(price.eur, price.bgn)} x ${it.qty || 1}</div>
        </div>
        <button data-index="${i}" class="btn-remove">Премахни</button>
      `;
      list.appendChild(row);
    });
    container.innerHTML = '';
    container.appendChild(list);

    // wire up remove buttons
    Array.from(container.querySelectorAll('.btn-remove')).forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'), 10);
        removeFromCart(idx);
      });
    });

    // Update summary
    if (subtotalEl) subtotalEl.textContent = formatPriceEURBGN(subtotalEur, subtotalBgn);
    if (totalEl) totalEl.textContent = formatPriceEURBGN(subtotalEur, subtotalBgn); // No discounts yet
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s];
    });
  }

  // Attach add-to-cart buttons on product lists

  document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();

    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', function () {
        const card = btn.closest('.product-card');
        if (!card) return;
        const nameEl = card.querySelector('h4, h3, h2');
        const priceEl = card.querySelector('.price');
        const imgEl = card.querySelector('img');
        const item = {
          name: nameEl ? nameEl.textContent.trim() : 'Продукт',
          price: priceEl ? priceEl.textContent.trim() : '',
          image: imgEl ? imgEl.getAttribute('src') : ''
        };
        addToCart(item);
        // quick feedback
        btn.textContent = 'Добавено';
        setTimeout(() => btn.textContent = 'Добави в количката', 1200);
      });
    });

    // wire clear cart button on cart page
    const clearBtn = document.getElementById('clear-cart');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () { clearCart(); });
    }

    // Discount code (UI only, no logic)
    const discountInput = document.getElementById('discount-code');
    const applyDiscountBtn = document.getElementById('apply-discount');
    if (discountInput && applyDiscountBtn) {
      discountInput.addEventListener('input', function () {
        applyDiscountBtn.disabled = !discountInput.value.trim();
      });
      applyDiscountBtn.addEventListener('click', function () {
        // No real discount logic, just UI feedback
        applyDiscountBtn.textContent = 'ПРИЛОЖЕНО';
        applyDiscountBtn.disabled = true;
        setTimeout(() => {
          applyDiscountBtn.textContent = 'ПРИЛОЖИ';
          applyDiscountBtn.disabled = !discountInput.value.trim();
        }, 1500);
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        alert('Плащането не е реализирано в демо версията.');
      });
    }

    // if we're on cart page, render contents
    if (document.getElementById('cart-contents')) {
      renderCartContents();
    }
  });

  // expose for debugging
  window._cart = { getCart, addToCart, removeFromCart, clearCart };
})();
