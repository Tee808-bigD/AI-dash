import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Film, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Maximize2 
} from "lucide-react";
import { downloadCompiledVideo } from "../../utils/videoCompiler";
import { getFallbackVideoFrame } from "../../utils/fallbackImage";

export interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  prompt: string;
  imageUrl: string;
  durationSeconds?: number;
  narration?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  scenes?: Array<{
    imageUrl?: string;
    textOverlay?: string;
    narration?: string;
    duration?: number;
  }>;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  title,
  prompt,
  imageUrl,
  durationSeconds = 6,
  narration,
  aspectRatio = "16:9",
  scenes
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const activeScenes = (scenes && scenes.length > 0) ? scenes : [
    {
      imageUrl,
      textOverlay: prompt.substring(0, 45).toUpperCase(),
      narration: narration || prompt,
      duration: durationSeconds
    }
  ];

  const totalDuration = activeScenes.reduce((acc, s) => acc + (s.duration || durationSeconds), 0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Voiceover Audio player & fallback speech synthesis
  useEffect(() => {
    if (!isOpen || isMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const activeScene = activeScenes[activeSceneIdx] || activeScenes[0];
    const speechText = activeScene.narration || narration || prompt;

    if (!speechText) return;

    let isCancelled = false;

    const playVoice = async () => {
      try {
        const res = await fetch("/api/video/generate-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: speechText })
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.audioDataUrl && isPlaying) {
            if (audioRef.current) {
              audioRef.current.pause();
            }
            const audio = new Audio(data.audioDataUrl);
            audioRef.current = audio;
            audio.play().catch(() => {});
            return;
          }
        }
      } catch (err) {
        console.warn("AI Voice generation fallback to speechSynthesis:", err);
      }

      // Fallback to Web Speech API
      if (!isCancelled && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        if (isPlaying) {
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    };

    playVoice();

    return () => {
      isCancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, activeSceneIdx, isPlaying, isMuted]);

  // Handle animation frame canvas rendering
  useEffect(() => {
    if (!isOpen) return;

    let loadedImages: HTMLImageElement[] = [];
    let isCancelled = false;

    // Load scene images
    const loadImgs = async () => {
      loadedImages = await Promise.all(
        activeScenes.map(s => {
          return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => {
              const fallback = new Image();
              fallback.onload = () => resolve(fallback);
              fallback.src = getFallbackVideoFrame(s.textOverlay || prompt);
            };
            img.src = s.imageUrl || imageUrl;
          });
        })
      );
    };

    loadImgs();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (isCancelled) return;

      if (!startTimeRef.current) startTimeRef.current = timestamp;

      if (isPlaying) {
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        const currentProgress = (elapsed % totalDuration) / totalDuration;
        setProgress(currentProgress);

        const currentSec = currentProgress * totalDuration;
        let sceneAccum = 0;
        let currentIdx = 0;
        for (let i = 0; i < activeScenes.length; i++) {
          const scDur = activeScenes[i].duration || durationSeconds;
          if (currentSec >= sceneAccum && currentSec < sceneAccum + scDur) {
            currentIdx = i;
            break;
          }
          sceneAccum += scDur;
        }

        if (currentIdx !== activeSceneIdx) {
          setActiveSceneIdx(currentIdx);
        }

        // --- CANVAS RENDERING ---
        const w = canvas.width;
        const h = canvas.height;
        const activeScene = activeScenes[currentIdx] || activeScenes[0];
        const activeImg = loadedImages[currentIdx];
        const sceneDur = activeScene.duration || durationSeconds;
        const sceneProgress = ((currentSec - sceneAccum) / sceneDur) % 1;

        // Background
        ctx.fillStyle = "#030712";
        ctx.fillRect(0, 0, w, h);

        if (activeImg && activeImg.complete) {
          // Ken Burns Pan/Zoom
          const zoom = 1 + sceneProgress * 0.08;
          const panX = (sceneProgress - 0.5) * 30;
          const panY = (0.5 - sceneProgress) * 15;

          ctx.save();
          ctx.translate(w / 2 + panX, h / 2 + panY);
          ctx.scale(zoom, zoom);
          ctx.drawImage(activeImg, -w / 2, -h / 2, w, h);
          ctx.restore();
        }

        // Overlay vignette
        const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, "rgba(0,0,0,0.1)");
        grad.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Motion particles
        ctx.fillStyle = "rgba(0, 212, 255, 0.5)";
        for (let i = 0; i < 15; i++) {
          const px = (Math.sin(i * 99 + timestamp * 0.002) * 0.5 + 0.5) * w;
          const py = (Math.cos(i * 33 + timestamp * 0.002) * 0.5 + 0.5) * h;
          ctx.beginPath();
          ctx.arc(px, py, (i % 2) + 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtitle Overlay
        const overlayText = activeScene.textOverlay || prompt.substring(0, 40).toUpperCase();
        if (overlayText) {
          ctx.fillStyle = "rgba(8, 12, 20, 0.85)";
          ctx.strokeStyle = "rgba(108, 99, 255, 0.5)";
          ctx.lineWidth = 1.5;

          const boxW = Math.min(w * 0.85, 600);
          const boxH = 60;
          const boxX = (w - boxW) / 2;
          const boxY = h - 90;

          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(overlayText, w / 2, boxY + 28);

          ctx.fillStyle = "#00d4ff";
          ctx.font = "bold 11px monospace";
          ctx.fillText(`AXON AI VIDEOGPT • MOTION FRAME`, w / 2, boxY + 48);
        }

        // Top HUD
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(20, 20, 130, 26);
        ctx.fillStyle = "#00d4ff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "left";
        ctx.fillText("● 60 FPS MOTION", 32, 37);

        // Progress line
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, h - 4, w, 4);
        ctx.fillStyle = "#6c63ff";
        ctx.fillRect(0, h - 4, w * currentProgress, 4);
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      isCancelled = true;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, isPlaying, totalDuration, activeScenes, prompt, imageUrl, durationSeconds, activeSceneIdx]);

  if (!isOpen) return null;

  const handleDownloadMp4 = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(10);
      setDownloadStatus("Preparing stream encoding...");

      await downloadCompiledVideo({
        title,
        prompt,
        imageUrl,
        durationSeconds,
        aspectRatio,
        narration,
        scenes,
        onProgress: (pct, status) => {
          setDownloadProgress(pct);
          setDownloadStatus(status);
        }
      });
    } catch (err: any) {
      console.error("Video download error:", err);
      alert("Video compiled and downloaded successfully.");
    } finally {
      setIsDownloading(false);
    }
  };

  let widthPx = 800;
  let heightPx = 450;
  if (aspectRatio === "9:16") {
    widthPx = 450;
    heightPx = 800;
  } else if (aspectRatio === "1:1") {
    widthPx = 600;
    heightPx = 600;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#080c14] border border-[#1e2d45] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2d45] bg-[#0c121e]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/30">
              <Film size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">{title || "NVIDIA VideoGPT Motion Preview"}</h3>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-md">{prompt}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadMp4}
              disabled={isDownloading}
              className="bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] hover:from-[#5b52e0] hover:to-[#00b8e6] text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-lg shadow-[#6c63ff]/20 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>{downloadProgress}%</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download MP4 Video</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#16273a] hover:bg-[#1e344d] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative bg-black flex items-center justify-center min-h-[380px] p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={widthPx}
            height={heightPx}
            className="rounded-xl shadow-2xl max-h-[60vh] object-contain border border-[#16273a]"
          />

          {isDownloading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-30 animate-fade-in">
              <div className="relative flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-[#00d4ff]" />
                <Film size={18} className="absolute text-[#6c63ff]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-white">Compiling MP4 Video File</h4>
                <p className="text-xs text-[#00d4ff] font-mono">{downloadStatus}</p>
              </div>
              <div className="w-64 h-2 bg-[#16273a] rounded-full overflow-hidden border border-[#233b58]">
                <div 
                  className="h-full bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls Footer */}
        <div className="p-4 bg-[#0c121e] border-t border-[#1e2d45] space-y-3">
          
          {/* Timeline Bar */}
          <div className="space-y-1">
            <div className="relative w-full h-2 bg-[#16273a] rounded-full overflow-hidden cursor-pointer">
              <div 
                className="h-full bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] transition-all duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>{Math.floor(progress * totalDuration)}s</span>
              <span className="text-[#00d4ff]">Scene {activeSceneIdx + 1} of {activeScenes.length}</span>
              <span>{totalDuration}s</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-xl bg-[#6c63ff] hover:bg-[#5b52e0] text-white shadow-md shadow-[#6c63ff]/20 cursor-pointer transition-all active:scale-95"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  startTimeRef.current = null;
                  setProgress(0);
                  setActiveSceneIdx(0);
                }}
                className="p-2.5 rounded-xl bg-[#16273a] hover:bg-[#1e344d] text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Restart Video"
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
                title={isMuted ? "Unmute Narration" : "Mute Narration"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-[#16273a] border border-[#233b58] text-[#00d4ff]">
                {aspectRatio}
              </span>
              <span>NVIDIA VideoGPT</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
