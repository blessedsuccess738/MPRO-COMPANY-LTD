
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
  const [verficationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Detect if we are returning from an email verification link
      // Supabase appends #access_token or similar to the URL
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=signup'))) {
        setIsVerifying(true);
      }

      const safetyTimer = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
          setIsVerifying(false);
        }
      }, 3500);

      try {
        const [globalSettings, { data: { session } }] = await Promise.all([
          store.getSettings(),
          supabase.auth.getSession()
        ]);

        if (!isMounted) return;
        setSettings(globalSettings);

        if (session?.user) {
          let profile = await store.fetchCurrentUser(session.user.id);
          
          // Self-Healing: If user is authed but has no profile record (common after verification redirect)
          if (!profile) {
            console.log("Healing missing profile for verified user...");
            const recoveredUser: User = {
              id: session.user.id,
              email: session.user.email!,
              role: session.user.email === settings.adminEmail ? UserRole.ADMIN : UserRole.USER,
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
            
            if (isVerifying) {
              setVerificationSuccess(true);
              setTimeout(() => {
                if (isMounted) {
                  setView(profile!.role === UserRole.ADMIN ? 'admin' : 'dashboard');
                  setIsVerifying(false);
                  setVerificationSuccess(false);
                }
              }, 3000);
            } else {
              setView(profile.role === UserRole.ADMIN ? 'admin' : 'dashboard');
            }
          }
        } else if (isVerifying) {
          // If hash exists but no session, verification might have failed or expired
          setIsVerifying(false);
        }
      } catch (err) {
        console.warn("Init Error:", err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          if (!isVerifying) setLoading(false);
        }
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

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-8 p-6 text-center">
        {verficationSuccess ? (
          <div className="animate-in zoom-in duration-500 space-y-6">
            <div className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto shadow-2xl shadow-green-500/10">✅</div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Node Verified</h1>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Protocol access granted. Redirecting...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Initializing Protocol</p>
              {isVerifying && <p className="text-[9px] text-indigo-400 font-bold uppercase animate-pulse">Synchronizing Secure Identity...</p>}
            </div>
          </>
        )}
      </div>
    );
  }

  if (settings.isGlobalMaintenance && currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center text-5xl animate-pulse border border-amber-500/20 shadow-2xl">⚙️</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">System Calibration</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">The MPRO protocol is currently undergoing a structural update.</p>
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

  return <div className="min-h-screen w-full">{renderView()}</div>;
};

export default App;
