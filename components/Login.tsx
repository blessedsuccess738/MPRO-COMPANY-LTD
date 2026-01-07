
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { store } from '../store';
import { ADMIN_EMAIL, APP_NAME } from '../constants';

interface Props {
  onBack: () => void;
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<Props> = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = store.getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      if (user.isFrozen) {
        setError('Your account has been frozen. Please contact customer service.');
        return;
      }
      store.setCurrentUser(user);
      onLoginSuccess(user);
    } else {
      if (email === ADMIN_EMAIL && password === 'admin123') {
        const admin: User = {
          id: 'admin-' + Date.now(),
          email: ADMIN_EMAIL,
          password: 'admin123',
          role: UserRole.ADMIN,
          balance: 0,
          isFrozen: false,
          createdAt: new Date().toISOString()
        };
        store.addUser(admin);
        store.setCurrentUser(admin);
        onLoginSuccess(admin);
      } else {
        setError('Invalid email or password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Moving Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl mb-4 transform hover:rotate-6 transition-transform">
             <span className="text-white text-4xl font-black italic">M</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Member Portal</h2>
          <p className="text-slate-400 font-medium text-sm">Access your {APP_NAME} Pro dashboard</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-center animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Protocol</label>
              <input
                type="email"
                required
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold placeholder-slate-600 hover:bg-white/[0.08]"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key</label>
              <input
                type="password"
                required
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold placeholder-slate-600 hover:bg-white/[0.08]"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              Authenticate
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
              ← Return to HQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
