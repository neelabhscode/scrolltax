import { motion } from "motion/react";
import { Upload } from "lucide-react";
import { useState, useEffect, type ChangeEvent } from "react";

interface POSMachineProps {
  isScanning: boolean;
  isParsing: boolean;
  isPrinting: boolean;
  imagePreview: string | null;
  onImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function POSMachine({
  isScanning,
  isParsing,
  isPrinting,
  imagePreview,
  onImageUpload,
}: POSMachineProps) {
  const [activeDot, setActiveDot] = useState(0);
  const [idleBlink, setIdleBlink] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isIdle = !isScanning && !isParsing && !isPrinting;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const onChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setActiveDot(0);
      return;
    }
    if (isScanning || isParsing || isPrinting) {
      const interval = setInterval(() => {
        setActiveDot((prev) => (prev + 1) % 3);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setActiveDot(0);
    }
  }, [isScanning, isParsing, isPrinting, prefersReducedMotion]);

  // Screen 1 idle: keep the "green" dot blinking in place (no dot movement).
  useEffect(() => {
    if (prefersReducedMotion) {
      setIdleBlink(true);
      return;
    }
    if (!isIdle) {
      setIdleBlink(true);
      return;
    }

    const interval = setInterval(() => {
      setIdleBlink((v) => !v);
    }, 650);

    return () => clearInterval(interval);
  }, [isIdle, prefersReducedMotion]);

  return (
    <div
      className="relative z-10 w-full max-w-md mx-auto [perspective:1600px]"
      style={{
        // Mobile-safe "lift" that doesn't rely on z-index or blend-modes.
        filter:
          "drop-shadow(0 34px 82px rgba(0,0,0,0.70)) drop-shadow(0 0 56px rgba(255,255,255,0.12))",
        willChange: "transform, filter",
      }}
    >
      {/* Contact shadow + cast shadow (object sitting on a surface) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[calc(100%-24px)] -translate-x-1/2 h-[78px] w-[98%] rounded-[999px] bg-black/75 blur-3xl opacity-95"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[calc(100%-5px)] -translate-x-1/2 h-7 w-[68%] rounded-[999px] bg-black/90 blur-xl opacity-95"
      />

      {/* Rim light so it reads on black (mobile-safe) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 36%, rgba(255,255,255,0.00) 72%)",
          filter: "blur(36px)",
          opacity: 0.9,
        }}
      />

      <div
        className="relative transform-gpu [transform-style:preserve-3d] transition-transform duration-500"
        style={{
          transform: "translateY(0px)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      >
        {/* Paper Slot */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-64 h-4 rounded-t-lg shadow-inner z-0 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_18px_rgba(0,0,0,0.52)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[18px] left-1/2 -translate-x-1/2 h-[2px] w-56 rounded-full"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0), rgba(255,255,255,0.24), rgba(0,0,0,0))" }}
        />

        {/* Main Body */}
        <div className="rounded-[28px] border-4 border-zinc-200 bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 shadow-[0_56px_140px_rgba(0,0,0,0.72),0_22px_52px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.84),inset_0_-22px_30px_rgba(0,0,0,0.12)] p-6 relative z-10 ring-1 ring-white/10">
          {/* Chassis seam lines */}
          <div aria-hidden="true" className="pointer-events-none absolute left-4 right-4 top-[76px] h-px bg-gradient-to-r from-transparent via-zinc-300/70 to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute left-5 right-5 bottom-[62px] h-px bg-gradient-to-r from-transparent via-zinc-400/60 to-transparent" />

          {/* Desktop-only: subtle surface sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{
              backgroundImage:
                "linear-gradient(122deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.13) 16%, rgba(255,255,255,0.00) 49%)",
              opacity: 0.58,
            }}
          />
          {/* Desktop-only: edge vignette for thickness */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{
              backgroundImage:
                "radial-gradient(140% 120% at 50% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%), radial-gradient(120% 100% at 50% 120%, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0) 52%)",
              opacity: 0.9,
              mixBlendMode: "multiply",
            }}
          />
          {/* Fine plastic grain */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[0.14]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "280px 280px",
              mixBlendMode: "multiply",
            }}
          />
          {/* Desktop-only: tiny screws for realism */}
          <div aria-hidden="true" className="absolute top-4 left-4 h-2.5 w-2.5 rounded-full bg-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
          <div aria-hidden="true" className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
          <div aria-hidden="true" className="absolute bottom-4 left-4 h-2.5 w-2.5 rounded-full bg-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
          <div aria-hidden="true" className="absolute bottom-4 right-4 h-2.5 w-2.5 rounded-full bg-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.2)]" />

          {/* Screen Bezel */}
          <div className="p-4 rounded-2xl shadow-inner bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-16px_30px_rgba(0,0,0,0.55)]">
            {/* Screen */}
            <div className="bg-zinc-900 rounded-xl aspect-[3/4] relative overflow-hidden flex flex-col items-center justify-center border-2 border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-24px_40px_rgba(0,0,0,0.55)]">
              {/* Desktop-only: screen glass reflection */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0.00) 45%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(80% 60% at 50% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 62%), radial-gradient(120% 80% at 50% 120%, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.00) 58%)",
                }}
              />
              {isPrinting ? (
                <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-4 text-center z-20">
                  <p className={`text-green-400 font-mono text-2xl uppercase tracking-widest ${prefersReducedMotion ? "" : "animate-pulse"}`}>
                    Receipt<br/>Generated
                  </p>
                </div>
              ) : imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Screenshot"
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Scanning Line */}
                  {(isScanning || isParsing) && (
                    <motion.div
                      className="absolute left-0 w-full h-0.5 z-0 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_18px_rgba(74,222,128,0.8)]"
                      animate={{ top: prefersReducedMotion ? "50%" : ["0%", "100%", "0%"] }}
                      transition={{ duration: prefersReducedMotion ? 0 : 3.25, repeat: prefersReducedMotion ? 0 : Infinity, ease: "linear" }}
                    />
                  )}
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer group p-6 text-center select-none transition-transform duration-150 ease-out active:scale-[0.985] focus-within:scale-[0.995] focus-within:ring-2 focus-within:ring-zinc-300/70 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 transition-colors [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-zinc-700">
                    <Upload className="w-8 h-8 text-zinc-400 transition-colors [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-white" />
                  </div>
                  <p className="text-zinc-500 font-mono text-sm uppercase">
                    Upload Screen Time Shot
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Hardware Details */}
          <div className="mt-7 flex justify-between items-center px-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  animate={{
                    backgroundColor: activeDot === i ? (isIdle && !idleBlink ? "#d4d4d8" : "#22c55e") : "#d4d4d8",
                    boxShadow: activeDot === i ? (isIdle && !idleBlink ? "0 0 0px #22c55e" : "0 0 8px #22c55e") : "0 0 0px #22c55e",
                  }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
            {/* Speaker / vent grille (more realistic than a generic pill) */}
            <div
              aria-hidden="true"
              className="h-4 w-16 rounded-full border border-zinc-300/70 bg-gradient-to-b from-zinc-200 to-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-2px_6px_rgba(0,0,0,0.20)]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.55) 0 0.7px, rgba(0,0,0,0.0) 0.9px)",
                backgroundSize: "6px 6px",
                backgroundPosition: "center",
                mixBlendMode: "multiply",
                opacity: 0.95,
              }}
            />
          </div>
          <div aria-hidden="true" className="mt-2 flex justify-center">
            <div className="h-1 w-28 rounded-full bg-zinc-400/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
