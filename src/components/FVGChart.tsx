import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type FVGType = 'SIBI' | 'BISI' | 'INVERSION';

interface FVGChartProps {
  data: CandlestickData[];
  type: FVGType;
  height?: number;
  className?: string;
}

const FVGChart: React.FC<FVGChartProps> = ({ 
  data, 
  type,
  height = 300,
  className = "" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: height });
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const observeTarget = containerRef.current;
    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: height
        });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, [height]);

  // Chart Logic
  const { 
    minPrice, 
    maxPrice, 
    priceRange, 
    candleWidth, 
    gap, 
    fvgZone 
  } = useMemo(() => {
    if (data.length === 0) return { minPrice: 0, maxPrice: 0, priceRange: 0, candleWidth: 0, gap: 0, fvgZone: null };

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const minP = Math.min(...lows) * 0.999;
    const maxP = Math.max(...highs) * 1.001;
    const range = maxP - minP;
    
    const cWidth = dimensions.width / data.length;
    const g = cWidth * 0.2; // gap between candles

    let foundZone = null;

    if (type === 'SIBI') {
      for (let i = 1; i < data.length - 1; i++) {
        const c1 = data[i - 1];
        const c3 = data[i + 1];
        if (c1.low > c3.high) {
          foundZone = { top: c1.low, bottom: c3.high, startIndex: i - 1, label: 'SIBI' };
          break;
        }
      }
    } else if (type === 'BISI') {
      for (let i = 1; i < data.length - 1; i++) {
        const c1 = data[i - 1];
        const c3 = data[i + 1];
        if (c1.high < c3.low) {
          foundZone = { top: c3.low, bottom: c1.high, startIndex: i - 1, label: 'BISI' };
          break;
        }
      }
    } else if (type === 'INVERSION') {
      for (let i = 1; i < data.length - 1; i++) {
        const c1 = data[i - 1];
        const c3 = data[i + 1];
        if (c1.low > c3.high) {
          const top = c1.low;
          const bottom = c3.high;
          let breakthroughIdx = -1;
          for (let j = i + 2; j < data.length; j++) {
            if (data[j].close > top) {
              breakthroughIdx = j;
              break;
            }
          }
          if (breakthroughIdx !== -1) {
            let retestIdx = -1;
            for (let k = breakthroughIdx + 1; k < data.length; k++) {
              if (data[k].low <= top && data[k].low >= bottom) {
                retestIdx = k;
                break;
              }
            }
            if (retestIdx !== -1) {
              foundZone = {
                top,
                bottom,
                startIndex: i - 1,
                breakthroughIndex: breakthroughIdx,
                retestIndex: retestIdx,
                label: 'iFVG'
              };
              break;
            }
          }
        }
      }
    }

    return { minPrice: minP, maxPrice: maxP, priceRange: range, candleWidth: cWidth, gap: g, fvgZone: foundZone };
  }, [data, dimensions.width, type]);

  const getY = (price: number) => {
    return dimensions.height - ((price - minPrice) / priceRange) * dimensions.height;
  };

  const getX = (index: number) => {
    return index * candleWidth + candleWidth / 2;
  };

  const getThemeColors = () => {
    switch (type) {
      case 'SIBI': return { primary: 'rose', zoneFill: 'rgba(244, 63, 94, 0.12)', zoneStroke: 'rgba(244, 63, 94, 0.6)' };
      case 'BISI': return { primary: 'emerald', zoneFill: 'rgba(16, 185, 129, 0.12)', zoneStroke: 'rgba(16, 185, 129, 0.6)' };
      case 'INVERSION': return { primary: 'rose', zoneFill: 'rgba(239, 68, 68, 0.12)', zoneStroke: 'rgba(239, 68, 68, 0.8)' };
      default: return { primary: 'neutral', zoneFill: 'rgba(255, 255, 255, 0.1)', zoneStroke: 'rgba(255, 255, 255, 0.3)' };
    }
  };

  const colors = getThemeColors();

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full bg-[#050505] rounded-xl border border-white/5 p-4 select-none ${className}`}
      onMouseLeave={() => setHoveredCandle(null)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${colors.primary}-500 animate-pulse`} />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {type === 'INVERSION' ? 'Inversion FVG' : type} Analysis
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm bg-${colors.primary}-500/20 border border-${colors.primary}-500/50`} />
            <span className="text-[8px] text-neutral-500 font-medium uppercase">{type} Zone</span>
          </div>
        </div>
      </div>

      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        className="overflow-visible"
      >
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line
            key={i}
            x1="0"
            y1={dimensions.height * p}
            x2={dimensions.width}
            y2={dimensions.height * p}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
        ))}

        {/* FVG Zone */}
        {fvgZone && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <rect
              x={getX(fvgZone.startIndex) - candleWidth / 2}
              y={getY(fvgZone.top)}
              width={dimensions.width - (getX(fvgZone.startIndex) - candleWidth / 2)}
              height={Math.abs(getY(fvgZone.bottom) - getY(fvgZone.top))}
              fill={colors.zoneFill}
              stroke={colors.zoneStroke}
              strokeWidth="2"
              className="pointer-events-none"
            />
            
            <text
              x={dimensions.width - 10}
              y={getY(fvgZone.top) + (getY(fvgZone.bottom) - getY(fvgZone.top)) / 2}
              textAnchor="end"
              alignmentBaseline="middle"
              className={`text-[7px] font-black fill-${colors.primary}-500/60 uppercase tracking-tighter`}
            >
              {fvgZone.label} ZONE
            </text>

            {type === 'INVERSION' && fvgZone.breakthroughIndex !== undefined && (
              <>
                <line
                  x1={getX(fvgZone.breakthroughIndex)}
                  y1={getY(data[fvgZone.breakthroughIndex].high) - 15}
                  x2={getX(fvgZone.breakthroughIndex)}
                  y2={getY(data[fvgZone.breakthroughIndex].high) - 5}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  markerEnd="url(#arrowhead-blue)"
                />
                <text
                  x={getX(fvgZone.breakthroughIndex)}
                  y={getY(data[fvgZone.breakthroughIndex].high) - 20}
                  textAnchor="middle"
                  className="text-[5px] font-black fill-sky-400 uppercase"
                >
                  Breakthrough
                </text>
              </>
            )}

            {type === 'INVERSION' && fvgZone.retestIndex !== undefined && (
              <text
                x={getX(fvgZone.retestIndex)}
                y={getY(data[fvgZone.retestIndex].low) + 12}
                textAnchor="middle"
                className="text-[5px] font-black fill-emerald-400 uppercase"
              >
                Retouch (Support)
              </text>
            )}
          </motion.g>
        )}

        {/* Arrowhead Definition */}
        <defs>
          <marker
            id="arrowhead-blue"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Candlesticks */}
        {data.map((candle, i) => {
          const isUp = candle.close >= candle.open;
          const x = getX(i);
          const bodyTop = getY(Math.max(candle.open, candle.close));
          const bodyBottom = getY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);
          const wickTop = getY(candle.high);
          const wickBottom = getY(candle.low);

          return (
            <g 
              key={i}
              onMouseEnter={(e) => {
                setHoveredCandle(candle);
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              className="cursor-crosshair"
            >
              <line
                x1={x}
                y1={wickTop}
                x2={x}
                y2={wickBottom}
                stroke={isUp ? "#10b981" : "#737373"}
                strokeWidth="1"
              />
              <rect
                x={x - (candleWidth - gap) / 2}
                y={bodyTop}
                width={candleWidth - gap}
                height={bodyHeight}
                fill={isUp ? "#10b981" : "#404040"}
                rx="1"
              />
              <rect
                x={x - candleWidth / 2}
                y={0}
                width={candleWidth}
                height={dimensions.height}
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {hoveredCandle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[100] pointer-events-none bg-black/90 border border-white/10 rounded-lg p-3 shadow-2xl backdrop-blur-md"
            style={{ 
              left: mousePos.x + 20, 
              top: mousePos.y - 40 
            }}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-[8px] text-neutral-500 uppercase font-bold">Time</span>
              <span className="text-[8px] text-white font-mono">{hoveredCandle.time}</span>
              <span className="text-[8px] text-neutral-500 uppercase font-bold">Open</span>
              <span className="text-[8px] text-white font-mono">{hoveredCandle.open.toFixed(2)}</span>
              <span className="text-[8px] text-neutral-500 uppercase font-bold">High</span>
              <span className="text-[8px] text-emerald-400 font-mono">{hoveredCandle.high.toFixed(2)}</span>
              <span className="text-[8px] text-neutral-500 uppercase font-bold">Low</span>
              <span className="text-[8px] text-rose-400 font-mono">{hoveredCandle.low.toFixed(2)}</span>
              <span className="text-[8px] text-neutral-500 uppercase font-bold">Close</span>
              <span className="text-[8px] text-white font-mono">{hoveredCandle.close.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[8px] text-neutral-500 italic">
          <Info className="w-3 h-3" />
          <span>Hover over candles for OHLC data</span>
        </div>
        <div className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">
          ICT Precision Visualizer v1.1
        </div>
      </div>
    </div>
  );
};

export default FVGChart;
