import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useAccount } from '../lib/AccountContext';
import { supabase, wakeUpSupabase } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Wallet, 
  Book, 
  Sparkles, 
  GraduationCap, 
  Brain,
  HelpCircle,
  Search, 
  User,
  LogOut,
  TrendingUp,
  Megaphone,
  ChevronRight,
  ChevronDown,
  Menu,
  X as CloseIcon,
  ArrowUp,
  Database,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Ripple } from './Ripple';
import { motion, AnimatePresence } from 'motion/react';
import { useClickOutside } from '../hooks/useClickOutside';
import NotificationCenter from './NotificationCenter';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId, selectedAccount, refreshAccounts } = useAccount();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const accountDropdownRef = useClickOutside(() => setIsAccountDropdownOpen(false));
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [dbStatus, setDbStatus] = useState<'checking' | 'active' | 'sleeping' | 'error'>('checking');

  // Supabase Keep-Alive and Wake Up logic with silent background auto-retries
  useEffect(() => {
    let active = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const performPing = async (isInitial = false) => {
      if (isInitial) setDbStatus('checking');
      try {
        const result = await wakeUpSupabase();
        if (!active) return;
        if (result.success) {
          setDbStatus('active');
          if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
          }
        } else {
          setDbStatus('sleeping');
          if (isInitial && active) {
            console.log('Database sleeping, scheduling background auto-wakeup...');
            retryTimeout = setTimeout(() => performPing(false), 15000); // silent auto-retry in 15s
          }
        }
      } catch (err) {
        if (!active) return;
        setDbStatus('error');
        if (isInitial && active) {
          console.log('Database connection error, scheduling background auto-retry...');
          retryTimeout = setTimeout(() => performPing(false), 20000); // silent auto-retry in 20s
        }
      }
    };

    // Initial ping on load
    performPing(true);

    // Keep-alive interval: pings every 4 minutes to prevent Supabase sleeping
    const interval = setInterval(() => {
      performPing(false);
    }, 240000);

    return () => {
      active = false;
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger fresh fetch when database is confirmed active
  useEffect(() => {
    if (dbStatus === 'active' && user) {
      if (accounts.length === 0) {
        console.log('Database active and no accounts loaded yet: fetching profile and accounts...');
        fetchProfile().catch(err => console.error('Layout profile fetch on active DB error:', err));
        refreshAccounts().catch(err => console.error('Layout accounts fetch on active DB error:', err));
      }
    }
  }, [dbStatus, user, accounts.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Dynamically set favicon and title
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    const logoUrl = supabaseUrl 
      ? `${supabaseUrl}/storage/v1/object/public/brand-assets/logo.jpg`
      : 'https://picsum.photos/seed/trading/32/32';
    
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = logoUrl;
    link.type = 'image/jpeg';
    
    document.title = "RTFT";
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile().catch(err => console.error('Initial layout profile fetch error:', err));

      const subscription = supabase
        .channel(`layout_profile_realtime_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, () => {
          fetchProfile().catch(err => console.warn('Realtime layout profile fetch warning:', err));
        })
        .subscribe();

      return () => {
        try {
          const p = subscription.unsubscribe();
          if (p && typeof p.catch === 'function') {
            p.catch((err: any) => console.warn('Unsubscribe warning:', err));
          }
        } catch (e) {
          console.warn('Unsubscribe throw warning:', e);
        }
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
      setProfile(data || { id: user.id, username: user.email?.split('@')[0] || 'User', role: 'user' });
    } catch (error) {
      console.warn('Optional profile fetch in layout completed with warning, using fallback profile:', error);
      setProfile({ id: user.id, username: user.email?.split('@')[0] || 'User', role: 'user' });
    }
  };

  const hideAccountSelector = ['/campus', '/qa', '/profile', '/admin'].includes(location.pathname);

  const ADMIN_EMAILS = ['htetaungkyawhak2@gmail.com', 'example@gmail.com', 'a3tradingorg@gmail.com'];
  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const navigation = [
    { name: 'DASHBOARD', href: '/', icon: LayoutDashboard },
    { name: 'Account', href: '/accounts', icon: Wallet },
    { name: 'Journal', href: '/journal', icon: Book },
    { name: 'Strategy', href: '/strategy', icon: Brain },
    { name: 'AI Summary', href: '/ai-summary', icon: Sparkles },
    { name: 'Campus', href: '/campus', icon: GraduationCap },
    { name: 'Q&A', href: '/qa', icon: HelpCircle },
    { name: 'Profile', href: '/profile', icon: User },
    ...(isAdmin ? [{ name: 'Admin Panel', href: '/admin', icon: ShieldCheck }] : []),
  ];

  const logoUrl = (import.meta as any).env.VITE_SUPABASE_URL 
    ? `${(import.meta as any).env.VITE_SUPABASE_URL}/storage/v1/object/public/brand-assets/logo.jpg`
    : 'https://picsum.photos/seed/trading/200/200';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const NavItem = ({ item, isActive }: { item: typeof navigation[0], isActive: boolean }) => {
    const [tooltipPos, setTooltipPos] = React.useState<{ top: number; left: number } | null>(null);
    const itemRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        setTooltipPos({
          top: rect.top + rect.height / 2,
          left: rect.right + 12
        });
      }
    };

    return (
      <div 
        ref={itemRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipPos(null)}
        className="relative group shrink-0"
      >
        <Link
          to={item.href}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden",
            isActive 
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_20px_rgba(14,165,233,0.1)]" 
              : "text-neutral-500 hover:text-neutral-200 hover:bg-[#1f1f1f]"
          )}
        >
          <Ripple />
          <item.icon className="w-4 h-4 relative z-10 pointer-events-none" />
          {isActive && (
            <motion.div 
              layoutId="active-pill"
              className="absolute left-0 w-0.5 h-4 bg-sky-500 rounded-r-full"
            />
          )}
        </Link>
        
        {/* Tooltip - Using fixed positioning to avoid overflow clipping */}
        <AnimatePresence>
          {tooltipPos && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{ 
                position: 'fixed',
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: 'translateY(-50%)'
              }}
              className="px-3 py-1.5 bg-[#1f1f1f] border border-[#262626] rounded-lg text-xs font-bold text-white whitespace-nowrap z-[100] shadow-xl pointer-events-none"
            >
              {item.name}
              {/* Tooltip Arrow */}
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1f1f1f] border-l border-b border-[#262626] rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex font-sans selection:bg-sky-500/30">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-14 bg-[#141414] border-r border-[#262626] hidden md:flex flex-col items-center z-50">
        <div className="py-4 shrink-0">
          <Link to="/" className="block group transition-transform hover:scale-105 active:scale-95">
            <div className="w-9 h-9 bg-[#1f1f1f] rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-[#262626] group-hover:border-sky-500/50 transition-colors">
              <img 
                src={logoUrl} 
                alt="RTFT Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as any).src = 'https://picsum.photos/seed/trading/200/200';
                }}
              />
            </div>
          </Link>
        </div>

        <nav className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto overflow-x-visible py-2 scrollbar-hide">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} isActive={location.pathname === item.href} />
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#141414] border-r border-[#262626] z-[70] md:hidden flex flex-col"
            >
              <div className="p-6 border-b border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1f1f1f] rounded-lg flex items-center justify-center overflow-hidden border border-[#262626]">
                    <img 
                      src={logoUrl} 
                      alt="RTFT Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).src = 'https://picsum.photos/seed/trading/200/200';
                      }}
                    />
                  </div>
                  <span className="font-bold text-white tracking-tight">RTFT</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                        isActive 
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                          : "text-neutral-500 hover:text-neutral-200 hover:bg-[#1f1f1f]"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[#262626]">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/5 transition-all font-medium text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-14 min-h-screen">
        {/* Top Navbar */}
        <header className="h-14 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#262626] sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-white hidden sm:block uppercase tracking-widest italic">
              {navigation.find(item => item.href === location.pathname)?.name || 'RTFT'}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Global Account Selector */}
            {!hideAccountSelector && (
              <div className="relative" ref={accountDropdownRef}>
                <button 
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141414] border border-[#262626] rounded-xl hover:border-sky-500/50 transition-all min-w-[120px] md:min-w-[160px] group"
                >
                  <Wallet className="w-3.5 h-3.5 text-sky-500" />
                  <div className="flex-1 text-left">
                    <p className="text-[10px] md:text-[11px] font-bold text-white truncate max-w-[70px] md:max-w-[90px]">{selectedAccount?.name || 'Select Account'}</p>
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-neutral-500 transition-transform duration-300", isAccountDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isAccountDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-full bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-[100] overflow-hidden"
                    >
                      <div className="max-h-[300px] overflow-y-auto">
                        {accounts.map(account => (
                          <button
                            key={account.id}
                            onClick={() => {
                              setSelectedAccountId(account.id);
                              setIsAccountDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left hover:bg-[#1f1f1f] transition-all flex items-center justify-between gap-3",
                              selectedAccountId === account.id && "bg-sky-500/5 text-sky-400"
                            )}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-bold truncate">{account.name}</span>
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-tighter",
                                account.account_type === 'Passed' ? "text-emerald-500" : 
                                account.account_type === 'Fail/Breached' ? "text-rose-500" : "text-sky-500"
                              )}>
                                {account.account_type || 'Challenge'}
                              </span>
                            </div>
                            {selectedAccountId === account.id && <div className="w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />}
                          </button>
                        ))}
                      </div>
                      <Link 
                        to="/accounts"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="w-full px-4 py-2.5 text-left hover:bg-[#1f1f1f] transition-all flex items-center gap-2 text-sky-500 font-bold border-t border-[#262626] text-[10px]"
                      >
                        Manage Accounts
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notification Center */}
            <NotificationCenter />

            {/* Profile Icon */}
            <div className="relative p-[1px] rounded-full overflow-hidden group">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#3b82f6,#8b5cf6,#ec4899,#f97316,#eab308,#22c55e,#3b82f6)] opacity-70 group-hover:opacity-100 transition-opacity" 
              />
              <Link 
                to="/profile"
                className={cn(
                  "relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[#0a0a0a] overflow-hidden",
                  location.pathname === '/profile'
                    ? "text-sky-400"
                    : "text-neutral-400"
                )}
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}

        <div className="w-full p-2 sm:p-4 md:p-8 lg:p-12 min-h-[calc(100vh-80px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="w-full px-6 py-12 border-t border-[#262626] bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              © 2026 RTFT Ownership
            </p>
            <p className="text-[10px] text-neutral-600 font-medium text-center">
              All rights reserved. Professional Trading Analytics & Education.
            </p>
          </div>
        </footer>

        {/* Scroll To Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 p-3 rounded-xl bg-sky-500 text-white shadow-[0_10px_20px_rgba(14,165,233,0.3)] hover:bg-sky-400 transition-colors group"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
