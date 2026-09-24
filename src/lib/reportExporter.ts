import { jsPDF } from "jspdf";
import type { MockAnalysis } from "@/types/analysis";

export function downloadAnalysisReport(query: string, location: string, year: number, result: MockAnalysis) {
  const pdf = new jsPDF(); let y = 20;
  const line = (text: string, size = 11, color: [number, number, number] = [45, 58, 76]) => {
    pdf.setFontSize(size); pdf.setTextColor(...color); const lines = pdf.splitTextToSize(text, 170);
    if (y + lines.length * 6 > 280) { pdf.addPage(); y = 20; }
    pdf.text(lines, 20, y); y += lines.length * 6 + 3;
  };
  pdf.setFillColor(10, 18, 33); pdf.rect(0, 0, 210, 38, "F"); pdf.setTextColor(235, 244, 255); pdf.setFontSize(19);
  pdf.text("Smart Earth | Satellite Change Analysis", 16, 19); pdf.setFontSize(10); pdf.text(`Generated ${result.metadata.analysisDate} · Mock report`, 16, 29); y = 50;
  line(`Location: ${location}`, 13); line(`Query: ${query}`); line(`Detection year: ${year}`); line(`Change type: ${result.changeType}`);
  line(`Confidence: ${result.confidence}%    Severity: ${result.severity}    Estimated area: ${result.areaKm2} km2`); line(`Detection period: ${result.dateRange}`); y += 2;
  pdf.setFillColor(225, 233, 241); pdf.roundedRect(20, y, 170, 38, 3, 3, "F"); pdf.setTextColor(70, 90, 110); pdf.setFontSize(9);
  pdf.text("MAP SNAPSHOT PLACEHOLDER · Approximate area of interest", 27, y + 12); pdf.setDrawColor(64, 148, 204); pdf.rect(28, y + 17, 150, 14); y += 48;
  line("AI Generated Summary", 13, [22, 95, 155]); line(result.summary); y += 2; line("Metadata", 13, [22, 95, 155]);
  Object.entries(result.metadata).forEach(([key, value]) => line(`${key}: ${value}`));
  y += 2; line("Recommended Actions", 13, [22, 95, 155]);
  result.recommendations.forEach((item, index) => line(`${index + 1}. ${item.title} — ${item.explanation} (${item.severity})`));
  y += 2; line("Timeline Snapshot", 13, [22, 95, 155]);
  result.timelineData.forEach(item => line(`${item.year}: ${item.affectedAreaKm2} km2 · ${item.confidence}% confidence · ${item.severity}`));
  pdf.save(`satellite-analysis-${year}.pdf`);
}

function saveBlob(filename: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }

export function downloadAnalysisExport(format: string, result: MockAnalysis) {
  const filename = `satellite-analysis-${result.metadata.analysisId.toLowerCase()}`;
  if (format === "JSON") { saveBlob(`${filename}.json`, JSON.stringify(result.exportData, null, 2), "application/json"); return; }
  if (format === "CSV") {
    const rows: unknown[][] = [["Section", "Field", "Value"]];
    Object.entries(result.metadata).forEach(([key, value]) => rows.push(["Metadata", key, value]));
    rows.push(["Statistics", "Change type", result.changeType], ["Statistics", "Confidence", `${result.confidence}%`], ["Statistics", "Severity", result.severity], ["Statistics", "Area changed (km2)", result.areaKm2], ["Analysis", "Summary", result.summary]);
    result.timelineData.forEach(item => rows.push(["Timeline", item.year, `${item.affectedAreaKm2} km2; ${item.confidence}% confidence; ${item.severity}`]));
    result.recommendations.forEach((item, index) => rows.push(["Recommendation", index + 1, `${item.title}: ${item.explanation} (${item.severity})`]));
    saveBlob(`${filename}.csv`, rows.map(row => row.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8"); return;
  }
  if (format === "TXT Summary") {
    const summary = ["PS-227 SATELLITE CHANGE ANALYSIS", "", result.summary, "", `Change type: ${result.changeType}`, `Confidence: ${result.confidence}%`, `Severity: ${result.severity}`, `Estimated area changed: ${result.areaKm2} km2`, `Date range: ${result.dateRange}`, "", "ANALYSIS METADATA", ...Object.entries(result.metadata).map(([key, value]) => `${key}: ${value}`), "", "RECOMMENDATIONS", ...result.recommendations.map((item, index) => `${index + 1}. ${item.title} — ${item.explanation} [${item.severity}]`)].join("\n");
    saveBlob(`${filename}.txt`, summary, "text/plain;charset=utf-8"); return;
  }
  if (format === "PNG") {
    const canvas = document.createElement("canvas"); canvas.width = 1600; canvas.height = 1100;
    const context = canvas.getContext("2d"); if (!context) throw new Error("PNG export is unavailable in this browser.");
    context.fillStyle = "#0b1220"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#111c30"; context.fillRect(50, 50, 1500, 1000);
    context.fillStyle = "#e7f1ff"; context.font = "bold 42px Arial"; context.fillText("PS-227 Satellite Change Analysis", 95, 125);
    context.fillStyle = "#93c5fd"; context.font = "24px Arial"; context.fillText(`${result.changeType} · ${result.metadata.analysisDate} · ${result.metadata.analysisId}`, 95, 175);
    context.fillStyle = "#20324a"; context.fillRect(95, 215, 1410, 180);
    context.fillStyle = "#f1f5f9"; context.font = "bold 26px Arial";
    context.fillText(`Confidence ${result.confidence}%`, 125, 275); context.fillText(`Severity ${result.severity}`, 475, 275); context.fillText(`Changed area ${result.areaKm2} km2`, 825, 275);
    context.fillStyle = "#cbd5e1"; context.font = "22px Arial"; wrapCanvasText(context, result.summary, 125, 325, 1320, 30);
    context.fillStyle = "#93c5fd"; context.font = "bold 25px Arial"; context.fillText("Metadata", 95, 455);
    context.fillStyle = "#cbd5e1"; context.font = "19px Arial";
    const metadataLines = Object.entries(result.metadata); metadataLines.forEach(([key, value], index) => context.fillText(`${key}: ${value}`, 105 + (index >= 6 ? 700 : 0), 495 + (index % 6) * 34));
    context.fillStyle = "#93c5fd"; context.font = "bold 25px Arial"; context.fillText("Recommendations", 95, 740);
    context.fillStyle = "#cbd5e1"; context.font = "20px Arial"; result.recommendations.forEach((item, index) => context.fillText(`${index + 1}. ${item.title} — ${item.explanation}`, 110, 795 + index * 65, 1350));
    canvas.toBlob(blob => { if (blob) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${filename}.png`; anchor.click(); URL.revokeObjectURL(url); } }, "image/png");
  }
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = ""; for (const word of text.split(/\s+/)) { const candidate = line ? `${line} ${word}` : word; if (context.measureText(candidate).width > maxWidth && line) { context.fillText(line, x, y); y += lineHeight; line = word; } else line = candidate; } if (line) context.fillText(line, x, y);
}
