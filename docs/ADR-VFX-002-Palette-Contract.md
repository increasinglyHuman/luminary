# poqpoq // Architecture Decision Record

---

# ADR-VFX-002 — Palette Contract

| Field | Value |
|-------|-------|
| **Status** | Draft — awaiting team review |
| **Date** | March 2026 |
| **Author** | Allen Partridge |
| **Domain** | VFX · Identity · Data Contracts |
| **Affects** | World · AkashicDataService · Combat · UI · Scripter · Glitch · poqpoq-vfx |
| **Depends on** | ADR-VFX-001 (Module Topology), ADR-023 (Akashic Panel), ADR-046 (Attribute Roll System) |
| **Supersedes** | Palette Contract section of ADR-VFX-001 (promoted to standalone ADR) |

---

## Context

ADR-VFX-001 established that all visual identity flows through a `VFXPalette` — a typed data object computed from a player's Akashic Record. Every archetype, primitive, and event sequence reads from this palette. No team inspects raw attributes to make visual decisions.

The palette is the **single most important contract** in the Luminary system. Every consuming team depends on its shape, every primitive uses its colors, and every integration hook assumes its caching behavior. If the palette contract is ambiguous, teams will either duplicate derivation logic (violating single-source-of-truth) or make incorrect assumptions about freshness (producing stale colors).

This ADR formalizes:
1. The complete `VFXPalette` interface with field-level documentation
2. How each field is derived (the resolution contract)
3. Cache lifecycle — when palettes are created, invalidated, and disposed
4. The `diffPalettes()` protocol for selective updates
5. Consumption rules — what teams may and may not do with palette data
6. GameEventBus integration — how palette updates flow via events

---

## The VFXPalette Interface

The canonical definition lives in `AkashicVFXTypes.ts`. This ADR documents the semantic contract for each field.

```typescript
interface VFXPalette {
  userId: string;

  // ── Core Identity Colors ──
  soulColor: RGB;           // Dominant axis color (see §Axis Soul Colors)
  accentColor: RGB;         // Rank tier hue converted to RGB
  rankHue: number;          // HSL hue: (145 + (tier/99) × 263) % 360

  // ── Visual Character ──
  emissiveBoost: number;    // GlowLayer intensity multiplier
  particleStyle: ParticleStyle;  // Texture family for all effects
  noiseScale: number;       // Noise texture scale (low = precise, high = chaotic)
  particleDensity: number;  // Particle count multiplier

  // ── Identity Layers ──
  strengthSignatures: StrengthVFXSignature[];  // Top 3 persistent effects
  deityOverlay: DeityVFXOverlay | null;        // Active deity visual layer

  // ── Combat State ──
  resourceType: 'mana' | 'stamina';
  inCombat: boolean;

  // ── Derived Metadata ──
  dominantAxis: AttributeAxis;
  secondaryAxis: AttributeAxis | null;
}
```

### Supporting Types

```typescript
type RGB = [number, number, number];  // Each channel 0.0–1.0, linear space

type ParticleStyle =
  | 'crystalline'   // Hard edges, geometric — high CUN
  | 'feathered'     // Soft, billowing — high FTH
  | 'tendril'       // Organic, reaching — dark/chaotic
  | 'geometric'     // Structured patterns — high MAG
  | 'organic'       // Natural flow — creative axis
  | 'ember'         // Hot sparks — physical axis
  | 'void';         // Anti-particles, subdued — fresh character or Hades bond

type AttributeAxis = 'physical' | 'mental' | 'social' | 'creative';

interface StrengthVFXSignature {
  strengthName: string;     // Derived strength name (e.g. "Battlemage")
  primitiveId: string;      // Which VFX primitive to spawn
  color: RGB;               // Signature-specific color
  intensity: number;        // 0.0–1.0, scales with strength value
  attachPoint: 'hands' | 'feet' | 'head' | 'torso' | 'ambient';
  rate: number;             // Emission rate (particles/sec or pulse interval)
}

interface DeityVFXOverlay {
  deityName: string;
  color: RGB;
  primitiveId: string;
  description: string;
  triggerOn: 'always' | 'movement' | 'spellcast' | 'impact';
  intensity: number;        // 0.0–1.0
}
```

---

## Field Derivation Rules

Each palette field is derived from specific Akashic inputs. This table is the resolution contract — the promise that consuming teams can rely on.

| Field | Input(s) | Formula | Range |
|-------|----------|---------|-------|
| `soulColor` | 12 attributes → dominant axis | Axis lookup + optional 30% blend with secondary | RGB 0–1 |
| `accentColor` | `rankTier` | `hslToRGB((145 + (tier/99) × 263) % 360, 0.6, 0.55)` | RGB 0–1 |
| `rankHue` | `rankTier` | `(145 + (min(tier, 99) / 99) × 263) % 360` | 0–360 |
| `emissiveBoost` | `faith` | `mapRange(faith, 0, 100, 0.6, 2.4)` | 0.6–2.4 |
| `particleStyle` | `top3Strengths`, attributes, dominant axis | Strength lookup → axis default → void fallback | enum |
| `noiseScale` | `cunning - magic` | `mapRange(cun-mag, -80, 80, 1.8, 0.2)` | 0.2–1.8 |
| `particleDensity` | `magic` | `mapRange(magic, 0, 100, 0.3, 3.0)` | 0.3–3.0 |
| `strengthSignatures` | `top3Strengths` | Template lookup + intensity scaling | 0–3 entries |
| `deityOverlay` | `activeDeity` | Direct overlay table lookup | nullable |
| `resourceType` | player class/choice | Pass-through from AkashicData | enum |
| `inCombat` | combat state | Pass-through from AkashicData | boolean |
| `dominantAxis` | 12 attributes | Axis with highest avg of its 3 attributes | enum |
| `secondaryAxis` | 12 attributes | Second-highest axis if within 5 points of dominant | nullable enum |

### Axis Soul Colors

| Axis | RGB | Visual Character |
|------|-----|-----------------|
| Physical | `[1.0, 0.35, 0.08]` | Ember orange-red: power, heat, motion |
| Mental | `[0.45, 0.18, 0.95]` | Deep violet: precision, mystery, depth |
| Social | `[1.0, 0.85, 0.15]` | Bright gold: warmth, radiance, presence |
| Creative | `[0.08, 0.88, 0.65]` | Teal-green: growth, invention, organic life |

### Secondary Axis Blending

When two axes score within 5 points of each other:
- `secondaryAxis` is set (non-null)
- `soulColor` blends up to **30%** toward the secondary axis color
- Blend factor: `0.3 × (secondaryScore / dominantScore)`
- This produces hybrid signatures: a STR/MAG player shifts from pure ember toward ember-violet

When the gap exceeds 5 points, `secondaryAxis` is `null` and `soulColor` is the pure dominant axis color.

---

## Cache Lifecycle

### Creation

A palette is created when `resolveAkashicPalette(akashicData)` is called. This is a **pure function** — no side effects, no allocations beyond the return object, no Babylon dependency. It can be called from server-side code, tests, or UI.

The `AkashicVFXSystem` maintains a per-userId cache:

```
Map<string, VFXPalette>  — keyed by userId
```

### Invalidation Events

The palette cache entry for a userId is invalidated and recomputed when:

| Event | Source | Why |
|-------|--------|-----|
| `akashic:data-loaded` | AkashicDataService | Any attribute or rank change from server |
| Deity bond established/broken | Deity bonding UI | `deityOverlay` and `emissiveBoost` change |
| Axis dominance threshold crossed | Attribute increase | `soulColor` changes fundamentally |
| Rank tier change | AkashicRankManager | `accentColor` and `rankHue` change |

### NOT Invalidated By

These events do **not** trigger palette recomputation:

- Resonance gains that don't change rank tier
- Combat state changes (`inCombat` flag) — this is set directly, not recomputed
- UI events (panel open/close, camera changes)
- Other players' attribute changes
- Movement or position changes

### Disposal

When `disposeAllForUser(userId)` is called (avatar despawn), the palette cache entry is removed. Memory is released. If the user reconnects, the palette is recomputed from fresh AkashicData.

---

## The diffPalettes() Protocol

When a palette is recomputed, not all VFX subsystems need to restart. Restarting ambient strength signatures because rank hue changed is wasteful. The `diffPalettes()` function identifies exactly what changed.

```typescript
type PaletteDiff = {
  colorChanged: boolean;       // soulColor or emissiveBoost differs
  densityChanged: boolean;     // particleDensity or noiseScale differs
  styleChanged: boolean;       // particleStyle enum differs
  deityChanged: boolean;       // deity overlay added, removed, or switched
  signaturesChanged: boolean;  // strength signature names differ
};

function diffPalettes(prev: VFXPalette, next: VFXPalette): PaletteDiff;
```

### Diff Thresholds

- **Color comparison**: RGB channels use epsilon of `0.01` — smaller changes are ignored
- **Numeric fields**: Exact equality (no epsilon)
- **Signatures**: Compared by name list join — order matters

### How Teams Use the Diff

The `AkashicVFXSystem` uses the diff internally. Consuming teams **never call `diffPalettes()` directly**. They call `setPalette()` and the system handles selective updates:

```
setPalette(userId, newAkashicData):
  1. Resolve new palette
  2. If cache hit: diff against cached palette
     - colorChanged → update all active effect colors
     - densityChanged → restart particle emitters with new counts
     - styleChanged → swap particle textures
     - deityChanged → stop old overlay, start new one
     - signaturesChanged → restart ambient strength signatures
  3. If no cache: full initialization
  4. Store new palette in cache
```

This means consuming teams get selective updates for free. A rank-up that changes `accentColor` but not `soulColor` will only update the accent-dependent effects.

---

## Consumption Rules

### What Teams MAY Do

1. **Read palette fields for display purposes** — UI panels may read `soulColor`, `rankHue`, or `dominantAxis` to tint their own elements (e.g., health bar glow matching soul color)
2. **Pass palette to Luminary API calls** — all Luminary methods accept a `userId` and resolve the palette internally from cache
3. **Subscribe to `akashic:palette-updated` events** — teams that need to react to palette changes (e.g., companion aura system) can subscribe via GameEventBus

### What Teams MUST NOT Do

1. **Derive visual properties from raw attributes** — all visual derivation goes through the resolver. No `if (faith > 50) glowColor = gold` in consuming code.
2. **Cache palettes independently** — the VFX system owns the cache. Holding a stale reference produces wrong colors.
3. **Mutate palette objects** — palettes are treated as immutable after creation. To change a palette, call `setPalette()` with updated AkashicData.
4. **Use palette fields for gameplay decisions** — the palette is visual-only. No `if (dominantAxis === 'physical') dealMoreDamage()`.
5. **Hardcode RGB values** — all colors flow from the palette. Even "fire red" for a fireball should use `palette.soulColor` tinted toward warm, not `[1, 0, 0]`.

---

## GameEventBus Integration

Palette lifecycle is communicated via typed events on the `GameEventBus`. This decouples palette producers from consumers.

### Events Emitted

| Event | Payload | When |
|-------|---------|------|
| `akashic:palette-updated` | `{ userId, palette, diff }` | After any `setPalette()` that produces a non-trivial diff |
| `akashic:palette-disposed` | `{ userId }` | After `disposeAllForUser()` removes a cache entry |

### Events Consumed

| Event | Handler | Action |
|-------|---------|--------|
| `akashic:data-loaded` | `AkashicVFXSystem` | Trigger palette recomputation for that userId |
| `akashic:rank-up` | `AkashicVFXSystem` | Refresh palette (tier may have changed) + play ceremony |

### Wiring Example

```typescript
// In AkashicVFXSystem initialization
eventBus.on('akashic:data-loaded', ({ userId, rank, dominantAxis }) => {
  // AkashicDataService has fresh data — recompute palette
  const akashicData = akashicDataService.getCachedData(userId);
  if (akashicData) {
    this.setPalette(userId, akashicData);
  }
});

eventBus.on('akashic:rank-up', ({ userId, oldRank, newRank, position }) => {
  // Rank changed — palette may need new accentColor
  const akashicData = akashicDataService.getCachedData(userId);
  if (akashicData) {
    this.setPalette(userId, akashicData);
    this.playRankUp(userId, newRank, Math.floor(newRank / 100), position);
  }
});
```

---

## Performance Contract

| Operation | Budget | Notes |
|-----------|--------|-------|
| `resolveAkashicPalette()` | < 1ms | Pure arithmetic + table lookups. No async, no allocations in hot path. |
| Cache hit (`getPalette(userId)`) | < 0.1ms | Single Map.get() |
| `diffPalettes()` | < 0.2ms | 5 comparisons, 2 array joins |
| `setPalette()` (cache hit, diff) | < 2ms | Resolve + diff + selective effect update |
| `setPalette()` (cold, first time) | < 3ms | Resolve + full effect initialization |
| Memory per palette | < 2KB | Fixed-size object, no dynamic arrays beyond top-3 signatures |

### Benchmark Expectations

With 20 nearby players all having cached palettes:
- Frame budget for ambient VFX: < 2ms total
- Palette lookups: 20 × 0.1ms = 2ms (within budget)
- No per-frame palette recomputation — only on data events

---

## Versioning

The palette contract is versioned implicitly by the `AkashicVFXTypes.ts` file. When fields are added:

1. New fields must have defaults in `resolveAkashicPalette()` so old AkashicData still produces valid palettes
2. New fields must be added to `PaletteDiff` if they affect running effects
3. Consuming teams are notified via `comms/comms.md` decision log

When fields are removed (unlikely but possible):
1. Deprecated for one release cycle
2. Consuming teams audit usage
3. Removed in next version

### Current Version: 1.0

Fields in v1.0:
- Core: `userId`, `soulColor`, `accentColor`, `rankHue`
- Character: `emissiveBoost`, `particleStyle`, `noiseScale`, `particleDensity`
- Layers: `strengthSignatures`, `deityOverlay`
- State: `resourceType`, `inCombat`
- Meta: `dominantAxis`, `secondaryAxis`

---

## Examples

### Example 1: Fresh Emerald Noob

```
Input:  All attributes at 10, rank 1, tier 0, no deity, no strengths
Output:
  soulColor:     [dark blend — all axes tied]
  accentColor:   emerald green (hue 145)
  rankHue:       145
  emissiveBoost: 0.6 (minimum — low faith)
  particleStyle: 'void' (total stats < 140)
  noiseScale:    1.0 (CUN = MAG, neutral)
  particleDensity: 0.3 (minimum — low MAG)
  strengthSignatures: []
  deityOverlay:  null
  dominantAxis:  (arbitrary — all tied)
  secondaryAxis: (present — all tied)
```

### Example 2: Gold Transcendent Battlemage bonded to Odin

```
Input:  STR 80, MAG 75, AGI 45, others 15-25, rank 95, tier 0,
        deity Odin, strengths: [Battlemage, Prowess, Arcane Design]
Output:
  soulColor:     ember-violet blend (physical dominant, mental secondary)
  accentColor:   deep amber (hue ~275 at tier 0 rank 95)
  rankHue:       ~275
  emissiveBoost: 0.87 (faith ~15)
  particleStyle: 'ember' (Battlemage strength)
  noiseScale:    1.2 (MAG slightly > CUN — flowing)
  particleDensity: 2.25 (MAG 75)
  strengthSignatures: [
    { Battlemage: electric_arc at hands },
    { Prowess: ember sparks, reduced intensity },
    { Arcane Design: hex_rune ambient }
  ]
  deityOverlay:  { odin: cobalt hex_rune on spellcast, intensity 0.9 }
  dominantAxis:  'physical'
  secondaryAxis: 'mental'
```

### Example 3: Social-Creative Crafter bonded to Brigid

```
Input:  CHA 65, FTH 70, LDR 50, CRE 60, ART 55, INN 45,
        combat stats 10-15, rank 32, tier 0,
        deity Brigid, strengths: [Devotecraft, Enchantment, Vision]
Output:
  soulColor:     gold with teal tinge (social dominant, creative secondary)
  accentColor:   emerald-teal (hue ~250 at tier 0 rank 32)
  emissiveBoost: 1.86 (faith 70 — radiant)
  particleStyle: 'feathered' (Devotecraft strength)
  noiseScale:    1.0 (CUN ≈ MAG, both low)
  particleDensity: 0.3 (low MAG)
  strengthSignatures: [
    { Devotecraft: healing_motes ambient, warm gold },
    { Enchantment: healing_motes ambient, rose shimmer },
    { Vision: organic ambient, soft teal }
  ]
  deityOverlay:  { brigid: warm forge sparks, always, intensity 0.5 }
  dominantAxis:  'social'
  secondaryAxis: 'creative'
```

---

## Review Checklist

- [ ] **AkashicDataService team:** Confirm that emitting `akashic:data-loaded` on every fetch is acceptable (no performance concern with palette recompute at < 1ms)
- [ ] **Combat team:** Confirm that `inCombat` flag can be set directly on the cached palette without full recomputation
- [ ] **UI team:** Confirm that reading `soulColor` / `rankHue` for panel tinting is an acceptable use case
- [ ] **Scripter team:** Confirm that scripts can read palette fields (read-only) for visual scripting decisions
- [ ] **All teams:** Confirm the "must not" consumption rules are clear and agreed upon

---

## Relationship to Other ADRs

| ADR | Relationship |
|-----|-------------|
| ADR-VFX-001 | Parent — defines the four-layer pipeline this palette feeds |
| ADR-VFX-006 | Sibling — four-axis vocabulary uses palette colors for Social/Creative VFX |
| ADR-VFX-004 (future) | Child — strength signature templates consume palette for coloring |
| ADR-VFX-005 (future) | Child — NodeMaterial primitives receive palette as shader uniforms |

---

*poqpoq · ADR-VFX-002 · Palette Contract · March 2026*
*Author: Allen Partridge*
*Canonical implementation: `AkashicVFXTypes.ts` + `AkashicPaletteResolver.ts`*
