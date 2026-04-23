import React, { useState, useEffect } from 'react';

const Dashboard = ({ 
  userId, 
  connected, 
  users, 
  BOTS, 
  messages, 
  typingUsers, 
  selectedUser, 
  onUserSelect,
  onSendMessage 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Dynamic relative time calculator
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Math.floor((currentTime - timestamp) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Refresh relative times every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(u => {
    const name = BOTS.find(b => b.id === u)?.name || `User ${u}`;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getLastMessage = (id) => {
    const history = messages?.[id] || [];
    if (history.length === 0) return null;
    return history[history.length - 1];
  };

  return (
    <div className="min-h-screen bg-black text-on-surface font-inter">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full border-b border-white/10 z-50 h-16 bg-black flex items-center px-5">
        <div className="flex items-center gap-3 w-1/3">
          <button className="material-symbols-outlined text-white p-2 rounded-full hover:bg-white/5">
            menu
          </button>
          <span className="font-extrabold tracking-tighter text-white text-base">VAULT</span>
        </div>
        
        <div className="flex justify-center w-1/3">
          <div className="flex items-center gap-2 bg-surface-card border border-white/5 px-4 py-1.5 rounded-full scale-90">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-primary-blue animate-pulse' : 'bg-zinc-600'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${connected ? 'text-primary-blue' : 'text-zinc-500'}`}>
              {connected ? 'Identity Verified & Live' : 'Relay Offline'}
            </span>
          </div>
        </div>

        <div className="flex justify-end w-1/3">
           <button className="material-symbols-outlined text-white p-2 rounded-full hover:bg-white/5">
             shield
           </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="pt-24 pb-32 px-5 md:px-16 max-w-4xl mx-auto min-h-screen">
        {/* Header Section */}
        <section className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">Secure Communications</h1>
          <p className="text-zinc-500 text-sm font-medium">Zero-knowledge encrypted sessions only. Your data never leaves your device.</p>
        </section>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors">
              search
            </span>
            <input 
              className="w-full bg-surface-card border border-white/5 text-white pl-12 py-5 rounded-2xl placeholder:text-zinc-700 transition-all outline-none text-sm font-medium" 
              placeholder="Search Encrypted Vault" 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <span className="material-symbols-outlined text-6xl mb-2">fingerprint</span>
              <p className="text-xs uppercase tracking-widest font-black">No encrypted channels</p>
            </div>
          ) : (
            filteredUsers.map(u => {
              const lastMsg = getLastMessage(u);
              const isTyping = typingUsers[u];
              const isBot = BOTS.find(b => b.id === u);
              const name = isBot?.name || `User ${u}`;
              const isSelected = selectedUser === u || (u === 'CyberGuard' && !selectedUser); // For visual match demo
              const userMessages = messages?.[u] || [];
              const unreadCount = userMessages.filter(m => m.sender !== userId && m.isRead === false).length;

              return (
                <div 
                   key={u}
                   onClick={() => onUserSelect(u)}
                   className={`matte-card p-5 rounded-[20px] flex items-center gap-5 cursor-pointer transition-all duration-200 matte-active ${isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/5 bg-surface-elevated flex items-center justify-center">
                      <span className="text-zinc-400 font-black text-xl">{name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-zinc-800 border-[3px] border-black rounded-full overflow-hidden flex items-center justify-center">
                      {connected && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-white text-base tracking-tight">{name}</span>
                      <span className="material-symbols-outlined text-primary-blue text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    </div>
                    <p className={`text-sm truncate font-medium ${isTyping ? 'text-primary-blue' : 'text-zinc-500'}`}>
                      {isTyping ? 'Syncing...' : (lastMsg ? lastMsg.text : (isBot ? isBot.bio : 'Established.'))}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                       {lastMsg ? getRelativeTime(lastMsg.timestamp) : 'History Clear'}
                    </span>
                    {unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-primary-blue flex items-center justify-center shadow-[0_5px_15px_rgba(10,132,255,0.4)]">
                        <span className="text-[10px] font-black text-white">{unreadCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* FAB: New Secure Chat */}
      <button className="premium-button fixed bottom-28 right-8 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <span className="material-symbols-outlined text-3xl font-black">chat_bubble</span>
      </button>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-black flex justify-around items-center h-24 px-8 border-t border-white/5">
        {[
          { id: 'chats', icon: 'chat_bubble', label: 'Chats' },
          { id: 'vault', icon: 'lock', label: 'Vault' },
          { id: 'contacts', icon: 'group', label: 'Contacts' },
          { id: 'settings', icon: 'settings', label: 'Settings' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${activeTab === tab.id ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
          >
            <div className={activeTab === tab.id ? 'text-primary-blue' : ''}>
              <span 
                className="material-symbols-outlined text-2xl" 
                style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-widest font-black mt-2">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/5 bg-black mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-10 max-w-7xl mx-auto gap-8">
          <span className="text-zinc-600 font-bold text-[10px] tracking-widest uppercase">© 2024 VAULT ZERO-KNOWLEDGE SYSTEMS</span>
          <div className="flex gap-8">
            {['Whitepaper', 'Audit Report', 'Privacy Policy'].map(link => (
              <a key={link} href="#" className="text-zinc-500 hover:text-white underline text-[10px] font-bold tracking-tight uppercase transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
