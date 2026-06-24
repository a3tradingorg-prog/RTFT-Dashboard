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
  PolarRadiusAxis,
  ReferenceLine
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from '../components/ScrollReveal';
import { LoadingState } from '../components/LoadingState';

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    accounts, 
    selectedAccountId, 
    selectedAccount, 
    loading: accountsLoading,
    cachedTrades,
    setCachedTrades,
    cachedDailyPnls,
    setCachedDailyPnls
  } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchDashboardData = async (accId: string, silent = false) => {
    if (!accId) return;
    
    if (!silent) setLoading(true);
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
        setCachedTrades(accId, tradesRes.data as Trade[]);
      }
      if (dailyPnlsRes.data) {
        setDailyPnls(dailyPnlsRes.data as DailyPnL[]);
        setCachedDailyPnls(accId, dailyPnlsRes.data as DailyPnL[]);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      if (!silent) setError(err.message || 'Failed to load dashboard data');
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

      const hasCache = cachedTrades[selectedAccountId] && cachedDailyPnls[selectedAccountId];

      try {
        if (hasCache) {
          setTrades(cachedTrades[selectedAccountId]);
          setDailyPnls(cachedDailyPnls[selectedAccountId]);
          setLoading(false);
          setError(null);
          // Fetch update in the background silently
          await fetchDashboardData(selectedAccountId, true);
        } else {
          setLoading(true);
          setError(null);
          setTrades([]);
          setDailyPnls([]);
          await fetchDashboardData(selectedAccountId, false);
        }
      } catch (err: any) {
        if (isActive && !hasCache) setError(err.message || 'Failed to load dashboard data');
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
        }, (payload: any) => {
          if (isActive) fetchDashboardData(selectedAccountId, true);
        })
        .subscribe();

      const dailyPnLSubscription = supabase
        .channel(`daily_pnl_dash_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'daily_pnl',
          filter: `account_id=eq.${selectedAccountId}`
        }, (payload: any) => {
          if (isActive) fetchDashboardData(selectedAccountId, true);
        })
        .subscribe();

      return () => {
        isActive = false;
        tradesSubscription.unsubscribe();
        dailyPnLSubscription.unsubscribe();
      };
    }
  }, [selectedAccountId, accountsLoading]);

  // Set initial date range when trades change
  useEffect(() => {
    if (trades.length > 0 && !startDate && !endDate) {
      const dates = trades
        .filter(t => t.status === 'CLOSED')
        .map(t => new Date(t.exit_date || t.entry_date).getTime())
        .filter(d => !isNaN(d));

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        setStartDate(format(minDate, 'yyyy-MM-dd'));
        setEndDate(format(maxDate, 'yyyy-MM-dd'));
      }
    }
  }, [trades]);

  const derivedDailyPnls = React.useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const dayMap: Record<string, number> = {};
    closedTrades.forEach(t => {
      const dateToUse = t.exit_date || t.entry_date;
      if (!dateToUse) return;
      try {
        const d = typeof dateToUse === 'string' ? new Date(dateToUse) : dateToUse;
        if (isNaN(d.getTime())) return;
        const dateStr = d.toISOString().split('T')[0];
        dayMap[dateStr] = (dayMap[dateStr] || 0) + (Number(t.pnl) || 0);
      } catch (err) {
        console.error('Error parsing date for daily pnl:', err);
      }
    });
    return Object.entries(dayMap).map(([date, pnl]) => ({
      date,
      pnl
    }));
  }, [trades]);

  const stats = React.useMemo(() => {
    if (!selectedAccount) return null;
    
    const initialBalance = Number(selectedAccount.initial_balance) || 0;
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const totalPnl = closedTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const currentBalance = initialBalance + totalPnl;
    
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
    const profitableDays = derivedDailyPnls.filter(p => p.pnl > 0).length;
    const losingDays = derivedDailyPnls.filter(p => p.pnl < 0).length;
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

    // Propfirm Consistency - Rule: (Highest Day Profit / Absolute Total Profit) * 100
    const consistencyRules = selectedAccount.consistency_rules;
    const hasConsistencyRule = consistencyRules !== 'No Consistency';
    const consistencyLimit = hasConsistencyRule ? (parseFloat(consistencyRules) || 50) : 0;
    const maxDayProfit = Math.max(...derivedDailyPnls.map(p => p.pnl), 0);
    
    const currentConsistencyRatio = totalPnl > 0 ? (maxDayProfit / totalPnl) : 0;
    const isConsistent = !hasConsistencyRule || (currentConsistencyRatio * 100) <= consistencyLimit;

    // Profit Target
    const profitTarget = Number(selectedAccount.profit_target) || (initialBalance * 0.1);
    const targetProgress = Math.min(100, Math.max(0, (totalPnl / profitTarget) * 100));
    const amountLeft = Math.max(0, profitTarget - totalPnl);

    // Trailing Drawdown
    let peakBalance = initialBalance;
    let runningBal = initialBalance;
    trades.forEach(t => {
      runningBal += (Number(t.pnl) || 0);
      if (runningBal > peakBalance) peakBalance = runningBal;
    });
    
    const maxAllowedDrawdown = Number(selectedAccount.max_drawdown) || initialBalance * 0.05;
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
      hasConsistencyRule,
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
      consistencyLimit,
      currentConsistencyRatio,
      maxDayProfit
    };
  }, [trades, selectedAccount, derivedDailyPnls]);

  const chartData = React.useMemo(() => {
    if (!selectedAccount) return [];
    
    const initialBalance = Number(selectedAccount.initial_balance) || 0;
    let currentBalance = initialBalance;
    let peakBalance = initialBalance;
    const maxDrawdown = Number(selectedAccount.max_drawdown) || initialBalance * 0.05;
    const profitTarget = Number(selectedAccount.profit_target) || (initialBalance * 0.1);
    
    const allPoints = [{
      timestamp: 0,
      date: 'Start',
      balance: currentBalance,
      floor: currentBalance - maxDrawdown,
      target: initialBalance + profitTarget
    }];
    
    const sortedTrades = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.exit_date || a.entry_date).getTime() - new Date(b.exit_date || b.entry_date).getTime());

    sortedTrades.forEach(t => {
      currentBalance += (Number(t.pnl) || 0);
      if (currentBalance > peakBalance) peakBalance = currentBalance;
      
      const tradeDate = new Date(t.exit_date || t.entry_date);
      allPoints.push({
        timestamp: tradeDate.getTime(),
        date: format(tradeDate, 'MMM dd'),
        balance: currentBalance,
        floor: peakBalance - maxDrawdown,
        target: initialBalance + profitTarget
      });
    });

    // Filter by date
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return allPoints.filter((p, i) => i === 0 || (p.timestamp >= start && p.timestamp <= end + 86400000));
    }

    return allPoints;
  }, [trades, selectedAccount, startDate, endDate]);

  const chartYDomain = React.useMemo(() => {
    if (chartData.length === 0) return [0, 100000];
    
    const values: number[] = [];
    chartData.forEach(p => {
      const b = Number(p.balance);
      const f = Number(p.floor);
      if (!isNaN(b)) values.push(b);
      if (!isNaN(f)) values.push(f);
    });

    if (selectedAccount?.account_type === 'Challenge' && stats?.profitTarget) {
      const initBal = Number(selectedAccount.initial_balance) || 0;
      const targetVal = initBal + Number(stats.profitTarget);
      if (!isNaN(targetVal)) values.push(targetVal);
    }

    if (values.length === 0) return [0, 100000];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Add tight padding to the top and bottom so fluctuations are extremely clear
    const padding = range === 0 ? min * 0.01 : range * 0.05;
    const finalMin = Math.max(0, min - padding);
    const finalMax = max + padding;

    return [finalMin, finalMax];
  }, [chartData, selectedAccount, stats]);

  const calendarDays = React.useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return eachDayOfInterval({ start, end });
  }, []);

  const getDayPnL = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    return derivedDailyPnls.find(p => p.date === localDateStr)?.pnl || 0;
  };

  if (loading || accountsLoading) {
    return <LoadingState message="Synchronizing performance metrics..." />;
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
      <div className="flex flex-col items-center justify-center min-h-[75vh] py-12 px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center space-y-4 mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-500/10 border border-sky-500/20 rounded-[20px] sm:rounded-[32px] flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-sky-500/10">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 animate-pulse" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter italic uppercase">Welcome to RTFT</h2>
            <p className="text-neutral-500 max-w-lg mx-auto text-sm sm:text-lg font-medium leading-relaxed">
              Unlock your edge in the markets. Watch our quick tour to master the platform and scale your trading career.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="w-full max-w-3xl mx-auto mb-12 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-emerald-500/20 rounded-2xl sm:rounded-[33px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative aspect-video rounded-2xl sm:rounded-[32px] overflow-hidden border border-white/[0.05] bg-black shadow-2xl">
              <iframe 
                src="https://www.youtube.com/embed/vPj-nAgqEik" 
                title="RTFT Website Tour"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
               <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
               <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic tracking-tighter">Fast-Track Onboarding Video</span>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-6xl w-full">
          <ScrollReveal delay={0.1}>
            <Link to="/accounts" className="group">
              <div className="h-full bg-[#0f0f0f] border border-white/[0.03] rounded-2xl sm:rounded-[32px] p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-sky-500/30 hover:bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Plus className="w-20 h-20 sm:w-24 sm:h-24 text-sky-500" />
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-sky-500 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                  <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Create Account</h3>
                <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                  Setup your first Challenge or Funded account to start tracking your performance metrics.
                </p>
                <div className="mt-6 sm:mt-8 px-5 py-2 bg-sky-500/10 text-sky-500 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-sky-500 group-hover:text-black transition-all">
                  Get Started
                </div>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Link to="/campus" className="group">
              <div className="h-full bg-[#0f0f0f] border border-white/[0.03] rounded-2xl sm:rounded-[32px] p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <GraduationCap className="w-20 h-20 sm:w-24 sm:h-24 text-emerald-500" />
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Explore Campus</h3>
                <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                  Access tutorials, strategy guides, and resources to help you master Future trading and propfirm rules.
                </p>
                <div className="mt-6 sm:mt-8 px-5 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  Start Learning
                </div>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.3} className="sm:col-span-2 md:col-span-1">
            <Link to="/profile" className="group">
              <div className="h-full bg-[#0f0f0f] border border-white/[0.03] rounded-2xl sm:rounded-[32px] p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-amber-500/30 hover:bg-[#121212] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <User className="w-20 h-20 sm:w-24 sm:h-24 text-amber-500" />
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <User className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Setup Profile</h3>
                <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                  Customize your personal profile and preferences to make the journal truly yours.
                </p>
                <div className="mt-6 sm:mt-8 px-5 py-2 bg-amber-500/10 text-amber-500 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-amber-500 group-hover:text-black transition-all">
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
    <div className="space-y-6 md:space-y-10">
      {/* Header */}
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border-b border-white/[0.02] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase tracking-tighter italic">Dashboard</h1>
            <p className="text-neutral-500 mt-1 text-xs font-medium uppercase tracking-widest">Performance analytics for your selected account.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Performance Section */}
      <div className="space-y-5">
        <ScrollReveal delay={0.05}>
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/10 p-1.5 rounded-lg border border-sky-500/20">
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Performance Overview</h3>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Gauges Grid - Dynamic span based on account type */}
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5",
            selectedAccount?.account_type === 'Challenge' ? "xl:col-span-9" : "xl:col-span-12"
          )}>
            <ScrollReveal delay={0.1}>
              <PerformanceGauge 
                value={formatPercent(stats?.winRate || 0)}
                title="Trade Win %"
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
                title="Profit Factor"
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
                title="Win/Loss Ratio"
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
                title="Day Win %"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <ScrollReveal delay={0.5}>
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#0f0f0f] border border-white/[0.03] rounded-2xl md:rounded-[32px] p-5 md:p-8 shadow-sm h-full"
            >
              <div className="flex flex-col space-y-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  {/* Left: Balance Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Balance</p>
                      <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">
                        {formatCurrency(stats?.currentBalance || 0)}
                      </h3>
                    </div>
                  </div>

                  {/* Right: Date Selectors (Fully Stacked on mobile & Flex Row on Tablet+) */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="space-y-1 w-full">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest pl-1">Start Date</p>
                      <div className="relative group">
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-sky-500/50 transition-all cursor-pointer appearance-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 w-full">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest pl-1">End Date</p>
                      <div className="relative group">
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-sky-500/50 transition-all cursor-pointer appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-sky-500/10" />
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Account Balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 border-t-2 border-dashed border-emerald-500" />
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Profit Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 border-t-2 border-dashed border-rose-500" />
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Maximum Loss Limit</span>
                  </div>
                </div>
              </div>

              <div className="h-[280px] sm:h-[320px] md:h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#404040" 
                      fontSize={10} 
                      fontWeight={800}
                      tickLine={false} 
                      axisLine={false} 
                      dy={15}
                      className="uppercase tracking-widest"
                    />
                    <YAxis 
                      stroke="#404040" 
                      fontSize={10} 
                      fontWeight={800}
                      tickLine={false} 
                      axisLine={false}
                      domain={chartYDomain}
                      tickFormatter={(value) => {
                        const range = chartYDomain[1] - chartYDomain[0];
                        if (range < 5000) {
                          return `$${(value / 1000).toFixed(1)}K`;
                        }
                        return `$${(value / 1000).toFixed(0)}K`;
                      }}
                      dx={-10}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">{label}</p>
                              <div className="space-y-2">
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-8">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase">{entry.name}</span>
                                    <span className="text-sm font-black" style={{ color: entry.color }}>
                                      {formatCurrency(entry.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      name="Account Balance"
                      dataKey="balance" 
                      stroke="#0ea5e9" 
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                      strokeWidth={3}
                      animationDuration={1500}
                    />
                    <Area 
                      type="stepAfter" 
                      name="Maximum Loss Limit"
                      dataKey="floor" 
                      stroke="#ef4444" 
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      animationDuration={1500}
                    />
                    {selectedAccount?.account_type === 'Challenge' && stats?.profitTarget && (
                      <ReferenceLine 
                        y={stats.initialBalance + stats.profitTarget} 
                        stroke="#10b981" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>

        <div className="space-y-6 md:space-y-8">
          {/* Advanced Metrics & Edge Score */}
          <ScrollReveal delay={0.6}>
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#141414] border border-[#262626] rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 md:space-y-8"
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
                {stats?.hasConsistencyRule && (
                  <div className="flex flex-col gap-4">
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
                    
                    <div className="flex flex-col items-center py-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.02]">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { value: 100 - (stats?.currentConsistencyRatio * 100) },
                                { value: stats?.currentConsistencyRatio * 100 }
                              ]}
                              cx="50%"
                              cy="50%"
                              startAngle={90}
                              endAngle={-270}
                              innerRadius={30}
                              outerRadius={45}
                              dataKey="value"
                              stroke="none"
                            >
                              <Cell fill="#1a1a1a" />
                              <Cell fill={stats?.isConsistent ? "#0ea5e9" : "#ef4444"} />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={cn(
                            "text-2xl font-black italic tracking-tighter",
                            stats?.isConsistent ? "text-sky-400" : "text-rose-400"
                          )}>
                            {(stats?.currentConsistencyRatio * 100).toFixed(0)}
                          </span>
                          <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-1">%</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mt-2 italic">Consistency</p>
                      
                      {/* Detailed Breakdown */}
                      <div className="w-full px-5 mt-4 space-y-2 border-t border-[#1f1f1f] pt-3 text-[10px] font-bold text-neutral-400">
                        <div className="flex justify-between items-center">
                          <span>Max Daily Profit:</span>
                          <span className="text-white font-black">{formatCurrency(stats?.maxDayProfit || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Net Profit:</span>
                          <span className="text-white font-black">{formatCurrency(stats?.totalPnl || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-[#121212] pt-1 text-sky-400">
                          <span>Ratio (Max Day / Total):</span>
                          <span className="font-black">{((stats?.currentConsistencyRatio || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-neutral-500">
                          <span>Ratio (Total / Max Day):</span>
                          <span className="font-black">{stats?.maxDayProfit && stats.maxDayProfit > 0 ? (stats.totalPnl / stats.maxDayProfit).toFixed(2) : '0.00'}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
        </div>
      </div>
    </div>
  );
}

function PerformanceGauge({ title, value, redLabel, greenLabel, percent, details }: any) {
  const [hoveredBadge, setHoveredBadge] = useState<'red' | 'green' | null>(null);

  const data = [
    { name: 'Red', value: 100 - percent },
    { name: 'Green', value: percent },
  ];

  const greenDetail = details?.find((d: any) => d.color.includes('sky') || d.label.toLowerCase().includes('win') || d.label.toLowerCase().includes('profit'));
  const redDetail = details?.find((d: any) => d.color.includes('rose') || d.label.toLowerCase().includes('loss'));

  return (
    <div className="bg-[#0f0f0f] border border-white/[0.03] rounded-xl sm:rounded-[24px] p-4 sm:p-5 flex flex-col items-center h-full transition-all duration-300 hover:border-sky-500/20 hover:bg-[#121212] relative group">
      <div className="w-full text-center mb-1">
        <p className="text-[9px] sm:text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] italic opacity-80 group-hover:text-sky-400 transition-colors">
          {title}
        </p>
      </div>

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

      <div className="relative w-full h-[120px] flex items-center justify-center overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={65}
              outerRadius={80}
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
        
        <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full px-2">
          <p className={cn(
            "font-black text-white italic leading-none tracking-tight",
            value.length > 5 ? "text-xl" : "text-2xl"
          )}>
            {value}
          </p>
        </div>
      </div>

      <div className="w-full flex justify-between items-center mt-2 gap-2 px-1">
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
    <div className="bg-[#0f0f0f] border border-white/[0.03] rounded-2xl md:rounded-[24px] p-5 md:p-6 flex flex-col justify-between h-full group hover:border-sky-500/20 transition-all relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-sky-500/[0.02] blur-[60px] rounded-full group-hover:bg-sky-500/5 transition-colors" />
      
      <div className="space-y-1 relative z-10">
        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.15em] opacity-60 italic">Goal Tracking</p>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter italic flex items-baseline gap-2">
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
