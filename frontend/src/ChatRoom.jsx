import React, { useState, useEffect, useRef } from 'react';

const ChatRoom = ({ 
  selectedUser, 
  messages, 
  onSendMessage, 
  onBack, 
  userId, 
  typingUsers, 
  hasSecret,
  bots 
}) => {
  const [inputText, setInputText] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const messagesEndRef = useRef(null);
  
  // Dynamic relative time calculator
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diff = Math.floor((currentTime - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Refresh relative times every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const targetUser = bots?.find(b => b.id === selectedUser) || { name: `User ${selectedUser}`, id: selectedUser };
  const activeMessages = messages[selectedUser] || [];
  const isTyping = typingUsers[selectedUser];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && hasSecret) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-on-surface font-inter overflow-hidden relative">
      {/* Header */}
      <header className="absolute top-0 w-full border-b border-white/5 z-50 h-16 bg-black/40 backdrop-blur-md flex items-center px-5">
        <div className="flex items-center gap-3 w-1/4">
          <button 
            onClick={onBack}
            className="material-symbols-outlined text-white p-2 rounded-full hover:bg-white/5 matte-active"
          >
            arrow_back
          </button>
          <span className="font-extrabold tracking-tighter text-white text-base hidden md:block">VAULT</span>
        </div>
        
        <div className="flex justify-center flex-1">
          <div className="flex items-center gap-2 bg-surface-card border border-white/5 px-4 py-1.5 rounded-full scale-90">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue">
              Synced & Audited
            </span>
          </div>
        </div>

        <div className="flex justify-end w-1/4">
           <button className="material-symbols-outlined text-white p-2 rounded-full hover:bg-white/5 matte-active">
             more_vert
           </button>
        </div>
      </header>

      {/* Message Canvas */}
      <main className="flex-1 overflow-y-auto pt-24 pb-48 px-5 md:px-16 max-w-4xl mx-auto w-full scrollbar-none">
        <div className="flex justify-center mb-10">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
            TODAY 09:41 AM — ZURICH HUB
          </span>
        </div>

        <div className="space-y-6">
          {activeMessages.length === 0 ? (
            <div className="py-10 text-center opacity-20">
              <span className="material-symbols-outlined text-5xl mb-2">shield_lock</span>
              <p className="text-[10px] uppercase tracking-widest font-black">Encrypted channel established</p>
            </div>
          ) : (
            activeMessages.map((m, idx) => {
              const isOutgoing = m.sender === userId;
              return (
                <div key={idx} className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[85%] px-5 py-4 rounded-[22px] text-sm font-medium leading-relaxed shadow-lg ${
                      isOutgoing 
                        ? 'bg-primary-blue text-black rounded-tr-none' 
                        : 'bg-surface-card text-white rounded-tl-none border border-white/5'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 px-1">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase">{getRelativeTime(m.timestamp)}</span>
                    {isOutgoing && (
                      <span className="material-symbols-outlined text-[12px] text-primary-blue" style={{ fontVariationSettings: "'FILL' 1" }}>
                        done_all
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Media Card Placeholder */}
          <div className="flex flex-col items-start mt-8">
            <div className="w-full md:w-80 rounded-[24px] overflow-hidden border border-white/5 bg-surface-card shadow-2xl group">
              <div className="relative h-48 bg-surface-elevated flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <span className="material-symbols-outlined text-white text-xl">shield</span>
                  </div>
                  <button className="premium-button bg-white text-black text-[10px] font-black px-4 py-2 rounded-full tracking-widest uppercase">
                    DECRYPT MEDIA
                  </button>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/50">
                <p className="text-[11px] font-bold text-white tracking-tight">Payload_Manifest_V4.enc (1.2 MB)</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-zinc-600 uppercase mt-2 px-1">09:44</span>
          </div>

          {isTyping && (
            <div className="flex items-center gap-2 px-2 animate-pulse">
              <div className="w-1.5 h-1.5 bg-primary-blue rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-primary-blue rounded-full opacity-60"></div>
              <div className="w-1.5 h-1.5 bg-primary-blue rounded-full opacity-30"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Terminal */}
      <div className="absolute bottom-0 left-0 w-full bg-black/40 backdrop-blur-xl border-t border-white/5 px-4 pt-4 pb-8 z-50">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
            <button 
              type="button"
              className="premium-button w-12 h-12 rounded-full bg-surface-elevated border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Secure message..."
                disabled={!hasSecret}
                className="w-full bg-surface-card border border-white/5 text-white pl-5 pr-12 py-4 rounded-2xl placeholder:text-zinc-700 outline-none focus:ring-1 focus:ring-primary-blue/30 transition-all text-sm font-medium"
              />
            </div>

            <button 
              type="submit"
              disabled={!inputText.trim() || !hasSecret}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all duration-200 ${
                inputText.trim() && hasSecret 
                  ? 'premium-button bg-white text-black' 
                  : 'bg-surface-elevated text-zinc-600 cursor-not-allowed'
              }`}
            >
              ENCRYPT & SEND
              <span className="material-symbols-outlined text-sm">bolt</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
