import React, { useState } from "react";
import { getFallbackVideoFrame } from "../utils/fallbackImage";
import { VideoPlayerModal } from "./video/VideoPlayerModal";
import { 
  Sparkles, 
  Play, 
  Check, 
  Layers, 
  Image as ImageIcon, 
  Film, 
  Volume2, 
  Code, 
  Plus, 
  RotateCcw, 
  Code2, 
  Zap, 
  Clock, 
  ArrowRight, 
  Sliders, 
  Cpu, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Download
} from "lucide-react";

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

interface VisualChainingCanvasProps {
  pipeline: ClassificationResult;
  stepOutputs: Record<number, {
    status: "idle" | "running" | "completed" | "error";
    outputUrl?: string;
    textResult?: string;
    latencyMs?: number;
    error?: string;
  }>;
  runningStepIdx: number | null;
  isRunningAll: boolean;
  onRunStep: (step: SuggestedStep) => void;
  onRunEntirePipeline: () => void;
  onResetPipeline: () => void;
  onUpdateStepPreset: (stepNumber: number, key: string, value: string) => void;
  onAddCustomNode: () => void;
  onExportCode: () => void;
  onOpenProtoStudio?: () => void;
}

export default function VisualChainingCanvas({
  pipeline,
  stepOutputs,
  runningStepIdx,
  isRunningAll,
  onRunStep,
  onRunEntirePipeline,
  onResetPipeline,
  onUpdateStepPreset,
  onAddCustomNode,
  onExportCode,
  onOpenProtoStudio
}: VisualChainingCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [videoModalData, setVideoModalData] = useState<{
    isOpen: boolean;
    title: string;
    prompt: string;
    imageUrl: string;
  }>({
    isOpen: false,
    title: "",
    prompt: "",
    imageUrl: ""
  });

  // Group steps by their DAG stages
  const imageStep = pipeline.suggestedSteps.find(s => s.type === "image");
  const videoStep = pipeline.suggestedSteps.find(s => s.type === "video");
  const audioStep = pipeline.suggestedSteps.find(s => s.type === "audio");
  const codeStep = pipeline.suggestedSteps.find(s => s.type === "code");
  const customSteps = pipeline.suggestedSteps.filter(s => !["image", "video", "audio", "code"].includes(s.type));

  const getNodeStatus = (stepNumber: number) => {
    return stepOutputs[stepNumber]?.status || "idle";
  };

  const isStepRunning = (stepNumber: number) => {
    return runningStepIdx === stepNumber || (isRunningAll && stepOutputs[stepNumber]?.status === "running");
  };

  return (
    <div className="space-y-4">
      {/* Canvas Top Controls Toolbar */}
      <div className="bg-[#0b1622]/90 border border-[#16273a] backdrop-blur-md px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c49b66] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c49b66]"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-[#f5efeb]">
              DAG Flow Pipeline
            </span>
          </div>
          <span className="hidden sm:inline-block text-slate-600">|</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
            {pipeline.suggestedSteps.length} Active Nodes • Endpoints: NIM SDXL, VideoGPT, NeMo TTS
          </span>
        </div>

        {/* Global Pipeline Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunEntirePipeline}
            disabled={isRunningAll || runningStepIdx !== null}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#c49b66] to-[#a47e4f] hover:opacity-95 text-[#060c15] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#c49b66]/20 disabled:opacity-50 cursor-pointer"
          >
            {isRunningAll ? (
              <>
                <Layers className="animate-spin" size={13} />
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span>Execute Entire Flow</span>
              </>
            )}
          </button>

          <button
            onClick={onExportCode}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#060c15] hover:bg-[#16273a] border border-[#16273a] text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <Code2 size={13} className="text-[#c49b66]" />
            <span>Export SDK Code</span>
          </button>

          <button
            onClick={onAddCustomNode}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#060c15] hover:bg-[#16273a] border border-[#16273a] text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <Plus size={13} className="text-[#7ae7c7]" />
            <span>Add Branch</span>
          </button>

          <button
            onClick={onResetPipeline}
            title="Reset cached outputs"
            className="p-2 bg-[#060c15] hover:bg-[#16273a] border border-[#16273a] text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Interactive Visual Canvas */}
      <div className="relative bg-[#060c15]/95 border border-[#16273a] rounded-3xl p-6 sm:p-8 overflow-x-auto shadow-2xl min-h-[620px]">
        {/* Subtle Canvas Dot Grid Background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none rounded-3xl"
          style={{
            backgroundImage: "radial-gradient(#c49b66 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Dynamic SVG Flow Wires */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block"
          style={{ zIndex: 0 }}
        >
          <defs>
            <linearGradient id="wireGradientGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c49b66" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7ae7c7" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="wireGradientCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7ae7c7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#c49b66" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Wire: Stage 1 (Intent) -> Image Node */}
          <path
            d="M 270 260 C 330 260, 330 140, 380 140"
            fill="none"
            stroke={getNodeStatus(1) === "completed" ? "#c49b66" : "#1a2c42"}
            strokeWidth="2.5"
            strokeDasharray={isStepRunning(1) ? "6 6" : "none"}
            className={isStepRunning(1) ? "animate-pulse" : ""}
          />

          {/* Wire: Stage 1 (Intent) -> Audio Node */}
          <path
            d="M 270 280 C 330 280, 330 460, 380 460"
            fill="none"
            stroke={getNodeStatus(3) === "completed" ? "#7ae7c7" : "#1a2c42"}
            strokeWidth="2.5"
            strokeDasharray={isStepRunning(3) ? "6 6" : "none"}
            className={isStepRunning(3) ? "animate-pulse" : ""}
          />

          {/* Wire: Image Node -> Video Node */}
          <path
            d="M 640 140 C 690 140, 690 200, 720 200"
            fill="none"
            stroke={getNodeStatus(2) === "completed" ? "#c49b66" : "#1a2c42"}
            strokeWidth="2.5"
            strokeDasharray={isStepRunning(2) ? "6 6" : "none"}
            className={isStepRunning(2) ? "animate-pulse" : ""}
          />

          {/* Wire: Video Node -> Prototype Node */}
          <path
            d="M 980 200 C 1030 200, 1030 290, 1060 290"
            fill="none"
            stroke={getNodeStatus(4) === "completed" ? "#c49b66" : "#1a2c42"}
            strokeWidth="2.5"
            strokeDasharray={isStepRunning(4) ? "6 6" : "none"}
          />

          {/* Wire: Audio Node -> Prototype Node */}
          <path
            d="M 640 460 C 850 460, 950 330, 1060 330"
            fill="none"
            stroke={getNodeStatus(4) === "completed" ? "#7ae7c7" : "#1a2c42"}
            strokeWidth="2.5"
            strokeDasharray={isStepRunning(4) ? "6 6" : "none"}
          />
        </svg>

        {/* 4-Stage Column Structure */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start min-w-[950px]">
          
          {/* ==================================================== */}
          {/* STAGE 1: INTENT & MULTIMODAL PARSER NODE            */}
          {/* ==================================================== */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-[#c49b66]">
              <span className="w-5 h-5 rounded-full bg-[#c49b66]/20 text-[#c49b66] flex items-center justify-center font-mono">1</span>
              <span>Input Root</span>
            </div>

            <div className="bg-[#0b1622] border-2 border-[#16273a] hover:border-[#c49b66]/50 transition-all rounded-2xl p-5 space-y-4 shadow-xl relative">
              {/* Output connector anchor */}
              <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-[#c49b66] items-center justify-center shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#c49b66]"></div>
              </div>

              <div className="flex items-center justify-between border-b border-[#16273a] pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#c49b66]/10 text-[#c49b66]">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-display italic">Prompt Deconstructor</h4>
                    <span className="text-[9px] font-mono text-slate-400">Nemotron-4-340B</span>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>

              {/* Detected Intent Badges */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Parsed Channels</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-[#c49b66]/15 text-[#c49b66] border border-[#c49b66]/20">
                    Image NIM
                  </span>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    VideoGPT
                  </span>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-[#7ae7c7]/15 text-[#7ae7c7] border border-[#7ae7c7]/20">
                    NeMo Voice
                  </span>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    Code Studio
                  </span>
                </div>
              </div>

              {/* Prompt Text Preview */}
              <div className="p-3 bg-[#060c15] border border-[#16273a] rounded-xl text-[10px] text-slate-300 italic leading-relaxed line-clamp-4">
                "{pipeline.originalPrompt}"
              </div>

              <div className="pt-2 text-[9px] text-slate-500 flex items-center justify-between font-mono">
                <span>Total Est: {pipeline.estimatedTotalCredits} credits</span>
                <span className="text-[#c49b66]">DAG Root</span>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* STAGE 2: PARALLEL GENERATION (IMAGE & AUDIO)        */}
          {/* ==================================================== */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-[#c49b66]">
              <span className="w-5 h-5 rounded-full bg-[#c49b66]/20 text-[#c49b66] flex items-center justify-center font-mono">2</span>
              <span>Parallel Synthesis</span>
            </div>

            {/* NODE 2A: CONCEPT IMAGE NODE */}
            {imageStep && (
              <div className={`bg-[#0b1622] border-2 transition-all rounded-2xl p-4.5 space-y-3.5 shadow-xl relative ${
                isStepRunning(imageStep.stepNumber) 
                  ? "border-[#c49b66] shadow-[#c49b66]/20" 
                  : getNodeStatus(imageStep.stepNumber) === "completed"
                  ? "border-emerald-500/50"
                  : "border-[#16273a] hover:border-[#1e344e]"
              }`}>
                {/* Input anchor */}
                <div className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-[#c49b66] items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#c49b66]"></div>
                </div>
                {/* Output anchor */}
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-[#c49b66] items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#c49b66]"></div>
                </div>

                {/* Node Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-lg bg-[#c49b66]/10 text-[#c49b66]">
                      <ImageIcon size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white font-display italic">Concept Frame</h4>
                      <span className="text-[8px] font-mono text-slate-400">SDXL Turbo NIM</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isStepRunning(imageStep.stepNumber) ? "bg-[#c49b66]/20 text-[#c49b66] animate-pulse" :
                    getNodeStatus(imageStep.stepNumber) === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {getNodeStatus(imageStep.stepNumber)}
                  </span>
                </div>

                {/* Live Knob Controls */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Aspect Ratio</span>
                    <span className="text-[#c49b66] font-mono">{imageStep.presets.aspectRatio || "16:9"}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-[#060c15] p-1 rounded-lg border border-[#16273a]">
                    {["16:9", "1:1", "9:16"].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => onUpdateStepPreset(imageStep.stepNumber, "aspectRatio", ratio)}
                        className={`py-1 text-[8px] font-mono font-bold rounded cursor-pointer transition-all ${
                          (imageStep.presets.aspectRatio || "16:9") === ratio 
                            ? "bg-[#c49b66] text-[#060c15]" 
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Preview Box */}
                <div className="h-28 w-full rounded-xl bg-[#060c15] border border-[#16273a] flex items-center justify-center overflow-hidden relative">
                  {isStepRunning(imageStep.stepNumber) ? (
                    <div className="text-center space-y-1.5 animate-pulse">
                      <Layers className="text-[#c49b66] mx-auto animate-spin" size={20} />
                      <span className="text-[8px] font-mono text-slate-400">Rendering Latents...</span>
                    </div>
                  ) : stepOutputs[imageStep.stepNumber]?.outputUrl ? (
                    <img 
                      src={stepOutputs[imageStep.stepNumber].outputUrl} 
                      alt="Synthesized Frame" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackVideoFrame(imageStep.prompt);
                      }}
                    />
                  ) : (
                    <div className="text-center text-slate-600">
                      <ImageIcon size={20} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[8px] font-mono uppercase tracking-wider">Unexecuted</span>
                    </div>
                  )}

                  {stepOutputs[imageStep.stepNumber]?.latencyMs && (
                    <span className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[7px] font-mono text-[#7ae7c7]">
                      {stepOutputs[imageStep.stepNumber].latencyMs}ms
                    </span>
                  )}
                </div>

                {/* Independent Execute Button */}
                <button
                  onClick={() => onRunStep(imageStep)}
                  disabled={isStepRunning(imageStep.stepNumber) || isRunningAll}
                  className="w-full py-2 bg-[#16273a] hover:bg-[#c49b66] hover:text-[#060c15] text-slate-200 text-[9px] uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isStepRunning(imageStep.stepNumber) ? (
                    "Rendering..."
                  ) : getNodeStatus(imageStep.stepNumber) === "completed" ? (
                    <>
                      <Check size={10} />
                      <span>Re-Render Frame</span>
                    </>
                  ) : (
                    <>
                      <Play size={10} fill="currentColor" />
                      <span>Execute Node</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* NODE 2B: NEMO AUDIO SYNTHESIS NODE */}
            {audioStep && (
              <div className={`bg-[#0b1622] border-2 transition-all rounded-2xl p-4.5 space-y-3.5 shadow-xl relative ${
                isStepRunning(audioStep.stepNumber) 
                  ? "border-[#7ae7c7] shadow-[#7ae7c7]/20" 
                  : getNodeStatus(audioStep.stepNumber) === "completed"
                  ? "border-emerald-500/50"
                  : "border-[#16273a] hover:border-[#1e344e]"
              }`}>
                {/* Input anchor */}
                <div className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-[#7ae7c7] items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#7ae7c7]"></div>
                </div>
                {/* Output anchor */}
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-[#7ae7c7] items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#7ae7c7]"></div>
                </div>

                {/* Node Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-lg bg-[#7ae7c7]/10 text-[#7ae7c7]">
                      <Volume2 size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white font-display italic">NeMo Speech</h4>
                      <span className="text-[8px] font-mono text-slate-400">FastPitch & HiFi-GAN</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isStepRunning(audioStep.stepNumber) ? "bg-[#7ae7c7]/20 text-[#7ae7c7] animate-pulse" :
                    getNodeStatus(audioStep.stepNumber) === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {getNodeStatus(audioStep.stepNumber)}
                  </span>
                </div>

                {/* Live Knob Controls */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Voice Timbre</span>
                    <span className="text-[#7ae7c7] font-mono">{audioStep.presets.voiceStyle || "Charon"}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-[#060c15] p-1 rounded-lg border border-[#16273a]">
                    {["Charon", "Hestia", "Hermes"].map(voice => (
                      <button
                        key={voice}
                        onClick={() => onUpdateStepPreset(audioStep.stepNumber, "voiceStyle", voice)}
                        className={`py-1 text-[8px] font-mono font-bold rounded cursor-pointer transition-all ${
                          (audioStep.presets.voiceStyle || "Charon") === voice 
                            ? "bg-[#7ae7c7] text-[#060c15]" 
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {voice}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Output Preview Box */}
                <div className="h-16 w-full rounded-xl bg-[#060c15] border border-[#16273a] flex items-center justify-center p-2 relative">
                  {isStepRunning(audioStep.stepNumber) ? (
                    <div className="flex items-center space-x-2 text-[#7ae7c7] animate-pulse">
                      <Volume2 size={16} className="animate-bounce" />
                      <span className="text-[8px] font-mono">Synthesizing Vocoder...</span>
                    </div>
                  ) : stepOutputs[audioStep.stepNumber]?.outputUrl ? (
                    <audio 
                      controls 
                      src={stepOutputs[audioStep.stepNumber].outputUrl} 
                      className="w-full h-8"
                    />
                  ) : (
                    <div className="text-center text-slate-600">
                      <span className="text-[8px] font-mono uppercase tracking-wider">Audio Standby</span>
                    </div>
                  )}

                  {stepOutputs[audioStep.stepNumber]?.latencyMs && (
                    <span className="absolute bottom-1 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[7px] font-mono text-[#7ae7c7]">
                      {stepOutputs[audioStep.stepNumber].latencyMs}ms
                    </span>
                  )}
                </div>

                {/* Independent Execute Button */}
                <button
                  onClick={() => onRunStep(audioStep)}
                  disabled={isStepRunning(audioStep.stepNumber) || isRunningAll}
                  className="w-full py-2 bg-[#16273a] hover:bg-[#7ae7c7] hover:text-[#060c15] text-slate-200 text-[9px] uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isStepRunning(audioStep.stepNumber) ? (
                    "Generating..."
                  ) : getNodeStatus(audioStep.stepNumber) === "completed" ? (
                    <>
                      <Check size={10} />
                      <span>Re-Synthesize Audio</span>
                    </>
                  ) : (
                    <>
                      <Play size={10} fill="currentColor" />
                      <span>Execute Node</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* STAGE 3: TEMPORAL MOTION NODE (VIDEOGPT)            */}
          {/* ==================================================== */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-[#c49b66]">
              <span className="w-5 h-5 rounded-full bg-[#c49b66]/20 text-[#c49b66] flex items-center justify-center font-mono">3</span>
              <span>Motion Chaining</span>
            </div>

            {videoStep && (
              <div className={`bg-[#0b1622] border-2 transition-all rounded-2xl p-4.5 space-y-3.5 shadow-xl relative ${
                isStepRunning(videoStep.stepNumber) 
                  ? "border-amber-500 shadow-amber-500/20" 
                  : getNodeStatus(videoStep.stepNumber) === "completed"
                  ? "border-emerald-500/50"
                  : "border-[#16273a] hover:border-[#1e344e]"
              }`}>
                {/* Input anchor */}
                <div className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-amber-500 items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                </div>
                {/* Output anchor */}
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-amber-500 items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                </div>

                {/* Node Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                      <Film size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white font-display italic">Temporal Motion</h4>
                      <span className="text-[8px] font-mono text-slate-400">NVIDIA VideoGPT</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isStepRunning(videoStep.stepNumber) ? "bg-amber-500/20 text-amber-400 animate-pulse" :
                    getNodeStatus(videoStep.stepNumber) === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {getNodeStatus(videoStep.stepNumber)}
                  </span>
                </div>

                {/* Live Knob Controls */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Clip Duration</span>
                    <span className="text-amber-400 font-mono">{videoStep.presets.duration || "6s"}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-[#060c15] p-1 rounded-lg border border-[#16273a]">
                    {["3s", "6s", "10s"].map(dur => (
                      <button
                        key={dur}
                        onClick={() => onUpdateStepPreset(videoStep.stepNumber, "duration", dur)}
                        className={`py-1 text-[8px] font-mono font-bold rounded cursor-pointer transition-all ${
                          (videoStep.presets.duration || "6s") === dur 
                            ? "bg-amber-500 text-[#060c15]" 
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Motion Preview Box */}
                <div 
                  onClick={() => {
                    const url = stepOutputs[videoStep.stepNumber]?.outputUrl;
                    if (url) {
                      setVideoModalData({
                        isOpen: true,
                        title: "NVIDIA VideoGPT Dynamic Motion",
                        prompt: videoStep.prompt,
                        imageUrl: url
                      });
                    }
                  }}
                  className={`h-28 w-full rounded-xl bg-[#060c15] border border-[#16273a] flex items-center justify-center overflow-hidden relative ${
                    stepOutputs[videoStep.stepNumber]?.outputUrl ? "cursor-pointer group hover:border-amber-500/50 transition-all" : ""
                  }`}
                >
                  {isStepRunning(videoStep.stepNumber) ? (
                    <div className="text-center space-y-1.5 animate-pulse">
                      <Film className="text-amber-400 mx-auto animate-bounce" size={20} />
                      <span className="text-[8px] font-mono text-slate-400">Interpolating Frames...</span>
                    </div>
                  ) : stepOutputs[videoStep.stepNumber]?.outputUrl ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={stepOutputs[videoStep.stepNumber].outputUrl} 
                        alt="Video Motion Preview" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getFallbackVideoFrame(videoStep.prompt);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center gap-2">
                        <div className="p-2 rounded-full bg-amber-500 text-black shadow-lg group-hover:scale-110 transition-transform flex items-center gap-1 px-3 py-1.5">
                          <Play size={12} fill="currentColor" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Play Video</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-600">
                      <Film size={20} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[8px] font-mono uppercase tracking-wider">Awaiting Frame</span>
                    </div>
                  )}

                  {stepOutputs[videoStep.stepNumber]?.latencyMs && (
                    <span className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[7px] font-mono text-amber-400">
                      {stepOutputs[videoStep.stepNumber].latencyMs}ms
                    </span>
                  )}
                </div>

                {/* Independent Execute Button */}
                <button
                  onClick={() => onRunStep(videoStep)}
                  disabled={isStepRunning(videoStep.stepNumber) || isRunningAll}
                  className="w-full py-2 bg-[#16273a] hover:bg-amber-500 hover:text-[#060c15] text-slate-200 text-[9px] uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isStepRunning(videoStep.stepNumber) ? (
                    "Rendering Motion..."
                  ) : getNodeStatus(videoStep.stepNumber) === "completed" ? (
                    <>
                      <Check size={10} />
                      <span>Re-Generate Motion</span>
                    </>
                  ) : (
                    <>
                      <Play size={10} fill="currentColor" />
                      <span>Execute Node</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* STAGE 4: PROTOTYPE COMPILER / SINK NODE             */}
          {/* ==================================================== */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-[#c49b66]">
              <span className="w-5 h-5 rounded-full bg-[#c49b66]/20 text-[#c49b66] flex items-center justify-center font-mono">4</span>
              <span>Asset Packager</span>
            </div>

            {codeStep && (
              <div className={`bg-[#0b1622] border-2 transition-all rounded-2xl p-5 space-y-4 shadow-xl relative ${
                isStepRunning(codeStep.stepNumber) 
                  ? "border-blue-500 shadow-blue-500/20" 
                  : getNodeStatus(codeStep.stepNumber) === "completed"
                  ? "border-emerald-500/50"
                  : "border-[#16273a] hover:border-[#1e344e]"
              }`}>
                {/* Input anchor */}
                <div className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#060c15] border-2 border-blue-400 items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                </div>

                <div className="flex items-center justify-between border-b border-[#16273a] pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <Code size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white font-display italic">Prototype Studio</h4>
                      <span className="text-[9px] font-mono text-slate-400">Nemotron-Code-35B</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isStepRunning(codeStep.stepNumber) ? "bg-blue-500/20 text-blue-400 animate-pulse" :
                    getNodeStatus(codeStep.stepNumber) === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {getNodeStatus(codeStep.stepNumber)}
                  </span>
                </div>

                <div className="p-3 bg-[#060c15] border border-[#16273a] rounded-xl space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    Integrated Inputs
                  </span>
                  <div className="text-[9px] text-slate-300 space-y-1 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className={getNodeStatus(1) === "completed" ? "text-emerald-400" : "text-slate-600"}>●</span>
                      <span>Concept Image Texture</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={getNodeStatus(2) === "completed" ? "text-emerald-400" : "text-slate-600"}>●</span>
                      <span>Video Loop Keyframes</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={getNodeStatus(3) === "completed" ? "text-emerald-400" : "text-slate-600"}>●</span>
                      <span>NeMo Speech Narration</span>
                    </div>
                  </div>
                </div>

                {/* Compile Button */}
                <button
                  onClick={() => onRunStep(codeStep)}
                  disabled={isStepRunning(codeStep.stepNumber) || isRunningAll}
                  className="w-full py-2.5 bg-[#16273a] hover:bg-blue-600 text-white text-[9px] uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isStepRunning(codeStep.stepNumber) ? (
                    "Compiling Bundle..."
                  ) : getNodeStatus(codeStep.stepNumber) === "completed" ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span>Bundle Ready</span>
                    </>
                  ) : (
                    <>
                      <Code size={11} />
                      <span>Compile Prototype Node</span>
                    </>
                  )}
                </button>

                {onOpenProtoStudio && (
                  <button
                    onClick={onOpenProtoStudio}
                    className="w-full py-2 bg-[#060c15] hover:bg-[#16273a] border border-[#16273a] text-slate-300 hover:text-white text-[9px] uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open in Code Studio</span>
                    <ExternalLink size={10} />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Video Player & Download Modal */}
      <VideoPlayerModal
        isOpen={videoModalData.isOpen}
        onClose={() => setVideoModalData(prev => ({ ...prev, isOpen: false }))}
        title={videoModalData.title}
        prompt={videoModalData.prompt}
        imageUrl={videoModalData.imageUrl}
      />
    </div>
  );
}
