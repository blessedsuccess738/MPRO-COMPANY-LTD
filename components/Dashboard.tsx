
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Product, Investment, Transaction, TransactionType, TransactionStatus } from '../types';
import { store, supabase } from '../store';
import { CURRENCY, NIGERIAN_BANKS, APP_NAME, PAYSTACK_PUBLIC_KEY, INITIAL_SETTINGS } from '../constants';
import Chat from './Chat';
import TransactionHistory from './TransactionHistory';
import ProfileSettings from './ProfileSettings';

declare const PaystackPop: any;

interface Props {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'history' | 'profile' | 'chat'>('home');
  const [activeInvestment, setActiveInvestment] = useState<Investment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [referralCount, setReferralCount] = useState(0);
  
  const [paystackModal, setPaystackModal] = useState<Product | null>(null);
  const [depositModal, setDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStep, setDepositStep] = useState<'amount' | 'method' | 'manual_details' | 'proof'>('amount');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [couponCode, setCouponCode] = useState('');
  
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inv, prods, sets, refs, profile] = await Promise.all([
          store.getActiveInvestment(user.id),
          store.getProducts(),
          store.getSettings(),
          store.getReferralCount(user.referralCode),
          store.fetchCurrentUser(user.id)
        ]);
        setActiveInvestment(inv);
        setProducts(prods);
        setSettings(sets);
        setReferralCount(refs);
        if (profile) setUser(profile);
      } catch (e) {
        console.error("Dashboard Sync Error:", e);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, [user.id, user.referralCode]);

  const verifyAccount = async () => {
    if (accountNumber.length !== 10 || !selectedBankCode) return;
    setIsVerifying(true);
    setVerifyError('');
    setVerifiedName('');
    try {
      const NUBAPI_KEY = 'POuzCSQj3qrGIdERDwENLwWppMp5pVtl8o5rXTebdf8dd0fe';
      const response = await fetch(`https://nubapi.com/api/verify?account_number=${accountNumber}&bank_code=${selectedBankCode}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${NUBAPI_KEY}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data && data.account_name) setVerifiedName(data.account_name);
      else setVerifyError(data.message || 'Invalid account.');
    } catch (err) {
      setVerifyError('Network error.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) verifyAccount();
  }, [accountNumber, selectedBankCode]);

  const handleInvestment = (product: Product) => {
    if (activeInvestment) { setError('Limit reached: 1 active node per cycle.'); return; }
    if (user.balance < product.price) { setError('Insufficient funds in Node Balance.'); return; }
    setPaystackModal(product);
  };

  const confirmInvestment = async () => {
    if (!paystackModal) return;
    const duration = paystackModal.duration || settings.defaultDuration;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    const newInv: Investment = {
      id: 'inv-' + Date.now(), userId: user.id, productId: paystackModal.id, productName: paystackModal.name, amount: paystackModal.price, dailyRoi: paystackModal.dailyRoi,
      startDate: startDate.toISOString(), endDate: endDate.toISOString(), status: 'active'
    };

    try {
      await store.updateUser(user.id, { balance: user.balance - paystackModal.price });
      await store.addInvestment(newInv);
      await store.addTransaction({
        id: 'tx-' + Date.now(), userId: user.id, amount: paystackModal.price, type: TransactionType.EARNINGS, status: TransactionStatus.PAID, description: `Activated ${paystackModal.name}`, createdAt: new Date().toISOString()
      });
      setActiveInvestment(newInv); 
      setPaystackModal(null); 
      setSuccess(`Success: ${paystackModal.name} Online!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError("Activation failed. Try again.");
    }
  };

  const handleDeposit = async (method: 'automatic' | 'manual') => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (method === 'automatic') {
      if (typeof PaystackPop === 'undefined') {
        setError('Payment Gateway Offline. Use Manual Transfer.');
        return;
      }

      setLoadingPayment(true);
      try {
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: Math.round(amount * 100),
          currency: "NGN",
          onSuccess: async (transaction: any) => {
            const updatedProfile = await store.fetchCurrentUser(user.id);
            const currentBalance = updatedProfile ? updatedProfile.balance : user.balance;
            
            await store.updateUser(user.id, { balance: currentBalance + amount });
            await store.addTransaction({
              id: 'ps-' + transaction.reference,
              userId: user.id,
              amount: amount,
              type: TransactionType.DEPOSIT,
              status: TransactionStatus.PAID,
              description: 'Auto Deposit (Paystack)',
              createdAt: new Date().toISOString()
            });
            setSuccess(`Protocol Funded: ${CURRENCY}${amount.toLocaleString()}`);
            setDepositModal(false);
            setDepositAmount('');
            setDepositStep('amount');
            setLoadingPayment(false);
          },
          onCancel: () => {
            setLoadingPayment(false);
          },
          onError: (err: any) => {
            console.error("Paystack Error:", err);
            setError("Payment session failed.");
            setLoadingPayment(false);
          }
        });
      } catch (err) {
        console.error("Paystack Trigger Error:", err);
        setError("Could not launch payment gateway.");
        setLoadingPayment(false);
      }
    } else {
      setDepositStep('manual_details');
    }
  };

  const finalizeManualDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!proofImage) { setError('Error: Audit requires proof of payment.'); return; }
    
    await store.addTransaction({ 
      id: 'mdep-' + Date.now(), 
      userId: user.id, 
      amount, 
      type: TransactionType.MANUAL_DEPOSIT, 
      status: TransactionStatus.PENDING, 
      description: 'Manual Fund Request', 
      proofImageUrl: proofImage,
      createdAt: new Date().toISOString() 
    });
    
    setSuccess('Audit Request Submitted.');
    setDepositModal(false); 
    setDepositAmount(''); 
    setDepositStep('amount');
    setProofImage(null);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setError('Image too large (Max 2MB)'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWithdrawClick = () => {
    if (settings.isWithdrawalMaintenance) { setError('Harvesting currently locked for maintenance.'); return; }
    if (user.isRestricted) { setError('Protocol Access Restricted.'); return; }
    setWithdrawModal(true);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < settings.minWithdrawal) { setError(`Min Harvest: ${CURRENCY}${settings.minWithdrawal}`); return; }
    if (amount > user.balance) { setError('Insufficient Protocol Balance.'); return; }
    if (!verifiedName) { setError('Verify Bank Identity First.'); return; }
    
    const bank = NIGERIAN_BANKS.find(b => b.code === selectedBankCode);
    await store.addTransaction({
      id: 'wd-' + Date.now(), userId: user.id, amount, type: TransactionType.WITHDRAWAL, status: TransactionStatus.PENDING, description: `Payout to ${bank?.name}`, bankName: bank?.name, accountNumber, accountName: verifiedName, createdAt: new Date().toISOString()
    });
    await store.updateUser(user.id, { balance: user.balance - amount });
    setWithdrawModal(false); setSuccess('Harvest Request Received.'); setWithdrawAmount('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode) return;
    const result = await store.redeemCoupon(user.id, couponCode);
    if (result.success) {
      await store.addTransaction({
        id: 'cp-' + Date.now(), userId: user.id, amount: result.amount, type: TransactionType.DEPOSIT, status: TransactionStatus.PAID, description: `Coupon Redeemed (${couponCode})`, createdAt: new Date().toISOString()
      });
      setSuccess(`Credit Node Activated: +${CURRENCY}${result.amount.toLocaleString()}`);
      setCouponCode('');
    } else {
      setError(result.error || 'Invalid Cipher Code.');
    }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const dailyEarnings = activeInvestment ? (activeInvestment.amount * 0.26) : 0;
  const progress = useMemo(() => {
    if (!activeInvestment) return 0;
    const start = new Date(activeInvestment.startDate).getTime();
    const end = new Date(activeInvestment.endDate).getTime();
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  }, [activeInvestment]);

  const shareReferral = () => {
    const link = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setSuccess('Network Invite Copied!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-300 relative">
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center relative">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black italic text-white">M</div>
          <span className="font-black text-lg text-white tracking-tighter uppercase italic">MPRO</span>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">ID: {user.referralCode}</span>
           <button onClick={() => { setDepositModal(true); setDepositStep('amount'); }} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-500 transition-all">Deposit</button>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar relative z-10">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {user.warningMessage && <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] font-black uppercase border border-amber-500/20 animate-pulse">{user.warningMessage}</div>}
          {success && <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl text-[10px] font-black uppercase border border-green-500/20">{success}</div>}
          {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase border border-red-500/20">{error}</div>}

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-white/20"></div>
             <div className="relative z-10">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Available Funds</p>
                    <h2 className="text-5xl font-black tracking-tighter">{CURRENCY}{user.balance.toLocaleString()}</h2>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                     <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100">Daily ROI</span>
                     <span className="text-xs font-black">+26%</span>
                  </div>
               </div>
               <div className="flex gap-4 mt-8">
                  <button onClick={() => { setDepositModal(true); setDepositStep('amount'); }} className="flex-1 py-3.5 bg-white/10 rounded-xl font-bold text-[10px] uppercase hover:bg-white/20 transition-all tracking-widest">Fund Account</button>
                  <button onClick={handleWithdrawClick} className="flex-1 py-3.5 bg-white/10 rounded-xl font-bold text-[10px] uppercase hover:bg-white/20 transition-all tracking-widest">Withdraw</button>
               </div>
             </div>
          </div>

          {activeTab === 'home' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {activeInvestment ? (
                <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Active Asset Chain</p>
                       <h3 className="text-lg font-black text-white uppercase">{activeInvestment.productName}</h3>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-green-400">+{CURRENCY}{dailyEarnings.toLocaleString()}</p>
                       <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Growth / Day</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest"><span>Node Lifecycle</span><span>{Math.round(progress)}%</span></div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
                  </div>
                </div>
              ) : (
                <div onClick={() => setActiveTab('products')} className="bg-indigo-600/5 border-2 border-dashed border-indigo-600/20 p-8 rounded-3xl text-center cursor-pointer hover:bg-indigo-600/10 transition-all group">
                   <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">⚡</span>
                   </div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">No Active Assets</p>
                   <p className="text-xs text-slate-500 font-medium">Click to browse investment nodes</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-2">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Referral Network</p>
                    <div className="flex items-center gap-2">
                       <span className="text-2xl font-black text-white">{referralCount}</span>
                       <span className="text-[9px] font-black text-slate-500 uppercase">Users</span>
                    </div>
                    <button onClick={shareReferral} className="w-full py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase rounded-lg tracking-widest hover:bg-indigo-600/20">Invite Code</button>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-2 flex flex-col justify-between">
                    <div>
                       <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Voucher Claim</p>
                       <p className="text-[10px] text-white font-black uppercase tracking-tight mt-1">Cipher Key</p>
                    </div>
                    <div className="flex gap-2">
                       <input type="text" placeholder="KEY" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] outline-none font-black text-white" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                       <button onClick={handleRedeemCoupon} className="bg-indigo-600 px-3 rounded-lg text-white font-black hover:bg-indigo-500 transition-all">OK</button>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Investment Fleet</h4>
                    <button onClick={() => setActiveTab('products')} className="text-[9px] font-black text-indigo-400 uppercase">Show Catalog</button>
                 </div>
                 {products.slice(0, 3).map(p => (
                   <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => handleInvestment(p)}>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                            <img src={p.imageUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all" alt={p.name} />
                         </div>
                         <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-tight">{p.name}</h4>
                            <p className="text-[9px] text-slate-500 font-bold">26% Daily Yield</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-indigo-400">{CURRENCY}{p.price.toLocaleString()}</p>
                         <button className="text-[8px] font-black text-white bg-indigo-600 px-3 py-1 rounded-md mt-1 uppercase group-hover:bg-indigo-500 transition-colors">Buy</button>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <a href={settings.telegramAdminLink} target="_blank" rel="noreferrer" className="bg-[#0088cc]/5 border border-[#0088cc]/10 p-4 rounded-2xl flex items-center gap-3 hover:bg-[#0088cc]/10 transition-all">
                    <span className="text-xl">👤</span>
                    <span className="text-[9px] font-black text-[#0088cc] uppercase tracking-widest">Admin</span>
                 </a>
                 <a href={settings.telegramChannelLink} target="_blank" rel="noreferrer" className="bg-[#0088cc]/5 border border-[#0088cc]/10 p-4 rounded-2xl flex items-center gap-3 hover:bg-[#0088cc]/10 transition-all">
                    <span className="text-xl">📢</span>
                    <span className="text-[9px] font-black text-[#0088cc] uppercase tracking-widest">Alerts</span>
                 </a>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              {products.map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col sm:flex-row group hover:border-indigo-500/50 transition-all">
                  <img src={p.imageUrl} className="w-full sm:w-40 h-40 object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" alt={p.name} />
                  <div className="p-6 flex-1 flex flex-col justify-between bg-gradient-to-r from-transparent to-white/[0.02]">
                     <div className="flex justify-between items-start mb-6">
                        <div><h4 className="text-xl font-black text-white uppercase tracking-tight">{p.name}</h4><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Tier Level {p.id}</p></div>
                        <div className="text-right"><p className="text-2xl font-black text-indigo-500 tracking-tighter">{CURRENCY}{p.price.toLocaleString()}</p><p className="text-[9px] text-green-400 font-black uppercase mt-1">+{CURRENCY}{(p.price * 0.26).toLocaleString()} DAILY</p></div>
                     </div>
                     <button onClick={() => handleInvestment(p)} className="w-full py-4 bg-indigo-600 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Initialize Node</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && <TransactionHistory userId={user.id} />}
          {activeTab === 'profile' && <ProfileSettings user={user} onLogout={onLogout} />}
          {activeTab === 'chat' && <Chat user={user} isAdmin={false} />}
        </div>
      </main>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 px-6 py-4 flex justify-between items-center z-40 rounded-[2rem] shadow-3xl">
        {[
          { id: 'home', icon: '🏠', label: 'HUB' },
          { id: 'products', icon: '🏦', label: 'ASSETS' },
          { id: 'history', icon: '📊', label: 'LOGS' },
          { id: 'chat', icon: '💬', label: 'HELP' },
          { id: 'profile', icon: '👤', label: 'ME' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center space-y-1 transition-all duration-300 ${activeTab === item.id ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-slate-400'}`}>
            <span className="text-xl">{item.icon}</span><span className="text-[7px] font-black tracking-[0.2em]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MODALS */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-3xl my-auto">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Inflow Protocol</h3>
              {depositStep === 'amount' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Quantity (NGN)</label>
                    <input type="number" className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-3xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0" autoFocus />
                  </div>
                  <button onClick={() => setDepositStep('method')} className="w-full py-6 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-500 transition-all">Proceed to Method</button>
                  <button onClick={() => setDepositModal(false)} className="w-full text-slate-600 text-[10px] font-black uppercase tracking-widest">Abort</button>
                </div>
              )}
              {depositStep === 'method' && (
                <div className="space-y-4">
                  <button disabled={loadingPayment} onClick={() => handleDeposit('automatic')} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left flex justify-between items-center group hover:bg-indigo-600/20 transition-all disabled:opacity-50">
                     <div className="space-y-1">
                        <p className="text-white font-black uppercase text-xs tracking-tight">Standard Gateway</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Instant Activation (Paystack)</p>
                     </div>
                     {loadingPayment ? <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <span className="text-indigo-500">→</span>}
                  </button>
                  <button onClick={() => handleDeposit('manual')} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left flex justify-between items-center group hover:bg-indigo-600/20 transition-all">
                     <div className="space-y-1">
                        <p className="text-white font-black uppercase text-xs tracking-tight">Manual Node Transfer</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Audit Required (10-30m)</p>
                     </div>
                     <span className="text-indigo-500">→</span>
                  </button>
                  <button onClick={() => setDepositStep('amount')} className="w-full text-slate-600 text-[10px] font-black uppercase tracking-widest">Back</button>
                </div>
              )}
              {depositStep === 'manual_details' && (
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Protocol Collection Data</p>
                    <div className="space-y-3">
                      <div><p className="text-[9px] text-slate-500 font-black uppercase">Bank</p><p className="text-white font-black text-sm uppercase tracking-tight">{settings.manualBankName}</p></div>
                      <div><p className="text-[9px] text-slate-500 font-black uppercase">Acc No.</p><p className="text-white font-black text-xl tracking-widest">{settings.manualAccountNumber}</p></div>
                      <div><p className="text-[9px] text-slate-500 font-black uppercase">Label</p><p className="text-white font-black text-sm uppercase tracking-tight">{settings.manualAccountName}</p></div>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(settings.manualAccountNumber); setSuccess('Node Data Copied!'); setTimeout(() => setSuccess(''), 2000); }} className="w-full py-3 bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase rounded-xl border border-indigo-500/10 hover:bg-indigo-600/30 transition-all">Copy Number</button>
                  </div>
                  <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-center">
                    <p className="text-[10px] text-amber-500 font-black uppercase leading-relaxed">Deposit <span className="text-white">{CURRENCY}{parseFloat(depositAmount).toLocaleString()}</span> precisely.</p>
                  </div>
                  <button onClick={() => setDepositStep('proof')} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">Verified: I have paid</button>
                  <button onClick={() => setDepositStep('method')} className="w-full text-slate-600 text-[10px] font-black uppercase tracking-widest">Back</button>
                </div>
              )}
              {depositStep === 'proof' && (
                 <div className="space-y-6">
                    <div className="text-center space-y-2">
                       <p className="text-indigo-400 font-black uppercase text-xs tracking-widest">Audit Evidence</p>
                       <p className="text-[10px] text-slate-500 uppercase font-black">Quantity: {CURRENCY}{parseFloat(depositAmount).toLocaleString()}</p>
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-56 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.08] transition-all overflow-hidden relative group">
                       {proofImage ? <img src={proofImage} alt="Proof" className="w-full h-full object-cover" /> : <>
                             <span className="text-5xl mb-4 opacity-20 group-hover:scale-110 transition-transform">📄</span>
                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Upload Receipt</p>
                          </>}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button disabled={!proofImage} onClick={finalizeManualDeposit} className={`w-full py-6 font-black rounded-2xl uppercase text-xs tracking-widest transition-all ${proofImage ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>Initialize Audit</button>
                    <button onClick={() => setDepositStep('manual_details')} className="w-full text-slate-600 text-[10px] font-black uppercase tracking-widest">Back</button>
                 </div>
              )}
           </div>
        </div>
      )}

      {withdrawModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 space-y-5 shadow-3xl my-auto">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Harvest Assets</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Harvest Quantity</label>
                <input type="number" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xl outline-none" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Destination Node</label>
                <select className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none text-[10px] font-black uppercase tracking-widest" value={selectedBankCode} onChange={(e) => setSelectedBankCode(e.target.value)}>
                  <option value="">Select Bank Node</option>
                  {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Account Number</label>
                <input type="text" maxLength={10} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-black tracking-[0.2em]" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0000000000" />
              </div>
              {isVerifying && <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest animate-pulse text-center">Syncing Bank Node Identity...</p>}
              {verifyError && <p className="text-[9px] font-black text-red-500 uppercase bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">{verifyError}</p>}
              {verifiedName && <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20"><p className="text-[9px] font-black text-green-600 uppercase mb-1">Identity Verified</p><p className="text-xs text-green-400 font-black uppercase truncate">{verifiedName}</p></div>}
              <button disabled={!verifiedName || isVerifying} onClick={handleWithdraw} className={`w-full py-6 font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-2xl transition-all ${verifiedName ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>Execute Harvest</button>
              <button onClick={() => setWithdrawModal(false)} className="w-full text-slate-600 text-[10px] font-black uppercase tracking-widest">Cancel</button>
           </div>
        </div>
      )}

      {paystackModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 text-center shadow-3xl">
              <div className="w-24 h-24 bg-indigo-600/10 border border-indigo-600/20 rounded-full flex items-center justify-center mx-auto text-5xl mb-2 relative">
                 <span className="relative z-10">💎</span>
                 <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-full"></div>
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Initialize Node</h3>
              <p className="text-slate-400 text-xs leading-relaxed uppercase font-black px-4">Link <span className="text-white font-black">{paystackModal.name}</span> to your Protocol Fleet for {CURRENCY}{paystackModal.price.toLocaleString()}?</p>
              <div className="flex flex-col gap-3 pt-4">
                 <button onClick={confirmInvestment} className="w-full py-6 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-500 transition-all">Confirm Activation</button>
                 <button onClick={() => setPaystackModal(null)} className="w-full py-3 text-slate-600 font-black uppercase text-[10px] tracking-widest">Decline</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
