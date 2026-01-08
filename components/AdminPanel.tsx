
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
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'deposits' | 'coupons' | 'support' | 'settings' | 'products'>('users');
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [transactions, setTransactions] = useState<Transaction[]>(store.getTransactions());
  const [settings, setSettings] = useState<GlobalSettings>(store.getSettings());
  const [coupons, setCoupons] = useState<Coupon[]>(store.getCoupons());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  // Modals / Input States
  const [warningUser, setWarningUser] = useState<User | null>(null);
  const [warningText, setWarningText] = useState('');
  const [couponAmount, setCouponAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 0, dailyRoi: 26, duration: 30, imageUrl: ''
  });

  const stats = useMemo(() => {
    const totalDeposits = transactions.filter(t => (t.type === TransactionType.DEPOSIT || t.type === TransactionType.MANUAL_DEPOSIT) && t.status === TransactionStatus.PAID).reduce((acc, curr) => acc + curr.amount, 0);
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
      setSettings(store.getSettings());
      setCoupons(store.getCoupons());
      setProducts(store.getProducts());
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
    const newC: Coupon = { id: 'c-' + Date.now(), code, amount, createdAt: new Date().toISOString() };
    store.addCoupon(newC);
    setCouponAmount('');
    setCouponCode('');
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    const prod: Product = {
      id: 'p-' + Date.now(),
      name: newProduct.name!,
      price: Number(newProduct.price),
      dailyRoi: Number(newProduct.dailyRoi),
      duration: Number(newProduct.duration),
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1611974714850-eb607f74d082?auto=format&fit=crop&w=600'
    };
    store.addProduct(prod);
    setNewProduct({ name: '', price: 0, dailyRoi: 26, duration: 30, imageUrl: '' });
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
            { id: 'deposits', label: 'Deposits', icon: '📥' },
            { id: 'products', label: 'Marketplace', icon: '📦' },
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
        <button onClick={onLogout} className="m-6 p-4 bg-red-600/10 text-red-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-red-500/10">End Session</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 bg-transparent no-scrollbar relative">
         <div className="max-w-6xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               {[
                 { label: 'Active Users', val: stats.totalUsers, color: 'text-white' },
                 { label: 'Net Inflow', val: `${CURRENCY}${stats.totalDeposits.toLocaleString()}`, color: 'text-green-400' },
                 { label: 'Payout Requests', val: `${CURRENCY}${stats.pendingWithdrawals.toLocaleString()}`, color: 'text-amber-400' },
                 { label: 'Deposit Queue', val: stats.pendingDepositsCount, color: 'text-indigo-400' }
               ].map((s, idx) => (
                 <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                    <p className={`text-3xl font-black tracking-tighter ${s.color}`}>{s.val}</p>
                 </div>
               ))}
            </div>

            {activeTab === 'users' && (
               <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="p-8 border-b border-white/5"><h3 className="font-black uppercase tracking-widest text-sm text-white">Registry</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                          <tr><th className="p-8">Sync ID</th><th className="p-8">Balance</th><th className="p-8">Status</th><th className="p-8">Control</th></tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {users.map(u => (
                             <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-8">
                                  <div className="font-bold text-white">{u.email}</div>
                                  {u.warningMessage && <div className="text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1">⚠️ Warning Logged</div>}
                                </td>
                                <td className="p-8 font-black text-indigo-400">{CURRENCY}{u.balance.toLocaleString()}</td>
                                <td className="p-8 space-x-2">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black ${u.isFrozen ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{u.isFrozen ? 'FROZEN' : 'ACTIVE'}</span>
                                  {u.isRestricted && <span className="px-3 py-1 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 uppercase">RESTRICTED</span>}
                                </td>
                                <td className="p-8 flex gap-2">
                                   <button onClick={() => store.updateUser(u.id, { isFrozen: !u.isFrozen })} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-lg">{u.isFrozen ? 'Unfreeze' : 'Freeze'}</button>
                                   <button onClick={() => store.updateUser(u.id, { isRestricted: !u.isRestricted })} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-lg">{u.isRestricted ? 'Unrestrict' : 'Restrict'}</button>
                                   <button onClick={() => { setWarningUser(u); setWarningText(u.warningMessage || ''); }} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg">Warn</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            )}

            {activeTab === 'deposits' && (
              <div className="bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md overflow-hidden">
                <div className="p-8 border-b border-white/5"><h3 className="font-black uppercase tracking-widest text-sm text-white">Manual Inflow Registry</h3></div>
                <table className="w-full text-left text-sm">
                   <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                      <tr><th className="p-8">Participant</th><th className="p-8">Quantity</th><th className="p-8">Proof</th><th className="p-8">Audit</th></tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).map(t => (
                         <tr key={t.id}>
                            <td className="p-8 text-white font-medium">{users.find(u => u.id === t.userId)?.email}</td>
                            <td className="p-8 font-black text-white">{CURRENCY}{t.amount.toLocaleString()}</td>
                            <td className="p-8">
                               {t.proofImageUrl ? (
                                  <button onClick={() => setViewProofUrl(t.proofImageUrl!)} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-lg hover:bg-indigo-500/10 transition-all">View Proof</button>
                               ) : (
                                  <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">No Proof Attached</span>
                               )}
                            </td>
                            <td className="p-8 flex gap-6">
                               <button onClick={() => handleManualDeposit(t.id, true)} className="text-green-400 font-black uppercase text-[10px] tracking-widest">Confirm</button>
                               <button onClick={() => handleManualDeposit(t.id, false)} className="text-red-400 font-black uppercase text-[10px] tracking-widest">Reject</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-8">
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-6 backdrop-blur-md">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Deploy New Asset</h3>
                  <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Asset Name</label>
                      <input type="text" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-indigo-500" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Price ({CURRENCY})</label>
                      <input type="number" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-indigo-500" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Daily ROI (%)</label>
                      <input type="number" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-indigo-500" value={newProduct.dailyRoi} onChange={(e) => setNewProduct({...newProduct, dailyRoi: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Duration (Days)</label>
                      <input type="number" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-indigo-500" value={newProduct.duration} onChange={(e) => setNewProduct({...newProduct, duration: Number(e.target.value)})} />
                    </div>
                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Image URL</label>
                      <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-1 focus:ring-indigo-500" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20">Add Asset to Market</button>
                    </div>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden group">
                      <img src={p.imageUrl} className="w-full h-40 object-cover opacity-50 group-hover:opacity-100 transition-all" alt={p.name} />
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-white uppercase">{p.name}</h4>
                          <span className="text-indigo-400 font-black text-xs">{p.dailyRoi}% ROI</span>
                        </div>
                        <p className="text-sm font-bold text-indigo-200">{CURRENCY}{p.price.toLocaleString()} • {p.duration} Days</p>
                        <button onClick={() => { /* Store needs a delete product method */ }} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/10">Remove Asset</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'coupons' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 space-y-8 backdrop-blur-md">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Coupon Protocol</h3>
                   <form onSubmit={generateCoupon} className="space-y-6">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Bonus Amount (₦)</label>
                         <input type="number" required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black text-xl" value={couponAmount} onChange={(e) => setCouponAmount(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Custom Code (Optional)</label>
                         <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black uppercase tracking-widest" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                      </div>
                      <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest">Generate Coupon</button>
                   </form>
                </div>
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md overflow-hidden">
                   <div className="p-8 border-b border-white/5"><h3 className="font-black uppercase tracking-widest text-sm text-white">Live Coupons</h3></div>
                   <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                      <table className="w-full text-left text-sm">
                         <tbody className="divide-y divide-white/5">
                            {coupons.map(c => (
                               <tr key={c.id}>
                                  <td className="p-6 font-black text-white uppercase tracking-widest">{c.code}</td>
                                  <td className="p-6 font-black text-indigo-400">{CURRENCY}{c.amount.toLocaleString()}</td>
                                  <td className="p-6 text-right"><button onClick={() => store.deleteCoupon(c.id)} className="text-red-500 font-black text-[10px] uppercase">Revoke</button></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'withdrawals' && (
               <div className="bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest text-sm text-white">Payout Audit</h3>
                    <button onClick={() => updateSetting('isWithdrawalMaintenance', !settings.isWithdrawalMaintenance)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${settings.isWithdrawalMaintenance ? 'bg-red-500 text-white' : 'bg-green-500/10 text-green-500'}`}>
                      {settings.isWithdrawalMaintenance ? 'Withdrawal Blocked' : 'Withdrawal Live'}
                    </button>
                  </div>
                  <table className="w-full text-left text-sm">
                     <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                        <tr><th className="p-8">Sync ID</th><th className="p-8">Amount</th><th className="p-8">Node Details</th><th className="p-8">Audit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).map(t => (
                           <tr key={t.id}>
                              <td className="p-8 text-white font-medium">{users.find(u => u.id === t.userId)?.email}</td>
                              <td className="p-8 font-black text-white">{CURRENCY}{t.amount.toLocaleString()}</td>
                              <td className="p-8">
                                 <p className="font-black uppercase text-xs text-white">{t.bankName}</p>
                                 <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest">{t.accountNumber} • {t.accountName}</p>
                              </td>
                              <td className="p-8 flex gap-6">
                                 <button onClick={() => handleWithdrawal(t.id, true)} className="text-green-400 font-black uppercase text-[10px] tracking-widest">Approve</button>
                                 <button onClick={() => handleWithdrawal(t.id, false)} className="text-red-400 font-black uppercase text-[10px] tracking-widest">Decline</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'settings' && (
               <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 space-y-12 backdrop-blur-md">
                  <div className="flex justify-between items-center border-b border-white/5 pb-8">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">Protocol Calibration</h3>
                    <button onClick={() => updateSetting('isGlobalMaintenance', !settings.isGlobalMaintenance)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.isGlobalMaintenance ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/20' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>
                       {settings.isGlobalMaintenance ? 'MASTER MAINT. ON' : 'SYSTEM LIVE'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h4 className="text-md font-black uppercase text-indigo-500 tracking-widest italic">Manual Collection Node</h4>
                      <div className="space-y-6 p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" value={settings.manualBankName} onChange={(e) => updateSetting('manualBankName', e.target.value)} />
                        </div>
                        <div className="space-y-2 pt-6 border-t border-white/5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" value={settings.manualAccountNumber} onChange={(e) => updateSetting('manualAccountNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2 pt-6 border-t border-white/5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Name</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none" value={settings.manualAccountName} onChange={(e) => updateSetting('manualAccountName', e.target.value)} />
                        </div>
                      </div>

                      <h4 className="text-md font-black uppercase text-indigo-500 tracking-widest italic mt-12">Visual Protocol</h4>
                      <div className="space-y-6 p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Landing (Welcome) Backdrop</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={settings.welcomeBackgroundUrl} onChange={(e) => updateSetting('welcomeBackgroundUrl', e.target.value)} placeholder="URL link" />
                           <div className="flex items-center gap-2 mt-2">
                             <input type="checkbox" checked={settings.isWelcomeVideo} onChange={(e) => updateSetting('isWelcomeVideo', e.target.checked)} className="accent-indigo-500" />
                             <label className="text-[9px] font-black text-slate-500 uppercase">Use as Video Node</label>
                           </div>
                        </div>
                        <div className="space-y-2 pt-6 border-t border-white/5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Auth (Login/Signup) Backdrop</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={settings.authBackgroundUrl} onChange={(e) => updateSetting('authBackgroundUrl', e.target.value)} placeholder="URL link" />
                           <div className="flex items-center gap-2 mt-2">
                             <input type="checkbox" checked={settings.isAuthVideo} onChange={(e) => updateSetting('isAuthVideo', e.target.checked)} className="accent-indigo-500" />
                             <label className="text-[9px] font-black text-slate-500 uppercase">Use as Video Node</label>
                           </div>
                        </div>
                        <div className="space-y-2 pt-6 border-t border-white/5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Member Dashboard Backdrop</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={settings.userPanelBackgroundUrl} onChange={(e) => updateSetting('userPanelBackgroundUrl', e.target.value)} placeholder="URL link" />
                           <div className="flex items-center gap-2 mt-2">
                             <input type="checkbox" checked={settings.isUserPanelVideo} onChange={(e) => updateSetting('isUserPanelVideo', e.target.checked)} className="accent-indigo-500" />
                             <label className="text-[9px] font-black text-slate-500 uppercase">Use as Video Node</label>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-md font-black uppercase text-indigo-500 tracking-widest italic">Core Parameters</h4>
                      <div className="space-y-6 p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Standard Min Payout (₦)</label>
                           <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black" value={settings.minWithdrawal} onChange={(e) => updateSetting('minWithdrawal', Number(e.target.value))} />
                        </div>
                        <div className="space-y-2 pt-6 border-t border-white/5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Support/Admin Telegram Link</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs outline-none" value={settings.telegramAdminLink} onChange={(e) => updateSetting('telegramAdminLink', e.target.value)} />
                        </div>
                        <div className="space-y-2 pt-6 border-t border-white/5">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Broadcast Channel Link</label>
                           <input type="text" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs outline-none" value={settings.telegramChannelLink} onChange={(e) => updateSetting('telegramChannelLink', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'support' && (
               <div className="grid grid-cols-3 gap-10">
                  <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden h-[700px] flex flex-col shadow-2xl">
                     <div className="p-6 bg-white/[0.02] font-black text-[10px] uppercase tracking-widest border-b border-white/5 text-slate-500">Live Support Nodes</div>
                     <div className="flex-1 overflow-y-auto no-scrollbar">
                        {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
                           <button key={u.id} onClick={() => setSelectedChatUserId(u.id)} className={`w-full p-6 text-left border-b border-white/5 hover:bg-white/[0.03] transition-colors ${selectedChatUserId === u.id ? 'bg-indigo-600/10 border-l-4 border-l-indigo-600' : ''}`}>
                              <p className="font-black text-xs text-white truncate">{u.email}</p>
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="col-span-2">
                     {selectedChatUserId ? <Chat user={user} isAdmin={true} targetUserId={selectedChatUserId} /> : <div className="h-full bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center space-y-4"><span className="text-6xl grayscale opacity-10">💬</span><p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs">Awaiting node sync...</p></div>}
                  </div>
               </div>
            )}
         </div>

         {/* Warning Modal */}
         {warningUser && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 space-y-6 shadow-3xl">
                 <div className="text-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Issue Sync Warning</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Target: {warningUser.email}</p>
                 </div>
                 <textarea 
                    className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white font-medium text-sm resize-none"
                    placeholder="Provide detailed instruction to user..."
                    value={warningText}
                    onChange={(e) => setWarningText(e.target.value)}
                  />
                 <div className="flex gap-4">
                    <button onClick={() => setWarningUser(null)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    <button onClick={() => { store.updateUser(warningUser.id, { warningMessage: warningText }); setWarningUser(null); setUsers(store.getUsers()); }} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Apply Warning</button>
                 </div>
              </div>
           </div>
         )}

         {/* View Proof Modal */}
         {viewProofUrl && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6" onClick={() => setViewProofUrl(null)}>
               <div className="max-w-4xl w-full h-full flex flex-col items-center justify-center p-12">
                  <img src={viewProofUrl} alt="Transaction Proof" className="max-w-full max-h-full object-contain rounded-2xl shadow-3xl border border-white/10" />
                  <button onClick={() => setViewProofUrl(null)} className="mt-8 px-12 py-4 bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl">Close Asset Node</button>
               </div>
            </div>
         )}
      </main>
    </div>
  );
};

export default AdminPanel;
