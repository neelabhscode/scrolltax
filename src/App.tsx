import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { POSMachine } from "./components/POSMachine";
import { Receipt } from "./components/Receipt";
import { parseScreenTimeImage } from "./lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Download } from "lucide-react";
import { toBlob } from "html-to-image";

interface AppData {
  app: string;
  mins: number;
}

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<AppData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("UNKNOWN");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.city && data.region_code) {
          setLocation(`${data.city}, ${data.region_code}`.toUpperCase());
        } else if (data.country_name) {
          setLocation(data.country_name.toUpperCase());
        }
      })
      .catch(() => {
        setLocation("EARTH");
      });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const onChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isScreen1 = !isScanning && !isParsing && !isPrinting;
  const isScreen2 = !isPrinting && (isScanning || isParsing);

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const blob = await toBlob(receiptRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      if (!blob) throw new Error("Failed to create image blob");

      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = "scrolltax-receipt.png";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Failed to download receipt:", error);
      setError("Failed to download receipt. Please try again.");
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    // Reset state
    setError(null);
    setParsedData(null);
    setIsPrinting(false);
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Start scanning animation
    setIsScanning(true);
    const screen2StartedAt = performance.now();

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64String.split(",")[1];
        
        // Keep screen transitions snappy, and skip delays for reduced-motion users.
        await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion ? 0 : 1500));
        
        setIsScanning(false);
        setIsParsing(true);

        try {
          const result = await parseScreenTimeImage(base64Data, file.type);
          
          if (result.error) {
            setError(result.error);
            setIsParsing(false);
            return;
          }

          if (result.data) {
            setParsedData(result.data);
            const elapsed = performance.now() - screen2StartedAt;
            const remaining = prefersReducedMotion ? 0 : Math.max(0, 5000 - elapsed);

            if (remaining > 0) {
              transitionTimeoutRef.current = window.setTimeout(() => {
                setIsParsing(false);
                setIsPrinting(true);
                transitionTimeoutRef.current = null;
              }, remaining);
            } else {
              setIsParsing(false);
              setIsPrinting(true);
            }
          }
        } catch (err) {
          setError("Failed to parse image. Please try again.");
          setIsParsing(false);
        }
      };
    } catch (err) {
      setError("Failed to read file.");
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    setIsScanning(false);
    setIsParsing(false);
    setIsPrinting(false);
    setImagePreview(null);
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-start lg:justify-center overflow-hidden relative overscroll-none pt-12 lg:pt-0">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      {/* Grid edge fade (all viewports) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(0,0,0,0.92) 100%), linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(0,0,0,0.92) 100%)",
        }}
      />
      {/* Ambient scene light behind the POS area */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(58% 42% at 68% 52%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 34%, rgba(255,255,255,0) 70%)",
          opacity: 0.7,
        }}
      />

      {/* Desktop/tablet (Screen 3): actions in top-right */}
      {isPrinting && (
        <div className="hidden lg:flex fixed top-6 right-6 z-50 gap-3">
          <button
            onClick={handleReset}
            className="pointer-events-auto flex flex-row items-center justify-center gap-2 bg-zinc-100 border-2 border-zinc-300 text-zinc-700 font-mono uppercase text-[10px] font-bold rounded-xl hover:bg-zinc-200 active:scale-[0.97] transition-[transform,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] shadow-xl h-10 px-4"
          >
            <RefreshCw className="w-4 h-4" />
            Audit Another
          </button>
          <button
            onClick={handleDownload}
            className="pointer-events-auto flex flex-row items-center justify-center gap-2 bg-zinc-900 border-2 border-zinc-900 text-white font-mono uppercase text-[10px] font-bold rounded-xl hover:bg-zinc-800 active:scale-[0.97] transition-[transform,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] shadow-xl h-10 px-4"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-center justify-start lg:justify-center relative z-10 flex-1">
        {/* Left Side: Text */}
        <div
          className={`lg:flex-1 flex flex-col items-center lg:${isScreen1 ? "items-center" : "items-start"} text-center lg:text-left p-8 lg:p-16 w-full justify-start pb-4 lg:pb-16 ${isPrinting ? 'hidden lg:flex' : 'flex'} lg:transition-all lg:duration-500 lg:ease-out ${
            isScreen2 ? "lg:flex-[0] lg:opacity-0 lg:w-0 lg:p-0 lg:pb-0 lg:overflow-hidden lg:pointer-events-none" : ""
          }`}
        >
          {/* Mobile: keep intro layout stable so Screen 1 → 2 doesn't shift POS */}
          <div className="max-w-xl w-full relative lg:hidden">
            {/* Keep intro content in layout (opacity-only) so Screen 1 → 2 doesn't shift POS */}
            <motion.div
              initial={false}
              animate={{ opacity: !isScanning && !isParsing && !isPrinting ? 1 : 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold font-mono text-zinc-100 mb-6 uppercase whitespace-nowrap lg:hidden">
                SCROLLTAX
              </h1>
              <h1 className="hidden lg:block text-4xl lg:text-6xl font-bold font-mono text-zinc-100 mb-6 uppercase leading-none">
                SCROLLTAX
              </h1>
              <p className="text-[11px] sm:text-[12px] lg:text-xl font-mono text-zinc-300 leading-relaxed">
                We turn your screen time into a receipt you didn't ask for.
              </p>
            </motion.div>

            {/* Mobile Screen 2 keeps the area visually clean (no generating overlay text). */}
          </div>

          {/* Desktop: restore original left-panel behavior (not mobile-only tweaks) */}
          <div className="hidden lg:block max-w-xl w-full">
            <AnimatePresence mode="wait">
              {!isScanning && !isParsing && !isPrinting ? (
                <motion.div
                  key="intro-desktop"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.42, ease: [0.23, 1, 0.32, 1] }}
                >
                  <h1 className="text-4xl lg:text-6xl font-bold font-mono text-zinc-100 mb-6 uppercase leading-none">
                    SCROLLTAX
                  </h1>
                  <p className="text-xl font-mono text-zinc-300 leading-relaxed">
                    We turn your screen time into a receipt you didn't ask for.
                  </p>
                </motion.div>
              ) : !isPrinting ? (
                <motion.div
                  key="generating-desktop"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] }}
                >
                  <h1 className="text-4xl lg:text-6xl font-bold font-mono text-zinc-100 uppercase flex">
                    GENERATING
                    <span className="flex w-16 text-zinc-100">
                      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
                    </span>
                  </h1>
                </motion.div>
              ) : (
                <motion.div
                  key="generated-desktop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0 }}
                  className="hidden"
                >
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: POS Machine & Receipt */}
        <div
          className={`flex-1 relative flex items-start lg:items-center justify-center w-full pt-4 lg:pt-0 lg:transition-all lg:duration-500 lg:ease-out ${
            isScreen2 || isPrinting
              ? "lg:fixed lg:inset-0 lg:flex lg:items-center lg:justify-center lg:pt-0 lg:flex-none"
              : ""
          }`}
        >
          <div className="w-full max-w-md lg:mx-auto relative h-full flex flex-col justify-start lg:justify-center">
            <motion.div
              className={`relative z-10 md:z-10 w-full scale-[0.80] lg:scale-[0.95] origin-top lg:origin-center ${
                isPrinting ? "hidden lg:block" : ""
              }`}
              initial={{ y: 0 }}
              animate={{ y: isPrinting ? (prefersReducedMotion ? 0 : "80vh") : 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }}
            >
              <POSMachine
                isScanning={isScanning}
                isParsing={isParsing}
                isPrinting={isPrinting}
                imagePreview={imagePreview}
                onImageUpload={handleImageUpload}
              />
            </motion.div>
            <Receipt
              isPrinting={isPrinting}
              data={parsedData}
              contentRef={receiptRef}
              location={location}
            />
          </div>
        </div>
      </div>

      {/* Mobile Buttons (Screen 3) */}
      <AnimatePresence>
        {isPrinting && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            className="lg:hidden fixed bottom-0 left-0 w-full p-4 pb-8 flex gap-4 justify-center z-50 bg-gradient-to-t from-black via-black to-transparent"
          >
            <button
              onClick={handleReset}
              className="pointer-events-auto flex flex-row items-center justify-center gap-2 bg-zinc-100 border-2 border-zinc-300 text-zinc-700 font-mono uppercase text-[10px] font-bold rounded-xl hover:bg-zinc-200 active:scale-[0.97] transition-[transform,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] shadow-xl h-12 px-6"
            >
              <RefreshCw className="w-4 h-4" />
              Audit Another
            </button>
            <button
              onClick={handleDownload}
              className="pointer-events-auto flex flex-row items-center justify-center gap-2 bg-zinc-900 border-2 border-zinc-900 text-white font-mono uppercase text-[10px] font-bold rounded-xl hover:bg-zinc-800 active:scale-[0.97] transition-[transform,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] shadow-xl h-12 px-6"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg font-mono text-sm z-50">
          {error === "INVALID_IMAGE" 
            ? "Error: Please upload a valid Screen Time screenshot."
            : error}
          <button 
            onClick={handleReset}
            className="ml-4 underline hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
