import { useState, useRef } from 'react';

export default function DachaIQWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: 'user', content: input }]);
    setLoading(true);
    setInput('');
    try {
      const res = await fetch('/api/dachaiq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from DachaIQ');
      }
      
      setMessages((msgs) => [...msgs, { role: 'ai', content: data.answer || 'Sorry, I could not answer that.' }]);
    } catch (e) {
      console.error('DachaIQ error:', e);
      setMessages((msgs) => [...msgs, { 
        role: 'ai', 
        content: e instanceof Error ? e.message : 'Sorry, there was an error contacting DachaIQ. Please try again later.' 
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-brand-orange text-white rounded-full shadow-lg p-4 hover:bg-orange-600 transition"
          title="Ask DachaIQ"
        >
          💬 DachaIQ
        </button>
      )}
      {open && (
        <div className="bg-white rounded-xl shadow-2xl w-80 max-h-[70vh] flex flex-col border border-brand-orange">
          <div className="flex items-center justify-between px-4 py-2 bg-brand-orange rounded-t-xl">
            <span className="font-bold text-white">DachaIQ</span>
            <button onClick={() => setOpen(false)} className="text-white text-xl font-bold">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: 200 }}>
            {messages.length === 0 && (
              <div className="text-gray-400 text-sm">Ask me anything about the dashboard!</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                <span className={`inline-block rounded-lg px-3 py-1 mb-1 ${
                  msg.role === 'user' 
                    ? 'bg-brand-orange text-white' 
                    : msg.content.includes('error') || msg.content.includes('Sorry')
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.content}
                </span>
              </div>
            ))}
            {loading && <div className="text-gray-400 text-sm">DachaIQ is typing…</div>}
          </div>
          <form
            className="flex border-t border-gray-200"
            onSubmit={e => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="flex-1 p-2 rounded-bl-xl outline-none"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="bg-brand-orange text-white px-4 py-2 rounded-br-xl hover:bg-orange-600 transition disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 