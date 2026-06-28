import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from './supabase';
import { useAuth } from './AuthContext';
import { TradingAccount, Trade, DailyPnL } from '../types';

interface AccountContextType {
  accounts: TradingAccount[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string) => void;
  selectedAccount: TradingAccount | undefined;
  loading: boolean;
  refreshAccounts: () => Promise<void>;
  cachedTrades: Record<string, Trade[]>;
  setCachedTrades: (accountId: string, trades: Trade[]) => void;
  cachedDailyPnls: Record<string, DailyPnL[]>;
  setCachedDailyPnls: (accountId: string, dailyPnls: DailyPnL[]) => void;
}

const DEFAULT_MOCK_ACCOUNTS: TradingAccount[] = [
  {
    id: 'mock-acc-1',
    user_id: '',
    name: 'Challenge Phase 1',
    propfirm: 'MyForexFunds',
    account_size: '$100,000',
    account_type: 'Challenge',
    status: 'active',
    profit_target: 8000,
    max_drawdown: 5000,
    consistency_rules: 'No Consistency',
    asset: 'NQ',
    commission: 1.5,
    initial_balance: 100000,
    current_balance: 102450,
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-acc-2',
    user_id: '',
    name: 'Funded Account #1',
    propfirm: 'Apex Trader Funding',
    account_size: '$50,000',
    account_type: 'Funded',
    status: 'funded',
    profit_target: 0,
    max_drawdown: 2500,
    consistency_rules: 'No Consistency',
    asset: 'MNQ',
    commission: 1.2,
    initial_balance: 50000,
    current_balance: 51200,
    created_at: new Date().toISOString()
  }
];

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountIdState] = useState<string | null>(localStorage.getItem('selectedAccountId'));
  const [loading, setLoading] = useState(true);
  const [cachedTrades, setCachedTradesState] = useState<Record<string, Trade[]>>({});
  const [cachedDailyPnls, setCachedDailyPnlsState] = useState<Record<string, DailyPnL[]>>({});

  const setSelectedAccountId = (id: string) => {
    setSelectedAccountIdState(id);
    localStorage.setItem('selectedAccountId', id);
  };

  const setCachedTrades = (accountId: string, trades: Trade[]) => {
    setCachedTradesState(prev => ({ ...prev, [accountId]: trades }));
  };

  const setCachedDailyPnls = (accountId: string, dailyPnls: DailyPnL[]) => {
    setCachedDailyPnlsState(prev => ({ ...prev, [accountId]: dailyPnls }));
  };

  const fetchAccounts = async (retries = 3, delayMs = 3000) => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;
        
        if (data) {
          const uniqueAccounts = Array.from(new Map(data.map((a: any) => [a.id, a])).values()) as TradingAccount[];
          setAccounts(uniqueAccounts);
          if (uniqueAccounts.length > 0) {
            const savedId = localStorage.getItem('selectedAccountId');
            const exists = uniqueAccounts.some(a => a.id === savedId);
            if (savedId && exists) {
              setSelectedAccountIdState(savedId);
            } else {
              setSelectedAccountIdState(uniqueAccounts[0].id);
              localStorage.setItem('selectedAccountId', uniqueAccounts[0].id);
            }
          } else {
            setSelectedAccountIdState(null);
            localStorage.removeItem('selectedAccountId');
          }
          setLoading(false);
          return; // Success! Exit function.
        }
      } catch (err: any) {
        console.warn(`fetchAccounts attempt ${attempt} of ${retries} failed:`, err);
        lastError = err;

        // If not configured, don't bother retrying
        if (!isConfigured) {
          break;
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // Handle fallback or error finalization
    if (!isConfigured) {
      console.log('Using offline mock accounts fallback (Supabase not configured)');
      const mockAccounts = DEFAULT_MOCK_ACCOUNTS.map(a => ({ ...a, user_id: user.id! }));
      setAccounts(mockAccounts);
      const savedId = localStorage.getItem('selectedAccountId');
      const exists = mockAccounts.some(a => a.id === savedId);
      if (!savedId || !exists) {
        setSelectedAccountId(mockAccounts[0].id);
      }
    } else {
      console.error('All fetchAccounts attempts failed on configured database:', lastError);
      // Keep empty if they have a real database but there are 0 accounts or database connection fails completely.
      setAccounts([]);
      setSelectedAccountIdState(null);
      localStorage.removeItem('selectedAccountId');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts().catch(err => console.warn('Initial context accounts fetch failed:', err));

    if (user) {
      const subscription = supabase
        .channel('accounts_realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'accounts',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchAccounts().catch(err => console.warn('Realtime context accounts fetch failed:', err));
        })
        .subscribe();

      return () => {
        try {
          const p = subscription.unsubscribe();
          if (p && typeof p.catch === 'function') {
            p.catch((err: any) => console.warn('Unsubscribe warning:', err));
          }
        } catch (e) {
          console.warn('Unsubscribe throw warning:', e);
        }
      };
    }
  }, [user]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <AccountContext.Provider value={{ 
      accounts, 
      selectedAccountId, 
      setSelectedAccountId, 
      selectedAccount, 
      loading,
      refreshAccounts: fetchAccounts,
      cachedTrades,
      setCachedTrades,
      cachedDailyPnls,
      setCachedDailyPnls
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
