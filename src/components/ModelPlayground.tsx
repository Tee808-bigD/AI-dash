import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Play, 
  HelpCircle, 
  CheckCircle2, 
  Database, 
  Clock, 
  AlertCircle,
  TrendingDown,
  Columns,
  Swords,
  Zap,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Code2,
  Gauge,
  Sparkles
} from "lucide-react";
import { ModelOutput, ComparisonResult } from "../types";
import { MODELS_CATALOG } from "../models-data";
import DeveloperCodeModal from "./DeveloperCodeModal";

interface ModelPlaygroundProps {
  onEvaluationCompleted: () => void;
  preselectedModelId?: string | null;
  onClearPreselected?: () => void;
}

const PROMPT_SUGGESTIONS = [
  "Write an efficient TypeScript function to debounce an event handler.",
  "Explain quantum entanglement to a 10 year old using a sports analogy.",
  "Draft a polite but firm email to a client requesting payment of an overdue invoice.",
  "Identify the primary differences between SQL and NoSQL databases."
];

export default function ModelPlayground({ 
  onEvaluationCompleted,
  preselectedModelId,
  onClearPreselected
}: ModelPlaygroundProps) {
  const [playMode, setPlayMode] = useState<"grid" | "arena">("arena");
  const [prompt, setPrompt] = useState("");
  const [systemInstruction, setSystemInstruction] = useState("You are an expert AI system assistant performing evaluations.");
  const [temperature, setTemperature] = useState(0.7);

  // Slot Model Selections (3 column layout comparison)
  const [slot1Model, setSlot1Model] = useState("kimi-k3");
  const [slot2Model, setSlot2Model] = useState("deepseek-v4-flash-0731");
  const [slot3Model, setSlot3Model] = useState("nemotron-3.5-lightning-30b-a3b");

  // Arena Head-to-Head selections
  const [arenaModelA, setArenaModelA] = useState("kimi-k3");
  const [arenaModelB, setArenaModelB] = useState("deepseek-v4-flash-0731");
  const [simulateFallback, setSimulateFallback] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  // Manage enabled state for slots (users can compare 1, 2, or 3 models in grid mode)
  const [slot1Enabled, setSlot1Enabled] = useState(true);
  const [slot2Enabled, setSlot2Enabled] = useState(true);
  const [slot3Enabled, setSlot3Enabled] = useState(true);

  // Evaluation outputs keyed by slot index (1, 2, 3)
  const [slotOutputs, setSlotOutputs] = useState<Record<string, ModelOutput>>({
    "1": { modelId: "kimi-k3", modelName: "Kimi K3", text: "", tokens: 0, latencyMs: 0, loading: false },
    "2": { modelId: "deepseek-v4-flash-0731", modelName: "DeepSeek V4 Flash", text: "", tokens: 0, latencyMs: 0, loading: false },
    "3": { modelId: "nemotron-3.5-lightning-30b-a3b", modelName: "Nemotron 3.5 Lightning", text: "", tokens: 0, latencyMs: 0, loading: false }
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

  // Developer Code Modal State
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [activeSnippetModel, setActiveSnippetModel] = useState("kimi-k3");

  // Handle incoming pre-selected model hook from the Overview card
  useEffect(() => {
    if (preselectedModelId) {
      setSlot1Model(preselectedModelId);
      setArenaModelA(preselectedModelId);
      setSlot1Enabled(true);
      const modelInfo = MODELS_CATALOG.find(m => m.id === preselectedModelId);
      if (modelInfo) {
        setSlotOutputs(prev => ({
          ...prev,
          "1": {
            modelId: preselectedModelId,
            modelName: modelInfo.name,
            text: "",
            tokens: 0,
            latencyMs: 0,
            loading: false
          }
        }));
      }
      if (onClearPreselected) {
        onClearPreselected();
      }
    }
  }, [preselectedModelId]);

  // Sync model list changes to output structures
  useEffect(() => {
    const info1 = MODELS_CATALOG.find(m => m.id === slot1Model);
    if (info1) {
      setSlotOutputs(prev => ({
        ...prev,
        "1": { ...prev["1"], modelId: slot1Model, modelName: info1.name }
      }));
    }
  }, [slot1Model]);

  useEffect(() => {
    const info2 = MODELS_CATALOG.find(m => m.id === slot2Model);
    if (info2) {
      setSlotOutputs(prev => ({
        ...prev,
        "2": { ...prev["2"], modelId: slot2Model, modelName: info2.name }
      }));
    }
  }, [slot2Model]);

  useEffect(() => {
    const info3 = MODELS_CATALOG.find(m => m.id === slot3Model);
    if (info3) {
      setSlotOutputs(prev => ({
        ...prev,
        "3": { ...prev["3"], modelId: slot3Model, modelName: info3.name }
      }));
    }
  }, [slot3Model]);

  const selectSuggestion = (text: string) => {
    setPrompt(text);
  };

  const handleCompare = async () => {
    if (!prompt.trim()) return;

    setFallbackTriggered(false);

    // Collect active slots to process based on active mode
    const activeSlots: { id: string; modelId: string; modelName: string }[] = [];
    if (playMode === "arena") {
      const infoA = MODELS_CATALOG.find(m => m.id === arenaModelA);
      const infoB = MODELS_CATALOG.find(m => m.id === arenaModelB);
      activeSlots.push({ id: "1", modelId: arenaModelA, modelName: infoA ? infoA.name : arenaModelA });
      activeSlots.push({ id: "2", modelId: arenaModelB, modelName: infoB ? infoB.name : arenaModelB });
    } else {
      if (slot1Enabled) activeSlots.push({ id: "1", modelId: slot1Model, modelName: slotOutputs["1"].modelName });
      if (slot2Enabled) activeSlots.push({ id: "2", modelId: slot2Model, modelName: slotOutputs["2"].modelName });
      if (slot3Enabled) activeSlots.push({ id: "3", modelId: slot3Model, modelName: slotOutputs["3"].modelName });
    }

    if (activeSlots.length === 0) {
      alert("Please select or enable at least one comparison slot.");
      return;
    }

    setIsEvaluating(true);

    // Set loading states
    setSlotOutputs(prev => {
      const next = { ...prev };
      activeSlots.forEach(slot => {
        next[slot.id] = {
          ...next[slot.id],
          loading: true,
          text: "",
          latencyMs: 0,
          tokens: 0,
          error: undefined
        };
      });
      return next;
    });

    const resultsToSave: ComparisonResult[] = [];
    let completedCount = 0;

    const runPromises = activeSlots.map(async (slot) => {
      // Check if fallback simulation is active on Model A
      if (playMode === "arena" && slot.id === "1" && simulateFallback) {
        await new Promise(r => setTimeout(r, 1200));
        setFallbackTriggered(true);
        setSlotOutputs(prev => ({
          ...prev,
          "1": {
            ...prev["1"],
            loading: false,
            text: `[GATEWAY LATENCY SPIKE SIMULATED]\nPrimary endpoint queue exceeded 5000ms SLA. Orchestrator automatically triggered dynamic failover to ${activeSlots[1].modelName}.`,
            tokens: 38,
            latencyMs: 5120,
            error: "Gateway Timeout (SLA breach): Auto-rerouted to Secondary"
          }
        }));
        completedCount++;
        if (completedCount === activeSlots.length) setIsEvaluating(false);
        return;
      }

      const startTime = performance.now();
      try {
        const clientKey = localStorage.getItem("nvidia_api_key") || "";
        const response = await fetch("/api/compare", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-nvidia-api-key": clientKey
          },
          body: JSON.stringify({ 
            model: slot.modelId, 
            prompt,
            systemInstruction,
            temperature
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();
        const endTime = performance.now();
        const finalLatency = data.latencyMs || Math.round(endTime - startTime);

        setSlotOutputs(prev => ({
          ...prev,
          [slot.id]: {
            ...prev[slot.id],
            loading: false,
            text: data.text,
            tokens: data.tokens || 0,
            latencyMs: finalLatency
          }
        }));

        resultsToSave.push({
          model: slot.modelId,
          text: data.text,
          tokens: data.tokens || 0,
          latencyMs: finalLatency
        });

      } catch (error: any) {
        console.error(`Error fetching response for slot ${slot.id} (${slot.modelId}):`, error);
        setSlotOutputs(prev => ({
          ...prev,
          [slot.id]: {
            ...prev[slot.id],
            loading: false,
            text: "",
            error: error?.message || "Generation timeout or API error."
          }
        }));
      } finally {
        completedCount++;
        if (completedCount === activeSlots.length) {
          setIsEvaluating(false);
          if (resultsToSave.length > 0) {
            try {
              await fetch("/api/compare/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, results: resultsToSave })
              });
              onEvaluationCompleted();
            } catch (err) {
              console.error("Failed to save evaluation summary:", err);
            }
          }
        }
      }
    });

    await Promise.all(runPromises);
  };

  // Calculate Tokens Per Second (TPS)
  const calcTps = (tokens: number, latencyMs: number) => {
    if (!tokens || !latencyMs || latencyMs === 0) return 0;
    return Math.round((tokens / (latencyMs / 1000)) * 10) / 10;
  };

  const outputA = slotOutputs["1"];
  const outputB = slotOutputs["2"];
  const tpsA = calcTps(outputA.tokens, outputA.latencyMs);
  const tpsB = calcTps(outputB.tokens, outputB.latencyMs);

  // Determine Arena Winner
  const hasArenaFinished = !outputA.loading && !outputB.loading && (outputA.text || outputA.error) && (outputB.text || outputB.error);
  let arenaWinner: "A" | "B" | "TIE" | null = null;
  if (hasArenaFinished && !outputA.error && !outputB.error) {
    if (outputA.latencyMs < outputB.latencyMs) arenaWinner = "A";
    else if (outputB.latencyMs < outputA.latencyMs) arenaWinner = "B";
    else arenaWinner = "TIE";
  } else if (hasArenaFinished && outputA.error && !outputB.error) {
    arenaWinner = "B";
  } else if (hasArenaFinished && !outputA.error && outputB.error) {
    arenaWinner = "A";
  }

  const handleCopyReport = async () => {
    const text = `### NVIDIA NIM A/B Benchmark Report
**Prompt**: ${prompt}
**Model Alpha**: ${outputA.modelName} (${outputA.latencyMs}ms | ${outputA.tokens} tokens | ${tpsA} TPS)
**Model Beta**: ${outputB.modelName} (${outputB.latencyMs}ms | ${outputB.tokens} tokens | ${tpsB} TPS)
**Winner**: ${arenaWinner === "A" ? outputA.modelName : arenaWinner === "B" ? outputB.modelName : "Tie"}
**Fallback Simulation**: ${simulateFallback ? "Active" : "Disabled"}
`;
    try {
      await navigator.clipboard.writeText(text);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const openCodeModalFor = (modelId: string) => {
    setActiveSnippetModel(modelId);
    setCodeModalOpen(true);
  };

  const hasSomeOutput = slot1Enabled && (slotOutputs["1"].text !== "" || slotOutputs["1"].error) ||
                        slot2Enabled && (slotOutputs["2"].text !== "" || slotOutputs["2"].error) ||
                        slot3Enabled && (slotOutputs["3"].text !== "" || slotOutputs["3"].error);

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1622]/90 border border-[#16273a] p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-[#c49b66]/10 text-[#c49b66]">
            <Swords size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#f5efeb] font-display italic tracking-wide">
              {playMode === "arena" ? "Head-to-Head A/B Benchmark Arena" : "Multi-Model Evaluation Grid"}
            </h2>
            <p className="text-[10px] text-slate-400">
              Measure real-time Tokens-Per-Second (TPS), Time-To-First-Token, and dynamic failover rerouting.
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center space-x-1.5 bg-[#060c15] p-1 rounded-xl border border-[#16273a]">
          <button
            onClick={() => setPlayMode("arena")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              playMode === "arena" ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Swords size={12} />
            <span>A/B Arena</span>
          </button>
          <button
            onClick={() => setPlayMode("grid")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              playMode === "grid" ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns size={12} />
            <span>3-Slot Grid</span>
          </button>
        </div>
      </div>

      {/* Playground Controls Panel */}
      <div className="bg-[#0b1622]/90 border border-[#16273a] backdrop-blur-md p-5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#16273a]">
          <div className="flex items-center space-x-2.5">
            <Settings className="text-[#c49b66]" size={15} />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#c49b66]">
              {playMode === "arena" ? "Arena Matchup & Dynamic Fallback Config" : "Playground Evaluation Parameters"}
            </h3>
          </div>

          {playMode === "arena" && (
            <label className="flex items-center space-x-2 bg-[#060c15] px-3 py-1.5 rounded-xl border border-[#16273a] cursor-pointer hover:border-[#c49b66]/40 transition-all select-none">
              <input
                type="checkbox"
                checked={simulateFallback}
                onChange={(e) => setSimulateFallback(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#16273a] bg-[#0b1622] text-[#c49b66] focus:ring-0"
              />
              <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                <ShieldAlert size={12} className={simulateFallback ? "text-amber-400" : "text-slate-500"} />
                <span>Simulate Primary Failover Reroute</span>
              </span>
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Model Selection */}
          {playMode === "arena" ? (
            <div className="space-y-3.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Swords size={13} className="text-[#c49b66]" />
                Select Opponents
              </label>

              {/* Model Alpha */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#c49b66] uppercase">
                  <span>Model Alpha</span>
                  <button 
                    onClick={() => openCodeModalFor(arenaModelA)} 
                    className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 size={10} /> SDK Code
                  </button>
                </div>
                <select
                  value={arenaModelA}
                  onChange={(e) => setArenaModelA(e.target.value)}
                  className="w-full bg-[#060c15]/90 border border-[#16273a] rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c49b66] cursor-pointer"
                >
                  {MODELS_CATALOG.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#060c15]">{m.provider} - {m.name}</option>
                  ))}
                </select>
              </div>

              {/* Model Beta */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#7ae7c7] uppercase">
                  <span>Model Beta</span>
                  <button 
                    onClick={() => openCodeModalFor(arenaModelB)} 
                    className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 size={10} /> SDK Code
                  </button>
                </div>
                <select
                  value={arenaModelB}
                  onChange={(e) => setArenaModelB(e.target.value)}
                  className="w-full bg-[#060c15]/90 border border-[#16273a] rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c49b66] cursor-pointer"
                >
                  {MODELS_CATALOG.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#060c15]">{m.provider} - {m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Columns size={13} className="text-[#c49b66]" />
                Slot Model Configuration
              </label>
              
              <div className="space-y-3 pt-1">
                {/* Slot 1 Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Slot A</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={slot1Enabled}
                        onChange={(e) => setSlot1Enabled(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[#16273a] bg-[#060c15] text-[#c49b66] focus:ring-0"
                      />
                      <span className="text-[10px] text-slate-400">Enabled</span>
                    </label>
                  </div>
                  <select
                    value={slot1Model}
                    disabled={!slot1Enabled}
                    onChange={(e) => setSlot1Model(e.target.value)}
                    className="w-full bg-[#060c15]/80 border border-[#16273a] rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#c49b66] disabled:opacity-40 cursor-pointer font-sans"
                  >
                    {MODELS_CATALOG.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#060c15]">{m.provider} - {m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Slot 2 Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Slot B</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={slot2Enabled}
                        onChange={(e) => setSlot2Enabled(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[#16273a] bg-[#060c15] text-[#c49b66] focus:ring-0"
                      />
                      <span className="text-[10px] text-slate-400">Enabled</span>
                    </label>
                  </div>
                  <select
                    value={slot2Model}
                    disabled={!slot2Enabled}
                    onChange={(e) => setSlot2Model(e.target.value)}
                    className="w-full bg-[#060c15]/80 border border-[#16273a] rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#c49b66] disabled:opacity-40 cursor-pointer font-sans"
                  >
                    {MODELS_CATALOG.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#060c15]">{m.provider} - {m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Slot 3 Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Slot C</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={slot3Enabled}
                        onChange={(e) => setSlot3Enabled(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[#16273a] bg-[#060c15] text-[#c49b66] focus:ring-0"
                      />
                      <span className="text-[10px] text-slate-400">Enabled</span>
                    </label>
                  </div>
                  <select
                    value={slot3Model}
                    disabled={!slot3Enabled}
                    onChange={(e) => setSlot3Model(e.target.value)}
                    className="w-full bg-[#060c15]/80 border border-[#16273a] rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#c49b66] disabled:opacity-40 cursor-pointer font-sans"
                  >
                    {MODELS_CATALOG.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#060c15]">{m.provider} - {m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Column 2: Parameters Configuration */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-400">Temperature</label>
                <span className="font-mono text-[#c49b66] font-bold">{temperature.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-slate-500">Controls generation randomness (lower is more deterministic)</p>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#060c15] rounded-lg appearance-none cursor-pointer accent-[#c49b66]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">System Instruction</label>
              <textarea
                rows={3}
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full bg-[#060c15]/80 border border-[#16273a] rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-[#c49b66] placeholder-slate-600 resize-none font-sans"
                placeholder="Instruct the model on its persona or output constraints..."
              />
            </div>
          </div>

          {/* Column 3: Suggestion Helpers */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Quick Evaluation Prompts</label>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {PROMPT_SUGGESTIONS.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(text)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#060c15]/95 border border-[#16273a] text-[10px] text-slate-300 hover:text-[#c49b66] hover:border-[#c49b66]/40 truncate transition-colors cursor-pointer font-medium"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Prompt Input Area */}
      <div className="bg-[#0b1622]/90 border border-[#16273a] backdrop-blur-md p-5 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-2.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#c49b66]">
            {playMode === "arena" ? "Arena Battle Prompt" : "Compare Prompts Concurrently"}
          </label>
          {hasArenaFinished && playMode === "arena" && (
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1.5 text-[10px] text-slate-400 hover:text-[#c49b66] transition-colors cursor-pointer"
            >
              {reportCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{reportCopied ? "Report Copied" : "Copy Benchmark Report"}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="flex-1 bg-[#060c15]/90 border border-[#16273a] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#c49b66] text-slate-100 placeholder-slate-600 font-sans"
            placeholder="Type your comparative prompt here (e.g., Explain REST APIs vs WebSockets...)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
          />
          <button
            onClick={handleCompare}
            disabled={isEvaluating || !prompt.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#c49b66] to-[#a47e4f] hover:opacity-95 text-[#060c15] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-[#c49b66]/20 cursor-pointer flex-shrink-0"
          >
            {isEvaluating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#060c15]/30 border-t-[#060c15] rounded-full animate-spin" />
                <span>Benchmarking NIMs...</span>
              </>
            ) : (
              <>
                <Play size={11} fill="currentColor" />
                <span>{playMode === "arena" ? "Launch Arena Duel" : "Execute Side-By-Side"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fallback Simulation Banner */}
      {fallbackTriggered && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert size={16} className="text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold">Dynamic Gateway Failover Triggered: </span>
              <span className="text-amber-200/90 font-mono">
                Model Alpha ({outputA.modelName}) simulated latency spike. Query dynamically rerouted to Model Beta ({outputB.modelName}) with zero downtime.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-1 rounded-md text-amber-300">
            Auto-Reroute: 420ms
          </span>
        </div>
      )}

      {/* Arena Telemetry Winner Banner */}
      {playMode === "arena" && hasArenaFinished && (
        <div className="bg-[#0b1622]/90 border border-[#16273a] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#c49b66]/15 text-[#c49b66]">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#c49b66] font-bold">
                Arena Match Verdict
              </span>
              <h4 className="text-sm font-bold text-[#f5efeb] font-display italic">
                {arenaWinner === "A" && `Winner: ${outputA.modelName} (Faster by ${Math.abs(outputB.latencyMs - outputA.latencyMs)}ms)`}
                {arenaWinner === "B" && `Winner: ${outputB.modelName} (Faster by ${Math.abs(outputA.latencyMs - outputB.latencyMs)}ms)`}
                {arenaWinner === "TIE" && "Result: Evenly Matched Telemetry"}
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5 bg-[#060c15] px-3 py-1.5 rounded-xl border border-[#16273a]">
              <Gauge size={12} className="text-[#c49b66]" />
              <span className="text-slate-400">Throughput:</span>
              <span className="text-[#f5efeb] font-bold">{tpsA} TPS vs {tpsB} TPS</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-[#060c15] px-3 py-1.5 rounded-xl border border-[#16273a]">
              <Clock size={12} className="text-[#7ae7c7]" />
              <span className="text-slate-400">Latency:</span>
              <span className="text-[#f5efeb] font-bold">{outputA.latencyMs}ms vs {outputB.latencyMs}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Outputs Grid or Arena View */}
      {playMode === "arena" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ArenaOutputCard
            tag="A"
            name={MODELS_CATALOG.find(m => m.id === arenaModelA)?.name || arenaModelA}
            output={outputA}
            tps={tpsA}
            isWinner={arenaWinner === "A"}
            accentColor="#c49b66"
            onOpenCode={() => openCodeModalFor(arenaModelA)}
          />
          <ArenaOutputCard
            tag="B"
            name={MODELS_CATALOG.find(m => m.id === arenaModelB)?.name || arenaModelB}
            output={outputB}
            tps={tpsB}
            isWinner={arenaWinner === "B"}
            accentColor="#7ae7c7"
            onOpenCode={() => openCodeModalFor(arenaModelB)}
          />
        </div>
      ) : (
        hasSomeOutput && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {slot1Enabled && (
              <SlotOutputCard 
                name={slotOutputs["1"].modelName}
                output={slotOutputs["1"]}
                onOpenCode={() => openCodeModalFor(slot1Model)}
              />
            )}
            {slot2Enabled && (
              <SlotOutputCard 
                name={slotOutputs["2"].modelName}
                output={slotOutputs["2"]}
                onOpenCode={() => openCodeModalFor(slot2Model)}
              />
            )}
            {slot3Enabled && (
              <SlotOutputCard 
                name={slotOutputs["3"].modelName}
                output={slotOutputs["3"]}
                onOpenCode={() => openCodeModalFor(slot3Model)}
              />
            )}
          </div>
        )
      )}

      {/* Developer Code Snippet Modal */}
      <DeveloperCodeModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        title={`NVIDIA NIM Integration (${activeSnippetModel})`}
        modelId={activeSnippetModel}
        prompt={prompt || "Explain quantum computing in simple terms."}
        systemInstruction={systemInstruction}
        temperature={temperature}
      />
    </div>
  );
}

interface ArenaOutputCardProps {
  tag: string;
  name: string;
  output: ModelOutput;
  tps: number;
  isWinner: boolean;
  accentColor: string;
  onOpenCode: () => void;
}

function ArenaOutputCard({ tag, name, output, tps, isWinner, accentColor, onOpenCode }: ArenaOutputCardProps) {
  return (
    <div className={`bg-[#0b1622]/90 backdrop-blur-md rounded-2xl border transition-all flex flex-col h-[450px] shadow-xl overflow-hidden ${
      isWinner ? "border-[#c49b66] shadow-[#c49b66]/10" : "border-[#16273a]"
    }`}>
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#16273a] flex justify-between items-center bg-[#060c15]/80">
        <div className="flex items-center space-x-2.5">
          <span 
            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-[#060c15]"
            style={{ backgroundColor: accentColor }}
          >
            {tag}
          </span>
          <span className="font-bold text-xs text-[#f5efeb] font-sans tracking-tight">{name}</span>
          {isWinner && (
            <span className="text-[9px] font-black uppercase tracking-wider bg-[#c49b66]/20 text-[#c49b66] px-2 py-0.5 rounded-md">
              Top Pick
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!output.loading && output.latencyMs > 0 && (
            <div className="flex items-center space-x-2 text-[9px] font-mono font-bold text-slate-300 bg-[#0b1622] px-2.5 py-1 rounded-xl border border-[#16273a]">
              <span>{output.latencyMs}ms</span>
              <span className="text-slate-600">|</span>
              <span>{output.tokens} tok</span>
              <span className="text-slate-600">|</span>
              <span style={{ color: accentColor }}>{tps} TPS</span>
            </div>
          )}
          <button
            onClick={onOpenCode}
            title="Export SDK Code"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#16273a] transition-all cursor-pointer"
          >
            <Code2 size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 overflow-y-auto text-xs leading-relaxed text-slate-200 font-sans select-text scrollbar-thin">
        {output.loading ? (
          <div className="space-y-3.5 animate-pulse pt-2">
            <div className="h-3 bg-[#060c15] rounded-lg w-3/4"></div>
            <div className="h-3 bg-[#060c15] rounded-lg w-5/6"></div>
            <div className="h-3 bg-[#060c15] rounded-lg"></div>
            <div className="h-3 bg-[#060c15] rounded-lg w-2/3"></div>
          </div>
        ) : output.error ? (
          <div className="flex items-start space-x-2 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 text-rose-300 text-[11px]">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-rose-400" />
            <div>
              <p className="font-extrabold uppercase tracking-wide text-[9px] text-rose-400">Endpoint Execution Note</p>
              <p className="mt-1 leading-normal font-mono">{output.error}</p>
            </div>
          </div>
        ) : output.text ? (
          <p className="whitespace-pre-wrap">{output.text}</p>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 italic">
            <HelpCircle size={20} className="text-slate-600 mb-1.5" />
            <span className="text-[11px] font-medium font-sans">Ready for Head-to-Head Duel. Input prompt and execute.</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface SlotOutputCardProps {
  name: string;
  output: ModelOutput;
  onOpenCode: () => void;
}

function SlotOutputCard({ name, output, onOpenCode }: SlotOutputCardProps) {
  return (
    <div className="bg-[#0b1622]/90 backdrop-blur-md rounded-2xl border border-[#16273a] flex flex-col h-[400px] shadow-xl transition-all overflow-hidden">
      {/* Output Header */}
      <div className="px-4.5 py-3 border-b border-[#16273a] flex justify-between items-center bg-[#060c15]/80">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#c49b66] rounded-full animate-pulse" />
          <span className="font-bold text-xs text-slate-100 tracking-tight font-sans">{name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {!output.loading && output.latencyMs > 0 && (
            <div className="flex items-center space-x-2 text-[9px] font-mono font-bold text-slate-400 bg-[#060c15] px-2.5 py-1 rounded-xl border border-[#16273a]">
              <span className="flex items-center space-x-0.5">
                <Clock size={9} />
                <span>{output.latencyMs}ms</span>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center space-x-0.5">
                <Database size={9} />
                <span>{output.tokens} t</span>
              </span>
            </div>
          )}
          <button
            onClick={onOpenCode}
            title="Export SDK Code"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#16273a] transition-all cursor-pointer"
          >
            <Code2 size={13} />
          </button>
        </div>
      </div>

      {/* Output Text Body */}
      <div className="flex-1 p-5 overflow-y-auto text-xs leading-relaxed text-slate-200 font-sans select-text scrollbar-thin">
        {output.loading ? (
          <div className="space-y-3.5 animate-pulse pt-1">
            <div className="h-3 bg-[#060c15] rounded-lg w-3/4"></div>
            <div className="h-3 bg-[#060c15] rounded-lg w-5/6"></div>
            <div className="h-3 bg-[#060c15] rounded-lg"></div>
            <div className="h-3 bg-[#060c15] rounded-lg w-2/3"></div>
          </div>
        ) : output.error ? (
          <div className="flex items-start space-x-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-rose-400 text-[11px]">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold uppercase tracking-wide text-[9px]">Model Execution Failed</p>
              <p className="mt-1 leading-normal text-rose-400/80 font-mono">{output.error}</p>
            </div>
          </div>
        ) : output.text ? (
          <p className="whitespace-pre-wrap">{output.text}</p>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 italic">
            <HelpCircle size={20} className="text-slate-600 mb-1.5" />
            <span className="text-[11px] font-medium font-sans">Idle. Sandbox prompt execution pending.</span>
          </div>
        )}
      </div>
    </div>
  );
}
