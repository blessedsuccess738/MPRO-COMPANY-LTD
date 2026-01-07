
import React, { useState, useEffect } from 'react';
import { APP_NAME, CURRENCY } from '../constants';

interface Props {
  onLogin: () => void;
  onSignUp: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ onLogin, onSignUp }) => {
  const [tickerOffset, setTickerOffset] = useState(0);

  // Simple animation for a fake live ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerOffset((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const recentPayouts = [
    { user: "user***@gmail.com", amount: 15400, action: "Withdrawn" },
    { user: "bless***@gmail.com", amount: 50000, action: "Deposited" },
    { user: "invest***@gmail.com", amount: 3500, action: "Started" },
    { user: "mpro_***@gmail.com", amount: 120000, action: "Withdrawn" },
    { user: "success***@gmail.com", amount: 25000, action: "Earned" },
    { user: "ade***@gmail.com", amount: 75000, action: "Deposited" },
    { user: "chidi***@gmail.com", amount: 5000, action: "Earned" },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#070b14] overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Immersive Animated Background Layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse transition-all duration-[10s]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '15s' }}></div>
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]"></div>
        </div>
      </div>

      {/* Premium Sticky Ticker */}
      <div className="sticky top-0 z-50 bg-[#070b14]/80 backdrop-blur-xl border-b border-white/5 py-2.5 overflow-hidden shadow-2xl">
        <div 
          className="whitespace-nowrap flex gap-12 text-[10px] font-black text-indigo-400 uppercase tracking-widest"
          style={{ transform: `translateX(-${tickerOffset}px)` }}
        >
          {Array(15).fill(0).map((_, i) => (
            <React.Fragment key={i}>
              {recentPayouts.map((p, idx) => (
                <span key={idx} className="inline-flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  {p.user} <span className="text-white/40">{p.action}:</span> <span className="text-white">{CURRENCY}{p.amount.toLocaleString()}</span>
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full">
        {/* --- HERO SECTION --- */}
        <section className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-12">
          <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
              <div className="inline-flex items-center gap-4 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-lg">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                <span className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em]">Next-Gen Wealth Protocol</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tighter text-white leading-[0.85]">
                BUILD YOUR <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500">
                  LEGACY TODAY
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl leading-relaxed">
                {APP_NAME} leverages institutional-grade logistics assets to provide retail investors with a consistent, audit-backed <span className="text-white font-black border-b-2 border-indigo-500">26% Daily Earning Rate</span>.
              </p>
              
              <div className="flex flex-wrap gap-8 pt-6">
                {[
                  { icon: "🔒", label: "256-Bit SSL", sub: "End-to-end security" },
                  { icon: "🇳🇬", label: "Local Banking", sub: "Direct Naira payouts" },
                  { icon: "⚖️", label: "Asset Backed", sub: "Physical collateral" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight">{item.label}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 animate-in fade-in slide-in-from-bottom duration-1000">
              <div className="bg-gradient-to-br from-white/10 to-indigo-900/10 backdrop-blur-3xl border border-white/10 p-10 md:p-12 rounded-[3.5rem] shadow-[0_0_100px_-20px_rgba(79,70,229,0.3)] space-y-10">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform cursor-pointer">
                    <span className="text-white text-5xl font-black italic select-none">M</span>
                  </div>
                </div>
                
                <div className="text-center space-y-3">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Join the Elite</h2>
                  <p className="text-slate-400 text-sm font-medium">Activate your earning engine in seconds.</p>
                </div>
                
                <div className="space-y-4">
                  <button onClick={onSignUp} className="group relative w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] active:scale-95 text-xl tracking-tight overflow-hidden">
                    <span className="relative z-10 uppercase">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                  <button onClick={onLogin} className="w-full py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs">
                    Access Member Portal
                  </button>
                </div>
                
                <div className="flex justify-center items-center gap-4 grayscale opacity-40">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/e/ed/Paystack_Logo.png" alt="Paystack" className="h-4 object-contain" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 animate-bounce cursor-pointer opacity-30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7-7-7"></path></svg>
          </div>
        </section>

        {/* --- ETHICS & INTEGRITY SECTION --- */}
        <section className="py-32 px-6 relative overflow-hidden bg-[#0a101d]">
          <div className="max-w-7xl mx-auto space-y-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter">
                    INVESTMENT <br />
                    <span className="text-indigo-500">ETHICS & TRUTH</span>
                  </h2>
                  <div className="w-24 h-2 bg-indigo-600 rounded-full"></div>
                </div>
                
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-medium">
                  We built {APP_NAME} on the foundation of radical transparency. Unlike platforms that trade "air", our daily 26% returns are derived from real economic activity in the logistics and housing sectors.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { t: "Asset Backing", d: "Every Naira is tied to a physical unit with serial numbers and deeds." },
                    { t: "Sustainability", d: "Our lease rates are optimized for long-term platform health." },
                    { t: "Zero Hidden Costs", d: "Maintenance and management are handled by our backend." },
                    { t: "Verified Payouts", d: "Paystack integration ensures 100% automated processing." }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                       <h4 className="text-white font-black uppercase text-xs tracking-widest">{item.t}</h4>
                       <p className="text-slate-500 text-sm">{item.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { n: "Total Deployments", v: "125,402" },
                  { n: "Current Liquidity", v: "₦450M+" },
                  { n: "Asset Utilization", v: "94.2%" },
                  { n: "User Trust Score", v: "4.9/5" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-center items-center text-center space-y-2 hover:bg-white/10 transition-colors">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.n}</p>
                     <p className="text-2xl md:text-4xl font-black text-white tracking-tighter">{stat.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS (THE SCROLL EXPERIENCE) --- */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto space-y-24">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase">THE MPRO LIFECYCLE</h2>
              <p className="text-slate-400 text-lg font-medium">Three simple phases to achieve financial mobility.</p>
            </div>
            
            <div className="space-y-32">
              {[
                { 
                  step: "01", 
                  title: "Portfolio Selection", 
                  desc: "Choose from 11 meticulously curated asset tiers. Whether it's a Motorcycle Unit for a quick start or a Residential Plot for high-volume yields, we have a package for every budget.",
                  icon: "💎",
                  color: "indigo"
                },
                { 
                  step: "02", 
                  title: "Automated Deployment", 
                  desc: "Once you activate with Paystack, our smart-contracts allocate your capital to a physical asset unit. You receive a digital deed and your daily 26% ROI starts accruing every 24 hours.",
                  icon: "🚀",
                  color: "blue"
                },
                { 
                  step: "03", 
                  title: "Wealth Harvest", 
                  desc: "At the end of your contract duration, your total capital plus all accrued profits are released into your MPRO wallet. Withdraw directly to your local Nigerian bank account instantly.",
                  icon: "🏦",
                  color: "purple"
                }
              ].map((item, i) => (
                <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 items-center`}>
                   <div className="flex-1 space-y-6">
                      <span className={`text-[80px] font-black text-${item.color}-500 opacity-20 leading-none`}>{item.step}</span>
                      <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{item.title}</h3>
                      <p className="text-slate-400 text-lg leading-relaxed">{item.desc}</p>
                   </div>
                   <div className="flex-1 w-full flex justify-center">
                      <div className={`w-64 h-64 rounded-[4rem] bg-${item.color}-600/10 border-2 border-${item.color}-500/20 flex items-center justify-center text-8xl shadow-[0_0_80px_-20px_rgba(79,70,229,0.3)]`}>
                        {item.icon}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PRICING GRID (COMPACT BUT BOLD) --- */}
        <section className="py-32 px-6 bg-white/[0.02]">
           <div className="max-w-7xl mx-auto space-y-16">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Deployment Tiers</h2>
                  <p className="text-slate-500 font-medium">Every asset earns 26% of its price daily.</p>
                </div>
                <div className="px-6 py-2.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-xs font-black uppercase tracking-[0.2em]">
                   System: Online & Active
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {[
                  { n: "Motorcycle", p: "3.5k", roi: "910" },
                  { n: "Compact Car", p: "5k", roi: "1.3k" },
                  { n: "Sedan", p: "10k", roi: "2.6k" },
                  { n: "Van", p: "25k", roi: "6.5k" },
                  { n: "Luxury SUV", p: "50k", roi: "13k" },
                  { n: "Studio Apt", p: "75k", roi: "19.5k" },
                  { n: "1 Bed Flat", p: "100k", roi: "26k" },
                  { n: "Bungalow", p: "150k", roi: "39k" },
                  { n: "Duplex", p: "250k", roi: "65k" },
                  { n: "Mini Estate", p: "350k", roi: "91k" },
                  { n: "Plot", p: "500k", roi: "130k" }
                ].map((pkg, i) => (
                  <div key={i} onClick={onSignUp} className="group cursor-pointer bg-white/5 border border-white/5 p-6 rounded-[2rem] hover:bg-indigo-600 hover:border-indigo-400 transition-all space-y-4">
                    <p className="text-[10px] font-black text-indigo-400 group-hover:text-indigo-100 uppercase tracking-widest">Tier {i+1}</p>
                    <div className="space-y-1">
                      <p className="text-white font-bold text-sm truncate leading-tight uppercase tracking-tighter">{pkg.n}</p>
                      <p className="text-2xl font-black text-white leading-none">₦{pkg.p}</p>
                    </div>
                    <div className="pt-4 border-t border-white/5 group-hover:border-white/20">
                       <p className="text-[9px] text-slate-500 group-hover:text-white/60 uppercase font-black">Daily Profit</p>
                       <p className="text-xs font-bold text-green-400 group-hover:text-white">₦{pkg.roi}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* --- FAQ SECTION --- */}
        <section className="py-32 px-6">
           <div className="max-w-4xl mx-auto space-y-16">
              <h2 className="text-5xl font-black text-white text-center tracking-tighter uppercase underline decoration-indigo-600 underline-offset-8">Common Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { q: "How is 26% daily possible?", a: "We operate in high-turnover logistics where asset lease value yields high daily cashflow, which we distribute back to our users." },
                  { q: "Is Paystack safe?", a: "Paystack is Africa's leading payment gateway. Your transaction data is encrypted and never stored on our servers." },
                  { q: "Can I upgrade my asset?", a: "You must complete your current investment cycle before selecting a new asset tier." },
                  { q: "What about manual withdrawals?", a: "We verify every withdrawal request within 24 hours to prevent fraud and ensure platform integrity." }
                ].map((faq, i) => (
                  <div key={i} className="space-y-3 bg-white/5 p-8 rounded-[2rem] border border-white/10">
                    <p className="text-white font-black uppercase text-sm">{faq.q}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* --- FINAL CONVERSION CTA --- */}
        <section className="py-40 px-6 relative overflow-hidden">
           <div className="absolute inset-0 bg-indigo-600/20 blur-[150px] rounded-full scale-150"></div>
           <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
              <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">THE FUTURE <br /> IS CALLING.</h2>
              <p className="text-slate-300 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto">
                Don't watch from the sidelines. Join thousands of Nigerians building real wealth through automated asset deployment.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button onClick={onSignUp} className="px-16 py-6 bg-white text-indigo-900 font-black rounded-3xl hover:bg-indigo-50 transition-all shadow-[0_40px_80px_-20px_rgba(255,255,255,0.2)] active:scale-95 text-2xl uppercase tracking-tighter">
                  Get Started
                </button>
                <button onClick={onLogin} className="px-16 py-6 bg-transparent border-2 border-white/20 text-white font-black rounded-3xl hover:bg-white/5 transition-all active:scale-95 text-2xl uppercase tracking-tighter">
                  Sign In
                </button>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">100% Free Account Registration</p>
           </div>
        </section>

        {/* --- ENHANCED FOOTER --- */}
        <footer className="py-20 px-6 border-t border-white/5 bg-[#05080f]">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
              <div className="space-y-6 max-w-sm">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black italic text-white text-xl">M</div>
                    <span className="text-white font-black text-2xl tracking-tighter">{APP_NAME} PRO GLOBAL</span>
                 </div>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   Empowering the next generation of African investors through verified, asset-backed digital wealth protocols.
                 </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
                 <div className="space-y-6">
                    <p className="text-white font-black text-xs uppercase tracking-widest">Platform</p>
                    <ul className="space-y-4 text-slate-500 text-sm font-bold">
                       <li><a href="#" className="hover:text-indigo-400">Assets</a></li>
                       <li><a href="#" className="hover:text-indigo-400">Security</a></li>
                       <li><a href="#" className="hover:text-indigo-400">Payouts</a></li>
                    </ul>
                 </div>
                 <div className="space-y-6">
                    <p className="text-white font-black text-xs uppercase tracking-widest">Company</p>
                    <ul className="space-y-4 text-slate-500 text-sm font-bold">
                       <li><a href="#" className="hover:text-indigo-400">Ethics</a></li>
                       <li><a href="#" className="hover:text-indigo-400">Terms</a></li>
                       <li><a href="#" className="hover:text-indigo-400">Support</a></li>
                    </ul>
                 </div>
                 <div className="space-y-6 col-span-2 sm:col-span-1">
                    <p className="text-white font-black text-xs uppercase tracking-widest">Legal</p>
                    <p className="text-slate-600 text-[10px] leading-relaxed uppercase font-bold tracking-tight">
                      MPRO is a registered service. Past performance is not indicative of future results. All investments are final once deployed.
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} {APP_NAME} PRO TECHNOLOGY LTD.</p>
              <div className="flex gap-6 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                 <span className="text-white text-xs font-black tracking-widest">PCI-DSS COMPLIANT</span>
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default WelcomeScreen;
