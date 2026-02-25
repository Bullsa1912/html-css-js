// Tiny helper to wire the news slider prev/next buttons
document.addEventListener('DOMContentLoaded', function () {
  const slider = document.querySelector('.news-slider');
  const prev = document.querySelector('.news-slider-btn.prev');
  const next = document.querySelector('.news-slider-btn.next');
  if (!slider || !prev || !next) return;
  const step = 300; // pixels to scroll per click
  prev.addEventListener('click', function () { slider.scrollBy({ left: -step, behavior: 'smooth' }); });
  next.addEventListener('click', function () { slider.scrollBy({ left: step, behavior: 'smooth' }); });
});
