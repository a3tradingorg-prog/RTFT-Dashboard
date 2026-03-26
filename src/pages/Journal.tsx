import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { TradingAccount, Trade, DailyPnL } from '../types';
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
  DollarSign
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
  endOfWeek
} from 'date-fns';
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
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [exitDate, setExitDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState('');

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
    if (!symbol || !entryPrice || !exitPrice || !quantity || !selectedAccountId) {
      setFormError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = parseFloat(quantity);
    
    // Calculate PnL
    // For Futures (which this app seems to target based on MNQ/NQ/ES symbols):
    // PnL = (Exit - Entry) * Qty * Multiplier
    // For simplicity, we'll assume a multiplier of 1 or handle it based on symbol
    // But the user didn't specify multipliers, so we'll do simple (Exit-Entry)*Qty for now
    // and subtract commission.
    
    const multiplier = symbol.includes('NQ') ? 20 : symbol.includes('ES') ? 50 : symbol.includes('GC') ? 100 : 1;
    const grossPnl = type === 'LONG' ? (exit - entry) * qty * multiplier : (entry - exit) * qty * multiplier;
    const totalCommission = (selectedAccount?.commission || 0) * qty;
    const netPnl = grossPnl - totalCommission;
    
    const tradeData = {
      account_id: selectedAccountId,
      symbol: symbol.toUpperCase(),
      type,
      entry_price: entry,
      exit_price: exit,
      quantity: qty,
      pnl: netPnl,
      pnl_percent: (netPnl / (selectedAccount?.initial_balance || 1)) * 100,
      status: 'CLOSED',
      entry_date: new Date(entryDate).toISOString(),
      exit_date: new Date(exitDate).toISOString(),
      notes,
      user_id: user?.id
    };

    const { error } = await supabase.from('trades').insert([tradeData]);

    if (error) {
      setFormError(error.message);
    } else {
      // Update account balance
      const newBalance = (selectedAccount?.current_balance || 0) + netPnl;
      await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
      
      // Update daily PnL
      const dateStr = format(new Date(exitDate), 'yyyy-MM-dd');
      const existingPnL = dailyPnls.find(p => p.date === dateStr);
      if (existingPnL) {
        await supabase.from('daily_pnl').update({ pnl: existingPnL.pnl + netPnl }).eq('id', existingPnL.id);
      } else {
        await supabase.from('daily_pnl').insert([{ account_id: selectedAccountId, date: dateStr, pnl: netPnl, user_id: user?.id }]);
      }

      setIsModalOpen(false);
      resetForm();
      fetchJournalData();
      fetchAccounts(); // Refresh balance
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSymbol('');
    setType('LONG');
    setEntryPrice('');
    setExitPrice('');
    setQuantity('1');
    setEntryDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setExitDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setNotes('');
    setFormError('');
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
          <select 
            value={selectedAccountId || ''} 
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-6 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-sm font-bold text-white focus:border-sky-500/50 focus:outline-none transition-all"
          >
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>

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
                            {trade.symbol} • {trade.type}
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
                          <h4 className="text-lg font-bold text-white">{trade.symbol}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                            trade.type === 'LONG' ? "bg-sky-500/10 text-sky-400" : "bg-neutral-500/10 text-neutral-400"
                          )}>
                            {trade.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(trade.entry_date), 'MMM dd, HH:mm')}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                            <Tag className="w-3.5 h-3.5" />
                            {trade.quantity} units
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-3xl p-8 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Add New Trade</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Symbol</label>
                    <input 
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      placeholder="e.g. NQ, MNQ, ES"
                      className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Type</label>
                    <div className="flex bg-[#0a0a0a] border border-[#262626] rounded-2xl p-1">
                      <button 
                        type="button"
                        onClick={() => setType('LONG')}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                          type === 'LONG' ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
                        )}
                      >
                        LONG
                      </button>
                      <button 
                        type="button"
                        onClick={() => setType('SHORT')}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                          type === 'SHORT' ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
                        )}
                      >
                        SHORT
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Entry Price</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Exit Price</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={exitPrice}
                      onChange={(e) => setExitPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Entry Date</label>
                    <input 
                      type="datetime-local"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Exit Date</label>
                    <input 
                      type="datetime-local"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Trade plan, emotions, mistakes..."
                    className="w-full px-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700 min-h-[100px]"
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-[#1f1f1f] text-neutral-400 rounded-2xl hover:bg-[#262626] transition-all flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-sky-500 text-black rounded-2xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-6 h-6" />
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
