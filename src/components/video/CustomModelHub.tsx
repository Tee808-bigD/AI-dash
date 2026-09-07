import React, { useState } from "react";
import { Cpu, Globe, CheckCircle2, AlertCircle, RefreshCw, Terminal, ExternalLink, ShieldCheck, Box, Sparkles, Sliders, Layers } from "lucide-react";
import { CustomModelConfig } from "./types";

const DEFAULT_MODELS: CustomModelConfig[] = [
  {
    id: "f5_tts_node",
    name: "F5-TTS Zero-Shot Diffusion Voice",
    modelType: "voice",
    framework: "F5-TTS",
    endpointUrl: "http://localhost:8000/v1/audio/speech",
    status: "active",
    latencyMs: 38,
    enabled: true
  },
  {
    id: "live_portrait_node",
    name: "LivePortrait Talking Head Face-Sync",
    modelType: "video_avatar",
    framework: "LivePortrait",
    endpointUrl: "http://localhost:8001/v1/video/animate-portrait",
    status: "idle",
    latencyMs: 120,
    enabled: false
  },
  {
    id: "ue5_embody_node",
    name: "Embody Unreal Engine 5 Metahuman Bridge",
    modelType: "ue_embody",
    framework: "Unreal Engine 5 Embody",
    endpointUrl: "ws://localhost:8888/livelink/metahuman",
    status: "active",
    latencyMs: 14,
    enabled: true
  },
  {
    id: "transformer_llm_node",
    name: "Transformer LLM Director (LoRA Fine-Tuned)",
    modelType: "transformer_llm",
    framework: "Llama-LoRA",
    endpointUrl: "http://localhost:8002/v1/chat/completions",
    status: "active",
    latencyMs: 45,
    enabled: true
  }
];

export default function CustomModelHub() {
  const [models, setModels] = useState<CustomModelConfig[]>(DEFAULT_MODELS);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "voice" | "video_avatar" | "ue_embody" | "transformer_llm">("all");
  
  // New model creation form modal/state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelType, setNewModelType] = useState<CustomModelConfig["modelType"]>("voice");
  const [newFramework, setNewFramework] = useState<CustomModelConfig["framework"]>("F5-TTS");
  const [newEndpointUrl, setNewEndpointUrl] = useState("http://localhost:8000/v1");

  // Transformer Attention & LoRA config state (from Someshdiwan/How-Transformer-LLMs-Work)
  const [attentionHeads, setAttentionHeads] = useState(32);
  const [loraRank, setLoraRank] = useState(16);
  const [loraAlpha, setLoraAlpha] = useState(32);
  const [customSystemAnchor, setCustomSystemAnchor] = useState(
    "You are the Artlist AI Studio Lead Director. Generate high-retention 60-second video storyboards with micro1 style tech highlights and viral hooks."
  );

  const testEndpoint = async (model: CustomModelConfig) => {
    setTestingModelId(model.id);
    setTestLog(prev => [`[${new Date().toLocaleTimeString()}] Pinging ${model.name} at ${model.endpointUrl}...`, ...prev]);

    try {
      const res = await fetch("/api/models/test-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointUrl: model.endpointUrl,
          modelType: model.modelType
        })
      });

      const data = await res.json();
      if (data.reachable) {
        setModels(prev =>
          prev.map(m =>
            m.id === model.id
              ? { ...m, status: "active", latencyMs: data.latencyMs, lastTested: new Date().toLocaleTimeString() }
              : m
          )
        );
        setTestLog(prev => [
          `[${new Date().toLocaleTimeString()}] ✅ ${model.name} responded! Latency: ${data.latencyMs}ms (${data.protocol})`,
          `  -> ${data.message}`,
          ...prev
        ]);
      } else {
        setModels(prev =>
          prev.map(m => (m.id === model.id ? { ...m, status: "error" } : m))
        );
        setTestLog(prev => [
          `[${new Date().toLocaleTimeString()}] ❌ ${model.name} failed: ${data.error || "Connection timed out"}`,
          ...prev
        ]);
      }
    } catch (err: any) {
      setModels(prev =>
        prev.map(m => (m.id === model.id ? { ...m, status: "error" } : m))
      );
      setTestLog(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Error contacting endpoint: ${err.message}`,
        ...prev
      ]);
    } finally {
      setTestingModelId(null);
    }
  };

  const toggleModel = (id: string) => {
    setModels(prev =>
      prev.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName || !newEndpointUrl) return;

    const newEntry: CustomModelConfig = {
      id: `custom_${Date.now()}`,
      name: newModelName,
      modelType: newModelType,
      framework: newFramework,
      endpointUrl: newEndpointUrl,
      status: "idle",
      enabled: true
    };

    setModels(prev => [newEntry, ...prev]);
    setShowAddModal(false);
    setNewModelName("");
    testEndpoint(newEntry);
  };

  const filteredModels = models.filter(m =>
    selectedCategory === "all" ? true : m.modelType === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0b0c12]/95 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-black uppercase bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-2.5 py-0.5 rounded font-mono">
                Model Orchestrator
              </span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">
                Custom Neural Weights & Unreal Engine Embody
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Embed Your Own Video & Voice Models <Cpu size={16} className="text-indigo-400" />
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Connect locally fine-tuned models, open-source weights (F5-TTS, LivePortrait, Wan2.1), or the Unreal Engine 5 Embody source into Artlist AI Studio’s render pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 cursor-pointer font-mono"
            >
              <span>+ Register Custom Model</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2 pt-4">
          {[
            { id: "all", label: "All Active Clusters" },
            { id: "voice", label: "Voice / TTS (F5 / XTTS)" },
            { id: "video_avatar", label: "Talking Face / LivePortrait" },
            { id: "ue_embody", label: "Unreal Engine Embody 3D" },
            { id: "transformer_llm", label: "Transformer LLMs & LoRA" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-[#07080d] text-slate-400 hover:text-white border border-indigo-500/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {filteredModels.map(model => {
            const isTesting = testingModelId === model.id;

            return (
              <div
                key={model.id}
                className="bg-[#07080d] border border-indigo-500/15 hover:border-indigo-500/30 rounded-xl p-4 space-y-3 transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-black text-white">{model.name}</h4>
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                        {model.framework}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                      {model.endpointUrl}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleModel(model.id)}
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                        model.enabled ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          model.enabled ? "translate-x-3" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-indigo-500/10 text-[10px] font-mono">
                  <div className="flex items-center space-x-1.5">
                    {model.status === "active" && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-400 font-bold">Online ({model.latencyMs}ms)</span>
                      </>
                    )}
                    {model.status === "idle" && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-slate-400">Standby</span>
                      </>
                    )}
                    {model.status === "error" && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-rose-400">Unreachable</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => testEndpoint(model)}
                    disabled={isTesting}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-bold cursor-pointer"
                  >
                    <RefreshCw size={11} className={isTesting ? "animate-spin" : ""} />
                    <span>{isTesting ? "Testing..." : "Test Latency"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transformer Fine-Tuning & Attention Architecture Tuner */}
        <div className="mt-6 bg-[#07080d] border border-indigo-500/15 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
            <div className="flex items-center space-x-2">
              <Layers size={16} className="text-purple-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Transformer LLM Attention & LoRA Hyperparameter Tuner
              </h3>
            </div>
            <span className="text-[9px] text-purple-400 font-mono font-bold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
              Someshdiwan / How-Transformer-LLMs-Work Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">
                Attention Heads: <span className="text-white font-mono">{attentionHeads}</span>
              </label>
              <input
                type="range"
                min={8}
                max={64}
                step={8}
                value={attentionHeads}
                onChange={(e) => setAttentionHeads(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[9px] text-slate-500">Multi-Head self-attention matrix width.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">
                LoRA Rank (r): <span className="text-white font-mono">{loraRank}</span>
              </label>
              <input
                type="range"
                min={4}
                max={64}
                step={4}
                value={loraRank}
                onChange={(e) => setLoraRank(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[9px] text-slate-500">Low-Rank Adaptation matrix dimension.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">
                LoRA Alpha (Scaling): <span className="text-white font-mono">{loraAlpha}</span>
              </label>
              <input
                type="range"
                min={8}
                max={128}
                step={8}
                value={loraAlpha}
                onChange={(e) => setLoraAlpha(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <p className="text-[9px] text-slate-500">Weight multiplier for adaptation layers.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              Custom Director System Prompt Anchor
            </label>
            <textarea
              value={customSystemAnchor}
              onChange={(e) => setCustomSystemAnchor(e.target.value)}
              rows={2}
              className="w-full bg-black/50 border border-indigo-500/20 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50 leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Live Terminal Inference Log */}
        <div className="mt-4 bg-black/60 border border-indigo-500/10 rounded-xl p-3 space-y-2">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 border-b border-white/5 pb-1">
            <Terminal size={11} className="text-indigo-400" />
            <span>Neural Gateway Dispatch Console</span>
          </div>
          <div className="font-mono text-[10px] text-slate-300 space-y-1 max-h-28 overflow-y-auto pr-1">
            {testLog.length === 0 ? (
              <span className="text-slate-600 italic">No endpoint ping events yet. Click "Test Latency" above to test model responsiveness.</span>
            ) : (
              testLog.map((log, idx) => <div key={idx}>{log}</div>)
            )}
          </div>
        </div>

        {/* Registration Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f111a] border border-indigo-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Custom Neural Endpoint</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddModel} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Model Name</label>
                  <input
                    type="text"
                    required
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="e.g. My Fine-Tuned Voice Clone Node"
                    className="w-full bg-[#07080d] border border-indigo-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Model Category</label>
                  <select
                    value={newModelType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setNewModelType(t);
                      if (t === "voice") setNewFramework("F5-TTS");
                      else if (t === "video_avatar") setNewFramework("LivePortrait");
                      else if (t === "ue_embody") setNewFramework("Unreal Engine 5 Embody");
                      else setNewFramework("Llama-LoRA");
                    }}
                    className="w-full bg-[#07080d] border border-indigo-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="voice">Voice / Speech Generation (F5-TTS, XTTS-v2)</option>
                    <option value="video_avatar">Talking Head Lip-Sync (LivePortrait, SadTalker)</option>
                    <option value="ue_embody">3D Metahuman LiveLink (Unreal Engine 5 Embody)</option>
                    <option value="transformer_llm">Custom Transformer LLM (LoRA / vLLM)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Endpoint URL / WebSocket Port</label>
                  <input
                    type="text"
                    required
                    value={newEndpointUrl}
                    onChange={(e) => setNewEndpointUrl(e.target.value)}
                    placeholder="e.g. http://localhost:8000/v1 or ws://localhost:8888"
                    className="w-full bg-[#07080d] border border-indigo-500/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Save & Test
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
