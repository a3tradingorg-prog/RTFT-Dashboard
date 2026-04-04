import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Trade, TradingAccount } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreVertical,
  Trash2,
  Edit2,
  X,
  Check,
  Calendar,
  Wallet
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ScrollReveal } from '../components/ScrollReveal';
import { motion, AnimatePresence } from 'motion/react';

export default function Trades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newTrade, setNewTrade] = useState({
    account_id: '',
    asset: '' as any,
    type: 'LONG' as 'LONG' | 'SHORT',
    entry_price: '',
    contract_size: '',
    entry_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  useEffect(() => {
    if (!user) return;
    fetchTrades();
    fetchAccounts();

    // Subscribe to realtime changes for trades
    const channel = supabase
      .channel('trades_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trades',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchTrades();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user?.id);
    
    if (!error && data) {
      setAccounts(data);
      if (data.length > 0) {
        setNewTrade(prev => ({ ...prev, account_id: data[0].id }));
      }
    }
  };

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      if (data) {
        const uniqueTrades = Array.from(new Map(data.map((t: any) => [t.id, t])).values());
        setTrades(uniqueTrades as Trade[]);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('trades').insert([{
        user_id: user.id,
        account_id: newTrade.account_id,
        asset: newTrade.asset,
        type: newTrade.type,
        entry_price: parseFloat(newTrade.entry_price),
        exit_price: 0, // Providing default to satisfy NOT NULL constraint
        contract_size: parseFloat(newTrade.contract_size),
        entry_date: new Date(newTrade.entry_date).toISOString(),
        status: 'OPEN',
        notes: newTrade.notes
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewTrade({
        account_id: accounts[0]?.id || '',
        asset: '' as any,
        type: 'LONG',
        entry_price: '',
        contract_size: '',
        entry_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: ''
      });
      fetchTrades();
    } catch (error) {
      console.error('Error adding trade:', error);
    }
  };

  const handleCloseTrade = async (trade: Trade) => {
    const exitPrice = window.prompt('Enter exit price:');
    if (!exitPrice) return;

    const price = parseFloat(exitPrice);
    const multipliers: Record<string, number> = {
      'MNQ': 2, 'NQ': 20,
      'MES': 5, 'ES': 50,
      'MGC': 10, 'GC': 100
    };
    const multiplier = multipliers[trade.asset] || 1;

    const pnl = trade.type === 'LONG' 
      ? (price - trade.entry_price) * trade.contract_size * multiplier
      : (trade.entry_price - price) * trade.contract_size * multiplier;
    
    const pnlPercent = trade.type === 'LONG'
      ? ((price - trade.entry_price) / trade.entry_price) * 100
      : ((trade.entry_price - price) / trade.entry_price) * 100;

    const { error } = await supabase
      .from('trades')
      .update({
        exit_price: price,
        exit_date: new Date().toISOString(),
        status: 'CLOSED',
        pnl,
        pnl_percent: pnlPercent
      })
      .eq('id', trade.id);

    if (!error) {
      fetchTrades();
    }
  };

  const handleDeleteTrade = async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (!error) fetchTrades();
  };

  const filteredTrades = trades.filter(t => 
    t.asset.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
            <p className="text-neutral-400 mt-1">Manage and track your active and past trades.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            Add New Trade
          </motion.button>
        </div>
      </ScrollReveal>

      {/* Filters & Search */}
      <ScrollReveal delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search by symbol (e.g. BTC, AAPL)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-neutral-400 hover:text-white transition-all"
          >
            <Filter className="w-5 h-5" />
            Filters
          </motion.button>
        </div>
      </ScrollReveal>

      {/* Trades Table */}
      <ScrollReveal delay={0.2}>
        <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1f1f1f] text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Entry</th>
                  <th className="px-6 py-4">Exit</th>
                  <th className="px-6 py-4">PnL</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredTrades.map((trade, index) => (
                  <motion.tr 
                    key={trade.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-[#1a1a1a] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{trade.asset}</span>
                        <span className="text-xs text-neutral-500">{format(new Date(trade.entry_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase",
                        trade.type === 'LONG' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{formatCurrency(trade.entry_price)}</span>
                        <span className="text-xs text-neutral-500">{trade.contract_size} units</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">
                        {trade.exit_price ? formatCurrency(trade.exit_price) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {trade.status === 'CLOSED' ? (
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-sm font-bold",
                            (trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {formatCurrency(trade.pnl || 0)}
                          </span>
                          <span className={cn(
                            "text-xs",
                            (trade.pnl_percent || 0) >= 0 ? "text-green-500/70" : "text-red-500/70"
                          )}>
                            {formatPercent(trade.pnl_percent || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 italic">Running...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        trade.status === 'OPEN' ? "bg-blue-500/10 text-blue-500" : "bg-neutral-500/10 text-neutral-500"
                      )}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {trade.status === 'OPEN' && (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCloseTrade(trade)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Close Trade"
                          >
                            <Check className="w-4 h-4" />
                          </motion.button>
                        )}
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Trade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredTrades.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 italic">
                      No trades found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* Add Trade Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#262626] flex items-center justify-between">
                <h2 className="text-xl font-bold">Add New Trade</h2>
                <motion.button 
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsModalOpen(false)} 
                  className="text-neutral-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              <form onSubmit={handleAddTrade} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Account</label>
                    <select 
                      required
                      value={newTrade.account_id}
                      onChange={(e) => setNewTrade({...newTrade, account_id: e.target.value})}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.account_size})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Asset</label>
                    <select 
                      required
                      value={newTrade.asset}
                      onChange={(e) => setNewTrade({...newTrade, asset: e.target.value as any})}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                    >
                      <option value="">Select Asset</option>
                      <option value="MNQ">MNQ</option>
                      <option value="NQ">NQ</option>
                      <option value="MES">MES</option>
                      <option value="ES">ES</option>
                      <option value="MGC">MGC</option>
                      <option value="GC">GC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Type</label>
                    <select 
                      value={newTrade.type}
                      onChange={(e) => setNewTrade({...newTrade, type: e.target.value as any})}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                    >
                      <option value="LONG">LONG</option>
                      <option value="SHORT">SHORT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Entry Price</label>
                    <input 
                      required
                      type="number" 
                      step="0.00000001"
                      value={newTrade.entry_price}
                      onChange={(e) => setNewTrade({...newTrade, entry_price: e.target.value})}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Contract Size</label>
                    <input 
                      required
                      type="number" 
                      step="0.00000001"
                      value={newTrade.contract_size}
                      onChange={(e) => setNewTrade({...newTrade, contract_size: e.target.value})}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Date</label>
                    <div className="relative">
                      <DatePicker
                        selected={newTrade.entry_date ? parseISO(newTrade.entry_date) : new Date()}
                        onChange={(date) => setNewTrade({...newTrade, entry_date: date ? date.toISOString() : ''})}
                        dateFormat="yyyy-MM-dd"
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none font-bold"
                        calendarClassName="bg-[#1f1f1f] border-[#262626] text-white rounded-xl shadow-2xl"
                        popperClassName="z-[150]"
                        wrapperClassName="w-full"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Notes</label>
                    <textarea 
                      value={newTrade.notes}
                      onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 outline-none resize-none"
                    />
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-400 transition-all mt-4"
                >
                  Save Trade
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
