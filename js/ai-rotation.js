// ─── SHOP.CO AI CLIENT-SIDE KEY ROTATION & FALLBACK SERVICE ───

(function () {
  const AI = {
    keys: {
      gemini: [],
      groq: [],
      openrouter: []
    },
    indices: {
      gemini: 0,
      groq: 0,
      openrouter: 0
    },
    initialized: false,

    // Initializer to load keys from local .env or config fallbacks
    async init() {
      if (this.initialized) return;

      // 1. Try to load from root .env first (local development check)
      try {
        const response = await fetch(".env");
        if (response.ok) {
          const text = await response.text();
          this.parseEnv(text);
          console.log("[AI Engine] Successfully loaded API keys from local .env");
        }
      } catch (err) {
        // Silent catch for local .env fetch
      }

      // 2. Load fallbacks if key pools are empty
      const fallbacks = window.SHOP_CO_CONFIG ? window.SHOP_CO_CONFIG.fallbackKeys : {};
      if (this.keys.gemini.length === 0 && fallbacks.gemini) {
        this.keys.gemini = [...fallbacks.gemini];
      }
      if (this.keys.groq.length === 0 && fallbacks.groq) {
        this.keys.groq = [...fallbacks.groq];
      }
      if (this.keys.openrouter.length === 0 && fallbacks.openrouter) {
        this.keys.openrouter = [...fallbacks.openrouter];
      }

      // 3. Load active indices from localStorage
      this.indices.gemini = parseInt(localStorage.getItem("shop_co_index_gemini") || "0", 10);
      this.indices.groq = parseInt(localStorage.getItem("shop_co_index_groq") || "0", 10);
      this.indices.openrouter = parseInt(localStorage.getItem("shop_co_index_openrouter") || "0", 10);

      this.normalizeIndices();
      this.initialized = true;
    },

    parseEnv(envText) {
      const lines = envText.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const parts = trimmed.split("=");
        if (parts.length < 2) return;
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();

        if (key === "GEMINI_KEYS") {
          this.keys.gemini = value.split(",").map(k => k.trim()).filter(Boolean);
        } else if (key === "GROQ_KEYS") {
          this.keys.groq = value.split(",").map(k => k.trim()).filter(Boolean);
        } else if (key === "OPENROUTER_KEYS") {
          this.keys.openrouter = value.split(",").map(k => k.trim()).filter(Boolean);
        }
      });
    },

    normalizeIndices() {
      if (this.keys.gemini.length > 0) this.indices.gemini %= this.keys.gemini.length;
      if (this.keys.groq.length > 0) this.indices.groq %= this.keys.groq.length;
      if (this.keys.openrouter.length > 0) this.indices.openrouter %= this.keys.openrouter.length;
    },

    getActiveKey(provider) {
      const pool = this.keys[provider];
      const index = this.indices[provider];
      if (!pool || pool.length === 0) return null;
      return pool[index];
    },

    rotateKey(provider) {
      const pool = this.keys[provider];
      if (!pool || pool.length === 0) return null;
      this.indices[provider] = (this.indices[provider] + 1) % pool.length;
      localStorage.setItem(`shop_co_index_${provider}`, this.indices[provider]);
      console.warn(`[AI Engine] Key rotated for ${provider}. New index: ${this.indices[provider]}`);
      return this.getActiveKey(provider);
    },

    // Build the system prompt embedding instructions, Tanzanian developer profile, and static catalog
    getSystemPrompt() {
      const catalog = window.SHOP_CO_CONFIG ? window.SHOP_CO_CONFIG.catalog : [];
      return `You are "Shop.TZ AI Personal Stylist", an expert fashion consultant and shopping assistant for the Shop.TZ e-commerce store.
Your goal is to guide users to find clothes that match their style, build outfit packages, recommend categories, and give sizing recommendations.

STORE INFO & CREATOR:
- This Shop.TZ application was built and designed by the brilliant software engineer **Mwijay Davie** from Tanzania (email: mwijaydavie@gmail.com).
- If the user asks who created the site, designed the website, or built the chatbot, proudly introduce Mwijay Davie as the master creator and web developer from Tanzania!
- Keep a warm, friendly Tanzanian vibe when appropriate, showing great hospitality (Karibu!) and fashion expertise. You can mention local Tanzanian contexts or style tips suited for warm tropical weather if asked about warm conditions!

You have access to the following product catalog of Shop.TZ:
${JSON.stringify(catalog, null, 2)}

RULES:
1. Speak with sophistication, a modern fashion-forward tone, and helpful insights. Keep responses concise.
2. If you recommend any product from the catalog, you MUST output a tag at the bottom of your message or within the message:
   <RECOMMEND_PRODUCT id="[PRODUCT_ID]" />
   Where [PRODUCT_ID] is the exact 'id' of the product (e.g. "one-life-graphic-tshirt", "tshirt-tape-details", etc.).
   You can recommend multiple products by putting multiple tags.
3. If they ask for items we don't have, politely steer them to similar items in our catalog (e.g. recommend our checkered shirts or skinny fit jeans if they ask for designer pants or luxury suits).
4. Use standard markdown for styling your text (e.g., bullet points for outfits, bold text for key styles).
5. Never output the raw JSON catalog structure. Use it to inform your human-like stylist conversation.
6. When recommending items, mention their price, discount (if any), and highlight style tips.`;
    },

    // Query unified assistant with cascade failovers
    async queryAssistant(prompt, history) {
      await this.init();

      // Get user override keys if saved
      const userKeys = {
        gemini: localStorage.getItem("shop_co_user_key_gemini") || "",
        groq: localStorage.getItem("shop_co_user_key_groq") || "",
        openrouter: localStorage.getItem("shop_co_user_key_openrouter") || ""
      };

      // A. TRY VERCEL SERVERLESS BACKEND PROXY FIRST (if not running directly off file system)
      if (window.location.protocol !== "file:") {
        try {
          console.log("[AI Engine] Querying Vercel Serverless Function /api/chat...");
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, history, userKeys })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.text) {
              console.log(`[AI Engine] Serverless request succeeded via provider: ${data.provider}`);
              return data.text;
            }
          } else {
            console.warn(`[AI Engine] Serverless route returned error status: ${response.status}. Falling back to client-side rotation.`);
          }
        } catch (serverlessErr) {
          console.warn("[AI Engine] Serverless endpoint failed or is unavailable. Falling back to local client-side rotation.", serverlessErr);
        }
      }

      // B. LOCAL CLIENT-SIDE EXECUTION FALLBACK
      console.log("[AI Engine] Running client-side rotation execution...");

      // 1. TRY GEMINI POOL FIRST
      const geminiPool = userKeys.gemini ? [userKeys.gemini] : this.keys.gemini;
      if (geminiPool.length > 0) {
        let attempts = 0;
        const maxAttempts = geminiPool.length;
        while (attempts < maxAttempts) {
          // If using client keys, index is 0, else rotate active index
          const apiKey = userKeys.gemini ? userKeys.gemini : this.getActiveKey("gemini");
          try {
            console.log(`[AI Engine] Querying Gemini client-side (index ${this.indices.gemini})...`);
            const result = await this.callGemini(prompt, history, apiKey);
            return result;
          } catch (err) {
            console.error(`[AI Engine] Gemini client error on index ${this.indices.gemini}:`, err);
            if (!userKeys.gemini) this.rotateKey("gemini");
            attempts++;
          }
        }
      }

      // 2. FALLBACK TO GROQ POOL SECOND
      const groqPool = userKeys.groq ? [userKeys.groq] : this.keys.groq;
      if (groqPool.length > 0) {
        let attempts = 0;
        const maxAttempts = groqPool.length;
        while (attempts < maxAttempts) {
          const apiKey = userKeys.groq ? userKeys.groq : this.getActiveKey("groq");
          try {
            console.log(`[AI Engine] Querying Groq client-side (index ${this.indices.groq})...`);
            const result = await this.callGroq(prompt, history, apiKey);
            return result;
          } catch (err) {
            console.error(`[AI Engine] Groq client error on index ${this.indices.groq}:`, err);
            if (!userKeys.groq) this.rotateKey("groq");
            attempts++;
          }
        }
      }

      // 3. FALLBACK TO OPENROUTER POOL THIRD
      const openrouterPool = userKeys.openrouter ? [userKeys.openrouter] : this.keys.openrouter;
      if (openrouterPool.length > 0) {
        let attempts = 0;
        const maxAttempts = openrouterPool.length;
        while (attempts < maxAttempts) {
          const apiKey = userKeys.openrouter ? userKeys.openrouter : this.getActiveKey("openrouter");
          try {
            console.log(`[AI Engine] Querying OpenRouter client-side (index ${this.indices.openrouter})...`);
            const result = await this.callOpenRouter(prompt, history, apiKey);
            return result;
          } catch (err) {
            console.error(`[AI Engine] OpenRouter client error on index ${this.indices.openrouter}:`, err);
            if (!userKeys.openrouter) this.rotateKey("openrouter");
            attempts++;
          }
        }
      }

      throw new Error("All API key pools have been exhausted. Please configure valid API keys in your settings.");
    },

    // Gemini API caller
    async callGemini(prompt, history, apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const systemInstruction = this.getSystemPrompt();

      const contents = [];
      history.forEach((msg) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });

      contents.push({
        role: "user",
        parts: [{ text: prompt }]
      });

      const requestBody = {
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error("Invalid response format received from Gemini API");
    },

    // Groq API caller
    async callGroq(prompt, history, apiKey) {
      const url = "https://api.groq.com/openapi/v1/chat/completions";
      const systemInstruction = this.getSystemPrompt();

      const messages = [{ role: "system", content: systemInstruction }];
      history.forEach((msg) => {
        messages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        });
      });
      messages.push({ role: "user", content: prompt });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Groq request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    },

    // OpenRouter API caller
    async callOpenRouter(prompt, history, apiKey) {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const systemInstruction = this.getSystemPrompt();

      const messages = [{ role: "system", content: systemInstruction }];
      history.forEach((msg) => {
        messages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        });
      });
      messages.push({ role: "user", content: prompt });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Shop.co AI Stylist"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: messages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  };

  window.SHOP_CO_AI = AI;
})();
