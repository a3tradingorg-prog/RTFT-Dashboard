import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  User, 
  Mail, 
  Shield, 
  LogOut,
  Camera,
  Upload,
  Save,
  Lock,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setUsername(data.full_name || '');
      } else {
        // If no profile exists, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id })
          .select()
          .single();
        
        if (!insertError && newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type. Please upload an image.');
      return;
    }

    // Validate file size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max size is 2MB.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading profile picture...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600',
          contentType: file.type
        });

      if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload to storage');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Failed to generate public URL');

      // Update profile in database using upsert to ensure it exists
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user?.id,
          avatar_url: `${publicUrl}?t=${Date.now()}` // Add cache buster
        });

      if (updateError) throw updateError;

      toast.success('Profile picture updated successfully!', { id: toastId });
      fetchProfile();
    } catch (error: any) {
      console.error('Upload error details:', error);
      toast.error(`Upload failed: ${error.message || 'Please ensure the "profiles" bucket exists and RLS policies are set.'}`, { 
        id: toastId,
        duration: 5000 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleFileUpload(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setIsSavingUsername(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user?.id,
          full_name: username.trim()
        });

      if (error) throw error;
      toast.success('Username updated successfully!');
      fetchProfile();
    } catch (error: any) {
      toast.error(`Failed to update username: ${error.message}`);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        toast.error('Incorrect old password');
        return;
      }
      
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(`Password change failed: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isUsernameDirty = username !== (profile?.full_name || '');
  const isPasswordValid = oldPassword && newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="space-y-10" onPaste={handlePaste}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase tracking-tighter italic">Profile Settings</h1>
          <p className="text-neutral-500 mt-0.5 text-xs font-medium uppercase tracking-widest">Manage your account settings and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div 
                className="relative group cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="relative p-[2px] rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#3b82f6,#8b5cf6,#ec4899,#f97316,#eab308,#22c55e,#3b82f6)] opacity-70 group-hover:opacity-100 transition-opacity" 
                  />
                  <div className="relative z-10 w-24 h-24 bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden transition-all">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-10 h-10 text-sky-500" />
                    )}
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white">{username || user?.email?.split('@')[0]}</h3>
                <p className="text-xs text-neutral-500 font-medium">{user?.email}</p>
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
              onClick={() => {
                signOut();
                toast.success('Signed out successfully');
              }}
              className="w-full py-3 bg-red-500/5 text-red-500 font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all border border-red-500/20 flex items-center justify-center gap-2 text-xs"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Account Information Section */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#262626]">
              <User className="w-5 h-5 text-sky-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">Account Information</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Email Address (Non-editable)</label>
                  <div className="p-3 bg-[#0a0a0a]/50 border border-[#262626] rounded-xl text-neutral-500 font-bold text-sm cursor-not-allowed">
                    {user?.email}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveUsername}
                  disabled={!isUsernameDirty || isSavingUsername}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isSavingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#262626]">
              <Lock className="w-5 h-5 text-sky-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">Security Section</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Old Password</label>
                  <div className="relative">
                    <input 
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={!isPasswordValid || isChangingPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
