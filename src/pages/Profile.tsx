import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  User, 
  Mail, 
  Shield, 
  LogOut
} from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();

      // Subscribe to realtime changes for profile
      const subscription = supabase
        .channel(`profile_realtime_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, () => {
          fetchProfile();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase tracking-tighter italic">Profile Settings</h1>
          <p className="text-neutral-500 mt-0.5 text-xs font-medium uppercase tracking-widest">Manage your account settings and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/20">
                <User className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{profile?.full_name || user?.email?.split('@')[0]}</h3>
                <p className="text-[10px] text-neutral-500 font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-[#262626]">
              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-sky-500" />
                  <span className="text-[10px] font-bold text-neutral-400">Account Status</span>
                </div>
                <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-sky-500/20">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-sky-500" />
                  <span className="text-[10px] font-bold text-neutral-400">Email</span>
                </div>
                <span className="text-[10px] font-bold text-neutral-200">
                  {user?.email?.slice(0, 3)}...@{user?.email?.split('@')[1]}
                </span>
              </div>
            </div>

            <button 
              onClick={() => signOut()}
              className="w-full py-3 bg-red-500/5 text-red-500 font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all border border-red-500/20 flex items-center justify-center gap-2 text-xs"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#262626]">
              <Shield className="w-5 h-5 text-sky-500" />
              <h3 className="text-lg font-bold text-white">Account Information</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Full Name</p>
                  <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white font-bold text-sm">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Email Address</p>
                  <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white font-bold text-sm">
                    {user?.email}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-xl">
                <p className="text-[10px] text-sky-400 font-medium leading-relaxed">
                  Your account is currently active and verified. For any changes to your personal information or security settings, please contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
