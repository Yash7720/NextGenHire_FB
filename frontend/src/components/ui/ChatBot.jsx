import { useState, useRef, useEffect } from 'react'

const QUICK_PROMPTS = [
  'How do I earn XP?',
  'Show me beginner courses',
  'How does hiring work?',
  'What are daily quests?',
]

/**
 * Renders markdown-like text with code blocks, inline code, bold, and lists.
 * Ensures nothing overflows the chat bubble.
 */
function FormatText({ text }) {
    if (!text) return null;

    // Split text into code blocks and regular text segments
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        // Push text before code block
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        // Push code block
        segments.push({ type: 'code', lang: match[1], content: match[2].trim() });
        lastIndex = match.index + match[0].length;
    }
    // Push remaining text
    if (lastIndex < text.length) {
        segments.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return (
        <div style={{ overflowWrap: 'break-word', wordBreak: 'break-word', minWidth: 0 }}>
            {segments.map((seg, si) => {
                if (seg.type === 'code') {
                    return (
                        <pre key={si} style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(0,245,255,0.15)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            margin: '8px 0',
                            fontSize: 12,
                            lineHeight: 1.5,
                            overflowX: 'auto',
                            whiteSpace: 'pre',
                            maxWidth: '100%',
                        }}>
                            <code style={{ color: '#a5f3fc', fontFamily: "'Fira Code', 'Consolas', monospace" }}>
                                {seg.content}
                            </code>
                        </pre>
                    );
                }

                // Regular text: split by newlines and render
                const lines = seg.content.split('\n');
                return lines.map((line, i) => {
                    let processed = line.trim();
                    if (!processed) return <div key={`${si}-${i}`} style={{ height: 6 }} />;

                    // Handle inline code: `code`
                    const inlineCodeRegex = /`([^`]+)`/g;
                    // Handle bold: **text**
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    // Handle list items
                    const isListItem = processed.startsWith('* ') || processed.startsWith('- ');
                    if (isListItem) processed = processed.slice(2);

                    // Process inline formatting
                    const renderFormatted = (str) => {
                        const tokens = [];
                        let remaining = str;
                        let key = 0;

                        while (remaining.length > 0) {
                            const boldMatch = /\*\*(.*?)\*\*/.exec(remaining);
                            const codeMatch = /`([^`]+)`/.exec(remaining);

                            // Find earliest match
                            let earliest = null;
                            let type = null;
                            if (boldMatch && (!earliest || boldMatch.index < earliest.index)) { earliest = boldMatch; type = 'bold'; }
                            if (codeMatch && (!earliest || codeMatch.index < earliest.index)) { earliest = codeMatch; type = 'code'; }

                            if (!earliest) {
                                tokens.push(<span key={key++}>{remaining}</span>);
                                break;
                            }

                            // Text before match
                            if (earliest.index > 0) {
                                tokens.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
                            }

                            if (type === 'bold') {
                                tokens.push(<strong key={key++} style={{ color: '#fff', fontWeight: 700 }}>{earliest[1]}</strong>);
                            } else {
                                tokens.push(
                                    <code key={key++} style={{
                                        background: 'rgba(0,245,255,0.1)',
                                        border: '1px solid rgba(0,245,255,0.2)',
                                        borderRadius: 4,
                                        padding: '1px 5px',
                                        fontSize: '0.85em',
                                        color: '#a5f3fc',
                                        fontFamily: "'Fira Code', 'Consolas', monospace",
                                    }}>{earliest[1]}</code>
                                );
                            }

                            remaining = remaining.slice(earliest.index + earliest[0].length);
                        }
                        return tokens;
                    };

                    return (
                        <p key={`${si}-${i}`} style={{
                            margin: '3px 0',
                            paddingLeft: isListItem ? 14 : 0,
                            position: 'relative',
                        }}>
                            {isListItem && <span style={{ position: 'absolute', left: 2, color: '#00f5ff' }}>•</span>}
                            {renderFormatted(processed)}
                        </p>
                    );
                });
            })}
        </div>
    );
}

export default function ChatBot() {
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [unread, setUnread]     = useState(0)
  const [messages, setMessages] = useState([
    {
      id: 1, from: 'bot',
      text: "Hey! 👋 I'm the NextGenHire assistant. I can help with courses, professional XP, and your career path. What can I help you with today?",
    },
  ])
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || typing) return

    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: trimmed }])
    setInput('')
    setTyping(true)

    // 1. Map internal messages to Gemini history format
    // Gemini requires the FIRST message in history to be from the 'user'.
    // We filter out the initial bot greeting to satisfy this.
    const history = messages
      .map(m => ({
        role: m.from === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }))
      .filter((m, i) => !(i === 0 && m.role === 'model'))

    try {
      const res = await fetch("http://localhost:5002/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: trimmed,
          history: history 
        })
      })

      const data = await res.json()

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', text: data.reply }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', text: "Connection error. Please ensure the backend is running." }
      ])
    }

    setTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      {/* ── Chat window ──────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[900] flex flex-col animate-fade-up"
          style={{ width: 380, height: 560 }}
        >
          <div
            className="flex flex-col h-full rounded-2xl overflow-hidden glass-dark"
            style={{
              background: 'rgba(10, 15, 30, 0.95)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              boxShadow: '0 0 40px rgba(0,245,255,0.08), 0 24px 60px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.08),rgba(139,92,246,0.08))', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#00f5ff,#8b5cf6)', boxShadow: '0 0 15px rgba(0,245,255,0.3)' }}
                >🤖</div>
                <div>
                  <div className="font-orbitron text-[12px] text-cyan tracking-[0.2em] leading-tight font-bold">NEXTGEN AI</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-[10px] text-neon-green/70 uppercase tracking-widest font-rajdhani">System Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[88%] px-4 py-3.5 text-sm leading-relaxed font-rajdhani shadow-sm ${
                      msg.from === 'user' 
                        ? 'bg-cyan/10 border border-cyan/20 text-slate-200 rounded-2xl rounded-tr-none' 
                        : 'bg-[#161b2e] border border-white/5 text-slate-300 rounded-2xl rounded-tl-none'
                    }`}
                    style={{ overflow: 'hidden', minWidth: 0 }}
                  >
                    {msg.from === 'bot' ? <FormatText text={msg.text} /> : msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start">
                   <div className="bg-[#161b2e] border border-white/5 px-5 py-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan/50"
                          style={{ animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto shrink-0 bg-black/20"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="shrink-0 text-[11px] font-orbitron px-4 py-2 rounded-lg transition-all whitespace-nowrap text-cyan/70 hover:text-cyan border border-cyan/20 hover:border-cyan/40 bg-cyan/5"
                >{p}</button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-5 pt-3 shrink-0">
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#0f1628] border border-white/10 focus-within:border-cyan/50 transition-all shadow-inner">
                <textarea
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600 font-rajdhani resize-none max-h-32"
                  placeholder="Message NextGen AI..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || typing}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={{
                    background: input.trim() && !typing ? 'linear-gradient(135deg,#00f5ff,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                    cursor: input.trim() && !typing ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: 13, color: input.trim() && !typing ? '#050810' : '#4a5568' }}>▲</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-3 font-orbitron tracking-widest opacity-60">
                POWERED BY NEXTGEN AI
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB toggle button ────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-6 right-6 z-[901] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95"
        style={{
          background: open ? '#0a0f1e' : 'linear-gradient(135deg,#00f5ff,#8b5cf6)',
          border: open ? '2px solid rgba(0, 245, 255, 0.5)' : 'none',
          boxShadow: open
            ? '0 0 30px rgba(0,245,255,0.2)'
            : '0 0 30px rgba(0,245,255,0.4), 0 10px 30px rgba(0,0,0,0.5)',
        }}
        title={open ? 'Close' : 'Chat with NextGen AI'}
      >
        <div className="relative w-full h-full flex items-center justify-center">
            <span className="text-2xl transition-all duration-300" style={{ transform: open ? 'rotate(90deg) scale(0)' : 'rotate(0deg) scale(1)', position: 'absolute', opacity: open ? 0 : 1 }}>🤖</span>
            <span className="text-2xl transition-all duration-300" style={{ transform: open ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)', position: 'absolute', opacity: open ? 1 : 0 }}>✕</span>
        </div>

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-orbitron text-[9px] font-bold text-white"
            style={{ background: '#ff2d78', boxShadow: '0 0 10px rgba(255,45,120,0.7)' }}
          >{unread}</span>
        )}

        {/* Pulsing ring when closed */}
        {!open && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ animation: 'pulseGlow 2.5s ease-in-out infinite', border: '2px solid rgba(0,245,255,0.25)' }}
          />
        )}
      </button>
    </>
  )
}
