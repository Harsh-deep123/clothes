import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, ShoppingBag, X, Mail, ThumbsUp, ThumbsDown } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type SupportChatWidgetProps = {
  onTrackOrder: () => void;
  onOpenCart: () => void;
  onNavigateContact: () => void;
};

const ADMIN_WHATSAPP_HREF = `https://wa.me/917681987334?text=${encodeURIComponent(
  "Hello ZAYRO Store! 👋 Thank you for visiting ZAYRO Store. We're happy to have you here! 👋 How can we help you today?"
)}`;

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function replyFor(input: string): string {
  const q = input.toLowerCase().trim();

  if (!q) {
    return 'Hi, how can I help?';
  }
  if (/track|order status|where.*order|delivery status|shipping status/.test(q)) {
    return 'You can track your order from Account → Orders, or tap Track orders above. Sign in if you are not already.';
  }
  if (/return|exchange|refund/.test(q)) {
    return 'Returns are easy from your account orders page within the return window. Need help starting one? Visit Returns under Support, or contact support@zayrocollection.com.';
  }
  if (/size|fit|sizing/.test(q)) {
    return 'Open any product and tap Size Guide for measurements. Still unsure? Tell me the product name and I will point you to the right fit tips.';
  }
  if (/ship|delivery|how long|cod|cash on delivery/.test(q)) {
    return 'Delivery timing depends on your location. At checkout you will see the available options and ETA. COD may be available in selected areas.';
  }
  if (/payment|pay|card|upi|stripe/.test(q)) {
    return 'We accept secure card and supported digital payments at checkout. Your payment details are never stored on ZAYRO servers.';
  }
  if (/hello|hi|hlo|hey|namaste|sat sri|hola/.test(q)) {
    return 'Hi, how can I help?';
  }
  if (/price|sale|discount|coupon/.test(q)) {
    return 'Current offers appear on Sale and product pages. Cart totals update automatically with applicable discounts at checkout.';
  }
  if (/contact|support|help|human|agent|whatsapp/.test(q)) {
    return 'You can message us on WhatsApp from the footer, email support@zayrocollection.com, or open the Contact page. I am here for quick answers anytime.';
  }
  if (/jacket|t-?shirt|shirt|jeans|cargo|product|stock/.test(q)) {
    return 'Browse categories from the top menu or Shop by Category on Home. Use Search to find a specific piece. Want me to guide you to New Arrivals?';
  }

  return 'Thanks for your message. For order tracking tap Track orders above. For anything else, try Contact or WhatsApp — or ask me about shipping, sizes, returns, or products.';
}

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
  onTrackOrder,
  onOpenCart,
  onNavigateContact,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, how can I help?',
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, [open, messages, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const history = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    setBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      let reply = data.reply?.trim() || '';

      if (!response.ok || !reply) {
        const err = (data.error || '').toLowerCase();
        if (err.includes('gemini:')) {
          const geminiOnly = (data.error || '').split('|')[0].replace(/^Gemini:\s*/i, '').trim();
          reply = `Gemini reply nahi aayi: ${geminiOnly}`;
        } else if (err.includes('credit') || err.includes('billing') || err.includes('quota')) {
          reply =
            'AI connected hai, par API credits/quota khatam ne. Gemini/OpenAI billing check karo, phir dubara try karo.';
        } else if (err.includes('not configured') || err.includes('api key')) {
          reply =
            'AI key configure nahi hai. .env vich GEMINI_API_KEY check karo te server restart karo.';
        } else if (data.error) {
          reply = `AI reply nahi aaya: ${data.error}`;
        } else {
          reply = replyFor(trimmed);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'Server tak message nahi pahunchya. Dev server running hai? Phir try karo.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="zayro-support-chat fixed z-[90] bottom-5 left-5 md:bottom-6 md:left-6 flex flex-col items-start gap-3">
      {open && (
        <section
          className="zayro-support-panel w-[min(100vw-2.5rem,380px)] h-[min(72vh,560px)] bg-white border border-[#cfc4c5]/40 shadow-2xl flex flex-col overflow-hidden"
          aria-label="ZAYRO support chat"
        >
          <header className="flex items-center gap-2 px-3 py-3 border-b border-[#cfc4c5]/30 bg-white shrink-0">
            <button
              type="button"
              aria-label="Minimize chat"
              onClick={() => setOpen(false)}
              className="p-1.5 text-[#5d5f5f] hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Open shopping bag"
              onClick={() => {
                setOpen(false);
                onOpenCart();
              }}
              className="p-1.5 text-[#5d5f5f] hover:text-black transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onTrackOrder();
              }}
              className="ml-1 text-[11px] uppercase tracking-[0.12em] font-semibold px-3 py-1.5 border border-black text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              Track orders
            </button>
            <a
              href={ADMIN_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with admin on WhatsApp"
              title="WhatsApp"
              className="p-1.5 text-[#25D366] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="ml-auto p-1.5 text-[#5d5f5f] hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f9f9f9]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white text-[#1a1c1c] border border-[#cfc4c5]/30'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="flex items-center gap-2 mt-1.5 text-[#5d5f5f]">
                    <button type="button" aria-label="Helpful" className="p-0.5 hover:text-black cursor-pointer">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" aria-label="Not helpful" className="p-0.5 hover:text-black cursor-pointer">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-start">
                <div className="bg-white border border-[#cfc4c5]/30 px-3.5 py-2.5 text-sm text-[#5d5f5f]">
                  Typing…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="shrink-0 border-t border-[#cfc4c5]/30 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <div className="flex items-center gap-2 border border-[#cfc4c5]/40 px-3 py-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Reply"
                className="flex-1 bg-transparent text-sm text-[#1a1c1c] outline-none placeholder:text-[#5d5f5f]"
                aria-label="Message"
              />
              <button
                type="button"
                aria-label="Contact support"
                title="Contact page"
                onClick={() => {
                  setOpen(false);
                  onNavigateContact();
                }}
                className="p-1 text-[#5d5f5f] hover:text-black transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-[#5d5f5f] tracking-wide">
              ZAYRO assistant ·{' '}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onNavigateContact();
                }}
                className="underline hover:text-black cursor-pointer"
              >
                Privacy / Contact
              </button>
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        id="zayro-support-chat-btn"
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-black text-white shadow-2xl flex items-center justify-center hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6 stroke-[1.5]" />}
      </button>
    </div>
  );
};
