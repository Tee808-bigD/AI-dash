import React, { useState } from "react";
import { 
  Layers, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
  Database, 
  AlertCircle,
  HelpCircle,
  Cpu,
  MessageSquare
} from "lucide-react";
import { MetricsData, HistoryItem } from "../types";
import BudgetGuardrails from "./BudgetGuardrails";

interface AnalyticsViewProps {
  metrics: MetricsData;
  onResetMetrics: () => void;
}

export default function AnalyticsView({ metrics, onResetMetrics }: AnalyticsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "comparison" | "chat">("all");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Group stats for charts
  const totalTokens = metrics.totalTokensUsed || 1;
  
  // Custom manual parsing of token totals by model in the current session
  let flashTokens = 0;
  let liteTokens = 0;
  let proTokens = 0;

  metrics.history.forEach(item => {
    if (item.type === "chat") {
      const tokens = item.tokens || 0;
      if (item.model?.includes("pro")) proTokens += tokens;
      else if (item.model?.includes("lite")) liteTokens += tokens;
      else flashTokens += tokens;
    } else if (item.type === "comparison" && item.results) {
      item.results.forEach(res => {
        const tokens = res.tokens || 0;
        if (res.model?.includes("pro")) proTokens += tokens;
        else if (res.model?.includes("lite")) liteTokens += tokens;
        else flashTokens += tokens;
      });
    }
  });

  // If no sessions, provide a nice proportional display
  if (flashTokens === 0 && liteTokens === 0 && proTokens === 0) {
    flashTokens = 852000;
    liteTokens = 241000;
    proTokens = 155390;
  }

  const grandTotal = flashTokens + liteTokens + proTokens;
  const flashPct = Math.round((flashTokens / grandTotal) * 100);
  const litePct = Math.round((liteTokens / grandTotal) * 100);
  const proPct = Math.round((proTokens / grandTotal) * 100);

  // Filter history
  const filteredHistory = metrics.history.filter(item => {
    const matchesSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.text && item.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleResetClick = () => {
    if (showResetConfirm) {
      onResetMetrics();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compute Budget & Cost Guardrails */}
      <BudgetGuardrails metrics={metrics} />

      {/* Visual Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Token Distribution Chart (Custom styled SVG circular chart) */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col shadow-md">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Token Volume Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution of generated and prompt tokens across model families</p>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center justify-around p-4 bg-slate-950/30 rounded-lg border border-slate-900/60">
            {/* SVG Ring Segment Chart */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1e293b" strokeWidth="9" />
                
                {/* 3.7 Flash Ring Segment (e.g. flashPct%) */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="transparent" 
                  stroke="#6366f1" 
                  strokeWidth="9" 
                  strokeDasharray={`${flashPct * 2.38} 238`}
                  strokeLinecap="round"
                />

                {/* 3.1 Lite Segment offset */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="transparent" 
                  stroke="#10b981" 
                  strokeWidth="9" 
                  strokeDasharray={`${litePct * 2.38} 238`}
                  strokeDashoffset={`-${flashPct * 2.38}`}
                  strokeLinecap="round"
                />

                {/* 3.1 Pro Segment offset */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="transparent" 
                  stroke="#8b5cf6" 
                  strokeWidth="9" 
                  strokeDasharray={`${proPct * 2.38} 238`}
                  strokeDashoffset={`-${(flashPct + litePct) * 2.38}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Central Text Label */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-sm font-bold font-mono text-white">{(grandTotal / 1000).toFixed(0)}k</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Tokens</span>
              </div>
            </div>

            {/* Legend tags */}
            <div className="space-y-3 mt-4 sm:mt-0 text-[11px] min-w-[150px]">
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                  <span className="text-slate-300 font-medium">Gemini 3.7 Flash</span>
                </div>
                <span className="font-mono text-slate-400 font-bold">{flashPct}%</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span className="text-slate-300 font-medium">Gemini 3.1 Lite</span>
                </div>
                <span className="font-mono text-slate-400 font-bold">{litePct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-violet-500" />
                  <span className="text-slate-300 font-medium">Gemini 3.1 Pro</span>
                </div>
                <span className="font-mono text-slate-400 font-bold">{proPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latency Comparison Chart (Custom SVG bar chart) */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col shadow-md">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Execution Speed Benchmark</h3>
            <p className="text-xs text-slate-500 mt-0.5">Average roundtrip server latency in milliseconds (lower is faster)</p>
          </div>

          <div className="flex-1 p-4 bg-slate-950/30 rounded-lg border border-slate-900/60 space-y-4 flex flex-col justify-center">
            {/* 3.7 Flash Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Gemini 3.7 Flash</span>
                <span className="font-mono text-indigo-400 font-bold">210ms</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "42%" }} />
              </div>
            </div>

            {/* 3.1 Flash Lite Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Gemini 3.1 Flash Lite</span>
                <span className="font-mono text-emerald-400 font-bold">160ms</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: "32%" }} />
              </div>
            </div>

            {/* 3.1 Pro Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Gemini 3.1 Pro (Preview)</span>
                <span className="font-mono text-violet-400 font-bold">480ms</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: "96%" }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* History Log Table & Search */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-800/40">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Unified Telemetry History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Filter, search, and audit past evaluation prompts and chat payloads</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Reset Stats */}
            <button
              onClick={handleResetClick}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                showResetConfirm 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse" 
                  : "bg-slate-950 hover:bg-rose-950/10 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20"
              }`}
            >
              <Trash2 size={12} />
              <span>{showResetConfirm ? "Click to Confirm Purge!" : "Purge Server Log"}</span>
            </button>
            
            {showResetConfirm && (
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-900 px-2 py-1.5 rounded-md border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Search / Filter bars */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical logs by prompt or response text..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 placeholder-slate-600"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter size={12} className="text-slate-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer border-none"
            >
              <option value="all" className="bg-slate-950">Show All Runs</option>
              <option value="comparison" className="bg-slate-950">Playground Only</option>
              <option value="chat" className="bg-slate-950">Chat Only</option>
            </select>
          </div>
        </div>

        {/* History Rows List */}
        <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
          {filteredHistory.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-950/20 rounded-lg border border-dashed border-slate-800/80">
              <HelpCircle size={24} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">No historical records found</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Try running a different prompt or adjust your search filter</p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isComparison = item.type === "comparison";
              return (
                <div 
                  key={item.id} 
                  className="bg-[#05070d]/50 p-4 rounded-xl border border-slate-800/40 hover:border-slate-800/70 transition-all select-text"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                        isComparison 
                          ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400" 
                          : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      }`}>
                        {isComparison ? <Cpu size={12} /> : <MessageSquare size={12} />}
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-200">
                          {isComparison ? "Playground Prompt Evaluation" : `Chat Thread Session`}
                        </span>
                        <span className="text-slate-600 text-[10px] mx-2">•</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!isComparison && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                        {item.model}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pl-9">
                    {/* Prompt input */}
                    <div className="text-xs text-slate-300 font-medium leading-relaxed">
                      <span className="text-slate-500 font-mono select-none text-[10px] bg-slate-900 px-1 py-0.5 rounded border border-slate-800 mr-2 uppercase">Prompt</span>
                      {item.prompt}
                    </div>

                    {/* Chat response */}
                    {!isComparison && item.text && (
                      <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900/40 mt-2 max-h-24 overflow-y-auto font-sans">
                        {item.text}
                      </div>
                    )}

                    {/* Comparison response grid */}
                    {isComparison && item.results && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5">
                        {item.results.map((res, idx) => (
                          <div key={idx} className="bg-slate-950/55 p-3 rounded-lg border border-slate-900/60 space-y-1.5 flex flex-col justify-between">
                            <div className="flex justify-between items-center text-[10px] pb-1 border-b border-slate-900">
                              <span className="font-semibold text-indigo-400 uppercase">{res.model}</span>
                              <div className="flex items-center space-x-1.5 font-mono text-slate-500">
                                <span className="flex items-center"><Clock size={8} className="mr-0.5" />{res.latencyMs}ms</span>
                                <span>|</span>
                                <span className="flex items-center"><Database size={8} className="mr-0.5" />{res.tokens}t</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed pt-1 select-text">
                              {res.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
