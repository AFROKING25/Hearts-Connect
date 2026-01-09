
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppTab, User, Message } from './types';
import { MOCK_USERS, ICONS } from './constants';
import { generateIcebreakers, generateGhostIcebreaker } from './services/geminiService';

// --- Sub-components ---

const TabButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 py-2 px-4 transition-colors ${active ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <div className="w-6 h-6">{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const UserCard: React.FC<{ user: User; onClick: () => void }> = ({ user, onClick }) => (
  <div onClick={onClick} className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-[1.02]">
    <img src={user.photo} alt={user.name} className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="flex items-center space-x-2">
        <h3 className="text-white font-bold text-lg">{user.name}, {user.age}</h3>
        {user.isInstagramVerified && <ICONS.Verify className="w-5 h-5 text-blue-400" />}
      </div>
      <div className="flex items-center text-white/80 text-sm space-x-2">
        <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span>{user.distance} away</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="text-[10px] bg-rose-500/80 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
          {user.intent}
        </span>
      </div>
    </div>
  </div>
);

const ChatBubble: React.FC<{ message: string; isMe: boolean }> = ({ message, isMe }) => (
  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-rose-500 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
      {message}
    </div>
  </div>
);

const SideMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Menu Panel */}
      <div
        className={`fixed top-0 left-0 w-72 h-full bg-[#262626] text-white z-50 transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="space-y-1 mt-4">
            <MenuLink icon={<ICONS.Settings className="w-6 h-6" />} label="Settings" />
            <MenuLink icon={<ICONS.Activity className="w-6 h-6" />} label="Your activity" />
            <MenuLink icon={<ICONS.Saved className="w-6 h-6" />} label="Saved" />
            <MenuLink icon={<ICONS.Appearance className="w-6 h-6" />} label="Switch appearance" />
            <MenuLink icon={<ICONS.Report className="w-6 h-6" />} label="Report a problem" />
          </div>
          <div className="mt-auto pt-4 border-t border-white/10 space-y-1 mb-4">
            <MenuLink label="Switch accounts" noIcon />
            <MenuLink label="Log out" noIcon />
          </div>
        </div>
      </div>
    </>
  );
};

const MenuLink: React.FC<{ icon?: React.ReactNode; label: string; noIcon?: boolean }> = ({ icon, label, noIcon }) => (
  <button className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl transition-colors text-left group">
    {!noIcon && <div className="text-gray-300 group-hover:text-white">{icon}</div>}
    <span className={`text-sm font-medium ${noIcon ? 'ml-0' : ''}`}>{label}</span>
  </button>
);

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DISCOVERY);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [currentUser] = useState<User>({
    id: 'me',
    name: 'You',
    age: 25,
    bio: 'Software engineer exploring the world.',
    distance: '0m',
    online: true,
    photo: 'https://picsum.photos/seed/me/400/600',
    isInstagramVerified: true,
    instagramHandle: 'your_handle',
    interests: ['Travel', 'Coffee', 'Music'],
    intent: 'serious'
  });
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isLoadingIcebreakers, setIsLoadingIcebreakers] = useState(false);

  // Swipe logic (simplified)
  const [swipeIndex, setSwipeIndex] = useState(0);
  const visibleSwipers = useMemo(() => MOCK_USERS.slice(swipeIndex, swipeIndex + 3), [swipeIndex]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !selectedUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      receiverId: selectedUser.id,
      text: chatInput,
      timestamp: Date.now()
    };

    setMessages([...messages, newMessage]);
    setChatInput('');
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Logic for match could go here
    }
    setSwipeIndex(prev => prev + 1);
  };

  const fetchIcebreakers = useCallback(async (targetUser: User) => {
    setIsLoadingIcebreakers(true);
    const prompts = await generateIcebreakers(currentUser.interests, targetUser.interests);
    setIcebreakers(prompts);
    setIsLoadingIcebreakers(false);
  }, [currentUser.interests]);

  useEffect(() => {
    if (selectedUser && activeTab === AppTab.MESSAGES) {
      fetchIcebreakers(selectedUser);
    }
  }, [selectedUser, activeTab, fetchIcebreakers]);

  // View switch logic
  const renderView = () => {
    switch (activeTab) {
      case AppTab.DISCOVERY:
        return (
          <div className="p-4 animate-in fade-in duration-500">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Nearby You</h1>
              <p className="text-gray-500 text-sm">Find people online right now.</p>
            </header>
            <div className="grid grid-cols-2 gap-4">
              {MOCK_USERS.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => {
                    setSelectedUser(user);
                    setActiveTab(AppTab.MESSAGES);
                  }}
                />
              ))}
            </div>
          </div>
        );

      case AppTab.MATCHES:
        return (
          <div className="flex flex-col h-full items-center justify-center p-4">
            <h2 className="text-xl font-bold mb-6">Discover Matches</h2>
            {swipeIndex < MOCK_USERS.length ? (
              <div className="relative w-full max-w-sm aspect-[3/4]">
                {visibleSwipers.map((user, idx) => (
                  <div
                    key={user.id}
                    className="absolute inset-0 transition-all duration-300"
                    style={{
                      zIndex: visibleSwipers.length - idx,
                      transform: `scale(${1 - idx * 0.05}) translateY(${idx * 15}px)`,
                      opacity: 1 - idx * 0.3
                    }}
                  >
                    <UserCard user={user} onClick={() => {}} />
                  </div>
                ))}
                <div className="absolute -bottom-16 left-0 right-0 flex justify-center space-x-6">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="w-14 h-14 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <button
                    onClick={() => handleSwipe('right')}
                    className="w-14 h-14 bg-white shadow-lg rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <ICONS.Heart className="w-8 h-8" fill="currentColor" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500">No more people in your area!</p>
                <button onClick={() => setSwipeIndex(0)} className="mt-4 text-rose-500 font-medium">Reset stack</button>
              </div>
            )}
          </div>
        );

      case AppTab.GHOST:
        return (
          <div className="p-6 h-full flex flex-col space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] opacity-10">
                <ICONS.Ghost className="w-40 h-40" />
              </div>
              <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Ghost Mode</h2>
              <p className="text-gray-400 mb-6 text-sm">Chat anonymously. Reveal your identity when you're ready.</p>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <span className="font-medium">Go Incognito</span>
                <button
                  onClick={() => setIsGhostMode(!isGhostMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isGhostMode ? 'bg-rose-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isGhostMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ICONS.Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-lg">Interest-Based Pairing</h3>
              <p className="text-gray-500 text-sm mt-2">Pairing you with someone who loves <span className="text-rose-500 font-bold">{currentUser.interests[0]}</span> right now...</p>
              <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-xs">
                {currentUser.interests.map(i => (
                  <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium">#{i}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case AppTab.MESSAGES:
        if (!selectedUser) {
          return (
            <div className="p-4 flex flex-col h-full items-center justify-center space-y-4">
              <ICONS.Chat className="w-16 h-16 text-gray-200" />
              <p className="text-gray-400">Select someone from Discovery to start chatting.</p>
              <button onClick={() => setActiveTab(AppTab.DISCOVERY)} className="bg-rose-500 text-white px-6 py-2 rounded-full font-medium">Find People</button>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full bg-white relative">
            {/* Header for Chat */}
            <header className="p-4 flex items-center space-x-4 border-b">
              <button onClick={() => setSelectedUser(null)} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="relative">
                <img src={selectedUser.photo} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover" />
                {selectedUser.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-none">{selectedUser.name}</h3>
                <span className="text-xs text-green-500 font-medium">Online now</span>
              </div>
            </header>

            {/* AI Icebreakers */}
            {icebreakers.length > 0 && messages.length === 0 && (
              <div className="p-4 bg-rose-50 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-2">AI Suggested Icebreakers</p>
                {icebreakers.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatInput(prompt);
                    }}
                    className="block w-full text-left bg-white p-3 rounded-xl border border-rose-100 text-sm text-gray-700 hover:bg-rose-100 transition-colors shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <p className="text-sm">Don't be shy! Say hi to {selectedUser.name}.</p>
                </div>
              ) : (
                messages.map(m => (
                  <ChatBubble key={m.id} message={m.text} isMe={m.senderId === 'me'} />
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center disabled:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        );

      case AppTab.PROFILE:
        return (
          <div className="p-6 bg-white min-h-full">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <img src={currentUser.photo} className="w-32 h-32 rounded-full object-cover border-4 border-rose-100 shadow-xl" alt="Profile" />
                <button className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full shadow-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>
              <h2 className="text-2xl font-bold mt-4">{currentUser.name}, {currentUser.age}</h2>
              <div className="flex items-center space-x-1 mt-1 text-blue-600 font-semibold text-xs bg-blue-50/50 px-3 py-1.5 rounded border border-blue-400/50 shadow-sm">
                <ICONS.Verify className="w-4 h-4" />
                <span>Verified with Hearts Connect</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase font-bold text-gray-400 mb-2 tracking-widest">About Me</h3>
                <p className="text-gray-700 leading-relaxed font-medium">{currentUser.bio}</p>
              </div>

              <div>
                <h3 className="text-xs uppercase font-bold text-gray-400 mb-2 tracking-widest">Instagram Feed</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/ig${i}/300/300`} className="aspect-square rounded-xl object-cover" alt="IG feed" />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</p>
                  <p className="font-bold text-green-500">Active</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Intent</p>
                  <p className="font-bold text-rose-500 capitalize">{currentUser.intent}</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white shadow-2xl relative overflow-hidden">
      <SideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
      
      {/* Top Header Bar */}
      {selectedUser && activeTab === AppTab.MESSAGES ? null : (
        <header className="p-4 flex items-center justify-between border-b bg-white z-20">
          <button
            onClick={() => setIsSideMenuOpen(true)}
            className="text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ICONS.Menu className="w-7 h-7" />
          </button>
          
          <div className="px-2 py-1 bg-black/10 backdrop-blur-sm rounded-lg pointer-events-none">
            <span className="text-[8px] font-bold text-gray-700 uppercase tracking-tighter">Low Bandwidth Ready</span>
          </div>
        </header>
      )}

      {/* Viewport */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative bg-white">
        {renderView()}
      </main>

      {/* Navigation */}
      <nav className="border-t bg-white flex items-center justify-around px-2 z-10 safe-area-bottom">
        <TabButton
          active={activeTab === AppTab.DISCOVERY}
          icon={<ICONS.Search />}
          label="NEAR"
          onClick={() => { setActiveTab(AppTab.DISCOVERY); setSelectedUser(null); }}
        />
        <TabButton
          active={activeTab === AppTab.MATCHES}
          icon={<ICONS.Heart />}
          label="MATCH"
          onClick={() => { setActiveTab(AppTab.MATCHES); setSelectedUser(null); }}
        />
        <TabButton
          active={activeTab === AppTab.GHOST}
          icon={<ICONS.Ghost />}
          label="GHOST"
          onClick={() => { setActiveTab(AppTab.GHOST); setSelectedUser(null); }}
        />
        <TabButton
          active={activeTab === AppTab.MESSAGES}
          icon={<ICONS.Chat />}
          label="CHATS"
          onClick={() => setActiveTab(AppTab.MESSAGES)}
        />
        <TabButton
          active={activeTab === AppTab.PROFILE}
          icon={<ICONS.User />}
          label="ME"
          onClick={() => { setActiveTab(AppTab.PROFILE); setSelectedUser(null); }}
        />
      </nav>
    </div>
  );
}
