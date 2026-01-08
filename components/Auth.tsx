
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
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const settings = store.getSettings();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const users = store.getUsers();
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        if (user.isFrozen) {
          setError('Account frozen. Contact support.');
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
            referralCode: 'ADMIN_PRO',
            createdAt: new Date().toISOString()
          };
          store.addUser(admin);
          store.setCurrentUser(admin);
          onAuthSuccess(admin);
        } else {
          setError('Invalid credentials');
        }
      }
    } else {
      if (password !== confirmPassword) {
        setError('Passwords mismatch');
        return;
      }
      const users = store.getUsers();
      if (users.some(u => u.email === email)) {
        setError('Email exists');
        return;
      }

      // Referral validation
      if (referralCode && !users.some(u => u.referralCode === referralCode.toUpperCase())) {
        setError('Invalid referral code');
        return;
      }

      const newUser: User = {
        id: 'u-' + Date.now(),
        email,
        password,
        role: email === ADMIN_EMAIL ? UserRole.ADMIN : UserRole.USER,
        balance: 0,
        isFrozen: false,
        usedCoupons: [],
        referralCode: store.generateReferralCode(),
        referredBy: referralCode.toUpperCase() || undefined,
        createdAt: new Date().toISOString()
      };
      store.addUser(newUser);
      store.setCurrentUser(newUser);
      onAuthSuccess(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {settings.authBackgroundUrl ? (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {settings.isAuthVideo ? (
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-50" src={settings.authBackgroundUrl} />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${settings.authBackgroundUrl})` }} />
          )}
          <div className="absolute inset-0 bg-[#070b14]/70 backdrop-blur-[2px]" />
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse ${mode === 'login' ? 'bg-indigo-600/20' : 'bg-blue-600/20'}`}></div>
        </div>
      )}

      <div className="max-w-md w-full relative z-10 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl">
             <span className="text-white text-4xl font-black italic">M</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{mode === 'login' ? 'Login' : 'Sign up'}</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase text-center border border-red-500/20">{error}</div>}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Email</label>
              <input type="email" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-all text-white font-bold" placeholder="user@mpro.invest" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
              <input type="password" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-all text-white font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                  <input type="password" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-all text-white font-bold" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Code (Optional)</label>
                  <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-all text-white font-bold uppercase" placeholder="MPRO-XYZ" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
                </div>
              </>
            )}
            <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">{mode === 'login' ? 'Login' : 'Sign up'}</button>
          </form>
          <div className="mt-8 flex flex-col items-center pt-6 border-t border-white/5">
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="text-indigo-400 font-black uppercase tracking-widest text-[11px]">{mode === 'login' ? 'Create new account' : 'Sign in'}</button>
            <button onClick={onBack} className="mt-6 text-slate-500 text-[10px] font-black uppercase tracking-widest">← Back</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
