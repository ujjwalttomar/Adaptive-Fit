import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api.jsx';

const quickReplies = ['Calories today', "Today's workout", 'My progress', 'Motivate me', 'Water advice', 'Fitness tips'];

function MsgBubble({ msg }) {
  const isBot = msg.sender === 'bot';
  const text = msg.text || '';

  const renderText = (t) => {
    const parts = t.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>);
  };

  return (
    <div style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: 14, alignItems: 'flex-end', gap: 8 }}>
      {isBot && (
        <div style={{ width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(145deg, var(--accent), var(--accent-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0, boxShadow: '0 2px 8px rgba(232,131,79,0.25)' }}>🤖</div>
      )}
      <div style={{
        maxWidth: '76%', padding: '11px 15px',
        borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: isBot ? 'var(--card2)' : 'var(--accent)',
        color: isBot ? 'var(--text)' : '#fff',
        fontSize: 14, lineHeight: 1.65,
        border: isBot ? '1px solid var(--border)' : 'none',
        whiteSpace: 'pre-wrap',
      }}>
        {text.split('\n').map((line, i) => <div key={i}>{renderText(line)}</div>)}
        <div style={{ fontSize: 10, color: isBot ? 'var(--text3)' : 'rgba(255,255,255,0.55)', marginTop: 6 }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([{
    sender: 'bot',
    text: "Hi! I'm your AdaptiveFit Assistant 🤖\n\nI can help you with:\n• Calories & meal tracking\n• Workout plans & exercises\n• Progress & engagement score\n• Motivation & fitness tips\n\nWhat would you like to know?",
    timestamp: new Date(),
    quickReplies
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setLoading(true); setTyping(true);

    try {
      const res = await chatAPI.sendMessage(userMsg, sessionId);
      setSessionId(res.data.sessionId);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, {
          sender: 'bot', text: res.data.response.text,
          timestamp: new Date(), quickReplies: res.data.response.quickReplies
        }]);
      }, 600);
    } catch {
      setTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again!", timestamp: new Date() }]);
    }
    setLoading(false);
  };

  const lastBotMsg = [...messages].reverse().find(m => m.sender === 'bot');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', maxHeight: 800 }}>
      {/* Header */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius) var(--radius) 0 0', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(145deg, var(--accent), var(--accent-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          boxShadow: '0 4px 12px rgba(232,131,79,0.28)' }}>🤖</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>AdaptiveFit Assistant</div>
          <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)' }} /> Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px',
        background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: 'none' }}>
        {messages.map((msg, i) => <MsgBubble key={i} msg={msg} />)}
        {typing && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(145deg, var(--accent), var(--accent-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
            <div style={{ background: 'var(--card2)', border: '1px solid var(--border)',
              borderRadius: '4px 14px 14px 14px', padding: '11px 16px', display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                  animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {lastBotMsg?.quickReplies?.length > 0 && !typing && (
        <div style={{ background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)', padding: '8px 14px', display: 'flex', gap: 7, overflowX: 'auto' }}>
          {lastBotMsg.quickReplies.map((qr, i) => (
            <button key={i} onClick={() => sendMessage(qr)}
              style={{ whiteSpace: 'nowrap', padding: '5px 13px', borderRadius: 20,
                background: 'var(--card)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.16s' }}
              onMouseOver={e => { e.target.style.background = 'rgba(232,131,79,0.15)'; e.target.style.borderColor = 'var(--accent)'; }}
              onMouseOut={e => { e.target.style.background = 'var(--card)'; e.target.style.borderColor = 'var(--border)'; }}>
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: 'none',
        borderRadius: '0 0 var(--radius) var(--radius)', padding: '12px 14px', display: 'flex', gap: 10 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask me anything about your fitness…"
          style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text)',
            fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', transition: 'border-color 0.18s' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          maxLength={500}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="btn btn-primary" style={{ padding: '10px 16px' }}>
          {loading ? '…' : '→'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
