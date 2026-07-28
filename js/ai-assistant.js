// ─── SHOP.CO AI PERSONAL STYLIST FLOATING INTERFACE ───

(function () {
  const DEFAULT_SUGGESTIONS = [
    "Suggest a summer outfit ☀️",
    "Show me casual t-shirts 👕",
    "Help me style black jeans 👖",
    "What are your best checkered looks? 🏁"
  ];

  class AIStylist {
    constructor() {
      this.history = [];
      this.isOpen = false;
      this.isLoading = false;
      
      // Bind event listener helpers
      this.toggle = this.toggle.bind(this);
      this.handleSend = this.handleSend.bind(this);
      this.handleKeyup = this.handleKeyup.bind(this);
      
      this.init();
    }

    init() {
      // Ensure we run on document ready
      if (document.readyState === "complete" || document.readyState === "interactive") {
        this.injectUI();
      } else {
        document.addEventListener("DOMContentLoaded", () => this.injectUI());
      }
    }

    injectUI() {
      // 1. Create floating bubble button
      const bubble = document.createElement("button");
      bubble.id = "ai-stylist-bubble";
      bubble.setAttribute("aria-label", "Open AI Stylist");
      bubble.innerHTML = `
        <div class="ai-bubble-inner">
          <span class="ai-bubble-icon">✨</span>
          <span class="ai-bubble-text">AI Stylist</span>
        </div>
      `;
      bubble.addEventListener("click", this.toggle);
      document.body.appendChild(bubble);

      // 2. Create expanded chat container
      const container = document.createElement("div");
      container.id = "ai-stylist-container";
      container.className = "ai-hidden";
      container.innerHTML = `
        <div class="ai-chat-card">
          <!-- Header -->
          <div class="ai-chat-header">
            <div class="ai-header-profile">
              <div class="ai-header-avatar">🤖</div>
              <div class="ai-header-status">
                <span class="ai-header-name">AI Stylist</span>
                <span class="ai-header-online"><span class="ai-indicator-dot"></span>Online</span>
              </div>
            </div>
            <div class="ai-header-actions">
              <button class="ai-header-btn ai-settings-trigger" title="API Settings">⚙️</button>
              <button class="ai-header-btn ai-close-btn" title="Close">✕</button>
            </div>
          </div>

          <!-- Settings panel -->
          <div class="ai-settings-panel ai-panel-hidden">
            <div class="ai-settings-header">
              <h3>API Credentials</h3>
              <button class="ai-settings-close">✕</button>
            </div>
            <div class="ai-settings-body">
              <div class="ai-input-group">
                <label>Groq API Key</label>
                <input type="password" id="ai-key-groq" placeholder="gsk_..." />
              </div>
              <div class="ai-input-group">
                <label>OpenRouter API Key</label>
                <input type="password" id="ai-key-openrouter" placeholder="sk-or-..." />
              </div>
              <button class="ai-save-settings">Save Keys</button>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="ai-chat-messages" id="ai-messages-area">
            <div class="ai-msg ai-msg-bot">
              <div class="ai-msg-bubble">
                Hello! I am your <strong>Shop.TZ Personal Fashion Stylist</strong>. 🌟
                <br/><br/>
                What style can I help you discover today? Ask me for summer vibes, checkered looks, or sizing tips!
              </div>
            </div>
            <div class="ai-suggestions-grid" id="ai-suggestions-grid"></div>
          </div>

          <!-- Footer Input -->
          <div class="ai-chat-footer">
            <input type="text" id="ai-chat-input" placeholder="Ask your stylist..." />
            <button id="ai-send-btn" aria-label="Send message">✦</button>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Register elements references
      this.container = container;
      this.bubble = bubble;
      this.messagesArea = document.getElementById("ai-messages-area");
      this.suggestionsGrid = document.getElementById("ai-suggestions-grid");
      this.chatInput = document.getElementById("ai-chat-input");
      this.sendBtn = document.getElementById("ai-send-btn");

      // Bind events
      this.sendBtn.addEventListener("click", this.handleSend);
      this.chatInput.addEventListener("keyup", this.handleKeyup);
      container.querySelector(".ai-close-btn").addEventListener("click", this.toggle);

      // Settings interactions
      const settingsPanel = container.querySelector(".ai-settings-panel");
      const settingsTrigger = container.querySelector(".ai-settings-trigger");
      const settingsClose = container.querySelector(".ai-settings-close");
      const saveSettingsBtn = container.querySelector(".ai-save-settings");

      settingsTrigger.addEventListener("click", () => {
        settingsPanel.classList.remove("ai-panel-hidden");
        // Pre-fill keys from local storage
        document.getElementById("ai-key-groq").value = localStorage.getItem("shop_co_user_key_groq") || "";
        document.getElementById("ai-key-openrouter").value = localStorage.getItem("shop_co_user_key_openrouter") || "";
      });

      settingsClose.addEventListener("click", () => {
        settingsPanel.classList.add("ai-panel-hidden");
      });

      saveSettingsBtn.addEventListener("click", () => {
        const groqVal = document.getElementById("ai-key-groq").value.trim();
        const openRouterVal = document.getElementById("ai-key-openrouter").value.trim();

        if (groqVal) localStorage.setItem("shop_co_user_key_groq", groqVal);
        else localStorage.removeItem("shop_co_user_key_groq");

        if (openRouterVal) localStorage.setItem("shop_co_user_key_openrouter", openRouterVal);
        else localStorage.removeItem("shop_co_user_key_openrouter");

        // Sync keys to engine
        if (window.SHOP_CO_AI) {
          if (groqVal) window.SHOP_CO_AI.keys.groq = [groqVal];
          if (openRouterVal) window.SHOP_CO_AI.keys.openrouter = [openRouterVal];
        }

        settingsPanel.classList.add("ai-panel-hidden");
        this.addSystemMessage("Keys saved successfully! Re-routing request pool.");
      });

      this.renderSuggestions(DEFAULT_SUGGESTIONS);
    }

    toggle() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.container.classList.remove("ai-hidden");
        this.bubble.classList.add("ai-bubble-active");
        this.chatInput.focus();
        this.scrollToBottom();
      } else {
        this.container.classList.add("ai-hidden");
        this.bubble.classList.remove("ai-bubble-active");
      }
    }

    renderSuggestions(suggestions) {
      this.suggestionsGrid.innerHTML = "";
      suggestions.forEach((s) => {
        const chip = document.createElement("button");
        chip.className = "ai-suggestion-chip";
        chip.innerText = s;
        chip.addEventListener("click", () => {
          this.chatInput.value = s;
          this.handleSend();
        });
        this.suggestionsGrid.appendChild(chip);
      });
    }

    handleKeyup(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        this.handleSend();
      }
    }

    async handleSend() {
      const text = this.chatInput.value.trim();
      if (!text || this.isLoading) return;

      this.chatInput.value = "";
      this.addMessage("user", text);
      this.renderSuggestions([]); // Clear chips during load

      // Render pulse visualizer load state
      this.showLoader();

      try {
        const aiResponse = await window.SHOP_CO_AI.queryAssistant(text, this.history);
        this.hideLoader();
        this.addMessage("bot", aiResponse);
      } catch (err) {
        this.hideLoader();
        this.addMessage("bot", `⚠️ **Connection Error**: ${err.message || "Failed to contact API providers."}`);
      }

      this.renderSuggestions(DEFAULT_SUGGESTIONS);
    }

    addMessage(sender, text) {
      this.history.push({ sender, text });
      
      const msgDiv = document.createElement("div");
      msgDiv.className = `ai-msg ai-msg-${sender}`;
      
      const bubble = document.createElement("div");
      bubble.className = "ai-msg-bubble";

      // 1. Format text formatting (Markdown-like bold, list, breaks)
      let formattedText = this.formatMarkdown(text);
      bubble.innerHTML = formattedText;
      msgDiv.appendChild(bubble);

      // 2. Parse recommendations
      if (sender === "bot") {
        this.parseRecommendations(text, msgDiv);
      }

      this.messagesArea.insertBefore(msgDiv, this.suggestionsGrid);
      this.scrollToBottom();
    }

    addSystemMessage(text) {
      const sysDiv = document.createElement("div");
      sysDiv.className = "ai-msg-system";
      sysDiv.innerText = text;
      this.messagesArea.insertBefore(sysDiv, this.suggestionsGrid);
      this.scrollToBottom();
    }

    showLoader() {
      this.isLoading = true;
      const loader = document.createElement("div");
      loader.id = "ai-chat-loader";
      loader.className = "ai-msg ai-msg-bot";
      loader.innerHTML = `
        <div class="ai-msg-bubble ai-msg-loader">
          <div class="ai-pulse-bar"></div>
          <div class="ai-pulse-bar"></div>
          <div class="ai-pulse-bar"></div>
        </div>
      `;
      this.messagesArea.insertBefore(loader, this.suggestionsGrid);
      this.scrollToBottom();
    }

    hideLoader() {
      this.isLoading = false;
      const loader = document.getElementById("ai-chat-loader");
      if (loader) {
        loader.remove();
      }
    }

    scrollToBottom() {
      setTimeout(() => {
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
      }, 50);
    }

    formatMarkdown(text) {
      let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Restore recommended product tag
      escaped = escaped.replace(/&lt;RECOMMEND_PRODUCT\s+id="([^"]+)"\s*\/?&gt;/gi, '<RECOMMEND_PRODUCT id="$1" />');

      return escaped
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br/>")
        .replace(/^\s*\*\s+(.*?)(?=<br\/>|$)/gm, "<li>$1</li>")
        .replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
    }

    parseRecommendations(text, containerDiv) {
      const regex = /<RECOMMEND_PRODUCT\s+id="([^"]+)"\s*\/>/gi;
      let match;
      let recommendations = [];

      while ((match = regex.exec(text)) !== null) {
        const prodId = match[1];
        if (recommendations.includes(prodId)) continue;
        recommendations.push(prodId);
      }

      if (recommendations.length === 0) return;

      const catalog = window.SHOP_CO_CONFIG ? window.SHOP_CO_CONFIG.catalog : [];

      recommendations.forEach((prodId) => {
        const product = catalog.find(p => p.id === prodId);
        if (!product) return;

        const card = document.createElement("div");
        card.className = "ai-product-card";
        card.innerHTML = `
          <div class="ai-prod-image-wrapper">
            <img src="${product.image}" alt="${product.title}" onerror="this.src='img/icons/star-fill.svg'" />
          </div>
          <div class="ai-prod-details">
            <span class="ai-prod-category">${product.category}</span>
            <h4 class="ai-prod-title">${product.title}</h4>
            <div class="ai-prod-rating">⭐ ${product.rating}</div>
            <div class="ai-prod-pricing">
              <span class="ai-price-new">${product.price}</span>
              ${product.oldPrice ? `<span class="ai-price-old">${product.oldPrice}</span>` : ""}
              ${product.discount ? `<span class="ai-price-discount">${product.discount}</span>` : ""}
            </div>
            <a href="${product.link}" class="ai-view-btn">View Product ✦</a>
          </div>
        `;
        containerDiv.appendChild(card);
      });
    }
  }

  // Load custom settings key overrides on boot
  const userGemini = localStorage.getItem("shop_co_user_key_gemini");
  const userGroq = localStorage.getItem("shop_co_user_key_groq");
  const userOpenRouter = localStorage.getItem("shop_co_user_key_openrouter");

  if (window.SHOP_CO_AI) {
    if (userGemini) window.SHOP_CO_AI.keys.gemini = [userGemini];
    if (userGroq) window.SHOP_CO_AI.keys.groq = [userGroq];
    if (userOpenRouter) window.SHOP_CO_AI.keys.openrouter = [userOpenRouter];
  }

  // Instantiate chatbot widget
  window.ShopCoStylistWidget = new AIStylist();
})();
