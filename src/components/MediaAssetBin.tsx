import React, { useState, useEffect } from "react";
import { 
  FolderArchive, 
  Image as ImageIcon, 
  Film, 
  Volume2, 
  Code2, 
  Download, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles,
  ArrowUpRight,
  Filter,
  X
} from "lucide-react";
import JSZip from "jszip";
import { MediaAssetItem } from "../types";

const INITIAL_STAGED_ASSETS: MediaAssetItem[] = [
  {
    id: "asset-1",
    title: "Futuristic Aerofoil Hovercraft Concept",
    type: "image",
    url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
    prompt: "Futuristic aerofoil hovercraft gliding above luminescent ocean at twilight, high detail 8k concept art",
    modelUsed: "NVIDIA NIM SDXL Turbo",
    createdAt: "Today, 08:30 AM",
    size: "1.4 MB"
  },
  {
    id: "asset-2",
    title: "Sea Smoke Coastal Autonomous Hatchery",
    type: "image",
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
    prompt: "Autonomous marine aquaculture platform with solar arrays and biometric sensors in misty ocean waters",
    modelUsed: "SDXL Turbo Cinematic",
    createdAt: "Today, 09:12 AM",
    size: "1.8 MB"
  },
  {
    id: "asset-3",
    title: "Telemetry Propulsion Cinematic Keyframe",
    type: "video",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    prompt: "Cinematic camera sweep around the hovercraft revealing blue ion thruster propulsion and wave spray",
    modelUsed: "NVIDIA VideoGPT Motion",
    createdAt: "Today, 09:14 AM",
    size: "3.2 MB"
  },
  {
    id: "asset-4",
    title: "Ion Drive Telemetry Audio Narration",
    type: "audio",
    url: "https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg",
    prompt: "Ion drive propulsion active at ninety-two percent efficiency. Vector telemetry stabilized for oceanic transit.",
    modelUsed: "NeMo FastPitch & HiFi-GAN",
    createdAt: "Today, 09:15 AM",
    size: "240 KB"
  }
];

interface MediaAssetBinProps {
  onSelectAsset?: (asset: MediaAssetItem) => void;
  onSendToVideoStudio?: (asset: MediaAssetItem) => void;
}

export default function MediaAssetBin({
  onSelectAsset,
  onSendToVideoStudio
}: MediaAssetBinProps) {
  const [assets, setAssets] = useState<MediaAssetItem[]>(() => {
    try {
      const saved = localStorage.getItem("nvidia_media_staging_assets");
      return saved ? JSON.parse(saved) : INITIAL_STAGED_ASSETS;
    } catch {
      return INITIAL_STAGED_ASSETS;
    }
  });

  const [activeFilter, setActiveFilter] = useState<"all" | "image" | "video" | "audio" | "code">("all");
  const [previewAsset, setPreviewAsset] = useState<MediaAssetItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("nvidia_media_staging_assets", JSON.stringify(assets));
    } catch (e) {
      console.warn("Local storage quota reached:", e);
    }
  }, [assets]);

  const filteredAssets = assets.filter(a => {
    if (activeFilter === "all") return true;
    return a.type === activeFilter;
  });

  const handleDelete = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const handleCopyUrl = (asset: MediaAssetItem) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("nvidia_multimodal_assets");

      // Generate a manifest of all assets
      const manifest = assets.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        modelUsed: a.modelUsed,
        prompt: a.prompt,
        url: a.url,
        createdAt: a.createdAt
      }));
      folder?.file("manifest.json", JSON.stringify(manifest, null, 2));

      // Add a summary readme
      folder?.file("README.md", `# NVIDIA NIM Staged Artifacts\n\nGenerated with NVIDIA NIM Microservices & NeMo Retriever.\nTotal Assets: ${assets.length}\nTimestamp: ${new Date().toISOString()}`);

      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `nvidia-media-assets-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("ZIP packaging error:", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#0b1622]/90 border border-[#16273a] rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-[#7ae7c7]/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#7ae7c7] to-[#55b89a] text-[#060c15] shadow-lg shadow-[#7ae7c7]/20">
                <FolderArchive size={18} />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Multimodal Media Gallery & Staging Shelf
              </h2>
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-lg bg-[#7ae7c7]/10 text-[#7ae7c7] border border-[#7ae7c7]/20">
                {assets.length} Persistent Artifacts
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Centralized staging bin for all synthesized images, temporal video keyframes, NeMo audio voices, and interactive prototype code bundles.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping || assets.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c49b66] to-[#a47e4f] hover:opacity-95 text-[#060c15] text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-[#c49b66]/20"
            >
              <Download size={14} />
              <span>{isZipping ? "Bundling ZIP..." : "Download All as .ZIP"}</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-5 pt-4 border-t border-[#16273a] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            {[
              { id: "all", label: "All Formats" },
              { id: "image", label: "Images (SDXL)" },
              { id: "video", label: "Videos (Motion)" },
              { id: "audio", label: "Audio (NeMo)" },
              { id: "code", label: "Code Prototypes" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#c49b66] text-[#060c15] shadow-md shadow-[#c49b66]/20"
                    : "bg-[#060c15] text-slate-400 hover:text-white border border-[#16273a]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-slate-500">
            Showing {filteredAssets.length} artifacts
          </span>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredAssets.map((item) => {
          const isImage = item.type === "image";
          const isVideo = item.type === "video";
          const isAudio = item.type === "audio";
          const isCode = item.type === "code";

          return (
            <div
              key={item.id}
              className="bg-[#0b1622]/90 border border-[#16273a] rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#c49b66]/50 transition-all shadow-xl"
            >
              {/* Media Thumbnail / Preview */}
              <div 
                onClick={() => setPreviewAsset(item)}
                className="h-44 w-full bg-[#060c15] relative overflow-hidden cursor-pointer flex items-center justify-center border-b border-[#16273a]"
              >
                {isImage && (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                )}
                {isVideo && (
                  <div className="relative w-full h-full">
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover blur-[0.5px]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Film size={28} className="text-[#c49b66] animate-pulse" />
                    </div>
                  </div>
                )}
                {isAudio && (
                  <div className="p-4 flex flex-col items-center justify-center space-y-2 text-center w-full">
                    <Volume2 size={32} className="text-[#7ae7c7] animate-pulse" />
                    <audio controls src={item.url} className="w-full h-7 text-[8px]" />
                  </div>
                )}
                {isCode && (
                  <div className="p-4 flex flex-col items-center justify-center space-y-2 text-center">
                    <Code2 size={32} className="text-blue-400" />
                    <span className="text-[10px] font-mono text-slate-300 font-bold">Interactive HTML/JS</span>
                  </div>
                )}

                {/* Badge overlay */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[#060c15]/80 backdrop-blur-md border border-[#16273a] text-[8px] font-mono font-bold text-[#c49b66] uppercase">
                  {item.type}
                </div>
              </div>

              {/* Asset Meta */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white truncate font-display">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 italic">"{item.prompt}"</p>
                </div>

                <div className="pt-2 border-t border-[#16273a]/60 flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <span>{item.modelUsed}</span>
                  <span>{item.size || "1.2 MB"}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="px-4 py-2.5 bg-[#060c15]/60 border-t border-[#16273a] flex items-center justify-between">
                <button
                  onClick={() => handleCopyUrl(item)}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors text-[9px] flex items-center space-x-1 cursor-pointer"
                >
                  {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedId === item.id ? "Copied" : "Copy URL"}</span>
                </button>

                <div className="flex items-center space-x-1">
                  {onSendToVideoStudio && (
                    <button
                      onClick={() => onSendToVideoStudio(item)}
                      title="Send to AI Video Studio"
                      className="text-[#c49b66] hover:text-white p-1 rounded transition-colors cursor-pointer"
                    >
                      <Film size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Remove from Staging"
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-[#060c15]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a1420] border border-[#16273a] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            <div className="p-4 border-b border-[#16273a] flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">{previewAsset.title}</span>
              <button 
                onClick={() => setPreviewAsset(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-[#060c15]">
              {previewAsset.type === "image" && (
                <img 
                  src={previewAsset.url} 
                  alt={previewAsset.title} 
                  className="max-h-[60vh] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              )}
              {previewAsset.type === "video" && (
                <div className="relative">
                  <img 
                    src={previewAsset.url} 
                    alt={previewAsset.title} 
                    className="max-h-[60vh] object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Film size={40} className="text-[#c49b66]" />
                  </div>
                </div>
              )}
              {previewAsset.type === "audio" && (
                <div className="p-8 text-center space-y-4 w-full">
                  <Volume2 size={48} className="text-[#7ae7c7] mx-auto animate-pulse" />
                  <audio controls src={previewAsset.url} className="w-full" />
                </div>
              )}
            </div>

            <div className="p-4 bg-[#0b1622] space-y-2 text-xs">
              <p className="text-slate-300 italic">"{previewAsset.prompt}"</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Model: {previewAsset.modelUsed}</span>
                <span>Created: {previewAsset.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
