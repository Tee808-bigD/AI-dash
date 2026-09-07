import { CameraMotionType, AtmosphericVfxType, ColorLutType, TransitionEffectType, DynamicMotionConfig } from "./types";

export interface CameraTransform {
  scale: number;
  dx: number;
  dy: number;
  rotation: number; // in radians
}

export const DEFAULT_DYNAMIC_MOTION_CONFIG: DynamicMotionConfig = {
  cameraMotion: "ken_burns_zoom",
  motionIntensity: 1.0,
  atmosphericVfx: "ambient_bokeh",
  vfxIntensity: 0.7,
  colorLut: "teal_orange",
  transitionEffect: "film_burn",
  transitionDurationMs: 600,
  letterboxCinemascope: false,
  kineticCaptionStyle: "karaoke"
};

/**
 * Calculates camera translation, zoom, and rotation based on motion choreography
 */
export function calculateCameraTransform(
  motionType: CameraMotionType,
  progress: number, // 0 to 1 within current scene
  timeMs: number,
  width: number,
  height: number,
  intensity: number = 1.0
): CameraTransform {
  const p = Math.max(0, Math.min(1, progress));
  const easedP = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // Ease-in-out

  switch (motionType) {
    case "pan_and_scan": {
      const scale = 1.15 + (0.05 * intensity);
      // Smooth diagonal sweep from upper-left to bottom-right
      const dx = (width * 0.05 * (easedP * 2 - 1)) * intensity;
      const dy = (height * 0.03 * (Math.sin(p * Math.PI) - 0.5)) * intensity;
      return { scale, dx, dy, rotation: 0 };
    }

    case "orbital_drift": {
      const scale = 1.12 + (0.04 * Math.sin(p * Math.PI) * intensity);
      const angle = p * Math.PI * 0.8;
      const dx = Math.sin(angle) * (width * 0.04) * intensity;
      const dy = Math.cos(angle * 0.7) * (height * 0.03) * intensity;
      const rotation = (Math.sin(p * Math.PI * 2) * 0.015) * intensity;
      return { scale, dx, dy, rotation };
    }

    case "handheld_shake": {
      const scale = 1.1;
      const t = timeMs * 0.002;
      // Multi-octave natural jitter
      const jitterX = (Math.sin(t * 1.7) * 4 + Math.cos(t * 3.1) * 2.5 + Math.sin(t * 5.3) * 1.2) * intensity;
      const jitterY = (Math.cos(t * 1.3) * 3 + Math.sin(t * 2.7) * 2.0 + Math.cos(t * 4.9) * 1.0) * intensity;
      const rotation = (Math.sin(t * 1.1) * 0.006) * intensity;
      const slowDriftY = (p * height * 0.02) * intensity;
      return { scale, dx: jitterX, dy: jitterY + slowDriftY, rotation };
    }

    case "dolly_zoom": {
      // Rapid push-in with wide background expansion simulation
      const scale = 1.0 + (Math.pow(p, 1.5) * 0.28 * intensity);
      const dy = -(p * height * 0.03 * intensity);
      return { scale, dx: 0, dy, rotation: 0 };
    }

    case "whip_zoom": {
      // Fast explosive push-in during first 20%, then settles to cinematic drift
      let scale = 1.0;
      if (p < 0.25) {
        const snap = p / 0.25;
        scale = 1.0 + (Math.sin(snap * Math.PI * 0.5) * 0.16 * intensity);
      } else {
        const rest = (p - 0.25) / 0.75;
        scale = 1.16 + (rest * 0.05 * intensity);
      }
      return { scale, dx: 0, dy: 0, rotation: 0 };
    }

    case "ken_burns_zoom":
    default: {
      // Classic Hollywood Ken Burns with smooth cubic ease
      const scale = 1.02 + (easedP * 0.12 * intensity);
      const dx = (width * 0.015 * Math.sin(p * Math.PI)) * intensity;
      const dy = -(height * 0.02 * easedP) * intensity;
      return { scale, dx, dy, rotation: 0 };
    }
  }
}

/**
 * Procedural particle seeds initialized once for deterministic smooth rendering
 */
const SEEDED_PARTICLES = Array.from({ length: 45 }).map((_, i) => ({
  x: (Math.sin(i * 997.3) * 0.5 + 0.5),
  y: (Math.cos(i * 613.7) * 0.5 + 0.5),
  radius: 2 + (i % 6) * 3,
  speed: 0.04 + (i % 5) * 0.03,
  drift: (i % 2 === 0 ? 1 : -1) * (0.01 + (i % 4) * 0.005),
  alpha: 0.2 + (i % 7) * 0.1
}));

/**
 * Renders dynamic atmospheric VFX layers (Bokeh, Golden Dust, Anamorphic Flare, Cyber HUD)
 */
export function renderAtmosphericVfx(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeMs: number,
  vfxType: AtmosphericVfxType,
  intensity: number = 0.7
) {
  if (vfxType === "none" || intensity <= 0) return;

  ctx.save();

  if (vfxType === "ambient_bokeh") {
    ctx.globalCompositeOperation = "screen";
    const t = timeMs * 0.0003;

    SEEDED_PARTICLES.forEach((p, idx) => {
      const currentY = ((p.y - (t * p.speed)) % 1.0 + 1.0) % 1.0 * height;
      const currentX = ((p.x + Math.sin(t * 2 + idx) * p.drift) % 1.0 + 1.0) % 1.0 * width;
      const currentR = p.radius * (1 + 0.3 * Math.sin(t * 3 + idx)) * (width / 720);

      const grad = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, currentR);
      const alpha = p.alpha * intensity;
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
      grad.addColorStop(0.4, `rgba(165, 180, 252, ${alpha * 0.5})`);
      grad.addColorStop(1, "rgba(99, 102, 241, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(currentX, currentY, currentR, 0, Math.PI * 2);
      ctx.fill();
    });
  } 
  else if (vfxType === "golden_dust") {
    ctx.globalCompositeOperation = "lighter";
    const t = timeMs * 0.0005;

    SEEDED_PARTICLES.forEach((p, idx) => {
      const currentY = ((p.y - (t * p.speed * 1.5)) % 1.0 + 1.0) % 1.0 * height;
      const currentX = ((p.x + Math.sin(t * 1.5 + idx) * p.drift * 2) % 1.0 + 1.0) % 1.0 * width;
      const shimmer = Math.abs(Math.sin(t * 6 + idx));
      const currentR = (1.5 + (idx % 3)) * (width / 720);
      const alpha = (p.alpha * 0.8 + shimmer * 0.4) * intensity;

      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 8 * intensity;
      ctx.beginPath();
      ctx.arc(currentX, currentY, currentR, 0, Math.PI * 2);
      ctx.fill();
    });
  } 
  else if (vfxType === "anamorphic_flare") {
    ctx.globalCompositeOperation = "screen";
    const t = timeMs * 0.0004;
    const flareY = height * (0.35 + 0.15 * Math.sin(t));
    const flareX = width * (0.5 + 0.3 * Math.cos(t * 0.7));

    // Horizontal streak line
    const streakGrad = ctx.createLinearGradient(0, flareY, width, flareY);
    const flareAlpha = (0.35 + 0.2 * Math.sin(t * 2)) * intensity;
    streakGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    streakGrad.addColorStop(0.3, `rgba(56, 189, 248, ${flareAlpha * 0.3})`);
    streakGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flareAlpha})`);
    streakGrad.addColorStop(0.7, `rgba(168, 85, 247, ${flareAlpha * 0.3})`);
    streakGrad.addColorStop(1, "rgba(168, 85, 247, 0)");

    ctx.fillStyle = streakGrad;
    ctx.fillRect(0, flareY - (2 * (width / 720)), width, 4 * (width / 720));

    // Central glow orb
    const centerGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 60 * (width / 720));
    centerGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha * 0.8})`);
    centerGrad.addColorStop(0.3, `rgba(56, 189, 248, ${flareAlpha * 0.4})`);
    centerGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(flareX, flareY, 60 * (width / 720), 0, Math.PI * 2);
    ctx.fill();
  } 
  else if (vfxType === "cyber_hud") {
    ctx.globalCompositeOperation = "screen";
    const t = timeMs * 0.001;
    const pad = 24 * (width / 720);

    // Subtle horizontal scan lines
    ctx.fillStyle = `rgba(34, 211, 238, ${0.04 * intensity})`;
    const scanStep = 4 * (height / 720);
    for (let y = 0; y < height; y += scanStep) {
      ctx.fillRect(0, y, width, 1);
    }

    // Corner crosshairs
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.45 * intensity})`;
    ctx.lineWidth = 1.5 * (width / 720);
    const cornerSize = 16 * (width / 720);

    // Top-left
    ctx.beginPath();
    ctx.moveTo(pad, pad + cornerSize);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + cornerSize, pad);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - pad - cornerSize, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(pad, height - pad - cornerSize);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + cornerSize, height - pad);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - pad - cornerSize, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - cornerSize);
    ctx.stroke();

    // Small glowing cyber coordinate indicator
    ctx.fillStyle = `rgba(34, 211, 238, ${0.7 * intensity})`;
    ctx.font = `${Math.round(8 * (width / 720))}px monospace`;
    ctx.textAlign = "right";
    const coordinate = `REC [${(t % 60).toFixed(2)}s] 60FPS // NEURAL_VFX`;
    ctx.fillText(coordinate, width - pad - 6, pad + 14 * (width / 720));
  } 
  else if (vfxType === "film_grain") {
    // Subtle cinematic vignette
    const vigGrad = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.35,
      width / 2, height / 2, width * 0.75
    );
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    vigGrad.addColorStop(1, `rgba(0, 0, 0, ${0.55 * intensity})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

/**
 * Applies professional cinema color grading LUT filter over the scene
 */
export function applyColorGradeLut(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lutType: ColorLutType
) {
  if (lutType === "standard") return;

  ctx.save();

  switch (lutType) {
    case "teal_orange": {
      // Hollywood Blockbuster: cool shadows, warm bronze highlights
      ctx.globalCompositeOperation = "color";
      const grad = ctx.createLinearGradient(0, height, width, 0);
      grad.addColorStop(0, "rgba(13, 50, 77, 0.45)"); // Deep teal
      grad.addColorStop(1, "rgba(255, 154, 60, 0.35)"); // Warm amber
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Contrast boost
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case "cyber_neon": {
      ctx.globalCompositeOperation = "screen";
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "rgba(0, 240, 255, 0.22)"); // Electric cyan
      grad.addColorStop(1, "rgba(255, 0, 127, 0.22)"); // Neon magenta
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case "kodak_portra": {
      // Creamy highlights, organic warm skin tones
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = "rgba(253, 246, 226, 0.2)";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = "rgba(220, 140, 80, 0.18)";
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case "moody_noir": {
      // High contrast film noir with subtle cool tint
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "rgba(180, 190, 210, 0.85)";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "hard-light";
      ctx.fillStyle = "rgba(20, 20, 25, 0.3)";
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case "golden_hour": {
      ctx.globalCompositeOperation = "soft-light";
      const radGrad = ctx.createRadialGradient(
        width * 0.8, height * 0.2, 50,
        width * 0.5, height * 0.5, width * 0.8
      );
      radGrad.addColorStop(0, "rgba(251, 191, 36, 0.65)");
      radGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.35)");
      radGrad.addColorStop(1, "rgba(180, 83, 9, 0.15)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws dynamic scene transition blend when near scene boundaries
 */
export function renderSceneTransition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  effect: TransitionEffectType,
  progress: number // 0 (start of transition) to 1 (transition peak/settle)
) {
  if (progress <= 0 || progress >= 1) return;

  ctx.save();

  switch (effect) {
    case "film_burn": {
      // Organic warm light leak flash
      const peak = Math.sin(progress * Math.PI);
      ctx.globalCompositeOperation = "screen";
      const burnGrad = ctx.createLinearGradient(0, 0, width, height);
      burnGrad.addColorStop(0, `rgba(255, 240, 200, ${peak * 0.9})`);
      burnGrad.addColorStop(0.4, `rgba(255, 120, 40, ${peak * 0.85})`);
      burnGrad.addColorStop(1, `rgba(255, 40, 10, ${peak * 0.6})`);
      ctx.fillStyle = burnGrad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case "glitch_splice": {
      const peak = Math.sin(progress * Math.PI);
      if (peak > 0.1) {
        ctx.globalCompositeOperation = "difference";
        const sliceCount = 8;
        const sliceH = height / sliceCount;
        for (let i = 0; i < sliceCount; i++) {
          if (i % 2 === 0) {
            const shift = (Math.sin(progress * 20 + i) * 25 * peak);
            ctx.fillStyle = `rgba(0, 255, 255, ${0.4 * peak})`;
            ctx.fillRect(shift, i * sliceH, width, sliceH);
          }
        }
      }
      break;
    }

    case "whip_pan": {
      // Horizontal motion streak blur
      const peak = Math.sin(progress * Math.PI);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255, 255, 255, ${peak * 0.35})`;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case "dip_black": {
      const peak = Math.sin(progress * Math.PI);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0, 0, 0, ${peak * 0.95})`;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case "cross_fade":
    default: {
      // Standard smooth exposure dip
      const peak = Math.sin(progress * Math.PI);
      ctx.fillStyle = `rgba(0, 0, 0, ${peak * 0.3})`;
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws 2.39:1 Cinemascope anamorphic letterbox bars
 */
export function renderLetterboxCinemascope(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Height for 2.39:1 ratio
  const targetScopeHeight = width / 2.39;
  if (targetScopeHeight < height) {
    const barHeight = (height - targetScopeHeight) / 2;
    ctx.save();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, barHeight);
    ctx.fillRect(0, height - barHeight, width, barHeight);
    ctx.restore();
  }
}
