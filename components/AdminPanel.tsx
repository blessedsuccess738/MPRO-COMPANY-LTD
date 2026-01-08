
import React, { useState, useMemo, useEffect } from 'react';
import { User, Product, Transaction, TransactionType, TransactionStatus, GlobalSettings, UserRole, Coupon } from '../types';
import { store } from '../store';
import { CURRENCY, APP_NAME } from '../constants';
import Chat from './Chat';

interface Props {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'deposits' | 'coupons' | 'support' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [transactions, setTransactions] = useState<Transaction[]>(store.getTransactions());
  const [settings, setSettings] = useState<GlobalSettings>(store.getSettings());
  const [coupons, setCoupons] = useState<Coupon[]>(store.getCoupons());
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  // Modals / Input States
  const [warningUser, setWarningUser] = useState<User | null>(null);
  const [warningText, setWarningText] = useState('');
  const [couponAmount, setCouponAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');

  const stats = useMemo(() => {
    const totalDeposits = transactions.filter(t => t.type === TransactionType.DEPOSIT || (t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PAID)).reduce((acc, curr) => acc + curr.amount, 0);
    const pendingWithdrawals = transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).reduce((acc, curr) => acc + curr.amount, 0);
    return { totalUsers: users.length, totalDeposits, pendingWithdrawals, pendingDepositsCount: transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).length };
  }, [users, transactions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUsers(store.getUsers());
      setTransactions(store.getTransactions());
      setSettings(store.getSettings());
      setCoupons(store.getCoupons());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const updateSetting = (key: keyof GlobalSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    store.updateSettings(updated);
    setSettings(updated);
  };

  const handleWithdrawal = (id: string, approve: boolean) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    store.updateTransactionStatus(id, approve ? TransactionStatus.PAID : TransactionStatus.REJECTED);
    if (!approve) {
      const u = store.getUsers().find(u => u.id === tx.userId);
      if (u) store.updateUser(u.id, { balance: u.balance + tx.amount });
    }
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
  };

  const generateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(couponAmount);
    if (isNaN(amount) || amount <= 0) return;
    const code = couponCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase();
    const newCoupon: Coupon = { id: 'c-' + Date.now(), code, amount, createdAt: new Date().toISOString() };
    store.addCoupon(newCoupon);
    setCoupons(store.getCoupons());
    setCouponAmount('');
    setCouponCode('');
  };

  const toggleRestriction = (u: User) => {
    store.updateUser(u.id, { isRestricted: !u.isRestricted });
    setUsers(store.getUsers());
  };

  return (
    <div className="flex h-screen bg-[#070b14] overflow-hidden text-slate-300">
      <aside className="w-64 bg-[#0f172a] flex flex-col shadow-2xl border-r border-white/5">
        <div className="p-8 border-b border-white/5">
           <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">MPRO <span className="text-indigo-500">ADMIN</span></h2>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-8 overflow-y-auto no-scrollbar">
          {[
            { id: 'users', label: 'Participants', icon: '👤' },
            { id: 'withdrawals', label: 'Payouts', icon: '💰' },
            { id: 'deposits', label: 'Inflow', icon: '📥' },
            { id: 'coupons', label: 'Coupons', icon: '🎟️' },
            { id: 'support', label: 'Support', icon: '💬' },
            { id: 'settings', label: 'Config', icon: '⚙️' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'hover:bg-white/5 text-slate-500'}`}>
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="m-6 p-4 bg-red-600/10 text-red-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-red-500/10">Logout</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 bg-transparent no-scrollbar relative">
         <div className="max-w-6xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               {[
                 { label: 'Participants', val: stats.totalUsers, color: 'text-white' },
                 { label: 'Inflow Pool', val: `${CURRENCY}${stats.totalDeposits.toLocaleString()}`, color: 'text-green-400' },
                 { label: 'Owed Payouts', val: `${CURRENCY}${stats.pendingWithdrawals.toLocaleString()}`, color: 'text-amber-400' },
                 { label: 'Audit Queue', val: stats.pendingDepositsCount, color: 'text-indigo-400' }
               ].map((s, idx) => (
                 <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                    <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}</p>
                 </div>
               ))}
            </div>

            {activeTab === 'users' && (
               <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="p-8 border-b border-white/5"><h3 className="font-black uppercase tracking-widest text-sm text-white">Registry</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                          <tr><th className="p-8">Sync ID</th><th className="p-8">Capital</th><th className="p-8">Status</th><th className="p-8">Governance</th></tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {users.map(u => (
                             <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-8"><div className="font-bold text-white">{u.email}</div>{u.warningMessage && <div className="text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">⚠️ Warning Active</div>}</td>
                                <td className="p-8 font-black text-indigo-400">{CURRENCY}{u.balance.toLocaleString()}</td>
                                <td className="p-8 space-x-2"><span className={`px-3 py-1 rounded-full text-[9px] font-black ${u.isFrozen ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{u.isFrozen ? 'LOCKED' : 'ACTIVE'}</span>{u.isRestricted && <span className="px-3 py-1 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 uppercase">RESTRICTED</span>}</td>
                                <td className="p-8 flex gap-2">
                                   <button onClick={() => store.updateUser(u.id, { isFrozen: !u.isFrozen })} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5">{u.isFrozen ? 'Unfreeze' : 'Freeze'}</button>
                                   <button onClick={() => toggleRestriction(u)} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5">{u.isRestricted ? 'Unrestrict' : 'Restrict'}</button>
                                   <button onClick={() => { setWarningUser(u); setWarningText(u.warningMessage || ''); }} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg">Warn</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            )}

            {activeTab === 'coupons' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-6 backdrop-blur-md">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Forge Coupon</h3>
                   <form onSubmit={generateCoupon} className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Value (₦)</label>
                         <input type="number" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-black" value={couponAmount} onChange={(e) => setCouponAmount(e.target.value)} placeholder="500.00" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Code (Optional)</label>
                         <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-black uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Leave blank for random" />
                      </div>
                      <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">Deploy Coupon</button>
                   </form>
                </div>
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md overflow-hidden">
                   <div className="p-8 border-b border-white/5"><h3 className="font-black uppercase tracking-widest text-sm text-white">Active Coupons</h3></div>
                   <div className="overflow-y-auto max-h-[400px]">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                            <tr><th className="p-6">Code</th><th className="p-6">Value</th><th className="p-6">Action</th></tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {coupons.map(c => (
                               <tr key={c.id}>
                                  <td className="p-6 font-black text-white uppercase tracking-widest">{c.code}</td>
                                  <td className="p-6 font-black text-indigo-400">{CURRENCY}{c.amount.toLocaleString()}</td>
                                  <td className="p-6"><button onClick={() => store.deleteCoupon(c.id)} className="text-red-500 font-black uppercase text-[10px]">Purge</button></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
               <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 space-y-10 backdrop-blur-md">
                  <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">Calibration Node</h3>
                    <div className="flex gap-4">
                        <button onClick={() => updateSetting('isGlobalMaintenance', !settings.isGlobalMaintenance)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl ${settings.isGlobalMaintenance ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                          Master Switch: {settings.isGlobalMaintenance ? 'OFFLINE' : 'LIVE'}
                        </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-md font-black uppercase text-indigo-500">Visual Protocol (Media)</h4>
                      <div className="space-y-4 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Welcome Screen Media URL</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs" value={settings.welcomeBackgroundUrl} onChange={(e) => updateSetting('welcomeBackgroundUrl', e.target.value)} />
                           <button onClick={() => updateSetting('isWelcomeVideo', !settings.isWelcomeVideo)} className="text-[9px] font-black uppercase text-indigo-400 mt-2">{settings.isWelcomeVideo ? 'Currently: Video' : 'Currently: Static'}</button>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-white/5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Auth Screen Media URL</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs" value={settings.authBackgroundUrl} onChange={(e) => updateSetting('authBackgroundUrl', e.target.value)} />
                           <button onClick={() => updateSetting('isAuthVideo', !settings.isAuthVideo)} className="text-[9px] font-black uppercase text-indigo-400 mt-2">{settings.isAuthVideo ? 'Currently: Video' : 'Currently: Static'}</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-black uppercase text-indigo-500">Threshold Config</h4>
                      <div className="space-y-4 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Min Withdrawal (₦)</label>
                           <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white" value={settings.minWithdrawal} onChange={(e) => updateSetting('minWithdrawal', parseInt(e.target.value))} />
                        </div>
                        <div className="flex items-center justify-between pt-4">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Withdrawal Protocol</p>
                           <button onClick={() => updateSetting('isWithdrawalMaintenance', !settings.isWithdrawalMaintenance)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${settings.isWithdrawalMaintenance ? 'bg-red-500 text-white' : 'bg-green-500/10 text-green-500'}`}>
                             {settings.isWithdrawalMaintenance ? 'MAINTENANCE' : 'SYSTEM LIVE'}
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'withdrawals' && (
               <div className="bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md overflow-hidden">
                  <div className="p-8 border-b border-white/5"><h3 className="font-black uppercase tracking-widest text-sm text-white">Payout Authorization</h3></div>
                  <table className="w-full text-left text-sm">
                     <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                        <tr><th className="p-8">Participant</th><th className="p-8">Quantity</th><th className="p-8">Target Node</th><th className="p-8">Actions</th></tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).map(t => (
                           <tr key={t.id}>
                              <td className="p-8 text-white font-medium">{users.find(u => u.id === t.userId)?.email}</td>
                              <td className="p-8 font-black text-white">{CURRENCY}{t.amount.toLocaleString()}</td>
                              <td className="p-8">
                                 <p className="font-black uppercase text-xs tracking-tight text-white">{t.bankName}</p>
                                 <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">{t.accountNumber} • {t.accountName}</p>
                              </td>
                              <td className="p-8 flex items-center space-x-6">
                                 <button onClick={() => handleWithdrawal(t.id, true)} className="text-green-400 font-black uppercase text-[10px] tracking-widest hover:text-green-300">Approve</button>
                                 <button onClick={() => handleWithdrawal(t.id, false)} className="text-red-400 font-black uppercase text-[10px] tracking-widest hover:text-red-300">Decline</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'support' && (
               <div className="grid grid-cols-3 gap-10">
                  <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden h-[700px] flex flex-col shadow-2xl">
                     <div className="p-6 bg-white/[0.02] font-black text-[10px] uppercase tracking-widest border-b border-white/5 text-slate-500">Active Nodes</div>
                     <div className="flex-1 overflow-y-auto no-scrollbar">
                        {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
                           <button key={u.id} onClick={() => setSelectedChatUserId(u.id)} className={`w-full p-6 text-left border-b border-white/5 hover:bg-white/[0.03] transition-colors ${selectedChatUserId === u.id ? 'bg-indigo-600/10 border-l-4 border-l-indigo-600' : ''}`}>
                              <p className="font-black text-xs text-white truncate">{u.email}</p>
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="col-span-2">
                     {selectedChatUserId ? <Chat user={user} isAdmin={true} targetUserId={selectedChatUserId} /> : <div className="h-full bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center space-y-4"><span className="text-6xl grayscale opacity-10">💬</span><p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs text-center">Select channel</p></div>}
                  </div>
               </div>
            )}
         </div>

         {/* Warning Modal */}
         {warningUser && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 space-y-6 shadow-3xl">
                 <div className="text-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sync Warning</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{warningUser.email}</p>
                 </div>
                 <textarea 
                    className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white font-medium text-sm resize-none"
                    placeholder="Message..."
                    value={warningText}
                    onChange={(e) => setWarningText(e.target.value)}
                  />
                 <div className="flex gap-4">
                    <button onClick={() => setWarningUser(null)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
                    <button onClick={() => { store.updateUser(warningUser.id, { warningMessage: warningText }); setWarningUser(null); setUsers(store.getUsers()); }} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl shadow-indigo-600/20">Send</button>
                 </div>
              </div>
           </div>
         )}
      </main>
    </div>
  );
};

export default AdminPanel;
