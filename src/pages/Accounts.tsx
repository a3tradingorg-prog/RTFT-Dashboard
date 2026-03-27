import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { TradingAccount } from '../types';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  X,
  Check,
  Activity,
  Skull,
  Target,
  ShieldAlert,
  Layers,
  Zap,
  CheckCircle2,
  Ban,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const ASSET_COMMISSIONS: Record<string, number> = {
  'MNQ': 0.50,
  'NQ': 4.00,
  'MES': 0.50,
  'ES': 4.00,
  'MGC': 0.70,
  'GC': 4.50
};

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [propfirm, setPropfirm] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [accountType, setAccountType] = useState<TradingAccount['account_type']>('Challenge');
  const [profitTarget, setProfitTarget] = useState('');
  const [maxDrawdown, setMaxDrawdown] = useState('');
  const [consistencyRules, setConsistencyRules] = useState('');
  const [asset, setAsset] = useState<TradingAccount['asset']>('MNQ');
  const [commission, setCommission] = useState('0.50');
  
  // Track commissions per asset for smart calculation
  const [assetCommissions, setAssetCommissions] = useState<Record<string, string>>({
    'MNQ': '0.50', 'NQ': '4.00',
    'MES': '0.50', 'ES': '4.00',
    'MGC': '0.70', 'GC': '4.50'
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  // Update input when asset changes
  useEffect(() => {
    setCommission(assetCommissions[asset]);
  }, [asset]);

  const handleCommissionChange = (val: string) => {
    setCommission(val);
    const num = parseFloat(val) || 0;
    const newComms = { ...assetCommissions, [asset]: val };
    
    // Smart calculation pairs (Micro <-> Standard)
    // NQ is 10x MNQ size, but commissions are usually ~8x
    if (asset === 'MNQ') newComms['NQ'] = (num * 8).toFixed(2);
    if (asset === 'NQ') newComms['MNQ'] = (num / 8).toFixed(2);
    if (asset === 'MES') newComms['ES'] = (num * 8).toFixed(2);
    if (asset === 'ES') newComms['MES'] = (num / 8).toFixed(2);
    if (asset === 'MGC') newComms['GC'] = (num * 6).toFixed(2);
    if (asset === 'GC') newComms['MGC'] = (num / 6).toFixed(2);
    
    setAssetCommissions(newComms);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: accounts.length,
      challenge: accounts.filter(a => a.account_type === 'Challenge').length,
      failed: accounts.filter(a => a.account_type === 'Fail/Breached').length
    };
  }, [accounts]);

  const parseAccountSize = (size: string): number => {
    const clean = size.toUpperCase().replace(/[^0-9.K]/g, '');
    if (clean.endsWith('K')) {
      return parseFloat(clean) * 1000;
    }
    return parseFloat(clean) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !propfirm || !accountSize) {
      setFormError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const parsedBalance = parseAccountSize(accountSize);

    const accountData = {
      name,
      propfirm,
      account_size: accountSize,
      account_type: accountType,
      profit_target: parseFloat(profitTarget) || 0,
      max_drawdown: parseFloat(maxDrawdown) || 0,
      consistency_rules: consistencyRules,
      asset,
      commission: parseFloat(commission) || 0,
      initial_balance: parsedBalance,
      current_balance: editingAccount ? editingAccount.current_balance : parsedBalance,
      user_id: user?.id
    };

    let error;
    if (editingAccount) {
      const { error: updateError } = await supabase
        .from('accounts')
        .update(accountData)
        .eq('id', editingAccount.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('accounts')
        .insert([accountData]);
      error = insertError;
    }

    if (error) {
      setFormError(error.message);
      toast.error(`Failed to ${editingAccount ? 'update' : 'create'} account: ${error.message}`);
    } else {
      toast.success(`Account ${editingAccount ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      resetForm();
      fetchAccounts();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? This will also delete all associated trades.')) return;
    
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(`Failed to delete account: ${error.message}`);
    } else {
      toast.success('Account deleted successfully');
      fetchAccounts();
    }
  };

  const openEditModal = (account: TradingAccount) => {
    setEditingAccount(account);
    setName(account.name);
    setPropfirm(account.propfirm);
    setAccountSize(account.account_size);
    setAccountType(account.account_type);
    setProfitTarget(account.profit_target.toString());
    setMaxDrawdown(account.max_drawdown.toString());
    setConsistencyRules(account.consistency_rules);
    setAsset(account.asset);
    setCommission(account.commission.toString());
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingAccount(null);
    setName('');
    setPropfirm('');
    setAccountSize('');
    setAccountType('Challenge');
    setProfitTarget('');
    setMaxDrawdown('');
    setConsistencyRules('');
    setAsset('MNQ');
    setCommission(ASSET_COMMISSIONS['MNQ'].toString());
    setFormError('');
  };

  const accountTypes: TradingAccount['account_type'][] = ['Challenge', 'Funded', 'Fail/Breached'];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Accounts</h1>
          <p className="text-neutral-500 mt-2 font-medium">Manage your trading accounts and balances.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="w-14 h-14 bg-sky-500 text-black rounded-2xl flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 group"
        >
          <Plus className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Account Summary Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
            <Layers className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Accounts</p>
            <p className="text-2xl font-black text-white">{summary.total}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Challenge Accounts</p>
            <p className="text-2xl font-black text-white">{summary.challenge}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <Skull className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Failed / Breached</p>
            <p className="text-2xl font-black text-white">{summary.failed}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-sky-500/5 rounded-3xl flex items-center justify-center mx-auto border border-sky-500/10">
            <Wallet className="w-10 h-10 text-sky-500/40" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No accounts found</h3>
            <p className="text-neutral-500 max-w-xs mx-auto">Start by creating a trading account to track your performance and journal your trades.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const isBreached = account.account_type === 'Fail/Breached';
            return (
              <motion.div 
                key={account.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "bg-[#141414] border border-[#262626] rounded-3xl p-8 group transition-all duration-300 relative overflow-hidden",
                  isBreached ? "opacity-60 grayscale-[0.5]" : "hover:border-sky-500/30"
                )}
              >
                {/* Status Indicator */}
                {!isBreached && (
                  <div className="absolute top-8 right-8 flex items-center gap-2">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </div>
                    <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Live</span>
                  </div>
                )}
                {isBreached && (
                  <div className="absolute top-8 right-8 flex items-center gap-2">
                    <Skull className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Breached</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-8">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    isBreached ? "bg-red-500/10" : "bg-sky-500/10"
                  )}>
                    {isBreached ? <Ban className="w-6 h-6 text-red-500" /> : <TrendingUp className="w-6 h-6 text-sky-500" />}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(account)}
                      className="p-2 text-neutral-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <h3 className="text-xl font-bold text-white">{account.name}</h3>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{account.propfirm} • {account.account_size}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#262626]">
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Initial</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(account.initial_balance)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Current</p>
                    <p className={cn(
                      "text-lg font-bold",
                      isBreached ? "text-neutral-400" : "text-sky-400"
                    )}>{formatCurrency(account.current_balance)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 overflow-y-auto bg-black/80 backdrop-blur-sm py-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-[40px] p-12 shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-bold text-white tracking-tight">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-[#1f1f1f] rounded-2xl text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ... existing fields ... */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Account Name</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. My Main Account"
                      className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Propfirm</label>
                    <input 
                      type="text"
                      value={propfirm}
                      onChange={(e) => setPropfirm(e.target.value)}
                      placeholder="e.g. FTMO, Apex"
                      className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Account Size</label>
                    <input 
                      type="text"
                      value={accountSize}
                      onChange={(e) => setAccountSize(e.target.value)}
                      placeholder="e.g. 50K, 100K"
                      className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                    />
                  </div>

                  <div className="space-y-3 relative">
                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Account Type</label>
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                        className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold text-left flex items-center justify-between"
                      >
                        {accountType}
                        <ChevronDown className={cn("w-5 h-5 text-neutral-500 transition-transform", isTypeDropdownOpen && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {isTypeDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-[#262626] rounded-2xl shadow-2xl z-[110] overflow-hidden"
                          >
                            {accountTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setAccountType(type);
                                  setIsTypeDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full px-7 py-4 text-left text-sm font-bold hover:bg-[#262626] transition-all",
                                  accountType === type ? "text-sky-400 bg-sky-500/5" : "text-neutral-400"
                                )}
                              >
                                {type}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Profit Target</label>
                    <input 
                      type="number"
                      value={profitTarget}
                      onChange={(e) => setProfitTarget(e.target.value)}
                      placeholder="e.g. 3000"
                      className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Max Drawdown</label>
                    <input 
                      type="number"
                      value={maxDrawdown}
                      onChange={(e) => setMaxDrawdown(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Consistency Rules</label>
                    <input 
                      type="text"
                      value={consistencyRules}
                      onChange={(e) => setConsistencyRules(e.target.value)}
                      placeholder="e.g. 50%"
                      className="w-full px-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-800"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Asset Selection & Commission</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {Object.keys(ASSET_COMMISSIONS).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAsset(a as any)}
                        className={cn(
                          "py-4 rounded-2xl text-xs font-black transition-all border",
                          asset === a 
                            ? "bg-sky-500 border-sky-500 text-black shadow-lg shadow-sky-500/20" 
                            : "bg-[#0a0a0a] border-[#262626] text-neutral-500 hover:border-sky-500/50"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">Commission per round trip:</div>
                    <input 
                      type="number"
                      step="0.01"
                      value={commission}
                      onChange={(e) => handleCommissionChange(e.target.value)}
                      className="w-full pl-52 pr-7 py-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-right text-sky-500 font-black focus:border-sky-500/50 focus:outline-none transition-all"
                    />
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
