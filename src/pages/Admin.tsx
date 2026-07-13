import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Smartphone, 
  UploadCloud, 
  PlusCircle, 
  Database, 
  ShieldCheck, 
  Key, 
  Globe, 
  Video, 
  FileText, 
  HelpCircle, 
  Trash2, 
  CheckCircle,
  Copy,
  Info,
  Server,
  ShieldAlert,
  Zap,
  Search,
  AlertTriangle,
  Power
} from 'lucide-react';
import { adminService, UserSession, AdminQA } from '../lib/adminService';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';
import { ScrollReveal } from '../components/ScrollReveal';
import { Ripple } from '../components/Ripple';
import { cn } from '../lib/utils';
import { isConfigured } from '../lib/supabase';

type AdminTab = 'accounts' | 'sessions' | 'uploads' | 'qas' | 'database';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [qas, setQas] = useState<AdminQA[]>([]);
  const [loading, setLoading] = useState(false);

  // Sessions audit states
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionViewMode, setSessionViewMode] = useState<'all' | 'audit'>('audit');
  const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);

  // Forms States
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: '2026 Future Mentorship',
    url: ''
  });

  const [qaForm, setQaForm] = useState({
    question_en: '',
    question_mm: '',
    answer_en: '',
    answer_mm: '',
    category_en: 'General',
    category_mm: 'အထွေထွေ'
  });

  const [activeTabResources, setActiveTabResources] = useState<any[]>([]);
  const [connectionString, setConnectionString] = useState(() => localStorage.getItem('supabase_admin_conn_str') || '');
  const [setupLoading, setSetupLoading] = useState(false);

  const handleAutoSetupDB = async () => {
    if (!connectionString) {
      toast.error('Please enter your Supabase Database Connection String first.');
      return;
    }

    setSetupLoading(true);
    try {
      const response = await fetch('/api/admin/setup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionString })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Database tables and policies deployed successfully!');
        localStorage.setItem('supabase_admin_conn_str', connectionString);
      } else {
        throw new Error(data.error || 'Failed to deploy SQL schema.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error connecting to database or executing SQL setup script.');
    } finally {
      setSetupLoading(false);
    }
  };

  const ADMIN_EMAILS = ['htetaungkyawhak2@gmail.com', 'example@gmail.com', 'a3tradingorg@gmail.com'];
  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-neutral-500 font-mono text-xs tracking-widest uppercase">Verifying administrative authority...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <ScrollReveal>
          <div className="max-w-md w-full bg-[#141414] border border-rose-500/10 rounded-[32px] p-8 md:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Access Denied</h2>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest font-mono">
                System Security Shield Active
              </p>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed">
              Your profile (<span className="text-rose-400 font-mono font-bold">{user?.email || 'Guest'}</span>) does not possess the credentials required to access the Administrative Control Panel.
            </p>

            <div className="pt-4 border-t border-[#222]">
              <a
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2b2b2b] hover:border-neutral-700 text-xs text-white font-bold rounded-xl transition-all relative overflow-hidden"
              >
                <Ripple />
                Return to Dashboard
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  // Fetch all admin data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const fetchedProfiles = await adminService.getProfiles();
      const fetchedSessions = await adminService.getSessions();
      const fetchedQas = await adminService.getQAs();
      
      setProfiles(fetchedProfiles);
      setSessions(fetchedSessions);
      setQas(fetchedQas);

      // Load resources for delete listings
      const localResources = JSON.parse(localStorage.getItem('rtft_admin_resources') || '[]');
      setActiveTabResources(localResources);
    } catch (e) {
      console.error('Error loading admin data:', e);
      toast.error('Failed to reload some administrative tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const handleResetPassword = async (email: string) => {
    const toastId = toast.loading(`Initiating password reset for ${email}...`);
    try {
      const response = await adminService.resetPasswordSimulate(email);
      toast.success('Reset link dispatched!', {
        id: toastId,
        description: response
      });
    } catch (err: any) {
      toast.error('Failed to trigger reset', {
        id: toastId,
        description: err.message
      });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const toastId = toast.loading('Revoking session credentials...');
    try {
      await adminService.deleteSession(sessionId);
      toast.success('Session revoked and device force logged out!', { id: toastId });
      loadAdminData();
    } catch (err: any) {
      toast.error('Failed to revoke session', { id: toastId });
    }
  };

  const handleRevokeAllUserSessions = async (email: string) => {
    const toastId = toast.loading(`Logging out all devices for ${email}...`);
    try {
      const userSessions = sessions.filter(s => s.email.toLowerCase() === email.toLowerCase());
      for (const s of userSessions) {
        await adminService.deleteSession(s.id);
      }
      toast.success(`Revoked all ${userSessions.length} active sessions for ${email}!`, { id: toastId });
      loadAdminData();
    } catch (err: any) {
      toast.error('Failed to revoke user sessions', { id: toastId });
    }
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.title || !resourceForm.url) {
      toast.error('Please fill in both Resource Title and URL');
      return;
    }

    const toastId = toast.loading('Publishing educational resource...');
    try {
      await adminService.addResource(resourceForm);
      toast.success('Successfully added to Library & Campus!', { id: toastId });
      setResourceForm({
        title: '',
        description: '',
        category: '2026 Future Mentorship',
        url: ''
      });
      loadAdminData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add resource', { id: toastId });
    }
  };

  const handleResourceDelete = async (id: string) => {
    const toastId = toast.loading('Deleting resource...');
    try {
      await adminService.deleteResource(id);
      toast.success('Resource deleted successfully', { id: toastId });
      loadAdminData();
    } catch (e) {
      toast.error('Failed to delete resource', { id: toastId });
    }
  };

  const handleQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaForm.question_en || !qaForm.answer_en) {
      toast.error('Please fill in English Question and Answer');
      return;
    }

    const toastId = toast.loading('Posting Q&A content...');
    try {
      await adminService.addQA(qaForm);
      toast.success('Successfully published Q&A post!', { id: toastId });
      setQaForm({
        question_en: '',
        question_mm: '',
        answer_en: '',
        answer_mm: '',
        category_en: 'General',
        category_mm: 'အထွေထွေ'
      });
      loadAdminData();
    } catch (error: any) {
      toast.error('Failed to add Q&A', { id: toastId });
    }
  };

  const handleQaDelete = async (id: string) => {
    const toastId = toast.loading('Deleting Q&A...');
    try {
      await adminService.deleteQA(id);
      toast.success('Q&A deleted successfully', { id: toastId });
      loadAdminData();
    } catch (e) {
      toast.error('Failed to delete Q&A', { id: toastId });
    }
  };

  // SQL code block for the copyable setup instructions
  const SQL_SCHEMA_CODE = `-- SUPABASE ADMIN SYSTEM TABLES
-- Run these statements inside your Supabase SQL Editor to support persistent Admin operations.

-- 1. Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'PDF' or custom course categories
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies for Resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on resources" ON resources;
CREATE POLICY "Allow public read access on resources" ON resources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin modify resources" ON resources;
CREATE POLICY "Allow admin modify resources" ON resources FOR ALL USING (true);

-- 2. Q&As Table
CREATE TABLE IF NOT EXISTS qas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_en TEXT NOT NULL,
  question_mm TEXT,
  answer_en TEXT NOT NULL,
  answer_mm TEXT,
  category_en TEXT DEFAULT 'General',
  category_mm TEXT DEFAULT 'အထွေထွေ',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies for QAs
ALTER TABLE qas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on qas" ON qas;
CREATE POLICY "Allow public read access on qas" ON qas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin modify qas" ON qas;
CREATE POLICY "Allow admin modify qas" ON qas FOR ALL USING (true);

-- 3. Sessions Tracking Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  device TEXT,
  location TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies for Sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin select user_sessions" ON user_sessions;
CREATE POLICY "Allow admin select user_sessions" ON user_sessions FOR ALL USING (true);

-- 4. Notifications Center Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- NULL means global
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'video', 'pdf', 'qa', 'info'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read notifications" ON notifications;
CREATE POLICY "Allow read notifications" ON notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert/update/delete notifications" ON notifications;
CREATE POLICY "Allow insert/update/delete notifications" ON notifications FOR ALL USING (true);

-- REFRESH
NOTIFY pgrst, 'reload schema';`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('SQL commands copied to clipboard!');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Title block */}
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
              <ShieldCheck className="w-10 h-10 text-sky-500" />
              Admin Control Panel
            </h1>
            <p className="text-neutral-500 mt-2 font-bold tracking-wide uppercase text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              SYSTEM PORTAL • SECURITY CONTROL ENGINE
            </p>
          </div>

          <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-xs font-mono",
            isConfigured 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
              : "bg-amber-500/5 border-amber-500/20 text-amber-400"
          )}>
            <Server className="w-4 h-4 shrink-0" />
            <span>
              STATUS: {isConfigured ? 'CONNECTED TO SUPABASE' : 'TEST MODE (OFFLINE FALLBACKSACTIVE)'}
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Tabs list */}
      <ScrollReveal delay={0.05}>
        <div className="flex flex-wrap gap-2 border-b border-[#222] pb-4">
          {[
            { id: 'accounts', name: 'User Accounts', icon: Users },
            { id: 'sessions', name: 'Devices & Sessions', icon: Smartphone },
            { id: 'uploads', name: 'Content Upload', icon: UploadCloud },
            { id: 'qas', name: 'Q&A Board', icon: HelpCircle },
            { id: 'database', name: 'SQL Schema Setup', icon: Database },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-wider relative overflow-hidden",
                  isActive 
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/30" 
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-[#151515]"
                )}
              >
                <Ripple />
                <IconComponent className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.name}</span>
                {tab.id === 'sessions' && sessions.length > 0 && (
                  <span className="relative z-10 ml-1 bg-sky-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded-md">
                    {sessions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-8">
        {/* TAB 1: USER ACCOUNTS */}
        {activeTab === 'accounts' && (
          <ScrollReveal delay={0.1}>
            <div className="bg-[#141414] border border-[#262626] rounded-[32px] overflow-hidden">
              <div className="p-8 border-b border-[#262626] bg-[#1a1a1a]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Registered Users Directory</h3>
                  <p className="text-xs text-neutral-500 mt-1">Manage credentials, simulate secure key password resets, and update properties.</p>
                </div>
                <button 
                  onClick={loadAdminData}
                  className="px-4 py-2 bg-[#222] border border-[#333] hover:border-sky-500/50 hover:bg-[#2a2a2a] rounded-xl text-xs text-white font-bold transition-all"
                >
                  Sync Database
                </button>
              </div>

              {loading ? (
                <div className="p-20 text-center text-neutral-500 font-mono text-sm">Syncing with Supabase profiles...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#262626] bg-[#1a1a1a]/20 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                        <th className="px-8 py-5">User</th>
                        <th className="px-8 py-5">Email Address</th>
                        <th className="px-8 py-5">Registered On</th>
                        <th className="px-8 py-5">Auth UUID</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f]">
                      {profiles.map((profile) => {
                        const userSessions = sessions.filter(s => s.email?.toLowerCase() === profile.email?.toLowerCase());
                        const isExpanded = expandedUserEmail === profile.email;
                        const hasSharingRisk = userSessions.length > 1;

                        return (
                          <React.Fragment key={profile.id}>
                            <tr className={cn(
                              "hover:bg-[#1a1a1a]/30 transition-all text-sm group",
                              isExpanded ? "bg-[#181818]/50" : ""
                            )}>
                              <td className="px-8 py-5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] overflow-hidden flex items-center justify-center">
                                  {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Users className="w-4 h-4 text-neutral-600" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-white block">{profile.full_name || 'Student Professional'}</span>
                                  {hasSharingRisk && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Multiple Devices Active
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-5 font-mono text-neutral-400">{profile.email || 'N/A'}</td>
                              <td className="px-8 py-5 text-neutral-500 text-xs">
                                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-8 py-5 font-mono text-[10px] text-neutral-600 truncate max-w-[120px]">{profile.id}</td>
                              <td className="px-8 py-5 text-right space-x-3">
                                <button
                                  onClick={() => setExpandedUserEmail(isExpanded ? null : profile.email)}
                                  className={cn(
                                    "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border relative overflow-hidden",
                                    isExpanded 
                                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                      : userSessions.length > 0
                                        ? hasSharingRisk
                                          ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-500"
                                          : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                                        : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-400"
                                  )}
                                >
                                  <Ripple />
                                  💻 Devices ({userSessions.length})
                                </button>
                                <button
                                  onClick={() => handleResetPassword(profile.email || '')}
                                  className="px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                >
                                  Reset PW
                                </button>
                              </td>
                            </tr>

                            {/* EXPANSIBLE SESSIONS ROW */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="bg-[#0b0b0b] px-8 py-6 border-t border-b border-[#222]">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                          <span>🖥️ Connected Devices Log</span>
                                          {hasSharingRisk && (
                                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse">
                                              Suspected Sharing Threat
                                            </span>
                                          )}
                                        </h4>
                                        <p className="text-xs text-neutral-500 mt-1">
                                          Real-time device terminals registered to <strong>{profile.email}</strong>.
                                        </p>
                                      </div>

                                      {userSessions.length > 0 && (
                                        <button
                                          onClick={() => handleRevokeAllUserSessions(profile.email)}
                                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                        >
                                          Force Logout All Devices
                                        </button>
                                      )}
                                    </div>

                                    {userSessions.length === 0 ? (
                                      <div className="p-6 text-center text-neutral-600 bg-[#121212]/30 rounded-2xl border border-[#1e1e1e] font-mono text-xs uppercase tracking-wider">
                                        No active logins or devices tracked on this account.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userSessions.map((sess) => (
                                          <div key={sess.id} className="bg-[#121212] border border-[#222] rounded-2xl p-4 flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                              <div className={cn(
                                                "w-9 h-9 rounded-xl flex items-center justify-center border",
                                                hasSharingRisk ? "bg-amber-500/5 border-amber-500/10 text-amber-500" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                                              )}>
                                                <Smartphone className="w-4 h-4" />
                                              </div>
                                              <div>
                                                <span className="font-bold text-neutral-200 text-xs font-mono block">{sess.device}</span>
                                                <div className="text-[10px] text-neutral-500 font-mono space-y-0.5 mt-1">
                                                  <div className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3 text-neutral-600" />
                                                    <span>IP: {sess.ip_address} ({sess.location})</span>
                                                  </div>
                                                  <div>Last Seen: {new Date(sess.last_active).toLocaleString()}</div>
                                                </div>
                                              </div>
                                            </div>

                                            <button
                                              onClick={() => handleRevokeSession(sess.id)}
                                              className="p-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded-xl transition-all hover:scale-105"
                                              title="Disconnect & revoke this device"
                                            >
                                              <Power className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* TAB 2: DEVICES & SESSIONS */}
        {activeTab === 'sessions' && (
          <ScrollReveal delay={0.1}>
            <div className="space-y-6">
              {/* Controls and Stats Header card */}
              <div className="bg-[#141414] border border-[#262626] rounded-[24px] p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setSessionViewMode('audit')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border relative overflow-hidden",
                      sessionViewMode === 'audit'
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                        : "bg-transparent border-[#333] text-neutral-400 hover:text-white"
                    )}
                  >
                    <Ripple />
                    🔍 Account Sharing Audit
                  </button>
                  <button
                    onClick={() => setSessionViewMode('all')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border relative overflow-hidden",
                      sessionViewMode === 'all'
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                        : "bg-transparent border-[#333] text-neutral-400 hover:text-white"
                    )}
                  >
                    <Ripple />
                    🌐 All Session Logs
                  </button>
                </div>

                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search sessions (email, IP, device...)"
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-sky-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              {sessionViewMode === 'audit' ? (
                /* AUDIT MODE: Grouped by User and Analyzing Account Sharing */
                <div className="bg-[#141414] border border-[#262626] rounded-[32px] overflow-hidden">
                  <div className="p-8 border-b border-[#262626] bg-[#1a1a1a]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                        Account Sharing & Access Audit
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        System automatically aggregates sessions per user to flag potential credential/account sharing behaviors.
                      </p>
                    </div>
                    <button
                      onClick={loadAdminData}
                      className="px-4 py-2 bg-[#222] border border-[#333] hover:border-sky-500/50 hover:bg-[#2a2a2a] rounded-xl text-xs text-white font-bold transition-all shrink-0"
                    >
                      Refresh Scan
                    </button>
                  </div>

                  {(() => {
                    // Group sessions by email
                    const userGroups: { [email: string]: {
                      email: string;
                      userId: string;
                      sessionsList: UserSession[];
                      uniqueDevices: Set<string>;
                      uniqueIPs: Set<string>;
                      uniqueLocations: Set<string>;
                    }} = {};

                    sessions.forEach(sess => {
                      const email = sess.email.toLowerCase();
                      if (!userGroups[email]) {
                        userGroups[email] = {
                          email: sess.email,
                          userId: sess.user_id,
                          sessionsList: [],
                          uniqueDevices: new Set(),
                          uniqueIPs: new Set(),
                          uniqueLocations: new Set()
                        };
                      }
                      userGroups[email].sessionsList.push(sess);
                      userGroups[email].uniqueDevices.add(sess.device);
                      userGroups[email].uniqueIPs.add(sess.ip_address);
                      userGroups[email].uniqueLocations.add(sess.location);
                    });

                    let auditData = Object.values(userGroups).map(group => {
                      const deviceCount = group.uniqueDevices.size;
                      const ipCount = group.uniqueIPs.size;
                      const locationCount = group.uniqueLocations.size;
                      
                      let status: 'safe' | 'warning' | 'critical' = 'safe';
                      let reason = '';
                      
                      if (deviceCount >= 3 || ipCount >= 3) {
                        status = 'critical';
                        reason = `🚨 High Risk: Connected from ${deviceCount} devices across ${locationCount} distinct locations. Highly likely account sharing.`;
                      } else if (deviceCount > 1 || ipCount > 1) {
                        status = 'warning';
                        reason = `⚠️ Moderate Risk: Connected from ${deviceCount} devices / ${ipCount} different IPs. Possible account sharing.`;
                      } else {
                        status = 'safe';
                        reason = '✓ Low Risk: Normal single-device usage pattern.';
                      }

                      return {
                        ...group,
                        deviceCount,
                        ipCount,
                        locationCount,
                        status,
                        reason
                      };
                    });

                    // Search filter
                    if (sessionSearch.trim() !== '') {
                      const s = sessionSearch.toLowerCase();
                      auditData = auditData.filter(item => 
                        item.email.toLowerCase().includes(s) || 
                        Array.from(item.uniqueDevices).some(d => d.toLowerCase().includes(s)) ||
                        Array.from(item.uniqueIPs).some(ip => ip.toLowerCase().includes(s)) ||
                        Array.from(item.uniqueLocations).some(loc => loc.toLowerCase().includes(s))
                      );
                    }

                    // Sort critical first, then warning, then safe
                    auditData.sort((a, b) => {
                      const score = { critical: 3, warning: 2, safe: 1 };
                      return score[b.status] - score[a.status];
                    });

                    if (auditData.length === 0) {
                      return (
                        <div className="p-20 text-center text-neutral-500 font-mono text-xs uppercase tracking-wider">
                          No audited users found matching filters.
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y divide-[#1f1f1f]">
                        {auditData.map((group) => (
                          <div key={group.email} className={cn(
                            "p-8 transition-all relative overflow-hidden",
                            group.status === 'critical' ? 'bg-rose-500/[0.02] hover:bg-rose-500/[0.03]' :
                            group.status === 'warning' ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.03]' :
                            'hover:bg-[#1a1a1a]/10'
                          )}>
                            {/* Visual Indicator strip */}
                            <div className={cn(
                              "absolute top-0 bottom-0 left-0 w-1",
                              group.status === 'critical' ? 'bg-rose-500' :
                              group.status === 'warning' ? 'bg-amber-500' :
                              'bg-emerald-500'
                            )} />

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-2">
                              {/* Left side: user email and threat level info */}
                              <div className="space-y-3 max-w-3xl">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-base font-black text-white">{group.email}</span>
                                  
                                  {group.status === 'critical' && (
                                    <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                      <ShieldAlert className="w-3 h-3" /> Critical Security Threat
                                    </span>
                                  )}
                                  {group.status === 'warning' && (
                                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Suspected Sharing
                                    </span>
                                  )}
                                  {group.status === 'safe' && (
                                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                                      Authorized Connection
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-neutral-400 font-medium">
                                  {group.reason}
                                </p>

                                {/* Mini specs metrics */}
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-neutral-500 font-mono text-[11px]">
                                  <span className="flex items-center gap-1.5 font-bold">
                                    <Smartphone className="w-3.5 h-3.5" />
                                    Unique Devices: <strong className={group.deviceCount > 1 ? "text-amber-400" : "text-white"}>{group.deviceCount}</strong>
                                  </span>
                                  <span className="flex items-center gap-1.5 font-bold">
                                    <Globe className="w-3.5 h-3.5" />
                                    Distinct Locations: <strong className={group.locationCount > 1 ? "text-amber-400" : "text-white"}>{group.locationCount}</strong>
                                  </span>
                                  <span className="flex items-center gap-1.5 font-bold">
                                    IP Footprints: <strong className={group.ipCount > 1 ? "text-amber-400" : "text-white"}>{group.ipCount}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Right side: administrative action buttons */}
                              <div className="flex items-center gap-3 shrink-0">
                                <button
                                  onClick={() => handleRevokeAllUserSessions(group.email)}
                                  className={cn(
                                    "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border relative overflow-hidden",
                                    group.status === 'critical' || group.status === 'warning'
                                      ? "bg-rose-500/10 hover:bg-rose-500/25 border-rose-500/30 text-rose-400"
                                      : "bg-[#222] hover:bg-[#2c2c2c] border-[#333] text-neutral-300"
                                  )}
                                >
                                  <Ripple />
                                  Terminate All ({group.sessionsList.length}) Devices
                                </button>
                              </div>
                            </div>

                            {/* Inner sessions list details */}
                            <div className="mt-5 bg-[#0d0d0d]/40 rounded-2xl border border-[#222] p-4 divide-y divide-[#1c1c1c]/50 pl-2">
                              <div className="pb-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">Active Terminals Details</div>
                              {group.sessionsList.map(sess => (
                                <div key={sess.id} className="py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-neutral-400 border border-[#333]">
                                      <Smartphone className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-neutral-300 font-mono">{sess.device}</span>
                                      <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                        <span>IP: {sess.ip_address}</span>
                                        <span>•</span>
                                        <span>Loc: {sess.location}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-neutral-500 font-mono">
                                      Active {new Date(sess.last_active).toLocaleTimeString()}
                                    </span>
                                    <button
                                      onClick={() => handleRevokeSession(sess.id)}
                                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                      title="Revoke and logout this specific device"
                                    >
                                      <Power className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ALL SESSIONS MODE: Flat list of active sessions */
                <div className="bg-[#141414] border border-[#262626] rounded-[32px] overflow-hidden">
                  <div className="p-8 border-b border-[#262626] bg-[#1a1a1a]/40 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">All Logged-in Session Connections</h3>
                      <p className="text-xs text-neutral-500 mt-1">Real-time terminal active connections currently synced.</p>
                    </div>
                    <div className="px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-mono text-sky-400">
                      {sessions.length} ACTIVE CLUSTERS
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#262626] bg-[#1a1a1a]/20 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                          <th className="px-8 py-5">User Account</th>
                          <th className="px-8 py-5">Device</th>
                          <th className="px-8 py-5">IP Address</th>
                          <th className="px-8 py-5">Registered Location</th>
                          <th className="px-8 py-5">Last Activity</th>
                          <th className="px-8 py-5 text-right">System Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f1f]">
                        {(() => {
                          let filteredSessions = [...sessions];
                          if (sessionSearch.trim() !== '') {
                            const s = sessionSearch.toLowerCase();
                            filteredSessions = filteredSessions.filter(sess => 
                              sess.email.toLowerCase().includes(s) ||
                              sess.device.toLowerCase().includes(s) ||
                              sess.ip_address.toLowerCase().includes(s) ||
                              sess.location.toLowerCase().includes(s)
                            );
                          }

                          if (filteredSessions.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-8 py-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-wider">
                                  No sessions found matching filters.
                                </td>
                              </tr>
                            );
                          }

                          return filteredSessions.map((sess) => (
                            <tr key={sess.id} className="hover:bg-[#1a1a1a]/30 transition-all text-sm group">
                              <td className="px-8 py-5 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-sky-500/5 border border-sky-500/10 flex items-center justify-center text-sky-500">
                                  <Smartphone className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-neutral-200">{sess.email}</span>
                              </td>
                              <td className="px-8 py-5 font-mono text-xs text-neutral-400">{sess.device}</td>
                              <td className="px-8 py-5 font-mono text-xs text-neutral-400">{sess.ip_address}</td>
                              <td className="px-8 py-5 text-neutral-300 font-bold">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-neutral-500" />
                                  {sess.location}
                                </div>
                              </td>
                              <td className="px-8 py-5 font-mono text-xs text-neutral-500">
                                {new Date(sess.last_active).toLocaleString()}
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button
                                  onClick={() => handleRevokeSession(sess.id)}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden"
                                >
                                  <Ripple />
                                  Terminate
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* TAB 3: CONTENT UPLOAD */}
        {activeTab === 'uploads' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Upload form */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={0.1}>
                <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-sky-500" />
                    Upload Video / PDF Resource
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-6">Enter Supabase URLs or Youtube identifiers directly to publish to Campus.</p>

                  <form onSubmit={handleResourceSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Resource Title</label>
                      <input 
                        type="text" 
                        value={resourceForm.title}
                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                        placeholder="e.g. VIP-1 Course: Lesson 13"
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Description</label>
                      <textarea 
                        value={resourceForm.description}
                        onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                        placeholder="Enter brief lecture description or attachment list..."
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-medium h-24 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Campus/Library Category</label>
                      <select 
                        value={resourceForm.category}
                        onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-bold"
                      >
                        <option value="2026 Future Mentorship">2026 Future Mentorship</option>
                        <option value="TTT">TTT (Basic & Premium)</option>
                        <option value="VIP-1 Courses">VIP-1 Courses</option>
                        <option value="VIP-2 Courses">VIP-2 Courses</option>
                        <option value="Day Trading Strategy">Day Trading Strategy</option>
                        <option value="Introduction about Crypto">Introduction about Crypto</option>
                        <option value="Fundamental">Fundamental</option>
                        <option value="Learn Thai">Learn Thai</option>
                        <option value="ICT Notes">ICT Notes</option>
                        <option value="PDF">PDF Educational Library</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Supabase Storage URL or YouTube Link</label>
                      <input 
                        type="text" 
                        value={resourceForm.url}
                        onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                        placeholder="e.g. https://xxx.supabase.co/storage/v1/object/public/pdf/xxx.pdf"
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-mono placeholder:text-neutral-600"
                      />
                      <span className="text-[10px] text-neutral-500 mt-1 block">For PDF storage uploads, use direct Supabase storage buckets URLs. For videos, use standard YouTube addresses.</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-black font-black uppercase tracking-widest rounded-xl text-xs transition-all relative overflow-hidden"
                    >
                      <Ripple />
                      Publish Resource
                    </button>
                  </form>
                </div>
              </ScrollReveal>
            </div>

            {/* List and deletes */}
            <div className="lg:col-span-7">
              <ScrollReveal delay={0.15}>
                <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Active Dynamic Resource Lists</h3>

                  {activeTabResources.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {activeTabResources.map((res) => (
                        <div key={res.id} className="p-4 bg-[#1b1b1b]/50 border border-[#252525] rounded-2xl flex items-center justify-between gap-4 group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center shrink-0 text-sky-500">
                              {res.category === 'PDF' ? <FileText className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{res.title}</h4>
                              <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{res.category}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleResourceDelete(res.id)}
                            className="p-2 text-neutral-500 hover:text-rose-500 rounded-lg hover:bg-rose-500/5 transition-all"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border border-dashed border-[#262626] rounded-2xl">
                      <UploadCloud className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                      <p className="text-sm font-bold text-neutral-400">No custom uploads yet</p>
                      <p className="text-xs text-neutral-600 mt-1">Upload files using the form to publish assets.</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}

        {/* TAB 4: Q&A BOARD */}
        {activeTab === 'qas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* QA form */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={0.1}>
                <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-sky-500" />
                    Post New Q&A Content
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-6">Write localized FAQ columns with translations for instantaneous updates.</p>

                  <form onSubmit={handleQaSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Question (English)</label>
                      <input 
                        type="text" 
                        value={qaForm.question_en}
                        onChange={(e) => setQaForm({ ...qaForm, question_en: e.target.value })}
                        placeholder="e.g. How do I move stop loss to breakeven?"
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Question (Burmese)</label>
                      <input 
                        type="text" 
                        value={qaForm.question_mm}
                        onChange={(e) => setQaForm({ ...qaForm, question_mm: e.target.value })}
                        placeholder="ဥပမာ - Move BE ဘယ်လို လုပ်ရမလဲ။"
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Answer (English)</label>
                      <textarea 
                        value={qaForm.answer_en}
                        onChange={(e) => setQaForm({ ...qaForm, answer_en: e.target.value })}
                        placeholder="Type answer details..."
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-medium h-20 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Answer (Burmese)</label>
                      <textarea 
                        value={qaForm.answer_mm}
                        onChange={(e) => setQaForm({ ...qaForm, answer_mm: e.target.value })}
                        placeholder="အဖြေရေးရန်..."
                        className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all font-medium h-20 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-black font-black uppercase tracking-widest rounded-xl text-xs transition-all relative overflow-hidden"
                    >
                      <Ripple />
                      Post FAQ
                    </button>
                  </form>
                </div>
              </ScrollReveal>
            </div>

            {/* QA deletes */}
            <div className="lg:col-span-7">
              <ScrollReveal delay={0.15}>
                <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Custom Posted Q&As</h3>

                  {qas.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {qas.map((item) => (
                        <div key={item.id} className="p-4 bg-[#1b1b1b]/50 border border-[#252525] rounded-2xl flex items-center justify-between gap-4 group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center shrink-0 text-sky-500">
                              <HelpCircle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{item.question_en}</h4>
                              <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{item.category_en}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleQaDelete(item.id)}
                            className="p-2 text-neutral-500 hover:text-rose-500 rounded-lg hover:bg-rose-500/5 transition-all"
                            title="Delete Q&A"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border border-dashed border-[#262626] rounded-2xl">
                      <HelpCircle className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                      <p className="text-sm font-bold text-neutral-400">No dynamic Q&As posted yet</p>
                      <p className="text-xs text-neutral-600 mt-1">Publish Q&As via the form to build a live FAQ section.</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}

        {/* TAB 5: DATABASE SQL SETUP */}
        {activeTab === 'database' && (
          <ScrollReveal delay={0.1}>
            <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-500" />
                  Supabase Database Auto-Setup (One-Click)
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  ဒါတွေအားလုံးကို manual လုပ်စရာမလိုဘဲ အောက်ပါအကွက်တွင် သင်၏ Supabase Database Connection String (URI) ကို ထည့်သွင်းပြီး <strong className="text-sky-400">"Deploy Tables Automatically"</strong> ခလုတ်ကို နှိပ်လိုက်ရုံဖြင့် Table များ၊ RLS (Row Level Security) များနှင့် Policy များအားလုံးကို အလိုအလျောက် ချိတ်ဆက်ဆောက်လုပ်ပေးသွားမည် ဖြစ်ပါသည်။
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Instead of manual setup, enter your Supabase Postgres Database Connection URI below to automatically initialize all required database structures in seconds.
                </p>
              </div>

              {/* Automatic Connection Setup Box */}
              <div className="p-6 bg-[#181818] border border-[#262626] rounded-2xl space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
                    Supabase Database Connection String (URI)
                  </label>
                  <input
                    type="password"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder="postgresql://postgres:[your-password]@db.xxxxxx.supabase.co:5432/postgres"
                    className="w-full px-4 py-3 bg-[#111] border border-[#2d2d2d] focus:border-sky-500 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none transition-all font-mono"
                  />
                  <p className="text-[10px] text-neutral-500">
                    * This connection string is securely sent to the server-side proxy solely to run the schema installation query and is never stored permanently.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleAutoSetupDB}
                    disabled={setupLoading}
                    className="px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/10"
                  >
                    {setupLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deploying Schema...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current text-amber-300" />
                        Deploy Tables Automatically
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => copyToClipboard(SQL_SCHEMA_CODE)}
                    className="px-4 py-3 bg-[#222] hover:bg-[#2a2a2a] border border-[#2d2d2d] hover:border-neutral-700 text-xs text-neutral-300 font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy SQL Script (Manual Backup)
                  </button>
                </div>
              </div>

              {/* Guide card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-5 bg-sky-500/[0.02] border border-sky-500/10 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    How to find Connection String on Supabase?
                  </h4>
                  <ol className="list-decimal list-inside text-xs text-neutral-400 space-y-1.5 leading-relaxed">
                    <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-sky-400 underline hover:text-sky-300">Supabase Dashboard</a>.</li>
                    <li>Select your project, then open <strong>Project Settings (Gear Icon)</strong>.</li>
                    <li>Navigate to the <strong>Database</strong> tab.</li>
                    <li>Scroll to <strong>Connection string</strong> section and select <strong>URI</strong> mode.</li>
                    <li>Copy the URL, replace <code className="text-sky-300 bg-sky-950/40 px-1 py-0.5 rounded font-mono">[YOUR-PASSWORD]</code> with your database password, and paste it here!</li>
                  </ol>
                </div>

                <div className="p-5 bg-amber-500/[0.02] border border-amber-500/10 rounded-2xl flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-neutral-400 leading-relaxed space-y-1">
                    <p className="font-bold text-amber-400">Zero-Disruption Architecture Mode</p>
                    <p>Our systems operate on an automated dual-vault design. If the required tables do not exist in your database or you do not set up the database yet, the app continues to operate flawlessly using robust offline <strong>localStorage caches</strong> to preserve user sessions, Q&As, resources, and notification states.</p>
                  </div>
                </div>
              </div>

              {/* Collapsible Manual SQL View */}
              <div className="border border-[#262626] rounded-2xl overflow-hidden">
                <details className="group">
                  <summary className="p-4 bg-[#181818] cursor-pointer hover:bg-[#1c1c1c] flex items-center justify-between text-xs font-bold text-neutral-400 transition-colors">
                    <span>Show SQL Commands Preview (Advanced)</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="p-4 border-t border-[#262626] bg-black">
                    <pre className="p-4 overflow-x-auto text-[10px] font-mono text-sky-500/70 leading-relaxed max-h-[300px]">
                      {SQL_SCHEMA_CODE}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
