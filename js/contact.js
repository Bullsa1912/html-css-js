document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = new FormData(form);
    const obj = {};
    data.forEach((v,k) => obj[k] = v);

    // simulate sending: save to localStorage
    const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    submissions.push({ ...obj, timestamp: new Date().toISOString() });
    localStorage.setItem('contactSubmissions', JSON.stringify(submissions));

    // show a simple confirmation
    alert('Благодарим Ви! Вашето запитване е получено. Ще се свържем с вас възможно най-скоро.');
    form.reset();
  });
});
