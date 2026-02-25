document.addEventListener('DOMContentLoaded', function() {
  function createQuickView() {
    const overlay = document.createElement('div');
    overlay.className = 'quickview-overlay';
    overlay.innerHTML = `
      <div class="quickview" role="dialog" aria-modal="true">
        <button class="quickview-exit" aria-label="Затвори" style="position:absolute;top:18px;right:18px;font-size:2rem;background:none;border:none;cursor:pointer;z-index:10;">&times;</button>
        <div class="gallery">
          <div class="main-img-container">
            <img class="main-img" src="" alt="" />
          </div>
          <div class="thumbs"></div>
        </div>
        <div class="details">
          <button class="close-btn" aria-label="Close">&times;</button>
          <h2 class="title">Product Title</h2>
          <div class="meta">Категория: <span class="category"></span> • Марка: <span class="brand"></span></div>
          <div class="price">0.00 лв.</div>
          <div class="available">Наличен</div>
          <div class="qt">
            <label>КОЛИЧЕСТВО: <input type="number" class="quick-qty" min="1" value="1"/></label>
          </div>
          <div class="upload-photos">
            <label class="btn btn-upload">Добави снимки
              <input type="file" accept="image/*" class="quick-add-photos" multiple style="display:none;" />
            </label>
            <button class="btn btn-clear-photos" type="button">Премахни всички добавени снимки</button>
          </div>
          <div class="btns">
            <button class="btn btn-primary quick-buy">Купи</button>
            <button class="btn btn-secondary quick-order">Поръчка без регистрация</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    // Добавям слушател за новия X бутон горе вдясно
    overlay.querySelector('.quickview-exit').onclick = function() {
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
    };
    return overlay;
  }

  // small non-blocking toast for feedback (used instead of alert)
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'site-toast';
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      background: 'rgba(13,110,253,0.95)',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
      zIndex: 11000,
      fontWeight: 600
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; }, 1800);
    setTimeout(() => t.remove(), 2400);
  }

  let overlay = document.querySelector('.quickview-overlay');
  if (!overlay) overlay = createQuickView();

  const openBtns = document.querySelectorAll('.btn-details[data-quick="true"]');
  openBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const card = btn.closest('.product-card');
      if (!card) return;
      const title = card.querySelector('h4, h3, h2') ? card.querySelector('h4, h3, h2').textContent.trim() : 'Продукт';
      const price = card.querySelector('.price') ? card.querySelector('.price').textContent.trim() : '';
      const imgEl = card.querySelector('img');
      const image = imgEl ? imgEl.getAttribute('src') : '';
      const productId = card.getAttribute('data-product-id') || title.replace(/\s+/g, '-').toLowerCase();
      const imagesAttr = card.getAttribute('data-images');
      // saved photos are stored by product id in localStorage (base64 data URL array)
      const savedPhotosKey = 'pv-photos-' + productId;
      const savedPhotos = JSON.parse(localStorage.getItem(savedPhotosKey) || '[]');
      const imagesFromAttr = imagesAttr ? imagesAttr.split(',').map(s => s.trim()).filter(Boolean) : [];
      // Ensure savedPhotos are appended but keep the order from data-images first
      const images = imagesFromAttr.concat(savedPhotos).filter(Boolean);

      const mainImg = overlay.querySelector('.main-img');
      // Prefer the image shown on the product card as the initial main image
      const cardImage = image || (images.length ? images[0] : '');
      // If the card image exists in the images array, set that index as active; otherwise default to 0
      let initialIndex = 0;
      if (cardImage) {
        const found = images.indexOf(cardImage);
        if (found > -1) initialIndex = found;
        else {
          // if card image not present in data-images, prepend it so thumbs include it
          images.unshift(cardImage);
          initialIndex = 0;
        }
      }
      mainImg.setAttribute('src', images[initialIndex] || '');
      mainImg.setAttribute('alt', title);
      // Setup zoom
      const zoomLens = overlay.querySelector('.zoom-lens');
      const zoomResult = overlay.querySelector('.zoom-result');
      function setZoomImage(src) {
        if (zoomResult) zoomResult.style.backgroundImage = `url('${src}')`;
      }
      setZoomImage(mainImg.src);
      // Remove previous listeners
      mainImg.onmousemove = null;
      mainImg.onmouseleave = null;
      mainImg.onmouseenter = null;
      if (zoomLens && zoomResult) {
        let scale = 2.5;
        let lensW = 120, lensH = 120;
        function moveLens(e) {
          const rect = mainImg.getBoundingClientRect();
          let x = e.clientX - rect.left;
          let y = e.clientY - rect.top;
          x = Math.max(lensW/2, Math.min(x, rect.width - lensW/2));
          y = Math.max(lensH/2, Math.min(y, rect.height - lensH/2));
          zoomLens.style.left = (x - lensW/2) + 'px';
          zoomLens.style.top = (y - lensH/2) + 'px';
          zoomLens.style.display = 'block';
          zoomResult.style.display = 'block';
          // Calculate background position
          const bgX = -((x * scale) - zoomResult.offsetWidth/2);
          const bgY = -((y * scale) - zoomResult.offsetHeight/2);
          zoomResult.style.backgroundPosition = `${bgX}px ${bgY}px`;
          zoomResult.style.backgroundSize = `${mainImg.width * scale}px ${mainImg.height * scale}px`;
        }
        mainImg.onmousemove = moveLens;
        mainImg.onmouseenter = function(e) {
          setZoomImage(mainImg.src);
          zoomLens.style.display = 'block';
          zoomResult.style.display = 'block';
        };
        mainImg.onmouseleave = function() {
          zoomLens.style.display = 'none';
          zoomResult.style.display = 'none';
        };
        // Also update zoom on main image change
        mainImg.onload = function() { setZoomImage(mainImg.src); };
      }
      overlay.querySelector('.title').textContent = title;
      overlay.querySelector('.price').textContent = price;
      // fill product meta
      const brand = card.getAttribute('data-brand') || (card.querySelector('.brand') ? card.querySelector('.brand').textContent.trim() : '—');
      const category = card.getAttribute('data-category') || '—';
      const desc = card.getAttribute('data-desc') || (card.querySelector('.desc') ? card.querySelector('.desc').textContent.trim() : '');
      const viewHref = card.getAttribute('data-href') || '#';
      const quickTitleEl = overlay.querySelector('.quick-title');
      if (quickTitleEl) quickTitleEl.textContent = title;
      const quickMetaEl = overlay.querySelector('.quick-meta');
      if (quickMetaEl) quickMetaEl.innerHTML = `Категория: <strong>${category}</strong> • Марка: <strong>${brand}</strong>`;
      const metaCategorySpan = overlay.querySelector('.meta .category');
      const metaBrandSpan = overlay.querySelector('.meta .brand');
      if (metaCategorySpan) metaCategorySpan.textContent = category;
      if (metaBrandSpan) metaBrandSpan.textContent = brand;
      const quickPriceEl = overlay.querySelector('.quick-price');
      if (quickPriceEl) quickPriceEl.textContent = price;
      const quickDescEl = overlay.querySelector('.quick-desc');
      if (quickDescEl) quickDescEl.textContent = desc;
      const viewProductEl = overlay.querySelector('.view-product');
      const skuValEl = overlay.querySelector('.sku-val');
      if (viewProductEl) viewProductEl.setAttribute('href', viewHref);
      if (skuValEl) skuValEl.textContent = card.getAttribute('data-sku') || (card.querySelector('.sku') ? card.querySelector('.sku').textContent.trim() : '—');
      overlay.classList.add('is-active');
      overlay.setAttribute('aria-hidden', 'false');

      // set thumbnails
      const thumbs = overlay.querySelector('.thumbs');
      thumbs.innerHTML = '';
      let activeIndex = 0;
      function setActiveIndex(idx) {
        if (!images.length) return;
        activeIndex = (idx + images.length) % images.length;
        const src = images[activeIndex];
        overlay.querySelector('.main-img').src = src;
        thumbs.querySelectorAll('.thumb-img').forEach(i => i.classList.remove('active'));
        const activeThumb = thumbs.querySelectorAll('.thumb-img')[activeIndex];
        if (activeThumb) activeThumb.classList.add('active');
      }

      function renderThumbs() {
        thumbs.innerHTML = '';
        images.forEach((src, idx) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'thumb-wrapper';
          const t = document.createElement('img');
          t.src = src;
          t.alt = title + ' ' + (idx+1);
          t.className = 'thumb-img';
          // Store index as data attribute for reliable identification
          t.setAttribute('data-thumb-index', idx);
          // mark active thumbnail if matches main image or first fallback
          const mainSrc = overlay.querySelector('.main-img').src;
          if (mainSrc && mainSrc === src) t.classList.add('active');
          else if (!mainSrc && idx === 0) t.classList.add('active');
          wrapper.appendChild(t);
          // add remove if saved or present
          const removeBtn = document.createElement('button');
          removeBtn.className = 'thumb-remove';
          removeBtn.title = 'Премахни тази снимка';
          removeBtn.textContent = '×';
          wrapper.appendChild(removeBtn);
          thumbs.appendChild(wrapper);
          // events
          t.addEventListener('click', function() {
            const thumbIdx = parseInt(this.getAttribute('data-thumb-index'), 10);
            setActiveIndex(thumbIdx);
            setZoomImage(this.src);
          });
          removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // if the source is a saved data url, remove from savedPhotos
            const isSaved = src.startsWith('data:');
            const pos = images.indexOf(src);
            if (pos > -1) images.splice(pos, 1);
            if (isSaved) {
              const savedIndex = savedPhotos.indexOf(src);
              if (savedIndex > -1) savedPhotos.splice(savedIndex, 1);
              localStorage.setItem(savedPhotosKey, JSON.stringify(savedPhotos));
            } else {
              // remove from data-images attr on the card; re-evaluate current attribute to avoid stale copy
              const currentAttr = card.getAttribute('data-images') || '';
              const parts = currentAttr.split(',').map(s => s.trim()).filter(Boolean);
              const updated = parts.filter(i => i !== src);
              card.setAttribute('data-images', updated.join(','));
            }
            renderThumbs();
            // maintain active index if needed
            if (activeIndex >= images.length) activeIndex = images.length - 1;
            setActiveIndex(activeIndex);
          });
        });
      }
      renderThumbs();
      // set active index to the chosen initial image (prefer card image)
      setActiveIndex(initialIndex);

      // gallery prev/next
      // Премахнати стрелки за галерията
      // thumbs click handled in renderThumbs

      // wire close button (avoid adding duplicate listeners on each open)
      const closeBtn = overlay.querySelector('.close-btn');
      const modalClose = overlay.querySelector('#modal-close');
      if (closeBtn) closeBtn.onclick = () => { overlay.classList.remove('is-active'); overlay.setAttribute('aria-hidden', 'true'); };
      if (modalClose) modalClose.onclick = () => { overlay.classList.remove('is-active'); overlay.setAttribute('aria-hidden', 'true'); };
      // close on ESC
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          overlay.classList.remove('is-active');
          overlay.setAttribute('aria-hidden', 'true');
          document.removeEventListener('keydown', escHandler);
        }
      });

      // wire buy button
      const buyBtn = overlay.querySelector('.quick-buy');
      buyBtn.onclick = function() {
        const qty = parseInt(overlay.querySelector('.quick-qty').value, 10) || 1;
        const currentMain = overlay.querySelector('.main-img').src;
        window._cart.addToCart({ name: title, price: price, image: currentMain, qty });
        overlay.classList.remove('is-active');
        showToast('Продуктът е добавен в количката');
      };

      // wire quick order 
      overlay.querySelector('.quick-order').onclick = function() {
        showToast('Поръчка без регистрация: функция за доработка');
      };

      // wire upload input and clear button
      const uploadInput = overlay.querySelector('.quick-add-photos');
      const clearBtn = overlay.querySelector('.btn-clear-photos');
      // ensure handlers are not duplicated
      uploadInput.onchange = function(ev) {
        const files = Array.from(ev.target.files || []);
        files.forEach(file => {
          if (!file.type.startsWith('image/')) return;
          const fr = new FileReader();
            fr.onload = function(evt) {
            const dataUrl = evt.target.result;
            // add to savedPhotos and images arrays, update localStorage and data-images attr
            savedPhotos.push(dataUrl);
            localStorage.setItem(savedPhotosKey, JSON.stringify(savedPhotos));
            images.push(dataUrl);
            // make just-uploaded image the main preview
            overlay.querySelector('.main-img').src = dataUrl;
            // update activeIndex to the newly added item
            try { activeIndex = images.indexOf(dataUrl); } catch (e) { activeIndex = 0; }
            // update card data-images attr to include data urls
            const cardImages = card.getAttribute('data-images') || '';
            const arr = cardImages.split(',').map(s => s.trim()).filter(Boolean);
            arr.push(dataUrl);
            card.setAttribute('data-images', arr.join(','));
            renderThumbs();
            // reset input value so selecting same file again works if needed
            uploadInput.value = '';
          };
          fr.readAsDataURL(file);
        });
      };
      clearBtn.onclick = function() {
        // remove local saved photos
        savedPhotos.length = 0;
        localStorage.setItem(savedPhotosKey, JSON.stringify([]));
        // remove any data urls from data-images attr
        const currentAttr = card.getAttribute('data-images') || '';
        const parts = currentAttr.split(',').map(s => s.trim()).filter(Boolean);
        const filtered = parts.filter(p => !p.startsWith('data:'));
        card.setAttribute('data-images', filtered.join(','));
        // update images array: remove all previous savedPhotos (remove data urls)
        images.length = 0;
        images.push(...filtered);
        renderThumbs();
      };

    });
  });

  // close on overlay click outside modal
  document.body.addEventListener('click', function(e) {
    if (!overlay) return;
    if (e.target === overlay) { overlay.classList.remove('is-active'); overlay.setAttribute('aria-hidden', 'true'); }
  });

});
