
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { store } from '../store';
import { ADMIN_EMAIL } from '../constants';

interface Props {
  user: User;
  isAdmin: boolean;
  targetUserId?: string; // If admin, which user are we chatting with?
}

const Chat: React.FC<Props> = ({ user, isAdmin, targetUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeChatUserId = isAdmin ? targetUserId : user.id;

  useEffect(() => {
    // Fix: fetchMessages should be asynchronous and pass activeChatUserId
    const fetchMessages = async () => {
      if (!activeChatUserId) return;
      const allMsgs = await store.getMessages(activeChatUserId);
      setMessages(allMsgs);
      if (!isAdmin) {
        await store.markMessagesAsRead(user.id);
      }
    };

    fetchMessages();
    const timer = setInterval(fetchMessages, 2000);
    return () => clearInterval(timer);
  }, [activeChatUserId, isAdmin, user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      userId: activeChatUserId!,
      senderEmail: user.email,
      text: inputText,
      timestamp: new Date().toISOString(),
      isAdmin: isAdmin,
      isRead: isAdmin
    };

    store.addMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className={`flex flex-col h-[550px] bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative ${!isAdmin ? 'mx-auto' : ''}`}>
      {/* Chat Header Premium */}
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
             <span className="text-white font-black">?</span>
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest">Concierge Support</h3>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
               Admin Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area - Dark Theme */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-transparent">
        {messages.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center space-y-4 opacity-30">
            <div className="text-5xl">📨</div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Secure encryption active. <br /> Type below to start your request.</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = isAdmin ? msg.isAdmin : !msg.isAdmin;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-3xl shadow-xl text-sm leading-relaxed ${
                isMine 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-none backdrop-blur-md'
              }`}>
                <p className="font-medium">{msg.text}</p>
                <div className={`flex items-center gap-2 mt-2 ${isMine ? 'text-indigo-200' : 'text-slate-500'} text-[9px] font-black uppercase tracking-widest`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMine && msg.isRead && <span>• Read</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef}></div>
      </div>

      {/* Modern Chat Input Field */}
      <form onSubmit={handleSend} className="p-6 bg-[#070b14]/50 backdrop-blur-md border-t border-white/5 flex space-x-3 items-center">
        <input
          type="text"
          className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-white font-medium hover:bg-white/[0.08]"
          placeholder="Describe your issue..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg active:scale-90 flex items-center justify-center">
           <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;
