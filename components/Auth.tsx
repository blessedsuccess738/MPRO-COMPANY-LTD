
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { store, supabase } from '../store';
import { ADMIN_EMAIL } from '../constants';

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
        const { data, error: authError } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        
        if (authError) {
          if (authError.message.includes('Email not confirmed')) {
            setError('Please verify your email address before logging in.');
          } else {
            throw authError;
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          // Priority 1: Fetch profile by ID (most reliable)
          let profile = await store.fetchCurrentUser(data.user.id);
          
          // Priority 2: Self-Healing. If login succeeded but profile table is missing the row, create it.
          if (!profile) {
            console.log("Self-healing: Profile missing for authenticated user. Creating...");
            const recoveredUser: User = {
              id: data.user.id,
              email: data.user.email || email.trim().toLowerCase(),
              role: (data.user.email === ADMIN_EMAIL) ? UserRole.ADMIN : UserRole.USER,
              balance: 0,
              isFrozen: false,
              usedCoupons: [],
              referralCode: store.generateReferralCode(),
              createdAt: new Date().toISOString()
            };
            await store.addUser(recoveredUser);
            profile = recoveredUser;
          }

          if (profile.isFrozen) {
            setError('Account access suspended. Contact support.');
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          store.setCurrentUser(profile);
          onAuthSuccess(profile);
        }
      } else {
        if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }

        let referralId: string | undefined = undefined;
        if (referralCode) {
          const { data: refUser } = await supabase.from('profiles')
            .select('referral_code')
            .ilike('referral_code', referralCode.trim())
            .maybeSingle();
            
          if (!refUser) { 
            setError('The referral code entered is invalid.'); 
            setLoading(false); 
            return; 
          }
          referralId = refUser.referral_code;
        }

        const { data, error: authError } = await supabase.auth.signUp({ 
          email: email.trim().toLowerCase(), 
          password 
        });
        
        if (authError) throw authError;

        if (data.user) {
          const newUser: User = {
            id: data.user.id,
            email: email.trim().toLowerCase(),
            role: email.trim().toLowerCase() === ADMIN_EMAIL ? UserRole.ADMIN : UserRole.USER,
            balance: 0,
            isFrozen: false,
            usedCoupons: [],
            referralCode: store.generateReferralCode(),
            referredBy: referralId,
            createdAt: new Date().toISOString()
          };
          
          await store.addUser(newUser);
          
          // If auto-logged in (Supabase default for some configs)
          if (data.session) {
            store.setCurrentUser(newUser);
            onAuthSuccess(newUser);
          } else {
            setError('Account created! Please check your email for a verification link.');
            setMode('login');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during authentication.');
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
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{mode === 'login' ? 'Access Portal' : 'Register Node'}</h2>
        </div>
        
        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center border animate-shake ${
                error.includes('Account created') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Email</label>
              <input 
                type="email" 
                required 
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold focus:ring-1 focus:ring-indigo-500 transition-all" 
                placeholder="user@mpro.invest" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
              <input 
                type="password" 
                required 
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold focus:ring-1 focus:ring-indigo-500 transition-all" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold focus:ring-1 focus:ring-indigo-500 transition-all" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Referral Code (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-bold uppercase tracking-widest focus:ring-1 focus:ring-indigo-500 transition-all" 
                    placeholder="MPRO-XYZ" 
                    value={referralCode} 
                    onChange={(e) => setReferralCode(e.target.value)} 
                  />
                </div>
              </>
            )}
            
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs flex justify-center items-center transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                mode === 'login' ? 'Authenticate' : 'Initialize Account'
              )}
            </button>
          </form>
          
          <div className="mt-8 flex flex-col items-center pt-6 border-t border-white/5">
            <button 
              type="button" 
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} 
              className="text-indigo-400 font-black uppercase tracking-widest text-[11px] hover:text-indigo-300 transition-colors"
            >
              {mode === 'login' ? 'Deploy New Node (Sign Up)' : 'Existing Member? (Login)'}
            </button>
            <button 
              onClick={onBack} 
              className="mt-6 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-slate-400 transition-colors"
            >
              ← System Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
