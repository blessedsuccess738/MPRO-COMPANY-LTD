
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
