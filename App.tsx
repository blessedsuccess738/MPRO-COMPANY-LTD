
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

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // MASTER SAFETY TIMEOUT: Force show UI after 2.5 seconds regardless of DB state
      const safetyTimer = setTimeout(() => {
        if (isMounted) setLoading(false);
      }, 2500);

      try {
        // Run session check and settings fetch in parallel with a timeout
        const results = await Promise.race([
          Promise.all([
            store.getSettings(),
            supabase.auth.getSession()
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000))
        ]) as [GlobalSettings, any];

        if (!isMounted) return;

        const [globalSettings, sessionData] = results;
        setSettings(globalSettings);

        const session = sessionData?.data?.session;
        if (session?.user?.email) {
          const profile = await store.fetchCurrentUser(session.user.email);
          if (profile && isMounted) {
            setCurrentUser(profile);
            store.setCurrentUser(profile);
            setView(profile.role === UserRole.ADMIN ? 'admin' : 'dashboard');
          }
        }
      } catch (err) {
        console.warn("Init Warning (falling back to local):", err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Initializing Protocol</p>
      </div>
    );
  }

  // Global Maintenance Mode
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

  return (
    <div className="min-h-screen w-full">
      {renderView()}
    </div>
  );
};

export default App;
