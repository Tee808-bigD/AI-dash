export function getFallbackVideoFrame(prompt?: string, sceneNum?: number): string {
  const safeTitle = (prompt || "NVIDIA VideoGPT Motion Synthesis").replace(/[<>&'"]/g, "").substring(0, 40);
  const numStr = sceneNum ? `SCENE 0${sceneNum}` : "NVIDIA VIDEOGPT";

  const colors = [
    { bg1: "#0f172a", bg2: "#311042", accent1: "#a855f7", accent2: "#ec4899" },
    { bg1: "#030712", bg2: "#0f2e3d", accent1: "#06b6d4", accent2: "#3b82f6" },
    { bg1: "#111827", bg2: "#1f2937", accent1: "#10b981", accent2: "#06b6d4" },
    { bg1: "#18181b", bg2: "#3f3f46", accent1: "#f59e0b", accent2: "#ef4444" },
    { bg1: "#09090b", bg2: "#27272a", accent1: "#6366f1", accent2: "#a855f7" }
  ];
  const c = colors[(sceneNum || 1) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.bg1}"/>
        <stop offset="100%" stop-color="${c.bg2}"/>
      </linearGradient>
      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c.accent1}"/>
        <stop offset="100%" stop-color="${c.accent2}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bgGrad)"/>
    <circle cx="400" cy="200" r="220" fill="${c.accent1}" opacity="0.12" filter="blur(50px)"/>
    <path d="M-100,350 Q200,150 400,280 T900,100" stroke="url(#lineGrad)" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M-100,100 Q300,400 600,200 T1000,350" stroke="url(#lineGrad)" stroke-width="1.5" stroke-dasharray="8 6" fill="none" opacity="0.3"/>
    
    <!-- Viewfinder Grid -->
    <rect x="40" y="40" width="720" height="370" rx="12" fill="none" stroke="${c.accent1}" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
    <rect x="60" y="60" width="150" height="26" rx="6" fill="#000000" opacity="0.6"/>
    <text x="135" y="77" font-family="monospace" font-size="10" font-weight="bold" fill="${c.accent1}" text-anchor="middle">${numStr} • 60 FPS</text>
    
    <!-- Center Card -->
    <rect x="200" y="140" width="400" height="170" rx="16" fill="#090d16" stroke="url(#lineGrad)" stroke-width="1.5" opacity="0.95"/>
    <circle cx="400" cy="200" r="26" fill="${c.accent1}" opacity="0.9"/>
    <polygon points="393,189 415,200 393,211" fill="#ffffff"/>
    
    <text x="400" y="258" font-family="system-ui, sans-serif" font-size="15" font-weight="800" fill="#f8fafc" text-anchor="middle">${safeTitle}</text>
    <text x="400" y="280" font-family="system-ui, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" text-anchor="middle">NVIDIA NIM • Temporal Motion Engine</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
