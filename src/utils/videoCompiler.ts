// Utility to compile animated canvas video frames into a downloadable MP4/WebM file with full audio

export interface VideoCompileOptions {
  title: string;
  prompt: string;
  imageUrl: string;
  durationSeconds?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  narration?: string;
  scenes?: Array<{
    imageUrl?: string;
    textOverlay?: string;
    narration?: string;
    duration?: number;
  }>;
  onProgress?: (progressPct: number, statusText: string) => void;
}

// Helper to synthesize atmospheric cinematic background pad
function addAmbientSoundtrack(audioCtx: AudioContext, destination: MediaStreamAudioDestinationNode, durationSec: number) {
  const freqs = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4
  freqs.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = idx % 2 === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350 + idx * 80, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + durationSec);
  });
}

// Helper to fetch voice narration audio and route to Web Audio stream
async function attachVoiceToDestination(
  audioCtx: AudioContext,
  destination: MediaStreamAudioDestinationNode,
  text: string,
  delaySec: number
): Promise<void> {
  if (!text || !text.trim()) return;

  try {
    const res = await fetch("/api/video/generate-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioDataUrl) {
        const audioRes = await fetch(data.audioDataUrl);
        const arrayBuffer = await audioRes.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.9, audioCtx.currentTime);

        source.connect(gain);
        gain.connect(destination);

        source.start(audioCtx.currentTime + delaySec);
      }
    }
  } catch (err) {
    console.warn("Could not attach voice narration to stream:", err);
  }
}

export async function downloadCompiledVideo(options: VideoCompileOptions): Promise<void> {
  const {
    title,
    prompt,
    imageUrl,
    durationSeconds = 6,
    aspectRatio = "16:9",
    narration = prompt,
    scenes,
    onProgress
  } = options;

  // Dimensions
  let width = 1280;
  let height = 720;
  if (aspectRatio === "9:16") {
    width = 720;
    height = 1280;
  } else if (aspectRatio === "1:1") {
    width = 800;
    height = 800;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context");
  }

  // Prep scenes list
  const activeScenes = (scenes && scenes.length > 0) ? scenes : [
    {
      imageUrl,
      textOverlay: prompt.substring(0, 45).toUpperCase(),
      narration,
      duration: durationSeconds
    }
  ];

  // Helper to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect width="${width}" height="${height}" fill="#0a0f1d"/>
            <circle cx="${width/2}" cy="${height/2}" r="180" fill="#6c63ff" opacity="0.15"/>
            <text x="${width/2}" y="${height/2 - 20}" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">NVIDIA VIDEOGPT</text>
            <text x="${width/2}" y="${height/2 + 20}" font-family="sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">${prompt.replace(/[<>&'"]/g, "").substring(0, 50)}</text>
          </svg>`
        )}`;
      };
      img.src = src;
    });
  };

  if (onProgress) onProgress(10, "Loading visual scene assets...");

  const loadedImages: HTMLImageElement[] = await Promise.all(
    activeScenes.map(s => loadImage(s.imageUrl || imageUrl))
  );

  if (onProgress) onProgress(20, "Synthesizing AI Voiceover & Audio Stream...");

  // Setup Web Audio Context for audio tracks
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtxClass();
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const audioDest = audioCtx.createMediaStreamDestination();

  // Total duration & FPS
  const fps = 30;
  const totalDurationSec = activeScenes.reduce((acc, s) => acc + (s.duration || durationSeconds), 0);

  // 1. Add background ambient music track
  addAmbientSoundtrack(audioCtx, audioDest, totalDurationSec);

  // 2. Attach voice narrations for all scenes
  let timeOffset = 0.2;
  for (const scene of activeScenes) {
    const speechText = scene.narration || narration || prompt;
    await attachVoiceToDestination(audioCtx, audioDest, speechText, timeOffset);
    timeOffset += (scene.duration || durationSeconds);
  }

  if (onProgress) onProgress(35, "Initializing MediaRecorder video + audio stream...");

  // Combine Canvas Video Track + Web Audio Track
  const videoTrack = canvas.captureStream(30).getVideoTracks()[0];
  const audioTrack = audioDest.stream.getAudioTracks()[0];

  const combinedStream = new MediaStream([videoTrack, audioTrack]);

  // Choose supported MIME type
  let mimeType = "video/webm;codecs=vp9,opus";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm;codecs=vp8,opus";
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm";
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/mp4";
  }

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, { mimeType });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  recorder.start(100);

  const totalFrames = Math.max(fps * 2, Math.round(totalDurationSec * fps));
  let frameIndex = 0;

  return new Promise<void>((resolve, reject) => {
    const renderLoop = setInterval(() => {
      try {
        const progressPct = frameIndex / totalFrames;
        const currentTotalSec = progressPct * totalDurationSec;

        // Find active scene
        let sceneAccum = 0;
        let activeSceneIdx = 0;
        for (let i = 0; i < activeScenes.length; i++) {
          const scDur = activeScenes[i].duration || durationSeconds;
          if (currentTotalSec >= sceneAccum && currentTotalSec < sceneAccum + scDur) {
            activeSceneIdx = i;
            break;
          }
          sceneAccum += scDur;
        }

        const activeScene = activeScenes[activeSceneIdx] || activeScenes[0];
        const activeImg = loadedImages[activeSceneIdx] || loadedImages[0];
        const sceneDur = activeScene.duration || durationSeconds;
        const sceneLocalProgress = ((currentTotalSec - sceneAccum) / sceneDur) % 1;

        // --- DRAW FRAME ---
        // 1. Dark Background
        ctx.fillStyle = "#060a12";
        ctx.fillRect(0, 0, width, height);

        // 2. Ken Burns Camera Zoom / Pan Effect
        const zoom = 1 + sceneLocalProgress * 0.12;
        const panX = (sceneLocalProgress - 0.5) * 40;
        const panY = (0.5 - sceneLocalProgress) * 20;

        ctx.save();
        ctx.translate(width / 2 + panX, height / 2 + panY);
        ctx.scale(zoom, zoom);
        
        if (activeImg.complete && activeImg.naturalWidth > 0) {
          ctx.drawImage(activeImg, -width / 2, -height / 2, width, height);
        } else {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(-width / 2, -height / 2, width, height);
        }
        ctx.restore();

        // 3. Cinematic Vignette
        const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.75);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.75)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 4. Subtle Motion Particles
        ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
        for (let p = 0; p < 20; p++) {
          const px = (Math.sin(p * 99 + frameIndex * 0.05) * 0.5 + 0.5) * width;
          const py = (Math.cos(p * 33 + frameIndex * 0.05) * 0.5 + 0.5) * height;
          ctx.beginPath();
          ctx.arc(px, py, (p % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5. Title & Subtitle Banner
        const textOverlay = activeScene.textOverlay || prompt.substring(0, 40).toUpperCase();
        if (textOverlay) {
          ctx.fillStyle = "rgba(6, 12, 22, 0.85)";
          ctx.strokeStyle = "rgba(108, 99, 255, 0.4)";
          ctx.lineWidth = 2;
          
          const bannerW = Math.min(width * 0.8, 700);
          const bannerH = 70;
          const bannerX = (width - bannerW) / 2;
          const bannerY = height - 120;

          ctx.beginPath();
          ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.round(bannerH * 0.28)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(textOverlay, width / 2, bannerY + 30);

          ctx.fillStyle = "#a5b4fc";
          ctx.font = `500 ${Math.round(bannerH * 0.2)}px system-ui, sans-serif`;
          ctx.fillText(`AXON AI VIDEOGPT • SCENE 0${activeSceneIdx + 1}`, width / 2, bannerY + 54);
        }

        // 6. HUD Viewfinder Framing
        ctx.strokeStyle = "rgba(0, 212, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(30, 30, width - 60, height - 60);
        ctx.setLineDash([]);

        // Top Badge
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(45, 45, 140, 28);
        ctx.fillStyle = "#00d4ff";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`● REC AUDIO+60FPS`, 60, 63);

        // 7. Bottom Progress Line
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, height - 6, width, 6);
        ctx.fillStyle = "#6c63ff";
        ctx.fillRect(0, height - 6, width * progressPct, 6);

        frameIndex++;

        if (onProgress) {
          const calcPct = Math.min(40 + Math.round(progressPct * 55), 95);
          onProgress(calcPct, `Recording Frame ${frameIndex} of ${totalFrames} (with Audio)...`);
        }

        // Finish condition
        if (frameIndex >= totalFrames) {
          clearInterval(renderLoop);
          
          if (onProgress) onProgress(98, "Finishing video + audio stream encoding...");

          recorder.stop();
          recorder.onstop = () => {
            const fileExt = mimeType.includes("mp4") ? "mp4" : "webm";
            const blob = new Blob(recordedChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            const safeName = (title || prompt || "axon_ai_video").toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30);
            a.download = `${safeName}_motion.${fileExt}`;
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              audioCtx.close();
              if (onProgress) onProgress(100, "Download complete!");
              resolve();
            }, 200);
          };
        }
      } catch (err) {
        clearInterval(renderLoop);
        audioCtx.close();
        reject(err);
      }
    }, 1000 / fps);
  });
}

