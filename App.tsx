
import React, { useState, useEffect } from 'react';
import { User, UserRole, GlobalSettings } from './types';
import { store, supabase } from './store';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import { INITIAL_SETTINGS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'welcome' | 'auth' | 'dashboard' | 'admin'>('welcome');
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationState, setVerificationState] = useState<'none' | 'processing' | 'success' | 'failed'>('none');

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Detect verification status from URL hash
      const hash = window.location.hash;
      const isSignupVerify = hash.includes('type=signup') || hash.includes('type=invite');
      
      if (isSignupVerify) {
        setIsVerifying(true);
        setVerificationState('processing');
      }

      // Hard safety timeout to prevent infinite loading
      const safetyTimer = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
          if (verificationState === 'processing') setIsVerifying(false);
        }
      }, 5000);

      try {
        const [globalSettings, { data: { session } }] = await Promise.all([
          store.getSettings(),
          supabase.auth.getSession()
        ]);

        if (!isMounted) return;
        setSettings(globalSettings);

        if (session?.user) {
          // Robust Fetch & Create Logic
          let profile = await store.fetchCurrentUser(session.user.id);
          
          if (!profile) {
            console.log("Healing missing profile for authenticated user:", session.user.id);
            const recoveredUser: User = {
              id: session.user.id,
              email: session.user.email!,
              role: session.user.email === (globalSettings?.adminEmail || INITIAL_SETTINGS.adminEmail) ? UserRole.ADMIN : UserRole.USER,
              balance: 0,
              isFrozen: false,
              usedCoupons: [],
              referralCode: store.generateReferralCode(),
              createdAt: new Date().toISOString()
            };
            await store.addUser(recoveredUser);
            profile = recoveredUser;
          }

          if (profile) {
            setCurrentUser(profile);
            store.setCurrentUser(profile);
            
            if (isSignupVerify) {
              setVerificationState('success');
              // Clear the hash from the URL silently
              window.history.replaceState(null, '', window.location.pathname);
              
              // Give them 3 seconds to see the success message
              setTimeout(() => {
                if (isMounted) {
                  setView(profile!.role === UserRole.ADMIN ? 'admin' : 'dashboard');
                  setIsVerifying(false);
                  setLoading(false);
                }
              }, 3000);
            } else {
              setView(profile.role === UserRole.ADMIN ? 'admin' : 'dashboard');
              setLoading(false);
            }
          }
        } else {
          // No session found
          if (isSignupVerify) {
            setVerificationState('failed');
            setTimeout(() => { if (isMounted) setIsVerifying(false); setLoading(false); }, 3000);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Initialization Critical Error:", err);
        setLoading(false);
      } finally {
        if (isMounted) clearTimeout(safetyTimer);
      }
    };

    init();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    store.setCurrentUser(null);
    setCurrentUser(null);
    setView('welcome');
  };

  // Rendering Loading or Verification States
  if (loading || isVerifying) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 text-center">
        {verificationState === 'success' ? (
          <div className="animate-in zoom-in duration-500 space-y-8">
            <div className="w-28 h-28 bg-green-500/20 border border-green-500/30 rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto shadow-2xl shadow-green-500/10 relative">
               <span className="relative z-10">✅</span>
               <div className="absolute inset-0 bg-green-500/20 blur-3xl animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Email Verified</h1>
              <p className="text-slate-400 text-sm font-black uppercase tracking-[0.3em]">Protocol access granted. Entering Node...</p>
            </div>
          </div>
        ) : verificationState === 'failed' ? (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-[2rem] flex items-center justify-center text-4xl mx-auto">❌</div>
            <p className="text-red-400 font-black uppercase text-xs tracking-widest">Verification Link Expired</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl mx-auto"></div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing MPRO Ecosystem</p>
              {isVerifying && <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Synchronizing Secure Identity...</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Global Maintenance Mode
  if (settings.isGlobalMaintenance && currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center text-5xl animate-pulse border border-amber-500/20 shadow-2xl text-amber-500">⚙️</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">System Calibration</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed font-medium">The MPRO protocol is currently undergoing a structural update. Please check back shortly.</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'welcome': return <WelcomeScreen onLogin={() => setView('auth')} onSignUp={() => setView('auth')} />;
      case 'auth': return <Auth onBack={() => setView('welcome')} onAuthSuccess={(u) => { setCurrentUser(u); setView(u.role === UserRole.ADMIN ? 'admin' : 'dashboard'); }} />;
      case 'dashboard': return currentUser ? <Dashboard user={currentUser} onLogout={handleLogout} /> : <WelcomeScreen onLogin={() => setView('auth')} onSignUp={() => setView('auth')} />;
      case 'admin': return currentUser?.role === UserRole.ADMIN ? <AdminPanel user={currentUser} onLogout={handleLogout} /> : <WelcomeScreen onLogin={() => setView('auth')} onSignUp={() => setView('auth')} />;
      default: return <WelcomeScreen onLogin={() => setView('auth')} onSignUp={() => setView('auth')} />;
    }
  };

  return <div className="min-h-screen w-full selection:bg-indigo-500 selection:text-white">{renderView()}</div>;
};

export default App;
