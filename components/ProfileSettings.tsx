
import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../store';

interface Props {
  user: User;
  onLogout: () => void;
}

const ProfileSettings: React.FC<Props> = ({ user, onLogout }) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [message, setMessage] = useState('');
  
  // Fake setting states for demonstration
  const [profitAlerts, setProfitAlerts] = useState(true);
  const [biometricSync, setBiometricSync] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.password && oldPass !== user.password) {
      setMessage('Current password incorrect');
      return;
    }
    store.updateUser(user.id, { password: newPass });
    setMessage('Password updated successfully');
    setOldPass('');
    setNewPass('');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Member HQ</h3>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
        >
          Logout Session
        </button>
      </div>
      
      {/* Profile Info Card */}
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
         <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">👤</div>
         <div className="flex items-center space-x-6 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-3xl flex items-center justify-center text-white shadow-xl border-4 border-white/5">
               <span className="text-3xl font-black">{user.email[0].toUpperCase()}</span>
            </div>
            <div>
               <p className="text-2xl font-black text-white tracking-tight">{user.email}</p>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Node Verified • Member Since {new Date(user.createdAt).getFullYear()}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Section */}
        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl space-y-6 backdrop-blur-md">
           <div className="flex justify-between items-center">
             <h4 className="font-black text-white uppercase text-xs tracking-[0.2em] flex items-center gap-2">
               <span className="text-indigo-400">🛡️</span> Security Sync
             </h4>
             {message && <p className={`text-[9px] font-black uppercase tracking-widest animate-pulse ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
           </div>
           
           <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Protocol Key</label>
                 <input 
                    type="password"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold text-sm"
                    value={oldPass}
                    placeholder="••••••••"
                    onChange={(e) => setOldPass(e.target.value)}
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">New Protocol Key</label>
                 <input 
                    type="password"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold text-sm"
                    value={newPass}
                    placeholder="New Secure Password"
                    onChange={(e) => setNewPass(e.target.value)}
                 />
              </div>
              <button type="submit" className="w-full py-4 bg-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-white/20 active:scale-95 transition-all border border-white/5">Update Access Keys</button>
           </form>
        </div>

        {/* Financial Identity Section */}
        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl space-y-6 backdrop-blur-md">
           <h4 className="font-black text-white uppercase text-xs tracking-[0.2em] flex items-center gap-2">
             <span className="text-green-400">💳</span> Banking Identity
           </h4>
           <div className="space-y-4">
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group cursor-help">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Default Payout Method</p>
                    <p className="text-white font-bold text-sm mt-1 uppercase">Local Node Bank Transfer</p>
                 </div>
                 <span className="text-xl">🏦</span>
              </div>
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identity Verification</p>
                 <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <p className="text-green-400 font-black text-[10px] uppercase tracking-widest">Level 1 Protocol Secured</p>
                 </div>
              </div>
              <button className="w-full py-4 bg-indigo-600/10 text-indigo-400 font-black rounded-2xl uppercase tracking-widest text-[10px] border border-indigo-500/20 hover:bg-indigo-600/20 transition-all">Link Secondary Node</button>
           </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl space-y-8 backdrop-blur-md">
         <h4 className="font-black text-white uppercase text-xs tracking-[0.2em] flex items-center gap-2">
           <span className="text-amber-400">⚙️</span> Protocol Preferences
         </h4>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
               <div>
                  <p className="text-white font-black text-[11px] uppercase tracking-tight">Daily Profit Alerts</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Node Notifications</p>
               </div>
               <button 
                  onClick={() => setProfitAlerts(!profitAlerts)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${profitAlerts ? 'bg-indigo-600' : 'bg-slate-700'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${profitAlerts ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
               <div>
                  <p className="text-white font-black text-[11px] uppercase tracking-tight">Biometric Sync</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">FaceID / TouchID Authentication</p>
               </div>
               <button 
                  onClick={() => setBiometricSync(!biometricSync)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${biometricSync ? 'bg-indigo-600' : 'bg-slate-700'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${biometricSync ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
               <div>
                  <p className="text-white font-black text-[11px] uppercase tracking-tight">Stealth Mode</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hide balance from global ticker</p>
               </div>
               <button 
                  onClick={() => setStealthMode(!stealthMode)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${stealthMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${stealthMode ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
               <div>
                  <p className="text-white font-black text-[11px] uppercase tracking-tight">Language Protocol</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Current: English (Global)</p>
               </div>
               <span className="text-xs font-black text-indigo-400">CHANGE</span>
            </div>
         </div>
      </div>
      
      {/* Account Control */}
      <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8 text-center space-y-6 backdrop-blur-md">
         <div className="space-y-2">
            <p className="text-red-500 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <span className="text-xl">⚠️</span> Danger Zone
            </p>
            <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-tight max-w-sm mx-auto">
              Account termination will purge all active asset deeds and current balance. This action is irreversible.
            </p>
         </div>
         <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button 
              onClick={onLogout}
              className="px-10 py-4 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-red-500 transition-all shadow-xl shadow-red-600/10 active:scale-95"
            >
              Sign Out Securely
            </button>
            <button className="px-10 py-4 bg-transparent border border-red-500/20 text-red-500/40 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-red-500/5 transition-all">
              Delete Protocol Data
            </button>
         </div>
      </div>

      <div className="pb-8 text-center">
         <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">MPRO INVEST GLOBAL HQ • V4.2.0-PRO</p>
      </div>
    </div>
  );
};

export default ProfileSettings;
