import React, { useState, useEffect } from 'react';
import { Payout, TradingAccount } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  TrendingUp, 
  DollarSign, 
  History, 
  Plus, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Wallet,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface FundedAccountManagerProps {
  account: TradingAccount;
  onUpdate: () => void;
}

export default function FundedAccountManager({ account, onUpdate }: FundedAccountManagerProps) {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayout, setShowAddPayout] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [account.id]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('account_id', account.id)
        .order('payout_date', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const payoutAmount = parseFloat(amount);
      const { error } = await supabase
        .from('payouts')
        .insert([{
          account_id: account.id,
          user_id: user?.id,
          amount: payoutAmount,
          payout_date: payoutDate,
          month: payoutDate.substring(0, 7),
          status: 'Completed'
        }]);

      if (error) throw error;

      // Update account balance after payout
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ current_balance: account.current_balance - payoutAmount })
        .eq('id', account.id);

      if (updateError) throw updateError;

      toast.success('Payout recorded successfully');
      setAmount('');
      setShowAddPayout(false);
      fetchPayouts();
      onUpdate();
    } catch (error: any) {
      console.error('Error adding payout:', error);
      toast.error(error.message || 'Failed to record payout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const buffer = account.current_balance - account.initial_balance;
  const bufferLeft = buffer > 0 ? buffer : 0;

  const payoutsByMonth = React.useMemo(() => {
    const months: Record<string, number> = {};
    payouts.forEach(p => {
      months[p.month] = (months[p.month] || 0) + p.amount;
    });
    return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]));
  }, [payouts]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-sky-500/10 rounded-3xl p-5">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Total Payouts</p>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <p className="text-xl font-black text-white">{formatCurrency(totalPayouts)}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-sky-500/10 rounded-3xl p-5">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Buffer Left</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <p className="text-xl font-black text-white">{formatCurrency(bufferLeft)}</p>
          </div>
        </div>
      </div>

      {/* Monthly Trace Section */}
      {payoutsByMonth.length > 0 && (
        <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-4 h-4 text-sky-500" />
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Monthly Trace (Totals)</h4>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {payoutsByMonth.map(([month, total]) => {
              const [year, monthNum] = month.split('-');
              const date = new Date(parseInt(year), parseInt(monthNum) - 1);
              return (
                <div key={month} className="shrink-0 bg-black/40 border border-[#262626] rounded-2xl px-5 py-3 text-center min-w-[100px]">
                  <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">{format(date, 'MMM yyyy')}</p>
                  <p className="text-sm font-black text-emerald-400">{formatCurrency(total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Add Payout */}
      <div className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden">
        <button 
          onClick={() => setShowAddPayout(!showAddPayout)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">Record New Payout</span>
          </div>
          <ChevronRight className={cn("w-4 h-4 text-neutral-500 transition-transform", showAddPayout && "rotate-90")} />
        </button>

        <AnimatePresence>
          {showAddPayout && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 pt-2 border-t border-[#262626]"
            >
              <form onSubmit={handleAddPayout} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Amount</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full bg-black border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Date</label>
                    <input 
                      type="date"
                      value={payoutDate}
                      onChange={(e) => setPayoutDate(e.target.value)}
                      className="w-full bg-black border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500/50 outline-none"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payout'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Payout History</h4>
          <History className="w-3.5 h-3.5 text-neutral-500" />
        </div>
        
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="bg-[#141414]/50 border border-dashed border-[#262626] rounded-2xl p-8 text-center">
              <p className="text-xs text-neutral-600 italic">No payouts recorded yet</p>
            </div>
          ) : (
            payouts.map((payout) => (
              <div 
                key={payout.id}
                className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between group hover:border-[#363636] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/5 rounded-xl flex items-center justify-center text-emerald-500">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{formatCurrency(payout.amount)}</p>
                    <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-widest">
                      {format(parseISO(payout.payout_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 rounded-lg">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Success</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
