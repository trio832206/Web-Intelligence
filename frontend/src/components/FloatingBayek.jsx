import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
export default function FloatingBayek() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([{
    role: 'ai',
    content: 'Greetings, friend. I am Bayek, Medjay and your personal Web Intelligence guide. What knowledge do you seek today?'
  }]);

  // Dragging State
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({
    x: 0,
    y: 0
  });
  const hasMoved = useRef(false);
  const handlePointerDown = e => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = e => {
    if (!isDragging) return;
    hasMoved.current = true;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };
  const handlePointerUp = e => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const handleClick = () => {
    if (!hasMoved.current) {
      setIsOpen(true);
    }
  };
  const handleSend = async e => {
    e.preventDefault();
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMsg
    }]);
    setQuery('');
    try {
      const res = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: userMsg
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.reply,
        entities: data.entities
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Error communicating with the hidden ones... The connection is lost.'
      }]);
    }
  };
  return <>
      {/* Floating Action Button */}
      <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onClick={handleClick} style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      backgroundImage: 'url(/bayek.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      boxShadow: '0 8px 16px rgba(0,0,0,0.4), 0 0 0 2px var(--accent-base)',
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: 9998,
      display: isOpen ? 'none' : 'block',
      transform: `translate(${position.x}px, ${position.y}px)`,
      touchAction: 'none' // Prevent scrolling while dragging on touch
    }} title="Ask Bayek">
        {/* Unread badge mock */}
        <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '16px',
        height: '16px',
        background: 'red',
        borderRadius: '50%',
        border: '2px solid var(--bg-card)'
      }}></div>
      </div>

      {/* Floating Chat Sidebar Overlay (Glassmorphism) */}
      <div style={{
      position: 'fixed',
      top: 0,
      right: isOpen ? 0 : '-450px',
      width: '400px',
      height: '100vh',
      background: 'rgba(20, 20, 25, 0.7)',
      // Semi-transparent dark
      backdropFilter: 'blur(16px)',
      // Glassmorphism
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
      zIndex: 9999,
      transition: 'right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid rgba(255,255,255,0.1)'
    }}>
        {/* Header */}
        <div style={{
        padding: '20px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
            <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundImage: 'url(/bayek.jpg)',
            backgroundSize: 'cover'
          }}></div>
            <div>
              <h3 style={{
              margin: 0,
              fontSize: '1.1rem',
              color: '#fff'
            }}>Bayek</h3>
              <div style={{
              fontSize: '0.8rem',
              color: 'var(--accent-light)'
            }}>AI Intelligence Agent</div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '8px'
        }}>
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
          {messages.map((msg, i) => <div key={i} style={{
          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
          background: msg.role === 'user' ? 'var(--accent-base)' : 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '12px',
          maxWidth: '85%',
          border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
        }}>
              <div>{msg.content}</div>
              {msg.entities && msg.entities.length > 0 && <div style={{
            marginTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
                  {msg.entities.map(e => <a key={e.id} href={e.url} target="_blank" rel="noreferrer" style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 12px',
              borderRadius: '4px',
              textDecoration: 'none',
              color: msg.role === 'user' ? '#fff' : 'var(--accent-light)',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column'
            }}>
                      <strong>{e.title}</strong>
                      {e.sentiment_label && <span style={{
                fontSize: '0.75rem',
                opacity: 0.8
              }}>
                          [{e.sentiment_label}]
                        </span>}
                    </a>)}
                </div>}
            </div>)}
        </div>

        {/* Input */}
        <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.4)'
      }}>
          <form onSubmit={handleSend} style={{
          display: 'flex',
          gap: '8px'
        }}>
            <input type="text" className="input-field" style={{
            flex: 1,
            borderRadius: '20px',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)'
          }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask Bayek..." />
            <button type="submit" className="btn-primary" style={{
            borderRadius: '50%',
            width: '45px',
            height: '45px',
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>;
}