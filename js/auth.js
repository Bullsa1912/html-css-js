// Very simple client-side auth (for demo only).
// Stores a single "user" object in localStorage and updates header UI.
(function () {

  /* =====================
     Helpers (localStorage)
     ===================== */
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem('user');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[c];
    });
  }

  /* =====================
     Header (login state)
     ===================== */
  function updateHeader() {
    const user = getUser();

    let authArea = document.querySelector('.auth-area');
    if (!authArea) {
      const nav = document.querySelector('.main-navbar__list');
      if (!nav) return;
      authArea = document.createElement('li');
      authArea.className = 'main-navbar__item auth-area';
      nav.appendChild(authArea);
    }

    if (user) {
      authArea.innerHTML = `
        <span class="main-navbar__link">${escapeHtml(user.email)}</span>
        <button id="logoutBtn" class="main-navbar__link"
          style="background:none;border:none;cursor:pointer;">
          Изход
        </button>
      `;

      const btn = document.getElementById('logoutBtn');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          logout();
        });
      }
    } else {
      authArea.innerHTML = `<a href="/login.html" class="main-navbar__link">Вход</a>`;
    }
  }

  /* =====================
     AUTH LOGIC (DEMO)
     ===================== */
  function login(email, password) {
    if (!email || !password) {
      return { ok: false, message: 'Моля въведете имейл и парола.' };
    }
    setUser({ email });
    updateHeader();
    return { ok: true };
  }

  function logout() {
    clearUser();
    updateHeader();
    window.location.href = '/login.html';
  }

  /* =====================
     DOM READY
     ===================== */

  document.addEventListener('DOMContentLoaded', function () {
    updateHeader();

    /* -------- LOGIN -------- */
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const loginBtn = document.querySelector('.login-btn');
      function checkFields() {
        if (emailInput.value.trim() && passwordInput.value.trim()) {
          loginBtn.disabled = false;
        } else {
          loginBtn.disabled = true;
        }
      }
      emailInput.addEventListener('input', checkFields);
      passwordInput.addEventListener('input', checkFields);
      checkFields();

      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const msg = document.getElementById('login-message');
        const res = login(email, password);
        if (res.ok) {
          if (msg) msg.textContent = '';
          window.location.href = '/homepage.html';
        } else {
          if (msg) msg.textContent = res.message;
        }
      });
    }

    /* -------- REGISTER -------- */
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      const firstname = document.getElementById('reg-firstname');
      const lastname = document.getElementById('reg-lastname');
      const email = document.getElementById('reg-email');
      const password = document.getElementById('reg-password');
      const phone = document.getElementById('reg-phone');
      const registerBtn = document.querySelector('.register-btn');
      function checkRegisterFields() {
        if (
          firstname.value.trim() &&
          lastname.value.trim() &&
          email.value.trim() &&
          password.value.trim() &&
          phone.value.trim()
        ) {
          registerBtn.disabled = false;
        } else {
          registerBtn.disabled = true;
        }
      }
      firstname.addEventListener('input', checkRegisterFields);
      lastname.addEventListener('input', checkRegisterFields);
      email.addEventListener('input', checkRegisterFields);
      password.addEventListener('input', checkRegisterFields);
      phone.addEventListener('input', checkRegisterFields);
      checkRegisterFields();

      registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const msg = document.getElementById('register-message');
        if (!firstname.value.trim() || !lastname.value.trim() || !email.value.trim() || !password.value.trim() || !phone.value.trim()) {
          msg.textContent = 'Попълнете всички полета.';
          return;
        }
        setUser({ email: email.value.trim() });
        updateHeader();
        window.location.href = '/homepage.html';
      });
    }

    /* -------- FORGOT PASSWORD -------- */
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
      const forgotEmailInput = document.getElementById('forgot-email');
      const forgotBtn = document.querySelector('.login-btn'); // assuming it's the same class
      function checkForgotFields() {
        if (forgotEmailInput.value.trim()) {
          forgotBtn.disabled = false;
        } else {
          forgotBtn.disabled = true;
        }
      }
      forgotEmailInput.addEventListener('input', checkForgotFields);
      checkForgotFields();

      forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        document.getElementById('forgot-message').textContent =
          'Ако имейлът съществува, ще получите инструкции.';
      });
    }

  });

  window._auth = { login, logout, getUser };

})();


