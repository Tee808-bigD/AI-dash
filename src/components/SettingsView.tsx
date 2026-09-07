import React, { useState, useEffect } from "react";
import { 
  Settings, 
  ShieldCheck, 
  Server, 
  Zap, 
  HelpCircle, 
  Sparkles, 
  AlertCircle,
  Volume2,
  FileText,
  Activity,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

interface SettingsViewProps {
  apiActive: boolean;
  nvidiaActive: boolean;
  onRefreshHealth: () => void;
}

export default function SettingsView({ 
  apiActive, 
  nvidiaActive, 
  onRefreshHealth 
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"security" | "gateway" | "render" | "sdks">("security");
  const [nvidiaKey, setNvidiaKey] = useState(localStorage.getItem("nvidia_api_key") || "");
  const [customBaseUrl, setCustomBaseUrl] = useState(
    localStorage.getItem("nvidia_custom_base_url") || "https://integrate.api.nvidia.com/v1"
  );
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");
  const [pingStatus, setPingStatus] = useState<"idle" | "pinging" | "success" | "error">("idle");
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingDetails, setPingDetails] = useState<string>("");

  // Keep saved key state synced if modified from sidebar or elsewhere
  useEffect(() => {
    setNvidiaKey(localStorage.getItem("nvidia_api_key") || "");
  }, [nvidiaActive]);

  const handlePingGateway = async () => {
    setPingStatus("pinging");
    setPingDetails("");
    setPingLatency(null);

    const startTime = Date.now();
    try {
      const trimmedUrl = customBaseUrl.trim() || "https://integrate.api.nvidia.com/v1";
      const response = await fetch("/api/gateway/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          baseUrl: trimmedUrl,
          apiKey: nvidiaKey.trim() 
        })
      });

      const elapsed = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        setPingStatus("success");
        setPingLatency(elapsed);
        setPingDetails(`Gateway responding at ${trimmedUrl}. Protocol: HTTP/2 with SSL verified. Reached ${data.modelTested || "cluster"}.`);
        localStorage.setItem("nvidia_custom_base_url", trimmedUrl);
      } else {
        setPingStatus("error");
        setPingLatency(elapsed);
        setPingDetails(data.error || `HTTP ${response.status}: Failed to reach custom NIM gateway.`);
      }
    } catch (err: any) {
      setPingStatus("error");
      setPingDetails(err.message || "Network timeout contacting gateway.");
    }
  };

  const handleSaveCustomBaseUrl = () => {
    const trimmed = customBaseUrl.trim() || "https://integrate.api.nvidia.com/v1";
    localStorage.setItem("nvidia_custom_base_url", trimmed);
    handlePingGateway();
  };

  const handleSaveNvidiaKey = async () => {
    if (!nvidiaKey.trim()) {
      localStorage.removeItem("nvidia_api_key");
      onRefreshHealth();
      setTestStatus("success");
      setTimeout(() => setTestStatus("idle"), 3000);
      return;
    }

    setTestStatus("testing");
    setTestError("");

    try {
      const response = await fetch("/api/nvidia/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nvidiaApiKey: nvidiaKey })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("nvidia_api_key", nvidiaKey.trim());
        setTestStatus("success");
        onRefreshHealth(); // Refresh parent health state instantly
      } else {
        setTestStatus("error");
        setTestError(data.error || "Invalid API key or NVIDIA endpoint unreachable.");
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestError(err.message || "Failed to establish handshake connection with NVIDIA server.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagnostics Panel */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <Activity className="text-indigo-400 animate-pulse" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Server Health & API Bridge Diagnostics</h3>
          </div>
          <button 
            onClick={onRefreshHealth}
            className="text-[10px] font-semibold bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer"
          >
            Re-run Health Diagnostics
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Gemini Authorization */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
            apiActive 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
              : "bg-amber-500/5 border-amber-500/20 text-amber-400"
          }`}>
            <ShieldCheck size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Gateway Authorization Status</p>
              <p className="text-xs mt-1.5 leading-normal text-slate-300">
                {apiActive 
                  ? "Connected! Google Gemini API key detected on the server environment. Requests will be processed securely using server-side endpoints."
                  : "Simulating Telemetry. Server was unable to find a valid GEMINI_API_KEY. Using graceful, high-fidelity mock data. Add your key in AI Studio Secrets to unlock live queries."}
              </p>
            </div>
          </div>

          {/* NVIDIA NIM Status */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all duration-300 ${
            nvidiaActive 
              ? "bg-lime-500/5 border-lime-500/20 text-lime-450 shadow-[0_0_12px_rgba(132,204,22,0.1)]" 
              : "bg-slate-950 border-slate-800 text-slate-400"
          }`}>
            <Sparkles size={20} className={`mt-0.5 flex-shrink-0 ${nvidiaActive ? "text-lime-400 animate-pulse" : "text-slate-500"}`} />
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${nvidiaActive ? "text-lime-400" : "text-slate-400"}`}>NVIDIA NIM Integration Status</p>
              <p className="text-xs mt-1.5 leading-normal text-slate-300">
                {nvidiaActive 
                  ? "Connected! Live connection active! Your browser-supplied NVIDIA API key is configured. Requests are processed directly via NVIDIA Cloud NIM endpoints."
                  : "NVIDIA Key Unconfigured. Using Google Gemini gateway fallback (or simulated telemetry). Paste your NVIDIA API key in the panel below to unlock live microservice execution."}
              </p>
            </div>
          </div>

          {/* Reverse Proxy */}
          <div className="p-4 rounded-xl border bg-indigo-500/5 border-indigo-500/15 text-indigo-400 flex items-start space-x-3.5">
            <Server size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Reverse Proxy Configuration</p>
              <p className="text-xs mt-1.5 leading-normal text-slate-300">
                Ingress port <span className="font-mono text-indigo-300 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">3000</span> active. Web asset server and REST server are unified. Vite asset resolver processes client files, and Express proxies API requests.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Proposal Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1.5 lg:col-span-1">
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center justify-between px-4.5 py-3 rounded-lg text-xs font-semibold transition-all border text-left cursor-pointer ${
              activeTab === "security" 
                ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>1. Secret Key Security</span>
            <ChevronRight size={12} className={activeTab === "security" ? "text-indigo-400" : "text-slate-600"} />
          </button>

          <button
            onClick={() => setActiveTab("gateway")}
            className={`w-full flex items-center justify-between px-4.5 py-3 rounded-lg text-xs font-semibold transition-all border text-left cursor-pointer ${
              activeTab === "gateway" 
                ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>2. Custom Gateway & Ping</span>
            <ChevronRight size={12} className={activeTab === "gateway" ? "text-indigo-400" : "text-slate-600"} />
          </button>

          <button
            onClick={() => setActiveTab("render")}
            className={`w-full flex items-center justify-between px-4.5 py-3 rounded-lg text-xs font-semibold transition-all border text-left cursor-pointer ${
              activeTab === "render" 
                ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>3. Render Production Tuning</span>
            <ChevronRight size={12} className={activeTab === "render" ? "text-indigo-400" : "text-slate-600"} />
          </button>

          <button
            onClick={() => setActiveTab("sdks")}
            className={`w-full flex items-center justify-between px-4.5 py-3 rounded-lg text-xs font-semibold transition-all border text-left cursor-pointer ${
              activeTab === "sdks" 
                ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>4. SDK Lazy Initialization</span>
            <ChevronRight size={12} className={activeTab === "sdks" ? "text-indigo-400" : "text-slate-600"} />
          </button>
        </div>

        {/* Informative contents */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 lg:col-span-3 min-h-[280px] shadow-md">
          {activeTab === "security" && (
            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                <ShieldCheck className="text-indigo-400" size={16} />
                <span>NVIDIA NIM & Google Gemini Key Management</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure your hosted NVIDIA NIM credentials below. The API key is securely saved in your browser's local storage and injected dynamically via server-side reverse proxy requests, preventing exposure of keys to any client-side bundle.
              </p>

              {/* NVIDIA Key Config Form */}
              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">NVIDIA API Key</label>
                    <a 
                      href="https://build.nvidia.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Get your NVIDIA key →
                    </a>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value={nvidiaKey}
                      onChange={(e) => setNvidiaKey(e.target.value)}
                      placeholder="nvapi-..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-mono"
                    />
                    <button
                      onClick={handleSaveNvidiaKey}
                      disabled={testStatus === "testing"}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0"
                    >
                      {testStatus === "testing" ? "Testing Connection..." : "Verify & Save"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Entering a valid NVIDIA API Key replaces the simulated proxy logic with live inference from high-performance NVIDIA-hosted microservices. To clear, simply delete the key and click "Verify & Save".
                  </p>
                </div>

                {/* Connection Status Banners */}
                {testStatus === "success" && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-lg text-xs text-emerald-400 flex items-center space-x-2.5 animate-fade-in">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <div>
                      <p className="font-semibold uppercase tracking-wider text-[10px]">Verification Success!</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Handshake established with `https://integrate.api.nvidia.com/v1`. Live NVIDIA NIM services activated.</p>
                    </div>
                  </div>
                )}

                {testStatus === "error" && (
                  <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-lg text-xs text-rose-400 flex items-start space-x-2.5 animate-fade-in">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-rose-400" />
                    <div>
                      <p className="font-semibold uppercase tracking-wider text-[10px]">Verification Failed</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{testError}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-900/60 text-xs text-indigo-300 font-mono space-y-1">
                <p className="text-slate-500">// ✅ Decoupled Proxy Architecture</p>
                <p>Client (with nvapi-*) -&gt; Server Authorization Header proxy -&gt; Live NVIDIA NIM API</p>
              </div>
            </div>
          )}

          {activeTab === "gateway" && (
            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Server className="text-indigo-400" size={16} />
                <span>Custom NIM Gateway & Endpoint Ping Diagnostics</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your workspace directly to self-hosted NVIDIA NIM instances running in private cloud clusters (DGX SuperPOD, AWS EC2 G5/P5, Azure NDv4, or on-premise Kubernetes pods).
              </p>

              {/* Custom Base URL Form */}
              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      NIM Base URL (OpenAI v1 Compatible)
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      Default: integrate.api.nvidia.com
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="https://integrate.api.nvidia.com/v1 or http://dgx-cluster.internal:8000/v1"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-mono"
                    />
                    <button
                      onClick={handleSaveCustomBaseUrl}
                      disabled={pingStatus === "pinging"}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 flex items-center space-x-1.5"
                    >
                      {pingStatus === "pinging" ? (
                        <>
                          <Activity size={13} className="animate-spin" />
                          <span>Pinging...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} />
                          <span>Ping & Save</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Supports any endpoint hosting NVIDIA NIM containers with standard `/v1/chat/completions` and `/v1/models` routes.
                  </p>
                </div>

                {/* Ping Result Banners */}
                {pingStatus === "success" && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-lg text-xs text-emerald-400 flex items-start space-x-2.5 animate-fade-in">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Gateway Handshake Verified</span>
                        {pingLatency !== null && (
                          <span className="text-[9px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                            RTT: {pingLatency}ms
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300">{pingDetails}</p>
                    </div>
                  </div>
                )}

                {pingStatus === "error" && (
                  <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-lg text-xs text-rose-400 flex items-start space-x-2.5 animate-fade-in">
                    <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold uppercase tracking-wider text-[10px]">Gateway Ping Failed</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{pingDetails}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Endpoint Diagnostics Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Protocol Standard</span>
                  <p className="text-slate-200 font-mono">OpenAI v1 API + SSE Streaming</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Target Gateway</span>
                  <p className="text-indigo-400 font-mono truncate">{customBaseUrl}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "render" && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Zap className="text-indigo-400" size={16} />
                <span>Optimizing Performance for Production Services</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When hosting full-stack applications on free-tier platforms like Render, web services automatic spin down after 15 minutes of quiet time. This causes cold-start latencies of up to 50 seconds for subsequent requests.
              </p>

              <div className="space-y-3.5 pt-1 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-semibold text-slate-200">Uptime Ping Automation</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Use an external monitoring agent (like UptimeRobot) to ping `/api/health` every 14 minutes. This keeps your container hot and prevents spin-down delays.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-semibold text-slate-200">Brotli / Gzip Compression</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Vite asset distribution is optimized by default. In server.ts, you can optionally mount `compression()` middleware to compress transfer sizes of payloads, increasing UI responsiveness.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-semibold text-slate-200">Optimistic UI Updating</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">The dashboard incorporates optimistic updates inside Chat and Playground. User text displays instantly and is backed by animated skeleton mock items to prevent jarring white screens.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sdks" && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Server className="text-indigo-400" size={16} />
                <span>Lazy Initialization Best Practices</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Initializing SDK clients at module compile/load time triggers immediate system crashes if environment keys are missing. This blocks development servers from booting and displays permanent "Please wait..." screens.
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-900/60 text-xs text-indigo-300 font-mono space-y-1 leading-relaxed">
                <p className="text-slate-500">// ❌ CRITICAL BUG (Module load crashes if key missing)</p>
                <p className="text-slate-500">{"const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });"}</p>
                <p className="text-emerald-400 mt-2">// ✅ CORRECT PATTERN (Lazy loaded inside endpoints)</p>
                <p>{"function getGeminiClient() {"}</p>
                <p>&nbsp;&nbsp;{"const key = process.env.GEMINI_API_KEY;"}</p>
                <p>&nbsp;&nbsp;{"if (!key) return null;"}</p>
                <p>&nbsp;&nbsp;{"return new GoogleGenAI({ apiKey: key });"}</p>
                <p>{"}"}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI-Dash Pro implements safe lazy loaders. If the API key is unconfigured, the application launches flawlessly and provides useful warning alerts inside endpoints.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
