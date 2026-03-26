export type TradingAccount = {
  id: string;
  user_id: string;
  name: string;
  propfirm: string;
  account_size: string;
  account_type: 'Challenge' | 'Funded' | 'Fail/Breached';
  profit_target: number;
  max_drawdown: number;
  consistency_rules: string;
  asset: 'MNQ' | 'NQ' | 'MES' | 'ES' | 'MGC' | 'GC';
  commission: number;
  initial_balance: number;
  current_balance: number;
  created_at: string;
};

export type Trade = {
  id: string;
  account_id: string;
  user_id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  status: 'OPEN' | 'CLOSED';
  pnl: number;
  pnl_percent: number;
  entry_date: string;
  exit_date: string | null;
  notes: string | null;
  created_at: string;
};

export type DailyPnL = {
  id: string;
  account_id: string;
  date: string;
  pnl: number;
};

export type Resource = {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
};
