
import React, { useState, useEffect } from 'react';
import { APP_NAME, CURRENCY } from '../constants';
import { store } from '../store';

interface Props {
  onLogin: () => void;
  onSignUp: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ onLogin, onSignUp }) => {
  const [tickerOffset, setTickerOffset] = useState(0);
  const settings = store.getSettings();

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
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#070b14] overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background */}
      {settings.welcomeBackgroundUrl ? (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {settings.isWelcomeVideo ? (
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              src={settings.welcomeBackgroundUrl}
            />
          ) : (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center opacity-50"
              style={{ backgroundImage: `url(${settings.welcomeBackgroundUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-[#070b14]/60 backdrop-blur-[4px]" />
        </div>
      ) : (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse"></div>
        </div>
      )}

      {/* Premium Ticker */}
      <div className="sticky top-0 z-50 bg-[#070b14]/80 backdrop-blur-xl border-b border-white/5 py-2.5 overflow-hidden">
        <div 
          className="whitespace-nowrap flex gap-12 text-[10px] font-black text-indigo-400 uppercase tracking-widest"
          style={{ transform: `translateX(-${tickerOffset}px)` }}
        >
          {Array(15).fill(0).map((_, i) => (
            <React.Fragment key={i}>
              {recentPayouts.map((p, idx) => (
                <span key={idx} className="inline-flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {p.user} <span className="text-white/40">{p.action}:</span> <span className="text-white">{CURRENCY}{p.amount.toLocaleString()}</span>
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full">
        <section className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-12">
          <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
              <div className="inline-flex items-center gap-4 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                <span className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em]">Live Wealth Protocol</span>
              </div>
              <h1 className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tighter text-white leading-[0.85]">
                MPRO<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                  INVESTMENT
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl leading-relaxed">
                Institutional-grade logistics assets delivering <span className="text-white font-black border-b-2 border-indigo-500">26% Daily ROI</span>. Fully verified and audit-backed.
              </p>
            </div>

            <div className="lg:col-span-5 animate-in fade-in slide-in-from-bottom duration-1000">
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 md:p-12 rounded-[3.5rem] shadow-2xl space-y-10">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2.2rem] flex items-center justify-center shadow-2xl">
                    <span className="text-white text-4xl font-black italic">M</span>
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Join Protocol</h2>
                  <p className="text-slate-400 text-sm font-medium">Earn institutional yields in seconds.</p>
                </div>
                <div className="space-y-4">
                  <button onClick={onSignUp} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl text-xl uppercase tracking-tight">Get Started</button>
                  <button onClick={onLogin} className="w-full py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-xs">Login</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WelcomeScreen;
