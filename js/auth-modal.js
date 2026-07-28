// ─── SHOP.TZ AUTHENTICATION & PROFILE MODAL ───
(function () {
  const STORAGE_KEY = "shop_tz_user_profile";

  function getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveUser(user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      updateProfileUI();
    } catch (e) {}
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    updateProfileUI();
    if (window.SHOP_CO_CART) {
      window.SHOP_CO_CART.showToast("Signed out successfully");
    }
  }

  function updateProfileUI() {
    const user = getUser();
    const profileBtns = document.querySelectorAll(".action-header__link.icon-profile");
    profileBtns.forEach(btn => {
      if (user) {
        btn.innerHTML = `<span style="font-size: 0.78rem; font-weight: 700; background: #10b981; color: #fff; padding: 2px 8px; border-radius: 12px; font-family: sans-serif;">👤 ${user.name.split(" ")[0]}</span>`;
        btn.title = `Signed in as ${user.name} (${user.email})`;
      } else {
        btn.innerHTML = ``;
        btn.title = "Sign In / Sign Up";
      }
    });
  }

  function renderModal() {
    if (document.getElementById("shop-tz-auth-modal")) return;

    const modal = document.createElement("div");
    modal.id = "shop-tz-auth-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    `;

    modal.innerHTML = `
      <div style="background: #ffffff; width: 90%; max-width: 420px; border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; color: #000; font-family: 'Montserrat', sans-serif;">
        <button id="auth-modal-close" style="position: absolute; top: 16px; right: 16px; background: #f4f4f5; border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; cursor: pointer;">✕</button>
        
        <div id="auth-view-login">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Welcome to Shop.TZ</h2>
          <p style="font-size: 0.85rem; color: #71717a; margin-bottom: 20px;">Sign in to access your Tanzania orders and saved styles.</p>
          
          <form id="auth-form-signin" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: #71717a;">Email Address</label>
              <input type="email" id="auth-email" required placeholder="mwijaydavie@gmail.com" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e4e4e7; background: #f4f4f5; font-size: 0.88rem;" value="mwijaydavie@gmail.com" />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: #71717a;">Password</label>
              <input type="password" id="auth-pass" required placeholder="••••••••" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e4e4e7; background: #f4f4f5; font-size: 0.88rem;" value="password123" />
            </div>
            <button type="submit" style="background: #000000; color: #ffffff; padding: 14px; border: none; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-transform: uppercase; margin-top: 8px;">Sign In</button>
          </form>
          
          <div style="margin-top: 16px; text-align: center; font-size: 0.82rem; color: #71717a;">
            Don't have an account? <a href="#" id="toggle-to-signup" style="color: #2a66ff; font-weight: 700; text-decoration: none;">Create Account</a>
          </div>
        </div>

        <div id="auth-view-signup" style="display: none;">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Join Shop.TZ</h2>
          <p style="font-size: 0.85rem; color: #71717a; margin-bottom: 20px;">Create your account for fast Tanzanian checkout and style recommendations.</p>
          
          <form id="auth-form-signup" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: #71717a;">Full Name</label>
              <input type="text" id="signup-name" required placeholder="Mwijay Davie" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e4e4e7; background: #f4f4f5; font-size: 0.88rem;" value="Mwijay Davie" />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: #71717a;">Email Address</label>
              <input type="email" id="signup-email" required placeholder="mwijaydavie@gmail.com" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e4e4e7; background: #f4f4f5; font-size: 0.88rem;" value="mwijaydavie@gmail.com" />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: #71717a;">Phone (+255)</label>
              <input type="tel" id="signup-phone" required placeholder="+255 700 000 000" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e4e4e7; background: #f4f4f5; font-size: 0.88rem;" value="+255 700 000 000" />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: #71717a;">Password</label>
              <input type="password" id="signup-pass" required placeholder="••••••••" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e4e4e7; background: #f4f4f5; font-size: 0.88rem;" value="password123" />
            </div>
            <button type="submit" style="background: #10b981; color: #ffffff; padding: 14px; border: none; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-transform: uppercase; margin-top: 8px;">Create Account</button>
          </form>

          <div style="margin-top: 16px; text-align: center; font-size: 0.82rem; color: #71717a;">
            Already registered? <a href="#" id="toggle-to-login" style="color: #2a66ff; font-weight: 700; text-decoration: none;">Sign In</a>
          </div>
        </div>

        <div id="auth-view-profile" style="display: none; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 8px;">👤</div>
          <h2 id="user-display-name" style="font-size: 1.4rem; font-weight: 700; margin-bottom: 4px;">Mwijay Davie</h2>
          <p id="user-display-email" style="font-size: 0.85rem; color: #71717a; margin-bottom: 20px;">mwijaydavie@gmail.com</p>
          
          <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 20px; font-size: 0.85rem; line-height: 150%;">
            <strong>Account Details:</strong><br/>
            Region: Tanzania (TZ)<br/>
            Membership: Shop.TZ VIP Member ⭐<br/>
            Status: Active
          </div>

          <button id="auth-btn-logout" style="width: 100%; background: #ef4444; color: #ffffff; padding: 12px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase;">Sign Out</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const closeBtn = document.getElementById("auth-modal-close");
    closeBtn.addEventListener("click", hideModal);

    const toggleSignUp = document.getElementById("toggle-to-signup");
    const toggleLogin = document.getElementById("toggle-to-login");
    const viewLogin = document.getElementById("auth-view-login");
    const viewSignUp = document.getElementById("auth-view-signup");
    const viewProfile = document.getElementById("auth-view-profile");

    toggleSignUp.addEventListener("click", (e) => {
      e.preventDefault();
      viewLogin.style.display = "none";
      viewSignUp.style.display = "block";
    });

    toggleLogin.addEventListener("click", (e) => {
      e.preventDefault();
      viewSignUp.style.display = "none";
      viewLogin.style.display = "block";
    });

    document.getElementById("auth-form-signin").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-email").value;
      saveUser({ name: "Mwijay Davie", email: email });
      if (window.SHOP_CO_CART) window.SHOP_CO_CART.showToast("Signed in as Mwijay Davie");
      hideModal();
    });

    document.getElementById("auth-form-signup").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("signup-name").value;
      const email = document.getElementById("signup-email").value;
      saveUser({ name: name, email: email });
      if (window.SHOP_CO_CART) window.SHOP_CO_CART.showToast("Account created successfully!");
      hideModal();
    });

    document.getElementById("auth-btn-logout").addEventListener("click", () => {
      logout();
      hideModal();
    });
  }

  function showModal() {
    renderModal();
    const modal = document.getElementById("shop-tz-auth-modal");
    const viewLogin = document.getElementById("auth-view-login");
    const viewSignUp = document.getElementById("auth-view-signup");
    const viewProfile = document.getElementById("auth-view-profile");

    const user = getUser();
    if (user) {
      viewLogin.style.display = "none";
      viewSignUp.style.display = "none";
      viewProfile.style.display = "block";
      document.getElementById("user-display-name").innerText = user.name;
      document.getElementById("user-display-email").innerText = user.email;
    } else {
      viewLogin.style.display = "block";
      viewSignUp.style.display = "none";
      viewProfile.style.display = "none";
    }

    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
  }

  function hideModal() {
    const modal = document.getElementById("shop-tz-auth-modal");
    if (modal) {
      modal.style.opacity = "0";
      modal.style.pointerEvents = "none";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateProfileUI();

    // Bind profile icons and sign up banner links
    document.addEventListener("click", (e) => {
      if (e.target.closest(".action-header__link.icon-profile") || e.target.closest('a[href="#"]')) {
        const signBtn = e.target.closest('a[href="#"]');
        if (signBtn && signBtn.innerText.includes("Sign Up Now")) {
          e.preventDefault();
          showModal();
        } else if (e.target.closest(".action-header__link.icon-profile")) {
          e.preventDefault();
          showModal();
        }
      }
    });
  });

  window.SHOP_TZ_AUTH = {
    showModal,
    hideModal,
    getUser,
    logout
  };
})();
