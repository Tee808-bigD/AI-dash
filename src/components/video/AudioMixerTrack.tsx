import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Music, Sliders, Sparkles, Layers, RefreshCw, AudioWaveform as Waveform, Radio } from "lucide-react";
import { BgmTrack } from "./types";

interface AudioMixerTrackProps {
  selectedBgm: BgmTrack | null;
  onSelectBgm: (track: BgmTrack | null) => void;
  voiceVolume: number;
  setVoiceVolume: (val: number) => void;
  bgmVolume: number;
  setBgmVolume: (val: number) => void;
  autoDuckingEnabled: boolean;
  setAutoDuckingEnabled: (enabled: boolean) => void;
  duckingAmount: number;
  setDuckingAmount: (val: number) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (val: boolean) => void;
}

export default function AudioMixerTrack({
  selectedBgm,
  onSelectBgm,
  voiceVolume,
  setVoiceVolume,
  bgmVolume,
  setBgmVolume,
  autoDuckingEnabled,
  setAutoDuckingEnabled,
  duckingAmount,
  setDuckingAmount,
  sfxEnabled,
  setSfxEnabled
}: AudioMixerTrackProps) {
  const [bgmTracks, setBgmTracks] = useState<BgmTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchBgmCatalog();
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const fetchBgmCatalog = async () => {
    setLoadingTracks(true);
    try {
      const res = await fetch("/api/audio/bgm-tracks");
      if (res.ok) {
        const data = await res.json();
        setBgmTracks(data.tracks || []);
        // Select first track by default if none selected
        if (!selectedBgm && data.tracks && data.tracks.length > 0) {
          onSelectBgm(data.tracks[0]);
        }
      }
    } catch (e) {
      console.warn("Could not fetch BGM catalog:", e);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleTogglePreview = (track: BgmTrack) => {
    if (previewingTrackId === track.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingTrackId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const audio = new Audio(track.audioUrl);
    previewAudioRef.current = audio;
    audio.volume = bgmVolume;
    audio.loop = true;
    setPreviewingTrackId(track.id);

    audio.play().catch(e => {
      console.warn("BGM preview play failed:", e);
      setPreviewingTrackId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0b0c12]/95 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-black uppercase bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white px-2.5 py-0.5 rounded font-mono">
                Multi-Track DAW
              </span>
              <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider font-mono">
                Audio & BGM Mixer with Auto-Ducking
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Soundtrack & Voice Dynamic Balancing <Music size={16} className="text-pink-400" />
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Mix high-fidelity AI narrator voiceover, royalty-free background music, and whoosh transitions. Auto-ducking automatically attenuates background music when the narrator speaks.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#07080d] border border-indigo-500/20 px-3.5 py-2 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-300 font-bold">Auto-Ducking:</span>
              <button
                onClick={() => setAutoDuckingEnabled(!autoDuckingEnabled)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                  autoDuckingEnabled ? "bg-pink-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    autoDuckingEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Track Mixing Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {/* Track 1: Voice Narration */}
          <div className="bg-[#07080d] border border-indigo-500/15 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                  <Volume2 size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Track 1: Voice</h4>
                  <span className="text-[9px] text-indigo-400 font-mono">PRIMARY DIALOGUE</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-white">{Math.round(voiceVolume * 100)}%</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Dialogue Gain</label>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="bg-black/40 rounded-lg p-2 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Status: Active Master</span>
              <span className="text-emerald-400 font-bold">Priority Lead</span>
            </div>
          </div>

          {/* Track 2: Cinematic BGM */}
          <div className="bg-[#07080d] border border-pink-500/15 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400">
                  <Music size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Track 2: Music (BGM)</h4>
                  <span className="text-[9px] text-pink-400 font-mono">CINEMATIC PAD</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-white">{Math.round(bgmVolume * 100)}%</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Music Bed Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={bgmVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBgmVolume(val);
                  if (previewAudioRef.current) previewAudioRef.current.volume = val;
                }}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Ducking Attenuation:</span>
                <span className="text-pink-400 font-mono font-bold">{Math.round(duckingAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.9}
                step={0.05}
                value={duckingAmount}
                disabled={!autoDuckingEnabled}
                onChange={(e) => setDuckingAmount(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Track 3: SFX Layer */}
          <div className="bg-[#07080d] border border-purple-500/15 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                  <Radio size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Track 3: SFX & Riser</h4>
                  <span className="text-[9px] text-purple-400 font-mono">SCENE WHOOSH</span>
                </div>
              </div>
              <button
                onClick={() => setSfxEnabled(!sfxEnabled)}
                className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase transition-colors cursor-pointer ${
                  sfxEnabled ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-slate-800 text-slate-500"
                }`}
              >
                {sfxEnabled ? "ENABLED" : "MUTED"}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Plays subtle cinematic sweep effects during scene cuts and a micro1 confirmation chime on the final CTA scene.
            </p>

            <div className="bg-black/40 rounded-lg p-2 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Transition Triggers</span>
              <span className="text-purple-400 font-bold">Automatic Sync</span>
            </div>
          </div>
        </div>

        {/* Royalty-Free Soundtrack Catalog Selection */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Music size={14} className="text-pink-400" />
              <span>Cinematic Royalty-Free Music Library</span>
            </h3>
            <button
              onClick={() => onSelectBgm(null)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedBgm === null
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              No Background Music (Voice Only)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {loadingTracks ? (
              <div className="col-span-4 text-center py-6 text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-pink-400" />
                <span>Synthesizing royalty-free harmonic tracks...</span>
              </div>
            ) : (
              bgmTracks.map((track) => {
                const isSelected = selectedBgm?.id === track.id;
                const isPreviewing = previewingTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectBgm(track)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-[#07080d] border-pink-500/50 shadow-lg shadow-pink-500/10"
                        : "bg-[#07080d] border-indigo-500/15 hover:border-pink-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">{track.name}</h4>
                        <p className="text-[9px] text-pink-400 font-mono font-bold">{track.category}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePreview(track);
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isPreviewing
                            ? "bg-pink-500 text-white animate-pulse"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        }`}
                        title={isPreviewing ? "Stop Preview" : "Preview Audio Track"}
                      >
                        {isPreviewing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 text-[9px] font-mono text-slate-400">
                      <span>BPM: {track.bpm}</span>
                      <span className={isSelected ? "text-pink-400 font-bold" : "text-slate-500"}>
                        {isSelected ? "ACTIVE SOUNDTRACK" : "Click to Select"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
