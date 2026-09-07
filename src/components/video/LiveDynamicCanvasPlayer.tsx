import React, { useRef, useEffect } from "react";
import { 
  calculateCameraTransform, 
  renderAtmosphericVfx, 
  applyColorGradeLut, 
  renderSceneTransition, 
  renderLetterboxCinemascope 
} from "./dynamicVideoEngine";
import { DynamicMotionConfig, VoiceAvatar } from "./types";

interface LiveDynamicCanvasPlayerProps {
  imageUrl?: string;
  nextImageUrl?: string;
  sceneNumber: number;
  totalScenes: number;
  cameraMotionLabel?: string;
  narrationText?: string;
  textOverlay?: string;
  aspectRatio: "9:16" | "16:9" | "1:1";
  isPlaying: boolean;
  progress: number; // 0 to 100 representing playback timeline
  sceneProgress: number; // 0 to 1 representing progress in current scene
  selectedAvatar: VoiceAvatar;
  dynamicConfig: DynamicMotionConfig;
  liveMotionActive: boolean;
}

export default function LiveDynamicCanvasPlayer({
  imageUrl,
  nextImageUrl,
  sceneNumber,
  totalScenes,
  cameraMotionLabel,
  narrationText,
  textOverlay,
  aspectRatio,
  isPlaying,
  progress,
  sceneProgress,
  selectedAvatar,
  dynamicConfig,
  liveMotionActive
}: LiveDynamicCanvasPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Cache loaded active image
  useEffect(() => {
    if (!imageUrl) {
      activeImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      activeImageRef.current = img;
    };
  }, [imageUrl]);

  // Canvas dimensions based on aspect ratio
  const width = aspectRatio === "9:16" ? 360 : aspectRatio === "1:1" ? 480 : 640;
  const height = aspectRatio === "9:16" ? 640 : aspectRatio === "1:1" ? 480 : 360;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;

      ctx.clearRect(0, 0, width, height);

      // 1. Render Background Image with Dynamic Camera Motion
      if (activeImageRef.current && activeImageRef.current.complete) {
        ctx.save();

        if (liveMotionActive) {
          const transform = calculateCameraTransform(
            dynamicConfig.cameraMotion,
            sceneProgress,
            elapsedMs,
            width,
            height,
            dynamicConfig.motionIntensity
          );

          // Center-anchored zoom & rotate
          ctx.translate(width / 2 + transform.dx, height / 2 + transform.dy);
          if (transform.rotation !== 0) {
            ctx.rotate(transform.rotation);
          }
          ctx.scale(transform.scale, transform.scale);
          ctx.drawImage(
            activeImageRef.current,
            -width / 2,
            -height / 2,
            width,
            height
          );
        } else {
          // Static fallback cover
          ctx.drawImage(activeImageRef.current, 0, 0, width, height);
        }

        ctx.restore();
      } else {
        // Dark placeholder gradient if image loading
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, "#07080d");
        bgGrad.addColorStop(1, "#0f111a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "rgba(165, 180, 252, 0.4)";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Synthesizing neural frame...", width / 2, height / 2);
      }

      // 2. Scene Bottom Readability Vignette
      const vignette = ctx.createLinearGradient(0, height * 0.45, 0, height);
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(0.3, "rgba(0, 0, 0, 0.4)");
      vignette.addColorStop(0.8, "rgba(0, 0, 0, 0.85)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.95)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);

      // 3. Apply Atmospheric Particles & Lighting Layers
      if (liveMotionActive) {
        renderAtmosphericVfx(
          ctx,
          width,
          height,
          elapsedMs,
          dynamicConfig.atmosphericVfx,
          dynamicConfig.vfxIntensity
        );
      }

      // 4. Apply Color Grading LUT
      applyColorGradeLut(ctx, width, height, dynamicConfig.colorLut);

      // 5. Scene Boundary Transition Blend
      if (liveMotionActive && sceneProgress > 0.85) {
        const transP = (sceneProgress - 0.85) / 0.15;
        renderSceneTransition(ctx, width, height, dynamicConfig.transitionEffect, transP);
      }

      // 6. Letterbox Cinemascope (if enabled)
      if (dynamicConfig.letterboxCinemascope) {
        renderLetterboxCinemascope(ctx, width, height);
      }

      // 7. Kinetic Captions Overlay
      if (narrationText) {
        const words = narrationText.split(/\s+/).filter(Boolean);
        const currentWordIdx = Math.min(
          Math.floor(sceneProgress * words.length * 1.05),
          words.length - 1
        );

        ctx.save();
        const fontSize = Math.max(11, Math.round(width / 32));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";

        const textY = height - (aspectRatio === "9:16" ? 64 : 42);

        // Subtitle badge container
        const displayText = words.join(" ");
        const metrics = ctx.measureText(displayText);
        const boxWidth = Math.min(width - 32, metrics.width + 24);
        const boxHeight = fontSize + 16;
        const boxX = (width - boxWidth) / 2;
        const boxY = textY - fontSize;

        ctx.fillStyle = "rgba(7, 8, 13, 0.75)";
        ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.stroke();

        // Render words with dynamic highlight
        const activeWord = words[currentWordIdx] || "";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        
        // Truncate cleanly if string is long for small canvas
        let line = "";
        const maxLineWidth = boxWidth - 16;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + (line ? " " : "") + words[i];
          if (ctx.measureText(testLine).width > maxLineWidth && i > 0) {
            line = "... " + words.slice(Math.max(0, currentWordIdx - 2), currentWordIdx + 3).join(" ");
            break;
          }
          line = testLine;
        }

        ctx.fillText(`"${line}"`, width / 2, textY);
        ctx.restore();
      }

      // Loop animation
      if (liveMotionActive) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    imageUrl,
    sceneProgress,
    aspectRatio,
    liveMotionActive,
    dynamicConfig,
    narrationText,
    width,
    height
  ]);

  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-indigo-500/25 bg-black shadow-2xl">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block max-h-[440px] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
      />

      {/* Top Left Scene Badge */}
      <div className="absolute top-3 left-3 flex items-center space-x-1.5 rounded-full border border-indigo-500/25 bg-[#07080d]/95 px-2.5 py-1 text-[9px] font-black text-white shadow-lg backdrop-blur-md">
        <span className={`h-1.5 w-1.5 rounded-full bg-indigo-400 ${isPlaying ? "animate-ping" : ""}`} />
        <span className="font-mono uppercase tracking-widest">
          SCENE {sceneNumber} / {totalScenes}
        </span>
      </div>

      {/* Top Right Camera Motion HUD indicator */}
      <div className="absolute top-3 right-3 flex items-center space-x-1 rounded border border-indigo-500/20 bg-[#07080d]/90 px-2 py-0.5 text-[8px] font-mono font-bold text-indigo-300 shadow-md backdrop-blur-md uppercase tracking-wider">
        <span>🎥</span>
        <span>{cameraMotionLabel || dynamicConfig.cameraMotion.replace(/_/g, " ")}</span>
      </div>

      {/* Bottom Left Avatar Mini-Badge */}
      <div className="absolute bottom-3 left-3 flex items-center space-x-2 rounded-full border border-indigo-500/20 bg-[#07080d]/95 py-1 px-2.5 shadow-lg backdrop-blur-md">
        <span className="text-sm">{selectedAvatar.avatarIcon}</span>
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">
            {selectedAvatar.name}
          </span>
          <span className="text-[6px] text-indigo-400 font-mono uppercase tracking-widest font-bold">
            {isPlaying ? "Voice Syncing" : "AI Narrator"}
          </span>
        </div>
        {isPlaying && (
          <div className="flex items-end gap-[1.5px] h-3 pl-1 border-l border-indigo-500/20">
            <span className="w-[1.5px] bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_0.1s]" style={{ height: "40%" }} />
            <span className="w-[1.5px] bg-purple-400 rounded-full animate-[bounce_0.6s_infinite_0.3s]" style={{ height: "90%" }} />
            <span className="w-[1.5px] bg-pink-400 rounded-full animate-[bounce_0.6s_infinite_0.2s]" style={{ height: "60%" }} />
          </div>
        )}
      </div>

      {/* Top Center Active Concept Header */}
      {textOverlay && (
        <div className="absolute top-10 inset-x-4 pointer-events-none flex justify-center text-center">
          <div className="bg-[#07080d]/85 border border-indigo-500/20 px-3 py-1 rounded-full backdrop-blur-xs shadow-md">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300">
              {textOverlay}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
