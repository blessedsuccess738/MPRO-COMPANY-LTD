
import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, Investment, Transaction, TransactionType, TransactionStatus } from '../types';
import { store } from '../store';
import { CURRENCY, NIGERIAN_BANKS, APP_NAME } from '../constants';
import Chat from './Chat';
import TransactionHistory from './TransactionHistory';
import ProfileSettings from './ProfileSettings';

interface Props {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'history' | 'profile' | 'chat'>('home');
  const [activeInvestment, setActiveInvestment] = useState<Investment | null>(store.getActiveInvestment(user.id) || null);
  const [products] = useState<Product[]>(store.getProducts());
  
  // Modals & States
  const [paystackModal, setPaystackModal] = useState<Product | null>(null);
  const [depositModal, setDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStep, setDepositStep] = useState<'amount' | 'method'>('amount');
  const [couponCode, setCouponCode] = useState('');
  
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = store.getUsers().find(u => u.id === user.id);
      if (updated) setUser(updated);
      setActiveInvestment(store.getActiveInvestment(user.id) || null);
    }, 5000);
    return () => clearInterval(timer);
  }, [user.id]);

  const verifyAccount = () => {
    if (accountNumber.length !== 10 || !selectedBank) return;
    setIsVerifying(true);
    setTimeout(() => {
      setVerifiedName(user.email.split('@')[0].toUpperCase() + " USER");
      setIsVerifying(false);
    }, 1500);
  };

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      verifyAccount();
    } else {
      setVerifiedName('');
    }
  }, [accountNumber, selectedBank]);

  const handleInvestment = (product: Product) => {
    if (activeInvestment) {
      setError('You already have an active investment.');
      return;
    }
    if (user.balance < product.price) {
      setError('Insufficient balance. Please deposit first.');
      return;
    }
    setPaystackModal(product);
  };

  const confirmInvestment = () => {
    if (!paystackModal) return;
    
    const settings = store.getSettings();
    const duration = paystackModal.duration || settings.defaultDuration;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    const newInv: Investment = {
      id: 'inv-' + Date.now(),
      userId: user.id,
      productId: paystackModal.id,
      productName: paystackModal.name,
      amount: paystackModal.price,
      dailyRoi: paystackModal.dailyRoi,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active'
    };

    store.updateUser(user.id, { balance: user.balance - paystackModal.price });
    store.addInvestment(newInv);
    store.addTransaction({
      id: 'tx-' + Date.now(),
      userId: user.id,
      amount: paystackModal.price,
      type: TransactionType.EARNINGS,
      status: TransactionStatus.PAID,
      description: `Purchased ${paystackModal.name}`,
      createdAt: new Date().toISOString()
    });

    setActiveInvestment(newInv);
    setPaystackModal(null);
    setSuccess(`Successfully purchased ${paystackModal.name}!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeposit = (method: 'automatic' | 'manual') => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (method === 'automatic') {
      store.updateUser(user.id, { balance: user.balance + amount });
      store.addTransaction({
        id: 'dep-' + Date.now(),
        userId: user.id,
        amount: amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PAID,
        description: 'Instant Deposit (Paystack)',
        createdAt: new Date().toISOString()
      });
      setSuccess('Deposit successful!');
    } else {
      store.addTransaction({
        id: 'mdep-' + Date.now(),
        userId: user.id,
        amount: amount,
        type: TransactionType.MANUAL_DEPOSIT,
        status: TransactionStatus.PENDING,
        description: 'Manual Transfer Request',
        createdAt: new Date().toISOString()
      });
      setSuccess('Transfer request submitted for approval.');
    }
    
    setDepositModal(false);
    setDepositAmount('');
    setDepositStep('amount');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < store.getSettings().minWithdrawal) {
      setError(`Minimum withdrawal is ${CURRENCY}${store.getSettings().minWithdrawal}`);
      return;
    }
    if (amount > user.balance) {
      setError('Insufficient balance');
      return;
    }
    if (activeInvestment) {
      setError('Active investment detected. Withdrawal locked.');
      return;
    }
    if (!verifiedName) {
      setError('Please verify account details first');
      return;
    }

    store.addTransaction({
      id: 'wd-' + Date.now(),
      userId: user.id,
      amount: amount,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING,
      description: `Withdrawal to ${selectedBank}`,
      bankName: selectedBank,
      accountNumber: accountNumber,
      accountName: verifiedName,
      createdAt: new Date().toISOString()
    });

    store.updateUser(user.id, { balance: user.balance - amount });
    setWithdrawModal(false);
    setSuccess('Withdrawal pending admin approval.');
    setWithdrawAmount('');
    setAccountNumber('');
    setVerifiedName('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRedeemCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'MPRO2025') {
      store.updateUser(user.id, { balance: user.balance + 1000 });
      store.addTransaction({
        id: 'cp-' + Date.now(),
        userId: user.id,
        amount: 1000,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PAID,
        description: 'Coupon Redemption (MPRO2025)',
        createdAt: new Date().toISOString()
      });
      setSuccess('₦1,000 added to your balance!');
      setCouponCode('');
    } else {
      setError('Invalid or expired coupon code.');
    }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const dailyEarnings = activeInvestment ? (activeInvestment.amount * 0.26) : 0;
  const progress = useMemo(() => {
    if (!activeInvestment) return 0;
    const start = new Date(activeInvestment.startDate).getTime();
    const end = new Date(activeInvestment.endDate).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }, [activeInvestment]);

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-300">
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black italic text-white">M</div>
          <span className="font-black text-lg text-white">MPRO <span className="text-indigo-500 uppercase tracking-tighter">Pro</span></span>
        </div>
        <button onClick={() => { setDepositModal(true); setDepositStep('amount'); }} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">Deposit</button>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {success && <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl text-xs font-bold border border-green-500/20">{success}</div>}
          {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs font-bold border border-red-500/20">{error}</div>}

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[80px]"></div>
             <div className="relative z-10">
               <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Portfolio Balance</p>
               <h2 className="text-5xl font-black tracking-tighter">{CURRENCY}{user.balance.toLocaleString()}</h2>
               <div className="flex gap-4 mt-6">
                  <button onClick={() => { setDepositModal(true); setDepositStep('amount'); }} className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-xs uppercase transition-all">Add Funds</button>
                  <button onClick={() => setWithdrawModal(true)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-xs uppercase transition-all">Withdraw</button>
               </div>
             </div>
          </div>

          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Active Investment */}
              {activeInvestment ? (
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-xl font-black text-white uppercase">{activeInvestment.productName}</h3>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Active Contract</p>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-indigo-400">+{CURRENCY}{dailyEarnings.toLocaleString()}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Daily ROI</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                       <span>Cycle Progress</span>
                       <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div onClick={() => setActiveTab('products')} className="bg-white/5 border-2 border-dashed border-white/10 p-12 rounded-3xl text-center cursor-pointer hover:bg-white/[0.07] transition-all">
                  <p className="text-white font-black uppercase text-sm">Buy Your First Asset</p>
                  <p className="text-xs text-slate-500 mt-1">Start earning 26% daily returns now.</p>
                </div>
              )}

              {/* Coupon Section */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Redeem Bonus Coupon</h4>
                 <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Enter Coupon Code"
                      className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold text-sm"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button onClick={handleRedeemCoupon} className="px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Redeem</button>
                 </div>
              </div>

              {/* Platform Insight Section */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                 <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter underline decoration-indigo-500 underline-offset-4">Platform Overview</h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                       {APP_NAME} Pro is a state-of-the-art asset-backed investment protocol. We specialize in high-utilization logistics, real estate, and agricultural technology assets that provide stable, daily returns to our global community of investors.
                    </p>
                 </div>
                 
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Our Asset Tiers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex gap-4 items-center">
                          <div className="text-2xl">🚗</div>
                          <div>
                            <p className="text-white font-black uppercase text-xs mb-1">Logistics Tier</p>
                            <p className="text-[10px] text-slate-500 font-medium">Motorcycles, Vans, and Sedans for urban delivery networks.</p>
                          </div>
                       </div>
                       <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex gap-4 items-center">
                          <div className="text-2xl">🏠</div>
                          <div>
                            <p className="text-white font-black uppercase text-xs mb-1">Housing Tier</p>
                            <p className="text-[10px] text-slate-500 font-medium">Studio Apartments and Mini Estates in growth corridors.</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/5">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-center">Protocol Integrity: 100% Asset-Backed Liquidity</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black text-white uppercase">Asset Marketplace</h3>
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">26% DAILY ROI</span>
              </div>
              <div className="space-y-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col sm:flex-row group hover:border-indigo-500/40 transition-all">
                    <img src={p.imageUrl} className="w-full sm:w-40 h-32 sm:h-auto object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" alt={p.name} />
                    <div className="p-6 flex-1 flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-4">
                         <div className="space-y-1">
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{p.name}</h4>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Digital Asset Unit</p>
                         </div>
                         <div className="text-right">
                            <p className="text-2xl font-black text-indigo-500 leading-none">{CURRENCY}{p.price.toLocaleString()}</p>
                            <p className="text-[9px] text-green-400 font-bold uppercase mt-1">+{CURRENCY}{(p.price * 0.26).toLocaleString()} / Day</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-4 justify-between border-t border-white/5 pt-4">
                          <div className="flex gap-4">
                            <div>
                               <p className="text-[8px] font-black text-slate-500 uppercase">Yield Rate</p>
                               <p className="text-xs font-bold text-white">26.0%</p>
                            </div>
                            <div className="w-px h-6 bg-white/10"></div>
                            <div>
                               <p className="text-[8px] font-black text-slate-500 uppercase">Lease Term</p>
                               <p className="text-xs font-bold text-white">{p.duration} Days</p>
                            </div>
                          </div>
                          <button onClick={() => handleInvestment(p)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-xl active:scale-95">
                            Buy
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && <TransactionHistory userId={user.id} />}
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'chat' && <Chat user={user} isAdmin={false} />}
        </div>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 px-6 py-4 flex justify-between items-center z-40 rounded-[2rem] shadow-2xl">
        {[
          { id: 'home', icon: 'M', label: 'HOME' },
          { id: 'products', icon: 'A', label: 'ASSETS' },
          { id: 'history', icon: 'L', label: 'LOGS' },
          { id: 'chat', icon: 'H', label: 'HELP' },
          { id: 'profile', icon: 'U', label: 'ME' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === item.id ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
            <span className="font-black text-sm">{item.icon}</span>
            <span className="text-[8px] font-black tracking-widest uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals remain same as before for functionality */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl p-8 space-y-6">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Add Funds</h3>
              {depositStep === 'amount' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Amount to Deposit</label>
                     <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xl outline-none focus:ring-2 focus:ring-indigo-500" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <button onClick={() => setDepositStep('method')} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">Continue</button>
                  <button onClick={() => setDepositModal(false)} className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => handleDeposit('automatic')} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-indigo-600/20 transition-all flex justify-between items-center group">
                     <div>
                        <p className="text-white font-black uppercase text-xs">Automatic Payment</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Pay via Paystack (Instant)</p>
                     </div>
                     <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                  <button onClick={() => handleDeposit('manual')} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-indigo-600/20 transition-all flex justify-between items-center group">
                     <div>
                        <p className="text-white font-black uppercase text-xs">Manual Transfer</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Bank Transfer (1-2hr Audit)</p>
                     </div>
                     <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                  <button onClick={() => setDepositStep('amount')} className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest">Back</button>
                </div>
              )}
           </div>
        </div>
      )}

      {withdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6 overflow-y-auto">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl p-8 space-y-6 my-auto">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Harvest Wealth</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Amount (Min 5,000)</label>
                    <input type="number" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Bank Name</label>
                    <select className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                       <option value="">Select Bank</option>
                       {NIGERIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Account Number</label>
                    <input type="text" maxLength={10} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="10 Digits" />
                 </div>
                 {isVerifying && <p className="text-[10px] text-indigo-400 font-bold animate-pulse">Verifying Account...</p>}
                 {verifiedName && <p className="text-[10px] text-green-400 font-black uppercase bg-green-500/10 p-2 rounded-lg border border-green-500/20">{verifiedName}</p>}
                 
                 <button onClick={handleWithdraw} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">Submit Withdrawal</button>
                 <button onClick={() => setWithdrawModal(false)} className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {paystackModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl p-8 space-y-6 text-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Finalize Purchase</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Confirm acquisition of <span className="text-white font-bold">{paystackModal.name}</span> for {CURRENCY}{paystackModal.price.toLocaleString()}. Capital deployment will initiate instantly.</p>
              <div className="flex gap-4">
                 <button onClick={() => setPaystackModal(null)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-[10px]">Back</button>
                 <button onClick={confirmInvestment} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">Confirm & Buy</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
