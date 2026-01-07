
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Product, Investment, Transaction, ChatMessage, GlobalSettings, TransactionType, TransactionStatus } from './types';
import { store } from './store';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import SignUp from './components/SignUp';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [view, setView] = useState<'welcome' | 'login' | 'signup' | 'dashboard' | 'admin'>('welcome');

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

  const navigateTo = (newView: typeof view) => {
    setView(newView);
  };

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <WelcomeScreen onLogin={() => setView('login')} onSignUp={() => setView('signup')} />;
      case 'login':
        return <Login onBack={() => setView('welcome')} onLoginSuccess={(u) => { setCurrentUser(u); }} />;
      case 'signup':
        return <SignUp onBack={() => setView('welcome')} onSignUpSuccess={(u) => { setCurrentUser(u); }} />;
      case 'dashboard':
        return currentUser ? <Dashboard user={currentUser} onLogout={handleLogout} /> : null;
      case 'admin':
        return currentUser?.role === UserRole.ADMIN ? <AdminPanel user={currentUser} onLogout={handleLogout} /> : null;
      default:
        return <WelcomeScreen onLogin={() => setView('login')} onSignUp={() => setView('signup')} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderView()}
    </div>
  );
};

export default App;
