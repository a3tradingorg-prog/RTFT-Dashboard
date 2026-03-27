# Development Log (dm.md)

## Date: 2026-03-26

### 1. Journal Page Fixes & Enhancements
- **Fixed PnL Calculation**: 
    - Implemented correct contract multipliers for MNQ ($2), NQ ($20), MES ($5), and ES ($50).
    - Added commission subtraction to the net PnL calculation.
    - Fixed a bug where PnL was resetting to 0 after editing a trade.
- **Improved Edit Trade Logic**:
    - Ensured explicit exit strategy rows are loaded correctly into the form.
    - Added a fallback for trades closed without explicit exit rows to maintain PnL accuracy.
- **Status Options & Display**:
    - Updated exit status options to: **TP**, **SL**, **BE**, **Partial TP**, **Cut lose**, and **Trailing TP**.
    - Enhanced the "Details" tab to show the specific exit status (e.g., TP, SL) instead of just "CLOSED".
    - Ordered trade exits by `created_at` descending to always show the latest status.
- **Bug Fixes**:
    - Fixed `null value in column "exit_date"` error by providing a default date.
    - Removed `confirm()` and `prompt()` calls that were blocked in the iframe environment.

### 2. Dashboard Fixes & Enhancements
- **Logic Corrections**:
    - **Current Balance**: Now accurately calculated as `initial_balance + total_pnl`.
    - **Profit Factor**: Redefined as the ratio of total gross profit to total gross loss (capped at 9.99).
    - **Consistency Rule**: Implemented the 50% consistency rule (no single day profit > 50% of profit target).
    - **Trailing Drawdown**: Implemented correct trailing logic where the drawdown floor follows the peak balance (`peak - max_drawdown`).
- **Visualizations**:
    - **Edge Score Radar Chart**: Added a Radar Chart showing Win %, Profit Factor, and Avg Win/Loss ratio.
    - **Profit Target Progress**: Enhanced with "Amount Left" and "Target Amount" display.
    - **Drawdown Usage**: Added "Safe Distance" and "Drawdown Floor" metrics.
    - **Equity Curve**: Verified it correctly starts from the initial balance.
- **Data Isolation**: 
    - Ensured all dashboard statistics and charts are strictly filtered by the `selectedAccountId`.
    - Implemented clearing of old data (`trades`, `dailyPnls`) when switching accounts to prevent data flickering or leakage.

### 3. Database & Types
- **Type Updates**: 
    - Updated `Trade` type to include `trade_exits` (matching Supabase's joined response).
    - Updated `TradeExit` status enum to match the new options.
- **Query Optimization**:
    - Added ordering to joined `trade_exits` in `fetchJournalData`.

### 5. Supabase Connection & Error Handling
- **Supabase Client**: Updated `src/lib/supabase.ts` to handle missing or invalid credentials more gracefully and provide clearer console errors.
- **Environment Variables**: Updated `.env.example` to use the `VITE_` prefix for Supabase variables, ensuring consistency with Vite's client-side exposure rules.
- **Error Handling**: Added `try/catch` blocks and comprehensive error logging to all major data fetching and mutation points in:
    - `src/pages/Dashboard.tsx`
    - `src/pages/Journal.tsx`
    - `src/pages/Accounts.tsx`
    - `src/pages/Trades.tsx`
    - `src/pages/AISummary.tsx`
- **Bug Fixes**:
    - Resolved "Failed to fetch" issues by ensuring Supabase client doesn't crash on missing keys and provides actionable feedback.
    - Improved form submission error reporting in `Journal.tsx`.
