import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Cloud, Maximize2, Minimize2, RotateCcw, ScanSearch, Satellite, ZoomIn, ZoomOut } from "lucide-react";
import { createMockSatelliteImage } from "@/lib/mockSatelliteImage";
import { comparisonYears, getMockAcquisitionInfo } from "@/lib/mockComparisonData";

export interface BeforeAfterComparisonProps {
  seed?: number;
  location?: string;
}

interface AcquisitionDetailsProps {
  title: "BEFORE" | "AFTER";
  year: number;
}

function AcquisitionDetails({ title, year }: AcquisitionDetailsProps) {
  const info = getMockAcquisitionInfo(year);
  const details = [
    { label: "Acquisition Date", value: info.acquisitionDate, icon: CalendarDays },
    { label: "Cloud Cover", value: info.cloudCover, icon: Cloud },
    { label: "Resolution", value: info.resolution, icon: ScanSearch },
    { label: "Satellite", value: info.satelliteName, icon: Satellite },
  ];

  return <div className="glass-surface min-w-0 rounded-card p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-meta font-semibold tracking-wide text-text-primary">{title} IMAGERY</h3>
      <span className="rounded-pill border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-meta text-blue-200">{year}</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {details.map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-control border border-hairline bg-white/[0.025] p-2.5">
        <p className="flex items-center gap-1.5 text-label-micro uppercase text-text-muted"><Icon size={12} aria-hidden="true"/>{label}</p>
        <p className="mt-1.5 truncate text-meta font-medium text-text-primary" title={value}>{value}</p>
      </div>)}
    </div>
  </div>;
}

export default function BeforeAfterComparison({ seed = 227, location = "Selected area" }: BeforeAfterComparisonProps) {
  const shellRef = useRef<HTMLElement>(null);
  const [beforeYear, setBeforeYear] = useState(2020);
  const [afterYear, setAfterYear] = useState(2025);
  const [position, setPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);

  const beforeImage = useMemo(() => createMockSatelliteImage(seed, beforeYear), [seed, beforeYear]);
  const afterImage = useMemo(() => createMockSatelliteImage(seed + 53, afterYear), [seed, afterYear]);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === shellRef.current);
    const exitFallbackOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    window.addEventListener("keydown", exitFallbackOnEscape);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.removeEventListener("keydown", exitFallbackOnEscape);
    };
  }, []);

  useEffect(() => {
    setBeforeLoaded(false);
    setAfterLoaded(false);
  }, [beforeImage, afterImage]);

  function resetComparison() {
    setPosition(50);
    setZoom(1);
    setBeforeYear(2020);
    setAfterYear(2025);
  }

  function toggleFullscreen() {
    const shell = shellRef.current;
    if (fullscreen && !document.fullscreenElement) {
      setFullscreen(false);
      return;
    }
    if (document.fullscreenElement === shell) {
      void document.exitFullscreen().catch(() => setFullscreen(false));
      return;
    }
    if (shell?.requestFullscreen) {
      void shell.requestFullscreen().then(() => setFullscreen(true)).catch(() => setFullscreen((value) => !value));
      return;
    }
    setFullscreen((value) => !value);
  }

  return <motion.section
    ref={shellRef}
    layout
    initial={{ opacity: 0, y: 14, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.38, ease: "easeOut", layout: { duration: .32, ease: "easeInOut" } }}
    className={`glass-surface rounded-card p-section transition-[border-radius] duration-300 ${fullscreen ? "fixed inset-0 z-[1800] h-screen w-screen overflow-y-auto rounded-none" : ""}`}
    aria-label="Before and after satellite image comparison"
  >
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><Satellite size={16} className="text-primary"/><h2 className="text-button-label font-semibold text-text-primary">Before / After Comparison</h2></div>
        <p className="mt-1 truncate text-meta text-text-muted">Local simulated captures · {location}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-meta text-text-muted">Before
          <select aria-label="Before year" value={beforeYear} onChange={(event) => setBeforeYear(Number(event.target.value))} className="ml-2 h-9 rounded-control border border-hairline-strong bg-surface px-2 text-button-label text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {comparisonYears.filter((year) => year < afterYear).map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="text-meta text-text-muted">After
          <select aria-label="After year" value={afterYear} onChange={(event) => setAfterYear(Number(event.target.value))} className="ml-2 h-9 rounded-control border border-hairline-strong bg-surface px-2 text-button-label text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {comparisonYears.filter((year) => year > beforeYear).map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
      </div>
    </div>

    <div className="relative h-[260px] overflow-hidden rounded-card border border-white/10 bg-[#1b2b30] shadow-elevation-2 sm:h-[360px] lg:h-[420px]">
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transition: "transform 220ms ease-out" }}>
        <img src={afterImage} alt={`Simulated satellite capture after change, ${afterYear}`} onLoad={() => setAfterLoaded(true)} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${afterLoaded ? "opacity-100" : "opacity-0"}`}/>
        <div className="absolute inset-0 overflow-hidden transition-[clip-path] duration-100 ease-out" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img src={beforeImage} alt={`Simulated satellite capture before change, ${beforeYear}`} onLoad={() => setBeforeLoaded(true)} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${beforeLoaded ? "opacity-100" : "opacity-0"}`}/>
        </div>
      </div>

      <AnimatePresence>
        {(!beforeLoaded || !afterLoaded) && <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-2 gap-px bg-slate-950/20">
          <div className="animate-pulse bg-white/[0.06]"/><div className="animate-pulse bg-white/[0.035]"/>
        </motion.div>}
      </AnimatePresence>

      <span className="absolute left-3 top-3 z-[5] rounded-pill border border-white/15 bg-slate-950/65 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-white shadow-lg backdrop-blur-md">BEFORE · {beforeYear}</span>
      <span className="absolute right-3 top-3 z-[5] rounded-pill border border-white/15 bg-slate-950/65 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-white shadow-lg backdrop-blur-md">AFTER · {afterYear}</span>

      <motion.div animate={{ left: `${position}%` }} transition={{ duration: 0.08, ease: "linear" }} className="pointer-events-none absolute inset-y-0 z-[8] w-0.5 bg-white shadow-[0_0_14px_rgba(255,255,255,.85)]">
        <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.2, repeat: Infinity }} className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-slate-950/75 text-white shadow-[0_0_24px_rgba(59,130,246,.5)] backdrop-blur-md">
          <span className="text-lg leading-none">↔</span>
        </motion.span>
      </motion.div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="Drag to compare before and after imagery"
        aria-valuetext={`${position}% before image visible`}
        className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0 focus-visible:opacity-[0.015]"
        style={{ touchAction: "none" }}
      />

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-control border border-white/10 bg-slate-950/70 p-1.5 shadow-elevation-2 backdrop-blur-md" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={resetComparison} aria-label="Reset comparison" title="Reset" className="rounded-control p-2 text-slate-100 transition hover:bg-white/10 hover:text-white"><RotateCcw size={15}/></button>
        <button type="button" onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.15).toFixed(2))))} aria-label="Zoom in" title="Zoom in" className="rounded-control p-2 text-slate-100 transition hover:bg-white/10 hover:text-white"><ZoomIn size={15}/></button>
        <button type="button" onClick={() => setZoom((value) => Math.max(1, Number((value - 0.15).toFixed(2))))} aria-label="Zoom out" title="Zoom out" className="rounded-control p-2 text-slate-100 transition hover:bg-white/10 hover:text-white"><ZoomOut size={15}/></button>
        <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen comparison" : "Fullscreen comparison"} title="Fullscreen" className="rounded-control p-2 text-slate-100 transition hover:bg-white/10 hover:text-white">{fullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</button>
      </div>
    </div>

    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <AcquisitionDetails title="BEFORE" year={beforeYear}/>
      <AcquisitionDetails title="AFTER" year={afterYear}/>
    </div>
    <p className="mt-3 text-meta text-text-muted">Illustrative local imagery for temporal comparison. No satellite imagery is downloaded.</p>
  </motion.section>;
}
