# poqpoq — Akashic VFX System Strategy
**ADR-Pending | Author: Allen Partridge + Claude | Date: 2026-03-08**

---

## Executive Summary

The Akashic VFX System transforms poqpoq's existing progression data into a **living visual language**. Rather than treating each spell, combat action, or UI event as an isolated particle invocation, this system uses a **unified superlibrary** of composable visual primitives driven by each player's Akashic state. The result: no two players look alike, visual identity evolves with play, and every effect communicates *who that soul is*, not just what action was taken.

---

## Core Design Principle

> *The Akashic Record is not just data. It's a visual signature.*

Every attribute, essence, deity bond, rank tier, and derived strength produces parameters that feed a single unified rendering system. A fresh Emerald Noob and a Gold Transcendent cast the same spell — but the world *shows* the difference without a single UI element.

---

## Architecture Overview

The system has **four layers**, each building on the last:

```
Layer 4: EVENT SEQUENCES
  ┌─────────────────────────────────────────────────────┐
  │  rankUp(), deityBond(), rollCeremony(), resonanceGain() │
  └───────────────────────┬─────────────────────────────┘
                          ↓
Layer 3: SPELL / COMBAT ARCHETYPES
  ┌─────────────────────────────────────────────────────┐
  │  chargeSpell, instantStrike, shield, beam, healPulse │
  └───────────────────────┬─────────────────────────────┘
                          ↓
Layer 2: AKASHIC PALETTE RESOLVER
  ┌─────────────────────────────────────────────────────┐
  │  soulColor, particleStyle, emissiveBoost, noiseScale │
  │  (computed from attributes + deity + rank tier)      │
  └───────────────────────┬─────────────────────────────┘
                          ↓
Layer 1: VFX PRIMITIVE LIBRARY
  ┌─────────────────────────────────────────────────────┐
  │  energy_orb, ribbon_trail, impact_flash, hex_rune   │
  │  shockwave, ground_ring, smoke_wisp, electric_arc   │
  └─────────────────────────────────────────────────────┘
```

---

## Layer 1 — VFX Primitive Library

These are the **atomic building blocks**. Each is a NodeMaterial (Babylon.js) or ShaderMaterial that exposes a clean uniform API. They are never used directly by game logic — only by archetypes above them.

### Core Primitives

| Primitive | Description | Key Uniforms |
|-----------|-------------|--------------|
| `energy_orb` | Glowing sphere with pulse | color, emissive, pulseRate, scale |
| `ribbon_trail` | Follows motion path | color, width, length, falloff |
| `impact_flash` | Instant radial burst | color, spread, brightness, duration |
| `hex_rune` | Procedural geometric overlay | color, rotation, opacity, complexity |
| `smoke_wisp` | Volumetric billboard wisps | color, density, drift, lifetime |
| `electric_arc` | Lightning-style line renderer | color, turbulence, thickness, branches |
| `ground_ring` | Planar circle/rune on terrain | color, radius, rotation_speed, opacity |
| `shockwave` | Radial mesh distortion wave | strength, speed, falloff |
| `particle_burst` | Configurable emitter | color, count, velocity, lifetime |
| `aura_shell` | Persistent shell around entity | color, opacity, noise_scale, pulse |
| `beam_ray` | Sustained directional beam | color, width, distortion, brightness |
| `healing_motes` | Floating ascending particles | color, count, ascent_speed, glow |

### File Organization

```
/vfx/
  primitives/
    energy_orb.json         ← Babylon NodeMaterial serialized
    ribbon_trail.json
    impact_flash.json
    hex_rune.json
    smoke_wisp.json
    electric_arc.json
    ground_ring.json
    shockwave.json
    particle_burst.json
    aura_shell.json
    beam_ray.json
    healing_motes.json
  archetypes/
    charge_spell.json
    instant_strike.json
    sustained_beam.json
    shield_bubble.json
    heal_pulse.json
    aoe_blast.json
    ground_slam.json
    long_cast.json
  palettes/
    deity_apollo.json
    deity_artemis.json
    deity_athena.json
    deity_odin.json
    deity_hades.json
    deity_zeus.json
    deity_bob.json
    ... (one per deity)
  sequences/
    rank_up.json
    deity_bond.json
    roll_ceremony.json
    resonance_gain.json
    death.json
    respawn.json
```

---

## Layer 2 — Akashic Palette Resolver

This is the **soul translation layer** — the bridge between Akashic data and visual output. It computes a `VFXPalette` object for each player that all archetypes consume.

### VFXPalette Interface

```typescript
interface VFXPalette {
  // Core color identity
  soulColor: [r: number, g: number, b: number];    // primary hue
  accentColor: [r: number, g: number, b: number];   // secondary hue
  rankHue: number;                                   // HSL hue from tier system

  // Visual character
  emissiveBoost: number;          // 0.5 (dark/muted) → 2.5 (blazing holy)
  particleStyle: ParticleStyle;   // 'crystalline' | 'feathered' | 'tendril' | 'geometric' | 'organic'
  noiseScale: number;             // 0.1 (precise/arcane) → 2.0 (chaotic/dark)
  particleDensity: number;        // 0.3 (low MAG) → 3.0 (high MAG)

  // Strength signatures (top 3 derived strengths)
  strengthSignatures: StrengthVFX[];  // up to 3 persistent aura elements

  // Deity influence
  deityOverlay: DeityVFX | null;      // active deity visual layer

  // Combat state
  resourceType: 'mana' | 'stamina';  // drives blue/green palette split
  inCombat: boolean;
}
```

### Palette Derivation Logic

```typescript
function resolveAkashicPalette(akashic: AkashicData): VFXPalette {
  const { attributes, rank, rankTier, activeDiety, top3Strengths, resourceType } = akashic;

  // === Soul Color: Driven by dominant attribute axis ===
  const dominantAxis = getDominantAxis(attributes);
  // Physical → red/orange warmth
  // Mental   → purple/blue cool
  // Social   → gold/yellow warm-bright
  // Creative → teal/green
  const soulColor = AXIS_COLORS[dominantAxis];

  // === Rank Hue: Straight from badge tier system ===
  // Re-uses the existing HSL sweep formula: hue = (145 + (tier/99) × 263) % 360
  const rankHue = (145 + (rankTier / 99) * 263) % 360;

  // === Emissive Boost: Faith drives brilliance ===
  // Low faith = understated, high faith = blazing
  const emissiveBoost = 0.6 + (attributes.faith / 100) * 1.8;

  // === Particle Style: Top strength determines feel ===
  const particleStyle = STRENGTH_PARTICLE_STYLES[top3Strengths[0].name] ?? 'organic';

  // === Noise Scale: Cunning vs Magic balance ===
  // High cunning → tight, precise noise
  // High magic   → expansive, flowing
  const noiseScale = mapRange(attributes.cunning - attributes.magic, -100, 100, 1.8, 0.2);

  // === Particle Density: Magic level drives complexity ===
  const particleDensity = mapRange(attributes.magic, 0, 100, 0.3, 3.0);

  // === Deity Overlay ===
  const deityOverlay = activeDeity ? DEITY_VFX_OVERLAYS[activeDeity.deityName] : null;

  // === Strength Signatures: Top 3 persistent VFX ===
  const strengthSignatures = top3Strengths
    .slice(0, 3)
    .map(s => STRENGTH_VFX_TEMPLATES[s.name]);

  return {
    soulColor, accentColor: rankHueToRGB(rankHue), rankHue,
    emissiveBoost, particleStyle, noiseScale, particleDensity,
    strengthSignatures, deityOverlay,
    resourceType, inCombat: akashic.inCombat
  };
}
```

### Axis Color Definitions

| Axis | Attributes | Soul Color | Feeling |
|------|-----------|-----------|---------|
| Physical | STR, AGI, END | Warm ember `[1.0, 0.4, 0.1]` | Power, heat, motion |
| Mental | MAG, WIS, CUN | Cool violet `[0.5, 0.2, 1.0]` | Precision, depth, mystery |
| Social | LDR, FTH, CHA | Bright gold `[1.0, 0.85, 0.2]` | Warmth, radiance, presence |
| Creative | CRE, ART, INN | Teal-green `[0.1, 0.9, 0.7]` | Growth, invention, organic life |

If two axes are tied, the palette **blends** them — producing genuinely unique hybrid signatures.

---

## Layer 3 — Spell/Combat Archetypes

Archetypes define the **shape of an effect** — timing, sequencing, which primitives fire and when. They are **school-agnostic**: a `chargeSpell` is always a charge spell whether it's holy or dark. School/Akashic palette overlays on top.

### Archetype: `charge_spell`

```json
{
  "id": "charge_spell",
  "phases": {
    "buildup": {
      "duration": 1.2,
      "effects": [
        { "primitive": "energy_orb",   "scale": [0.05, 1.0], "opacity": [0, 1] },
        { "primitive": "ground_ring",  "scale": [0, 2.0], "speed": 1.5 },
        { "primitive": "electric_arc", "intensity": [0, 0.7], "count": 3 }
      ]
    },
    "release": {
      "duration": 0.25,
      "effects": [
        { "primitive": "impact_flash", "spread": 2.5 },
        { "primitive": "shockwave",    "speed": 9.0 }
      ]
    },
    "projectile": {
      "effects": [
        { "primitive": "energy_orb",    "size": 0.35 },
        { "primitive": "ribbon_trail",  "width": 0.18, "length": 1.8 }
      ]
    }
  }
}
```

### Full Archetype Catalog

| Archetype | Description | Phases |
|-----------|-------------|--------|
| `charge_spell` | Builds up, then releases projectile | buildup → release → projectile |
| `long_cast` | Ritual-style, stationary channel | windup → channel → culmination |
| `instant_strike` | No buildup, pure impact | impact → aftermath |
| `sustained_beam` | Continuous ray, held | startup → hold → decay |
| `shield_bubble` | Protective sphere | form → hold → break/fade |
| `heal_pulse` | Radiates outward from caster | origin_burst → wave → landing |
| `aoe_blast` | Ground-centered explosion | gather → detonate → smoke |
| `ground_slam` | Downward physical strike | wind_up → impact → crater |
| `summoning` | Entity arrival effect | rift_open → materialize → settle |
| `buff_apply` | Applies a positive effect to target | approach → wrap → glow |
| `debuff_apply` | Applies a negative effect | approach → infect → linger |
| `counter_strike` | Reactive — triggers on receiving hit | flash → rebound |

---

## Layer 4 — Event Sequences

These are the **ceremonial moments** in the player journey — not combat, but the beats that mark growth and identity.

### Rank Up Sequence

The rank tier badge already has an HSL hue. This sequence **brings that hue to life**:

```
1. Resonance bar fills to 100%
2. Particle burst: soulColor, 200 particles, radial outward
3. Badge PULSES to new tier hue (0.6s transition)
4. Ground ring expands from feet, tier hue, 4m radius, fades
5. Title text fades in with glow: "Jade Adventurer"
6. If crossing a tier boundary (e.g., Emerald → Jade):
   — Full aura shell fires, tier's hue, 2s hold
   — All nearby players see the effect (radius 30m)
```

### Deity Bonding Sequence

```
1. Player approaches Ritual Ring
2. Deity's signature color begins bleeding into ground ring
3. Runes form on ground (deity-specific hex_rune patterns)
4. Player's existing soul color and deity color spiral together
5. Merge flash — the combined palette locks in
6. Persistent strength signature VFX activates on avatar
```

### Roll Ceremony Sequence

```
1. Three roll columns appear
2. Each column shimmers with its dominant axis color
   (Physical = red warmth, Mental = cool violet, etc.)
3. On hover: the column's top strength name glows
4. On selection: shockwave from column, avatar adopts that palette
5. Confirm: particle burst, the Akashic signature is SET
```

### Resonance Gain

Subtle, constant. Scales with award magnitude:
- Small (+5–50): 3–5 gold motes float up from avatar, fade
- Medium (+50–500): brief pulse of soulColor around avatar
- Large (+500+): ground ring flashes, 2–3 particles per second for 3s
- Unexpected path bonus: gold shimmer tint on entire avatar for 1s

---

## Deity Visual Overlays

Each deity contributes a **persistent visual signature** to their bonded player's VFX. These do not override — they *layer* on top of the base Akashic palette.

| Deity | Overlay Effect | Color Signature |
|-------|---------------|-----------------|
| Artemis | Crescent-shaped ribbon trails | Silver-blue `[0.7, 0.85, 1.0]` |
| Athena | Occasional owl-eye hex runes | Olive gold `[0.8, 0.75, 0.2]` |
| Apollo | Sun motes drift upward constantly | Bright gold `[1.0, 0.95, 0.4]` |
| Demeter | Green growth wisps around feet | Leaf green `[0.2, 0.8, 0.3]` |
| Mars | Red ember sparks on physical impacts | Deep red `[0.9, 0.1, 0.1]` |
| Hermes | Wing-feather trails on movement | Quicksilver `[0.85, 0.9, 1.0]` |
| Freya | Runic shimmer on aura | Rose gold `[1.0, 0.6, 0.7]` |
| Odin | Single eye rune pulses on spell cast | Deep cobalt `[0.1, 0.2, 0.9]` |
| Zeus | Lightning arcs on impact | Electric white-blue `[0.8, 0.9, 1.0]` |
| Hades | Shadow tendrils on movement | Void purple `[0.15, 0.0, 0.3]` |
| Loki | Color randomly shifts on cast | Chaotic — cycles hue |
| Bob | All of the above, faint | All colors, very subtle |

---

## Derived Strength VFX Signatures (36)

Every player's top 3 derived strengths produce **persistent ambient effects** visible at all times. These are subtle — not combat blasts, but the soul showing through.

### Sample Strength Signatures

| Strength | Persistent VFX |
|----------|---------------|
| Battlemage (STR+MAG) | Occasional flame+lightning arc from hands |
| Assassin's Edge (AGI+CUN) | Shadow motes drift from movement trail |
| Prophecy (MAG+FTH) | Faint orbital hex rune rotates at shoulder height |
| Craftsmanship (CRE+ART) | Soft golden sparks when in build mode |
| Eureka (CUN+INN) | Small white flash above head on discovery |
| Enchantment (WIS+CHA) | Pale rose shimmer on speech/interaction |
| Warlord (STR+LDR) | Ground impact particles on footsteps |
| Devotecraft (FTH+CRE) | Holy motes rise from crafted objects |
| Runecraft (WIS+ART) | Geometric line traces appear briefly on spells |
| Arcane Design (MAG+ART) | Spell effects leave geometric afterimage |

*All 36 need templates — grouped by axis-pair for efficiency: 12 within-axis + 24 cross-axis = 36 templates, but the 4 cross-axis groups of 6 can share base particle styles.*

---

## The AkashicVFXSystem Service

The central Babylon.js service that manages everything.

### Service Interface

```typescript
class AkashicVFXSystem {
  private scene: BABYLON.Scene;
  private primitiveCache: Map<string, BABYLON.NodeMaterial>;
  private paletteCache: Map<string, VFXPalette>;    // userId → palette
  private activeEffects: Map<string, ActiveEffect[]>;

  // Core API
  async initialize(): Promise<void>;

  // Palette management
  async setPalette(userId: string, akashic: AkashicData): Promise<void>;
  getPalette(userId: string): VFXPalette | null;

  // Effect casting
  async castSpell(
    archetypeId: string,
    casterId: string,
    position: BABYLON.Vector3,
    target?: BABYLON.Vector3 | BABYLON.AbstractMesh
  ): Promise<void>;

  async triggerCombat(
    type: 'strike' | 'shield' | 'heal' | 'dodge' | 'death',
    entityId: string,
    position: BABYLON.Vector3
  ): Promise<void>;

  // Event sequences
  async playRankUp(userId: string, newRank: number, newTier: number): Promise<void>;
  async playDeityBond(userId: string, deityName: string): Promise<void>;
  async playRollCeremony(userId: string, chosenRoll: StatRoll): Promise<void>;
  async playResonanceGain(userId: string, amount: number): Promise<void>;

  // Persistent signature management
  startStrengthSignatures(userId: string, mesh: BABYLON.AbstractMesh): void;
  stopStrengthSignatures(userId: string): void;
  updateSignaturesOnAttributeChange(userId: string, newAkashic: AkashicData): void;

  // Cleanup
  disposeEffect(effectId: string): void;
  disposeAllForUser(userId: string): void;
}
```

### Integration Points with Existing Code

| Existing File | Integration |
|--------------|-------------|
| `AkashicRankManager.ts` | Call `vfxSystem.playRankUp()` on rank change |
| `AkashicDataService.ts` | Call `vfxSystem.setPalette()` on data fetch/update |
| `ResourceManager.ts` | Call `vfxSystem.triggerCombat()` on HP/mana events |
| `RegenerationSystem.ts` | Drive regen VFX tick (ambient healing/mana glow) |
| `AkashicPanel.ts` | Trigger roll ceremony sequence on roll accept |
| `ActionSlot.ts` | Call `vfxSystem.castSpell(archetype, ...)` on ability use |

---

## Combat Visual Language

Combat effects use the Akashic palette but follow a **second visual grammar** based on resource type:

### Mana-Class (MAG / FTH / CHA primary)
- Hit indicators: arcane geometric flash
- Damage numbers: glow, float up, fade with trailing motes
- Regen indicator: soft pulse of soulColor around avatar
- Death: avatar dissolves into energy orbs that slowly ascend

### Stamina-Class (STR / AGI / CUN primary)
- Hit indicators: physical spark burst, directional
- Damage numbers: sharp, snap to side, fall down
- Regen indicator: ground pulse, brief footstep impacts
- Death: avatar slumps with brief shockwave on ground contact

### Hybrid (tied highest attributes)
- Blended effects — partial geometric, partial physical spark
- Particularly striking for Battlemage, Prophecy, Manipulation builds

---

## Implementation Phases

### Phase 1 — Foundation (2–3 weeks)
- Build `AkashicVFXSystem` service skeleton
- Implement `VFXPaletteResolver` with all 4 axes + rank hue
- Create 5 core primitives as NodeMaterials: `energy_orb`, `impact_flash`, `particle_burst`, `aura_shell`, `ground_ring`
- Integrate `setPalette()` into `AkashicDataService` fetch
- **Proof of concept:** Two players with different dominant axes cast the same spell — visually distinct

### Phase 2 — Archetypes (2–3 weeks)
- Build archetype JSON format + parser
- Implement `charge_spell`, `instant_strike`, `heal_pulse`, `shield_bubble`
- Add remaining primitives: `ribbon_trail`, `shockwave`, `electric_arc`, `hex_rune`
- Connect `ActionSlot.ts` → `vfxSystem.castSpell()`
- **Milestone:** Full archetype-driven magic that reads Akashic data

### Phase 3 — Deity & Strength Signatures (2 weeks)
- Implement deity overlay system (14 deities)
- Build strength signature templates for all 36 derived strengths (grouped into ~10 base templates + per-strength params)
- `startStrengthSignatures()` on avatar spawn
- **Milestone:** Players visually wear their soul history

### Phase 4 — Event Sequences (1–2 weeks)
- Rank up ceremony
- Deity bonding sequence
- Roll ceremony VFX integration with `AttributeRollScreen.ts`
- Resonance gain ambient feedback
- **Milestone:** Progression moments feel like genuine events

### Phase 5 — Polish & Performance (ongoing)
- LOD system: reduce particle counts at distance
- GPU instancing for strength signature particles
- Palette caching strategy (invalidate on attribute change only)
- Benchmark: target <2ms/frame for ambient VFX at 20 nearby players

---

## Performance Strategy

The three main risks and mitigations:

**Risk: Too many particle systems at once**
- Mitigation: Strength signatures use instanced meshes, not separate particle systems
- Budget: max 3 active particle systems per player, queue others

**Risk: Palette recomputation on every frame**
- Mitigation: `VFXPalette` is cached per userId, invalidated only on attribute change event
- AkashicData changes are infrequent — this is safe

**Risk: NodeMaterial compilation cost on first spawn**
- Mitigation: Warm the primitive cache at world load time
- All 12 primitives compiled once at startup, cloned (cheap) per invocation

---

## The Poqpoq Differentiator

Most games give you a spell school (fire mage, holy paladin) and lock your visual identity there. poqpoq's system does something fundamentally different:

Your Akashic Record **is** your visual signature. Two players who both chose "Battlemage" on their roll ceremony start looking the same — then diverge as one bonds with Odin (cobalt eye rune, deep blue arcs) and the other bonds with Artemis (silver crescents, cool trailing ribbons). One grinds STR to 80 and their color warms toward ember. The other pushes MAG and their effects become more geometric, crystalline, precise.

By rank 50, no two players look alike. That's not cosmetics. That's the Akashic Record showing.

---

*poqpoq World — VFX Strategy v1.0*
*Proposed ADR: VFX-001*
*Prerequisites: ADR-023, ADR-046, ADR-030b*
