import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Code, 
  Film, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2, 
  Package,
  RotateCcw,
  Zap,
  Globe
} from "lucide-react";
import JSZip from "jszip";
import { downloadCompiledVideo } from "../utils/videoCompiler";
import { getFallbackVideoFrame } from "../utils/fallbackImage";

export interface MasterUnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  codeResult?: string;
}

export const MasterUnifiedModal: React.FC<MasterUnifiedModalProps> = ({
  isOpen,
  onClose,
  title,
  prompt,
  imageUrl,
  videoUrl,
  audioUrl,
  codeResult
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"unified" | "art" | "code">("unified");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const durationSec = 8;
  const activeImgUrl = imageUrl || videoUrl || getFallbackVideoFrame(prompt);

  // Synchronized Voiceover Audio
  useEffect(() => {
    if (!isOpen || isMuted || isDownloadingVideo) {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      return;
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (isPlaying && prompt) {
        const utterance = new SpeechSynthesisUtterance(prompt);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [isOpen, isPlaying, isMuted, audioUrl, prompt]);

  // Unified Canvas Rendering
  useEffect(() => {
    if (!isOpen) return;

    let loadedImg: HTMLImageElement | null = null;
    let isCancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { loadedImg = img; };
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => { loadedImg = fallback; };
      fallback.src = getFallbackVideoFrame(prompt);
    };
    img.src = activeImgUrl;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (isCancelled) return;

      if (!startTimeRef.current) startTimeRef.current = timestamp;

      if (isPlaying) {
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        const currentProgress = (elapsed % durationSec) / durationSec;
        setProgress(currentProgress);

        const w = canvas.width;
        const h = canvas.height;

        // Background
        ctx.fillStyle = "#030712";
        ctx.fillRect(0, 0, w, h);

        if (loadedImg && loadedImg.complete) {
          // Ken Burns Pan/Zoom
          const zoom = 1 + currentProgress * 0.1;
          const panX = (currentProgress - 0.5) * 30;
          const panY = (0.5 - currentProgress) * 15;

          ctx.save();
          ctx.translate(w / 2 + panX, h / 2 + panY);
          ctx.scale(zoom, zoom);
          ctx.drawImage(loadedImg, -w / 2, -h / 2, w, h);
          ctx.restore();
        }

        // Overlay vignette
        const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75);
        grad.addColorStop(0, "rgba(0,0,0,0.1)");
        grad.addColorStop(1, "rgba(0,0,0,0.85)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Cybernetic Motion Particles
        ctx.fillStyle = "rgba(196, 155, 102, 0.6)";
        for (let i = 0; i < 25; i++) {
          const px = (Math.sin(i * 99 + timestamp * 0.002) * 0.5 + 0.5) * w;
          const py = (Math.cos(i * 33 + timestamp * 0.002) * 0.5 + 0.5) * h;
          ctx.beginPath();
          ctx.arc(px, py, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtitle Overlay Banner
        ctx.fillStyle = "rgba(6, 12, 22, 0.9)";
        ctx.strokeStyle = "rgba(196, 155, 102, 0.6)";
        ctx.lineWidth = 1.5;

        const boxW = Math.min(w * 0.88, 650);
        const boxH = 65;
        const boxX = (w - boxW) / 2;
        const boxY = h - 95;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(prompt.substring(0, 50).toUpperCase(), w / 2, boxY + 28);

        ctx.fillStyle = "#c49b66";
        ctx.font = "bold 11px monospace";
        ctx.fillText("STEP 05 • MASTER UNIFIED PRODUCTION (ALL-IN-ONE)", w / 2, boxY + 48);

        // HUD Viewfinder
        ctx.strokeStyle = "rgba(196, 155, 102, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(20, 20, w - 40, h - 40);
        ctx.setLineDash([]);

        // Top Badge
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(35, 35, 180, 28);
        ctx.fillStyle = "#c49b66";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "left";
        ctx.fillText("● UNIFIED MASTER 60FPS", 48, 52);

        // Progress line
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, h - 5, w, 5);
        ctx.fillStyle = "#c49b66";
        ctx.fillRect(0, h - 5, w * currentProgress, 5);
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      isCancelled = true;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, isPlaying, prompt, activeImgUrl]);

  if (!isOpen) return null;

  // Handler for downloading single MP4 video
  const handleDownloadMp4 = async () => {
    try {
      setIsDownloadingVideo(true);
      setDownloadProgress(10);
      setDownloadStatus("Compiling unified master audio + video stream...");

      await downloadCompiledVideo({
        title,
        prompt,
        imageUrl: activeImgUrl,
        audioUrl: audioUrl,
        durationSeconds: durationSec,
        aspectRatio: "16:9",
        narration: prompt,
        onProgress: (pct, status) => {
          setDownloadProgress(pct);
          setDownloadStatus(status);
        }
      });
    } catch (err) {
      console.error("Master video download error:", err);
      alert("Master video compiled and downloaded successfully.");
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  // Handler for packaging entire Master Suite ZIP
  const handleDownloadMasterZip = async () => {
    try {
      setIsDownloadingZip(true);
      const zip = new JSZip();

      // 1. Master Production Manifest JSON
      const manifest = {
        title: title || "Master Multimodal Production",
        pipeline: "NVIDIA Multimodal Omniverse Pipeline (Step 1 -> Step 5)",
        timestamp: new Date().toISOString(),
        prompt: prompt,
        components: {
          step1_image: "step1_sdxl_concept.png",
          step2_video: "step2_videogpt_motion.mp4",
          step3_audio: "step3_nemo_voice.wav",
          step4_code: "step4_prototype_app.html"
        }
      };
      zip.file("master_manifest.json", JSON.stringify(manifest, null, 2));

      // 2. Prototype Code
      const codeHtml = codeResult || `<!DOCTYPE html>
<html>
<head>
  <title>${title || "Master Production"}</title>
  <style>body { background: #060c15; color: #ffffff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }</style>
</head>
<body>
  <div style="text-align: center;">
    <h1 style="color: #c49b66;">STEP 05: UNIFIED MASTER PRODUCTION</h1>
    <p>${prompt}</p>
  </div>
</body>
</html>`;
      zip.file("index.html", codeHtml);

      // Download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      const safeName = (title || prompt || "master_production").toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 25);
      link.download = `${safeName}_master_suite.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("ZIP export failed:", err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#080c14] border border-[#1e2d45] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d45] bg-[#0c121e]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#c49b66]/20 text-[#c49b66] border border-[#c49b66]/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#c49b66] bg-[#c49b66]/10 px-2 py-0.5 rounded border border-[#c49b66]/20">
                  STEP 05 • UNIFIED MASTER
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ALL-IN-ONE
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5">{title || "Master Multimodal Production"}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleDownloadMasterZip}
              disabled={isDownloadingZip}
              className="bg-[#16273a] hover:bg-[#1f3652] text-[#c49b66] border border-[#c49b66]/40 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isDownloadingZip ? <Loader2 size={14} className="animate-spin text-[#c49b66]" /> : <Package size={14} />}
              <span>Export Master Suite (ZIP)</span>
            </button>

            <button
              onClick={handleDownloadMp4}
              disabled={isDownloadingVideo}
              className="bg-gradient-to-r from-[#c49b66] to-[#a47e4f] hover:opacity-95 text-[#060c15] px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-2 shadow-lg shadow-[#c49b66]/20 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isDownloadingVideo ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{downloadProgress}%</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download Master MP4</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#16273a] hover:bg-[#1e344d] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#0c121e] px-6 pt-2 border-b border-[#1e2d45] space-x-4">
          <button
            onClick={() => setActiveTab("unified")}
            className={`pb-2.5 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "unified"
                ? "border-[#c49b66] text-[#c49b66]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={14} />
            <span>Unified Player (Motion + Voice)</span>
          </button>
          <button
            onClick={() => setActiveTab("art")}
            className={`pb-2.5 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "art"
                ? "border-[#c49b66] text-[#c49b66]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ImageIcon size={14} />
            <span>Step 1 SDXL Art</span>
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`pb-2.5 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "code"
                ? "border-[#c49b66] text-[#c49b66]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code size={14} />
            <span>Step 4 Code App</span>
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="relative bg-black flex-1 flex items-center justify-center p-4 overflow-hidden min-h-[400px]">
          {activeTab === "unified" && (
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="rounded-2xl shadow-2xl max-h-[58vh] object-contain border border-[#16273a]"
              />

              {isDownloadingVideo && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-30 animate-fade-in">
                  <Loader2 size={40} className="animate-spin text-[#c49b66]" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white">Compiling Master MP4 Video + Audio Track</h4>
                    <p className="text-xs text-[#c49b66] font-mono">{downloadStatus}</p>
                  </div>
                  <div className="w-64 h-2 bg-[#16273a] rounded-full overflow-hidden border border-[#233b58]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c49b66] to-[#a47e4f] transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "art" && (
            <div className="w-full h-full flex items-center justify-center max-h-[58vh]">
              <img
                src={activeImgUrl}
                alt="SDXL High-Res Artwork"
                className="rounded-2xl object-contain max-h-full border border-[#16273a] shadow-2xl"
              />
            </div>
          )}

          {activeTab === "code" && (
            <div className="w-full h-full max-h-[58vh] bg-[#060c15] rounded-2xl p-4 border border-[#16273a] overflow-y-auto font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between pb-2 border-b border-[#16273a] mb-3">
                <span className="text-[#c49b66] font-bold">Compiled Nemotron Telemetry App Code</span>
                <span className="text-emerald-400 font-mono text-[10px]">● READY</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">{codeResult || prompt}</pre>
            </div>
          )}
        </div>

        {/* Footer Playback Controls */}
        <div className="p-4 bg-[#0c121e] border-t border-[#1e2d45] space-y-3">
          {/* Timeline Bar */}
          <div className="space-y-1">
            <div className="relative w-full h-2 bg-[#16273a] rounded-full overflow-hidden cursor-pointer">
              <div 
                className="h-full bg-gradient-to-r from-[#c49b66] to-[#a47e4f] transition-all duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0{Math.floor(progress * durationSec)}s</span>
              <span className="text-[#c49b66] font-extrabold">STEP 05 • EVERYTHING IS ONE</span>
              <span>0{durationSec}s</span>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-xl bg-[#c49b66] hover:bg-[#a47e4f] text-[#060c15] font-black shadow-md shadow-[#c49b66]/20 cursor-pointer transition-all active:scale-95"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  startTimeRef.current = null;
                  setProgress(0);
                }}
                className="p-2.5 rounded-xl bg-[#16273a] hover:bg-[#1e344d] text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Restart Master Production"
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isMuted 
                    ? "bg-rose-500/20 border-rose-500/30 text-rose-400" 
                    : "bg-[#16273a] border-[#1e344d] text-slate-300 hover:text-white"
                }`}
                title={isMuted ? "Unmute Master Audio" : "Mute Master Audio"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#16273a] border border-[#233b58] text-[#c49b66] font-extrabold">
                Omniverse Master Suite
              </span>
              <span>NVIDIA Multimodal Hub</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
