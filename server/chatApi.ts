import type { IncomingMessage, ServerResponse } from 'http';

const SYSTEM_PROMPT = `You are the ZAYRO Store assistant for a premium menswear e-commerce site.
Be concise, friendly, and professional. Help with products (jackets, t-shirts, shirts, jeans, cargos), sizing, shipping, returns, payments, and order tracking.
If the user wants to track an order, tell them to tap Track orders in the chat header or sign in to Account → Orders.
If they need a human, suggest WhatsApp from the footer, Contact page, or support@zayrocollection.com.
Do not invent order IDs, prices, or policies. Keep answers short (2–5 sentences).`;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function cleanKey(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function redact(text: string) {
  return text
    .replace(/sk-[A-Za-z0-9_\-]+/g, 'sk-***')
    .replace(/AIza[A-Za-z0-9_\-]+/g, 'AIza***');
}

function geminiKey() {
  return cleanKey(process.env.GEMINI_API_KEY || '');
}

function openaiKey() {
  return cleanKey(process.env.OPENAI_API_KEY || '');
}

export function isChatApi(urlPath: string) {
  return urlPath === '/api/chat';
}

async function replyWithGemini(message: string, history: ChatTurn[]) {
  const key = geminiKey();
  if (!key) return null;

  const preferred = process.env.GEMINI_MODEL?.trim();
  const models = preferred
    ? [preferred]
    : ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3-flash-preview'];

  const contents = [
    ...history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content).slice(0, 2000) }],
      })),
    { role: 'user', parts: [{ text: message }] },
  ];

  let lastError = 'Gemini failed';
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 350,
        },
      }),
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    if (!response.ok) {
      const msg = data.error?.message || `Gemini error (${response.status})`;
      lastError = `${model}: ${msg}`;
      // Model missing / overloaded → try next. Auth/key errors → stop.
      if (/api key|permission|invalid|forbidden|401|403/i.test(msg)) {
        break;
      }
      continue;
    }

    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (reply) return reply;
    lastError = `${model}: Empty reply from Gemini`;
  }

  throw new Error(lastError);
}

async function replyWithOpenAI(message: string, history: ChatTurn[]) {
  const key = openaiKey();
  if (!key || !key.startsWith('sk-')) return null;

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
    { role: 'user' as const, content: message },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      messages,
      temperature: 0.6,
      max_tokens: 350,
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI error (${response.status})`);
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty reply from ChatGPT');
  return reply;
}

export async function handleChatApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const hasGemini = Boolean(geminiKey());
    const hasOpenAI = Boolean(openaiKey() && openaiKey().startsWith('sk-'));

    if (method === 'GET') {
      json(res, 200, {
        ok: true,
        geminiConfigured: hasGemini,
        openaiConfigured: hasOpenAI,
        preferred: hasGemini ? 'gemini' : hasOpenAI ? 'openai' : null,
      });
      return;
    }

    if (method !== 'POST') {
      json(res, 405, { error: 'Method not allowed' });
      return;
    }

    if (!hasGemini && !hasOpenAI) {
      json(res, 503, {
        error: 'AI chat is not configured. Add GEMINI_API_KEY (or OPENAI_API_KEY) to .env and restart the server.',
      });
      return;
    }

    const raw = await readBody(req);
    let parsed: { message?: string; history?: ChatTurn[] } = {};
    try {
      parsed = JSON.parse(raw || '{}') as typeof parsed;
    } catch {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    const message = String(parsed.message || '').trim();
    if (!message) {
      json(res, 400, { error: 'Message is required' });
      return;
    }
    if (message.length > 2000) {
      json(res, 400, { error: 'Message is too long' });
      return;
    }

    const history = Array.isArray(parsed.history) ? parsed.history.slice(-12) : [];

    // Prefer Gemini (user requested); fall back to OpenAI if Gemini fails.
    let reply: string | null = null;
    let provider: 'gemini' | 'openai' | null = null;
    let geminiError = '';
    let openaiError = '';

    if (hasGemini) {
      try {
        reply = await replyWithGemini(message, history);
        provider = 'gemini';
      } catch (error) {
        geminiError = error instanceof Error ? error.message : 'Gemini failed';
      }
    }

    // Prefer Gemini. OpenAI only if explicitly enabled (avoids confusing "no credits" noise).
    const allowOpenAIFallback = process.env.OPENAI_CHAT_FALLBACK === 'true';

    if (!reply && hasOpenAI && allowOpenAIFallback) {
      try {
        reply = await replyWithOpenAI(message, history);
        provider = 'openai';
      } catch (error) {
        openaiError = error instanceof Error ? error.message : 'OpenAI failed';
      }
    }

    if (!reply) {
      const parts = [
        hasGemini ? `Gemini: ${geminiError || 'no reply'}` : null,
        hasOpenAI && allowOpenAIFallback ? `OpenAI: ${openaiError || 'no reply'}` : null,
      ].filter(Boolean);
      json(res, 502, { error: redact(parts.join(' | ') || 'AI reply failed') });
      return;
    }

    json(res, 200, { reply, provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat failed';
    json(res, 502, { error: redact(message) });
  }
}
