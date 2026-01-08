
import React, { useState, useMemo, useEffect } from 'react';
import { User, Product, Transaction, TransactionType, TransactionStatus, GlobalSettings, UserRole } from '../types';
import { store } from '../store';
import { CURRENCY, APP_NAME } from '../constants';
import Chat from './Chat';

interface Props {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'deposits' | 'products' | 'support' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [transactions, setTransactions] = useState<Transaction[]>(store.getTransactions());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [settings, setSettings] = useState<GlobalSettings>(store.getSettings());
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalDeposits = transactions.filter(t => t.type === TransactionType.DEPOSIT || (t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PAID)).reduce((acc, curr) => acc + curr.amount, 0);
    const pendingWithdrawals = transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).reduce((acc, curr) => acc + curr.amount, 0);
    return {
      totalUsers: users.length,
      totalDeposits,
      pendingWithdrawals,
      pendingDepositsCount: transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).length
    };
  }, [users, transactions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUsers(store.getUsers());
      setTransactions(store.getTransactions());
      setProducts(store.getProducts());
      setSettings(store.getSettings());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleWithdrawal = (id: string, approve: boolean) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    store.updateTransactionStatus(id, approve ? TransactionStatus.PAID : TransactionStatus.REJECTED);
    if (!approve) {
      const u = store.getUsers().find(u => u.id === tx.userId);
      if (u) store.updateUser(u.id, { balance: u.balance + tx.amount });
    }
    setTransactions(store.getTransactions());
  };

  const handleManualDeposit = (id: string, approve: boolean) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (approve) {
      const u = store.getUsers().find(u => u.id === tx.userId);
      if (u) store.updateUser(u.id, { balance: u.balance + tx.amount });
      store.updateTransactionStatus(id, TransactionStatus.PAID);
    } else {
      store.updateTransactionStatus(id, TransactionStatus.REJECTED);
    }
    setTransactions(store.getTransactions());
  };

  const updateSetting = (key: keyof GlobalSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    store.updateSettings(updated);
    setSettings(updated);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/5">
           <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">MPRO <span className="text-indigo-500">INVEST</span></h2>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-8 overflow-y-auto no-scrollbar">
          {[
            { id: 'users', label: 'Members', icon: '👤' },
            { id: 'withdrawals', label: 'Payouts', icon: '💰' },
            { id: 'deposits', label: 'Manual Dep.', icon: '📥' },
            { id: 'products', label: 'Assets', icon: '📦' },
            { id: 'support', label: 'Live Support', icon: '💬' },
            { id: 'settings', label: 'Config', icon: '⚙️' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'hover:bg-slate-800 text-slate-500'}`}>
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="m-6 p-4 bg-red-900/20 text-red-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-red-900/10 hover:bg-red-900/30 transition-all">Terminate Session</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 bg-slate-50 no-scrollbar">
         <div className="max-w-6xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member Count</p>
                  <p className="text-4xl font-black tracking-tighter">{stats.totalUsers}</p>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Inflow</p>
                  <p className="text-4xl font-black tracking-tighter text-green-600">{CURRENCY}{stats.totalDeposits.toLocaleString()}</p>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Payout</p>
                  <p className="text-4xl font-black tracking-tighter text-amber-600">{CURRENCY}{stats.pendingWithdrawals.toLocaleString()}</p>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inflow Audit</p>
                  <p className="text-4xl font-black tracking-tighter text-indigo-600">{stats.pendingDepositsCount}</p>
               </div>
            </div>

            {activeTab === 'users' && (
               <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest text-sm">Protocol Participants</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                          <tr><th className="p-8">Sync ID (Email)</th><th className="p-8">Asset Balance</th><th className="p-8">Protocol Status</th><th className="p-8">Control</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {users.map(u => (
                             <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="p-8 font-bold text-slate-700">{u.email}</td>
                                <td className="p-8 font-black text-indigo-600">{CURRENCY}{u.balance.toLocaleString()}</td>
                                <td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${u.isFrozen ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isFrozen ? 'LOCKED' : 'ACTIVE'}</span></td>
                                <td className="p-8 flex items-center space-x-6">
                                   <button onClick={() => store.updateUser(u.id, { isFrozen: !u.isFrozen })} className="text-slate-900 font-black text-[10px] uppercase tracking-widest border-b-2 border-slate-200 hover:border-indigo-500 transition-all">Toggle Lock</button>
                                   <button className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline">Purge</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            )}

            {activeTab === 'settings' && (
               <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 space-y-10">
                  <h3 className="text-xl font-black uppercase tracking-tighter border-b border-slate-100 pb-6">Protocol Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telegram Admin Link</label>
                       <input 
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                          value={settings.telegramAdminLink}
                          onChange={(e) => updateSetting('telegramAdminLink', e.target.value)}
                        />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telegram Channel Link</label>
                       <input 
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                          value={settings.telegramChannelLink}
                          onChange={(e) => updateSetting('telegramChannelLink', e.target.value)}
                        />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Withdrawal ({CURRENCY})</label>
                       <input 
                          type="number" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                          value={settings.minWithdrawal}
                          onChange={(e) => updateSetting('minWithdrawal', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Daily ROI (%)</label>
                       <input 
                          type="number" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                          value={settings.defaultRoi}
                          onChange={(e) => updateSetting('defaultRoi', parseInt(e.target.value))}
                        />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-10 space-y-10">
                    <h4 className="text-md font-black uppercase tracking-tighter italic text-indigo-600">User Interface & Maintenance</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dashboard Background URL (Image or Video)</label>
                        <input 
                            type="text" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                            placeholder="Direct URL to mp4 or jpg/png"
                            value={settings.userPanelBackgroundUrl}
                            onChange={(e) => updateSetting('userPanelBackgroundUrl', e.target.value)}
                          />
                      </div>
                      <div className="flex items-center space-x-4 pt-6">
                        <button 
                          onClick={() => updateSetting('isUserPanelVideo', !settings.isUserPanelVideo)}
                          className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${settings.isUserPanelVideo ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {settings.isUserPanelVideo ? 'VIDEO ENABLED' : 'STATIC IMAGE'}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Background Type</p>
                      </div>

                      <div className="flex items-center space-x-4 pt-6">
                        <button 
                          onClick={() => updateSetting('isWithdrawalMaintenance', !settings.isWithdrawalMaintenance)}
                          className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${settings.isWithdrawalMaintenance ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-green-600 text-white'}`}
                        >
                          {settings.isWithdrawalMaintenance ? 'MAINTENANCE ACTIVE' : 'SYSTEM OPERATIONAL'}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Withdrawal Mode</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'withdrawals' && (
               <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-sm">Harvest Audit Queue</h3></div>
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                        <tr><th className="p-8">Participant</th><th className="p-8">Quantity</th><th className="p-8">Protocol Bank</th><th className="p-8">Actions</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).map(t => (
                           <tr key={t.id}>
                              <td className="p-8">{users.find(u => u.id === t.userId)?.email}</td>
                              <td className="p-8 font-black">{CURRENCY}{t.amount.toLocaleString()}</td>
                              <td className="p-8">
                                 <p className="font-black uppercase text-xs tracking-tight">{t.bankName}</p>
                                 <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">{t.accountNumber} • {t.accountName}</p>
                              </td>
                              <td className="p-8 flex items-center space-x-6">
                                 <button onClick={() => handleWithdrawal(t.id, true)} className="text-green-600 font-black uppercase text-[10px] tracking-widest hover:underline transition-all">Approve</button>
                                 <button onClick={() => handleWithdrawal(t.id, false)} className="text-red-600 font-black uppercase text-[10px] tracking-widest hover:underline transition-all">Reject</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'deposits' && (
               <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200">
                  <div className="p-8 border-b border-slate-100"><h3 className="font-black uppercase tracking-widest text-sm">Inflow Audit Requests</h3></div>
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                        <tr><th className="p-8">Participant</th><th className="p-8">Quantity</th><th className="p-8">Timestamp</th><th className="p-8">Control</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).map(t => (
                           <tr key={t.id}>
                              <td className="p-8 font-bold">{users.find(u => u.id === t.userId)?.email}</td>
                              <td className="p-8 font-black text-indigo-600">{CURRENCY}{t.amount.toLocaleString()}</td>
                              <td className="p-8 text-slate-500 font-medium">{new Date(t.createdAt).toLocaleString()}</td>
                              <td className="p-8 flex items-center space-x-6">
                                 <button onClick={() => handleManualDeposit(t.id, true)} className="text-green-600 font-black uppercase text-[10px] tracking-widest hover:underline transition-all">Verify & Credit</button>
                                 <button onClick={() => handleManualDeposit(t.id, false)} className="text-red-600 font-black uppercase text-[10px] tracking-widest hover:underline transition-all">Reject</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'support' && (
               <div className="grid grid-cols-3 gap-10">
                  <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden h-[700px] flex flex-col shadow-sm">
                     <div className="p-6 bg-slate-50 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">Synchronized Channels</div>
                     <div className="flex-1 overflow-y-auto no-scrollbar">
                        {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
                           <button key={u.id} onClick={() => setSelectedChatUserId(u.id)} className={`w-full p-6 text-left border-b border-slate-50 hover:bg-indigo-50 transition-colors ${selectedChatUserId === u.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}>
                              <p className="font-black text-xs text-slate-900 truncate">{u.email}</p>
                              <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Status: Node Active</p>
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="col-span-2">
                     {selectedChatUserId ? <Chat user={user} isAdmin={true} targetUserId={selectedChatUserId} /> : <div className="h-full bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                        <span className="text-6xl grayscale opacity-20">💬</span>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Select a secure channel to initiate sync</p>
                     </div>}
                  </div>
               </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default AdminPanel;
