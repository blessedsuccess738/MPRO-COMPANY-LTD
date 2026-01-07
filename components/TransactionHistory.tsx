
import React, { useMemo } from 'react';
import { store } from '../store';
import { CURRENCY } from '../constants';
import { TransactionType, TransactionStatus } from '../types';

interface Props {
  userId: string;
}

const TransactionHistory: React.FC<Props> = ({ userId }) => {
  const transactions = useMemo(() => {
    return store.getTransactions().filter(t => t.userId === userId);
  }, [userId]);

  const getStatusStyles = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PAID: return 'bg-green-500/10 text-green-400 border-green-500/20';
      case TransactionStatus.APPROVED: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case TransactionStatus.PENDING: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case TransactionStatus.REJECTED: return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  const getAssetImage = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('motorcycle')) return 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&w=100';
    if (d.includes('car') || d.includes('sedan') || d.includes('suv') || d.includes('van')) return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=100';
    if (d.includes('apartment') || d.includes('flat') || d.includes('bungalow') || d.includes('residence') || d.includes('estate') || d.includes('luxury')) return 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=100';
    if (d.includes('plot')) return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=100';
    if (d.includes('farm')) return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=100';
    return 'https://images.unsplash.com/photo-1611974714850-eb607f74d082?auto=format&fit=crop&w=100'; // Default finance image
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-xl font-black text-white tracking-tighter uppercase">Portfolio History</h3>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{transactions.length} Records</span>
      </div>
      
      {transactions.length === 0 ? (
        <div className="bg-white/5 rounded-[2.5rem] p-16 text-center border border-white/10">
           <div className="text-5xl mb-6 opacity-20">📂</div>
           <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Zero Activity Detected</p>
           <p className="text-[10px] text-slate-600 mt-2 uppercase font-medium">Deploy capital to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/[0.08] transition-all flex justify-between items-center group overflow-hidden">
               <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img 
                      src={getAssetImage(tx.description)} 
                      alt="Asset" 
                      className="w-14 h-14 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500 border border-white/10"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-[#070b14] flex items-center justify-center text-[10px] font-black ${tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.EARNINGS ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.EARNINGS ? '↓' : '↑'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{tx.description}</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
               </div>
               <div className="text-right space-y-2">
                  <p className={`text-lg font-black tracking-tighter ${tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.EARNINGS ? 'text-green-400' : 'text-white'}`}>
                    {tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.EARNINGS ? '+' : '-'}{CURRENCY}{tx.amount.toLocaleString()}
                  </p>
                  <span className={`text-[8px] px-2 py-0.5 font-black rounded-md uppercase border tracking-[0.1em] ${getStatusStyles(tx.status)}`}>
                    {tx.status}
                  </span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
