import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { TradingAccount, Trade, DailyPnL, TradeExit } from '../types';
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

export default function Journal() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
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
  const [stop_loss, setStopLoss] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  
  // Dynamic Exits
  const [exits, setExits] = useState<{
    closed_contract: string;
    exit_price: string;
    exit_status: TradeExit['exit_status'];
    exit_reason: TradeExit['exit_reason'];
  }[]>([]);

  // Strategy Tab
  const [entryContext, setEntryContext] = useState('');
  const [marketRegime, setMarketRegime] = useState('');
  const [psychologyStatus, setPsychologyStatus] = useState('');
  const [fundamentalContext, setFundamentalContext] = useState('');

  // Automatic LONG/SHORT detection
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const tp = parseFloat(takeProfit);
    const sl = parseFloat(stop_loss);

    if (!isNaN(entry) && !isNaN(tp) && !isNaN(sl)) {
      if (tp > entry && sl < entry) {
        setType('LONG');
      } else if (tp < entry && sl > entry) {
        setType('SHORT');
      }
    }
  }, [entryPrice, takeProfit, stop_loss]);

  // Dropdown States
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [openExitDropdown, setOpenExitDropdown] = useState<{ index: number, type: 'status' | 'reason' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
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
      fetchJournalData();
    }
  }, [selectedAccountId]);

  const fetchJournalData = async () => {
    setLoading(true);
    const [tradesRes, dailyPnlsRes] = await Promise.all([
      supabase
        .from('trades')
        .select('*')
        .eq('account_id', selectedAccountId)
        .order('entry_date', { ascending: false }),
      supabase
        .from('daily_pnl')
        .select('*')
        .eq('account_id', selectedAccountId)
    ]);

    if (tradesRes.data) setTrades(tradesRes.data);
    if (dailyPnlsRes.data) setDailyPnls(dailyPnlsRes.data);
    setLoading(false);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

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
    
    // Multipliers
    const multipliers: Record<string, number> = {
      'MNQ': 2, 'NQ': 20,
      'MES': 5, 'ES': 50,
      'MGC': 10, 'GC': 100
    };
    const multiplier = multipliers[asset] || 1;

    // Calculate PnL from exits
    let totalNetPnl = 0;
    let totalClosedQty = 0;
    let weightedExitPriceSum = 0;

    const processedExits = exits.map(exit => {
      const exitP = parseFloat(exit.exit_price);
      const exitQty = parseFloat(exit.closed_contract);
      totalClosedQty += exitQty;
      weightedExitPriceSum += (exitP * exitQty);
      
      const exitPnl = type === 'LONG' 
        ? (exitP - entry) * exitQty * multiplier
        : (entry - exitP) * exitQty * multiplier;
      const commission = (selectedAccount?.commission || 0) * exitQty;
      
      totalNetPnl += (exitPnl - commission);
      
      return {
        closed_contract: exitQty,
        exit_price: exitP,
        exit_status: exit.exit_status,
        exit_reason: exit.exit_reason
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
      exit_price: avgExitPrice, // Providing avgExitPrice to satisfy NOT NULL constraint
      take_profit: parseFloat(takeProfit) || 0,
      stop_loss: parseFloat(stop_loss) || 0,
      screenshot_url: screenshot,
      entry_context: entryContext,
      market_regime: marketRegime,
      psychology_status: psychologyStatus,
      fundamental_context: fundamentalContext,
      pnl: totalNetPnl,
      pnl_percent: (totalNetPnl / (selectedAccount?.initial_balance || 1)) * 100,
      status: totalClosedQty >= totalQty ? 'CLOSED' : 'OPEN',
      exit_date: totalClosedQty >= totalQty ? new Date().toISOString() : null,
    };

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert([tradeData])
      .select()
      .single();

    if (tradeError) {
      setFormError(tradeError.message);
    } else if (trade) {
      // Insert exits
      if (processedExits.length > 0) {
        const exitsWithId = processedExits.map(e => ({ ...e, trade_id: trade.id }));
        await supabase.from('trade_exits').insert(exitsWithId);
      }

      // Update account balance
      const newBalance = (selectedAccount?.current_balance || 0) + totalNetPnl;
      await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
      
      // Update daily PnL
      const dateStr = format(new Date(entryDate), 'yyyy-MM-dd');
      const existingPnL = dailyPnls.find(p => p.date === dateStr);
      if (existingPnL) {
        await supabase.from('daily_pnl').update({ pnl: existingPnL.pnl + totalNetPnl }).eq('id', existingPnL.id);
      } else {
        await supabase.from('daily_pnl').insert([{ account_id: selectedAccountId, date: dateStr, pnl: totalNetPnl, user_id: user?.id }]);
      }

      setIsModalOpen(false);
      resetForm();
      fetchJournalData();
      fetchAccounts();
    }
    setIsSubmitting(false);
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
    setFormError('');
  };

  const handleAddExit = () => {
    setExits([...exits, { closed_contract: '1', exit_price: '', exit_status: 'TP', exit_reason: null }]);
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
          <div className="relative">
            <button 
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="px-6 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-sm font-bold text-white focus:border-sky-500/50 focus:outline-none transition-all flex items-center gap-3 min-w-[200px]"
            >
              <Wallet className="w-4 h-4 text-sky-500" />
              {selectedAccount?.name || 'Select Account'}
              <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", isAccountDropdownOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {isAccountDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#262626] rounded-2xl shadow-2xl z-[110] overflow-hidden"
                >
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-6 py-4 text-left text-sm font-bold hover:bg-[#262626] transition-all",
                        selectedAccountId === account.id ? "text-sky-400 bg-sky-500/5" : "text-neutral-400"
                      )}
                    >
                      {account.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                    {day}
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
                        "min-h-[140px] p-4 border-r border-b border-[#262626] transition-all hover:bg-[#1f1f1f]/50 group relative",
                        !isCurrentMonth && "opacity-20 grayscale",
                        (i + 1) % 7 === 0 && "border-r-0"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={cn(
                          "text-xs font-black",
                          isToday(day) ? "w-6 h-6 bg-sky-500 text-black rounded-full flex items-center justify-center" : "text-neutral-500"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {pnl !== 0 && (
                          <span className={cn(
                            "text-[10px] font-black tracking-tighter",
                            pnl > 0 ? "text-sky-400" : "text-neutral-500"
                          )}>
                            {pnl > 0 ? '+' : ''}{formatCurrency(pnl)}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayTrades.slice(0, 3).map(trade => (
                          <div 
                            key={trade.id}
                            className={cn(
                              "px-2 py-1 rounded text-[9px] font-bold truncate",
                              trade.pnl > 0 ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-neutral-500/5 text-neutral-500 border border-[#262626]"
                            )}
                          >
                            {trade.asset} • {trade.type}
                          </div>
                        ))}
                        {dayTrades.length > 3 && (
                          <div className="text-[9px] font-bold text-neutral-600 pl-1">
                            + {dayTrades.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
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
                        <button className="p-2 text-neutral-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
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
                <h2 className="text-3xl font-bold text-white tracking-tight">Add Trade Log</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
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
                          value={stop_loss}
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
                    </div>                    <div className="space-y-3">
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
