
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { store, supabase } from '../store';
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
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        const profile = await store.fetchCurrentUser(email);
        if (profile) {
          if (profile.isFrozen) {
            setError('Account frozen.');
            await supabase.auth.signOut();
            return;
          }
          store.setCurrentUser(profile);
          onAuthSuccess(profile);
        } else {
          setError('Profile missing.');
        }
      } else {
        if (password !== confirmPassword) { setError('Passwords mismatch'); setLoading(false); return; }

        if (referralCode) {
          const { data: refUser } = await supabase.from('profiles').select('id').eq('referral_code', referralCode.toUpperCase()).maybeSingle();
          if (!refUser) { setError('Invalid referral code'); setLoading(false); return; }
        }

        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        if (data.user) {
          const newUser: User = {
            id: data.user.id,
            email,
            role: email === ADMIN_EMAIL ? UserRole.ADMIN : UserRole.USER,
            balance: 0,
            isFrozen: false,
            usedCoupons: [],
            referralCode: store.generateReferralCode(),
            referredBy: referralCode.toUpperCase() || undefined,
            createdAt: new Date().toISOString()
          };
          await store.addUser(newUser);
          store.setCurrentUser(newUser);
          onAuthSuccess(newUser);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
              <input type="email" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold" placeholder="user@mpro.invest" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
              <input type="password" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                  <input type="password" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Code (Optional)</label>
                  <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold uppercase" placeholder="MPRO-XYZ" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
                </div>
              </>
            )}
            <button disabled={loading} type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs flex justify-center items-center">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (mode === 'login' ? 'Login' : 'Sign up')}
            </button>
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
