import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useAccount } from '../lib/AccountContext';
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
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, selectedAccountId, selectedAccount, loading: accountsLoading } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (selectedAccountId) {
          setTrades([]);
          setDailyPnls([]);
          setLoading(true);
          setError(null);
          await fetchDashboardData();
        } else if (!accountsLoading) {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    loadData();
  }, [selectedAccountId, accountsLoading, accounts.length]);

  const fetchDashboardData = async () => {
    if (!selectedAccountId) return;
    
    try {
      const [tradesRes, dailyPnlsRes] = await Promise.all([
        supabase.from('trades').select('*').eq('account_id', selectedAccountId).order('entry_date', { ascending: true }),
        supabase.from('daily_pnl').select('*').eq('account_id', selectedAccountId)
      ]);

      if (tradesRes.error) throw tradesRes.error;
      if (dailyPnlsRes.error) throw dailyPnlsRes.error;

      if (tradesRes.data) setTrades(tradesRes.data);
      if (dailyPnlsRes.data) setDailyPnls(dailyPnlsRes.data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stats = React.useMemo(() => {
    if (!selectedAccount) return null;
    
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const totalPnl = closedTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const currentBalance = selectedAccount.initial_balance + totalPnl;
    
    const winRate = closedTrades.length > 0 
      ? (closedTrades.filter(t => (Number(t.pnl) || 0) > 0).length / closedTrades.length) * 100 
      : 0;
    
    const grossProfit = closedTrades.filter(t => (Number(t.pnl) || 0) > 0).reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const grossLoss = Math.abs(closedTrades.filter(t => (Number(t.pnl) || 0) < 0).reduce((acc, t) => acc + (Number(t.pnl) || 0), 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 9.99 : 0) : Math.min(9.99, grossProfit / grossLoss);

    // Avg Win/Loss Ratio
    const wins = closedTrades.filter(t => (Number(t.pnl) || 0) > 0);
    const losses = closedTrades.filter(t => (Number(t.pnl) || 0) < 0);
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const winLossRatio = avgLoss === 0 ? (avgWin > 0 ? 9.99 : 0) : Math.min(9.99, avgWin / avgLoss);

    // Edge Score Data
    const edgeData = [
      { subject: 'Win %', A: winRate, fullMark: 100 },
      { subject: 'Profit Factor', A: Math.min(100, (profitFactor / 3) * 100), fullMark: 100 },
      { subject: 'Avg win/loss', A: Math.min(100, (winLossRatio / 3) * 100), fullMark: 100 },
    ];
    const edgeScore = (winRate * 0.4) + (Math.min(100, (profitFactor / 2) * 100) * 0.3) + (Math.min(100, (winLossRatio / 2) * 100) * 0.3);

    // Propfirm Consistency
    const consistencyPercent = (parseFloat(selectedAccount.consistency_rules) || 50) / 100;
    const profitTarget = selectedAccount.profit_target || (selectedAccount.initial_balance * 0.1);
    const maxDayProfit = Math.max(...dailyPnls.map(p => p.pnl), 0);
    
    // Consistency rule: No single day profit > consistency % of profit target
    const currentConsistencyRatio = profitTarget > 0 ? (maxDayProfit / profitTarget) : 0;
    const isConsistent = currentConsistencyRatio <= consistencyPercent;

    // Profit Target
    const targetProgress = Math.min(100, Math.max(0, (totalPnl / profitTarget) * 100));
    const amountLeft = Math.max(0, profitTarget - totalPnl);

    // Trailing Drawdown
    let peakBalance = selectedAccount.initial_balance;
    let runningBal = selectedAccount.initial_balance;
    trades.forEach(t => {
      runningBal += (t.pnl || 0);
      if (runningBal > peakBalance) peakBalance = runningBal;
    });
    
    const maxAllowedDrawdown = selectedAccount.max_drawdown || selectedAccount.initial_balance * 0.05;
    const drawdownFloor = peakBalance - maxAllowedDrawdown;
    const distanceToFloor = Math.max(0, currentBalance - drawdownFloor);
    const drawdownPercent = ((peakBalance - currentBalance) / maxAllowedDrawdown) * 100;

    return { 
      totalPnl, 
      winRate, 
      profitFactor,
      edgeScore,
      edgeData,
      isConsistent,
      targetProgress,
      amountLeft,
      profitTarget,
      trailingDrawdown: peakBalance - currentBalance,
      drawdownFloor,
      distanceToFloor,
      maxAllowedDrawdown,
      drawdownPercent,
      initialBalance: selectedAccount.initial_balance,
      currentBalance,
      consistencyPercent,
      currentConsistencyRatio
    };
  }, [trades, selectedAccount, dailyPnls]);

  const chartData = React.useMemo(() => {
    if (!selectedAccount) return [];
    let currentBalance = selectedAccount.initial_balance;
    const data = [{
      date: 'Start',
      balance: currentBalance
    }];
    
    trades
      .filter(t => t.status === 'CLOSED')
      .forEach(t => {
        currentBalance += (Number(t.pnl) || 0);
        data.push({
          date: format(new Date(t.exit_date || t.entry_date), 'MMM dd'),
          balance: currentBalance
        });
      });
    return data;
  }, [trades, selectedAccount]);

  const calendarDays = React.useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return eachDayOfInterval({ start, end });
  }, []);

  const getDayPnL = (date: Date) => {
    return dailyPnls.find(p => isSameDay(new Date(p.date), date))?.pnl || 0;
  };

  if (loading || accountsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-medium animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">Error Loading Data</h2>
          <p className="text-neutral-500">{error}</p>
        </div>
        <button 
          onClick={() => fetchDashboardData()}
          className="px-6 py-3 bg-[#141414] border border-[#262626] text-white font-bold rounded-xl hover:bg-[#1f1f1f] transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (accounts.length > 0 && !selectedAccountId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-sky-500/10 border border-sky-500/20 rounded-3xl flex items-center justify-center">
          <Wallet className="w-10 h-10 text-sky-500" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">Select an Account</h2>
          <p className="text-neutral-500">Please select a trading account from the dropdown in the navbar to view your performance metrics.</p>
        </div>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-neutral-500 mt-2 font-medium">Performance analytics for your selected account.</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Current Balance" 
          value={formatCurrency(stats?.currentBalance || 0)} 
          subtitle={`Initial: ${formatCurrency(stats?.initialBalance || 0)}`}
          icon={Wallet}
          color="text-sky-400"
        />
        <MetricCard 
          title="Total PnL" 
          value={formatCurrency(stats?.totalPnl || 0)} 
          icon={BarChart3}
          trend={stats?.totalPnl >= 0 ? 'up' : 'down'}
          color={stats?.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <MetricCard 
          title="Win Rate" 
          value={formatPercent(stats?.winRate || 0)} 
          icon={Zap}
          color="text-amber-400"
        />
        <MetricCard 
          title="Profit Factor" 
          value={(stats?.profitFactor || 0).toFixed(2)} 
          icon={ShieldCheck}
          color="text-indigo-400"
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
                  dataKey="balance" 
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
          {/* Advanced Metrics & Edge Score */}
          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edge Score</h3>
              <div className="px-3 py-1 bg-sky-500/10 rounded-lg">
                <span className="text-sm font-black text-sky-400">{(stats?.edgeScore || 0).toFixed(0)}</span>
              </div>
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats?.edgeData}>
                  <PolarGrid stroke="#262626" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 10, fontWeight: 700 }} />
                  <Radar
                    name="Edge"
                    dataKey="A"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-6 pt-4 border-t border-[#262626]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  <span className="text-sm font-bold text-neutral-400">Consistency</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-white">{formatPercent((stats?.currentConsistencyRatio || 0) * 100)}</span>
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                    stats?.isConsistent ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {stats?.isConsistent ? 'Compliant' : 'Violated'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Target Profit</p>
                    <p className="text-xl font-black text-white">{formatCurrency(stats?.amountLeft || 0)} Left</p>
                  </div>
                  <span className="text-xs font-bold text-sky-500">{stats?.targetProgress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#262626]">
                  <div 
                    className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all duration-1000" 
                    style={{ width: `${stats?.targetProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>Target {formatCurrency((stats?.initialBalance || 0) + (stats?.profitTarget || 0))}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Drawdown Usage</p>
                    <p className={cn("text-xl font-black", stats?.drawdownPercent > 80 ? "text-red-500" : "text-white")}>
                      {formatCurrency(stats?.distanceToFloor || 0)} Safe
                    </p>
                  </div>
                  <span className={cn("text-xs font-bold", stats?.drawdownPercent > 80 ? "text-red-500" : "text-neutral-500")}>
                    {stats?.drawdownPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#262626]">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      stats?.drawdownPercent > 80 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-neutral-500"
                    )}
                    style={{ width: `${Math.min(100, stats?.drawdownPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                  <span>Risk Level</span>
                  <span>Floor {formatCurrency(stats?.drawdownFloor || 0)}</span>
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
  // Map colors to background classes for the icon container
  const bgColors: Record<string, string> = {
    'text-sky-400': 'bg-sky-500/10',
    'text-emerald-400': 'bg-emerald-500/10',
    'text-rose-400': 'bg-rose-500/10',
    'text-amber-400': 'bg-amber-500/10',
    'text-indigo-400': 'bg-indigo-500/10',
    'text-neutral-200': 'bg-neutral-500/10'
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 transition-all duration-300 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/5 group">
      <div className="flex items-center justify-between mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", 
          bgColors[color] || 'bg-sky-500/10'
        )}>
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
