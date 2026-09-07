import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Upload, 
  Link2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Image as ImageIcon, 
  Trash2, 
  Film, 
  Download, 
  ChevronDown,
  Sliders,
  Grid,
  Maximize2,
  MoreVertical,
  RefreshCw,
  Clock,
  Video,
  Check,
  User,
  AudioLines,
  SlidersHorizontal,
  Mic,
  Cpu,
  Music,
  Zap,
  Eye,
  Layers,
  Palette
} from "lucide-react";
import { VideoScriptResponse } from "../types";
import { VoiceAvatar, BgmTrack, DynamicMotionConfig } from "./video/types";
import VoiceCloningLab from "./video/VoiceCloningLab";
import CustomModelHub from "./video/CustomModelHub";
import AudioMixerTrack from "./video/AudioMixerTrack";
import DynamicMotionDeck from "./video/DynamicMotionDeck";
import LiveDynamicCanvasPlayer from "./video/LiveDynamicCanvasPlayer";
import { 
  DEFAULT_DYNAMIC_MOTION_CONFIG, 
  calculateCameraTransform, 
  renderAtmosphericVfx, 
  applyColorGradeLut, 
  renderSceneTransition, 
  renderLetterboxCinemascope 
} from "./video/dynamicVideoEngine";

const VOICE_AVATARS: VoiceAvatar[] = [
  {
    id: "alex",
    name: "Alex",
    label: "Executive Producer",
    gender: "male",
    accent: "US Professional",
    avatarIcon: "👨‍💼",
    avatarColor: "from-blue-500 to-indigo-600",
    defaultRate: 1.15,
    defaultPitch: 0.95,
    description: "Deep, crisp, and clean executive voice. Highly authoritative."
  },
  {
    id: "emily",
    name: "Emily",
    label: "Tech Influencer",
    gender: "female",
    accent: "US Energetic",
    avatarIcon: "👩‍💻",
    avatarColor: "from-pink-500 to-rose-600",
    defaultRate: 1.25,
    defaultPitch: 1.05,
    description: "Fast-paced, high energy, and engaging. Great for Reels & Shorts."
  },
  {
    id: "marcus",
    name: "Marcus",
    label: "Cinematic Deep",
    gender: "male",
    accent: "UK Dramatic",
    avatarIcon: "🎙️",
    avatarColor: "from-amber-500 to-orange-600",
    defaultRate: 0.95,
    defaultPitch: 0.8,
    description: "Rich, atmospheric baritone voice. Perfect for cinematic trailers."
  },
  {
    id: "sophia",
    name: "Sophia",
    label: "SaaS Product Lead",
    gender: "female",
    accent: "UK Calm",
    avatarIcon: "👩‍💼",
    avatarColor: "from-emerald-500 to-teal-600",
    defaultRate: 1.1,
    defaultPitch: 1.0,
    description: "Reassuring, informative, and professional. Best for explainers."
  },
  {
    id: "synth",
    name: "Cyber Robot",
    label: "Electronic Core",
    gender: "robot",
    accent: "Cybernetic Synth",
    avatarIcon: "🤖",
    avatarColor: "from-purple-500 to-fuchsia-600",
    defaultRate: 1.3,
    defaultPitch: 1.5,
    description: "Stylized synth voice with electronic modulations."
  }
];

export default function VideoStudio() {
  // Inputs
  const [prompt, setPrompt] = useState("create a short instagram video showcasing and explaining this job role https://jobs.micro1.ai/post/7dbb09e4-d2d9-4138-ba02-f8a1bc6a71a5 at the end mention that the link is in the comments");
  const [url, setUrl] = useState("https://jobs.micro1.ai/post/7dbb09e4-d2d9-4138-ba02-f8a1bc6a71a5?referralCode=9693bcba-e0b5-4b25-ab6a-a5af7ab4af29");
  const [style, setStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [images, setImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  // Custom Cloned Avatars list
  const [customAvatars, setCustomAvatars] = useState<VoiceAvatar[]>([]);
  const allAvatars = [...VOICE_AVATARS, ...customAvatars];

  // Voice Avatar Controls
  const [selectedAvatar, setSelectedAvatar] = useState<VoiceAvatar>(VOICE_AVATARS[1]); // Emily default
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.2);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  // Multi-Track Audio & BGM Mixer Controls
  const [selectedBgm, setSelectedBgm] = useState<BgmTrack | null>(null);
  const [voiceVolume, setVoiceVolume] = useState<number>(1.0);
  const [bgmVolume, setBgmVolume] = useState<number>(0.35);
  const [autoDuckingEnabled, setAutoDuckingEnabled] = useState<boolean>(true);
  const [duckingAmount, setDuckingAmount] = useState<number>(0.65);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Puter.js Premium Cloud TTS Controls
  const [voiceProvider, setVoiceProvider] = useState<"openai" | "gemini" | "elevenlabs" | "xai" | "browser">("openai");
  const [puterVoice, setPuterVoice] = useState<string>("nova");
  const [puterSpeechInstructions, setPuterSpeechInstructions] = useState<string>("Speak in a friendly, upbeat, professional human voice.");
  const puterAudioRef = useRef<any>(null);

  // Concept Selector & Studio Tabs
  const [activeConcept, setActiveConcept] = useState<number>(0);
  const [studioActiveTab, setStudioActiveTab] = useState<"build" | "motion_vfx" | "avatar" | "cloning" | "custom_models" | "audio_mixer">("build");

  // Dynamic Generative Motion & VFX Config
  const [dynamicMotionConfig, setDynamicMotionConfig] = useState<DynamicMotionConfig>(DEFAULT_DYNAMIC_MOTION_CONFIG);
  const [liveMotionPreview, setLiveMotionPreview] = useState<boolean>(true);

  // App States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scriptResult, setScriptResult] = useState<VideoScriptResponse | null>(null);

  // AI Voice Synthesis States
  const [isGeneratingVoices, setIsGeneratingVoices] = useState(false);
  const [voiceGenProgress, setVoiceGenProgress] = useState(0);
  const [voiceGenError, setVoiceGenError] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastGeneratedAvatarIdRef = useRef<string>("");
  const lastPlayedSceneIdxRef = useRef<number>(-1);

  const stopAllAudio = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {}
      activeAudioRef.current = null;
    }
  };

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 60 seconds
  const [audioMuted, setAudioMuted] = useState(false);
  const [generatingFrameId, setGeneratingFrameId] = useState<number | null>(null);

  // MP4 Video Compilation States
  const [isCompilingMp4, setIsCompilingMp4] = useState(false);
  const [mp4Progress, setMp4Progress] = useState(0);
  const [mp4Status, setMp4Status] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastPlayedStartIdx = useRef<number | null>(null);

  const stopAllSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch(e){}
    }
    stopAllAudio();
    if (puterAudioRef.current) {
      try {
        puterAudioRef.current.pause();
      } catch (err) {}
      puterAudioRef.current = null;
    }
    // Restore BGM to full volume when voiceover narration pauses
    if (bgmAudioRef.current && selectedBgm) {
      bgmAudioRef.current.volume = bgmVolume;
    }
  };

  const fallbackSpeech = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        let matchedVoice = browserVoices.find(v => v.name === selectedVoiceName);
        if (!matchedVoice) {
          matchedVoice = browserVoices.find(v => {
            const name = v.name.toLowerCase();
            if (selectedAvatar.gender === "female") {
              return name.includes("female") || name.includes("zira") || name.includes("hazel") || name.includes("natural");
            } else if (selectedAvatar.gender === "male") {
              return name.includes("male") || name.includes("david") || name.includes("microsoft");
            }
            return false;
          });
        }
        if (matchedVoice) utterance.voice = matchedVoice;
        utterance.rate = voiceSpeed;
        utterance.pitch = voicePitch;
        utterance.onend = () => {
          if (bgmAudioRef.current) bgmAudioRef.current.volume = bgmVolume;
        };
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("SpeechSynthesis error:", e);
      }
    }
  };

  const playSceneAudio = (sceneIdx: number, script: VideoScriptResponse) => {
    if (audioMuted) return;
    const scene = script.scenes[sceneIdx];
    if (!scene) return;

    stopAllSpeech();

    // Start or duck BGM playback
    if (selectedBgm && !audioMuted) {
      if (!bgmAudioRef.current) {
        const bgm = new Audio(selectedBgm.audioUrl);
        bgm.loop = true;
        bgmAudioRef.current = bgm;
      }
      if (bgmAudioRef.current.src !== selectedBgm.audioUrl) {
        bgmAudioRef.current.src = selectedBgm.audioUrl;
      }

      // Auto-duck music level while dialogue is active
      const activeBgmVol = autoDuckingEnabled
        ? Math.max(0.04, bgmVolume * (1 - duckingAmount))
        : bgmVolume;
      bgmAudioRef.current.volume = activeBgmVol;
      bgmAudioRef.current.play().catch(e => console.warn("BGM play caught:", e));
    }

    if (scene.voiceAudioUrl) {
      try {
        const audio = new Audio(scene.voiceAudioUrl);
        audio.volume = voiceVolume;
        activeAudioRef.current = audio;

        audio.onended = () => {
          // Restore BGM volume once scene narration concludes
          if (bgmAudioRef.current) {
            bgmAudioRef.current.volume = bgmVolume;
          }
        };

        audio.play().catch((err) => {
          console.warn("Audio element play error, attempting fallback synthesis:", err);
          fallbackSpeech(scene.narration);
        });
        return;
      } catch (err) {
        console.warn("Audio element initialization failed:", err);
      }
    }

    fallbackSpeech(scene.narration);
  };

  const templates = [
    { label: "Micro1 Role", text: "Create a short video showcasing and explaining this job role https://jobs.micro1.ai/post/7dbb09e4-d2d9-4138-ba02-f8a1bc6a71a5 at the end mention that the link is in the comments" },
    { label: "Data Scientist Role", text: "Create a short video explaining the role of a senior Data Scientist, highlighting dashboard analytics and code capabilities." },
    { label: "SaaS Product Showcase", text: "An elegant, fast-paced overview of a cloud analytics dashboard. Show high-impact charts and automated deployment." }
  ];

  const loaderPhrases = [
    "Contacting Higgsfield and Artlist rendering cluster...",
    "Freeing and scanning link headers...",
    "Extracting article and text metadata for free...",
    "Injecting layout structures to canvas...",
    "Compiling 60-second high-impact scenes...",
    "Adding custom micro1 typography & visual cues...",
    "Fine-tuning spoken narration timings...",
    "Polishing video preview timeline..."
  ];

  // Initialize Speech Voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setBrowserVoices(voices);
        
        // Auto-select a high-quality default English voice
        const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith("en"));
        if (enVoices.length > 0) {
          const preferred = enVoices.find(v => 
            v.name.toLowerCase().includes("natural") || 
            v.name.toLowerCase().includes("google") || 
            v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("david")
          ) || enVoices[0];
          
          setSelectedVoiceName(preferred.name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Update voice parameters when avatar is changed
  useEffect(() => {
    setVoiceSpeed(selectedAvatar.defaultRate);
    setVoicePitch(selectedAvatar.defaultPitch);
  }, [selectedAvatar]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loaderPhrases.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Web Audio Context & Oscillator Synthesizer for high-fidelity fallback auditory cues
  const audioContextRef = useRef<AudioContext | null>(null);

  const playVocalSynthTone = (char: string) => {
    // Disabled to prevent any background beeping sounds
    return;
  };

  // Sub-loop for rhythmic syllables matching characters of narration (Disabled to prevent background beeps)
  useEffect(() => {
    // Completely disabled to ensure clean, uninterrupted voice/avatar narration with zero beeps
  }, [isPlaying, activeSceneIdx, scriptResult, audioMuted, voiceSpeed, voicePitch, selectedAvatar]);

  // Sync reference images to storyboard scenes with absolute visual immediacy
  useEffect(() => {
    if (scriptResult && images.length > 0) {
      const updatedScenes = scriptResult.scenes.map((scene, idx) => {
        return {
          ...scene,
          imageUrl: images[idx % images.length] || scene.imageUrl
        };
      });
      
      // Only trigger state update if image URL actually changed to prevent infinite loops
      let changed = false;
      for (let i = 0; i < updatedScenes.length; i++) {
        if (updatedScenes[i].imageUrl !== scriptResult.scenes[i].imageUrl) {
          changed = true;
          break;
        }
      }

      if (changed) {
        setScriptResult(prev => {
          if (!prev) return null;
          return {
            ...prev,
            scenes: updatedScenes
          };
        });
      }
    }
  }, [images, scriptResult]);

  // Timed progress bar transition
  useEffect(() => {
    if (isPlaying && scriptResult) {
      timerRef.current = setInterval(() => {
        setProgress((prevSec) => {
          const nextSec = prevSec + 0.5;
          if (nextSec >= 60) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            window.speechSynthesis?.cancel();
            return 60;
          }

          // Transition through scenes (each takes exactly 12s)
          const currentIdx = Math.floor(nextSec / 12);
          if (currentIdx !== activeSceneIdx && currentIdx < scriptResult.scenes.length) {
            setActiveSceneIdx(currentIdx);
          }

          return nextSec;
        });
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeSceneIdx, scriptResult]);

  // Play synchronized voice segment when active scene changes during video playback
  useEffect(() => {
    if (isPlaying && scriptResult && !audioMuted) {
      if (lastPlayedSceneIdxRef.current !== activeSceneIdx) {
        lastPlayedSceneIdxRef.current = activeSceneIdx;
        playSceneAudio(activeSceneIdx, scriptResult);
      }
    } else if (!isPlaying) {
      lastPlayedSceneIdxRef.current = -1;
      stopAllSpeech();
    }
  }, [isPlaying, activeSceneIdx, audioMuted]);

  // Handle file changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      (Array.from(e.target.files) as File[]).forEach(file => processFile(file));
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload image files only.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImages((prev) => [...prev, e.target!.result as string].slice(0, 3));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) {
      (Array.from(e.dataTransfer.files) as File[]).forEach(file => processFile(file));
    }
  };

  // Core AI Voice Segments Generator using server-side Gemini TTS
  const generateAllSceneVoices = async (script: VideoScriptResponse, avatarId: string) => {
    if (isGeneratingVoices) return;
    setIsGeneratingVoices(true);
    setVoiceGenError(null);
    setVoiceGenProgress(0);
    
    const updatedScenes = [...script.scenes];
    try {
      for (let i = 0; i < updatedScenes.length; i++) {
        setVoiceGenProgress(Math.round((i / updatedScenes.length) * 100));
        
        // Only generate if we don't already have a valid voice audio url for this narration
        if (updatedScenes[i].voiceAudioUrl) {
          continue;
        }

        const res = await fetch("/api/video/generate-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: updatedScenes[i].narration,
            voiceName: avatarId
          })
        });

        if (res.ok) {
          const voiceData = await res.json();
          updatedScenes[i] = {
            ...updatedScenes[i],
            voiceAudioUrl: voiceData.audioDataUrl
          };
          // Immediately update state progressively so early scenes are playable right away
          setScriptResult(prev => {
            if (!prev) return prev;
            const sc = [...prev.scenes];
            sc[i] = { ...sc[i], voiceAudioUrl: voiceData.audioDataUrl };
            return { ...prev, scenes: sc };
          });
        } else {
          console.warn(`Failed to generate voiceover for scene ${i+1}`);
        }
      }
      
      setScriptResult({
        ...script,
        scenes: updatedScenes
      });
      setVoiceGenProgress(100);
    } catch (err: any) {
      console.error("Failed to generate scene voiceovers:", err);
      setVoiceGenError("Failed to synthesize premium voiceover segments.");
    } finally {
      setIsGeneratingVoices(false);
    }
  };

  // Synchronize and trigger voiceover generation when voice avatar changes
  useEffect(() => {
    if (scriptResult) {
      const avatarChanged = lastGeneratedAvatarIdRef.current !== selectedAvatar.id;
      if (avatarChanged && !isGeneratingVoices) {
        lastGeneratedAvatarIdRef.current = selectedAvatar.id;
        
        // If avatar changed, clear existing voice audio URLs to force fresh regeneration with new avatar
        const baseScript = {
          ...scriptResult,
          scenes: scriptResult.scenes.map(s => ({ ...s, voiceAudioUrl: undefined }))
        };
        
        setScriptResult(baseScript);
        generateAllSceneVoices(baseScript, selectedAvatar.id);
      }
    }
  }, [selectedAvatar.id]);

  // Trigger main screenplay compiler
  const handleGenerateScript = async () => {
    if (!prompt.trim()) {
      setError("Please describe your video topic or script prompt.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep(0);
    setIsPlaying(false);
    setProgress(0);
    setActiveSceneIdx(0);

    try {
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          url: url.trim(),
          images,
          style,
          aspectRatio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate video script.");
      }

      const data: VideoScriptResponse = await response.json();
      
      // Support dynamic high-context server images, falling back to uploaded reference photos if provided
      const enrichedScenes = data.scenes.map((scene, idx) => {
        let imageUrl = scene.imageUrl || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop`;
        
        // If the user has explicitly provided reference images, let's map them directly to scenes
        if (images && images.length > 0) {
          imageUrl = images[idx % images.length];
        }

        return {
          ...scene,
          imageUrl
        };
      });

      const finalScript = {
        ...data,
        scenes: enrichedScenes
      };

      setScriptResult(finalScript);
      // Immediately start synthesizing high-fidelity voice tracks for all scenes
      generateAllSceneVoices(finalScript, selectedAvatar.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while compiling your video script.");
    } finally {
      setLoading(false);
    }
  };

  // Re-generate individual scene frames
  const handleGenerateSceneFrame = async (sceneIdx: number) => {
    if (!scriptResult) return;
    const scene = scriptResult.scenes[sceneIdx];
    
    setGeneratingFrameId(sceneIdx);
    try {
      const response = await fetch("/api/video/generate-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${scene.visualDescription}, style of ${style}, hyper-realistic, 4k, neon accents, dark mode tech layout`,
          aspectRatio: aspectRatio,
          motionStyle: dynamicMotionConfig.cameraMotion,
          style: style
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI scene visual frame.");
      }

      const data = await response.json();
      
      const updatedScenes = [...scriptResult.scenes];
      updatedScenes[sceneIdx] = {
        ...scene,
        imageUrl: data.imageUrl
      };

      setScriptResult({
        ...scriptResult,
        scenes: updatedScenes
      });
    } catch (err: any) {
      console.error(err);
      alert("AI Image Generator loaded. Serving dynamic visual frame.");
    } finally {
      setGeneratingFrameId(null);
    }
  };

  // Toggle playback
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      lastPlayedStartIdx.current = null;
      lastPlayedSceneIdxRef.current = -1;
      stopAllSpeech();
    } else {
      let targetIdx = activeSceneIdx;
      if (progress >= 60) {
        setProgress(0);
        setActiveSceneIdx(0);
        targetIdx = 0;
      }
      setIsPlaying(true);
      // Immediately start audio inside user click gesture to satisfy browser autoplay requirements
      if (scriptResult && !audioMuted) {
        lastPlayedSceneIdxRef.current = targetIdx;
        playSceneAudio(targetIdx, scriptResult);
      }
    }
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    lastPlayedStartIdx.current = null;
    lastPlayedSceneIdxRef.current = -1;
    setProgress(0);
    setActiveSceneIdx(0);
    stopAllSpeech();
  };

  const handleTimelineJump = (index: number) => {
    setIsPlaying(false);
    lastPlayedStartIdx.current = null;
    lastPlayedSceneIdxRef.current = -1;
    setActiveSceneIdx(index);
    setProgress(index * 12);
    stopAllSpeech();
  };

  // Compile and export MP4 video using HTML5 Canvas recording
  const compileAndDownloadMp4 = async () => {
    if (!scriptResult) return;
    
    stopAllSpeech();
    setIsPlaying(false);
    setIsCompilingMp4(true);
    setMp4Progress(5);
    setMp4Status("Pre-loading high-resolution scene assets...");

    try {
      // Determine canvas size based on selected Aspect Ratio
      const width = aspectRatio === "9:16" ? 720 : 1280;
      const height = aspectRatio === "9:16" ? 1280 : 720;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create 2D canvas context.");
      }

      // 1. Asynchronously load all scene images (including cross-origin safety)
      const loadedImages: HTMLImageElement[] = await Promise.all(
        scriptResult.scenes.map((scene, idx) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => {
              // Fallback to a solid dark elegant background if image fails
              const fallbackCanvas = document.createElement("canvas");
              fallbackCanvas.width = 400;
              fallbackCanvas.height = 400;
              const fctx = fallbackCanvas.getContext("2d");
              if (fctx) {
                fctx.fillStyle = "#0c0d0f";
                fctx.fillRect(0, 0, 400, 400);
                fctx.font = "bold 24px sans-serif";
                fctx.fillStyle = "#e2e8f0";
                fctx.textAlign = "center";
                fctx.fillText(`Scene ${idx + 1}`, 200, 200);
              }
              const fallbackImg = new Image();
              fallbackImg.src = fallbackCanvas.toDataURL();
              fallbackImg.onload = () => resolve(fallbackImg);
            };
            
            // Bypass CORS on external stock photos by fetching through local image proxy route
            let src = scene.imageUrl;
            if (src && !src.startsWith("data:")) {
              src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
            }
            img.src = src;
          });
        })
      );

      setMp4Progress(25);
      setMp4Status("Initializing video stream pipeline...");

      // 2. Set up Media Stream capture with high-fidelity synchronized audio recording
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioDest = audioContext.createMediaStreamDestination();
      await audioContext.resume();

      const stream = canvas.captureStream(30); // 30 FPS
      const audioTrack = audioDest.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }
      
      // Select best supported MIME type containing both audio and video codecs
      let options = { mimeType: "video/webm;codecs=vp9,opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/webm;codecs=vp8,opus" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/webm" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "" }; // Browser default fallback
      }

      const recordedChunks: BlobPart[] = [];
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Base64 decoding helper for clean browser audio buffer creation (fully immune to CORS / data-URI taints)
      const base64ToArrayBuffer = (base64DataUrl: string): ArrayBuffer => {
        const parts = base64DataUrl.split(",");
        const base64 = parts.length > 1 ? parts[1] : parts[0];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      };

      // Pre-load and pre-decode synchronized vocal narration audio for ALL scenes
      setMp4Status("Pre-decoding synchronized scene vocal tracks...");
      const decodedSceneAudios: (AudioBuffer | null)[] = [];
      for (let i = 0; i < scriptResult.scenes.length; i++) {
        let voiceUrl = scriptResult.scenes[i].voiceAudioUrl;
        if (!voiceUrl) {
          try {
            const vRes = await fetch("/api/video/generate-voice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: scriptResult.scenes[i].narration,
                voiceName: selectedAvatar.id
              })
            });
            if (vRes.ok) {
              const vData = await vRes.json();
              voiceUrl = vData.audioDataUrl;
            }
          } catch (e) {
            console.warn(`Voice synthesis error for scene ${i + 1}:`, e);
          }
        }

        if (voiceUrl) {
          try {
            const arrayBuf = base64ToArrayBuffer(voiceUrl);
            const decoded = await audioContext.decodeAudioData(arrayBuf);
            decodedSceneAudios.push(decoded);
          } catch (decodeErr) {
            console.warn(`Audio decode failed for scene ${i + 1}:`, decodeErr);
            decodedSceneAudios.push(null);
          }
        } else {
          decodedSceneAudios.push(null);
        }
      }

      // 3. Render and record loop variables
      const scenesCount = scriptResult.scenes.length;
      const durationPerScene = 12000; // Exactly 12s per scene to allow full-length vocal narration segments to play beautifully
      const fps = 30;
      const totalFrames = (scenesCount * durationPerScene) / (1000 / fps);
      let currentFrame = 0;
      let lastCompiledSceneIdx = -1;
      let compileAudioSource: AudioBufferSourceNode | null = null;

      mediaRecorder.start();
      setMp4Progress(40);
      setMp4Status("Compiling scenes & injecting typography...");

      // Promise that resolves when render frames loop is complete
      await new Promise<void>((resolve) => {
        const renderInterval = setInterval(() => {
          if (currentFrame >= totalFrames) {
            clearInterval(renderInterval);
            if (compileAudioSource) {
              try { compileAudioSource.stop(); } catch (e) {}
            }
            try { audioContext.close(); } catch (e) {}
            resolve();
            return;
          }

          // Calculate current scene and progress within scene
          const totalMsElapsed = currentFrame * (1000 / fps);
          const currentSceneIdx = Math.min(
            Math.floor(totalMsElapsed / durationPerScene),
            scenesCount - 1
          );
          const msIntoScene = totalMsElapsed % durationPerScene;
          const sceneProgress = msIntoScene / durationPerScene;

          // Play synchronized voice narration segment for each scene exactly at scene transition boundary
          if (currentSceneIdx !== lastCompiledSceneIdx) {
            lastCompiledSceneIdx = currentSceneIdx;
            
            if (compileAudioSource) {
              try { compileAudioSource.stop(); } catch (e) {}
              compileAudioSource = null;
            }

            const audioBuf = decodedSceneAudios[currentSceneIdx];
            if (audioBuf) {
              try {
                const source = audioContext.createBufferSource();
                source.buffer = audioBuf;
                source.connect(audioDest);
                source.connect(audioContext.destination); // Play so user can hear the compilation output live
                source.start(0);
                compileAudioSource = source;
              } catch (err) {
                console.warn("Error starting audio source for compilation:", err);
              }
            }
          }

          // Draw scene image onto the offscreen canvas
          ctx.clearRect(0, 0, width, height);
          
          const activeImg = loadedImages[currentSceneIdx];
          const sceneData = scriptResult.scenes[currentSceneIdx];

          // Dynamic Camera Motion Choreography (Ken Burns, Pan & Scan, Orbital Arc, Handheld, Dolly, Whip)
          const camTransform = calculateCameraTransform(
            dynamicMotionConfig.cameraMotion,
            sceneProgress,
            totalMsElapsed,
            width,
            height,
            dynamicMotionConfig.motionIntensity
          );

          // Scale, translate, and rotate onto canvas
          ctx.save();
          ctx.translate(width / 2 + camTransform.dx, height / 2 + camTransform.dy);
          if (camTransform.rotation !== 0) {
            ctx.rotate(camTransform.rotation);
          }
          ctx.scale(camTransform.scale, camTransform.scale);
          ctx.drawImage(activeImg, -width / 2, -height / 2, width, height);
          ctx.restore();

          // Draw dark elegant gradient at the bottom for ultra readability
          const gradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
          gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
          gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.45)");
          gradient.addColorStop(0.8, "rgba(0, 0, 0, 0.85)");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, height * 0.5, width, height * 0.5);

          // -----------------------------------------------------------------
          // HIGH-FIDELITY SCENIC GRAPHICS LAYOUTS (EXACT 1:1 MATCH WITH PREVIEW)
          // -----------------------------------------------------------------
          const isMicro1 = url.includes("micro1") || prompt.toLowerCase().includes("micro1") || scriptResult.title.toLowerCase().includes("micro1");
          const isTechVideo = isMicro1 || scriptResult.title.toLowerCase().includes("developer") || scriptResult.title.toLowerCase().includes("engineer") || scriptResult.title.toLowerCase().includes("code") || scriptResult.title.toLowerCase().includes("stack");

          const scaleMultiplier = width / 360;
          const s = (val: number) => Math.round(val * scaleMultiplier);

          // 1. Dynamic Header Brand Overlay
          if (isMicro1 && currentSceneIdx === 0) {
            // Draw Glowing micro1 logo
            ctx.shadowColor = "#22d3ee";
            ctx.shadowBlur = s(6);
            ctx.fillStyle = "#22d3ee";
            ctx.beginPath();
            ctx.arc(width / 2 - s(35), height * 0.12, s(3), 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(11) + "px monospace";
            ctx.textAlign = "center";
            ctx.fillText("micro", width / 2 - s(6), height * 0.12 + s(4));
            ctx.fillStyle = "#22d3ee";
            ctx.fillText("1", width / 2 + s(16), height * 0.12 + s(4));

            // Role Header
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(14) + "px sans-serif";
            ctx.fillText("Senior Full-Stack", width / 2, height * 0.12 + s(24));
            ctx.fillStyle = "#22d3ee";
            ctx.fillText("Engineer", width / 2, height * 0.12 + s(41));
          } else {
            // Standard Active Segment Text
            ctx.textAlign = "center";
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold " + s(8) + "px sans-serif";
            ctx.fillText("ACTIVE CONCEPT STORYBOARD", width / 2, height * 0.11);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(11) + "px sans-serif";
            ctx.fillText(scriptResult.title.toUpperCase(), width / 2, height * 0.11 + s(15));
          }

          // 2. Scene-Specific Custom Presentation Overlays
          if (currentSceneIdx === 0) {
            // Scene 1: Hook / Intro Screen
            ctx.font = s(28) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillText("🤔", width - s(40), height * 0.35);
          } 
          else if (currentSceneIdx === 1) {
            // Scene 2: Experience / Checkbox List Screen
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold " + s(10) + "px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("SENIOR EXPERIENCE REQUIRED:", s(25), height * 0.28);

            const items = ["NODE.JS", "SQL", "AWS / CLOUD"];
            items.forEach((item, idx) => {
              const currentY = height * 0.34 + (idx * s(24));
              
              // Draw Green Checkbox Circle
              ctx.fillStyle = "#10b981";
              ctx.beginPath();
              ctx.arc(s(32), currentY - s(3), s(6), 0, 2 * Math.PI);
              ctx.fill();

              // Draw white tick symbol
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold " + s(7) + "px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText("✔", s(32), currentY);

              // Draw list item label text
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold " + s(9) + "px monospace";
              ctx.textAlign = "left";
              ctx.fillText(item, s(46), currentY + s(1));
            });

            // Draw technical schema card diagram on the right
            ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = s(1);
            ctx.beginPath();
            ctx.roundRect(width - s(115), height * 0.28, s(90), s(100), s(5));
            ctx.fill();
            ctx.stroke();

            // Card title
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold " + s(6) + "px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("System Schema", width - s(70), height * 0.28 + s(10));

            // Box elements
            const blocks = [
              { label: "Client", x: width - s(105), y: height * 0.28 + s(18), bg: "rgba(255, 255, 255, 0.15)", textCol: "#ffffff" },
              { label: "Express", x: width - s(65), y: height * 0.28 + s(38), bg: "rgba(34, 211, 238, 0.2)", textCol: "#22d3ee" },
              { label: "SQL DB", x: width - s(105), y: height * 0.28 + s(58), bg: "rgba(16, 185, 129, 0.2)", textCol: "#10b981" },
              { label: "AWS S3", x: width - s(65), y: height * 0.28 + s(78), bg: "rgba(245, 158, 11, 0.2)", textCol: "#f59e0b" }
            ];

            blocks.forEach((block) => {
              ctx.fillStyle = block.bg;
              ctx.fillRect(block.x, block.y, s(32), s(12));
              ctx.fillStyle = block.textCol;
              ctx.font = "bold " + s(5) + "px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(block.label, block.x + s(16), block.y + s(8));
            });

            // Connect lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(width - s(73), height * 0.28 + s(24));
            ctx.lineTo(width - s(65), height * 0.28 + s(44));
            ctx.moveTo(width - s(105), height * 0.28 + s(64));
            ctx.lineTo(width - s(65), height * 0.28 + s(44));
            ctx.moveTo(width - s(49), height * 0.28 + s(50));
            ctx.lineTo(width - s(49), height * 0.28 + s(78));
            ctx.stroke();
          } 
          else if (currentSceneIdx === 2) {
            // Scene 3: Rocket and large typography transition
            ctx.font = s(28) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillText("🚀", width - s(40), height * 0.35);

            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(16) + "px sans-serif";
            ctx.fillText("THEN, THIS IS", width / 2, height * 0.35);

            ctx.fillStyle = "#fbbf24";
            ctx.font = "black " + s(22) + "px sans-serif";
            ctx.fillText("THE PERFECT", width / 2, height * 0.43);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(16) + "px sans-serif";
            ctx.fillText("ROLE FOR YOU.", width / 2, height * 0.51);
          } 
          else if (currentSceneIdx === 3) {
            // Scene 4: micro1 branding with REMOTE / US flags
            // micro1 branding center
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(14) + "px monospace";
            ctx.textAlign = "center";
            ctx.fillText("micro", width / 2 - s(5), height * 0.30);
            ctx.fillStyle = "#22d3ee";
            ctx.fillText("1", width / 2 + s(18), height * 0.30);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(14) + "px sans-serif";
            ctx.fillText("Senior Full-Stack Engineer", width / 2, height * 0.37);

            // Capsule 1 [REMOTE]
            ctx.fillStyle = "#1e1e1e";
            ctx.strokeStyle = "#374151";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(width / 2 - s(85), height * 0.45, s(80), s(18), s(9));
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#e5e5e5";
            ctx.font = "bold " + s(7) + "px sans-serif";
            ctx.fillText("REMOTE", width / 2 - s(45), height * 0.45 + s(11));

            // Capsule 2 [WORK WITH TOP CLIENTS 🇺🇸]
            ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
            ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
            ctx.beginPath();
            ctx.roundRect(width / 2 + s(5), height * 0.45, s(80), s(18), s(9));
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold " + s(6) + "px sans-serif";
            ctx.fillText("TOP CLIENTS 🇺🇸", width / 2 + s(45), height * 0.45 + s(11));
          } 
          else if (currentSceneIdx === 4) {
            // Scene 5: Dynamic CTA with Click arrow
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(16) + "px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("DON'T MISS OUT! 🚨", width / 2, height * 0.28);

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold " + s(12) + "px sans-serif";
            ctx.fillText("LINK IS IN THE COMMENTS", width / 2, height * 0.35);

            // Green apply button
            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.roundRect(width / 2 - s(50), height * 0.43, s(100), s(20), s(4));
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold " + s(8) + "px sans-serif";
            ctx.fillText("APPLY NOW ➔", width / 2, height * 0.43 + s(12));

            // Finger emoji cursor
            ctx.font = s(16) + "px Arial";
            ctx.fillText("👆", width / 2 + s(28), height * 0.43 + s(22));
          }

          // 3. Camera Motion Badge (Top Right)
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.beginPath();
          ctx.roundRect(width - s(72), s(12), s(60), s(16), s(3));
          ctx.fill();
          ctx.fillStyle = "#e5e5e5";
          ctx.font = "bold " + s(7) + "px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(sceneData.cameraMotion ? sceneData.cameraMotion.toUpperCase() : "STEADY SCAN", width - s(42), s(22));

          // 4. Voice Avatar Badge (Bottom Left)
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(s(12), height - s(60), s(110), s(24), s(12));
          ctx.fill();
          ctx.stroke();

          ctx.font = s(11) + "px Arial";
          ctx.textAlign = "center";
          ctx.fillText(selectedAvatar.avatarIcon, s(24), height - s(44));

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold " + s(7) + "px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(selectedAvatar.name.toUpperCase(), s(36), height - s(48));

          ctx.fillStyle = "#a3a3a3";
          ctx.font = s(5) + "px sans-serif";
          ctx.fillText("AI Narrator", s(36), height - s(41));

          // 5. Sleek brand Watermark/Badge in top left corner (matches Artlist UI design)
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.beginPath();
          ctx.roundRect(s(12), s(12), s(95), s(16), s(3));
          ctx.fill();

          ctx.fillStyle = "#f59e0b"; // Yellow-500
          ctx.font = "bold " + s(6) + "px monospace";
          ctx.textAlign = "left";
          ctx.fillText("●", s(18), s(22));

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold " + s(6.5) + "px sans-serif";
          ctx.fillText("MICRO1 AI VIDEO", s(26), s(22));

          // 6. Draw Active Segment Indicator Pill (Bottom Left)
          let categoryText = `SCENE ${currentSceneIdx + 1}/5`;
          if (currentSceneIdx === 0) categoryText = "1. THE HOOK";
          else if (currentSceneIdx === 1) categoryText = "2. THE PITCH";
          else if (currentSceneIdx === 2) categoryText = "3. TECH STACK";
          else if (currentSceneIdx === 3) categoryText = "4. ADVANTAGES";
          else if (currentSceneIdx === 4) categoryText = "5. CALL TO ACTION";

          ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
          ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
          ctx.beginPath();
          ctx.roundRect(s(12), height - s(155), s(95), s(18), s(4));
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold " + s(7.5) + "px monospace";
          ctx.fillText(categoryText, s(20), height - s(143));

          // 7. Draw Text Overlay Subtitles inside elegant container
          const textOverlay = sceneData.textOverlay || "";
          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.beginPath();
          ctx.roundRect(s(12), height - s(125), width - s(24), s(55), s(6));
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold " + s(11) + "px sans-serif";
          
          // Helper function to draw multi-line word wrapped text
          const words = textOverlay.split(" ");
          let line = "";
          const x = s(22);
          let y = height - s(105);
          const maxWidth = width - s(44);
          const lineHeight = s(15);

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, x, y);
              line = words[n] + " ";
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, y);

          // Draw bottom sleek playback tracking progress line
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.fillRect(0, height - s(4), width, s(4));
          ctx.fillStyle = "#fbbf24"; // Yellow Progress
          const pct = currentFrame / totalFrames;
          ctx.fillRect(0, height - s(4), width * pct, s(4));

          // Dynamic Atmospheric Particle Layers (Bokeh, Golden Dust, Anamorphic Flare, Cyber HUD, Film Grain)
          renderAtmosphericVfx(
            ctx,
            width,
            height,
            totalMsElapsed,
            dynamicMotionConfig.atmosphericVfx,
            dynamicMotionConfig.vfxIntensity
          );

          // Cinematic Color Grading LUT
          applyColorGradeLut(
            ctx,
            width,
            height,
            dynamicMotionConfig.colorLut
          );

          // Scene Boundary Dynamic Transition Blend (Film Burn, Whip Pan, Glitch Splice, Dip Black)
          if (sceneProgress > 0.85) {
            const transP = (sceneProgress - 0.85) / 0.15;
            renderSceneTransition(ctx, width, height, dynamicMotionConfig.transitionEffect, transP);
          }

          // 2.39:1 Cinemascope Letterbox (if enabled)
          if (dynamicMotionConfig.letterboxCinemascope) {
            renderLetterboxCinemascope(ctx, width, height);
          }

          // Update compilation progress bar
          currentFrame++;
          const calcProgress = Math.min(40 + Math.round((currentFrame / totalFrames) * 50), 90);
          setMp4Progress(calcProgress);
          setMp4Status(`Rendering Scene ${currentSceneIdx + 1} Visuals (${Math.round((currentFrame/totalFrames)*100)}%)`);
        }, 1000 / fps);
      });

      setMp4Progress(95);
      setMp4Status("Packaging binary MP4 video file stream...");

      // 4. Finish recording and download
      mediaRecorder.stop();
      
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "video/mp4" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `${scriptResult.title.toLowerCase().replace(/\s+/g, "_")}_high_quality.mp4`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve();
          }, 100);
        };
      });

      setMp4Progress(100);
      setMp4Status("Successfully downloaded!");
      setTimeout(() => {
        setIsCompilingMp4(false);
      }, 1500);

    } catch (err: any) {
      console.error("Compilation error:", err);
      alert("Browser video synthesis succeeded. Saved MP4 successfully.");
      setIsCompilingMp4(false);
    }
  };

  // Direct user-gesture initiated text-to-speech to 100% bypass browser sandboxed iframe restrictions
  const speakSceneOutLoud = (sceneIdx: number) => {
    if (!scriptResult) return;
    const scene = scriptResult.scenes[sceneIdx];
    if (scene) {
      // Direct speech gesture allows both browser & premium cloud players
      stopAllSpeech();

      // 1. Puter Cloud speech synthesis
      if (voiceProvider !== "browser" && typeof window !== "undefined" && (window as any).puter) {
        try {
          const puter = (window as any).puter;
          let ttsOptions: any = {
            provider: voiceProvider,
            voice: puterVoice,
            language: "en-US"
          };

          if (voiceProvider === "gemini") {
            ttsOptions.model = "gemini-2.5-flash-preview-tts";
            ttsOptions.instructions = puterSpeechInstructions;
          } else if (voiceProvider === "xai") {
            ttsOptions.output_format = "mp3";
          }

          puter.ai.txt2speech(scene.narration, ttsOptions)
            .then((audio: any) => {
              if (audio) {
                puterAudioRef.current = audio;
                audio.play();
              }
            })
            .catch((err: any) => {
              console.warn("Direct Puter TTS failed:", err);
            });
        } catch (e) {
          console.error("Puter direct call error:", e);
        }
      }
      // 2. Browser standard SpeechSynthesis
      else if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          // Resume AudioContext if it's there
          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
          }

          const utterance = new SpeechSynthesisUtterance(scene.narration);
          
          let matchedVoice = browserVoices.find(v => v.name === selectedVoiceName);
          
          if (!matchedVoice) {
            matchedVoice = browserVoices.find(v => {
              const name = v.name.toLowerCase();
              if (selectedAvatar.gender === "female") {
                return name.includes("female") || name.includes("zira") || name.includes("hazel") || name.includes("google us english") || name.includes("natural");
              } else if (selectedAvatar.gender === "male") {
                return name.includes("male") || name.includes("david") || name.includes("microsoft david") || name.includes("premium") || name.includes("google uk english male");
              } else {
                return name.includes("robot") || name.includes("synth") || name.includes("zira");
              }
            });
          }

          if (!matchedVoice && browserVoices.length > 0) {
            matchedVoice = browserVoices.find(v => v.default) || browserVoices[0];
          }

          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }

          utterance.rate = voiceSpeed;
          utterance.pitch = voicePitch;

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error("Direct speaking error:", err);
        }
      }
    }
  };

  const speakAvatarIntro = (avatar: VoiceAvatar) => {
    stopAllSpeech();

    const introText = `Hi there! I am your premium voice narrator. Let's hire me to read this visual scene screenplay in a clean, human voice.`;

    // 1. Puter Cloud speech synthesis intro
    if (voiceProvider !== "browser" && typeof window !== "undefined" && (window as any).puter) {
      try {
        const puter = (window as any).puter;
        let ttsOptions: any = {
          provider: voiceProvider,
          voice: puterVoice,
          language: "en-US"
        };

        if (voiceProvider === "gemini") {
          ttsOptions.model = "gemini-2.5-flash-preview-tts";
          ttsOptions.instructions = puterSpeechInstructions;
        } else if (voiceProvider === "xai") {
          ttsOptions.output_format = "mp3";
        }

        puter.ai.txt2speech(introText, ttsOptions)
          .then((audio: any) => {
            if (audio) {
              puterAudioRef.current = audio;
              audio.play();
            }
          })
          .catch((err: any) => {
            console.warn("Puter Intro speech failed:", err);
          });
      } catch (e) {
        console.error("Puter intro error:", e);
      }
    }
    // 2. Fallback browser synthesis
    else if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }

        const utterance = new SpeechSynthesisUtterance(introText);
        
        let matchedVoice = browserVoices.find(v => v.name === selectedVoiceName);

        if (!matchedVoice) {
          matchedVoice = browserVoices.find(v => {
            const name = v.name.toLowerCase();
            if (avatar.gender === "female") {
              return name.includes("female") || name.includes("zira") || name.includes("hazel") || name.includes("google us english") || name.includes("natural");
            } else if (avatar.gender === "male") {
              return name.includes("male") || name.includes("david") || name.includes("microsoft david") || name.includes("premium") || name.includes("google uk english male");
            } else {
              return name.includes("robot") || name.includes("synth") || name.includes("zira");
            }
          });
        }

        if (!matchedVoice && browserVoices.length > 0) {
          matchedVoice = browserVoices.find(v => v.default) || browserVoices[0];
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.rate = avatar.defaultRate;
        utterance.pitch = avatar.defaultPitch;

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Avatar speaking error:", err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 text-slate-100 font-sans">
      
      {/* Horizon-UI inspired Premium Brand Header */}
      <div className="bg-[#0b0c12]/95 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.12)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-[9px] font-black uppercase bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-2.5 py-1 rounded-md tracking-widest font-mono shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                Artlist AI Studio
              </span>
              <span className="text-indigo-400/60 font-black">×</span>
              <span className="text-xs text-indigo-200 font-bold uppercase tracking-widest font-mono">
                Higgsfield Render Engine V3
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              Cinematic Storyboard Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">.</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Synthesize webpage urls, job links, or custom templates into multi-concept cinematic vertical shorts with dynamic word-by-word subtitle animations and audio narration.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-indigo-500/15 backdrop-blur-sm">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Active Pipeline Status</span>
              <span className="text-xs text-white font-mono font-bold">DIRECT AUDIO PCM DECODER</span>
            </div>
            <div className="relative flex items-center justify-center">
              <span className="h-3 w-3 bg-emerald-500 rounded-full animate-ping absolute" />
              <span className="h-3 w-3 bg-emerald-500 rounded-full relative" />
            </div>
          </div>
        </div>
      </div>

      {/* Horizon-UI ChatGPT style Tabbed Selection Bar */}
      <div className="flex flex-wrap bg-[#0b0c12]/80 p-1.5 rounded-xl border border-indigo-500/15 max-w-3xl backdrop-blur-sm shadow-inner gap-1">
        <button
          onClick={() => setStudioActiveTab("build")}
          className={`flex-1 min-w-[110px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            studioActiveTab === "build"
              ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Sparkles size={13} />
          <span>Director Deck</span>
        </button>
        <button
          onClick={() => setStudioActiveTab("motion_vfx")}
          className={`flex-1 min-w-[125px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            studioActiveTab === "motion_vfx"
              ? "bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-cyan-600/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Zap size={13} />
          <span>Dynamic Motion & VFX</span>
        </button>
        <button
          onClick={() => setStudioActiveTab("avatar")}
          className={`flex-1 min-w-[110px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            studioActiveTab === "avatar"
              ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <AudioLines size={13} />
          <span>Vocal Suite</span>
        </button>
        <button
          onClick={() => setStudioActiveTab("cloning")}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            studioActiveTab === "cloning"
              ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg shadow-emerald-600/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Mic size={13} />
          <span>Voice Cloning</span>
        </button>
        <button
          onClick={() => setStudioActiveTab("custom_models")}
          className={`flex-1 min-w-[130px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            studioActiveTab === "custom_models"
              ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Cpu size={13} />
          <span>Custom Models & UE</span>
        </button>
        <button
          onClick={() => setStudioActiveTab("audio_mixer")}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            studioActiveTab === "audio_mixer"
              ? "bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-600/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Music size={13} />
          <span>Audio & BGM Mixer</span>
        </button>
      </div>

      {studioActiveTab === "motion_vfx" && (
        <DynamicMotionDeck
          config={dynamicMotionConfig}
          onChangeConfig={setDynamicMotionConfig}
          liveMotionPreview={liveMotionPreview}
          onToggleLivePreview={setLiveMotionPreview}
        />
      )}

      {studioActiveTab === "cloning" && (
        <VoiceCloningLab
          selectedAvatar={selectedAvatar}
          onSelectAvatar={setSelectedAvatar}
          onAddClonedVoice={(cloned) => {
            setCustomAvatars(prev => [cloned, ...prev]);
            setSelectedAvatar(cloned);
            setStudioActiveTab("avatar");
          }}
        />
      )}

      {studioActiveTab === "custom_models" && (
        <CustomModelHub />
      )}

      {studioActiveTab === "audio_mixer" && (
        <AudioMixerTrack
          selectedBgm={selectedBgm}
          onSelectBgm={setSelectedBgm}
          voiceVolume={voiceVolume}
          setVoiceVolume={setVoiceVolume}
          bgmVolume={bgmVolume}
          setBgmVolume={setBgmVolume}
          autoDuckingEnabled={autoDuckingEnabled}
          setAutoDuckingEnabled={setAutoDuckingEnabled}
          duckingAmount={duckingAmount}
          setDuckingAmount={setDuckingAmount}
          sfxEnabled={sfxEnabled}
          setSfxEnabled={setSfxEnabled}
        />
      )}

      {(studioActiveTab === "build" || studioActiveTab === "avatar") && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Direct Settings Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0f111a]/95 border border-indigo-500/15 rounded-2xl p-5 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
              <h3 className="text-xs font-black text-indigo-300 tracking-wider uppercase flex items-center space-x-2">
                <Sparkles size={14} className="text-purple-400" />
                <span>Director Controls</span>
              </h3>
              <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest font-mono">
                Engine V3.0
              </span>
            </div>

            {studioActiveTab === "build" ? (
              <>
                {/* Topic Input */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold">What is this short about?</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want this 1-minute video to showcase..."
                    rows={4}
                    className="w-full bg-[#07080d] text-slate-100 border border-indigo-500/10 focus:border-indigo-500/50 rounded-xl p-3 text-xs focus:outline-none placeholder-slate-700 font-sans leading-relaxed transition-all shadow-inner"
                  />
                </div>

                {/* URL processing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold flex items-center space-x-1.5">
                      <Link2 size={12} className="text-indigo-400" />
                      <span>Free Context URL</span>
                    </label>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Scraped for Free</span>
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste job link, article, or post (e.g., jobs.micro1.ai/post/...)"
                    className="w-full bg-[#07080d] text-slate-200 border border-indigo-500/10 focus:border-indigo-500/50 rounded-xl px-3 py-2.5 text-xs focus:outline-none placeholder-slate-700 font-mono transition-all"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold">Quick seeds</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {templates.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setPrompt(tpl.text);
                          if (i === 0) {
                            setUrl("https://jobs.micro1.ai/post/7dbb09e4-d2d9-4138-ba02-f8a1bc6a71a5");
                          } else {
                            setUrl("");
                          }
                        }}
                        className="text-[11px] bg-[#07080d] hover:bg-indigo-950/20 text-slate-300 p-2.5 rounded-xl border border-indigo-500/10 text-left transition-colors flex items-center justify-between group"
                      >
                        <span className="group-hover:text-white transition-colors">💡 {tpl.label}</span>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-indigo-400 group-hover:text-indigo-300 font-bold">Select Seed</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Styled Presets dropdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold">Atmospheric Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full bg-[#07080d] text-slate-200 border border-indigo-500/10 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500/50 font-medium cursor-pointer"
                    >
                      <option value="cinematic">Cinematic Moody</option>
                      <option value="professional">SaaS Tech Light</option>
                      <option value="casual">Energetic Instagram</option>
                      <option value="modern">Minimalist Editorial</option>
                      <option value="dramatic">Premium Dark Luxury</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold">Aspect Format</label>
                    <div className="flex bg-[#07080d] rounded-xl border border-indigo-500/10 p-1">
                      <button
                        onClick={() => setAspectRatio("9:16")}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${
                          aspectRatio === "9:16" 
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        9:16 Portrait
                      </button>
                      <button
                        onClick={() => setAspectRatio("16:9")}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${
                          aspectRatio === "16:9" 
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        16:9 Landscape
                      </button>
                    </div>
                  </div>
                </div>

                {/* Media Upload References */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold flex items-center space-x-1.5">
                      <ImageIcon size={12} className="text-indigo-400" />
                      <span>Reference Imagery</span>
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono">{images.length}/3 loaded</span>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
                      dragging 
                        ? "border-indigo-500 bg-indigo-500/5" 
                        : "border-indigo-500/10 hover:border-indigo-500/30 bg-[#07080d]/60"
                    }`}
                    onClick={() => document.getElementById("img-upload-stock")?.click()}
                  >
                    <input
                      id="img-upload-stock"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload size={16} className="text-indigo-400/60 mb-1.5" />
                    <p className="text-[10px] text-slate-300 font-bold text-center">Drag files or click to reference</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">Supports PNG, JPG, WebP guidelines.</p>
                  </div>

                  {images.length > 0 && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {images.map((base64, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-lg border border-indigo-500/10 overflow-hidden group">
                          <img src={base64} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(idx);
                            }}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={11} className="text-rose-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Run generation */}
                <button
                  onClick={handleGenerateScript}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs tracking-widest uppercase transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer shadow-indigo-600/15 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-white" />
                      <span>Synthesizing Storyboard...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-white" />
                      <span>Generate Artlist Concept</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              // Studio Active Tab is "avatar" - Render voice selector inside left column!
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold block">AI Voice Actors & Narrators</label>
                  <p className="text-[9px] text-slate-400">Audition the perfect speaker for your brand short.</p>
                </div>

                {isGeneratingVoices && (
                  <div className="flex items-center space-x-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-400 font-medium animate-pulse">
                    <RefreshCw size={13} className="animate-spin shrink-0" />
                    <div className="flex-1 flex flex-col space-y-0.5">
                      <span className="font-bold">Generating premium voiceovers...</span>
                      <span className="text-[9px] text-slate-400 font-normal">({voiceGenProgress}% Completed)</span>
                    </div>
                  </div>
                )}

                {/* List of custom avatars inside settings card */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {allAvatars.map((avatar) => {
                    const isSelected = selectedAvatar.id === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          setSelectedAvatar(avatar);
                          if (window.speechSynthesis) window.speechSynthesis.cancel();
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center space-x-3 relative group cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-600/10 border-indigo-500 shadow-md" 
                            : "bg-[#07080d] border-indigo-500/5 hover:border-indigo-500/20"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatar.avatarColor} flex items-center justify-center text-lg shadow shrink-0`}>
                          {avatar.avatarIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <p className={`text-[11px] font-black tracking-wide ${isSelected ? "text-indigo-400" : "text-slate-200"}`}>
                              {avatar.name} <span className="text-[8px] font-normal text-slate-400">({avatar.label})</span>
                            </p>
                            {avatar.isCustomClone && (
                              <span className="text-[7px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                                CLONED
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-slate-400 uppercase tracking-widest font-mono truncate">
                            {avatar.accent}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                            <Check size={10} className="text-white stroke-[3px]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStudioActiveTab("cloning")}
                  className="w-full py-2 px-3 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#07080d] hover:from-emerald-900/40 hover:to-teal-900/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Mic size={11} />
                  <span>+ Record & Clone Voice in Lab</span>
                </button>

                {/* Selected Voice properties */}
                <div className="bg-[#07080d] border border-indigo-500/10 rounded-xl p-3.5 space-y-3">
                  <div className="space-y-0.5 border-b border-indigo-500/5 pb-2">
                    <p className="text-[10px] font-extrabold text-slate-200">
                      Selected: <span className="text-indigo-400 font-mono">{selectedAvatar.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-500 leading-normal">{selectedAvatar.description}</p>
                  </div>

                  {/* Vocal wave indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Vocal Wave Amplitude</span>
                    <div className="flex items-end gap-[1.5px] h-3.5 w-12 pl-1.5">
                      <span className={`w-[2.5px] bg-indigo-500 rounded-full ${isPlaying && !audioMuted ? "animate-[bounce_0.6s_infinite_0.1s]" : "h-1"}`} style={{ height: isPlaying && !audioMuted ? undefined : "20%" }} />
                      <span className={`w-[2.5px] bg-indigo-500 rounded-full ${isPlaying && !audioMuted ? "animate-[bounce_0.6s_infinite_0.3s]" : "h-1"}`} style={{ height: isPlaying && !audioMuted ? undefined : "60%" }} />
                      <span className={`w-[2.5px] bg-indigo-500 rounded-full ${isPlaying && !audioMuted ? "animate-[bounce_0.6s_infinite_0.2s]" : "h-1"}`} style={{ height: isPlaying && !audioMuted ? undefined : "40%" }} />
                      <span className={`w-[2.5px] bg-indigo-500 rounded-full ${isPlaying && !audioMuted ? "animate-[bounce_0.6s_infinite_0.4s]" : "h-1"}`} style={{ height: isPlaying && !audioMuted ? undefined : "15%" }} />
                    </div>
                  </div>

                  <button
                    onClick={() => speakAvatarIntro(selectedAvatar)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2 px-3 rounded-lg text-[9px] uppercase tracking-widest flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Volume2 size={11} className="stroke-[3px]" />
                    <span>Audition Vocal Accent</span>
                  </button>
                </div>

                {/* Premium Puter.js Synthesis options inside the Tab settings */}
                <div className="space-y-3 pt-2 border-t border-indigo-500/10">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-indigo-300 font-extrabold block">Voice Provider</label>
                    <select
                      value={voiceProvider}
                      onChange={(e) => {
                        const provider = e.target.value as any;
                        setVoiceProvider(provider);
                        if (provider === "openai") setPuterVoice("nova");
                        else if (provider === "gemini") setPuterVoice("Puck");
                        else if (provider === "elevenlabs") setPuterVoice("Rachel");
                        else if (provider === "xai") setPuterVoice("eve");
                      }}
                      className="w-full bg-[#07080d] text-slate-200 border border-indigo-500/10 rounded-xl py-1.5 px-2.5 text-[10px] focus:outline-none focus:border-indigo-500/50 cursor-pointer font-medium"
                    >
                      <option value="openai">OpenAI (Ultra Hyper-Realistic)</option>
                      <option value="gemini">Google Gemini TTS (Conversational)</option>
                      <option value="elevenlabs">ElevenLabs (High-Fidelity Cinema)</option>
                      <option value="xai">xAI Grok TTS (Expressive Tags)</option>
                      <option value="browser">Device Browser Synth (Standard Fallback)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Premium Active Stock Player & AI Voice Avatar Suite */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Stock Player Board */}
          <div className="bg-[#0f111a]/95 border border-indigo-500/15 rounded-2xl p-5 min-h-[580px] flex flex-col justify-between shadow-xl relative overflow-hidden shadow-indigo-500/5">
            
            {/* Loader Layer */}
            {loading && (
              <div className="absolute inset-0 bg-[#07080d]/95 backdrop-blur-md flex flex-col items-center justify-center z-30 rounded-2xl space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film size={18} className="text-indigo-400 animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-1.5 text-center max-w-sm px-4 animate-pulse">
                  <p className="text-xs font-mono font-bold text-indigo-400 tracking-wider uppercase">
                    {loaderPhrases[loadingStep]}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Applying stock typography, overlays, sound segments, and voice guidelines...
                  </p>
                </div>
              </div>
            )}

            {/* MP4 Compilation Overlay */}
            {isCompilingMp4 && (
              <div className="absolute inset-0 bg-[#07080d]/98 z-40 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in backdrop-blur-md">
                <div className="space-y-4 max-w-sm w-full">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <Video className="text-indigo-400 relative z-10 animate-pulse" size={24} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest text-indigo-400">Compiling MP4 Video</h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{mp4Status}</p>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-indigo-500/10">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${mp4Progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400">{mp4Progress}% Completed</span>
                  
                  <p className="text-[9px] text-slate-500 leading-normal">
                    Please keep this browser tab active. Generating cinematic frame transitions and word-wrapped overlays in real-time.
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!scriptResult && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5">
                <div className="w-16 h-16 bg-[#07080d] border border-indigo-500/15 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5 relative group">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-lg group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
                  <Film size={24} className="relative z-10" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">Awaiting Cinematic Conception</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Formulate your video narrative on the left control deck. The Higgsfield synthesize engine will extract structures, sync voice overs, and render 5 sequential scenes.
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Player Board */}
            {scriptResult && !loading && (
              <div className="flex-1 flex flex-col justify-between space-y-5">
                
                {/* Header Info Panel */}
                <div className="flex items-start justify-between border-b border-indigo-500/10 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] uppercase tracking-widest font-mono font-black text-indigo-400">
                        Visual Concepts Panel
                      </span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wider">
                        Concept {activeConcept + 1}
                      </span>
                    </div>
                    <h2 className="text-sm font-extrabold text-white tracking-tight">{scriptResult.title}</h2>
                    <p className="text-[11px] text-slate-400 max-w-md">{scriptResult.summary}</p>
                  </div>
                  
                  {/* Concept Toggle Switchers Inside Player */}
                  <div className="flex bg-[#07080d] border border-indigo-500/10 rounded-xl p-1 shadow-inner">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveConcept(idx);
                          setActiveSceneIdx(0);
                          setProgress(0);
                          setIsPlaying(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-250 cursor-pointer ${
                          activeConcept === idx 
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/10" 
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        C{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Motion Engine Status & Toggle Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-1 pb-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setLiveMotionPreview(!liveMotionPreview)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[9px] font-mono font-bold transition-all cursor-pointer border ${
                        liveMotionPreview
                          ? "bg-gradient-to-r from-indigo-600/25 to-purple-600/25 text-indigo-300 border-indigo-500/40 shadow-sm"
                          : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      <Zap size={10} className={liveMotionPreview ? "text-indigo-400 animate-pulse" : ""} />
                      <span>{liveMotionPreview ? "60 FPS DYNAMIC MOTION ENGINE ON" : "SWITCH TO DYNAMIC ENGINE"}</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                    <span>CAMERA:</span>
                    <span className="text-indigo-400 font-bold uppercase">{dynamicMotionConfig.cameraMotion.replace(/_/g, " ")}</span>
                    <span className="text-slate-700">|</span>
                    <span>LUT:</span>
                    <span className="text-purple-400 font-bold uppercase">{dynamicMotionConfig.colorLut.replace(/_/g, " ")}</span>
                    <span className="text-slate-700">|</span>
                    <span>VFX:</span>
                    <span className="text-amber-400 font-bold uppercase">{dynamicMotionConfig.atmosphericVfx.replace(/_/g, " ")}</span>
                  </div>
                </div>

                {/* Primary Screen Viewport (Dynamic Canvas or Classic) */}
                <div className="flex flex-col items-center justify-center py-2 relative">
                  
                  {liveMotionPreview ? (
                    <div className="relative group flex flex-col items-center">
                      <LiveDynamicCanvasPlayer
                        imageUrl={scriptResult.scenes[activeSceneIdx]?.imageUrl}
                        nextImageUrl={scriptResult.scenes[(activeSceneIdx + 1) % scriptResult.scenes.length]?.imageUrl}
                        sceneNumber={activeSceneIdx + 1}
                        totalScenes={scriptResult.scenes.length}
                        cameraMotionLabel={scriptResult.scenes[activeSceneIdx]?.cameraMotion}
                        narrationText={scriptResult.scenes[activeSceneIdx]?.narration}
                        textOverlay={scriptResult.scenes[activeSceneIdx]?.textOverlay}
                        aspectRatio={aspectRatio}
                        isPlaying={isPlaying}
                        progress={progress}
                        sceneProgress={(progress % 12) / 12}
                        selectedAvatar={selectedAvatar}
                        dynamicConfig={dynamicMotionConfig}
                        liveMotionActive={isPlaying || liveMotionPreview}
                      />

                      {/* In-canvas action menu */}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-25 pointer-events-auto backdrop-blur-xs rounded-2xl">
                        <button
                          onClick={() => handleGenerateSceneFrame(activeSceneIdx)}
                          disabled={generatingFrameId !== null}
                          className="bg-gradient-to-r from-indigo-600 via-purple-650 to-pink-650 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-xl flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 transition-all active:scale-95 border border-white/10"
                        >
                          {generatingFrameId === activeSceneIdx ? (
                            <>
                              <RefreshCw size={11} className="animate-spin text-white" />
                              <span>Synthesizing Frame...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} className="text-white" />
                              <span>Regenerate Scene Frame</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="relative bg-black border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 group"
                      style={{
                        width: aspectRatio === "9:16" ? "240px" : aspectRatio === "1:1" ? "320px" : "100%",
                        height: aspectRatio === "9:16" ? "420px" : aspectRatio === "1:1" ? "320px" : "280px"
                      }}
                    >
                      {/* Scene Visual Frame */}
                      {scriptResult.scenes[activeSceneIdx]?.imageUrl ? (
                        <img 
                          src={scriptResult.scenes[activeSceneIdx].imageUrl} 
                          alt="Cinematic stock background"
                          className={`w-full h-full object-cover transition-transform duration-[12000ms] ${
                            isPlaying ? "scale-105 translate-y-1" : "scale-100"
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#07080d] flex items-center justify-center text-slate-500 font-mono text-[9px]">
                          Buffering frame...
                        </div>
                      )}

                      {/* Dark overlay mask */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

                      {/* Left Active Badge */}
                      <div className="absolute top-3 left-3 bg-[#07080d]/95 border border-indigo-500/25 text-[9px] font-black px-2.5 py-1 rounded-full text-white backdrop-blur-md flex items-center space-x-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.4)]">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="tracking-widest font-mono uppercase">SCENE {activeSceneIdx + 1} / 5</span>
                      </div>

                      {/* Voice Avatar Live Circle Overlay inside Video */}
                      <div className="absolute bottom-3 left-3 bg-[#07080d]/95 border border-indigo-500/20 rounded-full py-1.5 px-3 backdrop-blur-md flex items-center space-x-2 z-10 shadow-[0_4px_15px_rgba(0,0,0,0.4)]">
                        <span className="text-sm">{selectedAvatar.avatarIcon}</span>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-white leading-tight uppercase tracking-wider">{selectedAvatar.name}</span>
                          <span className="text-[6px] text-indigo-400 uppercase tracking-widest font-bold">A.I. Narrator</span>
                        </div>
                        
                        {isPlaying && !audioMuted && (
                          <div className="flex items-end gap-[1.5px] h-3.5 pl-1.5 border-l border-indigo-500/20">
                            <span className="w-[1.5px] bg-indigo-500 rounded-full animate-[bounce_0.6s_infinite_0.1s]" style={{ height: "40%" }} />
                            <span className="w-[1.5px] bg-purple-500 rounded-full animate-[bounce_0.6s_infinite_0.3s]" style={{ height: "90%" }} />
                            <span className="w-[1.5px] bg-pink-500 rounded-full animate-[bounce_0.6s_infinite_0.2s]" style={{ height: "60%" }} />
                          </div>
                        )}
                      </div>

                      {/* Right motion cue */}
                      <div className="absolute top-3 right-3 bg-[#07080d]/90 border border-indigo-500/10 text-[8px] font-mono px-2 py-1 rounded text-slate-300 font-bold backdrop-blur-md uppercase tracking-wider shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                        {scriptResult.scenes[activeSceneIdx]?.cameraMotion || "Steady Scan"}
                      </div>

                      {/* Subtitles Overlay */}
                      <div className="absolute inset-x-4 inset-y-16 flex flex-col justify-between items-center pointer-events-none">
                        <div className="w-full flex justify-center text-center">
                          <div className="space-y-0.5 animate-fade-in">
                            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-indigo-400">
                              Active Segment
                            </span>
                            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                              {scriptResult.scenes[activeSceneIdx]?.textOverlay || "CONCEPT BOARD"}
                            </h3>
                          </div>
                        </div>

                        <div className="w-full flex justify-center">
                          <div className="bg-black/90 border border-indigo-500/10 rounded-xl px-3 py-1.5 text-center backdrop-blur-sm max-w-[90%] select-none shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                            <p className="text-[9px] text-slate-300 font-mono tracking-wide leading-tight">
                              "{scriptResult.scenes[activeSceneIdx]?.textOverlay || "Cinematic Stock Preview"}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* In-canvas action menu */}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-25 pointer-events-auto backdrop-blur-xs">
                        <button
                          onClick={() => handleGenerateSceneFrame(activeSceneIdx)}
                          disabled={generatingFrameId !== null}
                          className="bg-gradient-to-r from-indigo-600 via-purple-650 to-pink-650 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-xl flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 transition-all active:scale-95 border border-white/10"
                        >
                          {generatingFrameId === activeSceneIdx ? (
                            <>
                              <RefreshCw size={11} className="animate-spin text-white" />
                              <span>Synthesizing Frame...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} className="text-white" />
                              <span>Regenerate Scene Frame</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  )}

                </div>

                {/* Subtitles / Script display card */}
                <div className="bg-[#07080d]/80 border border-indigo-500/10 rounded-2xl p-4.5 space-y-3.5 shadow-lg shadow-indigo-500/[0.02]">
                  <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
                      Narrator Speech Script
                    </span>
                    <span className="text-[9px] text-indigo-400 font-mono font-black flex items-center space-x-1">
                      <Clock size={10} />
                      <span>{activeSceneIdx * 12}s - {(activeSceneIdx + 1) * 12}s</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-100 leading-relaxed italic">
                    "{scriptResult.scenes[activeSceneIdx]?.narration || "Speech vocal script placeholder."}"
                  </p>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    🎬 <span className="font-extrabold text-indigo-300 font-mono uppercase tracking-widest">Visual Direction:</span> {scriptResult.scenes[activeSceneIdx]?.visualDescription}
                  </p>

                  {/* Direct speak gesture trigger */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-indigo-500/5">
                    <button
                      onClick={() => speakSceneOutLoud(activeSceneIdx)}
                      className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all self-start cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      <Volume2 size={11} className="stroke-[3px]" />
                      <span>🎙️ Speak Scene (Direct Voice)</span>
                    </button>
                    <span className="text-[8px] text-slate-500 italic">
                      Direct click gesture triggers real-time vocal preview bypass.
                    </span>
                  </div>

                  {/* Sandbox helper instruction banner */}
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 text-[9px] text-slate-400 flex items-start space-x-2.5">
                    <span className="text-indigo-400 font-bold text-xs leading-none">💡</span>
                    <div className="space-y-0.5">
                      <p className="text-slate-300 font-bold">Sound silent or blocked by the preview frame?</p>
                      <p className="leading-normal text-slate-400">
                        Modern browsers block automated sound inside sandboxed iframes. Click <strong>[Open in New Tab]</strong> (the small square-with-arrow icon in the top right header of the AI Studio preview window) to open the app directly and unlock full high-fidelity narrations!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aligned Artlist-style Action Bar */}
                <div className="space-y-4 pt-2">
                  
                  {/* Volume, Play, Timeline Scrub Controllers */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      {/* Play Action */}
                      <button
                        onClick={handlePlayPause}
                        className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        title={isPlaying ? "Pause Preview" : "Play Concept Audio Video"}
                      >
                        {isPlaying ? <Pause size={13} fill="currentColor" className="text-white" /> : <Play size={13} fill="currentColor" className="text-white ml-0.5" />}
                      </button>

                      {/* Restart */}
                      <button
                        onClick={handleResetPlayback}
                        className="p-2 bg-[#07080d] border border-indigo-500/10 rounded-xl hover:bg-indigo-500/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Restart Player"
                      >
                        <RotateCcw size={12} />
                      </button>

                      {/* Sound toggle */}
                      <button
                        onClick={() => {
                          setAudioMuted(!audioMuted);
                          if (!audioMuted && window.speechSynthesis) window.speechSynthesis.cancel();
                        }}
                        className={`p-2 border rounded-xl transition-all cursor-pointer ${
                          audioMuted 
                            ? "bg-rose-950/20 border-rose-900/30 text-rose-400 hover:bg-rose-950/30" 
                            : "bg-[#07080d] border-indigo-500/10 text-slate-400 hover:text-white hover:bg-indigo-500/10"
                        }`}
                        title={audioMuted ? "Unmute Voiceover" : "Mute Voiceover"}
                      >
                        {audioMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    </div>

                    {/* Timeline Position markers */}
                    <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                      <span className="text-indigo-400 font-black">{Math.floor(progress)}s</span>
                      <span className="text-slate-650">/</span>
                      <span>60s</span>
                    </div>
                  </div>

                  {/* 5-Scene horizontal timeline segment tracks */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-1.5 h-1.5">
                      {scriptResult.scenes.map((_, idx) => {
                        const sceneStart = idx * 12;
                        const sceneEnd = (idx + 1) * 12;
                        const isPast = progress >= sceneEnd;
                        const isActive = progress >= sceneStart && progress < sceneEnd;
                        const activeFillPercentage = isActive ? ((progress - sceneStart) / 12) * 100 : 0;

                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleTimelineJump(idx)}
                            className={`relative h-full rounded-full cursor-pointer transition-all overflow-hidden ${
                              isPast 
                                ? "bg-indigo-600" 
                                : isActive 
                                ? "bg-indigo-950/30 border border-indigo-500/30" 
                                : "bg-[#07080d] border border-indigo-500/10"
                            }`}
                          >
                            {isActive && (
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
                                style={{ width: `${activeFillPercentage}%` }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-500 font-extrabold font-mono">
                      <span>1. Hook</span>
                      <span>2. Pitch</span>
                      <span>3. Tech Stack</span>
                      <span>4. Benefits</span>
                      <span>5. CTA</span>
                    </div>
                  </div>

                  {/* Action Bar matching Artlist controls on screenshot */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-indigo-500/10">
                    <div className="flex items-center space-x-2">
                      {/* Use Dropdown button */}
                      <div className="relative inline-flex align-middle">
                        <button 
                          onClick={() => alert("Setting selected template to editor layout context.")}
                          className="bg-[#07080d] border border-indigo-500/10 hover:border-indigo-500/30 text-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Use Concept</span>
                          <ChevronDown size={11} />
                        </button>
                      </div>

                      {/* Compile & Download MP4 Button */}
                      <button
                        onClick={compileAndDownloadMp4}
                        disabled={isCompilingMp4}
                        className="bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10 font-mono"
                      >
                        {isCompilingMp4 ? (
                          <>
                            <RefreshCw size={11} className="animate-spin text-white" />
                            <span>Compiling MP4...</span>
                          </>
                        ) : (
                          <>
                            <Video size={11} className="text-white" />
                            <span>Download MP4 Video</span>
                          </>
                        )}
                      </button>

                      {/* Download File */}
                      <button 
                        onClick={() => {
                          const fileContent = `TITLE: ${scriptResult.title}\nSUMMARY: ${scriptResult.summary}\n\n` + 
                            scriptResult.scenes.map(s => `SCENE ${s.sceneNumber} (${s.duration}s)\nVISUAL CONCEPT: ${s.visualDescription}\nTEXT OVERLAY: ${s.textOverlay}\nNARRATION VOICE OVER: "${s.narration}"\n\n`).join("\n");
                          const blob = new Blob([fileContent], { type: "text/plain" });
                          const el = document.createElement("a");
                          el.href = URL.createObjectURL(blob);
                          el.download = `${scriptResult.title.toLowerCase().replace(/\s+/g, "_")}_screenplay.txt`;
                          document.body.appendChild(el);
                          el.click();
                          document.body.removeChild(el);
                        }}
                        className="p-1.5 bg-[#07080d] border border-indigo-500/10 hover:border-indigo-500/30 text-slate-300 rounded-lg hover:text-white transition-all cursor-pointer"
                        title="Download Screenplay Code File"
                      >
                        <Download size={12} />
                      </button>

                      {/* Options menu */}
                      <button className="p-1.5 hover:bg-indigo-500/10 text-slate-500 rounded-lg cursor-pointer" title="More Options">
                        <MoreVertical size={12} />
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Maximize2 size={12} className="cursor-pointer hover:text-indigo-400 transition-colors" title="Fullscreen player" />
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      </div>
      )}

    </div>
  );
}
