import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  ShieldAlert, 
  TrendingUp, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  Check, 
  Sliders, 
  Layers, 
  RefreshCw,
  FileSpreadsheet,
  Settings
} from "lucide-react";
import { BudgetConfig, MetricsData } from "../types";

interface BudgetGuardrailsProps {
  metrics: MetricsData;
  onUpdateBudget?: (config: BudgetConfig) => void;
}

export default function BudgetGuardrails({
  metrics,
  onUpdateBudget
}: BudgetGuardrailsProps) {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() => {
    try {
      const saved = localStorage.getItem("nvidia_budget_guardrails");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      monthlyLimitUsd: 200,
      spentUsd: metrics.totalCostSavings || 142.30,
      tokenLimit: 2000000,
      tokensUsed: metrics.totalTokensUsed || 1248390,
      autoDowngradeEnabled: true,
      downgradeThresholdPercent: 85,
      fallbackModelId: "nvidia/nemotron-3.5-lightning-30b-a3b"
    };
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("nvidia_budget_guardrails", JSON.stringify(budgetConfig));
    } catch {}
    if (onUpdateBudget) {
      onUpdateBudget(budgetConfig);
    }
  }, [budgetConfig]);

  const percentSpent = Math.min(100, Math.round((budgetConfig.spentUsd / budgetConfig.monthlyLimitUsd) * 100));
  const isNearLimit = percentSpent >= budgetConfig.downgradeThresholdPercent;
  const isOverLimit = percentSpent >= 95;

  // Breakdown calculations
  const promptTokensEst = Math.round(budgetConfig.tokensUsed * 0.45);
  const completionTokensEst = Math.round(budgetConfig.tokensUsed * 0.55);
  const promptCost = (promptTokensEst / 1000000) * 0.15;
  const completionCost = (completionTokensEst / 1000000) * 0.60;
  const gpuInferenceCost = Math.max(0, budgetConfig.spentUsd - (promptCost + completionCost));

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportCSV = () => {
    const csv = `Metric,Value,Cost (USD)
Monthly Limit,$${budgetConfig.monthlyLimitUsd.toFixed(2)},-
Total Spent,$${budgetConfig.spentUsd.toFixed(2)},-
Prompt Tokens,${promptTokensEst},$${promptCost.toFixed(4)}
Completion Tokens,${completionTokensEst},$${completionCost.toFixed(4)}
GPU Cluster Inference Hours,${(gpuInferenceCost / 1.8).toFixed(2)} hrs,$${gpuInferenceCost.toFixed(2)}
Auto Downgrade Enabled,${budgetConfig.autoDowngradeEnabled ? "YES" : "NO"},-
Downgrade Threshold,${budgetConfig.downgradeThresholdPercent}%,-
`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nvidia-spend-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Banner if Near Threshold */}
      {isNearLimit && (
        <div className={`p-4 rounded-3xl border flex items-center justify-between gap-3 animate-pulse ${
          isOverLimit 
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300" 
            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
        }`}>
          <div className="flex items-center space-x-3">
            <AlertTriangle size={20} className={isOverLimit ? "text-rose-400" : "text-amber-400"} />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider font-mono">
                {isOverLimit ? "Critical Budget Cap Exceeded (>95%)" : "Budget Guardrail Advisory (85% Limit Reached)"}
              </h4>
              <p className="text-[10px] text-slate-300 mt-0.5">
                {budgetConfig.autoDowngradeEnabled
                  ? `Active traffic automatically routing to lightweight model (${budgetConfig.fallbackModelId}) to prevent billing runaways.`
                  : "Auto-downgrade is disabled. Consider setting a lower token limit or enabling safety fallbacks."}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-black px-3 py-1 rounded-xl bg-[#060c15] border border-current">
            {percentSpent}% Spent
          </span>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Spend Meter */}
        <div className="bg-[#0b1622]/90 border border-[#16273a] rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#c49b66] flex items-center space-x-1.5">
              <DollarSign size={13} />
              <span>Session Spend vs Cap</span>
            </span>
            <span className="text-xs font-mono font-bold text-white">
              ${budgetConfig.spentUsd.toFixed(2)} / ${budgetConfig.monthlyLimitUsd}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-[#060c15] rounded-full overflow-hidden border border-[#16273a]">
              <div 
                className={`h-full transition-all duration-500 ${
                  isOverLimit 
                    ? "bg-rose-500" 
                    : isNearLimit 
                    ? "bg-gradient-to-r from-amber-500 to-rose-500" 
                    : "bg-gradient-to-r from-[#7ae7c7] to-[#c49b66]"
                }`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
              <span>0%</span>
              <span>Threshold: {budgetConfig.downgradeThresholdPercent}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#16273a] flex items-center justify-between text-xs">
            <span className="text-slate-400">Remaining Cushion:</span>
            <span className="font-mono font-bold text-[#7ae7c7]">
              ${Math.max(0, budgetConfig.monthlyLimitUsd - budgetConfig.spentUsd).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Granular Cost Breakdown */}
        <div className="bg-[#0b1622]/90 border border-[#16273a] rounded-3xl p-5 space-y-3">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#7ae7c7] flex items-center space-x-1.5">
            <TrendingUp size={13} />
            <span>Telemetry Cost Attribution</span>
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#060c15] border border-[#16273a]">
              <span className="text-slate-400 text-[11px]">Prompt Tokens ($0.15/1M)</span>
              <span className="font-mono font-bold text-slate-200">${promptCost.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#060c15] border border-[#16273a]">
              <span className="text-slate-400 text-[11px]">Completion Tokens ($0.60/1M)</span>
              <span className="font-mono font-bold text-slate-200">${completionCost.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#060c15] border border-[#16273a]">
              <span className="text-slate-400 text-[11px]">GPU TensorRT Runtime</span>
              <span className="font-mono font-bold text-[#c49b66]">${gpuInferenceCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Fallback Control */}
        <div className="bg-[#0b1622]/90 border border-[#16273a] rounded-3xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center space-x-1.5">
                <Cpu size={13} />
                <span>Auto-Downgrade Safety</span>
              </span>
              <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                budgetConfig.autoDowngradeEnabled 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {budgetConfig.autoDowngradeEnabled ? "ACTIVE" : "OFF"}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-snug">
              Automatically routes non-critical queries to high-throughput lightweight NIMs when nearing quota limits.
            </p>

            <div className="p-2.5 rounded-xl bg-[#060c15] border border-[#16273a] space-y-1">
              <span className="text-[9px] uppercase font-mono text-slate-500 block">Fallback Target</span>
              <span className="text-xs font-mono font-bold text-[#c49b66]">
                {budgetConfig.fallbackModelId.split("/")[1] || budgetConfig.fallbackModelId}
              </span>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full py-2 bg-[#060c15] hover:bg-[#16273a] border border-[#16273a] text-slate-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <FileSpreadsheet size={13} />
            <span>Export Spend Audit CSV</span>
          </button>
        </div>

      </div>

      {/* Configuration Sliders & Knobs */}
      <div className="bg-[#0b1622]/80 border border-[#16273a] rounded-3xl p-6 space-y-5">
        <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center space-x-2">
          <Settings size={14} className="text-[#c49b66]" />
          <span>Guardrail Threshold Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Monthly Budget Cap Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                Monthly Cap ($ USD)
              </label>
              <span className="text-xs font-mono font-bold text-[#7ae7c7]">
                ${budgetConfig.monthlyLimitUsd}.00
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={budgetConfig.monthlyLimitUsd}
              onChange={(e) => setBudgetConfig({ ...budgetConfig, monthlyLimitUsd: Number(e.target.value) })}
              className="w-full accent-[#7ae7c7] cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 font-mono">Range: $50 to $1,000 / month</span>
          </div>

          {/* Downgrade Threshold % */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                Downgrade Trigger
              </label>
              <span className="text-xs font-mono font-bold text-[#c49b66]">
                {budgetConfig.downgradeThresholdPercent}% of Cap
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={budgetConfig.downgradeThresholdPercent}
              onChange={(e) => setBudgetConfig({ ...budgetConfig, downgradeThresholdPercent: Number(e.target.value) })}
              className="w-full accent-[#c49b66] cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 font-mono">Triggers at ${((budgetConfig.monthlyLimitUsd * budgetConfig.downgradeThresholdPercent) / 100).toFixed(0)} spent</span>
          </div>

          {/* Toggle Auto Downgrade */}
          <div className="flex flex-col justify-between space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
              Protection Mode
            </span>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#060c15] border border-[#16273a]">
              <span className="text-xs text-slate-200 font-bold">Auto-Downgrade Engine</span>
              <input
                type="checkbox"
                checked={budgetConfig.autoDowngradeEnabled}
                onChange={(e) => setBudgetConfig({ ...budgetConfig, autoDowngradeEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#c49b66] cursor-pointer"
              />
            </div>
            <button
              onClick={handleSave}
              className="py-2.5 bg-gradient-to-r from-[#c49b66] to-[#a47e4f] text-[#060c15] text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-[#c49b66]/20"
            >
              {isSaved ? <Check size={14} /> : <Zap size={14} />}
              <span>{isSaved ? "Saved Guardrails" : "Apply Guardrail Policy"}</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
