import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { TradingAccount } from '../types';

interface AccountContextType {
  accounts: TradingAccount[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string) => void;
  selectedAccount: TradingAccount | undefined;
  loading: boolean;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountIdState] = useState<string | null>(localStorage.getItem('selectedAccountId'));
  const [loading, setLoading] = useState(true);

  const setSelectedAccountId = (id: string) => {
    setSelectedAccountIdState(id);
    localStorage.setItem('selectedAccountId', id);
  };

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (data) {
        const uniqueAccounts = Array.from(new Map(data.map((a: any) => [a.id, a])).values());
        setAccounts(uniqueAccounts as TradingAccount[]);
        if (uniqueAccounts.length > 0) {
          const savedId = localStorage.getItem('selectedAccountId');
          const exists = uniqueAccounts.some(a => a.id === savedId);
          if (!savedId || !exists) {
            setSelectedAccountId(uniqueAccounts[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching accounts in context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts().catch(err => console.error('Initial context accounts fetch error:', err));

    if (user) {
      const subscription = supabase
        .channel('accounts_realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'accounts',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchAccounts().catch(err => console.error('Realtime context accounts fetch error:', err));
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
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
      refreshAccounts: fetchAccounts
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
