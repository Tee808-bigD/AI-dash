import React from "react";
import { 
  Camera, 
  Sparkles, 
  Sliders, 
  Layers, 
  Film, 
  Zap, 
  Compass, 
  Activity, 
  Palette,
  Eye,
  Check
} from "lucide-react";
import { 
  DynamicMotionConfig, 
  CameraMotionType, 
  AtmosphericVfxType, 
  ColorLutType, 
  TransitionEffectType 
} from "./types";

interface DynamicMotionDeckProps {
  config: DynamicMotionConfig;
  onChangeConfig: (newConfig: DynamicMotionConfig) => void;
  liveMotionPreview: boolean;
  onToggleLivePreview: (enabled: boolean) => void;
}

export default function DynamicMotionDeck({
  config,
  onChangeConfig,
  liveMotionPreview,
  onToggleLivePreview
}: DynamicMotionDeckProps) {
  const updateField = <K extends keyof DynamicMotionConfig>(field: K, value: DynamicMotionConfig[K]) => {
    onChangeConfig({
      ...config,
      [field]: value
    });
  };

  const CAMERA_MOTIONS: { id: CameraMotionType; label: string; desc: string; icon: string }[] = [
    { id: "ken_burns_zoom", label: "Ken Burns Push", desc: "Hollywood slow zoom with cubic focal ease", icon: "🔍" },
    { id: "pan_and_scan", label: "Cinematic Pan", desc: "Dynamic diagonal camera sweep across key subjects", icon: "📐" },
    { id: "orbital_drift", label: "Orbital Arc", desc: "Curved 3D drone sweep with subtle tilt rotation", icon: "🛰️" },
    { id: "handheld_shake", label: "Handheld Organic", desc: "Authentic documentary micro-jitter & breathing", icon: "🎥" },
    { id: "dolly_zoom", label: "Vertigo Dolly", desc: "Dynamic focal compression / background stretch", icon: "⚡" },
    { id: "whip_zoom", label: "Dynamic Whip Snap", desc: "High-impact kinetic snap settling into scan", icon: "🚀" }
  ];

  const ATMOSPHERIC_VFX: { id: AtmosphericVfxType; label: string; badge: string; desc: string }[] = [
    { id: "ambient_bokeh", label: "Floating Bokeh Orbs", badge: "Luminous", desc: "Soft out-of-focus luminous orbs floating upwards" },
    { id: "golden_dust", label: "Golden Dust Motes", badge: "Warm", desc: "Shimmering golden sunlight specks with depth" },
    { id: "anamorphic_flare", label: "Anamorphic Streak", badge: "Cinema", desc: "Cyan/purple horizontal anamorphic lens streak" },
    { id: "cyber_hud", label: "Cyberpunk HUD Grid", badge: "Tech", desc: "Digital scanlines, corner brackets, and coordinate metrics" },
    { id: "film_grain", label: "35mm Grain & Vignette", badge: "Organic", desc: "Subtle film grain with feathered corner vignette" },
    { id: "none", label: "Clean Pristine", badge: "Off", desc: "No atmospheric particle layers applied" }
  ];

  const COLOR_LUTS: { id: ColorLutType; label: string; previewColor: string; desc: string }[] = [
    { id: "teal_orange", label: "Blockbuster Teal & Orange", previewColor: "from-teal-600 to-amber-500", desc: "Deep cyan shadows paired with warm skin highlights" },
    { id: "cyber_neon", label: "Cyberpunk Electric Neon", previewColor: "from-cyan-400 to-fuchsia-600", desc: "Hyper-saturated neon blues, purples, and magenta" },
    { id: "kodak_portra", label: "Kodak Portra 400", previewColor: "from-amber-200 to-orange-400", desc: "Creamy organic highlights and rich pastel tones" },
    { id: "golden_hour", label: "Sunset Golden Hour", previewColor: "from-amber-500 to-red-500", desc: "Warm volumetric afternoon sunlight and glow" },
    { id: "moody_noir", label: "Silver Screen Noir", previewColor: "from-slate-400 to-zinc-800", desc: "High contrast monochrome with cool tint" },
    { id: "standard", label: "Natural Neutral", previewColor: "from-slate-600 to-slate-400", desc: "Raw visual input without color LUT grading" }
  ];

  const TRANSITIONS: { id: TransitionEffectType; label: string; icon: string }[] = [
    { id: "film_burn", label: "Film Burn Flash", icon: "🔥" },
    { id: "whip_pan", label: "Whip Pan Blur", icon: "💨" },
    { id: "glitch_splice", label: "Glitch Slice", icon: "⚡" },
    { id: "cross_fade", label: "Smooth Crossfade", icon: "✨" },
    { id: "dip_black", label: "Dip to Black", icon: "🌑" }
  ];

  return (
    <div className="bg-[#0f111a]/95 border border-indigo-500/20 rounded-2xl p-5 space-y-6 shadow-2xl backdrop-blur-md">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg text-white shadow-md shadow-indigo-600/20">
              <Zap size={14} />
            </span>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Dynamic Generative Motion & VFX Deck
            </h3>
            <span className="text-[9px] bg-purple-500/20 text-purple-300 font-mono font-bold px-2 py-0.5 rounded border border-purple-500/30">
              Real-time Motion FX
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Choreograph dynamic camera pan/zooms, volumetric particles, and cinematic color LUTs into your video stream.
          </p>
        </div>

        {/* Live Motion Preview Toggle */}
        <div className="flex items-center space-x-2.5 bg-[#07080d] px-3 py-1.5 rounded-xl border border-indigo-500/20 self-start sm:self-auto">
          <Eye size={13} className={liveMotionPreview ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
            Live Motion Engine:
          </span>
          <button
            onClick={() => onToggleLivePreview(!liveMotionPreview)}
            className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              liveMotionPreview 
                ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20" 
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {liveMotionPreview ? "ACTIVE (60 FPS)" : "PAUSED"}
          </button>
        </div>
      </div>

      {/* 1. Camera Motion Choreography */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera size={13} className="text-indigo-400" />
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              1. Camera Motion Choreography
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span>Intensity:</span>
            <span className="text-indigo-400 font-bold">{config.motionIntensity.toFixed(1)}x</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CAMERA_MOTIONS.map((motion) => {
            const isSelected = config.cameraMotion === motion.id;
            return (
              <button
                key={motion.id}
                onClick={() => updateField("cameraMotion", motion.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  isSelected 
                    ? "bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-600/10 text-white" 
                    : "bg-[#07080d]/80 border-indigo-500/10 hover:border-indigo-500/25 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{motion.icon}</span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check size={10} className="stroke-[3px]" />
                    </span>
                  )}
                </div>
                <div>
                  <p className={`text-[11px] font-bold tracking-wide ${isSelected ? "text-indigo-300" : "text-slate-200"}`}>
                    {motion.label}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">
                    {motion.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Motion Intensity Slider */}
        <div className="flex items-center space-x-3 bg-[#07080d]/60 p-2.5 rounded-xl border border-indigo-500/10">
          <Sliders size={12} className="text-indigo-400 shrink-0" />
          <span className="text-[10px] text-slate-300 font-medium shrink-0">Zoom & Pan Drift Scale:</span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={config.motionIntensity}
            onChange={(e) => updateField("motionIntensity", parseFloat(e.target.value))}
            className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-mono text-indigo-400 font-bold w-10 text-right">
            {config.motionIntensity.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* 2. Color Grading LUT Filters */}
      <div className="space-y-3 pt-2 border-t border-indigo-500/10">
        <div className="flex items-center space-x-2">
          <Palette size={13} className="text-purple-400" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
            2. Cinematic Color Grading LUT
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {COLOR_LUTS.map((lut) => {
            const isSelected = config.colorLut === lut.id;
            return (
              <button
                key={lut.id}
                onClick={() => updateField("colorLut", lut.id)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-2 ${
                  isSelected 
                    ? "bg-purple-600/15 border-purple-500 shadow-md text-white" 
                    : "bg-[#07080d]/80 border-indigo-500/10 hover:border-indigo-500/25 text-slate-400"
                }`}
              >
                {/* Color swatch circle */}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${lut.previewColor} shadow-inner border border-white/20 flex items-center justify-center`}>
                  {isSelected && <Check size={12} className="text-white drop-shadow" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold truncate ${isSelected ? "text-purple-300" : "text-slate-300"}`}>
                    {lut.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Atmospheric VFX & Particles */}
      <div className="space-y-3 pt-2 border-t border-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles size={13} className="text-amber-400" />
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              3. Atmospheric Particle & Lens Layers
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span>Density:</span>
            <span className="text-amber-400 font-bold">{Math.round(config.vfxIntensity * 100)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ATMOSPHERIC_VFX.map((vfx) => {
            const isSelected = config.atmosphericVfx === vfx.id;
            return (
              <button
                key={vfx.id}
                onClick={() => updateField("atmosphericVfx", vfx.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  isSelected 
                    ? "bg-amber-600/15 border-amber-500 shadow-md text-white" 
                    : "bg-[#07080d]/80 border-indigo-500/10 hover:border-indigo-500/25 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded text-amber-300 border border-amber-500/20">
                    {vfx.badge}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <Check size={10} className="stroke-[3px]" />
                    </span>
                  )}
                </div>
                <div>
                  <p className={`text-[11px] font-bold tracking-wide ${isSelected ? "text-amber-300" : "text-slate-200"}`}>
                    {vfx.label}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-snug">
                    {vfx.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Scene Transitions & Aspect Overlays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-500/10">
        
        {/* Transition Style */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-300 font-bold flex items-center space-x-1.5">
            <Layers size={11} className="text-pink-400" />
            <span>Scene Boundary Transitions</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {TRANSITIONS.map((trans) => {
              const isSelected = config.transitionEffect === trans.id;
              return (
                <button
                  key={trans.id}
                  onClick={() => updateField("transitionEffect", trans.id)}
                  className={`py-2 px-2.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-pink-600/20 border-pink-500 text-pink-300 shadow-sm" 
                      : "bg-[#07080d] border-indigo-500/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{trans.icon}</span>
                  <span className="truncate">{trans.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cinematic Framing & Typography options */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-300 font-bold flex items-center space-x-1.5">
            <Film size={11} className="text-cyan-400" />
            <span>Cinematic Overlays & Formatting</span>
          </label>
          
          <div className="space-y-2">
            {/* Letterbox toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#07080d] border border-indigo-500/10 cursor-pointer hover:border-indigo-500/25 transition-all">
              <div className="flex items-center space-x-2">
                <span className="text-xs">🎬</span>
                <div>
                  <p className="text-[10px] font-bold text-slate-200">2.39:1 Cinemascope Letterbox</p>
                  <p className="text-[8px] text-slate-500">Matte black widescreen theatrical bars</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.letterboxCinemascope}
                onChange={(e) => updateField("letterboxCinemascope", e.target.checked)}
                className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
              />
            </label>

            {/* Kinetic Caption Style */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#07080d] border border-indigo-500/10">
              <span className="text-[10px] font-bold text-slate-200">Kinetic Caption Style:</span>
              <select
                value={config.kineticCaptionStyle}
                onChange={(e) => updateField("kineticCaptionStyle", e.target.value as any)}
                className="bg-[#0f111a] text-indigo-300 border border-indigo-500/20 rounded-lg py-1 px-2 text-[10px] font-mono focus:outline-none cursor-pointer"
              >
                <option value="karaoke">Karaoke Word Glow</option>
                <option value="glow_pop">Pop-in Highlight</option>
                <option value="bold_box">Bold High-Contrast Box</option>
                <option value="minimal_sub">Minimalist Cinema Sub</option>
              </select>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
