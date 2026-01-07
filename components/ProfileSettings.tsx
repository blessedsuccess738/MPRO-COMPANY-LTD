
import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../store';

interface Props {
  user: User;
}

const ProfileSettings: React.FC<Props> = ({ user }) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [message, setMessage] = useState('');

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
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-white tracking-tighter uppercase px-2">Portfolio Settings</h3>
      
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl space-y-8">
         <div className="flex items-center space-x-5 p-4 bg-white/5 rounded-[2rem] border border-white/5">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-[1.5rem] flex items-center justify-center text-indigo-500 border border-indigo-500/30">
               <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            </div>
            <div>
               <p className="text-lg font-black text-white tracking-tight">{user.email}</p>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
         </div>

         <form onSubmit={handleUpdate} className="space-y-6 pt-6 border-t border-white/5">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-white uppercase text-xs tracking-widest">Security Update</h4>
              {message && <p className={`text-[10px] font-black uppercase tracking-widest ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                 <input 
                    type="password"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all hover:bg-white/[0.08]"
                    value={oldPass}
                    placeholder="••••••••"
                    onChange={(e) => setOldPass(e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Secure Password</label>
                 <input 
                    type="password"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all hover:bg-white/[0.08]"
                    value={newPass}
                    placeholder="New Password"
                    onChange={(e) => setNewPass(e.target.value)}
                 />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-white text-[#070b14] font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-indigo-50 active:scale-95 transition-all shadow-xl shadow-white/5">Update Credentials</button>
         </form>
      </div>
      
      <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 text-center space-y-2">
         <p className="text-red-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
           Account Security
         </p>
         <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-tight">Never share your access keys with third parties. MPRO officials will never ask for your password via chat or phone.</p>
      </div>
    </div>
  );
};

export default ProfileSettings;
