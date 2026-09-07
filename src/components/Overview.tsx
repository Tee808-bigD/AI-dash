import React, { useState, useMemo } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Cpu, 
  MessageSquare, 
  ArrowRight, 
  Clock, 
  Database,
  Calendar,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { ActiveTab, MetricsData } from "../types";
import { MODELS_CATALOG, ModelInfo } from "../models-data";

interface OverviewProps {
  metrics: MetricsData;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedPlaygroundModel?: (modelId: string) => void; // Optional hook to pre-select in playground
  setSelectedChatModel?: (modelId: string) => void;       // Optional hook to pre-select in chat
}

export default function Overview({ 
  metrics, 
  setActiveTab,
  setSelectedPlaygroundModel,
  setSelectedChatModel
}: OverviewProps) {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  
  // Endpoint configuration filters
  const [filterFree, setFilterFree] = useState(false);
  const [filterDownloadable, setFilterDownloadable] = useState(false);

  // Selected model for detailed side drawer or focus state
  const [focusedModel, setFocusedModel] = useState<ModelInfo | null>(MODELS_CATALOG[0]);

  // Derived filter categories for the sidebar
  const allUseCases = useMemo(() => {
    const cases = new Set<string>();
    MODELS_CATALOG.forEach(m => {
      if (m.useCase) cases.add(m.useCase);
    });
    return Array.from(cases);
  }, []);

  const allProviders = useMemo(() => {
    const providers = new Set<string>();
    MODELS_CATALOG.forEach(m => {
      if (m.provider) providers.add(m.provider);
    });
    return Array.from(providers).sort();
  }, []);

  // Filter & sort logic
  const filteredModels = useMemo(() => {
    let result = [...MODELS_CATALOG];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.provider.toLowerCase().includes(q) || 
        m.desc.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Endpoint type filters
    if (filterFree) {
      result = result.filter(m => m.freeEndpoint);
    }
    if (filterDownloadable) {
      result = result.filter(m => m.downloadable);
    }

    // Use cases filter
    if (selectedUseCases.length > 0) {
      result = result.filter(m => selectedUseCases.includes(m.useCase));
    }

    // Providers filter
    if (selectedProviders.length > 0) {
      result = result.filter(m => selectedProviders.includes(m.provider));
    }

    // Sorting
    if (sortBy === "Name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Most Recent") {
      // Keep order as specified (which is naturally most recent from "Today", "1d", "9d"...)
      // But we can double-check based on index.
    }

    return result;
  }, [searchQuery, sortBy, selectedUseCases, selectedProviders, filterFree, filterDownloadable]);

  const handleToggleUseCase = (useCase: string) => {
    setSelectedUseCases(prev => 
      prev.includes(useCase) ? prev.filter(c => c !== useCase) : [...prev, useCase]
    );
  };

  const handleToggleProvider = (provider: string) => {
    setSelectedProviders(prev => 
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedUseCases([]);
    setSelectedProviders([]);
    setFilterFree(false);
    setFilterDownloadable(false);
  };

  const handleLaunchPlayground = (modelId: string) => {
    if (setSelectedPlaygroundModel) {
      setSelectedPlaygroundModel(modelId);
    }
    setActiveTab("playground");
  };

  const handleLaunchChat = (modelId: string) => {
    if (setSelectedChatModel) {
      setSelectedChatModel(modelId);
    }
    setActiveTab("chat");
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  const recentHistory = metrics.history.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#111c44]/80 border border-[#1e2a5d]/70 backdrop-blur-md px-6 py-5.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-[#0b1437]/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4318FF]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 bg-[#868CFF] rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#868CFF]">Open Foundation Hub (NVIDIA NIM Catalog)</span>
            <span className="text-[#1e2a5d] hidden sm:inline">•</span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">ACTIVE MODELS: {MODELS_CATALOG.length}</span>
          </div>
          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            AI-Dash Pro has migrated to multi-provider foundation models. Securely browse, filter, and evaluate 100+ state-of-the-art models including DeepSeek V4, Kimi-K3, Qwen, and NVIDIA NIM optimized pipelines.
          </p>
        </div>
        <div className="flex space-x-3.5 flex-shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab("playground")}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black bg-gradient-to-r from-[#868CFF] to-[#4318FF] hover:opacity-90 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-[#4318FF]/20 cursor-pointer"
          >
            <span>Playground</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* Main Catalog View Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar (1 Column) */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-[#111c44]/75 border border-[#1e2a5d]/75 backdrop-blur-md rounded-2xl p-4.5 space-y-5 shadow-xl shadow-[#0b1437]/20">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a5d]/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#868CFF] flex items-center gap-1.5">
                <Filter size={12} className="text-[#868CFF]" />
                Filters
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-[9px] uppercase tracking-widest text-[#868CFF] hover:text-white font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={10} />
                Reset
              </button>
            </div>

            {/* Checkboxes: Endpoint Config */}
            <div className="space-y-2.5">
              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Endpoint Type</span>
              
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                <input 
                  type="checkbox" 
                  checked={filterFree}
                  onChange={(e) => setFilterFree(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-lg border-[#1e2a5d] bg-[#0b1437] text-[#4318FF] focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs">Free Endpoint</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                <input 
                  type="checkbox" 
                  checked={filterDownloadable}
                  onChange={(e) => setFilterDownloadable(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-lg border-[#1e2a5d] bg-[#0b1437] text-[#4318FF] focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs">Download Available</span>
              </label>
            </div>

            {/* Checkboxes: Use Cases */}
            <div className="space-y-2.5">
              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Use Case</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {allUseCases.map(uc => {
                  const isChecked = selectedUseCases.includes(uc);
                  return (
                    <label key={uc} className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleToggleUseCase(uc)}
                        className="w-3.5 h-3.5 rounded-lg border-[#1e2a5d] bg-[#0b1437] text-[#4318FF] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="truncate text-xs">{uc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Checkboxes: Providers */}
            <div className="space-y-2.5">
              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Inference Provider</span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {allProviders.map(p => {
                  const isChecked = selectedProviders.includes(p);
                  return (
                    <label key={p} className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleToggleProvider(p)}
                        className="w-3.5 h-3.5 rounded-lg border-[#1e2a5d] bg-[#0b1437] text-[#4318FF] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="truncate text-xs">{p}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mini Operational Latency Profile block */}
          <div className="bg-[#111c44]/75 p-4.5 border border-[#1e2a5d]/75 rounded-2xl shadow-xl shadow-[#0b1437]/20 space-y-3">
            <span className="block text-[9px] font-black uppercase tracking-widest text-[#868CFF]">Response Profile (Live)</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-mono text-slate-400">
                <span>MoE 2.8T models</span>
                <span className="text-[#868CFF] font-black">~420ms</span>
              </div>
              <div className="flex justify-between font-mono text-slate-400">
                <span>Medium Dense</span>
                <span className="text-emerald-400 font-black">~240ms</span>
              </div>
              <div className="flex justify-between font-mono text-slate-400">
                <span>Ultra Edge/Flash</span>
                <span className="text-amber-400 font-black">~110ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Browser and Detail focus (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Search & Filter Bar */}
          <div className="bg-[#111c44]/75 border border-[#1e2a5d]/75 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-[#0b1437]/25">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Refine models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b1437]/80 border border-[#1e2a5d]/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4318FF] font-sans"
              />
            </div>

            {/* Sort & Stats Counter */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#868CFF] bg-[#0b1437]/80 border border-[#1e2a5d]/80 px-3 py-1.5 rounded-xl">
                {filteredModels.length} models matched
              </span>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Sort By</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#0b1437]/85 border border-[#1e2a5d]/85 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#4318FF] font-medium cursor-pointer"
                >
                  <option value="Most Recent" className="bg-[#0b1437]">Most Recent</option>
                  <option value="Name" className="bg-[#0b1437]">Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nested Grid: Model List & Focused Detail Drawer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main scrollable model catalog - 2 columns */}
            <div className="md:col-span-2 space-y-3.5 max-h-[580px] overflow-y-auto pr-2">
              {filteredModels.length === 0 ? (
                <div className="h-44 bg-[#111c44]/40 border border-dashed border-[#1e2a5d]/60 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                  <Calendar className="text-[#868CFF] mb-2" size={24} />
                  <p className="text-xs font-semibold text-slate-300">No models match your filter criteria</p>
                  <button 
                    onClick={handleResetFilters}
                    className="text-xs text-[#868CFF] mt-2 hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredModels.map((model) => {
                  const isFocused = focusedModel?.id === model.id;
                  return (
                    <div 
                      key={model.id}
                      onClick={() => setFocusedModel(model)}
                      className={`p-4.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isFocused 
                          ? "bg-[#1b254b]/95 border-[#4318FF] shadow-lg shadow-[#4318FF]/10 translate-y-[-1px]" 
                          : "bg-[#111c44]/75 border-[#1e2a5d]/50 hover:border-[#1e2a5d] hover:bg-[#111c44]/90"
                      }`}
                    >
                      {/* Header row: Brand and endpoint badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black text-[#868CFF] uppercase tracking-wider">
                          {model.provider}
                        </span>
                        
                        <div className="flex items-center space-x-1.5">
                          {model.downloadable && (
                            <span className="text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              NIM Hub
                            </span>
                          )}
                          {model.freeEndpoint && (
                            <span className="text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Free End
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-black text-white mt-2 tracking-tight font-mono">
                        {model.name}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-2">
                        {model.desc}
                      </p>

                      {/* Footer tags and release time */}
                      <div className="mt-4 pt-3.5 border-t border-[#1e2a5d]/40 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-[#0b1437] border border-[#1e2a5d]/50 px-2 py-0.5 rounded-full text-[#868CFF] font-mono font-bold">
                            {model.tags[0]}
                          </span>
                          {model.tags.length > 1 && (
                            <span className="text-[9px] text-slate-500 font-black">
                              +{model.tags.length - 1}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 text-slate-500 font-mono text-[9px] font-bold">
                          <Clock size={10} />
                          <span>{model.launchTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Focused Model Sandbox Actions (1 Column) */}
            <div className="md:col-span-1">
              {focusedModel ? (
                <div className="bg-[#111c44]/80 border border-[#4318FF]/40 p-5 rounded-2xl shadow-xl sticky top-0 space-y-5">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-black text-[#868CFF] bg-[#4318FF]/15 px-2.5 py-1 rounded-full border border-[#4318FF]/20">
                      Active Model focus
                    </span>
                    <h3 className="text-base font-black text-white mt-3.5 font-mono leading-tight">
                      {focusedModel.name}
                    </h3>
                    <p className="text-[9px] font-mono text-slate-500 font-bold mt-1">
                      PROVIDER: {focusedModel.provider.toUpperCase()}
                    </p>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-[#0b1437]/90 p-3.5 rounded-xl border border-[#1e2a5d]/70 shadow-inner">
                    {focusedModel.desc}
                  </p>

                  {/* Dynamic technical metrics for the focused model */}
                  <div className="space-y-2.5 text-xs">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-[#868CFF]">Specs & Sizing</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0b1437]/60 p-2.5 rounded-xl border border-[#1e2a5d]/50">
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Use Case</p>
                        <p className="text-[11px] font-bold text-slate-200 mt-1 truncate">{focusedModel.useCase}</p>
                      </div>
                      <div className="bg-[#0b1437]/60 p-2.5 rounded-xl border border-[#1e2a5d]/50">
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Licensing</p>
                        <p className="text-[11px] font-bold text-slate-200 mt-1 truncate">{focusedModel.downloadable ? "NIM Download" : "Cloud Hosted"}</p>
                      </div>
                      <div className="bg-[#0b1437]/60 p-2.5 rounded-xl border border-[#1e2a5d]/50 col-span-2 flex justify-between items-center">
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Downloads / Pulls</p>
                          <p className="text-xs font-black text-slate-200 mt-0.5">{focusedModel.downloads || "Active"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Pricing</p>
                          <p className="text-xs font-black text-emerald-400 mt-0.5">{focusedModel.freeEndpoint ? "Free Hub" : "Dev Tier"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Interactive Actions */}
                  <div className="space-y-2.5 pt-4.5 border-t border-[#1e2a5d]/50">
                    <button 
                      onClick={() => handleLaunchPlayground(focusedModel.id)}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-[#868CFF] to-[#4318FF] hover:opacity-90 text-white text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-[#4318FF]/20"
                    >
                      <span>Sandbox Eval</span>
                      <ArrowRight size={12} />
                    </button>

                    <button 
                      onClick={() => handleLaunchChat(focusedModel.id)}
                      className="w-full flex items-center justify-between bg-[#0b1437]/90 hover:bg-[#111c44] border border-[#1e2a5d]/80 text-slate-200 text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer"
                    >
                      <span>Chat Direct</span>
                      <MessageSquare size={13} className="text-[#868CFF]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-[#111c44]/75 border border-[#1e2a5d]/75 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-500 shadow-xl">
                  <Cpu size={28} className="mb-2.5 text-[#868CFF] animate-pulse" />
                  <p className="text-xs text-slate-400 font-medium">Select a foundation model card to launch a sandbox session or view specifications.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Secondary Latency Metrics and Telemetry History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-900">
        {/* API Latency Distribution */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 lg:col-span-2 flex flex-col shadow-md">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Gateway Latency Profile</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time latency distribution across simulated and proxy endpoints</p>
            </div>
            <span className="text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded-full text-indigo-400 font-mono">
              Online telemetry Active
            </span>
          </div>

          <div className="flex-1 min-h-[160px] bg-slate-950/40 rounded-lg border border-slate-800/60 p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 top-12 flex justify-between px-2">
              <div className="w-px h-full bg-slate-900/40" />
              <div className="w-px h-full bg-slate-900/40" />
              <div className="w-px h-full bg-slate-900/40" />
              <div className="w-px h-full bg-slate-900/40" />
            </div>

            <div className="h-24 w-full flex items-end">
              <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                <path d="M 0 100 L 0 80 Q 100 20 200 85 T 400 40 L 500 70 L 500 100 Z" fill="url(#latencyGrad)" />
                <path d="M 0 80 Q 100 20 200 85 T 400 40 L 500 70" fill="none" stroke="#6366f1" strokeWidth="2" />
                <circle cx="200" cy="85" r="4" fill="#090d16" stroke="#6366f1" strokeWidth="2" />
                <circle cx="400" cy="40" r="4" fill="#090d16" stroke="#6366f1" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-900/40">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                <span>MoE Average: ~450ms</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span>Medium Avg: ~220ms</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span>Flash Avg: ~130ms</span>
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Log */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Telemetry History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most recent operations metrics</p>
            </div>
            <button 
              onClick={() => setActiveTab("analytics")}
              className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[170px] pr-1">
            {recentHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950/20 rounded-lg border border-dashed border-slate-800">
                <Calendar size={18} className="text-slate-600 mb-1" />
                <p className="text-[11px] text-slate-400 font-medium">No operational telemetry logged yet</p>
              </div>
            ) : (
              recentHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                      item.type === "comparison" 
                        ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400" 
                        : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    }`}>
                      {item.type === "comparison" ? <Cpu size={12} /> : <MessageSquare size={12} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                        {item.prompt}
                      </p>
                      <span className="text-[9px] font-mono text-slate-500">
                        {formatDate(item.timestamp)} • <span className="font-bold text-indigo-400">{item.model || "MoE Sandbox"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end flex-shrink-0 ml-2">
                    <span className="text-xs font-bold font-mono text-slate-300">
                      {item.type === "chat" 
                        ? `${item.latencyMs}ms` 
                        : `${item.results?.[0]?.latencyMs || 240}ms`}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {item.type === "chat" 
                        ? `${item.tokens} t` 
                        : `${item.results?.reduce((sum, r) => sum + r.tokens, 0) || 50} t`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
