/**
 * AkashicPaletteResolver.ts
 * poqpoq World — Akashic VFX System
 *
 * The soul translation layer. Takes raw AkashicData and produces
 * a VFXPalette that every archetype and primitive consumes.
 *
 * Pure functions only — no BABYLON, no side effects, fully testable.
 */

import {
  AkashicData,
  AkashicAttributes,
  AttributeAxis,
  AttributeName,
  AXIS_ATTRIBUTES,
  DeityVFXOverlay,
  DerivedStrength,
  ParticleStyle,
  RGB,
  StrengthVFXSignature,
  VFXPalette,
} from './AkashicVFXTypes';

// ─────────────────────────────────────────────
// Axis Soul Colors
// Driven by which of the 4 attribute axes is dominant
// ─────────────────────────────────────────────

const AXIS_SOUL_COLORS: Record<AttributeAxis, RGB> = {
  physical: [1.0, 0.35, 0.08],   // ember orange-red: power, heat, motion
  mental:   [0.45, 0.18, 0.95],  // deep violet: precision, mystery, depth
  social:   [1.0,  0.85, 0.15],  // bright gold: warmth, radiance, presence
  creative: [0.08, 0.88, 0.65],  // teal-green: growth, invention, organic life
};

// Accent colors for secondary axis (used as trailing/highlight tones)
const AXIS_ACCENT_COLORS: Record<AttributeAxis, RGB> = {
  physical: [0.95, 0.6,  0.1 ],
  mental:   [0.7,  0.4,  1.0 ],
  social:   [1.0,  0.95, 0.55],
  creative: [0.3,  1.0,  0.75],
};

// ─────────────────────────────────────────────
// Particle Style Selection
// Top derived strength drives the visual texture
// ─────────────────────────────────────────────

const STRENGTH_TO_PARTICLE_STYLE: Record<string, ParticleStyle> = {
  // Physical within-axis
  'Prowess':          'ember',
  'Fortitude':        'ember',
  'Resilience':       'organic',

  // Mental within-axis
  'Insight':          'geometric',
  'Deception':        'crystalline',
  'Perception':       'crystalline',

  // Social within-axis
  'Devotion':         'feathered',
  'Authority':        'geometric',
  'Diplomacy':        'feathered',

  // Creative within-axis
  'Craftsmanship':    'organic',
  'Invention':        'geometric',
  'Vision':           'organic',

  // Cross-axis highlights
  "Battlemage":       'ember',        // STR+MAG — flame+lightning
  "Assassin's Edge":  'void',         // AGI+CUN — shadow
  'Battle Sense':     'crystalline',  // END+WIS — cold alertness
  'Prophecy':         'geometric',    // MAG+FTH — divine geometry
  'Arcane Design':    'crystalline',  // MAG+ART — elegant precision
  'Runecraft':        'geometric',    // WIS+ART — etched knowledge
  'Devotecraft':      'feathered',    // FTH+CRE — sacred warmth
  'Eureka':           'geometric',    // CUN+INN — sudden clarity
  'Enchantment':      'feathered',    // WIS+CHA — persuasive softness
  'Inspiration':      'organic',      // FTH+INN — living belief
};

// ─────────────────────────────────────────────
// Strength VFX Signature Templates
// Persistent ambient effects driven by top 3 derived strengths
// ─────────────────────────────────────────────

const STRENGTH_VFX_TEMPLATES: Record<string, Omit<StrengthVFXSignature, 'intensity'>> = {
  'Battlemage':         { strengthName: 'Battlemage',        primitiveId: 'electric_arc',  color: [1.0, 0.5, 0.1],  attachPoint: 'hands',   rate: 0.8  },
  "Assassin's Edge":    { strengthName: "Assassin's Edge",   primitiveId: 'smoke_wisp',    color: [0.2, 0.0, 0.3],  attachPoint: 'feet',    rate: 1.2  },
  'Prophecy':           { strengthName: 'Prophecy',          primitiveId: 'hex_rune',      color: [0.7, 0.8, 1.0],  attachPoint: 'head',    rate: 0.3  },
  'Arcane Design':      { strengthName: 'Arcane Design',     primitiveId: 'hex_rune',      color: [0.5, 0.2, 1.0],  attachPoint: 'ambient', rate: 0.5  },
  'Runecraft':          { strengthName: 'Runecraft',         primitiveId: 'hex_rune',      color: [0.9, 0.85, 0.4], attachPoint: 'hands',   rate: 0.4  },
  'Devotecraft':        { strengthName: 'Devotecraft',       primitiveId: 'healing_motes', color: [1.0, 0.95, 0.6], attachPoint: 'ambient', rate: 0.6  },
  'Eureka':             { strengthName: 'Eureka',            primitiveId: 'impact_flash',  color: [1.0, 1.0, 1.0],  attachPoint: 'head',    rate: 0.15 },
  'Enchantment':        { strengthName: 'Enchantment',       primitiveId: 'healing_motes', color: [1.0, 0.7, 0.85], attachPoint: 'ambient', rate: 0.4  },
  'Warlord':            { strengthName: 'Warlord',           primitiveId: 'particle_burst',color: [0.8, 0.1, 0.0],  attachPoint: 'feet',    rate: 1.0  },
  'Inspiration':        { strengthName: 'Inspiration',       primitiveId: 'healing_motes', color: [0.9, 0.95, 1.0], attachPoint: 'ambient', rate: 0.7  },
  'Battle Sense':       { strengthName: 'Battle Sense',      primitiveId: 'aura_shell',    color: [0.5, 0.7, 1.0],  attachPoint: 'torso',   rate: 0.2  },
  'Craftsmanship':      { strengthName: 'Craftsmanship',     primitiveId: 'particle_burst',color: [1.0, 0.85, 0.2], attachPoint: 'hands',   rate: 0.3  },
  // Default fallback for any strength not explicitly mapped
  '__default__':        { strengthName: 'Soul',              primitiveId: 'healing_motes', color: [0.8, 0.8, 0.8],  attachPoint: 'ambient', rate: 0.2  },
};

// ─────────────────────────────────────────────
// Deity Visual Overlays
// ─────────────────────────────────────────────

export const DEITY_VFX_OVERLAYS: Record<string, DeityVFXOverlay> = {
  artemis:   { deityName: 'artemis',   color: [0.70, 0.85, 1.00], primitiveId: 'ribbon_trail',  description: 'Crescent ribbon trails',           triggerOn: 'movement',   intensity: 0.6 },
  athena:    { deityName: 'athena',    color: [0.80, 0.75, 0.20], primitiveId: 'hex_rune',      description: 'Owl-eye hex runes on cast',         triggerOn: 'spellcast',  intensity: 0.7 },
  apollo:    { deityName: 'apollo',    color: [1.00, 0.95, 0.40], primitiveId: 'healing_motes', description: 'Sun motes drift upward always',     triggerOn: 'always',     intensity: 0.5 },
  demeter:   { deityName: 'demeter',   color: [0.20, 0.80, 0.30], primitiveId: 'smoke_wisp',    description: 'Green growth wisps at feet',        triggerOn: 'always',     intensity: 0.4 },
  mars:      { deityName: 'mars',      color: [0.90, 0.10, 0.10], primitiveId: 'particle_burst',description: 'Red ember sparks on impact',        triggerOn: 'impact',     intensity: 0.8 },
  hermes:    { deityName: 'hermes',    color: [0.85, 0.90, 1.00], primitiveId: 'ribbon_trail',  description: 'Wing-feather trails on movement',   triggerOn: 'movement',   intensity: 0.7 },
  freya:     { deityName: 'freya',     color: [1.00, 0.60, 0.70], primitiveId: 'aura_shell',    description: 'Runic shimmer on aura',             triggerOn: 'always',     intensity: 0.5 },
  brigid:    { deityName: 'brigid',    color: [1.00, 0.75, 0.30], primitiveId: 'healing_motes', description: 'Warm forge sparks ambient',         triggerOn: 'always',     intensity: 0.5 },
  echo:      { deityName: 'echo',      color: [0.60, 0.90, 0.95], primitiveId: 'ribbon_trail',  description: 'Sound-ripple trails',               triggerOn: 'movement',   intensity: 0.4 },
  odin:      { deityName: 'odin',      color: [0.10, 0.20, 0.90], primitiveId: 'hex_rune',      description: 'Single eye rune on cast',           triggerOn: 'spellcast',  intensity: 0.9 },
  morrigan:  { deityName: 'morrigan',  color: [0.30, 0.00, 0.40], primitiveId: 'smoke_wisp',    description: 'Crow feather smoke on movement',    triggerOn: 'movement',   intensity: 0.7 },
  tyr:       { deityName: 'tyr',       color: [0.80, 0.80, 0.90], primitiveId: 'aura_shell',    description: 'Shield-law aura on damage taken',   triggerOn: 'impact',     intensity: 0.8 },
  loki:      { deityName: 'loki',      color: [0.50, 0.50, 0.50], primitiveId: 'particle_burst',description: 'Hue-shifting chaotic sparks',       triggerOn: 'spellcast',  intensity: 0.6 },
  zeus:      { deityName: 'zeus',      color: [0.80, 0.90, 1.00], primitiveId: 'electric_arc',  description: 'Lightning arcs on impact',          triggerOn: 'impact',     intensity: 1.0 },
  hades:     { deityName: 'hades',     color: [0.15, 0.00, 0.30], primitiveId: 'smoke_wisp',    description: 'Shadow tendrils on movement',       triggerOn: 'movement',   intensity: 0.8 },
  bob:       { deityName: 'bob',       color: [0.80, 0.80, 0.80], primitiveId: 'healing_motes', description: 'Subtle all-color shimmer, always',  triggerOn: 'always',     intensity: 0.25},
  thoth:     { deityName: 'thoth',     color: [0.40, 0.75, 0.90], primitiveId: 'hex_rune',      description: 'Hieroglyph runes on knowledge use', triggerOn: 'spellcast',  intensity: 0.8 },
};

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function blendRGB(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function hslHueToRGB(hue: number, saturation = 0.7, lightness = 0.6): RGB {
  // Standard HSL→RGB conversion, s and l in 0–1
  const h = hue / 360;
  const s = saturation;
  const l = lightness;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [hue2rgb(h + 1/3), hue2rgb(h), hue2rgb(h - 1/3)];
}

// ─────────────────────────────────────────────
// Axis Analysis
// ─────────────────────────────────────────────

function getAxisScore(attributes: AkashicAttributes, axis: AttributeAxis): number {
  const stats = AXIS_ATTRIBUTES[axis];
  return stats.reduce((sum, stat) => sum + attributes[stat], 0) / stats.length;
}

function getDominantAxes(attributes: AkashicAttributes): {
  dominant: AttributeAxis;
  secondary: AttributeAxis | null;
  scores: Record<AttributeAxis, number>;
} {
  const axes: AttributeAxis[] = ['physical', 'mental', 'social', 'creative'];
  const scores = Object.fromEntries(
    axes.map(ax => [ax, getAxisScore(attributes, ax)])
  ) as Record<AttributeAxis, number>;

  const sorted = axes.sort((a, b) => scores[b] - scores[a]);
  const dominant = sorted[0];
  const secondary = Math.abs(scores[sorted[0]] - scores[sorted[1]]) < 5
    ? sorted[1]   // close race — include secondary
    : null;

  return { dominant, secondary, scores };
}

// ─────────────────────────────────────────────
// Particle Style Derivation
// ─────────────────────────────────────────────

function deriveParticleStyle(
  top3Strengths: DerivedStrength[],
  attributes: AkashicAttributes,
  dominantAxis: AttributeAxis
): ParticleStyle {
  // Check top strength first
  for (const s of top3Strengths) {
    const style = STRENGTH_TO_PARTICLE_STYLE[s.name];
    if (style) return style;
  }

  // Fall back to axis-based default
  const axisDefaults: Record<AttributeAxis, ParticleStyle> = {
    physical: 'ember',
    mental:   'crystalline',
    social:   'feathered',
    creative: 'organic',
  };

  // Special case: if very low total stats (fresh character), subdued void feel
  const totalStats = Object.values(attributes).reduce((a, b) => a + b, 0);
  if (totalStats < 140) return 'void'; // all stats at or near default 10 = 120

  return axisDefaults[dominantAxis];
}

// ─────────────────────────────────────────────
// Strength Signature Resolution
// ─────────────────────────────────────────────

function resolveStrengthSignatures(
  top3Strengths: DerivedStrength[]
): StrengthVFXSignature[] {
  return top3Strengths.map(strength => {
    const template = STRENGTH_VFX_TEMPLATES[strength.name] ?? STRENGTH_VFX_TEMPLATES['__default__'];
    return {
      ...template,
      strengthName: strength.name,
      intensity: mapRange(strength.value, 10, 100, 0.15, 1.0),
    };
  });
}

// ─────────────────────────────────────────────
// Main Resolver — the public API
// ─────────────────────────────────────────────

export function resolveAkashicPalette(akashic: AkashicData): VFXPalette {
  const { attributes, rank, rankTier, activeDeity, top3Strengths, resourceType, inCombat, userId } = akashic;

  // ── Dominant / secondary axis ──
  const { dominant, secondary, scores } = getDominantAxes(attributes);

  // ── Soul color (dominant axis, optionally blended with secondary) ──
  let soulColor = AXIS_SOUL_COLORS[dominant];
  if (secondary) {
    const secondaryScore = scores[secondary];
    const dominantScore  = scores[dominant];
    const blendFactor    = 0.3 * (secondaryScore / dominantScore); // max 30% blend
    soulColor = blendRGB(AXIS_SOUL_COLORS[dominant], AXIS_SOUL_COLORS[secondary], blendFactor);
  }

  // ── Rank hue → accent color ──
  // Re-uses the existing badge formula: hue = (145 + (tier/99) × 263) % 360
  const rankHue    = (145 + (Math.min(rankTier, 99) / 99) * 263) % 360;
  const accentColor = hslHueToRGB(rankHue, 0.6, 0.55);

  // ── Emissive boost: Faith drives luminosity ──
  // Low faith = understated; high faith = blazing
  const emissiveBoost = mapRange(attributes.faith, 0, 100, 0.6, 2.4);

  // ── Particle style: top strength identity ──
  const particleStyle = deriveParticleStyle(top3Strengths, attributes, dominant);

  // ── Noise scale: Cunning vs Magic balance ──
  // High CUN → tight, precise noise (crystalline spellwork)
  // High MAG → expansive, flowing (power over control)
  const cunMinusMag = attributes.cunning - attributes.magic;
  const noiseScale  = mapRange(cunMinusMag, -80, 80, 1.8, 0.2);

  // ── Particle density: Magic level drives complexity ──
  const particleDensity = mapRange(attributes.magic, 0, 100, 0.3, 3.0);

  // ── Deity overlay ──
  const deityOverlay = activeDeity
    ? (DEITY_VFX_OVERLAYS[activeDeity.deityName.toLowerCase()] ?? null)
    : null;

  // ── Strength signatures (top 3) ──
  const strengthSignatures = resolveStrengthSignatures(top3Strengths);

  return {
    userId,
    soulColor,
    accentColor,
    rankHue,
    emissiveBoost,
    particleStyle,
    noiseScale,
    particleDensity,
    strengthSignatures,
    deityOverlay,
    resourceType,
    inCombat,
    dominantAxis: dominant,
    secondaryAxis: secondary,
  };
}

// ─────────────────────────────────────────────
// Convenience: diff two palettes for selective updates
// When attributes change, only update what actually changed
// ─────────────────────────────────────────────

export type PaletteDiff = {
  colorChanged: boolean;
  densityChanged: boolean;
  styleChanged: boolean;
  deityChanged: boolean;
  signaturesChanged: boolean;
};

export function diffPalettes(prev: VFXPalette, next: VFXPalette): PaletteDiff {
  const rgbEq = (a: RGB, b: RGB) =>
    Math.abs(a[0]-b[0]) < 0.01 && Math.abs(a[1]-b[1]) < 0.01 && Math.abs(a[2]-b[2]) < 0.01;

  return {
    colorChanged:      !rgbEq(prev.soulColor, next.soulColor) || prev.emissiveBoost !== next.emissiveBoost,
    densityChanged:    prev.particleDensity !== next.particleDensity || prev.noiseScale !== next.noiseScale,
    styleChanged:      prev.particleStyle !== next.particleStyle,
    deityChanged:      prev.deityOverlay?.deityName !== next.deityOverlay?.deityName,
    signaturesChanged: prev.strengthSignatures.map(s => s.strengthName).join() !==
                       next.strengthSignatures.map(s => s.strengthName).join(),
  };
}
