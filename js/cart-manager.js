// ─── SHOP.CO INTERACTIVE CART MANAGER ───
(function () {
  const STORAGE_KEY = "shop_co_cart_items";

  // Get or initialize cart state
  function getCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading cart from localStorage", e);
    }
    // Default initial cart state for first-time visitors (3 items)
    const initial = [
      {
        id: "one-life-graphic-tshirt",
        title: "One Life Graphic T-Shirt",
        price: 35000,
        priceFormatted: "Tsh 35,000",
        size: "Large",
        color: "White",
        image: "img/product-dtl/item-view_1b.webp",
        quantity: 1
      },
      {
        id: "tshirt-tape-details",
        title: "T-Shirt with Tape Details",
        price: 25000,
        priceFormatted: "Tsh 25,000",
        size: "Medium",
        color: "Black",
        image: "img/home/clothes/c1.webp",
        quantity: 1
      },
      {
        id: "skinny-fit-jeans",
        title: "Skinny Fit Jeans",
        price: 55000,
        priceFormatted: "Tsh 55,000",
        size: "Large",
        color: "Blue",
        image: "img/home/clothes/c2.webp",
        quantity: 1
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      updateBadge();
    } catch (e) {
      console.error("Error saving cart", e);
    }
  }

  function getTotalCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function updateBadge() {
    const count = getTotalCount();
    const badges = document.querySelectorAll(".action-header__link.icon-cart span");
    badges.forEach(span => {
      span.innerText = count;
    });
  }

  function addItem(item) {
    const cart = getCart();
    const existingIndex = cart.findIndex(i => i.id === item.id && i.size === item.size && i.color === item.color);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += (item.quantity || 1);
    } else {
      cart.push({
        id: item.id || "item-" + Date.now(),
        title: item.title || "Custom Apparel",
        price: item.price || 35000,
        priceFormatted: item.priceFormatted || ("Tsh " + (item.price || 35000).toLocaleString()),
        size: item.size || "Medium",
        color: item.color || "White",
        image: item.image || "img/home/clothes/c1.webp",
        quantity: item.quantity || 1
      });
    }
    saveCart(cart);
    showToast(`Added "${item.title}" to your cart!`);
  }

  function removeItem(index) {
    const cart = getCart();
    if (index >= 0 && index < cart.length) {
      const removed = cart.splice(index, 1);
      saveCart(cart);
      if (removed.length > 0) {
        showToast(`Removed "${removed[0].title}"`);
      }
    }
  }

  function updateQuantity(index, qty) {
    const cart = getCart();
    if (index >= 0 && index < cart.length) {
      if (qty <= 0) {
        removeItem(index);
      } else {
        cart[index].quantity = qty;
        saveCart(cart);
      }
    }
  }

  function getSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    const discount = Math.round(subtotal * 0.20);
    const deliveryFee = subtotal > 0 ? 5000 : 0;
    const total = subtotal - discount + deliveryFee;
    return {
      subtotal,
      subtotalFormatted: "Tsh " + subtotal.toLocaleString(),
      discount,
      discountFormatted: "-Tsh " + discount.toLocaleString(),
      deliveryFee,
      deliveryFeeFormatted: "Tsh " + deliveryFee.toLocaleString(),
      total,
      totalFormatted: "Tsh " + total.toLocaleString()
    };
  }

  function showToast(message) {
    let toast = document.getElementById("cart-toast-notification");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cart-toast-notification";
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.9rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        z-index: 99999;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        opacity: 0;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }
    toast.innerText = "🛒 " + message;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(-10px)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 2500);
  }

  // DOM Loader Binds
  document.addEventListener("DOMContentLoaded", () => {
    updateBadge();

    // Bind Add to Cart button on product-dtl.html
    const dtlAddBtn = document.querySelector(".action-item__btn.btn");
    if (dtlAddBtn) {
      dtlAddBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const qtyInput = document.querySelector(".quantity__input");
        const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
        
        const selectedSizeInput = document.querySelector('input[name="size"]:checked');
        const size = selectedSizeInput ? selectedSizeInput.value.toUpperCase() : "MEDIUM";
        
        addItem({
          id: "one-life-graphic-tshirt",
          title: "One Life Graphic T-Shirt",
          price: 35000,
          priceFormatted: "Tsh 35,000",
          size: size,
          color: "White",
          image: "img/product-dtl/item-view_1b.webp",
          quantity: qty
        });
      });
    }

    // Render cart items if on cart.html page
    renderCartPageIfNeeded();
  });

  function renderCartPageIfNeeded() {
    const cartContainer = document.querySelector(".your-cart__items.cart-block");
    if (!cartContainer) return;

    function render() {
      const cart = getCart();
      const summary = getSummary();

      if (cart.length === 0) {
        cartContainer.innerHTML = `
          <div style="padding: 48px 20px; text-align: center; background: #ffffff; border-radius: 20px; border: 1px solid #e4e4e7;">
            <div style="font-size: 3.5rem; margin-bottom: 12px;">🛒</div>
            <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Your cart is empty</h3>
            <p style="color: #71717a; font-size: 0.95rem; margin-bottom: 24px;">Explore our collection and add stylish clothes to your cart!</p>
            <a href="category.html" class="btn" style="display: inline-block; padding: 14px 28px; border-radius: 12px;">Browse Catalog</a>
          </div>
        `;
      } else {
        let html = "";
        cart.forEach((item, idx) => {
          html += `
            <div class="cart-block__body" style="margin-bottom: 16px; border: 1px solid #e4e4e7; border-radius: 16px; padding: 16px;">
              <a class="cart-block__image" href="product-dtl.html">
                <img src="${item.image}" alt="${item.title}" style="border-radius: 12px; object-fit: cover;">
              </a>
              <div class="cart-block__inner inner-content">
                <div class="inner-content__top">
                  <h2 class="inner-content__title-s">
                    <a class="inner-content__link" href="product-dtl.html">${item.title}</a>
                  </h2>
                  <button type="button" class="inner-content__delete icon-trash" data-index="${idx}" aria-label="remove item" style="cursor: pointer; color: #ef4444; background: none; border: none; font-size: 1.2rem;">🗑️</button>
                </div>
                <div class="inner-content__size" style="font-size: 0.85rem; color: #71717a;">
                  Size: <span style="color: #000; font-weight: 600;">${item.size || 'Medium'}</span>
                </div>
                <div class="inner-content__color" style="font-size: 0.85rem; color: #71717a;">
                  Color: <span style="color: #000; font-weight: 600;">${item.color || 'White'}</span>
                </div>
                <div class="inner-content__bottom" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <div class="inner-content__price" style="font-weight: 700; font-size: 1.1rem; color: #000;">Tsh ${(item.price * item.quantity).toLocaleString()}</div>
                  <div class="inner-content__quantity quantity" style="display: flex; align-items: center; gap: 8px; background: #f4f4f5; border-radius: 20px; padding: 4px 12px;">
                    <button class="quantity__btn quantity__btn--decrease" data-index="${idx}" style="border: none; background: none; font-weight: bold; cursor: pointer; font-size: 1.1rem;">-</button>
                    <input type="number" class="quantity__input" value="${item.quantity}" readonly style="width: 30px; text-align: center; border: none; background: transparent; font-weight: 700;">
                    <button class="quantity__btn quantity__btn--increase" data-index="${idx}" style="border: none; background: none; font-weight: bold; cursor: pointer; font-size: 1.1rem;">+</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        cartContainer.innerHTML = html;

        // Bind delete buttons
        cartContainer.querySelectorAll(".inner-content__delete").forEach(btn => {
          btn.addEventListener("click", () => {
            const index = parseInt(btn.getAttribute("data-index"), 10);
            removeItem(index);
            render();
          });
        });

        // Bind increase / decrease quantity buttons
        cartContainer.querySelectorAll(".quantity__btn--increase").forEach(btn => {
          btn.addEventListener("click", () => {
            const index = parseInt(btn.getAttribute("data-index"), 10);
            updateQuantity(index, cart[index].quantity + 1);
            render();
          });
        });

        cartContainer.querySelectorAll(".quantity__btn--decrease").forEach(btn => {
          btn.addEventListener("click", () => {
            const index = parseInt(btn.getAttribute("data-index"), 10);
            updateQuantity(index, cart[index].quantity - 1);
            render();
          });
        });
      }

      // Update Summary Sidebar on cart.html or checkout.html
      const summaryItems = document.querySelectorAll(".order-sum__item .order-sum__value");
      if (summaryItems.length >= 3) {
        summaryItems[0].innerText = summary.subtotalFormatted;
        summaryItems[1].innerText = summary.discountFormatted;
        summaryItems[2].innerText = summary.deliveryFeeFormatted;
      }
      const totalEl = document.querySelector(".order-sum__total .order-sum__value");
      if (totalEl) {
        totalEl.innerText = summary.totalFormatted;
      }
    }

    render();
  }

  window.SHOP_CO_CART = {
    getCart,
    addItem,
    removeItem,
    updateQuantity,
    getSummary,
    updateBadge,
    showToast
  };
})();
