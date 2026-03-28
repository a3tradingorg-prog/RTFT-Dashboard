import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useAccount } from '../lib/AccountContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Book, 
  Sparkles, 
  GraduationCap, 
  Brain,
  Search, 
  User,
  LogOut,
  TrendingUp,
  Megaphone,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId, selectedAccount } = useAccount();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Account', href: '/accounts', icon: Wallet },
    { name: 'Journal', href: '/journal', icon: Book },
    { name: 'Strategy', href: '/strategy', icon: Brain },
    { name: 'AI Summary', href: '/ai-summary', icon: Sparkles },
    { name: 'Campus', href: '/campus', icon: GraduationCap },
    { name: 'News', href: '/news', icon: Megaphone },
    { name: 'Profile', href: '/profile', icon: User },
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
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden",
            isActive 
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_20px_rgba(14,165,233,0.1)]" 
              : "text-neutral-500 hover:text-neutral-200 hover:bg-[#1f1f1f]"
          )}
        >
          <item.icon className="w-6 h-6 relative z-10" />
          {isActive && (
            <motion.div 
              layoutId="active-pill"
              className="absolute left-0 w-1 h-6 bg-sky-500 rounded-r-full"
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
      {/* Icon-Only Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 bg-[#141414] border-r border-[#262626] flex flex-col items-center z-50">
        <div className="py-8 shrink-0">
          <Link to="/" className="block group transition-transform hover:scale-105 active:scale-95">
            <div className="w-12 h-12 bg-[#1f1f1f] rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-[#262626] group-hover:border-sky-500/50 transition-colors">
              <img 
                src={logoUrl} 
                alt="RTFT Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as any).src = 'https://picsum.photos/seed/trading/200/200';
                }}
              />
            </div>
          </Link>
        </div>

        <nav className="flex-1 w-full flex flex-col items-center gap-6 overflow-y-auto overflow-x-visible py-4 scrollbar-hide">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} isActive={location.pathname === item.href} />
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 min-h-screen">
        {/* Top Navbar */}
        <header className="h-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#262626] sticky top-0 z-40 px-8 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4 shrink-0">
            <div className="md:hidden w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-black w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white hidden md:block">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>


          <div className="flex items-center gap-6 shrink-0">
            {/* Global Account Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-[#141414] border border-[#262626] rounded-xl hover:border-sky-500/50 transition-all min-w-[180px] group"
              >
                <Wallet className="w-4 h-4 text-sky-500" />
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[100px]">{selectedAccount?.name || 'Select Account'}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform duration-300", isAccountDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isAccountDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-full bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-[100] overflow-hidden"
                  >
                    {accounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setIsAccountDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-[#1f1f1f] transition-all flex items-center justify-between",
                          selectedAccountId === account.id && "bg-sky-500/5 text-sky-400"
                        )}
                      >
                        <span className="text-xs font-bold">{account.name}</span>
                        {selectedAccountId === account.id && <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />}
                      </button>
                    ))}
                    <Link 
                      to="/accounts"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="w-full px-4 py-3 text-left hover:bg-[#1f1f1f] transition-all flex items-center gap-2 text-sky-500 font-bold border-t border-[#262626] text-xs"
                    >
                      Manage Accounts
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto p-8 md:p-12">
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
      </main>
    </div>
  );
}
