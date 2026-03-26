import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Account', href: '/accounts', icon: Wallet },
    { name: 'Journal', href: '/journal', icon: Book },
    { name: 'Strategy', href: '/strategy', icon: Brain },
    { name: 'AI Summary', href: '/ai-summary', icon: Sparkles },
    { name: 'Learning', href: '/learning', icon: GraduationCap },
    { name: 'Fundamental', href: '/fundamental', icon: Search },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex font-sans selection:bg-sky-500/30">
      {/* Icon-Only Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 bg-[#141414] border-r border-[#262626] flex flex-col items-center py-8 z-50">
        <div className="mb-12">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <TrendingUp className="text-black w-7 h-7" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <div key={item.name} className="relative group">
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
                
                {/* Tooltip */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1f1f1f] border border-[#262626] rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-xl">
                  {item.name}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-6 items-center">
          <div className="relative group">
            <button
              onClick={handleSignOut}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300"
            >
              <LogOut className="w-6 h-6" />
            </button>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1f1f1f] border border-[#262626] rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-xl">
              Sign Out
            </div>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#333] flex items-center justify-center text-xs font-bold text-sky-400 cursor-pointer hover:border-sky-500/50 transition-all">
            {user?.email?.[0].toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
