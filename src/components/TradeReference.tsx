import React, { useState } from 'react';
import { 
  Clock, 
  Calculator, 
  Maximize, 
  Book, 
  Info, 
  Shield, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown,
  Zap,
  Target,
  Layers,
  List,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TradeReference() {
  // Calculator State
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('MNQ');
  const [riskAmount, setRiskAmount] = useState(100);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

  const assetConfigs: Record<string, { pointValue: number, name: string }> = {
    'MNQ': { pointValue: 2, name: 'Micro E-mini Nasdaq-100' },
    'NQ': { pointValue: 20, name: 'E-mini Nasdaq-100' },
    'MES': { pointValue: 5, name: 'Micro E-mini S&P 500' },
    'ES': { pointValue: 50, name: 'E-mini S&P 500' },
    'GC': { pointValue: 100, name: 'Gold Futures' },
    'MGC': { pointValue: 10, name: 'Micro Gold Futures' }
  };

  const slPoints = Array.from({ length: 7 }, (_, i) => (i + 1) * 10); // 10, 20, 30, 40, 50, 60, 70

  const calculateContracts = (sl: number) => {
    const config = assetConfigs[selectedAssetSymbol];
    if (!config) return 0;
    // Formula: Risk / (SL Points * Point Value)
    // Round down to nearest whole number
    const contracts = riskAmount / (sl * config.pointValue);
    return Math.floor(contracts);
  };

  return (
    <div className="space-y-10">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Time Based Liquidity Card */}
        <div className="lg:col-span-6 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Time Based Liquidity</h3>
              <p className="text-xs text-neutral-500 font-medium">Algorithmic Delivery Windows (NY Time)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">NY Time Standards</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-[#0a0a0a] rounded-xl border border-[#262626]">
                  <span className="text-xs text-neutral-400">Standard Time</span>
                  <span className="text-xs font-bold text-white">UTC-5</span>
                </div>
                <div className="flex justify-between p-3 bg-[#0a0a0a] rounded-xl border border-[#262626]">
                  <span className="text-xs text-neutral-400">Daylight Savings</span>
                  <span className="text-xs font-bold text-white">UTC-4</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Global Sessions</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-[#0a0a0a] rounded-xl border border-[#262626]">
                  <span className="text-xs text-neutral-400">Settlement</span>
                  <span className="text-xs font-bold text-white">4:14 PM</span>
                </div>
                <div className="flex justify-between p-3 bg-[#0a0a0a] rounded-xl border border-[#262626]">
                  <span className="text-xs text-neutral-400">NDOG</span>
                  <span className="text-xs font-bold text-white">4:59 - 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">NY Session Windows</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Pre-market', time: '7:00 AM' },
                { label: 'Opening Range', time: '9:30 - 10:00 AM' },
                { label: 'Macro Window 1', time: '9:50 - 10:10 AM' },
                { label: 'Macro Window 2', time: '10:50 - 11:10 AM' },
                { label: 'Lunch Time', time: '11:30 AM - 1:30 PM' },
                { label: 'PM Session', time: '1:30 - 4:00 PM' },
              ].map((win) => (
                <div key={win.label} className="flex justify-between p-3 bg-[#0a0a0a] rounded-xl border border-[#262626]">
                  <span className="text-xs text-neutral-400">{win.label}</span>
                  <span className="text-xs font-bold text-sky-400">{win.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contract Size Calculator Card */}
        <div className="lg:col-span-6 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Contract Size Calculator</h3>
                <p className="text-xs text-neutral-500 font-medium">Risk Management Tool</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Asset Selector */}
              <div className="relative">
                <button 
                  onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-xs font-bold text-white hover:border-sky-500/50 transition-all"
                >
                  {selectedAssetSymbol}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isAssetDropdownOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isAssetDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full right-0 mt-2 w-32 bg-[#1f1f1f] border border-[#262626] rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {Object.keys(assetConfigs).map(symbol => (
                        <button
                          key={symbol}
                          onClick={() => {
                            setSelectedAssetSymbol(symbol);
                            setIsAssetDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-xs font-bold transition-all",
                            selectedAssetSymbol === symbol ? "bg-sky-500 text-black" : "text-neutral-400 hover:bg-[#262626] hover:text-white"
                          )}
                        >
                          {symbol}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Risk Selector */}
              <div className="flex bg-[#0a0a0a] border border-[#262626] rounded-xl p-1">
                {[100, 200, 300, 400, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setRiskAmount(amt)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black transition-all",
                      riskAmount === amt ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
                    )}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#262626]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">SL Points</th>
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Contract Size</th>
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Risk Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {slPoints.map(sl => (
                  <tr key={sl} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-xs font-bold text-white">{sl} pts</td>
                    <td className="p-4 text-xs font-black text-sky-400 text-right">{calculateContracts(sl)}</td>
                    <td className="p-4 text-xs font-medium text-neutral-500 text-right">${riskAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Opening Range Gap Theory */}
        <div className="lg:col-span-7 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Maximize className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Opening Range Gap Theory</h3>
              <p className="text-xs text-neutral-500 font-medium">Market Open Dynamics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">30-Min Opening Range</h4>
              <div className="p-5 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">9:30 AM - 10:00 AM</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  The first 30 minutes of the NY session sets the initial balance. The high and low of this range often act as key support/resistance for the day.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Gap Scenarios (Points)</h4>
              <div className="space-y-3">
                {[
                  { range: '< 75 pts', action: 'No Trade', color: 'text-neutral-500' },
                  { range: '75 - 170 pts', action: 'C.E Fill Target', color: 'text-amber-500' },
                  { range: '> 170 pts', action: 'Trend Following', color: 'text-emerald-500' },
                ].map((item) => (
                  <div key={item.range} className="flex justify-between p-3 bg-[#0a0a0a] rounded-xl border border-[#262626]">
                    <span className="text-xs font-bold text-white">{item.range}</span>
                    <span className={cn("text-xs font-black uppercase tracking-widest", item.color)}>{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contract Specifications */}
        <div className="lg:col-span-5 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <List className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Contract Specs</h3>
              <p className="text-xs text-neutral-500 font-medium">Symbols & Months</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#262626]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Symbol</th>
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Months</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {[
                  { symbol: 'ES / NQ / MES / MNQ', months: 'H, M, U, Z' },
                  { symbol: 'GC / MGC', months: 'G, J, M, Q, V, Z' }
                ].map(item => (
                  <tr key={item.symbol} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-xs font-bold text-white">{item.symbol}</td>
                    <td className="p-4 text-xs font-black text-sky-400 text-right">{item.months}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FVG Encyclopedia */}
        <div className="lg:col-span-12 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">FVG Encyclopedia</h3>
                <p className="text-xs text-neutral-500 font-medium">Fair Value Gap Variations</p>
              </div>
            </div>
          </div>

            {/* FVG Encyclopedia Content */}
            {[
              { title: 'BISI', desc: 'Buyside Imbalance Sellside Inefficiency. A gap created in an up move.', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
              { title: 'SIBI', desc: 'Sellside Imbalance Buyside Inefficiency. A gap created in a down move.', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
              { title: 'Inversion FVG', desc: 'An FVG that has been closed through and now acts as support/resistance.', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
              { title: 'Breakaway Gap', desc: 'A gap that remains open, indicating strong trend momentum.', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
            ].map(item => (
              <div key={item.title} className={cn("p-6 rounded-2xl border space-y-3 transition-all", item.bg, item.border)}>
                <h4 className={cn("text-sm font-bold", item.color)}>{item.title}</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
        </div>

        {/* Advanced Gap Theory */}
        <div className="lg:col-span-12 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Book className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Advanced Gap Theory</h3>
              <p className="text-xs text-neutral-500 font-medium">ICT Gap Classifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-white">Common Gap</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Occurs within a trading range or congestion. These gaps are usually filled quickly and lack significant directional conviction. They represent minor imbalances that the market resolves rapidly.
              </p>
            </div>
            <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-white">Measuring Gap</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Also known as a Runaway Gap. It occurs in the middle of a powerful trend, suggesting that the move is only halfway complete. It serves as a projection tool for price targets based on the distance already traveled.
              </p>
            </div>
          </div>
        </div>

        {/* Order Usage & Risk Management */}
        <div className="lg:col-span-6 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Order Usage Guide</h3>
              <p className="text-xs text-neutral-500 font-medium">Position Execution Standards</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <ArrowUp className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Long Position</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 uppercase">Stop Loss</span>
                  <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded text-[9px] font-black border border-rose-500/20">SELL STOP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 uppercase">Take Profit</span>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black border border-emerald-500/20">SELL LIMIT</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <ArrowDown className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Short Position</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 uppercase">Stop Loss</span>
                  <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded text-[9px] font-black border border-rose-500/20">BUY STOP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 uppercase">Take Profit</span>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black border border-emerald-500/20">BUY LIMIT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Risk Management</h3>
              <p className="text-xs text-neutral-500 font-medium">Capital Preservation Rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: '1% Rule', desc: 'Never risk more than 1% of equity per trade.', icon: Target },
              { title: 'Scaling', desc: 'Take partials at key levels to lock in profit.', icon: TrendingUp },
              { title: 'Tilt Check', desc: 'Walk away after 2 consecutive losses.', icon: AlertTriangle },
            ].map(item => (
              <div key={item.title} className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-sky-500">
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.title}</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
