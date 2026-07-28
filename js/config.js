// ─── SHOP.TZ ASSISTANT CONFIGURATION & CATALOG ───

window.SHOP_CO_CONFIG = {
  // Pre-configured fallback keys (exposed client-side for portfolio static hosting)
  // ⚠️ API keys removed for security. Add your own keys via .env or localStorage.
  // See .env.example for the required format.
  fallbackKeys: {
    gemini: [],
    groq: [],
    openrouter: []
  },

  // E-Commerce product catalog with realistic Tanzanian Shillings prices
  catalog: [
    {
      id: "one-life-graphic-tshirt",
      title: "One Life Graphic T-Shirt",
      category: "T-Shirts",
      price: "Tsh 35,000",
      oldPrice: "Tsh 45,000",
      discount: "-20%",
      rating: "4.5 / 5",
      image: "img/home/clothes/african_model1.png",
      description: "Perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and African urban style.",
      link: "product-dtl.html"
    },
    {
      id: "tshirt-tape-details",
      title: "T-Shirt with Tape Details",
      category: "T-Shirts",
      price: "Tsh 25,000",
      oldPrice: "Tsh 35,000",
      discount: "-28%",
      rating: "4.5 / 5",
      image: "img/home/clothes/c1.webp",
      description: "A trendy t-shirt featuring modern tape detailing on the sleeves, made from 100% fine cotton.",
      link: "product-dtl.html"
    },
    {
      id: "skinny-fit-jeans",
      title: "Skinny Fit Jeans",
      category: "Jeans",
      price: "Tsh 50,000",
      oldPrice: "Tsh 65,000",
      discount: "-23%",
      rating: "3.5 / 5",
      image: "img/home/clothes/c2.webp",
      description: "Sleek, stretchy, and stylish skinny fit denim jeans designed to match casual or formal wear.",
      link: "category.html"
    },
    {
      id: "checkered-shirt",
      title: "Checkered Shirt",
      category: "Shirts",
      price: "Tsh 35,000",
      oldPrice: null,
      discount: null,
      rating: "5.0 / 5",
      image: "img/home/clothes/c3.webp",
      description: "Classic black and white checkered design shirt, perfect as an overshirt or standalone formal-casual top.",
      link: "product-dtl.html"
    },
    {
      id: "sleeve-striped-tshirt",
      title: "Sleeve Striped T-Shirt",
      category: "T-Shirts",
      price: "Tsh 30,000",
      oldPrice: "Tsh 40,000",
      discount: null,
      rating: "4.5 / 5",
      image: "img/home/clothes/c4.webp",
      description: "Retro striped sleeve details on a lightweight athletic-cut casual crewneck t-shirt.",
      link: "product-dtl.html"
    }
  ]
};

// ─── AUTOMATED REALISTIC CURRENCY CONVERTER (USD -> TZS) ───
document.addEventListener("DOMContentLoaded", () => {
  const priceMap = {
    "151": "25,000",
    "260": "35,000",
    "300": "45,000",
    "500": "75,000",
    "450": "65,000",
    "145": "30,000",
    "565": "110,000",
    "113": "22,000",
    "15": "5,000",
    "467": "93,000"
  };

  function convertElement(el) {
    if (el.childNodes.length > 0) {
      el.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          let text = child.nodeValue;
          // Match patterns like $260, -$113, $151, $145, $15, $565
          const matches = text.match(/-?\$[0-9,]+/g);
          if (matches) {
            matches.forEach(m => {
              const isNegative = m.startsWith("-");
              const numStr = m.replace(/[-\$]/g, "").replace(/,/g, "");
              let converted = "";
              if (priceMap[numStr]) {
                converted = priceMap[numStr];
              } else {
                const val = parseFloat(numStr);
                if (!isNaN(val)) {
                  converted = Math.round(val * 200).toLocaleString();
                }
              }
              if (converted) {
                const replacement = `${isNegative ? '-' : '' }Tsh ${converted}`;
                text = text.replace(m, replacement);
              }
            });
            child.nodeValue = text;
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (!child.classList.contains("ai-chat-card") && 
              !child.classList.contains("ai-settings-panel") &&
              !child.classList.contains("product-preview-card")) {
            convertElement(child);
          }
        }
      });
    }
  }

  // Run conversion across page layout
  convertElement(document.body);
});
