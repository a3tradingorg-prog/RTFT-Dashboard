-- FULL SUPABASE SCHEMA UPDATE
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Migration: Handle 'symbol' to 'asset' transition
DO $$ 
BEGIN 
    -- If 'symbol' exists but 'asset' doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='symbol') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='asset') THEN
            ALTER TABLE trades RENAME COLUMN symbol TO asset;
        ELSE
            -- If both exist, drop 'symbol' as it's redundant
            ALTER TABLE trades DROP COLUMN symbol;
        END IF;
    END IF;
    
    -- If 'quantity' exists but 'contract_size' doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='quantity') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='contract_size') THEN
            ALTER TABLE trades RENAME COLUMN quantity TO contract_size;
        ELSE
            ALTER TABLE trades DROP COLUMN quantity;
        END IF;
    END IF;
END $$;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  propfirm TEXT,
  account_size TEXT,
  account_type TEXT CHECK (account_type IN ('Challenge', 'Funded', 'Fail/Breached')),
  profit_target DECIMAL(12,2),
  max_drawdown DECIMAL(12,2),
  consistency_rules TEXT,
  asset TEXT CHECK (asset IN ('MNQ', 'NQ', 'MES', 'ES', 'MGC', 'GC')),
  commission DECIMAL(10,2) DEFAULT 0,
  initial_balance DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  asset TEXT CHECK (asset IN ('MNQ', 'NQ', 'MES', 'ES', 'MGC', 'GC')),
  type TEXT CHECK (type IN ('LONG', 'SHORT')),
  entry_date TIMESTAMP WITH TIME ZONE,
  exit_date TIMESTAMP WITH TIME ZONE,
  contract_size DECIMAL(10,2),
  entry_price DECIMAL(12,4),
  exit_price DECIMAL(12,4),
  take_profit DECIMAL(12,4) DEFAULT 0,
  stop_loss DECIMAL(12,4) DEFAULT 0,
  pnl DECIMAL(12,2) DEFAULT 0,
  pnl_percent DECIMAL(10,4) DEFAULT 0,
  status TEXT CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
  notes TEXT,
  screenshot_url TEXT,
  entry_context TEXT,
  market_regime TEXT,
  psychology_status TEXT,
  fundamental_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Trade Exits Table
CREATE TABLE IF NOT EXISTS trade_exits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID REFERENCES trades ON DELETE CASCADE NOT NULL,
  closed_contract DECIMAL(10,2) NOT NULL,
  exit_price DECIMAL(12,4) NOT NULL,
  exit_status TEXT CHECK (exit_status IN ('TP', 'SL', 'Cut lose', 'Partial TP', 'Move BE')) NOT NULL,
  exit_reason TEXT CHECK (exit_reason IN ('Structural Break', 'Psychology Move')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Daily PnL Table
CREATE TABLE IF NOT EXISTS daily_pnl (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  pnl DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(account_id, date)
);

-- 6. News Analyses Table
CREATE TABLE IF NOT EXISTS news_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date_range TEXT NOT NULL,
  raw_output TEXT,
  analysis_json JSONB NOT NULL,
  summary_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS trades_account_id_idx ON trades(account_id);
CREATE INDEX IF NOT EXISTS trades_user_id_idx ON trades(user_id);
CREATE INDEX IF NOT EXISTS trades_entry_date_idx ON trades(entry_date);
CREATE INDEX IF NOT EXISTS daily_pnl_account_id_idx ON daily_pnl(account_id);
CREATE INDEX IF NOT EXISTS daily_pnl_date_idx ON daily_pnl(date);
CREATE INDEX IF NOT EXISTS trade_exits_trade_id_idx ON trade_exits(trade_id);
CREATE INDEX IF NOT EXISTS news_analyses_user_id_idx ON news_analyses(user_id);
CREATE INDEX IF NOT EXISTS news_analyses_created_at_idx ON news_analyses(created_at);

-- 7. Ensure all columns exist in 'trades' (Safe Update)
DO $$ 
BEGIN 
    -- asset
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='asset') THEN
        ALTER TABLE trades ADD COLUMN asset TEXT CHECK (asset IN ('MNQ', 'NQ', 'MES', 'ES', 'MGC', 'GC'));
    END IF;
    
    -- contract_size
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='contract_size') THEN
        ALTER TABLE trades ADD COLUMN contract_size DECIMAL(10,2);
    END IF;

    -- take_profit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='take_profit') THEN
        ALTER TABLE trades ADD COLUMN take_profit DECIMAL(12,4) DEFAULT 0;
    END IF;

    -- stop_loss
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='stop_loss') THEN
        ALTER TABLE trades ADD COLUMN stop_loss DECIMAL(12,4) DEFAULT 0;
    END IF;

    -- screenshot_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='screenshot_url') THEN
        ALTER TABLE trades ADD COLUMN screenshot_url TEXT;
    END IF;

    -- entry_context
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='entry_context') THEN
        ALTER TABLE trades ADD COLUMN entry_context TEXT;
    END IF;

    -- market_regime
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='market_regime') THEN
        ALTER TABLE trades ADD COLUMN market_regime TEXT;
    END IF;

    -- psychology_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='psychology_status') THEN
        ALTER TABLE trades ADD COLUMN psychology_status TEXT;
    END IF;

    -- fundamental_context
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='fundamental_context') THEN
        ALTER TABLE trades ADD COLUMN fundamental_context TEXT;
    END IF;
END $$;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_pnl ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_analyses ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Accounts
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);

-- Trades
DROP POLICY IF EXISTS "Users can manage own trades" ON trades;
CREATE POLICY "Users can manage own trades" ON trades FOR ALL USING (auth.uid() = user_id);

-- Daily PnL
DROP POLICY IF EXISTS "Users can manage own daily_pnl" ON daily_pnl;
CREATE POLICY "Users can manage own daily_pnl" ON daily_pnl FOR ALL USING (auth.uid() = user_id);

-- Trade Exits
DROP POLICY IF EXISTS "Users can manage own trade exits" ON trade_exits;
CREATE POLICY "Users can manage own trade exits" ON trade_exits FOR ALL 
USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_exits.trade_id AND trades.user_id = auth.uid()));

-- News Analyses
DROP POLICY IF EXISTS "Users can manage own news_analyses" ON news_analyses;
CREATE POLICY "Users can manage own news_analyses" ON news_analyses FOR ALL USING (auth.uid() = user_id);

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- Enable Realtime for critical tables
BEGIN;
  -- Create publication if it doesn't exist
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END $$;

  -- Add tables to the publication (ignoring errors if already added)
  DO $$
  DECLARE
    t text;
    tables_to_add text[] := ARRAY['trades', 'daily_pnl', 'accounts', 'profiles', 'news_analyses'];
  BEGIN
    FOREACH t IN ARRAY tables_to_add LOOP
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
      EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, skip
        NULL;
      END;
    END LOOP;
  END $$;
COMMIT;
