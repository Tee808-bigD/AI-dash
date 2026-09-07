import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Play, 
  Code, 
  Image as ImageIcon, 
  Film, 
  Volume2, 
  ArrowRight, 
  Download, 
  Monitor, 
  Smartphone, 
  Maximize2, 
  Check, 
  HelpCircle, 
  Database, 
  Clock, 
  Cpu, 
  Eye, 
  FileCode,
  Layers,
  Zap,
  RotateCcw,
  GitFork,
  Workflow,
  Code2,
  ExternalLink,
  Plus,
  FolderArchive,
  Wand2
} from "lucide-react";
import JSZip from "jszip";
import VisualChainingCanvas from "./VisualChainingCanvas";
import DeveloperCodeModal from "./DeveloperCodeModal";
import PromptOptimizerModal from "./PromptOptimizerModal";
import MediaAssetBin from "./MediaAssetBin";
import { getFallbackVideoFrame } from "../utils/fallbackImage";

export interface SuggestedStep {
  stepNumber: number;
  type: "image" | "video" | "audio" | "code";
  modelName: string;
  modelId: string;
  prompt: string;
  presets: {
    aspectRatio?: string;
    duration?: string;
    style?: string;
    quality?: string;
    voiceStyle?: string;
    [key: string]: string | undefined;
  };
}

export interface ClassificationResult {
  originalPrompt: string;
  intentsDetected: string[];
  suggestedSteps: SuggestedStep[];
  estimatedTotalCredits: number;
  isSimulated?: boolean;
}

const DEFAULT_INITIAL_PIPELINE: ClassificationResult = {
  originalPrompt: "Generate a futuristic hovercraft image, then compile a cinematic video showing its propulsion, and translate the engineering audio summary.",
  intentsDetected: ["image_synthesis", "temporal_motion", "nemo_speech", "code_bundling"],
  estimatedTotalCredits: 12,
  suggestedSteps: [
    {
      stepNumber: 1,
      type: "image",
      modelName: "NVIDIA NIM SDXL Turbo",
      modelId: "sdxl-nim",
      prompt: "Futuristic aerofoil hovercraft gliding above luminescent ocean at twilight, high detail 8k concept art",
      presets: {
        aspectRatio: "16:9",
        style: "cinematic",
        quality: "ultra"
      }
    },
    {
      stepNumber: 2,
      type: "video",
      modelName: "NVIDIA VideoGPT Motion",
      modelId: "videogpt-nim",
      prompt: "Cinematic camera sweep around the hovercraft revealing blue ion thruster propulsion and wave spray",
      presets: {
        aspectRatio: "16:9",
        duration: "6s",
        style: "cinematic"
      }
    },
    {
      stepNumber: 3,
      type: "audio",
      modelName: "NeMo FastPitch & HiFi-GAN",
      modelId: "nemo-tts-nim",
      prompt: "Ion drive propulsion active at ninety-two percent efficiency. Vector telemetry stabilized for oceanic transit.",
      presets: {
        voiceStyle: "Charon"
      }
    },
    {
      stepNumber: 4,
      type: "code",
      modelName: "Nemotron Code 35B",
      modelId: "nemotron-code-35b",
      prompt: "Interactive telemetry HUD dashboard with real-time speed gauges and mission status readouts",
      presets: {
        aspectRatio: "16:9"
      }
    }
  ]
};

interface WebsiteBundle {
  html: string;
  css: string;
  js: string;
  isSimulated?: boolean;
}

export default function MultimodalHub() {
  const [activeSubTab, setActiveSubTab] = useState<"pipeline" | "prototyping" | "gallery">("pipeline");
  
  // Prompt Optimizer Modal State
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [optimizerTarget, setOptimizerTarget] = useState<"pipeline" | "code">("pipeline");
  
  // Pipeline Orchestration State
  const [pipelinePrompt, setPipelinePrompt] = useState(
    "Generate a futuristic hovercraft image, then compile a cinematic video showing its propulsion, and translate the engineering audio summary."
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [pipeline, setPipeline] = useState<ClassificationResult>(DEFAULT_INITIAL_PIPELINE);
  const [pipelineMode, setPipelineMode] = useState<"dag" | "linear">("dag");
  const [isRunningAll, setIsRunningAll] = useState(false);

  // Developer Code Modal State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeModalConfig, setCodeModalConfig] = useState<{
    title: string;
    modelId: string;
    prompt: string;
    type: "pipeline" | "code" | "chat";
  }>({
    title: "NVIDIA Multimodal Pipeline Chaining SDK",
    modelId: "nemotron-4-340b-instruct",
    prompt: DEFAULT_INITIAL_PIPELINE.originalPrompt,
    type: "pipeline"
  });

  // Pipeline step-by-step runner states
  const [runningStepIdx, setRunningStepIdx] = useState<number | null>(null);
  const [stepOutputs, setStepOutputs] = useState<Record<number, {
    status: "idle" | "running" | "completed" | "error";
    outputUrl?: string;
    textResult?: string;
    latencyMs?: number;
    error?: string;
  }>>({
    1: { status: "idle" },
    2: { status: "idle" },
    3: { status: "idle" },
    4: { status: "idle" }
  });

  // Rapid Prototyping Code State
  const [codePrompt, setCodePrompt] = useState("Premium nautical restaurant table reservation console with interactive map");
  const [themeColor, setThemeColor] = useState("#c49b66"); // Default Sea Smoke Brass Gold
  const [layoutType, setLayoutType] = useState("landing-page");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [websiteBundle, setWebsiteBundle] = useState<WebsiteBundle | null>(null);
  const [codeTab, setCodeTab] = useState<"html" | "css" | "js">("html");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [codeGenerationCredits, setCodeGenerationCredits] = useState(8);

  const colors = [
    { name: "Sea Smoke Gold", value: "#c49b66" },
    { name: "Crisp Seafoam", value: "#7ae7c7" },
    { name: "Nautical Navy", value: "#1e3d59" },
    { name: "Coastal Fog", value: "#b8c6c3" },
    { name: "Coral Pearl", value: "#f07c6c" }
  ];

  const handleDeconstructPipeline = async () => {
    if (!pipelinePrompt.trim()) return;
    setIsClassifying(true);
    setStepOutputs({});
    
    try {
      const response = await fetch("/api/multimodal/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: pipelinePrompt })
      });
      if (response.ok) {
        const data = await response.json();
        setPipeline(data);
        
        // Initialize step outputs as idle
        const initialOutputs: typeof stepOutputs = {};
        data.suggestedSteps.forEach((step: SuggestedStep) => {
          initialOutputs[step.stepNumber] = { status: "idle" };
        });
        setStepOutputs(initialOutputs);
      }
    } catch (err: any) {
      console.error("Classification failed:", err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleRunStep = async (step: SuggestedStep) => {
    setRunningStepIdx(step.stepNumber);
    setStepOutputs(prev => ({
      ...prev,
      [step.stepNumber]: { ...prev[step.stepNumber], status: "running" }
    }));

    const startTime = Date.now();

    try {
      // Route request based on step type
      if (step.type === "image") {
        const response = await fetch("/api/video/generate-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: step.prompt, 
            aspectRatio: step.presets.aspectRatio || "16:9" 
          })
        });
        const data = await response.json();
        const latency = Date.now() - startTime;
        
        if (response.ok) {
          setStepOutputs(prev => ({
            ...prev,
            [step.stepNumber]: {
              status: "completed",
              outputUrl: data.imageUrl,
              latencyMs: latency
            }
          }));
        } else {
          throw new Error(data.error || "Frame synthesis failed.");
        }
      } else if (step.type === "video") {
        // Build video storyboard preview using server script
        const response = await fetch("/api/video/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: step.prompt, 
            style: step.presets.style || "cinematic",
            aspectRatio: step.presets.aspectRatio || "16:9"
          })
        });
        const data = await response.json();
        const latency = Date.now() - startTime;
        
        if (response.ok) {
          // Select the first generated scene's image as the preview
          const firstSceneImg = data.scenes?.[0]?.imageUrl || getFallbackVideoFrame(step.prompt);
          setStepOutputs(prev => ({
            ...prev,
            [step.stepNumber]: {
              status: "completed",
              outputUrl: firstSceneImg,
              textResult: `**Video Title**: ${data.title}\n**Scenes compiled**: ${data.scenes?.length || 5} dynamic 12s frames.`,
              latencyMs: latency
            }
          }));
        } else {
          throw new Error(data.error || "Video synthesis failed.");
        }
      } else if (step.type === "audio") {
        const response = await fetch("/api/video/generate-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: step.prompt, 
            voiceName: step.presets.voiceStyle || "Charon"
          })
        });
        const data = await response.json();
        const latency = Date.now() - startTime;
        
        if (response.ok) {
          setStepOutputs(prev => ({
            ...prev,
            [step.stepNumber]: {
              status: "completed",
              outputUrl: data.audioDataUrl,
              textResult: `**NeMo Speech synthesised**: "${step.prompt.substring(0, 80)}..."`,
              latencyMs: latency
            }
          }));
        } else {
          throw new Error(data.error || "Voice synthesis failed.");
        }
      } else if (step.type === "code") {
        const response = await fetch("/api/multimodal/generate-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: step.prompt, 
            themeColor: "#4318FF", 
            layoutType: "landing-page" 
          })
        });
        const data = await response.json();
        const latency = Date.now() - startTime;
        
        if (response.ok) {
          setStepOutputs(prev => ({
            ...prev,
            [step.stepNumber]: {
              status: "completed",
              textResult: `Successfully generated a full responsive website prototype. HTML5, CSS and scripts packaged.`,
              latencyMs: latency
            }
          }));
        } else {
          throw new Error(data.error || "Website generation failed.");
        }
      }
    } catch (err: any) {
      setStepOutputs(prev => ({
        ...prev,
        [step.stepNumber]: {
          status: "error",
          error: err.message || "Pipeline execution failed."
        }
      }));
    } finally {
      setRunningStepIdx(null);
    }
  };

  const handleRunEntirePipeline = async () => {
    if (!pipeline || isRunningAll) return;
    setIsRunningAll(true);
    try {
      for (const step of pipeline.suggestedSteps) {
        await handleRunStep(step);
      }
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleResetPipeline = () => {
    const resetOutputs: typeof stepOutputs = {};
    pipeline.suggestedSteps.forEach(s => {
      resetOutputs[s.stepNumber] = { status: "idle" };
    });
    setStepOutputs(resetOutputs);
  };

  const handleUpdateStepPreset = (stepNumber: number, key: string, value: string) => {
    setPipeline(prev => ({
      ...prev,
      suggestedSteps: prev.suggestedSteps.map(s => {
        if (s.stepNumber === stepNumber) {
          return {
            ...s,
            presets: {
              ...s.presets,
              [key]: value
            }
          };
        }
        return s;
      })
    }));
  };

  const handleAddCustomNode = () => {
    const newStepNum = pipeline.suggestedSteps.length + 1;
    const newStep: SuggestedStep = {
      stepNumber: newStepNum,
      type: "image",
      modelName: "NVIDIA NIM SDXL 4K Upscaler",
      modelId: "sdxl-nim",
      prompt: "Super-resolution 4K latent detail upscaler with enhanced atmospheric lighting and oceanic reflections",
      presets: {
        aspectRatio: "16:9",
        style: "photorealistic",
        quality: "extreme"
      }
    };
    setPipeline(prev => ({
      ...prev,
      suggestedSteps: [...prev.suggestedSteps, newStep],
      estimatedTotalCredits: prev.estimatedTotalCredits + 4
    }));
    setStepOutputs(prev => ({
      ...prev,
      [newStepNum]: { status: "idle" }
    }));
  };

  const handleOpenPipelineExport = () => {
    setCodeModalConfig({
      title: "NVIDIA Multimodal Pipeline Chaining SDK",
      modelId: "nemotron-4-340b-instruct",
      prompt: pipeline.originalPrompt,
      type: "pipeline"
    });
    setIsCodeModalOpen(true);
  };

  const handleOpenCodeStudioExport = () => {
    setCodeModalConfig({
      title: "NVIDIA Nemotron Code 35B Endpoint",
      modelId: "nemotron-code-35b",
      prompt: codePrompt,
      type: "code"
    });
    setIsCodeModalOpen(true);
  };

  const handleGenerateWebsite = async () => {
    if (!codePrompt.trim()) return;
    setIsGeneratingCode(true);
    setWebsiteBundle(null);
    
    try {
      const response = await fetch("/api/multimodal/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: codePrompt,
          themeColor,
          layoutType
        })
      });
      if (response.ok) {
        const data = await response.json();
        setWebsiteBundle(data);
      }
    } catch (err: any) {
      console.error("Website generation failed:", err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!websiteBundle) return;
    
    const zip = new JSZip();
    zip.file("index.html", websiteBundle.html);
    zip.file("styles.css", websiteBundle.css);
    zip.file("app.js", websiteBundle.js);
    
    try {
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `proto-bundle-${layoutType}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("ZIP packaging failed:", err);
      alert("Error: Failed to package ZIP bundle.");
    }
  };

  // Combine HTML, CSS, and JS into a single preview string for the sandboxed iframe
  const getCombinedIframeSource = () => {
    if (!websiteBundle) return "";
    const { html, css, js } = websiteBundle;
    
    // Inject custom compiled CSS and JS on-the-fly inside the HTML head and body
    let src = html;
    
    // Insert CSS before closing head
    if (src.includes("</head>")) {
      src = src.replace("</head>", `<style>${css}</style></head>`);
    } else {
      src = `<style>${css}</style>` + src;
    }
    
    // Insert JS before closing body
    if (src.includes("</body>")) {
      src = src.replace("</body>", `<script>${js}</script></body>`);
    } else {
      src = src + `<script>${js}</script>`;
    }
    
    return src;
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector */}
      <div className="flex bg-[#0b1622]/80 p-1.5 rounded-2xl border border-[#16273a] max-w-2xl">
        <button
          onClick={() => setActiveSubTab("pipeline")}
          className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "pipeline" 
              ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles size={13} />
          <span>Multimodal Pipeline</span>
        </button>
        <button
          onClick={() => setActiveSubTab("prototyping")}
          className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "prototyping" 
              ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Code size={13} />
          <span>Proto Code Studio</span>
        </button>
        <button
          onClick={() => setActiveSubTab("gallery")}
          className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "gallery" 
              ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FolderArchive size={13} />
          <span>Media Asset Shelf</span>
        </button>
      </div>

      {/* VIEW 1: Multimodal Orchestrator Pipeline */}
      {activeSubTab === "pipeline" && (
        <div className="space-y-6">
          <div className="bg-[#0b1622]/90 border border-[#16273a] backdrop-blur-md p-5 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="text-[#c49b66]" size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#c49b66]">Intent-Aware Orchestration Engine</h2>
              </div>
              <button
                onClick={() => {
                  setOptimizerTarget("pipeline");
                  setIsOptimizerOpen(true);
                }}
                className="text-[10px] font-mono text-[#c49b66] hover:text-white bg-[#060c15] border border-[#16273a] px-2.5 py-1 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Wand2 size={12} />
                <span>Auto-Tune Prompt</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Enter a complex multimodal prompt. The orchestration layer will parse your input, tag specific intents, map media pipelines to separate NVIDIA NIM endpoints, and organize an interactive chainable sequence.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5">
              <div className="flex-1 relative">
                <textarea
                  className="w-full bg-[#060c15]/95 border border-[#16273a] rounded-xl px-4 py-3 pr-10 text-xs focus:outline-none focus:border-[#c49b66] text-slate-100 placeholder-slate-600 font-sans resize-none"
                  rows={2}
                  placeholder="Type your complex multimodal request here (e.g. Generate a concept image of an oyster shell on rocky beach, animate it into slow tide video...)"
                  value={pipelinePrompt}
                  onChange={(e) => setPipelinePrompt(e.target.value)}
                />
                <button
                  onClick={() => {
                    setOptimizerTarget("pipeline");
                    setIsOptimizerOpen(true);
                  }}
                  title="Auto-tune with Nemotron"
                  className="absolute right-3 top-3 text-slate-500 hover:text-[#c49b66] transition-colors p-1"
                >
                  <Wand2 size={14} />
                </button>
              </div>
              <button
                onClick={handleDeconstructPipeline}
                disabled={isClassifying || !pipelinePrompt.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#c49b66] to-[#a47e4f] hover:opacity-95 text-[#060c15] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#c49b66]/20 sm:self-end cursor-pointer"
              >
                {isClassifying ? "Parsing Request..." : "Deconstruct & Pipeline"}
              </button>
            </div>
          </div>

          {/* Render Pipeline Modes (DAG vs Linear) */}
          {pipeline && (
            <div className="space-y-5">
              {/* Mode Switcher & Pipeline Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-2 bg-[#0b1622] p-1 rounded-xl border border-[#16273a]">
                  <button
                    onClick={() => setPipelineMode("dag")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                      pipelineMode === "dag" 
                        ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Workflow size={12} />
                    <span>Visual DAG Canvas</span>
                  </button>
                  <button
                    onClick={() => setPipelineMode("linear")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                      pipelineMode === "linear" 
                        ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers size={12} />
                    <span>Linear Steps</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenPipelineExport}
                    className="px-3 py-1.5 rounded-xl border border-[#16273a] bg-[#0b1622] text-[#c49b66] hover:bg-[#16273a] text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Code2 size={12} />
                    <span>Export Pipeline SDK</span>
                  </button>
                  <span className="text-[10px] font-mono font-bold bg-[#0b1622] border border-[#16273a] text-[#7ae7c7] px-3 py-1.5 rounded-xl">
                    Estimated credits: {pipeline.estimatedTotalCredits} Units
                  </span>
                </div>
              </div>

              {/* Conditional: Visual DAG Canvas vs Linear Steps */}
              {pipelineMode === "dag" ? (
                <VisualChainingCanvas
                  pipeline={pipeline}
                  stepOutputs={stepOutputs}
                  runningStepIdx={runningStepIdx}
                  isRunningAll={isRunningAll}
                  onRunStep={handleRunStep}
                  onRunEntirePipeline={handleRunEntirePipeline}
                  onResetPipeline={handleResetPipeline}
                  onUpdateStepPreset={handleUpdateStepPreset}
                  onAddCustomNode={handleAddCustomNode}
                  onExportCode={handleOpenPipelineExport}
                  onOpenProtoStudio={() => setActiveSubTab("prototyping")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {pipeline.suggestedSteps.map((step) => {
                    const output = stepOutputs[step.stepNumber];
                    const isRunning = runningStepIdx === step.stepNumber;
                    const isImage = step.type === "image";
                    const isVideo = step.type === "video";
                    const isAudio = step.type === "audio";
                    const isCode = step.type === "code";

                    return (
                      <div 
                        key={step.stepNumber}
                        className="bg-[#0b1622]/90 border border-[#16273a] rounded-2xl p-4.5 flex flex-col justify-between space-y-4 shadow-xl"
                      >
                        {/* Step Header */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#c49b66]">
                              Step 0{step.stepNumber}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                              isImage ? "bg-[#c49b66]/10 text-[#c49b66] border-[#c49b66]/20" :
                              isVideo ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              isAudio ? "bg-[#7ae7c7]/10 text-[#7ae7c7] border-[#7ae7c7]/20" :
                              "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}>
                              {step.type}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-white font-display italic tracking-wide">{step.modelName}</h4>
                          <p className="text-[10px] text-slate-400 leading-normal line-clamp-3 italic">
                            "{step.prompt}"
                          </p>
                        </div>

                        {/* Display Outputs / Placeholders */}
                        <div className="h-40 w-full rounded-xl bg-[#060c15]/90 border border-[#16273a] flex flex-col items-center justify-center p-3 text-center overflow-hidden relative">
                          {output?.status === "running" ? (
                            <div className="space-y-2 animate-pulse text-center">
                              <Layers className="text-[#c49b66] mx-auto animate-spin" size={24} />
                              <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">Synthesising...</p>
                            </div>
                          ) : output?.status === "completed" ? (
                            <>
                              {isImage && output.outputUrl && (
                                <img 
                                  src={output.outputUrl} 
                                  alt="Step Output" 
                                  className="object-cover w-full h-full rounded-lg"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getFallbackVideoFrame(step.prompt);
                                  }}
                                />
                              )}
                              {isVideo && output.outputUrl && (
                                <div className="relative w-full h-full">
                                  <img 
                                    src={output.outputUrl} 
                                    alt="Step Output Video First Frame" 
                                    className="object-cover w-full h-full rounded-lg blur-[1px]"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = getFallbackVideoFrame(step.prompt);
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Film className="text-white drop-shadow-md animate-bounce" size={24} />
                                  </div>
                                </div>
                              )}
                              {isAudio && output.outputUrl && (
                                <div className="space-y-3 w-full">
                                  <Volume2 className="text-emerald-400 mx-auto animate-pulse" size={24} />
                                  <audio controls src={output.outputUrl} className="w-full h-7 text-[8px]" />
                                </div>
                              )}
                              {isCode && (
                                <div className="space-y-2 text-center">
                                  <Code className="text-blue-400 mx-auto" size={24} />
                                  <span className="text-[10px] text-slate-300 font-bold block">Prototype Compiled</span>
                                </div>
                              )}
                              
                              {/* Latency badge */}
                              <div className="absolute bottom-1.5 left-1.5 bg-[#0b1622]/90 border border-[#16273a] rounded-lg px-2 py-0.5 text-[8px] font-mono font-bold text-[#7ae7c7]">
                                {output.latencyMs}ms
                              </div>
                            </>
                          ) : output?.status === "error" ? (
                            <div className="space-y-1.5 text-rose-400 p-2">
                              <span className="text-[9px] uppercase font-black tracking-wide block">FAILED</span>
                              <p className="text-[8px] leading-tight truncate">{output.error}</p>
                            </div>
                          ) : (
                            <div className="text-slate-600 flex flex-col items-center">
                              {isImage && <ImageIcon size={20} className="mb-1" />}
                              {isVideo && <Film size={20} className="mb-1" />}
                              {isAudio && <Volume2 size={20} className="mb-1" />}
                              {isCode && <Code size={20} className="mb-1" />}
                              <span className="text-[9px] font-bold uppercase tracking-widest">Idle Chain Step</span>
                            </div>
                          )}
                        </div>

                        {/* Action trigger button */}
                        <button
                          onClick={() => handleRunStep(step)}
                          disabled={isRunning || runningStepIdx !== null}
                          className="w-full py-2.5 bg-[#060c15] hover:bg-[#16273a] border border-[#16273a] text-white text-[9px] uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                        >
                          {isRunning ? (
                            "Executing..."
                          ) : output?.status === "completed" ? (
                            <>
                              <Check size={10} className="text-emerald-400" />
                              <span>Re-Execute Step</span>
                            </>
                          ) : (
                            <>
                              <Play size={10} fill="white" />
                              <span>Execute Step</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Rapid Prototyping Code Studio */}
      {activeSubTab === "prototyping" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Config Sidebar */}
            <div className="bg-[#0b1622]/90 border border-[#16273a] rounded-2xl p-5 space-y-5 shadow-xl">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-[#16273a]">
                <Code className="text-[#c49b66]" size={15} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#c49b66]">Proto Code Studio Specs</span>
              </div>

              {/* Prompt Text Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Prompt Description</label>
                <textarea
                  className="w-full bg-[#060c15]/95 border border-[#16273a] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#c49b66] placeholder-slate-600 resize-none font-sans"
                  rows={4}
                  value={codePrompt}
                  onChange={(e) => setCodePrompt(e.target.value)}
                  placeholder="Describe your target responsive single-page visual interface prototype..."
                />
              </div>

              {/* Layout archetype options */}
              <div className="space-y-2.5">
                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-sans">Layout Type</span>
                <select
                  value={layoutType}
                  onChange={(e) => setLayoutType(e.target.value)}
                  className="w-full bg-[#060c15]/85 border border-[#16273a] rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#c49b66] font-medium cursor-pointer"
                >
                  <option value="landing-page" className="bg-[#060c15]">Modern Product Landing Page</option>
                  <option value="admin-dashboard" className="bg-[#060c15]">Interactive Dashboard Control</option>
                  <option value="profile-portfolio" className="bg-[#060c15]">Sleek Developer Portfolio</option>
                  <option value="splash-launch" className="bg-[#060c15]">Minimalist Concept Splash</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2.5">
                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-sans">Accent Branding Color</span>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setThemeColor(color.value)}
                      className={`w-7 h-7 rounded-full border transition-all cursor-pointer relative ${
                        themeColor === color.value 
                          ? "border-white scale-110 shadow-lg" 
                          : "border-transparent opacity-75 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {themeColor === color.value && (
                        <Check size={12} className="text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diagnostics usage info */}
              <div className="p-3.5 bg-[#060c15]/80 rounded-xl border border-[#16273a] space-y-1 font-mono text-[9px]">
                <div className="flex justify-between text-slate-400">
                  <span>SPECIALIZED CODES NIM</span>
                  <span className="text-[#7ae7c7] font-black">NEMOTRON-CODE</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ESTIMATED USAGE</span>
                  <span className="text-emerald-400 font-black">{codeGenerationCredits} CREDITS</span>
                </div>
              </div>

              {/* Core trigger button */}
              <div className="space-y-2">
                <button
                  onClick={handleGenerateWebsite}
                  disabled={isGeneratingCode || !codePrompt.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-[#c49b66] to-[#a47e4f] hover:opacity-95 text-[#060c15] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#c49b66]/20 cursor-pointer"
                >
                  {isGeneratingCode ? (
                    "Synthesising Static Code..."
                  ) : (
                    <>
                      <Code size={13} />
                      <span>Generate Prototype Bundle</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenCodeStudioExport}
                  className="w-full py-2.5 bg-[#060c15] hover:bg-[#16273a] border border-[#16273a] text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Code2 size={13} className="text-[#c49b66]" />
                  <span>Export Code Generation SDK</span>
                </button>
              </div>
            </div>

            {/* Split Screen interactive code inspect + live visual preview */}
            <div className="lg:col-span-2 space-y-4">
              {websiteBundle ? (
                <div className="grid grid-cols-1 gap-5">
                  {/* Visual Live Preview Card */}
                  <div className="bg-[#0b1622]/90 border border-[#16273a] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[400px]">
                    <div className="px-5 py-3.5 border-b border-[#16273a] flex items-center justify-between bg-[#060c15]/75">
                      <div className="flex items-center space-x-2">
                        <Monitor className="text-slate-400" size={13} />
                        <span className="text-xs font-bold text-[#f5efeb] font-display italic tracking-wide">Live Sandbox Preview</span>
                      </div>
                      
                      {/* Responsive device layout toggle buttons */}
                      <div className="flex items-center space-x-1.5 bg-[#0b1622] p-1 rounded-xl border border-[#16273a]">
                        <button
                          onClick={() => setPreviewDevice("desktop")}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            previewDevice === "desktop" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Monitor size={12} />
                        </button>
                        <button
                          onClick={() => setPreviewDevice("mobile")}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            previewDevice === "mobile" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Smartphone size={12} />
                        </button>
                      </div>
                    </div>

                    {/* IFrame mount point */}
                    <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-hidden">
                      <iframe
                        srcDoc={getCombinedIframeSource()}
                        title="Prototype Sandbox Frame"
                        sandbox="allow-scripts allow-same-origin"
                        className={`bg-slate-950 shadow-2xl transition-all duration-300 rounded-lg ${
                          previewDevice === "mobile" 
                            ? "w-[360px] h-full border border-slate-800" 
                            : "w-full h-full border-none"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Code Inspection & Action Bar */}
                  <div className="bg-[#0b1622]/90 border border-[#16273a] rounded-2xl overflow-hidden shadow-xl flex flex-col">
                    <div className="px-5 py-3.5 border-b border-[#16273a] flex flex-wrap items-center justify-between gap-4 bg-[#060c15]/75">
                      {/* Code files tab selector */}
                      <div className="flex space-x-1.5 bg-[#0b1622] p-1 rounded-xl border border-[#16273a]">
                        <button
                          onClick={() => setCodeTab("html")}
                          className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                            codeTab === "html" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          index.html
                        </button>
                        <button
                          onClick={() => setCodeTab("css")}
                          className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                            codeTab === "css" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          styles.css
                        </button>
                        <button
                          onClick={() => setCodeTab("js")}
                          className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                            codeTab === "js" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          app.js
                        </button>
                      </div>

                      {/* Download Zip trigger */}
                      <button
                        onClick={handleDownloadZip}
                        className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black bg-emerald-600 hover:bg-emerald-500 text-white px-4.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
                      >
                        <Download size={12} />
                        <span>Download ZIP Bundle</span>
                      </button>
                    </div>

                    {/* Source code viewer panel */}
                    <div className="p-4 bg-slate-950 max-h-52 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre scrollbar-thin select-all">
                      {codeTab === "html" && websiteBundle.html}
                      {codeTab === "css" && websiteBundle.css}
                      {codeTab === "js" && websiteBundle.js}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[450px] bg-[#0b1622]/90 border border-[#16273a] rounded-2xl flex flex-col items-center justify-center text-center p-8 shadow-xl">
                  <Code className="text-[#c49b66] mb-3 animate-pulse" size={32} />
                  <h3 className="text-sm font-black text-white tracking-tight mb-1 font-display italic">Static Prototype Sandbox Pending</h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Describe your static landing page or oyster reservation interface on the left column parameters panel and compile a spectacular ZIP bundle prototype instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Media Asset Staging Bin */}
      {activeSubTab === "gallery" && (
        <div className="space-y-6">
          <MediaAssetBin />
        </div>
      )}

      {/* Prompt Auto-Tuning Modal */}
      <PromptOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        initialPrompt={optimizerTarget === "pipeline" ? pipelinePrompt : codePrompt}
        onApplyPrompt={(optimized) => {
          if (optimizerTarget === "pipeline") {
            setPipelinePrompt(optimized);
          } else {
            setCodePrompt(optimized);
          }
        }}
      />

      {/* Developer Code Modal for Exporting API Snippets */}
      <DeveloperCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title={codeModalConfig.title}
        modelId={codeModalConfig.modelId}
        prompt={codeModalConfig.prompt}
        type={codeModalConfig.type}
      />
    </div>
  );
}
