import React, { useEffect, useState } from 'react';
import { 
  Brain, 
  Target, 
  Zap, 
  Shield, 
  TrendingUp, 
  BarChart2, 
  Plus, 
  X, 
  ChevronDown, 
  Check, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Clock,
  Filter,
  Search,
  Layout,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Strategy, Trade } from '../types';
import { format } from 'date-fns';
import { useClickOutside } from '../hooks/useClickOutside';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { ScrollReveal } from '../components/ScrollReveal';

const ASSETS = ['MNQ', 'NQ', 'MES', 'ES', 'MGC', 'GC'];
const TIMEFRAMES = ['1min', '5min', '15min', '1hr', '4hr', 'Daily', 'Weekly'];
const STATUSES = ['Active', 'Archived', 'Under Review'];

export default function StrategyPage() {
  // ... existing state ...
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Entry Confirmation
  const [contextSetup, setContextSetup] = useState('');
  const [marketRegime, setMarketRegime] = useState('');
  const [fundamentalSituation, setFundamentalSituation] = useState('');
  
  // Exit Strategy
  const [partialCloseLogic, setPartialCloseLogic] = useState('');
  const [cutLossSLLogic, setCutLossSLLogic] = useState('');
  const [moveSLBEStructure, setMoveSLBEStructure] = useState('');
  const [takeProfitTargets, setTakeProfitTargets] = useState('');
  
  // Psychology Status
  const [calmFlowState, setCalmFlowState] = useState('');
  const [fearAnxiety, setFearAnxiety] = useState('');
  const [greedFOMO, setGreedFOMO] = useState('');
  const [exhaustionTilt, setExhaustionTilt] = useState('');

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const [status, setStatus] = useState<Strategy['status']>('Active');

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isRegimeDropdownOpen, setIsRegimeDropdownOpen] = useState(false);

  const assetDropdownRef = useClickOutside(() => setIsAssetDropdownOpen(false));
  const timeframeDropdownRef = useClickOutside(() => setIsTimeframeDropdownOpen(false));
  const statusDropdownRef = useClickOutside(() => setIsStatusDropdownOpen(false));
  const regimeDropdownRef = useClickOutside(() => setIsRegimeDropdownOpen(false));

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [strategiesRes, tradesRes] = await Promise.all([
        supabase
          .from('strategies')
          .select('*')
          .eq('user_id', user?.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('trades')
          .select('*')
          .eq('user_id', user?.id)
      ]);

      if (strategiesRes.error) throw strategiesRes.error;
      if (tradesRes.error) throw tradesRes.error;

      setStrategies(strategiesRes.data || []);
      setTrades(tradesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const strategyData = {
        user_id: user?.id,
        strategy_name: name,
        description,
        context_setup: contextSetup,
        market_regime: marketRegime,
        fundamental_situation: fundamentalSituation,
        partial_close_logic: partialCloseLogic,
        cut_loss_sl_logic: cutLossSLLogic,
        move_sl_be_structure: moveSLBEStructure,
        take_profit_targets: takeProfitTargets,
        calm_flow_state: calmFlowState,
        fear_anxiety: fearAnxiety,
        greed_fomo: greedFOMO,
        exhaustion_tilt: exhaustionTilt,
        assets_applicable: selectedAssets,
        timeframes_applicable: selectedTimeframes,
        status,
        updated_at: new Date().toISOString()
      };

      if (editingStrategyId) {
        const { error } = await supabase
          .from('strategies')
          .update(strategyData)
          .eq('strategy_id', editingStrategyId);
        if (error) throw error;
        toast.success('Strategy updated successfully!');
      } else {
        const { error } = await supabase
          .from('strategies')
          .insert([strategyData]);
        if (error) throw error;
        toast.success('Strategy created successfully!');
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      toast.error(`Failed to save strategy: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setContextSetup('');
    setMarketRegime('');
    setFundamentalSituation('');
    setPartialCloseLogic('');
    setCutLossSLLogic('');
    setMoveSLBEStructure('');
    setTakeProfitTargets('');
    setCalmFlowState('');
    setFearAnxiety('');
    setGreedFOMO('');
    setExhaustionTilt('');
    setSelectedAssets([]);
    setSelectedTimeframes([]);
    setStatus('Active');
    setEditingStrategyId(null);
  };

  const handleEdit = (strategy: Strategy) => {
    setName(strategy.strategy_name);
    setDescription(strategy.description || '');
    setContextSetup(strategy.context_setup || '');
    setMarketRegime(strategy.market_regime || '');
    setFundamentalSituation(strategy.fundamental_situation || '');
    setPartialCloseLogic(strategy.partial_close_logic || '');
    setCutLossSLLogic(strategy.cut_loss_sl_logic || '');
    setMoveSLBEStructure(strategy.move_sl_be_structure || '');
    setTakeProfitTargets(strategy.take_profit_targets || '');
    setCalmFlowState(strategy.calm_flow_state || '');
    setFearAnxiety(strategy.fear_anxiety || '');
    setGreedFOMO(strategy.greed_fomo || '');
    setExhaustionTilt(strategy.exhaustion_tilt || '');
    setSelectedAssets(strategy.assets_applicable || []);
    setSelectedTimeframes(strategy.timeframes_applicable || []);
    setStatus(strategy.status);
    setEditingStrategyId(strategy.strategy_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;

    try {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('strategy_id', id);
      if (error) throw error;
      toast.success('Strategy deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting strategy:', error);
      toast.error(`Failed to delete strategy: ${error.message}`);
    }
  };

  const getStrategyStats = (strategyId: string) => {
    const strategyTrades = trades.filter(t => t.strategy_id === strategyId);
    const total = strategyTrades.length;
    const wins = strategyTrades.filter(t => t.pnl > 0).length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalPnl = strategyTrades.reduce((acc, t) => acc + t.pnl, 0);
    
    const grossProfit = strategyTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(strategyTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 9.99 : 0) : grossProfit / grossLoss;

    return { total, winRate, totalPnl, profitFactor };
  };

  const filteredStrategies = strategies.filter(s => {
    const matchesSearch = s.strategy_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Strategy Vault</h1>
            <p className="text-neutral-500 mt-2 font-medium">Define your edge, manage your exits, and master your mind.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="text"
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-6 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-sm font-bold text-white focus:border-sky-500/50 focus:outline-none transition-all w-full sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'All' ? 'Active' : statusFilter === 'Active' ? 'Archived' : statusFilter === 'Archived' ? 'Under Review' : 'All')}
                  className="w-full px-6 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-sm font-bold text-white hover:border-sky-500/50 transition-all flex items-center justify-center gap-3"
                >
                  <Filter className="w-4 h-4 text-sky-500" />
                  {statusFilter}
                </button>
              </div>

              <button 
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="w-12 h-12 bg-sky-500 text-black rounded-xl flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 shrink-0"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredStrategies.map((strategy, i) => {
            const stats = getStrategyStats(strategy.strategy_id);
            return (
              <ScrollReveal key={strategy.strategy_id} delay={i * 0.05}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative bg-[#0a0a0a] border border-[#262626] rounded-[40px] p-8 hover:border-sky-500/30 transition-all h-full"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Brain className="w-7 h-7 text-sky-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        strategy.status === 'Active' ? "bg-emerald-500/10 text-emerald-400" :
                        strategy.status === 'Archived' ? "bg-neutral-500/10 text-neutral-400" :
                        "bg-orange-500/10 text-orange-400"
                      )}>
                        {strategy.status}
                      </span>
                      <div className="relative group/menu">
                        <button className="p-2 text-neutral-500 hover:text-white transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-[#1f1f1f] border border-[#262626] rounded-2xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 overflow-hidden">
                          <button 
                            onClick={() => handleEdit(strategy)}
                            className="w-full px-4 py-3 text-left text-xs font-bold text-neutral-400 hover:text-white hover:bg-[#262626] flex items-center gap-3"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(strategy.strategy_id)}
                            className="w-full px-4 py-3 text-left text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-3"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-white mb-4 line-clamp-1">{strategy.strategy_name}</h3>
                  <p className="text-neutral-500 font-medium leading-relaxed mb-8 line-clamp-2 h-12">
                    {strategy.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-[#141414] rounded-2xl border border-[#262626]">
                      <div className="text-xl font-black text-white">{stats.winRate.toFixed(1)}%</div>
                      <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Win Rate</div>
                    </div>
                    <div className="p-4 bg-[#141414] rounded-2xl border border-[#262626]">
                      <div className="text-xl font-black text-white">{stats.profitFactor.toFixed(2)}</div>
                      <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Profit Factor</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-[#262626]">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {format(new Date(strategy.updated_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="text-xs font-black text-sky-500 uppercase tracking-widest">
                      {stats.total} Trades
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}

          {filteredStrategies.length === 0 && (
            <ScrollReveal className="col-span-full">
              <div className="py-20 text-center bg-[#0a0a0a] border border-[#262626] rounded-[48px]">
                <Brain className="w-16 h-16 text-neutral-800 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-white mb-2">No strategies found</h3>
                <p className="text-neutral-500 font-medium">Start by creating your first trading strategy.</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      )}

      {/* Strategy Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 overflow-y-auto bg-black/80 backdrop-blur-sm py-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#141414] border border-[#262626] rounded-[40px] p-12 shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                    {editingStrategyId ? 'Edit Strategy' : 'Define Strategy'}
                  </h2>
                  <p className="text-neutral-500 font-medium mt-1">Define your edge, manage your exits, and master your mind.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-[#1f1f1f] rounded-2xl text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-3 p-8 bg-[#0a0a0a] border border-[#262626] rounded-[32px]">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Strategy Name</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Trend Breakout"
                    className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Left Column: Entry Confirmation */}
                  <div className="space-y-8 p-8 bg-[#0a0a0a] border border-[#262626] rounded-[32px]">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/10">
                        <Target className="w-6 h-6 text-sky-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Entry Confirmation</h3>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Context and Triggers</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Context / Setup</label>
                        <textarea 
                          value={contextSetup}
                          onChange={(e) => setContextSetup(e.target.value)}
                          placeholder="What is the higher timeframe narrative?"
                          rows={3}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Market Regime</label>
                        <div className="relative" ref={regimeDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsRegimeDropdownOpen(!isRegimeDropdownOpen);
                              setIsAssetDropdownOpen(false);
                              setIsTimeframeDropdownOpen(false);
                              setIsStatusDropdownOpen(false);
                            }}
                            className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-left flex items-center justify-between"
                          >
                            <span>{marketRegime || 'Select Regime'}</span>
                            <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform", isRegimeDropdownOpen && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {isRegimeDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden p-2"
                              >
                                {['Trending', 'Ranging', 'Volatile', 'Consolidating'].map((regime) => (
                                  <button
                                    key={regime}
                                    type="button"
                                    onClick={() => {
                                      setMarketRegime(regime);
                                      setIsRegimeDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-left flex items-center justify-between group",
                                      marketRegime === regime ? "bg-sky-500 text-black" : "text-neutral-500 hover:bg-white/5 hover:text-white"
                                    )}
                                  >
                                    {regime}
                                    {marketRegime === regime && <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Fundamental Situation</label>
                        <textarea 
                          value={fundamentalSituation}
                          onChange={(e) => setFundamentalSituation(e.target.value)}
                          placeholder="Economic overheat, geopolitical chaos, news events..."
                          rows={3}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Applicable Assets</label>
                        <div className="relative" ref={assetDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAssetDropdownOpen(!isAssetDropdownOpen);
                              setIsRegimeDropdownOpen(false);
                              setIsTimeframeDropdownOpen(false);
                              setIsStatusDropdownOpen(false);
                            }}
                            className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-left flex items-center justify-between"
                          >
                            <span className="truncate">
                              {selectedAssets.length > 0 ? selectedAssets.join(', ') : 'Select Assets'}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform", isAssetDropdownOpen && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {isAssetDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden p-2 grid grid-cols-2 gap-1"
                              >
                                {['MNQ', 'NQ', 'MES', 'ES', 'MGC', 'GC'].map((asset) => (
                                  <button
                                    key={asset}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAssets(prev => 
                                        prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]
                                      );
                                    }}
                                    className={cn(
                                      "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-left flex items-center justify-between group",
                                      selectedAssets.includes(asset) ? "bg-sky-500 text-black" : "text-neutral-500 hover:bg-white/5 hover:text-white"
                                    )}
                                  >
                                    {asset}
                                    {selectedAssets.includes(asset) && <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Applicable Timeframes</label>
                        <div className="relative" ref={timeframeDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen);
                              setIsRegimeDropdownOpen(false);
                              setIsAssetDropdownOpen(false);
                              setIsStatusDropdownOpen(false);
                            }}
                            className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-left flex items-center justify-between"
                          >
                            <span className="truncate">
                              {selectedTimeframes.length > 0 ? selectedTimeframes.join(', ') : 'Select Timeframes'}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform", isTimeframeDropdownOpen && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {isTimeframeDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden p-2 grid grid-cols-2 gap-1"
                              >
                                {['1m', '5m', '15m', '1h', '4h', 'Daily', 'Weekly'].map((tf) => (
                                  <button
                                    key={tf}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTimeframes(prev => 
                                        prev.includes(tf) ? prev.filter(t => t !== tf) : [...prev, tf]
                                      );
                                    }}
                                    className={cn(
                                      "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-left flex items-center justify-between group",
                                      selectedTimeframes.includes(tf) ? "bg-sky-500 text-black" : "text-neutral-500 hover:bg-white/5 hover:text-white"
                                    )}
                                  >
                                    {tf}
                                    {selectedTimeframes.includes(tf) && <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Strategy Status</label>
                        <div className="relative" ref={statusDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsStatusDropdownOpen(!isStatusDropdownOpen);
                              setIsRegimeDropdownOpen(false);
                              setIsAssetDropdownOpen(false);
                              setIsTimeframeDropdownOpen(false);
                            }}
                            className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-left flex items-center justify-between"
                          >
                            <span>{status}</span>
                            <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform", isStatusDropdownOpen && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {isStatusDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden p-2"
                              >
                                {['Active', 'Archived', 'Under Review'].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      setStatus(s as any);
                                      setIsStatusDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-left flex items-center justify-between group",
                                      status === s ? "bg-sky-500 text-black" : "text-neutral-500 hover:bg-white/5 hover:text-white"
                                    )}
                                  >
                                    {s}
                                    {status === s && <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Exit Strategy */}
                  <div className="space-y-8 p-8 bg-[#0a0a0a] border border-[#262626] rounded-[32px]">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                        <Zap className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Exit Strategy</h3>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Capital Protection</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Partial Close Logic</label>
                        <textarea 
                          value={partialCloseLogic}
                          onChange={(e) => setPartialCloseLogic(e.target.value)}
                          placeholder="e.g. 50% at 1:1 RR"
                          rows={2}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Cut Loss / SL Logic</label>
                        <textarea 
                          value={cutLossSLLogic}
                          onChange={(e) => setCutLossSLLogic(e.target.value)}
                          placeholder="Structural SL or fixed points?"
                          rows={2}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Move SL / BE Structure</label>
                        <textarea 
                          value={moveSLBEStructure}
                          onChange={(e) => setMoveSLBEStructure(e.target.value)}
                          placeholder="When is structure valid to move SL to BE or trail?"
                          rows={3}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Take Profit Targets</label>
                        <textarea 
                          value={takeProfitTargets}
                          onChange={(e) => setTakeProfitTargets(e.target.value)}
                          placeholder="Key levels, liquidity pools, or fixed RR?"
                          rows={3}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Psychology Status */}
                  <div className="space-y-8 p-8 bg-[#0a0a0a] border border-[#262626] rounded-[32px]">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10">
                        <Brain className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Psychology Status</h3>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Master Your Mind</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Calm / Flow State</label>
                        <textarea 
                          value={calmFlowState}
                          onChange={(e) => setCalmFlowState(e.target.value)}
                          placeholder="What does a focused trade feel like?"
                          rows={2}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Fear / Anxiety</label>
                        <textarea 
                          value={fearAnxiety}
                          onChange={(e) => setFearAnxiety(e.target.value)}
                          placeholder="Triggers for hesitation or early exits?"
                          rows={2}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Greed / FOMO</label>
                        <textarea 
                          value={greedFOMO}
                          onChange={(e) => setGreedFOMO(e.target.value)}
                          placeholder="Triggers for over-leveraging or chasing?"
                          rows={2}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Exhaustion / Tilt</label>
                        <textarea 
                          value={exhaustionTilt}
                          onChange={(e) => setExhaustionTilt(e.target.value)}
                          placeholder="Signs that you should stop trading for the day."
                          rows={3}
                          className="w-full px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-[#262626]">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-5 bg-[#1f1f1f] text-neutral-400 rounded-3xl hover:text-white transition-all flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="p-5 bg-sky-500 text-black rounded-3xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[64px]"
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
