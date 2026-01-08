
import React, { useState, useEffect } from 'react';
import { User, UserRole, GlobalSettings } from './types';
import { store, supabase } from './store';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import { INITIAL_SETTINGS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [view, setView] = useState<'welcome' | 'auth' | 'dashboard' | 'admin'>('welcome');
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const globalSettings = await store.getSettings();
      setSettings(globalSettings);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const profile = await store.fetchCurrentUser(session.user.email);
        if (profile) {
          setCurrentUser(profile);
          store.setCurrentUser(profile);
          setView(profile.role === UserRole.ADMIN ? 'admin' : 'dashboard');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    store.setCurrentUser(null);
    setCurrentUser(null);
    setView('welcome');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (settings.isGlobalMaintenance && currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-5xl animate-pulse border border-amber-500/20">
          ⚙️
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">System Calibration</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            The MPRO protocol is currently undergoing a structural update. Please return later.
          </p>
        </div>
        <div className="pt-8 border-t border-white/5 w-48">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol 4.2.0-MAIN</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <WelcomeScreen onLogin={() => setView('auth')} onSignUp={() => setView('auth')} />;
      case 'auth':
        return <Auth onBack={() => setView('welcome')} onAuthSuccess={(u) => { setCurrentUser(u); }} />;
      case 'dashboard':
        return currentUser ? <Dashboard user={currentUser} onLogout={handleLogout} /> : null;
      case 'admin':
        return currentUser?.role === UserRole.ADMIN ? <AdminPanel user={currentUser} onLogout={handleLogout} /> : null;
      default:
        return <WelcomeScreen onLogin={() => setView('auth')} onSignUp={() => setView('auth')} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderView()}
    </div>
  );
};

export default App;
