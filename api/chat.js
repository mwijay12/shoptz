// ─── SECURE VERCEL SERVERLESS BACKEND FOR KEY ROTATION ───
// This file executes on Vercel's backend, keeping API keys 100% secure from the client browser.

let activeIndices = {
  gemini: 0,
  groq: 0,
  openrouter: 0
};

// Main serverless handler
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, history, userKeys } = req.body;

    // Build the system instructions
    const systemPrompt = getSystemPrompt();

    // 1. Check if user provided their own keys from client-side config
    let geminiPool = [];
    let groqPool = [];
    let openrouterPool = [];

    if (userKeys && userKeys.gemini) geminiPool = [userKeys.gemini];
    if (userKeys && userKeys.groq) groqPool = [userKeys.groq];
    if (userKeys && userKeys.openrouter) openrouterPool = [userKeys.openrouter];

    // If client didn't override, pull key pools from Vercel process.env variables
    if (geminiPool.length === 0 && process.env.GEMINI_KEYS) {
      geminiPool = process.env.GEMINI_KEYS.split(",").map(k => k.trim()).filter(Boolean);
    }
    if (geminiPool.length === 0 && process.env.GEMINI_API_KEY) {
      geminiPool = [process.env.GEMINI_API_KEY.trim()];
    }

    if (groqPool.length === 0 && process.env.GROQ_KEYS) {
      groqPool = process.env.GROQ_KEYS.split(",").map(k => k.trim()).filter(Boolean);
    }

    if (openrouterPool.length === 0 && process.env.OPENROUTER_KEYS) {
      openrouterPool = process.env.OPENROUTER_KEYS.split(",").map(k => k.trim()).filter(Boolean);
    }

    // 2. Execute cascading API calls with rotation
    // Try Gemini first
    if (geminiPool.length > 0) {
      let attempts = 0;
      const maxAttempts = geminiPool.length;
      while (attempts < maxAttempts) {
        activeIndices.gemini %= geminiPool.length;
        const apiKey = geminiPool[activeIndices.gemini];
        try {
          const aiResponse = await callGemini(prompt, history, systemPrompt, apiKey);
          return res.status(200).json({ text: aiResponse, provider: "gemini" });
        } catch (err) {
          console.error(`[Serverless AI] Gemini fail on index ${activeIndices.gemini}:`, err.message);
          activeIndices.gemini = (activeIndices.gemini + 1) % geminiPool.length;
          attempts++;
        }
      }
    }

    // Try Groq fallback second
    if (groqPool.length > 0) {
      let attempts = 0;
      const maxAttempts = groqPool.length;
      while (attempts < maxAttempts) {
        activeIndices.groq %= groqPool.length;
        const apiKey = groqPool[activeIndices.groq];
        try {
          const aiResponse = await callGroq(prompt, history, systemPrompt, apiKey);
          return res.status(200).json({ text: aiResponse, provider: "groq" });
        } catch (err) {
          console.error(`[Serverless AI] Groq fail on index ${activeIndices.groq}:`, err.message);
          activeIndices.groq = (activeIndices.groq + 1) % groqPool.length;
          attempts++;
        }
      }
    }

    // Try OpenRouter fallback third
    if (openrouterPool.length > 0) {
      let attempts = 0;
      const maxAttempts = openrouterPool.length;
      while (attempts < maxAttempts) {
        activeIndices.openrouter %= openrouterPool.length;
        const apiKey = openrouterPool[activeIndices.openrouter];
        try {
          const aiResponse = await callOpenRouter(prompt, history, systemPrompt, apiKey);
          return res.status(200).json({ text: aiResponse, provider: "openrouter" });
        } catch (err) {
          console.error(`[Serverless AI] OpenRouter fail on index ${activeIndices.openrouter}:`, err.message);
          activeIndices.openrouter = (activeIndices.openrouter + 1) % openrouterPool.length;
          attempts++;
        }
      }
    }

    return res.status(500).json({ error: "All backend API key pools have been exhausted. Please configure valid keys." });

  } catch (globalErr) {
    console.error("[Serverless AI] Global internal crash:", globalErr);
    return res.status(500).json({ error: "Internal server error: " + globalErr.message });
  }
};

// System prompt with Mwijay Davie credits and Tanzanian environment touch
function getSystemPrompt() {
  const catalog = [
    {
      id: "one-life-graphic-tshirt",
      title: "One Life Graphic T-Shirt",
      category: "T-Shirts",
      price: "Tsh 35,000",
      oldPrice: "Tsh 45,000",
      discount: "-20%",
      rating: "4.5 / 5",
      image: "img/home/clothes/african_model1.png",
      description: "Perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and style.",
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
  ];

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
6. When recommending items, explain prices in Tanzanian Shillings (Tsh) and highlight style tips.`;
}

// Call Gemini
async function callGemini(prompt, history, systemPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    })
  });

  if (!response.ok) throw new Error(`Gemini status ${response.status}`);
  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error("Invalid Gemini response body structure");
}

// Call Groq
async function callGroq(prompt, history, systemPrompt, apiKey) {
  const url = "https://api.groq.com/openapi/v1/chat/completions";
  const messages = [{ role: "system", content: systemPrompt }];
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

  if (!response.ok) throw new Error(`Groq status ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// Call OpenRouter
async function callOpenRouter(prompt, history, systemPrompt, apiKey) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const messages = [{ role: "system", content: systemPrompt }];
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
      "HTTP-Referer": "https://vercel.com",
      "X-Title": "Shop.co AI Stylist"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`OpenRouter status ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}
