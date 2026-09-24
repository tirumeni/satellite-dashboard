import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpRight, Building2, CalendarDays, CheckCircle2, CircleAlert, Cloud, Cpu, Droplets, Flame, Hammer, Leaf, LocateFixed, MapPin, Mountain, Satellite, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { Card, CardLabel } from "@/components/ui";
import { createMockSatelliteImage } from "@/lib/mockSatelliteImage";
import { getInsightValues } from "@/lib/insightMetrics";
import type { AnalysisTimelineEntry, MockAnalysis } from "@/types/analysis";

const icons = [Building2, Leaf, Droplets, Activity, Hammer, Flame, Mountain];
function AnimatedValue({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => { let tick = 0; const timer = window.setInterval(() => { tick += 1; setCount(Math.round(value * Math.min(1, tick / 24))); if (tick >= 24) window.clearInterval(timer); }, 24); return () => window.clearInterval(timer); }, [value]);
  return <motion.span key={value} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{count}</motion.span>;
}
export function AnalysisPanel({ result, location, year }: { result: MockAnalysis; location: string; year: number }) {
  const stats = [["Location", location, MapPin], ["Change Type", result.changeType, Sparkles], ["Confidence Score", `${result.confidence}%`, ShieldCheck], ["Severity", result.severity, Activity], ["Estimated Area Changed", `${result.areaKm2} km2`, MapPin], ["Detection Date Range", result.dateRange, Activity]] as const;
  return <motion.section initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: .07 } } }} className="space-y-std">
    <Card><div className="mb-4 flex items-center gap-2"><Sparkles size={16} className="text-primary"/><CardLabel>AI Analysis · {year}</CardLabel><span className="ml-auto rounded-pill bg-emerald-400/10 px-2.5 py-1 text-meta text-emerald-300">{result.status}</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{stats.map(([label,value,Icon])=><motion.div key={label} variants={{hidden:{opacity:0,y:10},show:{opacity:1,y:0}}} className="rounded-control border border-hairline bg-white/[0.025] p-3"><div className="flex items-center gap-2 text-meta text-text-muted"><Icon size={13}/>{label}</div><p className="mt-2 text-button-label font-semibold text-text-primary">{value}</p></motion.div>)}</div><div className="mt-4"><CardLabel>AI Generated Summary</CardLabel><p className="mt-2 text-meta leading-6 text-text-primary">{result.summary}</p></div></Card>
  </motion.section>;
}
export function InsightCards({ seed }: { seed: number }) {
  const values = getInsightValues(seed);
  return <section aria-label="Satellite insights" className="grid grid-cols-1 gap-std sm:grid-cols-2 xl:grid-cols-4">{values.map((item,index)=>{ const Icon=icons[index]; return <motion.div key={item.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:index*.05}} whileHover={{y:-3}}><Card><div className="flex items-center justify-between"><span className="rounded-control bg-primary/10 p-2 text-primary"><Icon size={16}/></span><span className="flex items-center gap-1 text-meta text-emerald-300">{index%2===0?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {item.trend}</span></div><p className="mt-3 text-meta text-text-muted">{item.label}</p><p className="mt-1 text-h2 text-text-primary"><AnimatedValue value={item.value}/>%</p><p className="mt-1 text-meta text-text-muted">{item.description}</p></Card></motion.div>; })}</section>;
}
export function Timeline({ year, data, onChange }: { year: number; data: AnalysisTimelineEntry[]; onChange: (year: number) => void }) {
  const selected = data.find((item) => item.year === year) ?? data[data.length - 1];
  return <Card>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><Activity size={15} className="text-primary"/><CardLabel>Analysis timeline</CardLabel></div>
      <span className="text-meta text-text-muted">Select a year to update the analysis</span>
    </div>
    <div className="-mx-2 flex snap-x gap-2 overflow-x-auto px-2 pb-2" role="group" aria-label="Select analysis year">
      {data.map((item) => <motion.button
        key={item.year}
        layout
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        onClick={() => onChange(item.year)}
        aria-pressed={year === item.year}
        className={`min-w-[190px] snap-start rounded-control border p-3 text-left transition-colors duration-300 ${year === item.year ? "border-primary/60 bg-primary/10 shadow-glow-primary" : "border-hairline bg-white/[.02] hover:bg-white/[.05]"}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-button-label font-semibold text-text-primary">{item.year}</span>
          {year === item.year && <motion.span layoutId="selected-timeline-year" className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,.8)]" />}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-meta text-text-muted"><CalendarDays size={12}/>{item.acquisitionDate}</p>
        <div className="mt-3 space-y-1.5 text-[11px] text-text-muted">
          <p className="flex justify-between gap-2">Confidence <b className="text-text-primary">{item.confidence}%</b></p>
          <p className="flex justify-between gap-2">Cloud cover <b className="text-text-primary">{item.cloudCover}</b></p>
          <p className="flex justify-between gap-2">Satellite <b className="text-right text-text-primary">{item.satelliteSource}</b></p>
          <p className="flex justify-between gap-2">Area changed <b className="text-text-primary">{item.affectedAreaKm2} km²</b></p>
          <p className="flex justify-between gap-2">Severity <b className={severityClass(item.severity)}>{item.severity}</b></p>
        </div>
      </motion.button>)}
    </div>
    {selected && <motion.div key={selected.year} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} aria-live="polite" className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline pt-3 text-meta text-text-muted">
      <span className="font-medium text-text-primary">{selected.year} acquisition</span>
      <span>{selected.acquisitionDate}</span><span>{selected.satelliteSource}</span>
      <span>{selected.confidence}% confidence</span><span>{selected.cloudCover} cloud cover</span>
    </motion.div>}
  </Card>;
}
export function ComparisonSlider({ analysis, year, onYearChange }: { analysis: MockAnalysis; year:number; onYearChange:(year:number)=>void }) {
  const [position,setPosition]=useState(50); const [beforeYear,setBeforeYear]=useState(year-1); const [zoom,setZoom]=useState(1);
  useEffect(()=>setBeforeYear(previous=>Math.min(previous,year-1)),[year]);
  const years=Array.from({length:10},(_,i)=>2017+i);
  const beforeSrc=beforeYear===analysis.beforeYear?analysis.beforeImage:createMockSatelliteImage(analysis.seed,beforeYear);
  const afterSrc=analysis.afterYear===year?analysis.afterImage:createMockSatelliteImage(analysis.seed+53,year);
  return <Card><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><CardLabel>Before / After satellite comparison</CardLabel><p className="mt-1 text-meta text-text-muted">Drag the divider to compare mock temporal imagery</p></div><div className="flex items-center gap-2 text-meta text-text-muted"><button onClick={()=>setZoom(Math.max(1,zoom-.1))} aria-label="Zoom out" className="rounded-control border border-hairline px-2 py-1 text-text-primary">−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(Math.min(1.5,zoom+.1))} aria-label="Zoom in" className="rounded-control border border-hairline px-2 py-1 text-text-primary">+</button></div></div>
    <div className="mb-2 grid grid-cols-2 gap-3"><label className="text-meta text-text-muted">Before year<select aria-label="Before image year" value={beforeYear} onChange={e=>setBeforeYear(Number(e.target.value))} className="mt-1 h-9 w-full rounded-control border border-hairline-strong bg-surface px-2 text-button-label text-text-primary">{years.filter(item=>item<year).map(item=><option key={item}>{item}</option>)}</select></label><label className="text-meta text-text-muted">After year<select aria-label="After image year" value={year} onChange={e=>onYearChange(Number(e.target.value))} className="mt-1 h-9 w-full rounded-control border border-hairline-strong bg-surface px-2 text-button-label text-text-primary">{years.map(item=><option key={item}>{item}</option>)}</select></label></div>
    <div className="relative h-64 overflow-hidden rounded-control border border-hairline bg-[#253c3d] sm:h-80" style={{transform:`scale(${zoom})`}}><img src={afterSrc} alt={`Simulated satellite image from ${year}`} className="absolute inset-0 h-full w-full object-cover"/><span className="absolute right-3 top-3 z-[1] rounded-pill bg-black/65 px-2.5 py-1 text-meta text-white">AFTER · {year}</span><div className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-[4px_0_18px_rgba(0,0,0,.5)]" style={{width:`${position}%`,transition:"width 60ms linear"}}><img src={beforeSrc} alt={`Simulated satellite image from ${beforeYear}`} className="absolute inset-0 h-full w-full max-w-none object-cover" style={{width:`${10000/position}%`}}/><span className="absolute left-3 top-3 rounded-pill bg-black/65 px-2.5 py-1 text-meta text-white">BEFORE · {beforeYear}</span></div><input aria-label="Drag to compare before and after images" type="range" min="2" max="98" value={position} onChange={e=>setPosition(Number(e.target.value))} className="absolute inset-x-3 bottom-3 z-10 w-[calc(100%-1.5rem)] accent-white"/><span className="pointer-events-none absolute left-1/2 top-1/2 z-[2] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/45 text-white" style={{left:`${position}%`}}>↔</span></div><p className="mt-2 text-meta text-text-muted">Locally generated satellite-style placeholders; no imagery is fetched.</p></Card>;
}
function severityClass(severity:string){return severity==="High"?"text-rose-300":severity==="Moderate"?"text-amber-300":"text-emerald-300";}
export function RecommendationsPanel({ recommendations }: { recommendations: MockAnalysis["recommendations"] }) {
 const icons=[CircleAlert,Activity,CheckCircle2];
 return <Card><div className="mb-4 flex items-center gap-2"><ShieldCheck size={15} className="text-primary"/><CardLabel>AI Recommendations</CardLabel></div><div className="space-y-3">{recommendations.map((item,index)=>{const Icon=icons[index%icons.length];return <motion.div key={item.title} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:index*.06}} className="flex gap-3 rounded-control border border-hairline bg-white/[.02] p-3"><span className={`mt-0.5 rounded-control p-2 ${severityClass(item.severity)} bg-white/[.04]`}><Icon size={15}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-button-label font-medium text-text-primary">{item.title}</p><span className={`text-[10px] font-semibold uppercase ${severityClass(item.severity)}`}>{item.severity}</span></div><p className="mt-1 text-meta leading-5 text-text-muted">{item.explanation}</p></div></motion.div>;})}</div></Card>;
}
export function MetadataPanel({ metadata }: { metadata: MockAnalysis["metadata"] }) {
 const items:[[string,string,typeof MapPin],...Array<[string,string,typeof MapPin]>]=[
  ["Analysis ID",metadata.analysisId,Cpu],["Analysis Date",metadata.analysisDate,CalendarDays],["Processing Time",metadata.processingTime,Timer],["Satellite Source",metadata.satelliteSource,Satellite],["Imagery Resolution",metadata.imageryResolution,Activity],["Cloud Coverage",metadata.cloudCoverage,Cloud],["AI Confidence",metadata.aiConfidence,ShieldCheck],["Coordinates",metadata.coordinates,LocateFixed],["Area Size",metadata.areaSize,MapPin],["Selected Time Range",metadata.selectedTimeRange,CalendarDays],["Model Version",metadata.modelVersion,Cpu],["Status",metadata.status,CheckCircle2],
 ];
 return <Card><div className="mb-4 flex items-center gap-2"><Satellite size={15} className="text-primary"/><CardLabel>Analysis Metadata</CardLabel></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label,value,Icon])=><div key={label} className="flex min-w-0 items-start gap-2 rounded-control border border-hairline bg-white/[.02] p-3"><Icon size={14} className="mt-0.5 shrink-0 text-text-muted"/><div className="min-w-0"><CardLabel>{label}</CardLabel><p className="mt-1 break-words text-meta text-text-primary">{value}</p></div></div>)}</div></Card>;
}
