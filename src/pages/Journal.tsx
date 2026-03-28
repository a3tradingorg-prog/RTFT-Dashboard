import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useAccount } from '../lib/AccountContext';
import { TradingAccount, Trade, DailyPnL, TradeExit, Strategy } from '../types';
import { 
  Book, 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Tag,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  DollarSign,
  Image as ImageIcon,
  PlusCircle,
  Brain,
  Layout,
  ChevronDown,
  Upload,
  Target,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const multipliers: Record<string, number> = {
  'MNQ': 2, 'NQ': 20,
  'MES': 5, 'ES': 50,
  'MGC': 10, 'GC': 100
};

export default function Journal() {
  const { user } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId, selectedAccount, loading: accountsLoading } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar' | 'details'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrades(prev => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };
  
  // Trade Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Form Fields
  const [asset, setAsset] = useState<Trade['asset']>('MNQ');
  const [type, setType] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [contractSize, setContractSize] = useState('1');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  
  // Dynamic Exits
  const [exits, setExits] = useState<{
    closed_contract: string;
    exit_price: string;
    exit_status: TradeExit['exit_status'];
    exit_reason: TradeExit['exit_reason'];
    exit_timestamp?: string;
  }[]>([]);

  // Strategy Tab
  const [entryContext, setEntryContext] = useState('');
  const [marketRegime, setMarketRegime] = useState('');
  const [psychologyStatus, setPsychologyStatus] = useState('');
  const [fundamentalContext, setFundamentalContext] = useState('');
  const [strategyId, setStrategyId] = useState<string | null>(null);

  // Automatic LONG/SHORT detection
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const tp = parseFloat(takeProfit);
    const sl = parseFloat(stopLoss);

    if (!isNaN(entry) && !isNaN(tp) && !isNaN(sl)) {
      if (tp > entry && sl < entry) {
        setType('LONG');
      } else if (tp < entry && sl > entry) {
        setType('SHORT');
      }
    }
  }, [entryPrice, takeProfit, stopLoss]);

  // Dropdown States
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isStrategyDropdownOpen, setIsStrategyDropdownOpen] = useState(false);
  const [openExitDropdown, setOpenExitDropdown] = useState<{ index: number, type: 'status' | 'reason' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchStrategies();
    }
  }, [user]);

  const fetchStrategies = async () => {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'Active');

    if (!error && data) {
      setStrategies(data);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchJournalData();

      const tradesSubscription = supabase
        .channel(`journal_trades_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trades',
          filter: `account_id=eq.${selectedAccountId}`
        }, () => {
          fetchJournalData();
        })
        .subscribe();

      const exitsSubscription = supabase
        .channel(`journal_exits_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trade_exit_records'
        }, () => {
          // Since we can't easily filter by account_id on the exit table directly without a join in the filter
          // we'll just refresh if any exit changes. For better performance, we could filter by trade_ids.
          fetchJournalData();
        })
        .subscribe();

      const dailyPnLSubscription = supabase
        .channel(`journal_pnl_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'daily_pnl',
          filter: `account_id=eq.${selectedAccountId}`
        }, () => {
          fetchJournalData();
        })
        .subscribe();

      return () => {
        tradesSubscription.unsubscribe();
        exitsSubscription.unsubscribe();
        dailyPnLSubscription.unsubscribe();
      };
    }
  }, [selectedAccountId]);

  const fetchJournalData = async () => {
    setLoading(true);
    try {
      const [tradesRes, dailyPnlsRes] = await Promise.all([
        supabase
          .from('trades')
          .select('*, trade_exit_records(*), strategies(*)')
          .eq('account_id', selectedAccountId)
          .order('entry_date', { ascending: false })
          .order('exit_timestamp', { foreignTable: 'trade_exit_records', ascending: false }),
        supabase
          .from('daily_pnl')
          .select('*')
          .eq('account_id', selectedAccountId)
      ]);

      if (tradesRes.error) throw tradesRes.error;
      if (dailyPnlsRes.error) throw dailyPnlsRes.error;

      if (tradesRes.data) {
        // Map trade_exit_records to trade_exits and strategies to strategy for compatibility
        const mappedTrades = tradesRes.data.map((t: any) => ({
          ...t,
          trade_exits: t.trade_exit_records,
          strategy: t.strategies
        }));
        setTrades(mappedTrades);
      }
      if (dailyPnlsRes.data) setDailyPnls(dailyPnlsRes.data);
    } catch (error) {
      console.error('Error fetching journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    if (!confirm('Are you sure you want to delete this trade?')) return;

    try {
      const { error } = await supabase.from('trades').delete().eq('id', id);
      
      if (error) throw error;

      // Revert account balance
      const newBalance = (selectedAccount?.current_balance || 0) - Number(trade.pnl);
      await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
      
      // Revert daily PnL
      const dateStr = format(new Date(trade.entry_date), 'yyyy-MM-dd');
      const existingPnL = dailyPnls.find(p => p.date === dateStr);
      if (existingPnL) {
        await supabase.from('daily_pnl').update({ pnl: Number(existingPnL.pnl) - Number(trade.pnl) }).eq('id', existingPnL.id);
      }
      
      toast.success('Trade deleted successfully');
      fetchJournalData();
    } catch (error: any) {
      console.error('Error deleting trade:', error);
      toast.error(`Failed to delete trade: ${error.message}`);
    }
  };

  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);

  const handleEditTrade = (trade: Trade) => {
    setEditingTradeId(trade.id);
    setAsset(trade.asset);
    setType(trade.type);
    setEntryDate(format(new Date(trade.entry_date), "yyyy-MM-dd'T'HH:mm"));
    setContractSize(trade.contract_size.toString());
    setEntryPrice(trade.entry_price.toString());
    setTakeProfit(trade.take_profit.toString());
    setStopLoss(trade.stop_loss.toString());
    setScreenshot(trade.screenshot_url);
    setEntryContext(trade.entry_context || '');
    setMarketRegime(trade.market_regime || '');
    setPsychologyStatus(trade.psychology_status || '');
    setFundamentalContext(trade.fundamental_context || '');
    setStrategyId(trade.strategy_id);
    
    if (trade.trade_exits && trade.trade_exits.length > 0) {
      setExits(trade.trade_exits.map(e => ({
        closed_contract: e.closed_contract.toString(),
        exit_price: e.exit_price.toString(),
        exit_status: e.exit_status,
        exit_reason: e.exit_reason,
        exit_timestamp: e.exit_timestamp
      })));
    } else if (trade.status === 'CLOSED' && trade.exit_price) {
      // Fallback for trades closed without explicit exit rows
      setExits([{
        closed_contract: trade.contract_size.toString(),
        exit_price: trade.exit_price.toString(),
        exit_status: 'TP', // Default to TP if unknown
        exit_reason: null,
        exit_timestamp: trade.exit_date || new Date().toISOString()
      }]);
    } else {
      setExits([]);
    }
    
    setIsModalOpen(true);
  };

  const handleCloseTrade = (trade: Trade) => {
    handleEditTrade(trade);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !entryPrice || !contractSize || !selectedAccountId) {
      setFormError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const entry = parseFloat(entryPrice);
    const totalQty = parseFloat(contractSize);
    
    const multiplier = multipliers[asset] || 1;

    // Calculate PnL from exits
    let totalNetPnl = 0;
    let totalClosedQty = 0;
    let weightedExitPriceSum = 0;

    const processedExits = exits.map(exit => {
      const exitP = parseFloat(exit.exit_price) || 0;
      const exitQty = parseFloat(exit.closed_contract) || 0;
      totalClosedQty += exitQty;
      weightedExitPriceSum += (exitP * exitQty);
      
      const exitPnl = type === 'LONG' 
        ? (exitP - entry) * exitQty * multiplier
        : (entry - exitP) * exitQty * multiplier;
      const commission = (selectedAccount?.commission || 0) * exitQty;
      
      const netExitPnl = exitPnl - commission;
      totalNetPnl += netExitPnl;
      
      return {
        closed_contract: exitQty,
        exit_price: exitP,
        exit_status: exit.exit_status,
        exit_reason: exit.exit_reason,
        exit_timestamp: exit.exit_timestamp || new Date().toISOString(),
        pnl_for_this_exit: netExitPnl,
        commission_for_this_exit: commission
      };
    });

    const avgExitPrice = totalClosedQty > 0 ? weightedExitPriceSum / totalClosedQty : 0;

    const tradeData = {
      account_id: selectedAccountId,
      user_id: user?.id,
      asset,
      type,
      entry_date: new Date(entryDate).toISOString(),
      contract_size: totalQty,
      entry_price: entry,
      exit_price: avgExitPrice,
      take_profit: parseFloat(takeProfit) || 0,
      stop_loss: parseFloat(stopLoss) || 0,
      screenshot_url: screenshot,
      entry_context: entryContext,
      market_regime: marketRegime,
      psychology_status: psychologyStatus,
      fundamental_context: fundamentalContext,
      strategy_id: strategyId,
      pnl: totalNetPnl,
      pnl_percent: (totalNetPnl / (selectedAccount?.initial_balance || 1)) * 100,
      status: totalClosedQty >= totalQty ? 'CLOSED' : 'OPEN',
      exit_date: totalClosedQty >= totalQty ? new Date().toISOString() : new Date(entryDate).toISOString(),
    };

    try {
      if (editingTradeId) {
        // Update existing trade
        const oldTrade = trades.find(t => t.id === editingTradeId);
        const { error: tradeError } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', editingTradeId);

        if (tradeError) throw tradeError;

        // Delete old exits and insert new ones
        await supabase.from('trade_exit_records').delete().eq('trade_id', editingTradeId);
        if (processedExits.length > 0) {
          const exitsWithId = processedExits.map(e => ({ ...e, trade_id: editingTradeId }));
          await supabase.from('trade_exit_records').insert(exitsWithId);
        }
        
        // Update account balance (revert old pnl, add new pnl)
        const revertedBalance = (selectedAccount?.current_balance || 0) - (oldTrade?.pnl || 0);
        const newBalance = revertedBalance + totalNetPnl;
        await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);

        // Update daily PnL
        const dateStr = format(new Date(entryDate), 'yyyy-MM-dd');
        const oldDateStr = oldTrade ? format(new Date(oldTrade.entry_date), 'yyyy-MM-dd') : dateStr;
        
        if (dateStr === oldDateStr) {
          const existingPnL = dailyPnls.find(p => p.date === dateStr);
          if (existingPnL) {
            await supabase.from('daily_pnl').update({ pnl: existingPnL.pnl - (oldTrade?.pnl || 0) + totalNetPnl }).eq('id', existingPnL.id);
          }
        } else {
          // Revert old date
          const oldPnL = dailyPnls.find(p => p.date === oldDateStr);
          if (oldPnL) {
            await supabase.from('daily_pnl').update({ pnl: oldPnL.pnl - (oldTrade?.pnl || 0) }).eq('id', oldPnL.id);
          }
          // Add to new date
          const newPnL = dailyPnls.find(p => p.date === dateStr);
          if (newPnL) {
            await supabase.from('daily_pnl').update({ pnl: newPnL.pnl + totalNetPnl }).eq('id', newPnL.id);
          } else {
            await supabase.from('daily_pnl').insert([{ account_id: selectedAccountId, date: dateStr, pnl: totalNetPnl, user_id: user?.id }]);
          }
        }

        setIsModalOpen(false);
        resetForm();
        setEditingTradeId(null);
        toast.success('Trade updated successfully!');
        fetchJournalData();
      } else {
        // Insert new trade
        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .insert([tradeData])
          .select()
          .single();

        if (tradeError) throw tradeError;
        if (trade) {
          if (processedExits.length > 0) {
            const exitsWithId = processedExits.map(e => ({ ...e, trade_id: trade.id }));
            await supabase.from('trade_exit_records').insert(exitsWithId);
          }

          const newBalance = (selectedAccount?.current_balance || 0) + totalNetPnl;
          await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
          
          const dateStr = format(new Date(entryDate), 'yyyy-MM-dd');
          const existingPnL = dailyPnls.find(p => p.date === dateStr);
          if (existingPnL) {
            await supabase.from('daily_pnl').update({ pnl: existingPnL.pnl + totalNetPnl }).eq('id', existingPnL.id);
          } else {
            await supabase.from('daily_pnl').insert([{ account_id: selectedAccountId, date: dateStr, pnl: totalNetPnl, user_id: user?.id }]);
          }

          setIsModalOpen(false);
          resetForm();
          toast.success('Trade logged successfully!');
          fetchJournalData();
        }
      }
    } catch (error: any) {
      console.error('Error submitting trade:', error);
      setFormError(error.message || 'An error occurred while saving the trade');
      toast.error(`Failed to save trade: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAsset('MNQ');
    setType('LONG');
    setEntryDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setContractSize('1');
    setEntryPrice('');
    setTakeProfit('');
    setStopLoss('');
    setScreenshot(null);
    setExits([]);
    setEntryContext('');
    setMarketRegime('');
    setPsychologyStatus('');
    setFundamentalContext('');
    setStrategyId(null);
    setFormError('');
  };

  const handleAddExit = () => {
    const currentTotal = exits.reduce((acc, curr) => acc + (parseFloat(curr.closed_contract) || 0), 0);
    const remaining = Math.max(0, parseFloat(contractSize) - currentTotal);
    
    setExits([...exits, { 
      closed_contract: remaining.toString(), 
      exit_price: '', 
      exit_status: 'TP', 
      exit_reason: null,
      exit_timestamp: new Date().toISOString()
    }]);
  };

  const handleRemoveExit = (index: number) => {
    setExits(exits.filter((_, i) => i !== index));
  };

  const handleExitChange = (index: number, field: string, value: any) => {
    const newExits = [...exits];
    newExits[index] = { ...newExits[index], [field]: value };
    
    // Reset reason if status is TP or SL
    if (field === 'exit_status' && (value === 'TP' || value === 'SL')) {
      newExits[index].exit_reason = null;
    }
    
    setExits(newExits);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setScreenshot(event.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshot(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const getDayPnL = (date: Date) => {
    return dailyPnls.find(p => isSameDay(new Date(p.date), date))?.pnl || 0;
  };

  const getDayTrades = (date: Date) => {
    return trades.filter(t => isSameDay(new Date(t.entry_date), date));
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Trading Journal</h1>
          <p className="text-neutral-500 mt-2 font-medium">Review and analyze your trading history.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-[#141414] border border-[#262626] rounded-2xl p-1">
            <button 
              onClick={() => setView('calendar')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                view === 'calendar' ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
              )}
            >
              Calendar
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                view === 'list' ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
              )}
            >
              List
            </button>
            <button 
              onClick={() => setView('details')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all hidden md:block",
                view === 'details' ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
              )}
            >
              Details
            </button>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 bg-sky-500 text-black rounded-xl flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'calendar' ? (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-sm"
            >
              <div className="p-8 border-b border-[#262626] flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-neutral-400 hover:text-white hover:border-sky-500/50 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:border-sky-500/50 transition-all"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-neutral-400 hover:text-white hover:border-sky-500/50 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-[#262626]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-black text-neutral-500 uppercase tracking-widest border-r border-[#262626] last:border-r-0">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day[0]}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const pnl = getDayPnL(day);
                  const dayTrades = getDayTrades(day);
                  const isCurrentMonth = format(day, 'M') === format(currentMonth, 'M');
                  
                  return (
                    <div 
                      key={day.toString()} 
                      className={cn(
                        "min-h-[80px] sm:min-h-[140px] p-2 sm:p-4 border-r border-b border-[#262626] transition-all hover:bg-[#1f1f1f]/50 group relative",
                        !isCurrentMonth && "opacity-20 grayscale",
                        (i + 1) % 7 === 0 && "border-r-0"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1 sm:mb-4">
                        <span className={cn(
                          "text-[10px] sm:text-xs font-black",
                          isToday(day) ? "w-5 h-5 sm:w-6 sm:h-6 bg-sky-500 text-black rounded-full flex items-center justify-center" : "text-neutral-500"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {pnl !== 0 && (
                          <span className={cn(
                            "text-[8px] sm:text-[10px] font-black tracking-tighter",
                            pnl > 0 ? "text-sky-400" : "text-neutral-500"
                          )}>
                            {pnl > 0 ? '+' : ''}<span className="hidden sm:inline">{formatCurrency(pnl)}</span>
                            <span className="sm:hidden">{pnl > 0 ? 'W' : 'L'}</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 sm:space-y-1">
                        {dayTrades.slice(0, 2).map(trade => (
                          <div 
                            key={trade.id}
                            className={cn(
                              "px-1 sm:px-2 py-0.5 rounded text-[7px] sm:text-[9px] font-bold truncate",
                              trade.pnl > 0 ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-neutral-500/5 text-neutral-500 border border-[#262626]"
                            )}
                          >
                            {trade.asset}
                          </div>
                        ))}
                        {dayTrades.length > 2 && (
                          <div className="text-[7px] sm:text-[9px] font-bold text-neutral-600 pl-1">
                            + {dayTrades.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : view === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {trades.length === 0 ? (
                <div className="bg-[#141414] border border-[#262626] rounded-3xl p-12 text-center space-y-4">
                  <Book className="w-12 h-12 text-neutral-700 mx-auto" />
                  <p className="text-neutral-500 font-bold">No trades found for this account.</p>
                </div>
              ) : (
                trades.map(trade => (
                  <div 
                    key={trade.id}
                    className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-sky-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        trade.pnl > 0 ? "bg-sky-500/10 text-sky-400" : "bg-neutral-500/10 text-neutral-500"
                      )}>
                        {trade.pnl > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-white">{trade.asset}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                            trade.pnl > 0 ? "bg-sky-500/10 text-sky-400" : "bg-neutral-500/10 text-neutral-400"
                          )}>
                            {trade.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(trade.entry_date), 'MMM dd, HH:mm')}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                            <Tag className="w-3.5 h-3.5" />
                            {trade.contract_size} contracts
                          </div>
                          {trade.strategy && (
                            <div className="flex items-center gap-1.5 text-xs text-sky-500/60 font-black uppercase tracking-widest">
                              <Target className="w-3.5 h-3.5" />
                              {trade.strategy.strategy_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">PnL</p>
                        <p className={cn(
                          "text-xl font-black tracking-tighter",
                          trade.pnl > 0 ? "text-sky-400" : "text-neutral-200"
                        )}>
                          {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                        <p className="text-[10px] font-bold text-neutral-600">{formatPercent(trade.pnl_percent)}</p>
                      </div>

                      <div className="flex gap-2">
                        {trade.status === 'OPEN' && (
                          <button 
                            onClick={() => handleCloseTrade(trade)}
                            className="p-2 text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                            title="Close Trade"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditTrade(trade)}
                          className="p-2 text-neutral-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all"
                          title="Edit Trade"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete Trade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden"
            >
              {trades.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <Book className="w-12 h-12 text-neutral-700 mx-auto" />
                  <p className="text-neutral-500 font-bold">No trades found for this account.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#262626] bg-[#1a1a1a]">
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Asset</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Direction</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Entry</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Exit</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">PnL</th>
                        <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map(trade => {
                        const exitsList = trade.trade_exits && trade.trade_exits.length > 0 
                          ? trade.trade_exits 
                          : [{ 
                              id: `temp-${trade.id}`, 
                              closed_contract: trade.contract_size, 
                              exit_price: trade.exit_price || 0, 
                              exit_status: trade.status === 'OPEN' ? 'OPEN' : 'CLOSED',
                              exit_reason: null,
                              exit_timestamp: trade.exit_date || trade.entry_date,
                              pnl_for_this_exit: trade.pnl,
                              commission_for_this_exit: 0
                            }];

                        const totalPnl = exitsList.reduce((acc, e) => acc + (e.pnl_for_this_exit || 0), 0);
                        const totalQty = exitsList.reduce((acc, e) => acc + (Number(e.closed_contract) || 0), 0);
                        const isExpanded = expandedTrades.has(trade.id);

                        return (
                          <React.Fragment key={trade.id}>
                            {/* Trade Summary Row */}
                            <tr 
                              className="bg-[#1a1a1a] border-t-2 border-[#262626] group cursor-pointer hover:bg-[#1f1f1f] transition-all"
                              onClick={() => toggleTradeExpansion(trade.id)}
                            >
                              <td className="px-6 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
                                  {format(new Date(trade.entry_date), 'MM/dd/yyyy')}
                                </div>
                                <div className="text-[8px] text-neutral-600 mt-0.5 ml-5">{format(new Date(trade.entry_date), 'h:mm:ss a')}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-white">{trade.asset}</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">Trade ID: {trade.id.slice(0, 8)}</span>
                                    {trade.strategy && (
                                      <>
                                        <span className="text-[8px] text-neutral-700">•</span>
                                        <span className="text-[8px] text-sky-500/60 font-black uppercase tracking-widest">{trade.strategy.strategy_name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                                  trade.type === 'LONG' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                )}>
                                  {trade.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-400"
                                )}>
                                  {trade.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-black text-white">{trade.entry_price.toLocaleString()}</td>
                              <td className="px-6 py-4 text-xs font-black text-neutral-500">-</td>
                              <td className="px-6 py-4 text-xs font-black text-white">{totalQty} Total</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "text-sm font-black",
                                  totalPnl > 0 ? "text-sky-400" : "text-neutral-400"
                                )}>
                                  {totalPnl > 0 ? '+' : ''}{formatCurrency(totalPnl)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                                {exitsList.length} Exits
                              </td>
                            </tr>
                            
                            {/* Individual Exit Rows */}
                            <AnimatePresence>
                              {isExpanded && exitsList.map((exit, index) => (
                                <motion.tr 
                                  key={`${trade.id}-${index}`}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="border-b border-[#262626]/30 bg-[#0a0a0a]/20 hover:bg-[#1f1f1f]/30 transition-all"
                                >
                                  <td className="px-6 py-3 text-[9px] font-bold text-neutral-600 pl-10">
                                    {exit.exit_timestamp ? format(new Date(exit.exit_timestamp), 'h:mm:ss a') : '-'}
                                  </td>
                                  <td className="px-6 py-3 text-[9px] font-bold text-neutral-700 italic">Partial Exit</td>
                                  <td className="px-6 py-3"></td>
                                  <td className="px-6 py-3">
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                      exit.exit_status === 'OPEN' ? "bg-sky-500/10 text-sky-400" : "bg-neutral-600/10 text-neutral-500"
                                    )}>
                                      {exit.exit_status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-[10px] font-bold text-neutral-700">{trade.entry_price.toLocaleString()}</td>
                                  <td className="px-6 py-3 text-[10px] font-bold text-white">{exit.exit_price ? exit.exit_price.toLocaleString() : '-'}</td>
                                  <td className="px-6 py-3 text-[10px] font-bold text-neutral-500">
                                    -{exit.closed_contract}
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className={cn(
                                      "text-[10px] font-black",
                                      (exit.pnl_for_this_exit || 0) > 0 ? "text-sky-400/70" : "text-neutral-500"
                                    )}>
                                      {(exit.pnl_for_this_exit || 0) > 0 ? '+' : ''}{formatCurrency(exit.pnl_for_this_exit || 0)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-[9px] text-neutral-600 font-medium">
                                    {exit.exit_reason || '-'}
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add Trade Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 overflow-y-auto bg-black/80 backdrop-blur-sm py-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#141414] border border-[#262626] rounded-[40px] p-12 shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {editingTradeId ? 'Edit Trade Log' : 'Add Trade Log'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                    setEditingTradeId(null);
                  }}
                  className="p-3 bg-[#1f1f1f] rounded-2xl text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3 relative">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Asset</label>
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                            className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-left flex items-center justify-between"
                          >
                            {asset}
                            <ChevronDown className={cn("w-5 h-5 text-neutral-500 transition-transform", isAssetDropdownOpen && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {isAssetDropdownOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#262626] rounded-2xl shadow-2xl z-[110] overflow-hidden"
                              >
                                {['MNQ', 'NQ', 'MES', 'ES', 'MGC', 'GC'].map((a) => (
                                  <button
                                    key={a}
                                    type="button"
                                    onClick={() => {
                                      setAsset(a as any);
                                      setIsAssetDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full px-7 py-4 text-left text-sm font-bold hover:bg-[#262626] transition-all",
                                      asset === a ? "text-sky-400 bg-sky-500/5" : "text-neutral-400"
                                    )}
                                  >
                                    {a}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-3 relative">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Strategy</label>
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setIsStrategyDropdownOpen(!isStrategyDropdownOpen)}
                            className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-left flex items-center justify-between"
                          >
                            <span className="truncate">
                              {strategies.find(s => s.strategy_id === strategyId)?.strategy_name || 'Select Strategy'}
                            </span>
                            <ChevronDown className={cn("w-5 h-5 text-neutral-500 transition-transform", isStrategyDropdownOpen && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {isStrategyDropdownOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#262626] rounded-2xl shadow-2xl z-[110] overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStrategyId(null);
                                    setIsStrategyDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full px-7 py-4 text-left text-sm font-bold hover:bg-[#262626] transition-all",
                                    !strategyId ? "text-sky-400 bg-sky-500/5" : "text-neutral-400"
                                  )}
                                >
                                  None
                                </button>
                                {strategies.map((s) => (
                                  <button
                                    key={s.strategy_id}
                                    type="button"
                                    onClick={() => {
                                      setStrategyId(s.strategy_id);
                                      setIsStrategyDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full px-7 py-4 text-left text-sm font-bold hover:bg-[#262626] transition-all",
                                      strategyId === s.strategy_id ? "text-sky-400 bg-sky-500/5" : "text-neutral-400"
                                    )}
                                  >
                                    {s.strategy_name}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Trade Date</label>
                        <div className="relative">
                          <DatePicker
                            selected={entryDate ? parseISO(entryDate) : new Date()}
                            onChange={(date) => setEntryDate(date ? date.toISOString() : '')}
                            dateFormat="yyyy-MM-dd"
                            className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold"
                            calendarClassName="bg-[#1f1f1f] border-[#262626] text-white rounded-2xl shadow-2xl"
                            popperClassName="z-[150]"
                            wrapperClassName="w-full"
                          />
                          <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Trade Type</label>
                        <div className="flex bg-[#0a0a0a] border border-[#262626] rounded-2xl p-1.5 opacity-80 cursor-not-allowed">
                          <div
                            className={cn(
                              "flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center",
                              type === 'LONG' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-neutral-500"
                            )}
                          >
                            Long
                          </div>
                          <div
                            className={cn(
                              "flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center",
                              type === 'SHORT' ? "bg-rose-500 text-black shadow-lg shadow-rose-500/20" : "text-neutral-500"
                            )}
                          >
                            Short
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-500 italic ml-1">Auto-detected from TP/SL</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Contract Size</label>
                        <input 
                          type="number"
                          value={contractSize}
                          onChange={(e) => setContractSize(e.target.value)}
                          placeholder="1"
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Entry Price</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={entryPrice}
                          onChange={(e) => setEntryPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Take Profit</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Stop Loss</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                        />
                      </div>
                    </div>

                    {/* Exits Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Dynamic Exit Strategy</label>
                        <button 
                          type="button"
                          onClick={handleAddExit}
                          className="w-10 h-10 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center hover:bg-sky-500 hover:text-black transition-all"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {exits.map((exit, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6 bg-[#0a0a0a] border border-[#262626] rounded-3xl relative group">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Closed Qty</label>
                              <input 
                                type="number"
                                value={exit.closed_contract}
                                onChange={(e) => handleExitChange(index, 'closed_contract', e.target.value)}
                                className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white text-sm font-bold focus:border-sky-500/50 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Exit Price</label>
                              <input 
                                type="number"
                                step="0.01"
                                value={exit.exit_price}
                                onChange={(e) => handleExitChange(index, 'exit_price', e.target.value)}
                                className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white text-sm font-bold focus:border-sky-500/50 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2 relative">
                              <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Status</label>
                              <button 
                                type="button"
                                onClick={() => setOpenExitDropdown(openExitDropdown?.index === index && openExitDropdown?.type === 'status' ? null : { index, type: 'status' })}
                                className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white text-sm font-bold focus:border-sky-500/50 focus:outline-none flex items-center justify-between"
                              >
                                {exit.exit_status}
                                <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform", openExitDropdown?.index === index && openExitDropdown?.type === 'status' && "rotate-180")} />
                              </button>
                              
                              <AnimatePresence>
                                {openExitDropdown?.index === index && openExitDropdown?.type === 'status' && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#262626] rounded-xl shadow-2xl z-[120] overflow-hidden"
                                  >
                                    {['TP', 'SL', 'Cut lose', 'Partial TP', 'Move BE'].map((status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() => {
                                          handleExitChange(index, 'exit_status', status);
                                          setOpenExitDropdown(null);
                                        }}
                                        className={cn(
                                          "w-full px-4 py-3 text-left text-xs font-bold hover:bg-[#262626] transition-all",
                                          exit.exit_status === status ? "text-sky-400 bg-sky-500/5" : "text-neutral-400"
                                        )}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-2 relative">
                              <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Reason</label>
                              <button 
                                type="button"
                                disabled={exit.exit_status === 'TP' || exit.exit_status === 'SL'}
                                onClick={() => setOpenExitDropdown(openExitDropdown?.index === index && openExitDropdown?.type === 'reason' ? null : { index, type: 'reason' })}
                                className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white text-sm font-bold focus:border-sky-500/50 focus:outline-none flex items-center justify-between disabled:opacity-20"
                              >
                                <span className="truncate">{exit.exit_reason || 'Select Reason'}</span>
                                <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform", openExitDropdown?.index === index && openExitDropdown?.type === 'reason' && "rotate-180")} />
                              </button>

                              <AnimatePresence>
                                {openExitDropdown?.index === index && openExitDropdown?.type === 'reason' && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#262626] rounded-xl shadow-2xl z-[120] overflow-hidden"
                                  >
                                    {['Structural Break', 'Psychology Move'].map((reason) => (
                                      <button
                                        key={reason}
                                        type="button"
                                        onClick={() => {
                                          handleExitChange(index, 'exit_reason', reason);
                                          setOpenExitDropdown(null);
                                        }}
                                        className={cn(
                                          "w-full px-4 py-3 text-left text-xs font-bold hover:bg-[#262626] transition-all",
                                          exit.exit_reason === reason ? "text-sky-400 bg-sky-500/5" : "text-neutral-400"
                                        )}
                                      >
                                        {reason}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="flex items-end pb-1">
                              <button 
                                type="button"
                                onClick={() => handleRemoveExit(index)}
                                className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {exits.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-[#141414] border border-[#262626] rounded-3xl">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 text-neutral-500">Remaining</span>
                            <span className={cn(
                              "text-sm font-bold",
                              (parseFloat(contractSize) - exits.reduce((acc, curr) => acc + (parseFloat(curr.closed_contract) || 0), 0)) > 0 
                                ? "text-sky-400" 
                                : "text-neutral-500"
                            )}>
                              {(parseFloat(contractSize) - exits.reduce((acc, curr) => acc + (parseFloat(curr.closed_contract) || 0), 0)).toFixed(2)} Contracts
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 text-neutral-500">Estimated Net PnL</span>
                            <span className={cn(
                              "text-sm font-bold",
                              exits.reduce((acc, curr) => {
                                const entry = parseFloat(entryPrice) || 0;
                                const exit = parseFloat(curr.exit_price) || 0;
                                const qty = parseFloat(curr.closed_contract) || 0;
                                const mult = multipliers[asset] || 1;
                                const comm = (selectedAccount?.commission || 0) * qty;
                                const pnl = type === 'LONG' ? (exit - entry) * qty * mult : (entry - exit) * qty * mult;
                                return acc + (pnl - comm);
                              }, 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {formatCurrency(exits.reduce((acc, curr) => {
                                const entry = parseFloat(entryPrice) || 0;
                                const exit = parseFloat(curr.exit_price) || 0;
                                const qty = parseFloat(curr.closed_contract) || 0;
                                const mult = multipliers[asset] || 1;
                                const comm = (selectedAccount?.commission || 0) * qty;
                                const pnl = type === 'LONG' ? (exit - entry) * qty * mult : (entry - exit) * qty * mult;
                                return acc + (pnl - comm);
                              }, 0))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Entry Record Screenshot</label>
                      <div 
                        onPaste={handlePaste}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="w-full min-h-[200px] bg-[#0a0a0a] border-2 border-dashed border-[#262626] rounded-[32px] flex flex-col items-center justify-center p-8 transition-all hover:border-sky-500/30 group cursor-pointer relative overflow-hidden"
                      >
                        {screenshot ? (
                          <>
                            <img src={screenshot} alt="Trade Screenshot" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <div className="relative z-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 border border-white/10">
                              <ImageIcon className="w-5 h-5 text-sky-500" />
                              <span className="text-xs font-bold text-white">Image Uploaded</span>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}
                                className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-sky-500/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8 text-sky-500/40" />
                            </div>
                            <p className="text-xs font-bold text-neutral-500 text-center leading-relaxed">
                              Drag & drop image here or <span className="text-sky-500">Ctrl + V</span> to paste<br/>
                              <span className="text-[10px] opacity-50 uppercase tracking-widest mt-2 block">Supports PNG, JPG</span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Strategy Fields Merged */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#262626]">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Entry Context</label>
                        <textarea 
                          value={entryContext}
                          onChange={(e) => setEntryContext(e.target.value)}
                          placeholder="Describe market conditions at entry..."
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Market Regime</label>
                        <input 
                          type="text"
                          value={marketRegime}
                          onChange={(e) => setMarketRegime(e.target.value)}
                          placeholder="e.g. Trending, Range-bound"
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Psychology Status</label>
                        <textarea 
                          value={psychologyStatus}
                          onChange={(e) => setPsychologyStatus(e.target.value)}
                          placeholder="How were you feeling during the trade?"
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Fundamental Context</label>
                        <textarea 
                          value={fundamentalContext}
                          onChange={(e) => setFundamentalContext(e.target.value)}
                          placeholder="Any news or macro factors?"
                          className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>

                {formError && (
                  <div className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-6 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 bg-[#1f1f1f] text-neutral-400 rounded-3xl hover:bg-[#262626] transition-all flex items-center justify-center border border-[#262626]"
                  >
                    <X className="w-7 h-7" />
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-5 bg-sky-500 text-black rounded-3xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="w-7 h-7 border-3 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-7 h-7" />
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
