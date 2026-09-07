import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Layers, 
  Settings, 
  Cpu,
  Menu,
  X,
  Zap,
  RefreshCw,
  Key,
  Check,
  Film,
  Sparkles,
  ArrowRight,
  Play,
  BarChart3,
  Bot,
  Workflow,
  FileText,
  ChevronRight,
  Globe,
  Sliders,
  Send
} from "lucide-react";
import { ActiveTab, MetricsData } from "../types";

interface DashboardLayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  metrics: MetricsData;
  apiActive: boolean;
  nvidiaActive: boolean;
  onRefreshMetrics: () => void;
  isRefreshing: boolean;
  children: React.ReactNode;
}

export default function DashboardLayout({
  activeTab,
  setActiveTab,
  metrics,
  apiActive,
  nvidiaActive,
  onRefreshMetrics,
  isRefreshing,
  children
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localKey, setLocalKey] = useState(localStorage.getItem("nvidia_api_key") || "");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaSubmitted, setCtaSuccess] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Auto-seed default NVIDIA NIM key if empty
  useEffect(() => {
    const defaultKey = "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";
    if (!localStorage.getItem("nvidia_api_key")) {
      localStorage.setItem("nvidia_api_key", defaultKey);
      setLocalKey(defaultKey);
      setTimeout(() => {
        onRefreshMetrics();
      }, 300);
    }
  }, []);

  const handleSaveKey = async (keyVal: string) => {
    setIsSavingKey(true);
    setSaveSuccess(false);

    try {
      const trimmed = keyVal.trim();
      if (!trimmed) {
        localStorage.removeItem("nvidia_api_key");
        setLocalKey("");
        onRefreshMetrics();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        return;
      }

      const response = await fetch("/api/nvidia/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nvidiaApiKey: trimmed })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("nvidia_api_key", trimmed);
        setLocalKey(trimmed);
        setSaveSuccess(true);
        onRefreshMetrics();
        setTimeout(() => {
          setSaveSuccess(false);
          setShowKeyModal(false);
        }, 1500);
      } else {
        alert(data.error || "Failed to verify NVIDIA key connection.");
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to contact verification server."));
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ctaEmail.trim()) {
      setCtaSuccess(true);
      setTimeout(() => setCtaSuccess(false), 4000);
    }
  };

  const studioTabs = [
    { id: "overview" as ActiveTab, label: "Overview & Catalog", icon: LayoutDashboard },
    { id: "multimodal" as ActiveTab, label: "Multimodal & Code Hub", icon: Sparkles },
    { id: "video" as ActiveTab, label: "AI Video Studio", icon: Film },
    { id: "playground" as ActiveTab, label: "Model Playground", icon: Cpu },
    { id: "chat" as ActiveTab, label: "Chat Assistants", icon: MessageSquare },
    { id: "analytics" as ActiveTab, label: "Analytics & History", icon: Layers },
    { id: "settings" as ActiveTab, label: "Settings & Keys", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-[#F0F4FF] font-['Inter',sans-serif] selection:bg-[#6C63FF]/30 selection:text-white flex flex-col relative overflow-x-hidden">
      
      {/* ── TOP NAV ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 lg:px-16 py-4 bg-[#080C14]/90 backdrop-blur-xl border-b border-[#1E2D45] transition-all">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
          <div className="w-8 h-8 rounded-lg bg-[#6C63FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="3" fill="white"/>
              <path d="M8 2V4M8 12V14M2 8H4M12 8H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-['Space_Grotesk',sans-serif] text-xl font-bold tracking-tight text-white flex items-center">
            Axon<span className="text-[#00D4FF] ml-0.5">AI</span>
          </span>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex items-center space-x-6 text-sm font-medium text-[#8A97B0]">
          <li>
            <button 
              onClick={() => setActiveTab("overview")} 
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === "overview" ? "text-white font-semibold" : ""}`}
            >
              Overview
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab("video")} 
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === "video" ? "text-[#00D4FF] font-semibold" : ""}`}
            >
              AI Video Studio
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab("multimodal")} 
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === "multimodal" ? "text-[#6C63FF] font-semibold" : ""}`}
            >
              Multimodal Hub
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab("playground")} 
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === "playground" ? "text-white font-semibold" : ""}`}
            >
              Model Playground
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab("analytics")} 
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === "analytics" ? "text-white font-semibold" : ""}`}
            >
              Analytics
            </button>
          </li>
        </ul>

        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={() => setShowKeyModal(!showKeyModal)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-[#111827] border border-[#1E2D45] text-[#8A97B0] hover:text-white hover:border-[#253449] transition-all cursor-pointer"
          >
            <Key size={12} className={nvidiaActive ? "text-emerald-400" : "text-[#6C63FF]"} />
            <span>{nvidiaActive ? "NVIDIA NIM ACTIVE" : "CONFIGURE KEY"}</span>
          </button>

          <button 
            onClick={() => setActiveTab("video")}
            className="bg-[#6C63FF] hover:bg-[#5148E8] text-white px-5 py-2 rounded-full font-semibold text-sm transition-all shadow-lg shadow-[#6C63FF]/25 cursor-pointer transform hover:-translate-y-0.5"
          >
            Launch Platform
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#8A97B0] hover:text-white p-2 rounded-lg bg-[#111827] border border-[#1E2D45]"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[73px] z-40 bg-[#0D1220]/95 backdrop-blur-xl border-b border-[#1E2D45] p-6 space-y-4 md:hidden animate-fade-in">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6C63FF]">Workspace Navigation</p>
            {studioTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id 
                    ? "bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/20" 
                    : "bg-[#111827] text-[#8A97B0] hover:text-white border border-[#1E2D45]"
                }`}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#1E2D45] flex flex-col space-y-2">
            <button
              onClick={() => {
                setShowKeyModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-[#111827] border border-[#1E2D45] text-xs text-[#8A97B0] font-semibold"
            >
              <Key size={13} className="text-[#6C63FF]" />
              <span>Configure API Keys</span>
            </button>
          </div>
        </div>
      )}

      {/* Key Modal Floating Dialog */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-[#8A97B0] hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#6C63FF]/15 border border-[#6C63FF]/30 text-[#a89fff] text-[10px] font-bold uppercase tracking-wider">
                <Key size={11} />
                <span>NVIDIA NIM & API Gateway Credentials</span>
              </div>
              <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Configure API Key</h3>
              <p className="text-xs text-[#8A97B0] leading-relaxed">
                Connect your live NVIDIA NIM personal API token to unlock ultra-fast Llama 3.3 70B, DeepSeek R1, and Cosmos multimodal video generation endpoints.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A97B0] block">API Key Token</label>
              <input 
                type="password" 
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="nvapi-..."
                className="w-full bg-[#0D1220] border border-[#1E2D45] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleSaveKey(localKey)}
                disabled={isSavingKey}
                className="w-full bg-[#6C63FF] hover:bg-[#5148E8] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#6C63FF]/20"
              >
                {isSavingKey ? "Validating Credentials..." : saveSuccess ? "Key Verified & Connected!" : "Save & Verify Credentials"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WORKSPACE SELECTOR SUB-HEADER ────────────────────────────── */}
      <div className="mt-[73px] bg-[#0D1220] border-b border-[#1E2D45] px-4 sm:px-8 lg:px-16 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {studioTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/25 font-bold"
                    : "bg-[#111827] text-[#8A97B0] hover:text-white border border-[#1E2D45] hover:border-[#253449]"
                }`}
              >
                <tab.icon size={13} className={isSelected ? "text-white" : "text-[#8A97B0]"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Telemetry Status Bar */}
        <div className="flex items-center space-x-3 text-xs font-mono text-[#8A97B0] shrink-0">
          <button 
            onClick={onRefreshMetrics}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#111827] border border-[#1E2D45] hover:text-white cursor-pointer transition-all disabled:opacity-50"
            title="Sync telemetry and model status"
          >
            <RefreshCw size={11} className={isRefreshing ? "animate-spin text-[#00D4FF]" : "text-[#8A97B0]"} />
            <span>Sync Telemetry</span>
          </button>

          <span className="hidden sm:inline text-[#253449]">|</span>

          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${nvidiaActive ? "bg-emerald-400 animate-pulse" : "bg-[#00D4FF]"}`} />
            <span className="font-bold text-white uppercase text-[10px]">
              {nvidiaActive ? "NVIDIA NIM ONLINE" : apiActive ? "GATEWAY ONLINE" : "SIMULATOR ACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* ── LANDING EXPERIENCE (HERO, MARQUEE, FEATURES, SHOWCASE, PROCESS, TESTIMONIALS, CTA) ── */}
      {/* Shows on Overview tab to give the exact requested Axon AI homepage design */}
      {activeTab === "overview" && (
        <>
          {/* ── HERO ─────────────────────────────────────────────── */}
          <section className="relative pt-12 pb-16 px-4 sm:px-8 lg:px-16 flex flex-col justify-center overflow-hidden border-b border-[#1E2D45]">
            {/* Ambient Radial Mesh Glows */}
            <div className="absolute top-[-15%] right-[-5%] w-[720px] h-[720px] bg-[radial-gradient(circle,rgba(108,99,255,0.12)_0%,transparent_65%)] pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_65%)] pointer-events-none" />

            <div className="max-w-5xl mx-auto w-full space-y-6 text-left relative z-10">
              
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-[#6C63FF]/12 border border-[#6C63FF]/30 text-[#a89fff] text-xs font-semibold px-4 py-1.5 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
                <span>Now in public beta — 2,400 teams onboarded</span>
              </div>

              {/* Title */}
              <h1 className="font-['Space_Grotesk',sans-serif] text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] max-w-4xl">
                Your data.<br />
                Understood<br />
                by <span className="text-[#00D4FF]">AI.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[#8A97B0] text-base sm:text-lg max-w-xl leading-relaxed">
                Axon connects to every data source your team uses, surfaces real-time intelligence, and automates the decisions that used to take hours.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={() => setActiveTab("video")}
                  className="bg-[#6C63FF] hover:bg-[#5148E8] text-white px-8 py-3.5 rounded-full font-semibold text-base transition-all shadow-xl shadow-[#6C63FF]/30 cursor-pointer transform hover:-translate-y-0.5"
                >
                  Start free trial
                </button>
                <button 
                  onClick={() => setActiveTab("video")}
                  className="bg-transparent hover:border-[#8A97B0] text-white px-8 py-3.5 rounded-full border border-[#253449] font-medium text-base transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Play size={15} className="text-[#00D4FF] fill-[#00D4FF]" />
                  <span>Watch demo</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-[#1E2D45] mt-10">
                <div className="space-y-1">
                  <div className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-4xl font-bold text-white">
                    12M<span className="text-[#00D4FF]">+</span>
                  </div>
                  <div className="text-xs text-[#8A97B0]">Events processed daily</div>
                </div>
                <div className="space-y-1">
                  <div className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-4xl font-bold text-white">
                    99<span className="text-[#00D4FF]">.9%</span>
                  </div>
                  <div className="text-xs text-[#8A97B0]">Uptime SLA</div>
                </div>
                <div className="space-y-1">
                  <div className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-4xl font-bold text-white">
                    4.2<span className="text-[#00D4FF]">x</span>
                  </div>
                  <div className="text-xs text-[#8A97B0]">Faster decisions</div>
                </div>
                <div className="space-y-1">
                  <div className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-4xl font-bold text-white">
                    60<span className="text-[#00D4FF]">s</span>
                  </div>
                  <div className="text-xs text-[#8A97B0]">Avg. insight delivery</div>
                </div>
              </div>

            </div>
          </section>

          {/* ── MARQUEE ──────────────────────────────────────────── */}
          <div className="bg-[#6C63FF] py-3.5 overflow-hidden select-none">
            <div className="flex space-x-12 animate-marquee whitespace-nowrap">
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Real-time analytics</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">AI automation</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Predictive insights</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Model monitoring</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Custom dashboards</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Pipeline orchestration</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Anomaly detection</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Natural language queries</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Auto-reporting</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Role-based access</span>
              <span className="text-white/40">✦</span>
              {/* Duplicate repeat for seamless infinity loop */}
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Real-time analytics</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">AI automation</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Predictive insights</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Model monitoring</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Custom dashboards</span>
              <span className="text-white/40">✦</span>
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-white/90">Pipeline orchestration</span>
            </div>
          </div>

          {/* ── FEATURES ─────────────────────────────────────────── */}
          <section className="py-20 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto w-full">
            <div className="space-y-2 mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6C63FF]">What Axon does</span>
              <h2 className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Intelligence built into<br />every layer
              </h2>
              <p className="text-[#8A97B0] text-sm sm:text-base max-w-xl pt-1">
                From raw data ingestion to boardroom-ready reports — Axon handles the full lifecycle so your team focuses on decisions, not data wrangling.
              </p>
            </div>

            {/* Features 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.5px] bg-[#1E2D45] border border-[#1E2D45] rounded-2xl overflow-hidden shadow-2xl">
              
              <div className="bg-[#111827] p-8 space-y-4 hover:bg-[#141e30] transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/12 border border-[#6C63FF]/20 flex items-center justify-center text-xl">
                  📊
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Real-time dashboards</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Drag-and-drop dashboard builder with 80+ chart types. Live data refresh every second. Share with anyone — no login required.
                </p>
                <span className="inline-block text-[11px] font-bold text-[#6C63FF] tracking-wider uppercase">Sub-second refresh</span>
              </div>

              <div className="bg-[#111827] p-8 space-y-4 hover:bg-[#141e30] transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/12 border border-[#6C63FF]/20 flex items-center justify-center text-xl">
                  🤖
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">AI model monitoring</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Track accuracy, drift, latency, and cost across all your deployed models. Alerts fire before users notice degradation.
                </p>
                <span className="inline-block text-[11px] font-bold text-[#6C63FF] tracking-wider uppercase">Auto drift detection</span>
              </div>

              <div className="bg-[#111827] p-8 space-y-4 hover:bg-[#141e30] transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-xl">
                  ⚡
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Pipeline orchestration</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Visual pipeline builder for ETL, ML inference, and webhook triggers. Schedule, retry, and monitor every run from one view.
                </p>
                <span className="inline-block text-[11px] font-bold text-[#00D4FF] tracking-wider uppercase">No-code + pro-code</span>
              </div>

              <div className="bg-[#111827] p-8 space-y-4 hover:bg-[#141e30] transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-xl">
                  💬
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Natural language queries</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Ask your data anything in plain English. Axon translates to SQL, runs the query, and returns a chart with an explanation.
                </p>
                <span className="inline-block text-[11px] font-bold text-[#00D4FF] tracking-wider uppercase">Powered by LLM</span>
              </div>

              <div className="bg-[#111827] p-8 space-y-4 hover:bg-[#141e30] transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/12 border border-[#6C63FF]/20 flex items-center justify-center text-xl">
                  🔔
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Anomaly detection</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Statistical and ML-based anomaly detection on any metric. Get alerted via Slack, email, or webhook the moment something looks wrong.
                </p>
                <span className="inline-block text-[11px] font-bold text-[#6C63FF] tracking-wider uppercase">Configurable thresholds</span>
              </div>

              <div className="bg-[#111827] p-8 space-y-4 hover:bg-[#141e30] transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/12 border border-[#6C63FF]/20 flex items-center justify-center text-xl">
                  📄
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Automated reporting</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Schedule beautiful PDF and HTML reports. Personalized per recipient. Delivered to any inbox on any cadence you choose.
                </p>
                <span className="inline-block text-[11px] font-bold text-[#6C63FF] tracking-wider uppercase">White-label ready</span>
              </div>

            </div>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap gap-2 pt-8">
              {["PostgreSQL", "BigQuery", "Snowflake", "dbt", "Apache Kafka", "REST API", "GraphQL", "Python SDK", "Webhooks", "SSO / SAML"].map((tech) => (
                <span key={tech} className="bg-white/[0.04] border border-[#1E2D45] text-[#8A97B0] text-xs font-medium px-3 py-1 rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* ── SHOWCASE SECTION ───────────────────────────────────── */}
          <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#0D1220] border-t border-b border-[#1E2D45]">
            <div className="max-w-7xl mx-auto w-full space-y-10">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]">Built for every team</span>
                <h2 className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-5xl font-bold tracking-tight text-white">
                  See Axon in action
                </h2>
              </div>

              {/* Showcase Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Mock 1 - Analytics Overview */}
                <div 
                  onClick={() => setActiveTab("analytics")}
                  className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl overflow-hidden aspect-[16/10] relative group cursor-pointer shadow-xl"
                >
                  <div className="w-full h-full bg-[#0a0f1c] flex flex-col">
                    <div className="h-9 bg-[#0d1525] border-b border-[#1a2640] px-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded bg-[#6C63FF]" />
                        <div className="flex space-x-2">
                          <div className="w-8 h-1.5 rounded bg-white/20" />
                          <div className="w-6 h-1.5 rounded bg-white/10" />
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#6C63FF]" />
                    </div>
                    <div className="flex-1 grid grid-cols-[48px_1fr]">
                      <div className="bg-[#0d1525] border-r border-[#1a2640] p-2 flex flex-col items-center space-y-2">
                        <div className="w-6 h-6 rounded bg-[#6C63FF]/30" />
                        <div className="w-6 h-6 rounded bg-white/5" />
                        <div className="w-6 h-6 rounded bg-white/5" />
                      </div>
                      <div className="p-3 flex flex-col space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-[#111827] border border-[#1a2640] rounded p-2 space-y-1">
                            <div className="h-2.5 w-12 bg-[#6C63FF] rounded" />
                            <div className="h-1 w-8 bg-white/10 rounded" />
                          </div>
                          <div className="bg-[#111827] border border-[#1a2640] rounded p-2 space-y-1">
                            <div className="h-2.5 w-10 bg-[#00D4FF] rounded" />
                            <div className="h-1 w-8 bg-white/10 rounded" />
                          </div>
                          <div className="bg-[#111827] border border-[#1a2640] rounded p-2 space-y-1">
                            <div className="h-2.5 w-14 bg-[#a89fff] rounded" />
                            <div className="h-1 w-8 bg-white/10 rounded" />
                          </div>
                        </div>
                        <div className="flex-1 bg-[#111827] border border-[#1a2640] rounded p-3 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div className="h-2 w-20 bg-white/20 rounded" />
                            <div className="h-3 w-10 bg-[#00D4FF]/20 border border-[#00D4FF]/40 rounded-full" />
                          </div>
                          <div className="flex items-end gap-1.5 h-24 pt-2">
                            <div className="flex-1 bg-[#6C63FF] rounded-t" style={{ height: "55%" }} />
                            <div className="flex-1 bg-[#6C63FF] rounded-t" style={{ height: "38%" }} />
                            <div className="flex-1 bg-[#6C63FF] rounded-t" style={{ height: "72%" }} />
                            <div className="flex-1 bg-[#6C63FF] rounded-t" style={{ height: "45%" }} />
                            <div className="flex-1 bg-[#00D4FF] rounded-t" style={{ height: "90%" }} />
                            <div className="flex-1 bg-[#6C63FF] rounded-t" style={{ height: "60%" }} />
                            <div className="flex-1 bg-[#6C63FF] rounded-t" style={{ height: "48%" }} />
                            <div className="flex-1 bg-[#6C63FF] rounded-t" style={{ height: "65%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end backdrop-blur-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00D4FF]">Analytics · Real-time · Multi-source</span>
                    <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Executive Overview Dashboard</h3>
                  </div>
                </div>

                {/* Mock 2 - AI Model Monitor */}
                <div 
                  onClick={() => setActiveTab("playground")}
                  className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl overflow-hidden aspect-[16/10] relative group cursor-pointer shadow-xl"
                >
                  <div className="w-full h-full bg-[#06080f] flex flex-col p-3 space-y-3">
                    <div className="h-8 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-lg px-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#a89fff] font-['Space_Grotesk',sans-serif]">Model Monitor (Llama 3.3 70B & DeepSeek R1)</span>
                      <span className="h-3 w-12 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/40" />
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                            <div className="h-2 w-16 bg-white/30 rounded" />
                          </div>
                          <div className="h-2 w-8 bg-white/10 rounded" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#6C63FF] rounded-full" style={{ width: "88%" }} />
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00D4FF] rounded-full" style={{ width: "74%" }} />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#a89fff]" />
                            <div className="h-2 w-12 bg-white/30 rounded" />
                          </div>
                          <div className="h-2 w-8 bg-white/10 rounded" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#6C63FF] rounded-full" style={{ width: "61%" }} />
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#f87171] rounded-full" style={{ width: "45%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end backdrop-blur-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00D4FF]">AI Ops · Model health · Drift alerts</span>
                    <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">AI Model Monitor</h3>
                  </div>
                </div>

                {/* Mock 3 - Pipeline Builder */}
                <div 
                  onClick={() => setActiveTab("multimodal")}
                  className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl overflow-hidden aspect-[16/10] relative group cursor-pointer shadow-xl"
                >
                  <div className="w-full h-full bg-[#09080f] flex flex-col p-3 space-y-2">
                    <div className="h-8 bg-[#100f1e] border-b border-[#1e1c38] px-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#c4bfff] font-['Space_Grotesk',sans-serif]">Pipeline Orchestrator</span>
                      <div className="w-10 h-4 rounded-full bg-[#6C63FF]" />
                    </div>
                    <div className="space-y-1.5">
                      {["ETL Ingestion", "Video Frame Generation", "Subtitles Sync", "Webhook Trigger"].map((name, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                            <span className="font-mono text-[10px] text-white/80">{name}</span>
                          </div>
                          <span className="text-[9px] text-white/40 font-mono">0.{i+1}s</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end backdrop-blur-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00D4FF]">Automation · ETL · Orchestration</span>
                    <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Pipeline Orchestrator</h3>
                  </div>
                </div>

                {/* Mock 4 - Report Builder */}
                <div 
                  onClick={() => setActiveTab("settings")}
                  className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl overflow-hidden aspect-[16/10] relative group cursor-pointer shadow-xl"
                >
                  <div className="w-full h-full bg-[#080d18] flex flex-col p-3 space-y-2">
                    <div className="h-8 bg-[#0c1220] border-b border-[#192236] px-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#00D4FF] font-['Space_Grotesk',sans-serif]">Automated Report Builder</span>
                      <div className="w-12 h-4 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="bg-[#0f1a2e] border border-[#192236] rounded-lg p-2.5 space-y-2">
                        <div className="h-2 w-12 bg-white/20 rounded" />
                        <div className="h-5 w-20 bg-[#6C63FF]/40 rounded" />
                        <div className="h-4 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded mt-2" />
                      </div>
                      <div className="bg-[#0f1a2e] border border-[#192236] rounded-lg p-2.5 space-y-2">
                        <div className="h-2 w-12 bg-white/20 rounded" />
                        <div className="h-5 w-20 bg-[#00D4FF]/40 rounded" />
                        <div className="h-4 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded mt-2" />
                      </div>
                    </div>
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end backdrop-blur-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00D4FF]">Reports · PDF export · Scheduled delivery</span>
                    <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">Automated Report Builder</h3>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ── PROCESS SECTION ─────────────────────────────────────── */}
          <section className="py-20 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto w-full">
            <div className="space-y-2 mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6C63FF]">How it works</span>
              <h2 className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-5xl font-bold tracking-tight text-white">
                From data to decisions<br />in four steps
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl p-6 space-y-3 transition-colors">
                <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#6C63FF] tracking-wider">Step 01</span>
                <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-white">Connect your data</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  One-click integrations with 120+ sources — databases, SaaS tools, cloud warehouses, and APIs. No engineering help needed.
                </p>
              </div>

              <div className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl p-6 space-y-3 transition-colors">
                <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#6C63FF] tracking-wider">Step 02</span>
                <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-white">Define what matters</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Pick your KPIs, set thresholds, and configure AI models. Axon learns your business logic and adapts over time.
                </p>
              </div>

              <div className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl p-6 space-y-3 transition-colors">
                <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#6C63FF] tracking-wider">Step 03</span>
                <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-white">Surface intelligence</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Dashboards update in real time. Anomalies surface instantly. Natural language queries answer any ad-hoc question in seconds.
                </p>
              </div>

              <div className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] rounded-2xl p-6 space-y-3 transition-colors">
                <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#6C63FF] tracking-wider">Step 04</span>
                <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-white">Automate the routine</h3>
                <p className="text-xs text-[#8A97B0] leading-relaxed">
                  Let Axon trigger actions — Slack alerts, email reports, API calls, pipeline runs — so your team acts on insight, not noise.
                </p>
              </div>

            </div>
          </section>

          {/* ── INTEGRATIONS ────────────────────────────────────────── */}
          <section className="py-16 px-4 sm:px-8 lg:px-16 text-center border-t border-[#1E2D45]">
            <div className="max-w-4xl mx-auto space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6C63FF]">Integrations</span>
              <h2 className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Connects to your entire stack
              </h2>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {[
                  { name: "PostgreSQL", color: "#336791" },
                  { name: "BigQuery", color: "#4285F4" },
                  { name: "Snowflake", color: "#29B5E8" },
                  { name: "dbt", color: "#FF3A00" },
                  { name: "Slack", color: "#4A154B" },
                  { name: "Microsoft Teams", color: "#0078D4" },
                  { name: "Google Workspace", color: "#EA4335" },
                  { name: "Salesforce", color: "#F80000" },
                  { name: "Jira", color: "#172B4D" },
                  { name: "REST / GraphQL", color: "#6C63FF" }
                ].map((item) => (
                  <div key={item.name} className="bg-[#111827] border border-[#1E2D45] hover:border-[#253449] px-4 py-2 rounded-full text-xs font-medium text-[#8A97B0] hover:text-white flex items-center space-x-2 transition-all cursor-default">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ───────────────────────────────────────── */}
          <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#0D1220] border-t border-b border-[#1E2D45]">
            <div className="max-w-7xl mx-auto w-full space-y-12">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]">What teams say</span>
                <h2 className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-5xl font-bold tracking-tight text-white">
                  Trusted by data-driven teams
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 space-y-4">
                  <div className="text-[#6C63FF] text-sm">★★★★★</div>
                  <p className="text-xs text-[#b8c4d8] leading-relaxed">
                    "We replaced four separate tools with Axon. Our weekly reporting went from a half-day task to a 10-minute review. The AI query feature alone is worth the price."
                  </p>
                  <div className="flex items-center space-x-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-[#6C63FF] text-white flex items-center justify-center font-bold text-xs font-['Space_Grotesk',sans-serif]">
                      RP
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Rachel Park</div>
                      <div className="text-[11px] text-[#8A97B0]">Head of Data, Vaultly</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 space-y-4">
                  <div className="text-[#6C63FF] text-sm">★★★★★</div>
                  <p className="text-xs text-[#b8c4d8] leading-relaxed">
                    "Model drift was costing us conversions and we didn't even know. Axon flagged the degradation 48 hours before it showed up in our revenue numbers. Game changer."
                  </p>
                  <div className="flex items-center space-x-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-[#00D4FF] text-black flex items-center justify-center font-bold text-xs font-['Space_Grotesk',sans-serif]">
                      TK
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Tom Kwan</div>
                      <div className="text-[11px] text-[#8A97B0]">VP of Engineering, Lumio</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 space-y-4">
                  <div className="text-[#6C63FF] text-sm">★★★★★</div>
                  <p className="text-xs text-[#b8c4d8] leading-relaxed">
                    "I ask Axon questions like 'which campaigns drove the most qualified leads last quarter?' and it just… answers, with a chart. My analysts use it every single morning."
                  </p>
                  <div className="flex items-center space-x-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-[#a89fff] text-[#1a1240] flex items-center justify-center font-bold text-xs font-['Space_Grotesk',sans-serif]">
                      MB
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Maya Brennan</div>
                      <div className="text-[11px] text-[#8A97B0]">Chief Marketing Officer, Clearfield</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ── CTA SECTION ────────────────────────────────────────── */}
          <section className="py-24 px-4 sm:px-8 lg:px-16 text-center relative overflow-hidden">
            {/* Ambient Radial Mesh Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(108,99,255,0.12)_0%,transparent_65%)] pointer-events-none" />

            <div className="max-w-xl mx-auto space-y-6 relative z-10">
              <h2 className="font-['Space_Grotesk',sans-serif] text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Start understanding<br />your data today.
              </h2>
              <p className="text-[#8A97B0] text-sm sm:text-base leading-relaxed">
                Free 14-day trial. No credit card. Set up in under 5 minutes with your first data source.
              </p>

              <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
                <input 
                  type="email" 
                  required
                  value={ctaEmail}
                  onChange={(e) => setCtaEmail(e.target.value)}
                  placeholder="your@company.com"
                  className="flex-1 bg-[#111827] border border-[#1E2D45] rounded-full px-5 py-3 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                />
                <button 
                  type="submit"
                  className="bg-[#6C63FF] hover:bg-[#5148E8] text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-lg shadow-[#6C63FF]/25 whitespace-nowrap cursor-pointer"
                >
                  Get started free
                </button>
              </form>

              {ctaSubmitted && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium animate-fade-in">
                  ✓ Welcome aboard! Check your inbox for instant onboarding credentials.
                </div>
              )}

              <p className="text-[11px] text-[#8A97B0]">
                Join 2,400+ teams already on Axon. SOC 2 Type II certified.
              </p>
            </div>
          </section>
        </>
      )}

      {/* ── ACTIVE WORKSPACE MODULE CONTAINER ────────────────────────── */}
      <main className="flex-1 px-4 sm:px-8 lg:px-16 py-6 bg-[#080C14]">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {children}
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#1E2D45] bg-[#080C14] px-4 sm:px-8 lg:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-[#6C63FF] flex items-center justify-center">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="3" fill="white"/>
            </svg>
          </div>
          <span className="font-['Space_Grotesk',sans-serif] font-bold text-white text-base">
            Axon<span className="text-[#00D4FF]">AI</span>
          </span>
        </div>

        <ul className="flex items-center space-x-6 text-[#8A97B0]">
          <li><button onClick={() => setActiveTab("overview")} className="hover:text-white transition-colors cursor-pointer">Overview</button></li>
          <li><button onClick={() => setActiveTab("video")} className="hover:text-white transition-colors cursor-pointer">Video Studio</button></li>
          <li><button onClick={() => setActiveTab("multimodal")} className="hover:text-white transition-colors cursor-pointer">Multimodal</button></li>
          <li><button onClick={() => setActiveTab("playground")} className="hover:text-white transition-colors cursor-pointer">Playground</button></li>
          <li><button onClick={() => setActiveTab("analytics")} className="hover:text-white transition-colors cursor-pointer">Analytics</button></li>
        </ul>

        <div className="text-[#8A97B0]">
          © 2026 Axon AI, Inc. All rights reserved.
        </div>
      </footer>

    </div>
  );
}

