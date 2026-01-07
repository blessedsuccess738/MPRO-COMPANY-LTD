
import React, { useState, useMemo, useEffect } from 'react';
import { User, Product, Transaction, TransactionType, TransactionStatus, GlobalSettings, UserRole } from '../types';
import { store } from '../store';
import { CURRENCY } from '../constants';
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
      pendingDeposits: transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).length
    };
  }, [users, transactions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUsers(store.getUsers());
      setTransactions(store.getTransactions());
      setProducts(store.getProducts());
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

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6">
           <h2 className="text-2xl font-bold text-white tracking-tight uppercase">MPRO ADMIN</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {[
            { id: 'users', label: 'Users', icon: '👤' },
            { id: 'withdrawals', label: 'Withdrawals', icon: '💰' },
            { id: 'deposits', label: 'Manual Deposits', icon: '📥' },
            { id: 'products', label: 'Products', icon: '📦' },
            { id: 'support', label: 'Support', icon: '💬' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="m-4 p-3 bg-red-900/20 text-red-400 text-xs font-bold rounded-xl uppercase">Logout</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
         <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Paid Deposits</p>
                  <p className="text-2xl font-bold text-green-600">{CURRENCY}{stats.totalDeposits.toLocaleString()}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Withdraw</p>
                  <p className="text-2xl font-bold text-amber-600">{CURRENCY}{stats.pendingWithdrawals.toLocaleString()}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Deposits</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.pendingDeposits}</p>
               </div>
            </div>

            {activeTab === 'users' && (
               <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                  <div className="p-6 border-b border-slate-100"><h3 className="font-bold">Member Directory</h3></div>
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        <tr><th className="p-6">Email</th><th className="p-6">Balance</th><th className="p-6">Status</th><th className="p-6">Actions</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                           <tr key={u.id}>
                              <td className="p-6 font-bold">{u.email}</td>
                              <td className="p-6 font-black">{CURRENCY}{u.balance.toLocaleString()}</td>
                              <td className="p-6"><span className={`px-2 py-1 rounded text-[10px] font-bold ${u.isFrozen ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isFrozen ? 'FROZEN' : 'ACTIVE'}</span></td>
                              <td className="p-6 space-x-3">
                                 <button onClick={() => store.updateUser(u.id, { isFrozen: !u.isFrozen })} className="text-indigo-600 font-bold hover:underline">Toggle Freeze</button>
                                 <button className="text-red-600 font-bold hover:underline">Reset</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'withdrawals' && (
               <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                  <div className="p-6 border-b border-slate-100"><h3 className="font-bold">Pending Payouts</h3></div>
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        <tr><th className="p-6">User</th><th className="p-6">Amount</th><th className="p-6">Bank Details</th><th className="p-6">Actions</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING).map(t => (
                           <tr key={t.id}>
                              <td className="p-6">{users.find(u => u.id === t.userId)?.email}</td>
                              <td className="p-6 font-bold">{CURRENCY}{t.amount.toLocaleString()}</td>
                              <td className="p-6">
                                 <p className="font-bold">{t.bankName} - {t.accountNumber}</p>
                                 <p className="text-[10px] text-slate-500 uppercase">{t.accountName}</p>
                              </td>
                              <td className="p-6 space-x-4">
                                 <button onClick={() => handleWithdrawal(t.id, true)} className="text-green-600 font-bold">Approve</button>
                                 <button onClick={() => handleWithdrawal(t.id, false)} className="text-red-600 font-bold">Reject</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'deposits' && (
               <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                  <div className="p-6 border-b border-slate-100"><h3 className="font-bold">Manual Deposit Requests</h3></div>
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        <tr><th className="p-6">User</th><th className="p-6">Amount</th><th className="p-6">Date</th><th className="p-6">Actions</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {transactions.filter(t => t.type === TransactionType.MANUAL_DEPOSIT && t.status === TransactionStatus.PENDING).map(t => (
                           <tr key={t.id}>
                              <td className="p-6">{users.find(u => u.id === t.userId)?.email}</td>
                              <td className="p-6 font-bold">{CURRENCY}{t.amount.toLocaleString()}</td>
                              <td className="p-6 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                              <td className="p-6 space-x-4">
                                 <button onClick={() => handleManualDeposit(t.id, true)} className="text-green-600 font-bold">Verify & Credit</button>
                                 <button onClick={() => handleManualDeposit(t.id, false)} className="text-red-600 font-bold">Reject</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
            
            {activeTab === 'support' && (
               <div className="grid grid-cols-3 gap-8">
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-[600px] flex flex-col">
                     <div className="p-4 bg-slate-50 font-bold border-b border-slate-100">Chats</div>
                     <div className="flex-1 overflow-y-auto">
                        {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
                           <button key={u.id} onClick={() => setSelectedChatUserId(u.id)} className={`w-full p-4 text-left border-b border-slate-50 hover:bg-indigo-50 ${selectedChatUserId === u.id ? 'bg-indigo-50' : ''}`}>
                              <p className="font-bold text-sm truncate">{u.email}</p>
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="col-span-2">
                     {selectedChatUserId ? <Chat user={user} isAdmin={true} targetUserId={selectedChatUserId} /> : <div className="h-full bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Select a user to chat</div>}
                  </div>
               </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default AdminPanel;
