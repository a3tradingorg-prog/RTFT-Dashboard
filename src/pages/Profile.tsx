import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  LogOut, 
  AlertCircle, 
  Check,
  RefreshCw,
  ChevronRight,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Profile</h1>
          <p className="text-neutral-500 mt-2 font-medium">Manage your account settings and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-24 h-24 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/20">
                  <User className="w-10 h-10 text-sky-500" />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-sky-500 text-black rounded-full shadow-lg hover:bg-sky-400 transition-all opacity-0 group-hover:opacity-100">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user?.email?.split('@')[0]}</h3>
                <p className="text-sm text-neutral-500 font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-[#262626]">
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-sky-500" />
                  <span className="text-xs font-bold text-neutral-400">Account Status</span>
                </div>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-500/20">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-sky-500" />
                  <span className="text-xs font-bold text-neutral-400">Email</span>
                </div>
                <span className="text-xs font-bold text-neutral-200">
                  {user?.email?.slice(0, 3)}...@{user?.email?.split('@')[1]}
                </span>
              </div>
            </div>

            <button 
              onClick={() => signOut()}
              className="w-full py-4 bg-red-500/5 text-red-500 font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/10 transition-all border border-red-500/20 flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 lg:p-12 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-[#262626]">
              <Lock className="w-6 h-6 text-sky-500" />
              <h3 className="text-xl font-bold text-white">Security Settings</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="max-w-md space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700"
                  />
                </div>
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl text-sm font-bold",
                      message.type === 'success' ? "bg-sky-500/5 border border-sky-500/20 text-sky-400" : "bg-red-500/5 border border-red-500/20 text-red-400"
                    )}
                  >
                    {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading || !newPassword}
                className="w-full py-4 bg-sky-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
