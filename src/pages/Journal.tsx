import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useAccount } from '../lib/AccountContext';
import { useClickOutside } from '../hooks/useClickOutside';
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
  Wallet,
  Activity
} from 'lucide-react';
import { formatCurrency, formatPercent, cn, formatToEST } from '../lib/utils';
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
import { LoadingState } from '../components/LoadingState';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

const multipliers: Record<string, number> = {
  'MNQ': 2, 'NQ': 20,
  'MES': 5, 'ES': 50,
  'MGC': 10, 'GC': 100
};

export default function Journal() {
  const { user } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId, selectedAccount, refreshAccounts, loading: accountsLoading } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [viewingDayDetails, setViewingDayDetails] = useState<Date | null>(null);
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
  const [isImporting, setIsImporting] = useState(false);
  const isImportingRef = React.useRef(isImporting);
  React.useEffect(() => {
    isImportingRef.current = isImporting;
  }, [isImporting]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const accountRef = useClickOutside(() => setIsAccountDropdownOpen(false));

  const parseAsUSTimezone = (dateStr: string): Date => {
    const cleanStr = dateStr.trim();
    if (cleanStr.includes('Z') || cleanStr.includes('GMT') || cleanStr.includes('+') || (cleanStr.includes('-') && cleanStr.split('-').length > 3)) {
      return new Date(cleanStr);
    }
    try {
      // YRM and matching prop firms export times in UTC/GMT timezone.
      // So "2026-02-24 14:40:16" needs to be parsed as UTC/GMT.
      const normalized = cleanStr.replace(/\//g, '-');
      let isoCompatible = normalized;
      if (normalized.includes(' ')) {
        isoCompatible = normalized.replace(' ', 'T');
      }
      
      // Append 'Z' to treat the date string strictly as UTC
      const finalDate = new Date(isoCompatible + 'Z');
      if (!isNaN(finalDate.getTime())) {
        return finalDate;
      }
      return new Date(normalized);
    } catch (err) {
      return new Date(dateStr);
    }
  };

  const handleImportLogs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    if (!selectedAccountId || !user) {
      toast.error('Please select an account first');
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Importing trade logs...');

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file is empty or missing data');
      }

      // Check header
      const header = lines[0].toLowerCase();
      if (!header.includes('entry') || !header.includes('price')) {
        throw new Error('Invalid CSV format. Please ensure the file has correct headers.');
      }

      const groupedTrades: any = {};
      let firstAccountName = '';

      lines.slice(1).forEach(line => {
        const parts = line.split(';');
        if (parts.length < 11) return;

        const [accountName, symbol, contract, entryDate, entryPrice, exitDate, exitPrice, side, qty, grossPnl, netPnl] = parts;
        if (!firstAccountName) firstAccountName = accountName;
        
        const key = `${accountName}-${symbol}-${entryDate}`;
        
        if (!groupedTrades[key]) {
          groupedTrades[key] = {
            accountName,
            asset: symbol.includes('NQ') ? 'MNQ' : symbol.includes('ES') ? 'MES' : symbol.includes('GC') ? 'MGC' : symbol,
            entry_date: entryDate,
            entry_price: parseFloat(entryPrice),
            type: side.toUpperCase().includes('BUY') ? 'LONG' : 'SHORT',
            contract_size: 0,
            total_pnl: 0,
            exits: []
          };
        }
        
        const exitQty = Math.abs(parseFloat(qty));
        groupedTrades[key].contract_size += exitQty;
        groupedTrades[key].total_pnl += parseFloat(netPnl.replace(',', '')) || 0;
        groupedTrades[key].exits.push({
          exit_price: parseFloat(exitPrice),
          closed_contract: exitQty,
          exit_date: exitDate
        });
      });

      const tradesToInsert = Object.values(groupedTrades).filter((t: any) => t.accountName === firstAccountName);
      if (tradesToInsert.length === 0) {
        throw new Error('No valid trades found for account ' + firstAccountName + ' in CSV');
      }

      // 1. Resolve Account
      let targetAccountId = selectedAccountId;
      let targetAccountInitialBalance = 50000;
      let isOverriding = false;
      
      // If none selected or we want to match by CSV account name
      if (firstAccountName) {
        const existingAcc = accounts.find(a => a.name === firstAccountName);
        if (existingAcc) {
          targetAccountId = existingAcc.id;
          targetAccountInitialBalance = existingAcc.initial_balance || 50000;
          isOverriding = true;

          // Override option: Wipe matching trades, trade exits, and daily pnl to avoid duplicate merges
          const { data: oldTrades } = await supabase.from('trades').select('id').eq('account_id', targetAccountId);
          if (oldTrades && oldTrades.length > 0) {
            const oldTradeIds = oldTrades.map(ot => ot.id);
            await supabase.from('trade_exits').delete().in('trade_id', oldTradeIds);
          }
          await supabase.from('trades').delete().eq('account_id', targetAccountId);
          await supabase.from('daily_pnl').delete().eq('account_id', targetAccountId);
        } else {
          // Create the account if it doesn't exist
          const { data: newAcc, error: accError } = await supabase
            .from('accounts')
            .insert([{
              user_id: user.id,
              name: firstAccountName,
              propfirm: 'Imported',
              account_size: '50K',
              account_type: 'Funded',
              initial_balance: 50000,
              current_balance: 50000,
              asset: 'MNQ'
            }])
            .select()
            .single();
          
          if (accError) throw new Error(`Failed to create account: ${accError.message}`);
          targetAccountId = newAcc.id;
          targetAccountInitialBalance = 50000;
          await refreshAccounts(); // Update context
        }
      }

      if (!targetAccountId) {
        throw new Error('Please select or create an account first');
      }

      // 2. Insert Trades using Batch operation
      const tradesPayload = (tradesToInsert as any[]).map(t => {
        const entryParsed = parseAsUSTimezone(t.entry_date).toISOString();
        const exitParsed = parseAsUSTimezone(t.exits[t.exits.length - 1].exit_date).toISOString();
        return {
          account_id: targetAccountId,
          user_id: user.id,
          asset: t.asset,
          type: t.type,
          entry_date: entryParsed,
          exit_date: exitParsed,
          contract_size: t.contract_size,
          entry_price: t.entry_price,
          exit_price: t.exits[t.exits.length - 1].exit_price,
          pnl: t.total_pnl,
          status: 'CLOSED',
          created_at: entryParsed
        };
      });

      const { data: insertedTrades, error: tradesInsertError } = await supabase
        .from('trades')
        .insert(tradesPayload)
        .select('*');

      if (tradesInsertError) {
        console.error('Trades batch insert error:', tradesInsertError);
        throw new Error(`Failed to batch insert trades: ${tradesInsertError.message}`);
      }

      let totalPnLForImport = 0;
      const dailyPnlsToUpdate: Record<string, number> = {};
      const exitRecordsToInsert: any[] = [];

      if (insertedTrades) {
        insertedTrades.forEach(dbTrade => {
          // Match back to the original trade to extract exits
          const originalTrade = (tradesToInsert as any[]).find(t => {
            const parsedEntry = parseAsUSTimezone(t.entry_date).toISOString();
            return parsedEntry === dbTrade.entry_date && t.asset === dbTrade.asset;
          });

          if (originalTrade) {
            originalTrade.exits.forEach((e: any) => {
              exitRecordsToInsert.push({
                trade_id: dbTrade.id,
                closed_contract: e.closed_contract,
                exit_price: e.exit_price,
                exit_status: 'TP',
                created_at: parseAsUSTimezone(e.exit_date).toISOString()
              });
            });
          }

          totalPnLForImport += dbTrade.pnl;
          const dateToUse = dbTrade.exit_date || dbTrade.entry_date;
          if (dateToUse) {
            try {
              const d = typeof dateToUse === 'string' ? new Date(dateToUse) : dateToUse;
              if (!isNaN(d.getTime())) {
                const dateStr = d.toISOString().split('T')[0];
                dailyPnlsToUpdate[dateStr] = (dailyPnlsToUpdate[dateStr] || 0) + dbTrade.pnl;
              }
            } catch (err) {
              console.error('Error parsing date on import:', err);
            }
          }
        });
      }

      // Insert exit records in batch
      if (exitRecordsToInsert.length > 0) {
        const { error: exitsInsertError } = await supabase
          .from('trade_exits')
          .insert(exitRecordsToInsert);
        if (exitsInsertError) {
          console.warn('Exits batch insert warning:', exitsInsertError);
        }
      }

      // 3. Update account balance
      const newBalance = targetAccountInitialBalance + totalPnLForImport;
      await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', targetAccountId);

      // 4. Update daily PnLs
      // Fetch all existing daily PnLs to do single batch update/insert
      const { data: existingPnls } = await supabase
        .from('daily_pnl')
        .select('*')
        .eq('account_id', targetAccountId);

      const existingPnlsMap = (existingPnls || []).reduce((acc: Record<string, any>, curr) => {
        acc[curr.date] = curr;
        return acc;
      }, {});

      const dailyPnlsToInsert: any[] = [];
      const dailyPnlsToUpdateList: any[] = [];

      for (const [date, pnl] of Object.entries(dailyPnlsToUpdate)) {
        const existing = existingPnlsMap[date];
        if (existing) {
          dailyPnlsToUpdateList.push({
            id: existing.id,
            account_id: targetAccountId,
            user_id: user.id,
            date,
            pnl: Number(existing.pnl) + pnl
          });
        } else {
          dailyPnlsToInsert.push({
            account_id: targetAccountId,
            user_id: user.id,
            date,
            pnl
          });
        }
      }

      if (dailyPnlsToInsert.length > 0) {
        await supabase.from('daily_pnl').insert(dailyPnlsToInsert);
      }

      if (dailyPnlsToUpdateList.length > 0) {
        await supabase.from('daily_pnl').upsert(dailyPnlsToUpdateList);
      }

      setSelectedAccountId(targetAccountId!);
      toast.success(`Successfully imported ${tradesToInsert.length} trades!`, { id: toastId });
      fetchJournalData(true);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`, { id: toastId });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const closeAllDropdowns = () => {
    setIsAssetDropdownOpen(false);
    setIsAccountDropdownOpen(false);
    setIsStrategyDropdownOpen(false);
    setOpenExitDropdown(null);
  };

  const assetRef = useClickOutside(() => setIsAssetDropdownOpen(false));
  const strategyRef = useClickOutside(() => setIsStrategyDropdownOpen(false));
  const exitRef = useClickOutside(() => setOpenExitDropdown(null));

  useEffect(() => {
    if (user) {
      fetchStrategies().catch(err => console.error('Initial strategies fetch error:', err));
    }
  }, [user]);

  const fetchStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'Active');

      if (error) throw error;
      if (data) {
        setStrategies(data);
      }
    } catch (err) {
      console.error('Error fetching strategies:', err);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchJournalData().catch(err => console.error('Initial journal data fetch error:', err));

      const tradesSubscription = supabase
        .channel(`journal_trades_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trades',
          filter: `account_id=eq.${selectedAccountId}`
        }, () => {
          if (isImportingRef.current) return;
          fetchJournalData().catch(err => console.error('Realtime trades fetch error:', err));
        })
        .subscribe();

      const exitsSubscription = supabase
        .channel(`journal_exits_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trade_exits'
        }, () => {
          // Since we can't easily filter by account_id on the exit table directly without a join in the filter
          // we'll just refresh if any exit changes. For better performance, we could filter by trade_ids.
          if (isImportingRef.current) return;
          fetchJournalData().catch(err => console.error('Realtime exit fetch error:', err));
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
          if (isImportingRef.current) return;
          fetchJournalData().catch(err => console.error('Realtime pnl fetch error:', err));
        })
        .subscribe();

      return () => {
        tradesSubscription.unsubscribe();
        exitsSubscription.unsubscribe();
        dailyPnLSubscription.unsubscribe();
      };
    }
  }, [selectedAccountId]);

  const fetchJournalData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tradesRes, dailyPnlsRes] = await Promise.all([
        supabase
          .from('trades')
          .select('*, trade_exits(*), strategies(*)')
          .eq('account_id', selectedAccountId)
          .order('entry_date', { ascending: false })
          .order('created_at', { foreignTable: 'trade_exits', ascending: false }),
        supabase
          .from('daily_pnl')
          .select('*')
          .eq('account_id', selectedAccountId)
      ]);

      if (tradesRes.error) throw tradesRes.error;
      if (dailyPnlsRes.error) throw dailyPnlsRes.error;

      if (tradesRes.data) {
        // Map strategies to strategy for compatibility
        const mappedTrades = tradesRes.data.map((t: any) => ({
          ...t,
          strategy: t.strategies
        }));
        
        // Deduplicate trades by ID to prevent duplicate key errors
        const uniqueTrades = Array.from(
          new Map(mappedTrades.map((t: any) => [t.id, t])).values()
        );
        setTrades(uniqueTrades);
      }
      if (dailyPnlsRes.data) setDailyPnls(dailyPnlsRes.data);
    } catch (error) {
      console.error('Error fetching journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDeleteTrade = async () => {
    if (!confirmDeleteId) return;
    const trade = trades.find(t => t.id === confirmDeleteId);
    if (!trade) {
      setConfirmDeleteId(null);
      return;
    }

    try {
      const { error } = await supabase.from('trades').delete().eq('id', confirmDeleteId);
      
      if (error) throw error;

      // Revert account balance
      const newBalance = (selectedAccount?.current_balance || 0) - Number(trade.pnl);
      await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
      
      // Revert daily PnL
      let dateStr = '';
      const dateToUse = trade.exit_date || trade.entry_date;
      if (dateToUse) {
        try {
          const d = typeof dateToUse === 'string' ? new Date(dateToUse) : dateToUse;
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split('T')[0];
          }
        } catch {}
      }
      if (dateStr) {
        const existingPnL = dailyPnls.find(p => p.date === dateStr);
        if (existingPnL) {
          await supabase.from('daily_pnl').update({ pnl: Number(existingPnL.pnl) - Number(trade.pnl) }).eq('id', existingPnL.id);
        }
      }
      
      toast.success('Trade deleted successfully');
      fetchJournalData().catch(err => console.error('Refresh journal data error after delete:', err));
    } catch (error: any) {
      console.error('Error deleting trade:', error);
      toast.error(`Failed to delete trade: ${error.message}`);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        const { error: deleteError } = await supabase.from('trade_exits').delete().eq('trade_id', editingTradeId);
        if (deleteError) throw deleteError;
        
        if (processedExits.length > 0) {
          const exitsWithId = processedExits.map(e => ({ ...e, trade_id: editingTradeId }));
          const { error: insertError } = await supabase.from('trade_exits').insert(exitsWithId);
          if (insertError) throw insertError;
        }
        
        // Update account balance (revert old pnl, add new pnl)
        const revertedBalance = (selectedAccount?.current_balance || 0) - (oldTrade?.pnl || 0);
        const newBalance = revertedBalance + totalNetPnl;
        const { error: accError } = await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
        if (accError) throw accError;

        // Update daily PnL
        const dateStr = format(new Date(entryDate), 'yyyy-MM-dd');
        const oldDateStr = oldTrade ? format(new Date(oldTrade.entry_date), 'yyyy-MM-dd') : dateStr;
        
        if (dateStr === oldDateStr) {
          const existingPnL = dailyPnls.find(p => p.date === dateStr);
          if (existingPnL) {
            const { error: pnlError } = await supabase.from('daily_pnl').update({ pnl: existingPnL.pnl - (oldTrade?.pnl || 0) + totalNetPnl }).eq('id', existingPnL.id);
            if (pnlError) throw pnlError;
          }
        } else {
          // Revert old date
          const oldPnL = dailyPnls.find(p => p.date === oldDateStr);
          if (oldPnL) {
            const { error: pnlError } = await supabase.from('daily_pnl').update({ pnl: oldPnL.pnl - (oldTrade?.pnl || 0) }).eq('id', oldPnL.id);
            if (pnlError) throw pnlError;
          }
          // Add to new date
          const newPnL = dailyPnls.find(p => p.date === dateStr);
          if (newPnL) {
            const { error: pnlError } = await supabase.from('daily_pnl').update({ pnl: newPnL.pnl + totalNetPnl }).eq('id', newPnL.id);
            if (pnlError) throw pnlError;
          } else {
            const { error: pnlError } = await supabase.from('daily_pnl').insert([{ account_id: selectedAccountId, date: dateStr, pnl: totalNetPnl, user_id: user?.id }]);
            if (pnlError) throw pnlError;
          }
        }

        setIsModalOpen(false);
        resetForm();
        setEditingTradeId(null);
        toast.success('Trade updated successfully!');
        fetchJournalData().catch(err => console.error('Refresh journal data error after update:', err));
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
            const { error: insertError } = await supabase.from('trade_exits').insert(exitsWithId);
            if (insertError) throw insertError;
          }

          const newBalance = (selectedAccount?.current_balance || 0) + totalNetPnl;
          const { error: accError } = await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
          if (accError) throw accError;
          
          const dateStr = format(new Date(entryDate), 'yyyy-MM-dd');
          const existingPnL = dailyPnls.find(p => p.date === dateStr);
          if (existingPnL) {
            const { error: pnlError } = await supabase.from('daily_pnl').update({ pnl: existingPnL.pnl + totalNetPnl }).eq('id', existingPnL.id);
            if (pnlError) throw pnlError;
          } else {
            const { error: pnlError } = await supabase.from('daily_pnl').insert([{ account_id: selectedAccountId, date: dateStr, pnl: totalNetPnl, user_id: user?.id }]);
            if (pnlError) throw pnlError;
          }

          setIsModalOpen(false);
          resetForm();
          toast.success('Trade logged successfully!');
          fetchJournalData().catch(err => console.error('Refresh journal data error after log:', err));
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

  const getWeeklyPnL = (startOfWeekDate: Date) => {
    const endOfWeekDate = endOfWeek(startOfWeekDate);
    const weeklyDays = eachDayOfInterval({ start: startOfWeekDate, end: endOfWeekDate });
    return weeklyDays.reduce((acc, day) => acc + getDayPnL(day), 0);
  };

  const getMonthlyPnL = () => {
    return dailyPnls
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      })
      .reduce((acc, p) => acc + (p.pnl || 0), 0);
  };

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = 
      trade.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trade.strategy?.strategy_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trade.entry_context || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !selectedDate || isSameDay(new Date(trade.entry_date), selectedDate);
    
    // Only show trades for selected date in calendar
    if (selectedDate) {
      return matchesDate && matchesSearch;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Trading Journal</h1>
          <p className="text-neutral-500 mt-2 font-medium">Review and analyze your trading history.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-[#141414] border border-[#262626] rounded-2xl text-xs font-bold text-white focus:border-sky-500/50 focus:outline-none transition-all w-64"
            />
          </div>

          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImportLogs}
              accept=".csv"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              title="Import Trade Logs (CSV)"
              className="w-10 h-10 bg-neutral-800 text-neutral-400 rounded-xl flex items-center justify-center hover:bg-neutral-700 hover:text-white transition-all border border-[#262626] disabled:opacity-50"
            >
              <Upload className={cn("w-5 h-5", isImporting && "animate-pulse")} />
            </button>
            <button 
              onClick={() => {
                resetForm();
                setEditingTradeId(null);
                setIsModalOpen(true);
              }}
              className="w-10 h-10 rounded-xl bg-sky-400 text-black hover:bg-sky-300 shadow-lg shadow-sky-400/20 flex items-center justify-center transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Decoding trade logs..." />
      ) : (
        <div className="space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-8 border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h3 className="text-xl font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0a0a0a] border border-[#262626] rounded-full">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Monthly</span>
                  <span className={cn(
                    "text-xs font-black",
                    getMonthlyPnL() >= 0 ? "text-sky-400" : "text-rose-400"
                  )}>
                    {getMonthlyPnL() >= 0 ? '+' : ''}{formatCurrency(getMonthlyPnL())}
                  </span>
                </div>
              </div>
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

            <div className="grid grid-cols-8 border-b border-[#262626]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-neutral-500 uppercase tracking-widest border-r border-[#262626] last:border-r-0">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day[0]}</span>
                </div>
              ))}
              <div className="py-4 text-center text-[10px] font-black text-sky-500/50 uppercase tracking-widest bg-sky-500/[0.02]">
                <span className="hidden sm:inline">Weekly PnL</span>
                <span className="sm:hidden">Total</span>
              </div>
            </div>

            <div className="grid grid-cols-8">
              {(() => {
                const weeks = [];
                for (let i = 0; i < calendarDays.length; i += 7) {
                  weeks.push(calendarDays.slice(i, i + 7));
                }
                
                return weeks.map((week, weekIndex) => (
                  <React.Fragment key={`week-${weekIndex}`}>
                    {week.map((day, i) => {
                      const pnl = getDayPnL(day);
                      const dayTrades = getDayTrades(day);
                      const isCurrentMonth = format(day, 'M') === format(currentMonth, 'M');
                      
                      return (
                        <div 
                          key={day.toString()} 
                          onClick={() => {
                            setSelectedDate(day);
                            if (dayTrades.length > 0) {
                              setViewingDayDetails(day);
                            } else if (isCurrentMonth) {
                              toast.error("No positions found", {
                                description: format(day, "PPPP"),
                                duration: 2000,
                              });
                            }
                          }}
                          className={cn(
                            "min-h-[100px] sm:min-h-[160px] p-2 sm:p-4 border-r border-b border-[#262626] transition-all hover:bg-[#1f1f1f]/50 group relative cursor-pointer",
                            !isCurrentMonth && "opacity-20 grayscale",
                            selectedDate && isSameDay(day, selectedDate) && "bg-sky-500/5"
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
                                pnl > 0 ? "text-sky-400" : "text-rose-400"
                              )}>
                                {pnl > 0 ? '+' : ''}<span className="hidden sm:inline">{formatCurrency(pnl)}</span>
                                <span className="sm:hidden">{pnl > 0 ? 'W' : 'L'}</span>
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5 sm:space-y-1">
                            {dayTrades.slice(0, 2).map(trade => (
                              <div 
                                key={`calendar-${trade.id}`}
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
                    {/* Weekly Total Column Cell */}
                    <div className="min-h-[100px] sm:min-h-[160px] p-2 sm:p-4 border-b border-[#262626] bg-sky-500/[0.02] flex flex-col justify-center items-center">
                      <div className={cn(
                        "px-2 py-1 rounded-lg text-[9px] sm:text-xs font-black border tracking-tight",
                        getWeeklyPnL(week[0]) >= 0 ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {getWeeklyPnL(week[0]) >= 0 ? '+' : ''}{formatCurrency(getWeeklyPnL(week[0]))}
                      </div>
                    </div>
                  </React.Fragment>
                ));
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Daily Details Modal */}
      <AnimatePresence>
        {viewingDayDetails && (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setViewingDayDetails(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#141414] border border-[#262626] rounded-[40px] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10 border-b border-[#262626] flex items-center justify-between bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
                <div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                    {format(viewingDayDetails, 'MMMM d, yyyy')}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Daily Performance</span>
                    <div className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black",
                      getDayPnL(viewingDayDetails) >= 0 ? "bg-sky-500/10 text-sky-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {getDayPnL(viewingDayDetails) >= 0 ? '+' : ''}{formatCurrency(getDayPnL(viewingDayDetails))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingDayDetails(null)}
                  className="w-12 h-12 bg-[#1f1f1f] rounded-2xl text-neutral-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-10 space-y-6">
                {getDayTrades(viewingDayDetails).map((trade) => (
                  <div key={trade.id} className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-sky-500/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        trade.pnl >= 0 ? "bg-sky-500/10 text-sky-400" : "bg-rose-500/10 text-rose-400"
                      )}>
                        {trade.pnl >= 0 ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-white">{trade.asset}</h4>
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                            trade.type === 'LONG' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          )}>
                            {trade.type}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-neutral-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{format(new Date(trade.entry_date), 'HH:mm')}</span>
                          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">US: {formatToEST(trade.entry_date)} EST</span>
                          <span>•</span>
                          <span>{trade.contract_size} Lots @ {trade.entry_price}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Profit/Loss</p>
                        <p className={cn(
                          "text-xl font-black italic",
                          trade.pnl >= 0 ? "text-sky-400" : "text-rose-400"
                        )}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setViewingDayDetails(null);
                          handleEditTrade(trade);
                        }}
                        className="w-10 h-10 bg-[#1f1f1f] border border-[#262626] rounded-xl text-neutral-400 hover:text-white hover:border-sky-500/50 transition-all flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      <div className="space-y-3 relative" ref={assetRef}>
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

                      <div className="space-y-3 relative" ref={strategyRef}>
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

                      <div className="space-y-4" ref={exitRef}>
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
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                      setEditingTradeId(null);
                    }}
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

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action cannot be undone."
        onConfirm={executeDeleteTrade}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Trade Details Modal */}
      <AnimatePresence>
        {selectedTrade && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md overflow-y-auto py-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-[#141414] border border-[#262626] rounded-[40px] overflow-hidden shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-8 border-b border-[#262626]">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedTrade.pnl > 0 ? "bg-sky-500/10 text-sky-400" : "bg-neutral-500/10 text-neutral-500"
                  )}>
                    {selectedTrade.pnl > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{selectedTrade.asset}</h2>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                      <span>{selectedTrade.type}</span>
                      <span>•</span>
                      <span>{format(new Date(selectedTrade.entry_date), 'MMMM dd, yyyy HH:mm')}</span>
                      <span>•</span>
                      <span className="text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">US: {formatToEST(selectedTrade.entry_date)} EST</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      handleEditTrade(selectedTrade);
                      setSelectedTrade(null);
                    }}
                    className="p-3 bg-[#1f1f1f] rounded-2xl text-neutral-400 hover:text-sky-400 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedTrade(null)}
                    className="p-3 bg-[#1f1f1f] rounded-2xl text-neutral-500 hover:text-white transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                  {/* Screenshot */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Trade Screenshot</h3>
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl overflow-hidden aspect-video relative group">
                      {selectedTrade.screenshot_url ? (
                        <img 
                          src={selectedTrade.screenshot_url} 
                          alt="Trade Setup" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700">
                          <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">No screenshot provided</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Context & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Entry Context</h3>
                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 min-h-[120px]">
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                          {selectedTrade.entry_context || 'No entry context recorded.'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Psychology</h3>
                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 min-h-[120px]">
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                          {selectedTrade.psychology_status || 'No psychology notes recorded.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Exits Table */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Exit History</h3>
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#262626] bg-[#141414]">
                            <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Time</th>
                            <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Qty</th>
                            <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Price</th>
                            <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">PnL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTrade.trade_exits?.map((exit, i) => (
                            <tr key={i} className="border-b border-[#262626]/50 last:border-0">
                              <td className="px-6 py-4 text-xs font-bold text-neutral-400">
                                {exit.exit_timestamp ? format(new Date(exit.exit_timestamp), 'HH:mm:ss') : '-'}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-white">{exit.closed_contract}</td>
                              <td className="px-6 py-4 text-xs font-bold text-white">{exit.exit_price.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                  exit.exit_status === 'TP' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                )}>
                                  {exit.exit_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={cn(
                                  "text-xs font-black",
                                  exit.pnl_for_this_exit > 0 ? "text-sky-400" : "text-neutral-400"
                                )}>
                                  {exit.pnl_for_this_exit > 0 ? '+' : ''}{formatCurrency(exit.pnl_for_this_exit)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Performance Card */}
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-8 space-y-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Net Profit/Loss</p>
                      <p className={cn(
                        "text-4xl font-black tracking-tighter",
                        selectedTrade.pnl > 0 ? "text-sky-400" : "text-neutral-200"
                      )}>
                        {selectedTrade.pnl > 0 ? '+' : ''}{formatCurrency(selectedTrade.pnl)}
                      </p>
                      <p className="text-xs font-bold text-neutral-500">{formatPercent(selectedTrade.pnl_percent)} Return</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-8 border-t border-[#262626]">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Entry Price</p>
                        <p className="text-lg font-bold text-white">{selectedTrade.entry_price.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Avg Exit</p>
                        <p className="text-lg font-bold text-white">{selectedTrade.exit_price?.toLocaleString() || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Contract Size</p>
                        <p className="text-lg font-bold text-white">{selectedTrade.contract_size}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Asset</p>
                        <p className="text-lg font-bold text-white">{selectedTrade.asset}</p>
                      </div>
                    </div>

                    <div className="space-y-6 pt-8 border-t border-[#262626]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-sky-500" />
                          <span className="text-sm font-bold text-neutral-400">Strategy</span>
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-widest">
                          {selectedTrade.strategy?.strategy_name || 'Manual'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-sky-500" />
                          <span className="text-sm font-bold text-neutral-400">Market Regime</span>
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-widest">
                          {selectedTrade.market_regime || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Management */}
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-8 space-y-6">
                    <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Risk Management</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-500">Take Profit</span>
                        <span className="text-xs font-black text-emerald-400">{selectedTrade.take_profit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-500">Stop Loss</span>
                        <span className="text-xs font-black text-rose-400">{selectedTrade.stop_loss.toLocaleString()}</span>
                      </div>
                      <div className="pt-4 border-t border-[#262626] flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-500">Risk/Reward</span>
                        <span className="text-xs font-black text-white">
                          {selectedTrade.entry_price && selectedTrade.take_profit && selectedTrade.stop_loss ? (
                            Math.abs((selectedTrade.take_profit - selectedTrade.entry_price) / (selectedTrade.entry_price - selectedTrade.stop_loss)).toFixed(2)
                          ) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
