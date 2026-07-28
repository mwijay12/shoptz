// ─── SHOP.TZ CATEGORY FILTERING & SORTING ENGINE ───
document.addEventListener("DOMContentLoaded", () => {
  const cardsContainer = document.querySelector(".main-product__cards");
  const sortSelect = document.querySelector(".sort__select select");
  const sidebarLinks = document.querySelectorAll(".sidebar .inner-item__list .list__link");
  const countText = document.querySelector(".sort__text");

  if (!cardsContainer) return;

  // 1. Mark items already in cart with a green "✓ In Cart" badge
  function updateInCartBadges() {
    const cart = window.SHOP_CO_CART ? window.SHOP_CO_CART.getCart() : [];
    const productBodies = cardsContainer.querySelectorAll(".card-item__body");

    productBodies.forEach(body => {
      const titleEl = body.querySelector(".info__title a");
      if (!titleEl) return;
      const titleText = titleEl.innerText.trim().toLowerCase();

      const isInCart = cart.some(item => item.title.toLowerCase().includes(titleText) || titleText.includes(item.title.toLowerCase()));
      
      let badge = body.querySelector(".in-cart-badge");
      if (isInCart) {
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "in-cart-badge";
          badge.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #10b981;
            color: #ffffff;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            z-index: 5;
          `;
          badge.innerText = "✓ In Cart";
          const imgLink = body.querySelector(".card-item__image");
          if (imgLink) {
            imgLink.style.position = "relative";
            imgLink.appendChild(badge);
          }
        }
      } else {
        if (badge) badge.remove();
      }
    });
  }

  updateInCartBadges();

  // Listen to cart updates
  window.addEventListener("storage", updateInCartBadges);

  // 2. Client-side Sorting Handler
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const val = sortSelect.value; // 1: Popular, 2: Cheap, 3: Expensive
      const productBodies = Array.from(cardsContainer.querySelectorAll(".card-item__body"));

      productBodies.sort((a, b) => {
        const getPrice = (el) => {
          const priceSpan = el.querySelector(".price__new");
          if (!priceSpan) return 0;
          return parseInt(priceSpan.innerText.replace(/[^0-9]/g, ""), 10) || 0;
        };

        const priceA = getPrice(a);
        const priceB = getPrice(b);

        if (val === "2" || val === "cheap") {
          return priceA - priceB; // Low to High
        } else if (val === "3" || val === "expensive") {
          return priceB - priceA; // High to Low
        } else {
          return 0; // Default order
        }
      });

      // Re-append sorted cards
      productBodies.forEach(card => cardsContainer.appendChild(card));

      if (window.SHOP_CO_CART) {
        window.SHOP_CO_CART.showToast("Sorted products updated");
      }
    });
  }

  // 3. Category Filter Handler
  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const filterName = link.innerText.trim().toLowerCase();
      const productBodies = cardsContainer.querySelectorAll(".card-item__body");
      let visibleCount = 0;

      productBodies.forEach(body => {
        const titleEl = body.querySelector(".info__title a");
        const titleText = titleEl ? titleEl.innerText.toLowerCase() : "";

        if (filterName === "all" || filterName === "casual" || titleText.includes(filterName) || filterName.includes("shirt") && titleText.includes("shirt")) {
          body.style.display = "block";
          visibleCount++;
        } else {
          body.style.display = "none";
        }
      });

      if (countText) {
        countText.innerText = `Showing ${visibleCount} of ${productBodies.length} Products`;
      }

      // Highlight active sidebar link
      sidebarLinks.forEach(l => l.style.fontWeight = "normal");
      link.style.fontWeight = "bold";
    });
  });
});
