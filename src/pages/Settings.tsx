import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ScrollReveal } from '../components/ScrollReveal';
import { motion } from 'motion/react';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;
      
      setSuccess('Password updated successfully');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <ScrollReveal>
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-neutral-400 mt-1">Manage your account preferences and security.</p>
        </header>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <ScrollReveal delay={0.1}>
          <div className="space-y-1">
            <motion.button 
              whileHover={{ x: 5 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20"
            >
              <User className="w-5 h-5" />
              Profile
            </motion.button>
            <motion.button 
              whileHover={{ x: 5 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-[#141414] transition-all"
            >
              <Shield className="w-5 h-5" />
              Security
            </motion.button>
            <motion.button 
              whileHover={{ x: 5 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-[#141414] transition-all"
            >
              <Bell className="w-5 h-5" />
              Notifications
            </motion.button>
          </div>
        </ScrollReveal>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Section */}
          <ScrollReveal delay={0.2}>
            <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-6">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    disabled 
                    value={user?.email || ''}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-neutral-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-neutral-600 mt-1 italic">Email cannot be changed. Contact admin for updates.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">User ID</label>
                    <input 
                      type="text" 
                      disabled 
                      value={user?.id || ''}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-neutral-500 text-xs font-mono truncate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Role</label>
                    <input 
                      type="text" 
                      disabled 
                      value="User"
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-neutral-500"
                    />
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Security Section */}
          <ScrollReveal delay={0.3}>
            <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold">Change Password</h3>
              </div>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">New Password</label>
                  <input 
                    required
                    type="password" 
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Confirm New Password</label>
                  <input 
                    required
                    type="password" 
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                    placeholder="Repeat new password"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                    <Check className="w-4 h-4" />
                    {success}
                  </div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-400 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </motion.button>
              </form>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
