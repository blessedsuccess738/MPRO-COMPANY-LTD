
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { store } from '../store';
import { ADMIN_EMAIL, APP_NAME } from '../constants';

interface Props {
  onBack: () => void;
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<Props> = ({ onBack, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const users = store.getUsers();
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        if (user.isFrozen) {
          setError('Your account has been frozen. Please contact customer service.');
          return;
        }
        store.setCurrentUser(user);
        onAuthSuccess(user);
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
          onAuthSuccess(admin);
        } else {
          setError('Invalid email or password');
        }
      }
    } else {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      const users = store.getUsers();
      if (users.some(u => u.email === email)) {
        setError('Email already exists');
        return;
      }

      const newUser: User = {
        id: 'u-' + Date.now(),
        email,
        password,
        role: email === ADMIN_EMAIL ? UserRole.ADMIN : UserRole.USER,
        balance: 0,
        isFrozen: false,
        createdAt: new Date().toISOString()
      };

      store.addUser(newUser);
      store.setCurrentUser(newUser);
      onAuthSuccess(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse transition-all duration-700 ${mode === 'login' ? 'bg-indigo-600/20' : 'bg-blue-600/20'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse transition-all duration-700 ${mode === 'login' ? 'bg-blue-600/20' : 'bg-indigo-600/20'}`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl mb-4 transform transition-transform duration-500 ${mode === 'login' ? 'rotate-6' : '-rotate-6'}`}>
             <span className="text-white text-4xl font-black italic">M</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
            {mode === 'login' ? 'Authenticate' : 'Initialize'}
          </h2>
          <p className="text-slate-400 font-medium text-sm">
            {mode === 'login' ? `Access your ${APP_NAME} dashboard` : `Join the ${APP_NAME} investment network`}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-center animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Identifier (Email)</label>
              <input
                type="email"
                required
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold placeholder-slate-600 hover:bg-white/[0.08]"
                placeholder="Ex: user@mpro.invest"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key (Password)</label>
              <input
                type="password"
                required
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold placeholder-slate-600 hover:bg-white/[0.08]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === 'signup' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Verify Security Key</label>
                <input
                  type="password"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold placeholder-slate-600 hover:bg-white/[0.08]"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              {mode === 'login' ? 'Begin Protocol Authentication' : 'Initialize Portfolio'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center pt-6 border-t border-white/5">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              {mode === 'login' ? "I don't have an account?" : "I already have an account?"}
            </p>
            <button 
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-indigo-400 hover:text-indigo-300 transition-colors text-[11px] font-black uppercase tracking-widest py-1"
            >
              {mode === 'login' ? 'Create new account' : 'Sign in'}
            </button>
            
            <button onClick={onBack} className="mt-6 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
              ← Return to Main Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
