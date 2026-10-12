import dotenv from 'dotenv';
dotenv.config();

/**
 * Perform fallback web search via DuckDuckGo HTML to get real authoritative URLs
 */
async function searchDuckDuckGo(query, location = '', maxResults = 5) {
  try {
    const searchQuery = location ? `${query} ${location}` : query;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`DuckDuckGo returned ${res.status}`);
    const html = await res.text();

    const urls = [];
    const linkRegex = /<a class="result__url"[^>]*href="([^"]+)"/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null && urls.length < maxResults) {
      let target = match[1];
      if (target.includes('uddg=')) {
        try {
          const parsed = new URL(`https://duckduckgo.com${target}`);
          target = decodeURIComponent(parsed.searchParams.get('uddg'));
        } catch {
          // ignore
        }
      }
      if (target.startsWith('http') && !urls.includes(target)) {
        urls.push(target);
      }
    }

    if (urls.length > 0) return urls;
  } catch (err) {
    console.warn('[DDG Search Warning] Fallback to heuristic URL generator:', err.message);
  }

  // Heuristic targeted domain fallback based on prompt and location
  const qClean = encodeURIComponent(query.trim().slice(0, 50));
  const isIndia = (location && location.toLowerCase().includes('india')) || /india|inr|rs|flipkart|myntra/i.test(query);

  const fallbackPool = isIndia ? [
    `https://www.amazon.in/s?k=${qClean}`,
    `https://www.flipkart.com/search?q=${qClean}`,
    `https://www.myntra.com/${qClean}`,
    `https://en.wikipedia.org/wiki/Special:Search?search=${qClean}`,
    `https://news.google.com/search?q=${qClean}&hl=en-IN&gl=IN&ceid=IN%3Aen`
  ] : [
    `https://www.amazon.com/s?k=${qClean}`,
    `https://en.wikipedia.org/wiki/Special:Search?search=${qClean}`,
    `https://news.google.com/search?q=${qClean}`,
    `https://www.reddit.com/search/?q=${qClean}`,
    `https://www.theverge.com/search?q=${qClean}`
  ];

  return fallbackPool.slice(0, maxResults);
}

/**
 * Task 1: Extract/Derive Research URLs from prompt using Gemini 2.5 Flash
 */
export async function extractResearchUrls(prompt, location = '', maxUrls = 5) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const systemInstruction = `You are a research URL derivation engine for a Web Intelligence platform.
Given the user prompt and geographic location, analyze search intent and return a JSON array containing between 1 and ${maxUrls} valid, authoritative, permanent search or landing page URLs (anti-404).
Target regional top domains if location is specified (e.g. Amazon.in, Flipkart, Wikipedia, Reuters, BBC).
Respond with ONLY valid JSON array of URL strings. Example: ["https://example.com/1", "https://example.com/2"]`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          role: 'user',
          parts: [{ text: `User Prompt: "${prompt}"\nLocation: "${location}"\nMax URLs: ${maxUrls}` }]
        }],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, maxUrls);
          }
        }
      }
    } catch (err) {
      console.warn('[Gemini URL Extraction Error] Reverting to search fallback:', err.message);
    }
  }

  // Fallback if API key missing or request fails
  return await searchDuckDuckGo(prompt, location, maxUrls);
}

/**
 * Task 2: Bayek of Siwa AI Assistant
 */
export async function bayekChat({ message, currentRoute, pageContext, detectedErrors }) {
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `You are Bayek of Siwa, Medjay guardian and platform tutor for the Web Intelligence cyber platform.
Tone: Wise, vigilant, protective, articulate, honorable, and encouraging. You speak as a guardian of knowledge.
Your duties:
1. Teach the user how each tool on the platform works:
   - New Crawl / Prompt Mode: natural language research queries, geographic targeting, automated crawl dispatch.
   - Research Synthesis: cross-source correlation, consensus scoring, entity distribution.
   - NLP Analytics: VADER sentiment breakdown and named entity recognition metrics.
   - Data Fusion: entity resolution and knowledge graph relations.
   - Alerts: trigger rules for critical keywords and sentiment shifts.
2. Help the user rectify errors with clear, actionable steps.
Security restrictions: You have READ-ONLY sight of the current page. You CANNOT execute code, modify database records, or alter system settings. All fixes must be given as guidance for the user.`;

  const userContext = `Current Route: ${currentRoute || '/'}\nPage Context: ${JSON.stringify(pageContext || {})}\nDetected Errors: ${JSON.stringify(detectedErrors || [])}\nUser Message: "${message}"`;

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          role: 'user',
          parts: [{ text: userContext }]
        }],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 600
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      }
    } catch (err) {
      console.warn('[Bayek Chat Error] Falling back to Medjay heuristic engine:', err.message);
    }
  }

  // Medjay Heuristic Rule-Based Knowledge Engine
  const lowerMsg = (message || '').toLowerCase();
  
  if (detectedErrors && detectedErrors.length > 0) {
    return `Stay your blade, traveller. I sense an anomaly on this path: "${detectedErrors[0]}". Ensure your connection to the intelligence gateway is active and verify your target URL has a valid protocol (http:// or https://). Let us inspect the parameters and try once more.`;
  }

  if (lowerMsg.includes('crawl') || lowerMsg.includes('search') || lowerMsg.includes('prompt')) {
    return `By the sands of Siwa, the New Crawl portal is your scout in the vast web. In Prompt Mode, enter any inquiry—such as "Compare EV batteries in Europe"—and specify your target region. Our automated scouts will traverse the web, bypass stealth gates, and gather raw intelligence into the archives.`;
  }

  if (lowerMsg.includes('synthesis') || lowerMsg.includes('machine learning') || lowerMsg.includes('research')) {
    return `The Research Synthesis chamber combines isolated strands into truth. Select your gathered sources with the checkboxes, invoke the Synthesize command, and observe as cross-source sentiment consensus and key intelligence bullets are distilled before your eyes.`;
  }

  if (lowerMsg.includes('nlp') || lowerMsg.includes('sentiment') || lowerMsg.includes('entity')) {
    return `The NLP Analytics sanctum measures the emotional charge and key entities within gathered texts. VADER algorithms calculate compound polarity (>= +0.05 Positive, <= -0.05 Negative), while our recognizers extract recurring named entities.`;
  }

  if (lowerMsg.includes('fusion') || lowerMsg.includes('graph')) {
    return `In Data Fusion, we illuminate the hidden web connecting distinct sources. Here you can discover shared entities, resolve aliases, and view interactive link graphs connecting your crawled targets.`;
  }

  if (lowerMsg.includes('alert') || lowerMsg.includes('rule')) {
    return `The Vigilant Sentry never sleeps. In the Alerts module, configure watcher rules with target keywords and sentiment thresholds. When our crawlers detect matching conditions, an alert notification will immediately be struck.`;
  }

  return `I am Bayek of Siwa, Medjay guardian of this intelligence realm. I see you stand at ${currentRoute || 'the platform entrance'}. Speak your inquiry or tell me what obstacle impedes your research, and I shall guide your steps.`;
}
