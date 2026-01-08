
import React, { useState, useMemo, useEffect } from 'react';
import { User, Product, Transaction, TransactionType, TransactionStatus, GlobalSettings, UserRole, Coupon } from '../types';
import { store } from '../store';
import { CURRENCY, APP_NAME, INITIAL_SETTINGS } from '../constants';
import Chat from './Chat';

interface Props {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'deposits' | 'coupons' | 'support' | 'settings' | 'products'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals / Input States
  const [warningUser, setWarningUser] = useState<User | null>(null);
  const [warningText, setWarningText] = useState('');
  const [couponAmount, setCouponAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  
  // Control Funds Modal
  const [fundUser, setFundUser] = useState<User | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundAction, setFundAction] = useState<'add' | 'subtract'>('add');

  // Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 0, dailyRoi: 26, duration: 30, imageUrl: ''
  });

  const fetchData = async () => {
    try {
      const [u, t, s, c, p] = await Promise.all([
        store.getUsers(),
        store.getTransactions(),
        store.getSettings(),
        store.getCoupons(),
        store.getProducts()
      ]);
      setUsers(u || []);
      setTransactions(t || []);
      setSettings(s || INITIAL_SETTINGS);
      setCoupons(c || []);
      setProducts(p || []);
    } catch (err) {
      console.error("Admin Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, []);

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

  const updateSetting = (key: keyof GlobalSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    store.updateSettings(updated);
    setSettings(updated);
  };

  const handleWithdrawal = async (id: string, approve: boolean) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    if (approve) {
      await store.updateTransactionStatus(id, TransactionStatus.PAID);
    } else {
      // Refund user if rejected
      const u = users.find(u => u.id === tx.userId);
      if (u) {
        await store.updateUser(u.id, { balance: u.balance + tx.amount });
      }
      await store.updateTransactionStatus(id, TransactionStatus.REJECTED);
    }
    fetchData();
  };

  const handleManualDeposit = async (id: string, approve: boolean) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (approve) {
      const u = users.find(u => u.id === tx.userId);
      if (u) {
        await store.updateUser(u.id, { balance: u.balance + tx.amount });
      }
      await store.updateTransactionStatus(id, TransactionStatus.PAID);
    } else {
      await store.updateTransactionStatus(id, TransactionStatus.REJECTED);
    }
    fetchData();
  };

  const handleManualFund = async () => {
    if (!fundUser || !fundAmount) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount)) return;

    const newBalance = fundAction === 'add' ? fundUser.balance + amount : fundUser.balance - amount;
    await store.updateUser(fundUser.id, { balance: Math.max(0, newBalance) });
    
    // Log transaction
    await store.addTransaction({
      id: 'admin-' + Date.now(),
      userId: fundUser.id,
      amount: amount,
      type: fundAction === 'add' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
      status: TransactionStatus.PAID,
      description: `Admin Adjustment (${fundAction.toUpperCase()})`,
      createdAt: new Date().toISOString()
    });

    setFundUser(null);
    setFundAmount('');
    fetchData();
  };

  const toggleFreeze = async (u: User) => {
    await store.updateUser(u.id, { isFrozen: !u.isFrozen });
    fetchData();
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
    fetchData();
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
    fetchData();
  };

  return (
    <div className="flex h-screen bg-[#070b14] overflow-hidden text-slate-300">
      <aside className="w-64 bg-[#0f172a] flex flex-col shadow-2xl border-r border-white/5">
        <div className="p-8 border-b border-white/5">
           <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">MPRO <span className="text-indigo-500">ROOT</span></h2>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-8 overflow-y-auto no-scrollbar">
          {[
            { id: 'users', label: 'Participants', icon: '👤' },
            { id: 'withdrawals', label: 'Payouts', icon: '💰' },
            { id: 'deposits', label: 'Deposits', icon: '📥' },
            { id: 'products', label: 'Nodes', icon: '📦' },
            { id: 'coupons', label: 'Vouchers', icon: '🎟️' },
            { id: 'support', label: 'Help Desk', icon: '💬' },
            { id: 'settings', label: 'System', icon: '⚙️' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-500'}`}>
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 space-y-2">
           <button onClick={fetchData} className="w-full py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-white/10">Refresh Nodes</button>
           <button onClick={onLogout} className="w-full py-3 bg-red-600/10 text-red-500 text-[9px] font-black rounded-xl uppercase tracking-widest border border-red-500/10 hover:bg-red-600 hover:text-white transition-all">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 no-scrollbar relative">
         <div className="max-w-6xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-in fade-in zoom-in duration-500">
               {[
                 { label: 'Active Users', val: stats.totalUsers, color: 'text-white' },
                 { label: 'Total Inflow', val: `${CURRENCY}${stats.totalDeposits.toLocaleString()}`, color: 'text-green-400' },
                 { label: 'Pending Harvest', val: `${CURRENCY}${stats.pendingWithdrawals.toLocaleString()}`, color: 'text-amber-400' },
                 { label: 'Audit Queue', val: stats.pendingDepositsCount, color: 'text-indigo-400' }
               ].map((s, idx) => (
                 <div key={idx} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                    <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}</p>
                 </div>
               ))}
            </div>

            {loading && (
              <div className="text-center py-20 space-y-4">
                 <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Synchronizing Local Nodes...</p>
              </div>
            )}

            {!loading && activeTab === 'users' && (
               <div className="bg-white/5 rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center">
                     <h3 className="font-black uppercase tracking-widest text-sm text-white italic">Participant Registry</h3>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{users.length} Nodes Online</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                          <tr><th className="p-8">Node Identity</th><th className="p-8 text-center">Protocol Balance</th><th className="p-8">Status</th><th className="p-8">Node Control</th></tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {users.map(u => (
                             <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-8">
                                  <div className="font-bold text-white text-md tracking-tight">{u.email}</div>
                                  <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Ref: {u.referralCode}</div>
                                </td>
                                <td className="p-8 font-black text-center text-indigo-400 text-lg tracking-tighter">{CURRENCY}{u.balance.toLocaleString()}</td>
                                <td className="p-8">
                                  <span onClick={() => toggleFreeze(u)} className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest cursor-pointer transition-all ${u.isFrozen ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>{u.isFrozen ? 'FROZEN' : 'ACTIVE'}</span>
                                </td>
                                <td className="p-8 space-x-4">
                                   <button onClick={() => setFundUser(u)} className="text-[10px] font-black uppercase text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Manage Funds</button>
                                   <button onClick={() => setWarningUser(u)} className="text-[10px] font-black uppercase text-amber-500 border border-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-600 hover:text-white transition-all">Alert</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    {users.length === 0 && <div className="p-20 text-center text-slate-600 font-black uppercase text-xs tracking-widest">No Participants Recorded.</div>}
                  </div>
               </div>
            )}

            {/* FUNDING MODAL */}
            {fundUser && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                 <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 shadow-3xl text-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Adjust Node Balance</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{fundUser.email}</p>
                    
                    <div className="flex gap-4">
                       <button onClick={() => setFundAction('add')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] border transition-all ${fundAction === 'add' ? 'bg-green-600 text-white border-green-600 shadow-xl' : 'bg-white/5 text-slate-400 border-white/10'}`}>Add Credit</button>
                       <button onClick={() => setFundAction('subtract')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] border transition-all ${fundAction === 'subtract' ? 'bg-red-600 text-white border-red-600 shadow-xl' : 'bg-white/5 text-slate-400 border-white/10'}`}>Deduct</button>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block text-left ml-2">Quantity (NGN)</label>
                       <input type="number" className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-3xl outline-none" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} autoFocus />
                    </div>

                    <div className="flex flex-col gap-3">
                       <button onClick={handleManualFund} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-2xl">Execute Adjustment</button>
                       <button onClick={() => setFundUser(null)} className="w-full py-2 text-slate-600 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <div className="bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md overflow-hidden animate-in fade-in duration-500">
                <div className="p-10 border-b border-white/5 flex justify-between items-center">
                   <h3 className="font-black uppercase tracking-widest text-sm text-white italic">Payout Node Registry</h3>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                      <tr><th className="p-8">Target Node</th><th className="p-8">Bank Data</th><th className="p-8 text-center">Amount</th><th className="p-8">Verification</th></tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).map(t => (
                         <tr key={t.id} className="hover:bg-white/[0.01]">
                            <td className="p-8 text-white font-black text-xs">{users.find(u => u.id === t.userId)?.email || 'Unknown Node'}</td>
                            <td className="p-8">
                               <p className="text-white font-black text-xs uppercase tracking-tight">{t.bankName}</p>
                               <p className="text-[10px] text-indigo-400 font-black tracking-widest mt-1">{t.accountNumber}</p>
                               <p className="text-[9px] text-slate-500 font-bold uppercase">{t.accountName}</p>
                            </td>
                            <td className="p-8 font-black text-center text-white text-lg tracking-tighter">{CURRENCY}{t.amount.toLocaleString()}</td>
                            <td className="p-8 flex gap-8">
                               <button onClick={() => handleWithdrawal(t.id, true)} className="text-green-400 font-black uppercase text-[10px] tracking-widest hover:text-green-300 transition-colors">Approve</button>
                               <button onClick={() => handleWithdrawal(t.id, false)} className="text-red-400 font-black uppercase text-[10px] tracking-widest hover:text-red-300 transition-colors">Reject</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).length === 0 && (
                  <div className="p-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.4em]">Withdrawal Queue Empty.</div>
                )}
              </div>
            )}

            {activeTab === 'deposits' && (
              <div className="bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md overflow-hidden animate-in fade-in duration-500">
                <div className="p-10 border-b border-white/5 flex justify-between items-center">
                   <h3 className="font-black uppercase tracking-widest text-sm text-white italic">Deposit Audit Registry</h3>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-white/[0.02] text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                      <tr><th className="p-8">Origin Node</th><th className="p-8 text-center">Quantity</th><th className="p-8">Evidence</th><th className="p-8">Audit Verdict</th></tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).map(t => (
                         <tr key={t.id} className="hover:bg-white/[0.01]">
                            <td className="p-8 text-white font-black text-xs">{users.find(u => u.id === t.userId)?.email || 'Unknown'}</td>
                            <td className="p-8 font-black text-center text-white text-lg tracking-tighter">{CURRENCY}{t.amount.toLocaleString()}</td>
                            <td className="p-8">
                               <button onClick={() => setViewProofUrl(t.proofImageUrl!)} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Audit Screenshot</button>
                            </td>
                            <td className="p-8 flex gap-8">
                               <button onClick={() => handleManualDeposit(t.id, true)} className="text-green-400 font-black uppercase text-[10px] tracking-widest hover:text-green-300">Approve</button>
                               <button onClick={() => handleManualDeposit(t.id, false)} className="text-red-400 font-black uppercase text-[10px] tracking-widest hover:text-red-300">Reject</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).length === 0 && (
                  <div className="p-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.4em]">No Deposits Awaiting Audit.</div>
                )}
              </div>
            )}
            
            {/* ... Remaining tabs logic ... */}

            {viewProofUrl && (
              <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-10 backdrop-blur-3xl animate-in zoom-in duration-300">
                 <div className="max-w-4xl w-full h-full relative rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl">
                   <img src={viewProofUrl} className="w-full h-full object-contain" alt="Evidence" />
                 </div>
                 <button onClick={() => setViewProofUrl(null)} className="mt-8 px-12 py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-[0.3em] rounded-2xl border border-white/10 transition-all">Close Audit Window</button>
              </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default AdminPanel;
