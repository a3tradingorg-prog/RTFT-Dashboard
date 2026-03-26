import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { TradingAccount, Trade, DailyPnL } from '../types';
import { 
  Wallet,
  DollarSign, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Target,
  ChevronDown,
  AlertCircle,
  Plus,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user?.id);

    if (!error && data) {
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchDashboardData();
    }
  }, [selectedAccountId]);

  const fetchDashboardData = async () => {
    const [tradesRes, dailyPnlsRes] = await Promise.all([
      supabase.from('trades').select('*').eq('account_id', selectedAccountId).order('entry_date', { ascending: true }),
      supabase.from('daily_pnl').select('*').eq('account_id', selectedAccountId)
    ]);

    if (tradesRes.data) setTrades(tradesRes.data);
    if (dailyPnlsRes.data) setDailyPnls(dailyPnlsRes.data);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const stats = React.useMemo(() => {
    if (!selectedAccount) return null;
    
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const totalPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const winRate = closedTrades.length > 0 
      ? (closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) * 100 
      : 0;
    
    const grossProfit = closedTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

    // Edge Score
    const edgeScore = Math.min(100, Math.max(0, (winRate * 0.6) + (profitFactor * 10)));

    // Propfirm Consistency (No single day > consistency rules % of total profit)
    const consistencyPercent = parseFloat(selectedAccount.consistency_rules) / 100 || 0.5;
    const maxDayProfit = Math.max(...dailyPnls.map(p => p.pnl), 0);
    const isConsistent = totalPnl > 0 ? (maxDayProfit / totalPnl) <= consistencyPercent : true;

    // Profit Target
    const profitTarget = selectedAccount.profit_target || selectedAccount.initial_balance * 0.1;
    const targetProgress = Math.min(100, Math.max(0, (totalPnl / profitTarget) * 100));

    // Trailing Drawdown (Simple version: peak balance - current balance)
    let peakBalance = selectedAccount.initial_balance;
    let currentBal = selectedAccount.initial_balance;
    trades.forEach(t => {
      currentBal += t.pnl;
      if (currentBal > peakBalance) peakBalance = currentBal;
    });
    const trailingDrawdown = peakBalance - selectedAccount.current_balance;
    const maxAllowedDrawdown = selectedAccount.max_drawdown || selectedAccount.initial_balance * 0.05;
    const drawdownPercent = (trailingDrawdown / maxAllowedDrawdown) * 100;

    return { 
      totalPnl, 
      winRate, 
      profitFactor,
      edgeScore,
      isConsistent,
      targetProgress,
      trailingDrawdown,
      maxAllowedDrawdown,
      drawdownPercent,
      initialBalance: selectedAccount.initial_balance,
      currentBalance: selectedAccount.current_balance,
      consistencyPercent
    };
  }, [trades, selectedAccount, dailyPnls]);

  const chartData = React.useMemo(() => {
    let cumulativePnl = 0;
    return trades
      .filter(t => t.status === 'CLOSED')
      .map(t => {
        cumulativePnl += (t.pnl || 0);
        return {
          date: format(new Date(t.exit_date || t.entry_date), 'MMM dd'),
          pnl: cumulativePnl
        };
      });
  }, [trades]);

  const calendarDays = React.useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return eachDayOfInterval({ start, end });
  }, []);

  const getDayPnL = (date: Date) => {
    return dailyPnls.find(p => isSameDay(new Date(p.date), date))?.pnl || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-[#141414] border border-[#262626] rounded-3xl flex items-center justify-center shadow-2xl">
          <Wallet className="w-10 h-10 text-neutral-600" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">No Trading Accounts</h2>
          <p className="text-neutral-500">You haven't created any trading accounts yet. Create your first account to start tracking your performance.</p>
        </div>
        <Link 
          to="/accounts" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-sky-500 text-black font-bold rounded-2xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-5 h-5" />
          Create First Account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header with Account Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-neutral-500 mt-2 font-medium">Performance analytics for your selected account.</p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className="flex items-center gap-4 px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl hover:border-sky-500/50 transition-all min-w-[240px] group"
          >
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-sky-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active Account</p>
              <p className="text-sm font-bold text-white">{selectedAccount?.name}</p>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-neutral-500 transition-transform duration-300", isAccountDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isAccountDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-full bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl z-[100] overflow-hidden"
              >
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccountId(account.id);
                      setIsAccountDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-6 py-4 text-left hover:bg-[#1f1f1f] transition-all flex items-center justify-between",
                      selectedAccountId === account.id && "bg-sky-500/5 text-sky-400"
                    )}
                  >
                    <span className="font-bold">{account.name}</span>
                    {selectedAccountId === account.id && <div className="w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" />}
                  </button>
                ))}
                <Link 
                  to="/accounts"
                  className="w-full px-6 py-4 text-left hover:bg-[#1f1f1f] transition-all flex items-center gap-2 text-sky-500 font-bold border-t border-[#262626]"
                >
                  <Plus className="w-4 h-4" />
                  Add New Account
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Current Balance" 
          value={formatCurrency(stats?.currentBalance || 0)} 
          subtitle={`Initial: ${formatCurrency(stats?.initialBalance || 0)}`}
          icon={DollarSign}
          color="text-sky-400"
        />
        <MetricCard 
          title="Total PnL" 
          value={formatCurrency(stats?.totalPnl || 0)} 
          icon={TrendingUp}
          trend={stats?.totalPnl >= 0 ? 'up' : 'down'}
          color={stats?.totalPnl >= 0 ? 'text-sky-400' : 'text-neutral-200'}
        />
        <MetricCard 
          title="Win Rate" 
          value={formatPercent(stats?.winRate || 0)} 
          icon={Target}
          color="text-sky-400"
        />
        <MetricCard 
          title="Profit Factor" 
          value={(stats?.profitFactor || 0).toFixed(2)} 
          icon={Activity}
          color="text-sky-400"
        />
      </div>

      {/* Secondary Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#141414] border border-[#262626] rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Equity Curve</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sky-500 rounded-full" />
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Growth</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#525252" 
                  fontSize={11} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={11} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #262626', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: 700 }}
                  labelStyle={{ color: '#737373', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#0ea5e9" 
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                  strokeWidth={3}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          {/* Advanced Metrics */}
          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white">Advanced Analysis</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-sky-400" />
                  <span className="text-sm font-bold text-neutral-400">Edge Score</span>
                </div>
                <span className="text-xl font-black text-sky-400">{(stats?.edgeScore || 0).toFixed(0)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  <span className="text-sm font-bold text-neutral-400">Consistency</span>
                </div>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                  stats?.isConsistent ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {stats?.isConsistent ? 'Compliant' : 'Violated'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  <span>Profit Target</span>
                  <span>{stats?.targetProgress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#262626]">
                  <div 
                    className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all duration-1000" 
                    style={{ width: `${stats?.targetProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  <span>Drawdown Usage</span>
                  <span className={cn(stats?.drawdownPercent > 80 ? "text-red-500" : "text-neutral-500")}>{stats?.drawdownPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#262626]">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      stats?.drawdownPercent > 80 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-neutral-500"
                    )}
                    style={{ width: `${Math.min(100, stats?.drawdownPercent)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#262626]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Trailing Drawdown</span>
                  <span className="text-sm font-bold text-neutral-200">-{formatCurrency(stats?.trailingDrawdown || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Performance Calendar</h3>
              <Link to="/journal" className="text-xs font-bold text-sky-500 hover:text-sky-400 uppercase tracking-widest">View Full</Link>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.slice(0, 28).map((day, i) => {
                const pnl = getDayPnL(day);
                const isTodayDate = isSameDay(day, new Date());
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all cursor-pointer hover:scale-110",
                      isTodayDate ? "border-2 border-sky-500" : "border border-[#262626]",
                      pnl > 0 ? "bg-sky-500/10 text-sky-400" : pnl < 0 ? "bg-red-500/10 text-red-400" : "bg-[#0a0a0a] text-neutral-600"
                    )}
                    title={pnl !== 0 ? formatCurrency(pnl) : 'No trades'}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 transition-all duration-300 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/5 group">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("w-12 h-12 rounded-2xl bg-opacity-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110", color.replace('text', 'bg'))}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
            trend === 'up' ? "bg-sky-500/10 text-sky-400" : "bg-neutral-500/10 text-neutral-400"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {trend === 'up' ? 'Growth' : 'Drawdown'}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className={cn("text-3xl font-black tracking-tighter", color)}>{value}</p>
      {subtitle && <p className="text-[10px] font-bold text-neutral-600 mt-2">{subtitle}</p>}
    </div>
  );
}
