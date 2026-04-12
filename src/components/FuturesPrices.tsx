import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface FuturesQuote {
  symbol: string;
  contractName: string;
  latest: string;
  change: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  time: string;
}

interface FuturesPricesProps {
  quotes: FuturesQuote[];
  loading: boolean;
}

const FuturesPrices: React.FC<FuturesPricesProps> = ({ quotes, loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#141414] border border-[#262626] rounded-[32px] p-6 animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 bg-neutral-800 rounded" />
              <div className="w-12 h-4 bg-neutral-800 rounded" />
            </div>
            <div className="w-32 h-8 bg-neutral-800 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full h-4 bg-neutral-800 rounded" />
              <div className="w-full h-4 bg-neutral-800 rounded" />
            </div>
          </div>
        ))
      ) : quotes.map((quote, i) => {
        const isPositive = quote.change.startsWith('+');
        return (
          <div 
            key={i} 
            className="bg-[#141414] border border-[#262626] rounded-[32px] p-6 hover:border-sky-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-24 h-24 text-sky-500" />
            </div>

            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{quote.symbol}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{quote.contractName}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                  isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {quote.change}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-3xl font-bold text-white tracking-tighter italic">{quote.latest}</h4>
                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  Last Updated: {quote.time}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#262626]">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">High / Low</span>
                  <p className="text-xs font-mono font-bold text-neutral-400">{quote.high} / {quote.low}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Volume</span>
                  <p className="text-xs font-mono font-bold text-neutral-400">{quote.volume}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FuturesPrices;
