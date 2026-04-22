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
  Zap,
  GraduationCap,
  User
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
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from '../components/ScrollReveal';

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, selectedAccountId, selectedAccount, loading: accountsLoading } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (accId: string) => {
    if (!accId) return;
    
    try {
      // Use specific columns to reduce data transfer size
      const [tradesRes, dailyPnlsRes] = await Promise.all([
        supabase
          .from('trades')
          .select('id, pnl, status, exit_date, entry_date, asset, type, contract_size, entry_price, exit_price, take_profit, stop_loss')
          .eq('account_id', accId)
          .order('entry_date', { ascending: true }),
        supabase
          .from('daily_pnl')
          .select('id, date, pnl')
          .eq('account_id', accId)
      ]);

      if (tradesRes.error) throw tradesRes.error;
      if (dailyPnlsRes.error) throw dailyPnlsRes.error;

      if (tradesRes.data) {
        setTrades(tradesRes.data as Trade[]);
      }
      if (dailyPnlsRes.data) {
        setDailyPnls(dailyPnlsRes.data as DailyPnL[]);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      if (!selectedAccountId) {
        if (!accountsLoading) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await fetchDashboardData(selectedAccountId);
      } catch (err: any) {
        if (isActive) setError(err.message || 'Failed to load dashboard data');
      }
    };

    loadData();

    if (selectedAccountId) {
      const tradesSubscription = supabase
        .channel(`trades_dash_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trades',
          filter: `account_id=eq.${selectedAccountId}`
        }, () => {
          if (isActive) fetchDashboardData(selectedAccountId);
        })
        .subscribe();

      const dailyPnLSubscription = supabase
        .channel(`daily_pnl_dash_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'daily_pnl',
          filter: `account_id=eq.${selectedAccountId}`
        }, () => {
          if (isActive) fetchDashboardData(selectedAccountId);
        })
        .subscribe();

      return () => {
        isActive = false;
        tradesSubscription.unsubscribe();
        dailyPnLSubscription.unsubscribe();
      };
    }
  }, [selectedAccountId, accountsLoading]);

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

    // Day win % calculation
    const profitableDays = dailyPnls.filter(p => p.pnl > 0).length;
    const losingDays = dailyPnls.filter(p => p.pnl < 0).length;
    const totalDaysWithTrades = profitableDays + losingDays;
    const dayWinRate = totalDaysWithTrades > 0 ? (profitableDays / totalDaysWithTrades) * 100 : 0;

    const winCount = wins.length;
    const lossCount = losses.length;

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
      winLossRatio,
      dayWinRate,
      winCount,
      lossCount,
      profitableDays,
      losingDays,
      grossProfit,
      grossLoss,
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
          onClick={() => selectedAccountId && fetchDashboardData(selectedAccountId).catch(err => console.error('Manual dashboard refresh error:', err))}
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
      <div className="flex flex-col items-center justify-center min-h-[75vh] py-12 px-4">
        <ScrollReveal>
          <div className="text-center space-y-4 mb-16">
            <div className="w-20 h-20 bg-sky-500/10 border border-sky-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-sky-500/10">
              <Zap className="w-10 h-10 text-sky-500 animate-pulse" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">Welcome to RTFT</h2>
            <p className="text-neutral-500 max-w-lg mx-auto text-lg">
              Unlock your edge in the markets. Follow these steps to get started with your professional trading journal.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          <ScrollReveal delay={0.1}>
            <Link to="/accounts" className="group">
              <div className="h-full bg-[#0f0f0f] border border-white/[0.03] rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-sky-500/30 hover:bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Plus className="w-24 h-24 text-sky-500" />
                </div>
                <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Create Account</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Setup your first Challenge or Funded account to start tracking your performance metrics.
                </p>
                <div className="mt-8 px-6 py-2 bg-sky-500/10 text-sky-500 text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-sky-500 group-hover:text-black transition-all">
                  Get Started
                </div>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Link to="/campus" className="group">
              <div className="h-full bg-[#0f0f0f] border border-white/[0.03] rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <GraduationCap className="w-24 h-24 text-emerald-500" />
                </div>
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Explore Campus</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Access tutorials, strategy guides, and resources to help you master Future trading and propfirm rules.
                </p>
                <div className="mt-8 px-6 py-2 bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  Start Learning
                </div>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Link to="/profile" className="group">
              <div className="h-full bg-[#0f0f0f] border border-white/[0.03] rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-amber-500/30 hover:bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <User className="w-24 h-24 text-amber-500" />
                </div>
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Setup Profile</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Customize your personal profile and preferences to make the journal truly yours.
                </p>
                <div className="mt-8 px-6 py-2 bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-amber-500 group-hover:text-black transition-all">
                  Go to Profile
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase tracking-tighter italic">Dashboard</h1>
            <p className="text-neutral-500 mt-0.5 text-xs font-medium uppercase tracking-widest">Performance analytics for your selected account.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Performance Section */}
      <div className="space-y-6">
        <ScrollReveal delay={0.05}>
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/10 p-1.5 rounded-lg border border-sky-500/20">
              <TrendingUp className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Performance Overview</h3>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Gauges Grid - Dynamic span based on account type */}
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5",
            selectedAccount?.account_type === 'Challenge' ? "xl:col-span-9" : "xl:col-span-12"
          )}>
            <ScrollReveal delay={0.1}>
              <PerformanceGauge 
                value={formatPercent(stats?.winRate || 0)}
                subLabel="Trade win %"
                redLabel={stats?.lossCount || 0}
                greenLabel={stats?.winCount || 0}
                percent={stats?.winRate || 0}
                details={[
                  { label: "Wins", value: stats?.winCount || 0, color: "text-sky-400" },
                  { label: "Losses", value: stats?.lossCount || 0, color: "text-rose-400" }
                ]}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <PerformanceGauge 
                value={(stats?.profitFactor || 0).toFixed(2)}
                subLabel="Profit Factor"
                redLabel={formatCurrency(stats?.grossLoss || 0).replace('$','').replace('.00','')}
                greenLabel={formatCurrency(stats?.grossProfit || 0).replace('$','').replace('.00','')}
                percent={Math.min(100, ((stats?.profitFactor || 0) / 3) * 100)}
                details={[
                  { label: "Gross Profit", value: formatCurrency(stats?.grossProfit || 0), color: "text-sky-400" },
                  { label: "Gross Loss", value: formatCurrency(stats?.grossLoss || 0), color: "text-rose-400" }
                ]}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <PerformanceGauge 
                value={(stats?.winLossRatio || 0).toFixed(2)}
                subLabel="Win/Loss Ratio"
                redLabel={formatCurrency(stats?.grossLoss / (stats?.lossCount || 1) || 0).replace('$','').replace('.00','')}
                greenLabel={formatCurrency(stats?.grossProfit / (stats?.winCount || 1) || 0).replace('$','').replace('.00','')}
                percent={Math.min(100, ((stats?.winLossRatio || 0) / 2) * 100)}
                details={[
                  { label: "Avg Win", value: formatCurrency(stats?.grossProfit / (stats?.winCount || 1) || 0), color: "text-sky-400" },
                  { label: "Avg Loss", value: formatCurrency(stats?.grossLoss / (stats?.lossCount || 1) || 0), color: "text-rose-400" }
                ]}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <PerformanceGauge 
                value={formatPercent(stats?.dayWinRate || 0)}
                subLabel="Day win %"
                redLabel={stats?.losingDays || 0}
                greenLabel={stats?.profitableDays || 0}
                percent={stats?.dayWinRate || 0}
                details={[
                  { label: "Profit Days", value: stats?.profitableDays || 0, color: "text-sky-400" },
                  { label: "Loss Days", value: stats?.losingDays || 0, color: "text-rose-400" }
                ]}
              />
            </ScrollReveal>
          </div>

          {/* Profit Target Visual - Only for Challenge accounts */}
          {selectedAccount?.account_type === 'Challenge' && (
            <div className="xl:col-span-3">
              <ScrollReveal delay={0.5}>
                <ProfitTargetVisual stats={stats} />
              </ScrollReveal>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <ScrollReveal delay={0.1}>
          <MetricCard 
            title="Current Balance" 
            value={formatCurrency(stats?.currentBalance || 0)} 
            subtitle={`Initial: ${formatCurrency(stats?.initialBalance || 0)}`}
            icon={Wallet}
            color="text-sky-400"
          />
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <MetricCard 
            title="Total PnL" 
            value={formatCurrency(stats?.totalPnl || 0)} 
            icon={BarChart3}
            trend={stats?.totalPnl >= 0 ? 'up' : 'down'}
            color={stats?.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          />
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <MetricCard 
            title="Win Rate" 
            value={formatPercent(stats?.winRate || 0)} 
            icon={Zap}
            color="text-amber-400"
          />
        </ScrollReveal>
        <ScrollReveal delay={0.4}>
          <MetricCard 
            title="Profit Factor" 
            value={(stats?.profitFactor || 0).toFixed(2)} 
            icon={ShieldCheck}
            color="text-indigo-400"
          />
        </ScrollReveal>
      </div>

      {/* Secondary Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ScrollReveal delay={0.5}>
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#141414] border border-[#262626] rounded-3xl p-8 shadow-sm h-full"
            >
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
            </motion.div>
          </ScrollReveal>
        </div>

        <div className="space-y-8">
          {/* Advanced Metrics & Edge Score */}
          <ScrollReveal delay={0.6}>
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-8"
            >
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
            </motion.div>
          </ScrollReveal>

          {/* Calendar Preview */}
          <ScrollReveal delay={0.7}>
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#141414] border border-[#262626] rounded-3xl p-8"
            >
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
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

function PerformanceGauge({ label, value, subLabel, redLabel, greenLabel, percent, details }: any) {
  const [hoveredBadge, setHoveredBadge] = useState<'red' | 'green' | null>(null);

  const data = [
    { name: 'Red', value: 100 - percent },
    { name: 'Green', value: percent },
  ];

  const greenDetail = details?.find((d: any) => d.color.includes('sky') || d.label.toLowerCase().includes('win') || d.label.toLowerCase().includes('profit'));
  const redDetail = details?.find((d: any) => d.color.includes('rose') || d.label.toLowerCase().includes('loss'));

  return (
    <div className="bg-[#0f0f0f] border border-white/[0.03] rounded-[24px] p-5 flex flex-col items-center justify-between h-full transition-all duration-300 hover:border-sky-500/20 hover:bg-[#121212] relative group">
      {/* Individual Tooltips */}
      <AnimatePresence>
        {hoveredBadge && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={cn(
              "absolute bottom-[80px] z-50 pointer-events-none",
              hoveredBadge === 'red' ? "left-4" : "right-4"
            )}
          >
            <div className="bg-[#1a1a1a] border border-[#262626] px-3 py-2 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] min-w-[130px] flex justify-between items-center gap-4">
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-[0.1em]">
                {hoveredBadge === 'red' ? redDetail?.label : greenDetail?.label}
              </span>
              <span className={cn(
                "text-[11px] font-black",
                hoveredBadge === 'red' ? "text-rose-500" : "text-sky-400"
              )}>
                {hoveredBadge === 'red' ? redDetail?.value : greenDetail?.value}
              </span>
            </div>
            {/* Tooltip caret */}
            <div className={cn(
              "w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#262626] mx-auto -mt-[1px]",
              hoveredBadge === 'red' ? "ml-4" : "mr-4"
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-[140px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={62}
              outerRadius={76}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
            >
              <Cell 
                fill="#1a1a1a" 
                className="cursor-crosshair"
              />
              <Cell 
                fill="#0ea5e9" 
                className="cursor-help transition-all duration-300 hover:opacity-100 opacity-90 drop-shadow-[0_0_12px_rgba(14,165,233,0.2)]" 
                onMouseEnter={() => setHoveredBadge('green')}
                onMouseLeave={() => setHoveredBadge(null)}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full px-2">
          <p className={cn(
            "font-black text-white uppercase italic leading-none tracking-tight",
            value.length > 5 ? "text-lg" : "text-xl"
          )}>
            {value}
          </p>
          <p className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.2em] mt-1.5 italic">
            {subLabel}
          </p>
        </div>
      </div>

      <div className="w-full flex justify-between items-center mt-2.5 gap-2 px-1">
        <div 
          onMouseEnter={() => setHoveredBadge('red')}
          onMouseLeave={() => setHoveredBadge(null)}
          className="flex items-center gap-2 px-2 py-1 bg-rose-500/[0.03] border border-rose-500/10 rounded-lg shrink-0 cursor-help transition-all hover:bg-rose-500/10"
        >
          <div className="w-1 h-1 rounded-full bg-rose-500" />
          <span className="text-[9px] font-black text-rose-500/80">{redLabel}</span>
        </div>
        <div 
          onMouseEnter={() => setHoveredBadge('green')}
          onMouseLeave={() => setHoveredBadge(null)}
          className="flex items-center gap-2 px-2 py-1 bg-sky-500/[0.03] border border-sky-500/10 rounded-lg shrink-0 cursor-help transition-all hover:bg-sky-500/10"
        >
          <div className="w-1 h-1 rounded-full bg-sky-500" />
          <span className="text-[9px] font-black text-sky-500/80">{greenLabel}</span>
        </div>
      </div>
    </div>
  );
}

function ProfitTargetVisual({ stats }: { stats: any }) {
  if (!stats) return null;
  
  const targetEquity = stats.initialBalance + stats.profitTarget;
  
  return (
    <div className="bg-[#0f0f0f] border border-white/[0.03] rounded-[24px] p-6 flex flex-col justify-between h-full group hover:border-sky-500/20 transition-all relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-sky-500/[0.02] blur-[60px] rounded-full group-hover:bg-sky-500/5 transition-colors" />
      
      <div className="space-y-1 relative z-10">
        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.15em] opacity-60 italic">Goal Tracking</p>
        <h3 className="text-3xl font-black text-white tracking-tighter italic flex items-baseline gap-2">
          {formatCurrency(stats.profitTarget)}
          <span className="text-[9px] font-black text-neutral-600 not-italic uppercase tracking-widest leading-none opacity-40">Target</span>
        </h3>
      </div>

      <div className="space-y-6 mt-6 relative z-10">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Equity Level</p>
            <p className="text-sm font-black text-white/80">{formatCurrency(targetEquity)}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Remains</p>
            <p className="text-sm font-black text-sky-500">{formatCurrency(stats.amountLeft)}</p>
          </div>
        </div>

        <div className="relative pt-1 pb-6">
          {/* Track */}
          <div className="h-2 w-full bg-white/[0.02] rounded-full border border-white/[0.05]">
            {/* Fill */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.targetProgress}%` }}
              transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-sky-600/80 to-sky-400/80 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.2)] relative"
            >
              <div className="absolute inset-0 bg-white/5 rounded-full" />
            </motion.div>
          </div>

          {/* Indicator/Thumb */}
          <motion.div 
            initial={{ left: 0 }}
            animate={{ left: `${stats.targetProgress}%` }}
            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute top-0.5 -mt-2 w-6 h-6 flex items-center justify-center -ml-3 z-20"
          >
            <div className="w-4 h-4 bg-black border border-sky-400/50 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)] flex items-center justify-center relative">
              <div className="w-1 h-1 bg-sky-500 rounded-full" />
            </div>
            
            {/* Tooltip Label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-75 origin-top">
              <div className="bg-sky-500/90 px-2 py-0.5 rounded-md shadow-lg">
                <p className="text-[10px] font-black text-black whitespace-nowrap">{formatCurrency(stats.totalPnl)}</p>
              </div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-sky-500/90 mx-auto -mt-[18px]" />
            </div>
          </motion.div>

          <div className="flex justify-between items-center text-[8px] font-black text-neutral-600 mt-5 uppercase tracking-[0.2em] opacity-50">
            <span>START</span>
            <span>{formatPercent(stats.targetProgress)}</span>
            <span>PASS</span>
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
    <motion.div 
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-[#141414] border border-[#262626] rounded-2xl p-4 md:p-5 transition-all duration-300 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/5 group h-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110", 
          bgColors[color] || 'bg-sky-500/10'
        )}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
            trend === 'up' ? "bg-sky-500/10 text-sky-400" : "bg-neutral-500/10 text-neutral-400"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5 mr-1" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-1" />}
            {trend === 'up' ? 'Growth' : 'Drawdown'}
          </div>
        )}
      </div>
      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-0.5">{title}</p>
      <p className={cn("text-xl font-black tracking-tighter", color)}>{value}</p>
      {subtitle && <p className="text-[9px] font-bold text-neutral-600 mt-1.5">{subtitle}</p>}
    </motion.div>
  );
}
