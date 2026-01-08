
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { store } from './store';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [view, setView] = useState<'welcome' | 'auth' | 'dashboard' | 'admin'>('welcome');
  const settings = store.getSettings();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN) {
        setView('admin');
      } else {
        setView('dashboard');
      }
    } else {
      setView('welcome');
    }
  }, [currentUser]);

  const handleLogout = () => {
    store.setCurrentUser(null);
    setCurrentUser(null);
    setView('welcome');
  };

  // Maintenance Check
  if (settings.isGlobalMaintenance && currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-5xl animate-pulse border border-amber-500/20">
          ⚙️
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">System Calibration</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            The MPRO protocol is currently undergoing a structural update to improve asset deployment efficiency. Please return in a few hours.
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
