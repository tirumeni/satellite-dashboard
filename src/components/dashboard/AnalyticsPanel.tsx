import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, CalendarDays, Cloud, ScanSearch, Satellite, ShieldCheck } from "lucide-react";
import type { MockAnalysis, Severity } from "@/types/analysis";

const tooltipStyle = {
  background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 10, color: "#f1f5f9", fontSize: 12,
};
const severityColors: Record<Severity, string> = { Low: "#34d399", Moderate: "#fbbf24", High: "#fb7185" };

function GlassChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: ReactNode; className?: string }) {
  return <motion.article
    initial={{ opacity: 0, y: 12, scale: 0.985 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className={`glass-surface min-w-0 rounded-card p-section shadow-elevation-2 transition-shadow duration-300 hover:shadow-elevation-3 ${className}`}
  >
    <div className="mb-3">
      <h3 className="text-button-label font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-meta text-text-muted">{subtitle}</p>
    </div>
    {children}
  </motion.article>;
}

function CircularMetric({ label, value, detail, progress, color, icon: Icon, delay = 0 }: {
  label: string; value: string; detail: string; progress: number; color: string;
  icon: typeof ShieldCheck; delay?: number;
}) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const boundedProgress = Math.max(0, Math.min(100, progress));
  return <motion.article
    initial={{ opacity: 0, y: 12, scale: 0.94 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    whileHover={{ y: -3 }}
    className="glass-surface flex min-w-0 items-center gap-3 rounded-card p-3 shadow-elevation-1 transition-shadow hover:shadow-elevation-2 sm:gap-4 sm:p-4"
  >
    <div className="relative h-[76px] w-[76px] shrink-0" role="img" aria-label={`${label}: ${value}`}>
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6"/>
        <motion.circle
          cx="42" cy="42" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - boundedProgress / 100) }}
          transition={{ duration: 1, delay: delay + 0.15, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-text-primary">{Math.round(boundedProgress)}%</span>
    </div>
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-meta text-text-muted"><Icon size={13} style={{ color }} aria-hidden="true"/>{label}</p>
      <p className="mt-1 truncate text-button-label font-semibold text-text-primary" title={value}>{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-text-muted" title={detail}>{detail}</p>
    </div>
  </motion.article>;
}

export const AnalyticsPanel = memo(function AnalyticsPanel({ analysis, year }: { analysis: MockAnalysis; year: number }) {
  const historical = analysis.timelineData.length
    ? analysis.timelineData.slice().sort((a, b) => a.year - b.year)
    : [{ year, changeType: analysis.changeType, confidence: analysis.confidence, affectedAreaKm2: analysis.areaKm2, severity: analysis.severity }];
  const trend = historical.map((point) => ({
    year: point.year,
    area: Number(point.affectedAreaKm2.toFixed(2)),
    confidence: point.confidence,
  }));

  const categories = [
    { name: "Urban", value: 20 + (analysis.seed % 15), color: "#f5a623" },
    { name: "Vegetation", value: 18 + ((analysis.seed >>> 3) % 16), color: "#34d399" },
    { name: "Water", value: 12 + ((analysis.seed >>> 6) % 12), color: "#38bdf8" },
    { name: "Infrastructure", value: 14 + ((analysis.seed >>> 9) % 14), color: "#a78bfa" },
    { name: "Other", value: 8 + ((analysis.seed >>> 12) % 10), color: "#94a3b8" },
  ];
  const severityValues: Severity[] = ["Low", "Moderate", "High"];
  const severityCounts = severityValues.map((severity) => ({
    name: severity,
    value: Math.max(analysis.timelineData.filter((point) => point.severity === severity).length, severity === analysis.severity ? 1 : 0),
    color: severityColors[severity],
  }));

  const cloudCover = Number(analysis.metadata.cloudCoverage.match(/[\d.]+/)?.[0] ?? 0);
  const areaAnalyzed = analysis.aoiChangedPercent > 0
    ? analysis.areaKm2 / (analysis.aoiChangedPercent / 100)
    : analysis.areaKm2;
  const detectionScore = Math.round(Math.min(100, analysis.confidence * 0.7 + (100 - cloudCover) * 0.2 + Math.min(analysis.changeRegionCount, 100) * 0.1));
  const confidenceDelta = trend.length > 1 ? trend[trend.length - 1].confidence - trend[0].confidence : 0;
  const latestPoint = historical[historical.length - 1];
  const largestChange = historical.reduce((largest, item) => Math.max(largest, item.affectedAreaKm2), 0);
  const miniStats = [
    { label: "Total detections", value: String(analysis.changeRegionCount), icon: Activity, tone: "text-blue-300" },
    { label: "Largest change", value: `${largestChange.toFixed(2)} km²`, icon: ScanSearch, tone: "text-emerald-300" },
    { label: "Latest acquisition", value: analysis.dateRange || analysis.metadata.analysisDate, icon: CalendarDays, tone: "text-amber-200" },
    { label: "Satellite used", value: analysis.metadata.satelliteSource, icon: Satellite, tone: "text-violet-300" },
  ];

  return <motion.section
    initial="hidden"
    animate="show"
    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    aria-label="Analytics dashboard"
    className="space-y-4"
  >
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-label-micro font-semibold uppercase tracking-[.18em] text-primary">Analytics workspace</p>
        <h2 className="mt-1 text-h2 text-text-primary">Change Intelligence</h2>
      </div>
      <span className="rounded-pill border border-hairline bg-white/[.03] px-3 py-1.5 text-meta text-text-muted">{analysis.dateRange} · {analysis.changeType}</span>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <CircularMetric label="Confidence" value={`${analysis.confidence.toFixed(1)}%`} detail="Model confidence" progress={analysis.confidence} color="#60a5fa" icon={ShieldCheck} delay={0}/>
      <CircularMetric label="Area analyzed" value={`${areaAnalyzed.toFixed(1)} km²`} detail="Estimated AOI footprint" progress={Math.min(100, areaAnalyzed / 2)} color="#a78bfa" icon={ScanSearch} delay={0.06}/>
      <CircularMetric label="Cloud cover" value={`${cloudCover.toFixed(0)}%`} detail="Lower is clearer" progress={100 - cloudCover} color="#38bdf8" icon={Cloud} delay={0.12}/>
      <CircularMetric label="Detection score" value={`${detectionScore}%`} detail="Composite signal score" progress={detectionScore} color="#34d399" icon={Activity} delay={0.18}/>
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <GlassChartCard title="Area Affected Trend" subtitle="Annual estimated change area · km²">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
            <defs><linearGradient id={`areaFill-${analysis.seed}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity={0.38}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0.015}/></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false}/>
            <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }}/>
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={48}/>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(2)} km²`, "Affected area"]}/>
            <Area type="monotone" dataKey="area" stroke="#60a5fa" strokeWidth={2.5} fill={`url(#areaFill-${analysis.seed})`} activeDot={{ r: 5, fill: "#bfdbfe" }} animationDuration={900}/>
          </AreaChart></ResponsiveContainer>
        </div>
      </GlassChartCard>

      <GlassChartCard title="Confidence Trend" subtitle={`Model confidence across ${historical[0].year}–${latestPoint.year}`}>
        <div className="mb-2 flex items-center gap-2 text-meta text-text-muted"><span className="h-2 w-2 rounded-full bg-emerald-300"/>{confidenceDelta >= 0 ? "Up" : "Down"} {Math.abs(confidenceDelta)} pts across selected history</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false}/>
            <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }}/>
            <YAxis domain={[70, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} width={42}/>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, "Confidence"]}/>
            <Line type="monotone" dataKey="confidence" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={900}/>
          </LineChart></ResponsiveContainer>
        </div>
      </GlassChartCard>

      <GlassChartCard title="Change Category Distribution" subtitle="Illustrative detections by category">
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr]">
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={3} animationDuration={950}>{categories.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} detections`, "Category"]}/></PieChart></ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {categories.map((entry) => <div key={entry.name} className="flex items-center justify-between gap-2 text-meta"><span className="flex min-w-0 items-center gap-2 truncate text-text-muted"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }}/>{entry.name}</span><span className="font-mono text-text-primary">{entry.value}</span></div>)}
          </div>
        </div>
      </GlassChartCard>

      <GlassChartCard title="Severity Distribution" subtitle="Historical screening severity">
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr]">
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={severityCounts} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={4} animationDuration={900}>{severityCounts.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} years`, "Severity"]}/></PieChart></ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {severityCounts.map((entry) => <div key={entry.name}>
              <div className="mb-1 flex justify-between text-meta"><span style={{ color: entry.color }}>{entry.name}</span><span className="text-text-primary">{entry.value}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${historical.length ? (entry.value / historical.length) * 100 : 0}%` }} transition={{ duration: 0.75, ease: "easeOut" }} className="h-full rounded-full" style={{ background: entry.color }}/></div>
            </div>)}
          </div>
        </div>
      </GlassChartCard>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {miniStats.map(({ label, value, icon: Icon, tone }, index) => <motion.article
        key={label}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.3 }}
        className="glass-surface min-w-0 rounded-card p-4 transition-transform duration-300 hover:-translate-y-0.5"
      >
        <div className="flex items-center justify-between gap-3"><span className="text-meta text-text-muted">{label}</span><Icon size={16} className={tone} aria-hidden="true"/></div>
        <p className="mt-2 truncate text-button-label font-semibold text-text-primary" title={value}>{value}</p>
      </motion.article>)}
    </div>
  </motion.section>;
});
