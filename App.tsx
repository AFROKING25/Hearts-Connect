
import React, { useState, useEffect, useMemo } from 'react';
import { AppTab, User, Message } from './types';
import { ICONS } from './constants';
import { generateIcebreakers } from './services/geminiService';
import { db } from './db';

// Initialize the simulated database
db.init();

// --- UI Components ---
const HeartsConnectLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 95C50 95 90 60 90 35C90 15.67 74.33 0 55 0C48.5 0 42.5 1.75 37.5 4.75" fill="url(#grad1)" />
    <path d="M10 35C10 60 50 95 50 95V4.75C45 1.75 39 0 32.5 0C13.17 0 -2.5 15.67 -2.5 35" fill="url(#grad2)" />
    <circle cx="50" cy="35" r="18" fill="white" />
    <path d="M50 45C50 45 62 35 62 28C62 23.58 58.42 20 54 20C51.2 20 48.7 21.4 47.3 23.5L50 45ZM50 45C50 45 38 35 38 28C38 23.58 41.58 20 46 20C48.8 20 51.3 21.4 52.7 23.5L50 45Z" fill="#F43F5E" />
    <defs>
      <linearGradient id="grad1" x1="50" y1="0" x2="90" y2="95" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F43F5E" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="grad2" x1="10" y1="0" x2="50" y2="95" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F43F5E" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

const SignupFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '', gender: 'female', dob: '', intent: 'serious', bio: '', photo: '', 
    locationCountry: 'Ghana', locationRegion: 'Greater Accra', interests: ['Music', 'Travel'],
    online: true, isInstagramVerified: false, id: `user_${Date.now()}`
  });

  const steps = [
    { title: 'Welcome', desc: 'Hearts Connect uses high-frequency regional matching.' },
    { title: 'Who are you?', desc: 'Setting up your persistent identity.' },
    { title: 'Profile Photo', desc: 'Upload a face to start discovery.' }
  ];

  const handleFinish = () => {
    const age = formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : 25;
    const finalUser = { ...formData, age, distance: '0m' } as User;
    db.users.create(finalUser);
    onComplete();
  };

  return (
    <div className="flex flex-col h-full bg-white p-10 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {step === 0 && <HeartsConnectLogo className="w-32 h-32 mb-8 animate-bounce" />}
        <h1 className="text-4xl font-black uppercase text-gray-900 tracking-tight">{steps[step].title}</h1>
        <p className="text-gray-400 text-sm font-medium mt-2 mb-12 max-w-xs">{steps[step].desc}</p>

        {step === 1 && (
          <div className="w-full space-y-4">
            <input className="w-full bg-gray-50 p-5 rounded-2xl border font-black uppercase focus:ring-2 focus:ring-rose-500 outline-none" placeholder="First Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input type="date" className="w-full bg-gray-50 p-5 rounded-2xl border font-bold" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
          </div>
        )}

        {step === 2 && (
          <div onClick={() => setFormData({ ...formData, photo: 'https://picsum.photos/seed/me/400/600' })} className={`w-56 aspect-[3/4] rounded-[40px] border-4 border-dashed flex items-center justify-center cursor-pointer transition-all ${formData.photo ? 'border-rose-500' : 'bg-gray-50 border-gray-200'}`}>
            {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover rounded-[34px]" /> : <span className="text-[10px] font-black text-gray-300 uppercase px-6">Tap to simulate database upload</span>}
          </div>
        )}
      </div>

      <button 
        onClick={() => step === steps.length - 1 ? handleFinish() : setStep(step + 1)} 
        disabled={step === 1 && !formData.name}
        className="w-full py-5 bg-gray-900 text-white font-black uppercase tracking-widest rounded-3xl disabled:opacity-30 active:scale-95 transition-all shadow-2xl"
      >
        {step === steps.length - 1 ? 'Commit to DB & Start' : 'Continue'}
      </button>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(db.auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DISCOVERY);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [filters, setFilters] = useState({ maxAge: 45, region: 'Greater Accra' });

  // Sync state with Database
  useEffect(() => {
    if (selectedUser && currentUser) {
      setChatMessages(db.messages.getByChatId(currentUser.id, selectedUser.id));
      loadIcebreakers(selectedUser);
    }
  }, [selectedUser, currentUser]);

  const loadIcebreakers = async (otherUser: User) => {
    if (!currentUser) return;
    const questions = await generateIcebreakers(currentUser.interests, otherUser.interests);
    setIcebreakers(questions);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !currentUser || !selectedUser) return;
    const msg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      text: chatInput,
      timestamp: Date.now()
    };
    db.messages.send(msg);
    setChatMessages([...chatMessages, msg]);
    setChatInput('');
  };

  const filteredUsers = useMemo(() => {
    return db.users.getAll().filter(u => {
      if (u.id === currentUser?.id) return false;
      if (u.age > filters.maxAge) return false;
      return true;
    });
  }, [currentUser, filters]);

  if (!currentUser) return <SignupFlow onComplete={() => setCurrentUser(db.auth.getCurrentUser())} />;

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-[#fcfcfc] shadow-2xl relative overflow-hidden font-inter">
      
      {/* Navbar */}
      {(!selectedUser || activeTab !== AppTab.MESSAGES) && (
        <header className="p-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b z-20 sticky top-0">
          <div className="flex items-center space-x-3">
            <HeartsConnectLogo className="w-8 h-8" />
            <span className="text-rose-500 font-black text-sm uppercase tracking-tighter">Hearts Connect</span>
          </div>
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live: {db.users.getAll().length}</span>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar relative pb-24">
        {activeTab === AppTab.DISCOVERY && (
          <div className="p-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">Discovery</h1>
                <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-1">Found in your region</p>
              </div>
              <button className="p-3 bg-gray-50 rounded-2xl border text-gray-400"><ICONS.Filter className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => { setSelectedUser(u); setActiveTab(AppTab.MESSAGES); }} className="relative group aspect-[3/4] rounded-[32px] overflow-hidden shadow-xl active:scale-95 transition-all cursor-pointer">
                  <img src={u.photo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5">
                    <h4 className="text-white font-black text-sm uppercase">{u.name}, {u.age}</h4>
                    <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest">{u.locationRegion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === AppTab.MESSAGES && selectedUser && (
          <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-500">
            <header className="p-6 flex items-center space-x-4 border-b">
              <button onClick={() => setSelectedUser(null)} className="text-gray-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
              <img src={selectedUser.photo} className="w-12 h-12 rounded-full object-cover border-2 border-rose-100" />
              <div>
                <h4 className="font-black text-gray-900 uppercase text-sm leading-none">{selectedUser.name}</h4>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Connected Now</span>
              </div>
            </header>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center py-10 opacity-50 grayscale">
                  <ICONS.Chat className="w-12 h-12 text-rose-300 mb-4" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No history found in DB</p>
                </div>
              )}
              {chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${m.senderId === currentUser.id ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border shadow-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {icebreakers.length > 0 && chatMessages.length === 0 && (
                <div className="pt-6 space-y-3">
                  <p className="text-[10px] font-black text-rose-500 uppercase text-center mb-4 tracking-tighter">AI Matchmaker Recommendations</p>
                  {icebreakers.map((q, i) => (
                    <button key={i} onClick={() => setChatInput(q)} className="w-full p-5 bg-white text-gray-700 text-xs rounded-[24px] border border-rose-50 text-left italic hover:border-rose-300 transition-all shadow-sm">"{q}"</button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t flex space-x-3 items-center">
              <input className="flex-1 bg-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all font-medium" placeholder="Draft a persistent message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
              <button onClick={handleSendMessage} className="bg-rose-500 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"><ICONS.Heart className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {activeTab === AppTab.PROFILE && (
          <div className="p-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="relative mb-8">
              <img src={currentUser.photo} className="w-40 h-40 rounded-[50px] object-cover border-[6px] border-white shadow-2xl" />
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2.5 rounded-2xl border-4 border-white"><ICONS.Verify className="w-5 h-5" /></div>
            </div>

            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{currentUser.name}, {currentUser.age}</h2>
            <p className="text-rose-500 font-bold text-[10px] uppercase tracking-widest mt-2">{currentUser.locationRegion}, {currentUser.locationCountry}</p>
            
            <div className="w-full mt-12 space-y-4">
              <button className="w-full p-6 bg-white rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-50 rounded-2xl"><ICONS.Settings className="w-5 h-5 text-gray-400" /></div>
                  <span className="text-sm font-black uppercase text-gray-700">Account Settings</span>
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => { db.auth.logout(); window.location.reload(); }} className="w-full p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-center justify-center space-x-3 group">
                <span className="text-sm font-black uppercase text-rose-500 group-hover:tracking-widest transition-all">Wipe Session & Logout</span>
              </button>
            </div>

            <div className="mt-12 p-6 bg-gray-900 rounded-[32px] w-full text-center">
               <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Server Status</p>
               <p className="text-white font-medium text-xs">MySQL Virtual Engine v2.4.0-Active</p>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-2xl border-t flex items-center justify-around px-4 py-4 z-40 shadow-2xl safe-area-bottom">
        <TabButton active={activeTab === AppTab.DISCOVERY} icon={<ICONS.Search />} label="Near" onClick={() => { setActiveTab(AppTab.DISCOVERY); setSelectedUser(null); }} />
        <TabButton active={activeTab === AppTab.MATCHES} icon={<ICONS.Heart />} label="Match" onClick={() => { setActiveTab(AppTab.MATCHES); setSelectedUser(null); }} />
        <TabButton active={activeTab === AppTab.MESSAGES} icon={<ICONS.Chat />} label="Chats" onClick={() => setActiveTab(AppTab.MESSAGES)} />
        <TabButton active={activeTab === AppTab.PROFILE} icon={<ICONS.User />} label="Me" onClick={() => { setActiveTab(AppTab.PROFILE); setSelectedUser(null); }} />
      </nav>
    </div>
  );
}

const TabButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1.5 py-2 px-6 transition-all duration-500 rounded-2xl ${active ? 'text-rose-500 bg-rose-50/50 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <div className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
