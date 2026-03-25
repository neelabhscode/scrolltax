import { motion } from "motion/react";
import { formatTime, generateReceiptLines, getOpportunityCost } from "../lib/utils";
import { useEffect, useState, type RefObject } from "react";

interface AppData {
  app: string;
  mins: number;
}

interface ReceiptProps {
  isPrinting: boolean;
  data: AppData[] | null;
  contentRef: RefObject<HTMLDivElement | null>;
  location?: string;
}

function Counter({ value, isPrinting }: { value: number | string, isPrinting: boolean }) {
  const [count, setCount] = useState(0);
  const numericValue = Number(value);
  const isNumeric = !isNaN(numericValue) && value !== "";

  useEffect(() => {
    if (!isPrinting || !isNumeric) return;
    
    let start = 0;
    const end = numericValue;
    const duration = 1500; // 1.5s
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(start + (end - start) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [numericValue, isPrinting]);

  if (!isNumeric) return <span>{value}</span>;

  const hasDecimals = String(value).includes('.');
  return <span>{hasDecimals ? count.toFixed(String(value).split('.')[1]?.length || 1) : Math.floor(count)}</span>;
}

export function Receipt({
  isPrinting,
  data,
  contentRef,
  location = "EARTH",
}: ReceiptProps) {
  // Don't mount the receipt until Screen 3.
  // Otherwise, the "paper frame" can flash while we intentionally keep Screen 2 on screen.
  if (!data || !isPrinting) return null;

  const totalMins = data.reduce((acc, curr) => acc + curr.mins, 0);
  const receiptData = generateReceiptLines(data);
  const generalStats = [
    { label: "Total Thumb Miles", value: (totalMins * 0.004).toFixed(3), unit: "mi" },
    { label: "Opportunity Cost", value: getOpportunityCost(totalMins), unit: "lost" }
  ];

  return (
    <div
      className="fixed inset-0 md:absolute md:inset-auto md:top-0 md:left-0 w-full h-[100dvh] md:h-full flex justify-center items-start pt-3 md:pt-[46px] pointer-events-none z-20 md:z-[5]"
      style={{
        // Create a clean stacking context for desktop/tablet layering.
        transform: "translateZ(0)",
      }}
    >
      <motion.div
        // Slide up from the bottom (relative to receipt height), not from top/viewport.
        initial={{ y: "120%", opacity: 0, filter: "blur(10px)" }}
        animate={{
          y: isPrinting ? 0 : "120%",
          opacity: isPrinting ? 1 : 0,
          filter: isPrinting ? "blur(0px)" : "blur(10px)",
        }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="relative w-80 pointer-events-auto overflow-y-auto overscroll-none flex flex-col max-h-[calc(100dvh-112px)] md:max-h-[calc(100%-44px)] md:mt-[-46px] md:translate-y-[54px]"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          clipPath:
            "polygon(0 0, 100% 0, 100% 100%, 95% 98%, 90% 100%, 85% 98%, 80% 100%, 75% 98%, 70% 100%, 65% 98%, 60% 100%, 55% 98%, 50% 100%, 45% 98%, 40% 100%, 35% 98%, 30% 100%, 25% 98%, 20% 100%, 15% 98%, 10% 100%, 5% 98%, 0 100%)",
          backgroundColor: "#fbfbf7",
          backgroundImage:
            // Base paper + photographic realism (vignette, curl, thermal banding, micro-noise) + light texture.
            "radial-gradient(120% 120% at 50% 120%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.00) 56%), radial-gradient(110% 140% at 50% 0%, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.00) 48%), linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 14%, rgba(255,255,255,0.78) 42%, rgba(255,255,255,0.00) 100%), repeating-linear-gradient(180deg, rgba(0,0,0,0.018) 0px, rgba(0,0,0,0.018) 1px, rgba(0,0,0,0) 6px, rgba(0,0,0,0) 11px), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E\"), linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.78) 20%, rgba(250,250,246,0.90) 100%), radial-gradient(130% 80% at 50% -10%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 55%), radial-gradient(120% 90% at 50% 12%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0) 60%), repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 2px, rgba(255,255,255,0) 3px, rgba(255,255,255,0) 6px)",
          backgroundSize:
            "auto, auto, auto, auto, 220px 220px, auto, auto, auto, auto, auto",
          backgroundRepeat:
            "no-repeat, no-repeat, no-repeat, repeat, repeat, no-repeat, no-repeat, no-repeat, no-repeat, repeat",
          backgroundBlendMode:
            "multiply, multiply, normal, multiply, multiply, normal, multiply, multiply, multiply, normal",
          border: "1px solid rgba(24,24,27,0.10)",
          borderTopColor: "rgba(24,24,27,0.14)",
          borderBottomColor: "rgba(24,24,27,0.08)",
          borderRadius: "10px",
          boxShadow:
            "0 70px 120px rgba(0,0,0,0.55), 0 24px 40px rgba(0,0,0,0.35), 0 10px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -18px 34px rgba(0,0,0,0.06), inset 0 18px 26px rgba(0,0,0,0.05)",
          transform:
            "rotate(-0.6deg) translateZ(0)",
          filter:
            "drop-shadow(0 2px 0 rgba(0,0,0,0.10))",
          // Keep it feeling like a physical object (avoid super-crisp edges).
          WebkitFontSmoothing: "antialiased",
          willChange: "transform",
        }}
      >
        <div ref={contentRef} className="p-6 font-mono text-xs uppercase text-zinc-900 bg-white/95 pb-24">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-zinc-300 pb-4 mb-4">
            <h1 className="text-xl font-bold tracking-widest mb-1">SCROLLTAX</h1>
            <h2 className="text-sm font-semibold tracking-wider">AUDIT RECEIPT</h2>
            <p className="text-[10px] mt-2 text-zinc-500">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </p>
            <p className="text-[10px] text-zinc-500">TERM: 001 / OP: YOU</p>
            <p className="text-[10px] text-zinc-500">LOC: {location}</p>
          </div>

          {/* Items */}
          <div className="space-y-6 mb-6">
            {receiptData.map((item, i) => {
              return (
                <div key={i} className="flex flex-col">
                  <div className="flex justify-between items-baseline mb-2 font-bold border-b border-zinc-200 pb-1">
                    <span className="truncate pr-2">{item.app}</span>
                    <span className="whitespace-nowrap">{formatTime(item.mins)}</span>
                  </div>
                  <div className="space-y-1">
                    {item.lines.map((t, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] text-zinc-600 pl-2 border-l border-zinc-300">
                        <span className="pr-2">{t.label}</span>
                        <span className="whitespace-nowrap text-right">
                          <Counter value={t.value} isPrinting={isPrinting} /> {t.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Surcharge (General Logic) */}
          <div className="border-t-2 border-dashed border-zinc-300 pt-4 mb-6">
            <h3 className="font-bold mb-2 text-center">SURCHARGE</h3>
            <div className="space-y-1">
              {generalStats.map((t, idx) => (
                <div key={idx} className="flex justify-between text-[10px] text-zinc-600">
                  <span className="pr-2">{t.label}</span>
                  <span className="whitespace-nowrap text-right font-bold">
                    <Counter value={t.value} isPrinting={isPrinting} /> {t.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-zinc-300 pt-4 mb-6">
            <div className="flex justify-between font-bold text-sm mb-2">
              <span>TOTAL TIME</span>
              <span>{formatTime(totalMins)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>FINANCIAL COST</span>
              <span>$0.00</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-zinc-500 space-y-1">
            <p>YOUR TIME WAS FREE.</p>
            <p>THE COST WAS EVERYTHING ELSE.</p>
            <p className="mt-4">*** CUSTOMER COPY ***</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
