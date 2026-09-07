export interface VoiceAvatar {
  id: string;
  name: string;
  label: string;
  gender: "male" | "female" | "robot" | "custom";
  accent: string;
  avatarIcon: string;
  avatarColor: string;
  defaultRate: number;
  defaultPitch: number;
  description: string;
  isCustomClone?: boolean;
  sampleAudioUrl?: string;
  endpointUrl?: string;
}

export interface BgmTrack {
  id: string;
  name: string;
  category: string;
  duration: string;
  bpm: number;
  audioUrl: string;
}

export interface CustomModelConfig {
  id: string;
  name: string;
  modelType: "voice" | "video_avatar" | "diffusion_broll" | "ue_embody" | "transformer_llm";
  framework: "F5-TTS" | "XTTS-v2" | "LivePortrait" | "SadTalker" | "Wan2.1" | "Unreal Engine 5 Embody" | "Llama-LoRA";
  endpointUrl: string;
  apiKey?: string;
  status: "idle" | "testing" | "active" | "error";
  latencyMs?: number;
  lastTested?: string;
  enabled: boolean;
}

export type CameraMotionType = "ken_burns_zoom" | "pan_and_scan" | "orbital_drift" | "handheld_shake" | "dolly_zoom" | "whip_zoom";
export type AtmosphericVfxType = "none" | "ambient_bokeh" | "golden_dust" | "anamorphic_flare" | "cyber_hud" | "film_grain";
export type ColorLutType = "standard" | "teal_orange" | "cyber_neon" | "kodak_portra" | "moody_noir" | "golden_hour";
export type TransitionEffectType = "cross_fade" | "film_burn" | "glitch_splice" | "whip_pan" | "dip_black";

export interface DynamicMotionConfig {
  cameraMotion: CameraMotionType;
  motionIntensity: number; // 0.5 to 2.0
  atmosphericVfx: AtmosphericVfxType;
  vfxIntensity: number; // 0.1 to 1.0
  colorLut: ColorLutType;
  transitionEffect: TransitionEffectType;
  transitionDurationMs: number; // 300 to 1200
  letterboxCinemascope: boolean; // 2.39:1 anamorphic bars
  kineticCaptionStyle: "karaoke" | "glow_pop" | "bold_box" | "minimal_sub";
}
