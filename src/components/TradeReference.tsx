import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AssetSpecification, TradingReference } from '../types';
import { 
  Clock, 
  Calculator, 
  Table, 
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
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function TradeReference() {
  const [assets, setAssets] = useState<AssetSpecification[]>([]);
  const [references, setReferences] = useState<TradingReference[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Cheat Sheet State
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('MNQ');
  const [riskAmount, setRiskAmount] = useState(100);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [assetsRes, refsRes] = await Promise.all([
        supabase.from('asset_specifications').select('*').order('symbol'),
        supabase.from('trading_references').select('*').order('display_order')
      ]);

      if (assetsRes.data) setAssets(assetsRes.data);
      if (refsRes.data) setReferences(refsRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const selectedAsset = assets.find(a => a.symbol === selectedAssetSymbol);

  // Cheat Sheet Calculations
  const slPoints = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
  const calculateContracts = (sl: number) => {
    if (!selectedAsset) return 0;
    // Risk = SL Points * Point Value * Contracts
    // Contracts = Risk / (SL Points * Point Value)
    const contracts = riskAmount / (sl * selectedAsset.point_value);
    return Math.floor(contracts * 100) / 100; // 2 decimal places
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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

        {/* Dynamic Cheat Sheet Card */}
        <div className="lg:col-span-6 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Risk Cheat Sheet</h3>
                <p className="text-xs text-neutral-500 font-medium">Contracts vs SL Points</p>
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
                      {assets.map(a => (
                        <button
                          key={a.symbol}
                          onClick={() => {
                            setSelectedAssetSymbol(a.symbol);
                            setIsAssetDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-xs font-bold transition-all",
                            selectedAssetSymbol === a.symbol ? "bg-sky-500 text-black" : "text-neutral-400 hover:bg-[#262626] hover:text-white"
                          )}
                        >
                          {a.symbol}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Risk Selector */}
              <div className="flex bg-[#0a0a0a] border border-[#262626] rounded-xl p-1">
                {[100, 200, 500].map(amt => (
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
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Contracts</th>
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

        {/* Opening Range & Gap Theory */}
        <div className="lg:col-span-7 bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Maximize className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Opening Range & Gap Theory</h3>
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
              <p className="text-xs text-neutral-500 font-medium">Point & Tick Values</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#262626]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Asset</th>
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Pt Value</th>
                  <th className="p-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Tick</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {assets.map(a => (
                  <tr key={a.symbol} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{a.symbol}</span>
                        <span className="text-[10px] text-neutral-500">{a.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-black text-white text-right">${a.point_value}</td>
                    <td className="p-4 text-xs font-medium text-neutral-400 text-right">{a.tick_size} / ${a.tick_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">PnL Formula</span>
            </div>
            <code className="text-[11px] text-neutral-300 font-mono">
              (Exit - Entry) × Pt Value × Contracts
            </code>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {references.filter(r => r.category === 'FVG').map(ref => (
              <div key={ref.reference_id} className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-4 hover:border-sky-500/30 transition-all group">
                <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">{ref.title}</h4>
                <div className="prose prose-invert prose-p:text-[11px] prose-p:text-neutral-500 prose-p:leading-relaxed max-w-none">
                  <Markdown>{ref.content}</Markdown>
                </div>
              </div>
            ))}
            
            {/* Fallback if no DB data */}
            {references.filter(r => r.category === 'FVG').length === 0 && (
              <>
                {[
                  { title: 'BISI', desc: 'Buyside Imbalance Sellside Inefficiency. A gap created in an up move.' },
                  { title: 'SIBI', desc: 'Sellside Imbalance Buyside Inefficiency. A gap created in a down move.' },
                  { title: 'Inversion FVG', desc: 'An FVG that has been closed through and now acts as support/resistance.' },
                  { title: 'Breakaway FVG', desc: 'A gap that remains open, indicating strong trend momentum.' },
                ].map(item => (
                  <div key={item.title} className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </>
            )}
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
