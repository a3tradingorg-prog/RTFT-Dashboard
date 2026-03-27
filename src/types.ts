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

export type TradeExit = {
  id: string;
  trade_id: string;
  closed_contract: number;
  exit_price: number;
  exit_status: 'TP' | 'SL' | 'Cut lose' | 'Partial TP' | 'Move BE';
  exit_reason: 'Structural Break' | 'Psychology Move' | null;
  pnl_for_this_exit?: number;
  commission_for_this_exit?: number;
  exit_timestamp?: string;
  created_at: string;
};

export type Strategy = {
  strategy_id: string;
  user_id: string;
  strategy_name: string;
  description: string | null;
  // Entry Confirmation
  context_setup: string | null;
  market_regime: string | null;
  fundamental_situation: string | null;
  // Exit Strategy
  partial_close_logic: string | null;
  cut_loss_sl_logic: string | null;
  move_sl_be_structure: string | null;
  take_profit_targets: string | null;
  // Psychology Status
  calm_flow_state: string | null;
  fear_anxiety: string | null;
  greed_fomo: string | null;
  exhaustion_tilt: string | null;
  
  assets_applicable: string[];
  timeframes_applicable: string[];
  status: 'Active' | 'Archived' | 'Under Review';
  created_at: string;
  updated_at: string;
};

export type Trade = {
  id: string;
  account_id: string;
  user_id: string;
  asset: 'MNQ' | 'NQ' | 'MES' | 'ES' | 'MGC' | 'GC';
  type: 'LONG' | 'SHORT';
  entry_date: string;
  exit_date: string | null;
  contract_size: number;
  entry_price: number;
  exit_price: number | null;
  take_profit: number;
  stop_loss: number;
  screenshot_url: string | null;
  // Strategy Tab
  entry_context: string | null;
  market_regime: string | null;
  psychology_status: string | null;
  fundamental_context: string | null;
  strategy_id: string | null;
  // Computed fields
  pnl: number;
  pnl_percent: number;
  status: 'OPEN' | 'CLOSED';
  created_at: string;
  // Joined data
  trade_exits?: TradeExit[];
  strategy?: Strategy;
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
