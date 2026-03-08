/**
 * AkashicVFXTypes.ts
 * poqpoq World — Akashic VFX System
 *
 * All shared types for the VFX system. No BABYLON imports here — this file
 * is safe to import from server-side code, tests, or UI without pulling
 * in the rendering engine.
 */

// ─────────────────────────────────────────────
// Akashic Data (mirrors AkashicDataService shape)
// ─────────────────────────────────────────────

export interface AkashicAttributes {
  strength:    number;   // STR 0–100
  agility:     number;   // AGI 0–100
  endurance:   number;   // END 0–100
  magic:       number;   // MAG 0–100
  wisdom:      number;   // WIS 0–100
  cunning:     number;   // CUN 0–100
  leadership:  number;   // LDR 0–100
  faith:       number;   // FTH 0–100
  charisma:    number;   // CHA 0–100
  creativity:  number;   // CRE 0–100
  artistry:    number;   // ART 0–100
  innovation:  number;   // INN 0–100
}

export type AttributeName = keyof AkashicAttributes;

export interface DerivedStrength {
  name: string;          // e.g. "Battlemage"
  word: string;          // e.g. "Powerful"
  value: number;         // floor((statA + statB) / 2)
  statA: AttributeName;
  statB: AttributeName;
}

export interface ActiveDeityBond {
  deityName: string;
  blessingChoice: string;
  faithAtBonding: number;
  currentAmplification: number;
}

export interface AkashicData {
  userId: string;
  attributes: AkashicAttributes;
  rank: number;
  rankTier: number;           // floor(rank / 100) — drives badge hue
  resonance: number;
  wisdom: number;             // essence
  creativity: number;         // essence
  connection: number;         // essence
  top3Strengths: DerivedStrength[];
  activeDeity: ActiveDeityBond | null;
  resourceType: 'mana' | 'stamina';
  inCombat: boolean;
}

// ─────────────────────────────────────────────
// Attribute Axes
// ─────────────────────────────────────────────

export type AttributeAxis = 'physical' | 'mental' | 'social' | 'creative';

export const AXIS_ATTRIBUTES: Record<AttributeAxis, AttributeName[]> = {
  physical: ['strength', 'agility', 'endurance'],
  mental:   ['magic', 'wisdom', 'cunning'],
  social:   ['leadership', 'faith', 'charisma'],
  creative: ['creativity', 'artistry', 'innovation'],
};

// ─────────────────────────────────────────────
// VFX Palette — the resolved visual signature
// ─────────────────────────────────────────────

export type RGB = [number, number, number];

export type ParticleStyle =
  | 'crystalline'   // hard edges, geometric — high CUN
  | 'feathered'     // soft, billowing — high FTH
  | 'tendril'       // organic, reaching — dark/chaotic
  | 'geometric'     // structured patterns — high MAG
  | 'organic'       // natural flow — creative axis
  | 'ember'         // hot sparks — physical axis
  | 'void'          // anti-particles, dark — low total stats or Hades bond

export interface StrengthVFXSignature {
  strengthName: string;
  primitiveId: string;        // which primitive to spawn
  color: RGB;
  intensity: number;          // 0–1 scales with strength value
  attachPoint: 'hands' | 'feet' | 'head' | 'torso' | 'ambient';
  rate: number;               // particles/second or pulse interval
}

export interface DeityVFXOverlay {
  deityName: string;
  color: RGB;
  primitiveId: string;
  description: string;        // for devs
  triggerOn: 'always' | 'movement' | 'spellcast' | 'impact';
  intensity: number;
}

export interface VFXPalette {
  userId: string;

  // Core identity colors
  soulColor: RGB;             // dominant axis color
  accentColor: RGB;           // secondary axis or rank hue tint
  rankHue: number;            // HSL hue from tier: (145 + (tier/99)*263) % 360

  // Visual character
  emissiveBoost: number;      // 0.6 (low faith) → 2.4 (faith 100)
  particleStyle: ParticleStyle;
  noiseScale: number;         // 0.2 (precise) → 1.8 (chaotic)
  particleDensity: number;    // 0.3 (low MAG) → 3.0 (MAG 100)

  // Strength & deity layers
  strengthSignatures: StrengthVFXSignature[];  // top 3
  deityOverlay: DeityVFXOverlay | null;

  // Combat state
  resourceType: 'mana' | 'stamina';
  inCombat: boolean;

  // Derived for convenience
  dominantAxis: AttributeAxis;
  secondaryAxis: AttributeAxis | null;
}

// ─────────────────────────────────────────────
// Archetypes
// ─────────────────────────────────────────────

export type SpellArchetypeId =
  | 'charge_spell'
  | 'instant_strike'
  | 'long_cast'
  | 'sustained_beam'
  | 'shield_bubble'
  | 'heal_pulse'
  | 'aoe_blast'
  | 'ground_slam'
  | 'summoning'
  | 'buff_apply'
  | 'debuff_apply'
  | 'counter_strike';

export type CombatEventType =
  | 'melee_hit'
  | 'spell_hit'
  | 'dodge'
  | 'block'
  | 'death'
  | 'respawn'
  | 'crit';

export type AkashicEventType =
  | 'rank_up'
  | 'tier_up'
  | 'deity_bond'
  | 'deity_unbond'
  | 'roll_ceremony'
  | 'resonance_gain_small'    // 5–50
  | 'resonance_gain_medium'   // 50–500
  | 'resonance_gain_large'    // 500+
  | 'attribute_increase'
  | 'strength_unlock';

export interface EffectPhaseEntry {
  primitive: string;
  scale?:    [number, number] | number;
  opacity?:  [number, number] | number;
  speed?:    number;
  intensity?: [number, number] | number;
  count?:    number;
  width?:    number;
  length?:   number;
  spread?:   number;
  size?:     number;
}

export interface EffectPhase {
  duration: number;           // seconds
  effects: EffectPhaseEntry[];
}

export interface SpellArchetype {
  id: SpellArchetypeId;
  phases: Record<string, EffectPhase>;
  loopPhase?: string;         // which phase loops (e.g. 'hold' for beam)
}

// ─────────────────────────────────────────────
// Active effect tracking
// ─────────────────────────────────────────────

export interface ActiveVFXEffect {
  id: string;
  userId: string;
  archetypeId: string;
  startTime: number;
  isLooping: boolean;
  dispose: () => void;
}
