# poqpoq // Architecture Decision Record

---

# ADR-VFX-001 — Akashic VFX Authority & Module Topology

| Field | Value |
|-------|-------|
| **Status** | Draft — awaiting team review |
| **Date** | March 2026 |
| **Author** | Allen Partridge |
| **Domain** | VFX · Rendering · Soul Identity · Combat |
| **Affects** | World · AkashicDataService · Combat · UI · poqpoq-vfx (proposed) |
| **Depends on** | ADR-023 (Akashic Panel), ADR-046 (Attribute Roll System), ADR-030b (Combat VFX Phase 2) |

---

## Context

poqpoq's Akashic system tracks who a player IS at the soul level — 12 attributes across 4 axes, 36 derived strengths, deity bonds, rank tier, and four essences. This data is already computed and served by `AkashicDataService`. What does not yet exist is a system that **translates that soul record into a living visual language**.

Currently, every spell, combat event, and UI moment is either visually silent or triggers an isolated particle invocation with no connection to the caster's identity. Two players at rank 1 and rank 500 look identical casting the same spell. A player bonded to Hades and a player bonded to Apollo emit the same mana flash on damage. This is a missed opportunity at the level of core design philosophy: **the Akashic Record is supposed to show**.

Three existing systems have overlapping concerns that need clear authority boundaries:

- **AkashicDataService** — fetches and caches soul-level data; knows everything about a player's attributes, deity, and rank but owns no rendering
- **World / Combat** (`ResourceManager`, `ActionSlot`, `AkashicRankManager`, etc.) — owns combat events, resource changes, and rank progression; triggers effects but has no visual vocabulary
- **UI** (`AkashicPanel`, `AttributeRollScreen`) — owns ceremonial moments (rank up, roll ceremony, deity bonding) but has no effect pipeline

The core tension is the same one that motivated Splatter: **visual identity data has multiple producers and multiple consumers, and without clear authority, either everything gets tangled into World or nothing gets built consistently.** A single-owner model cannot serve the full scope. Any solution must let each team implement a small, scoped integration hook without knowledge of the VFX internals.

---

## Decision

We adopt a **palette-driven compositor model** with a distributed authority topology, implemented as a new micro-repo (`poqpoq-vfx`, working name **Luminary**).

The system has four layers evaluated in sequence. Each layer has a single owner. No team reaches across layer boundaries.

### The Four-Layer Pipeline

| Layer | Name | Owner | When It Evaluates |
|:-----:|------|-------|-------------------|
| **1** | Akashic Palette | `poqpoq-vfx` | On AkashicData fetch or attribute change |
| **2** | Spell / Combat Archetype | `poqpoq-vfx` | On ability execution or combat event |
| **3** | Primitive Assembly | `poqpoq-vfx` | Per effect spawn |
| **4** | Integration Hooks | Each consuming team | In their own files, against the contract |

Layer 1 is the foundational translation: raw Akashic numbers become a `VFXPalette` — a typed object encoding soul color, emissive boost, particle style, noise scale, density, deity overlay, and strength signatures. Every downstream layer reads from this palette. No layer below Layer 1 ever reads Akashic attributes directly.

---

## Module Topology & Boundaries

### poqpoq-vfx (Luminary) — The VFX Authority

A new standalone micro-repo. Contains the palette resolver, primitive library, archetype definitions, and main service. Deployed as a versioned package consumed by World.

**Luminary owns:**

- `AkashicVFXTypes.ts` — the shared contract interfaces (`VFXPalette`, `SpellArchetypeId`, `StrengthVFXSignature`, etc.). **No Babylon dependency.** Safe to import from any team's codebase including server-side code and tests.
- `AkashicPaletteResolver.ts` — pure functions that translate `AkashicData` → `VFXPalette`. **No Babylon dependency.** Fully unit-testable without a running scene.
- `AkashicVFXSystem.ts` — the Babylon.js service. Owns the primitive cache, archetype parser, palette cache, and all effect lifecycle management.
- `public/vfx/archetypes/spell_archetypes.json` — data-driven archetype definitions. Adding a new spell shape requires no code changes to any team — only a new JSON entry here.
- `public/vfx/primitives/` — NodeMaterial and ShaderMaterial assets for each primitive (energy_orb, impact_flash, ground_ring, hex_rune, shockwave, healing_motes, electric_arc, aura_shell, smoke_wisp, beam_ray, ribbon_trail, particle_burst).

**Luminary does NOT own:**

- Akashic data fetching or storage — that is `AkashicDataService`
- Combat resolution logic — that is `ResourceManager` and `ActionSlot`
- UI panel layout or shelf architecture — that is `AkashicPanel` and `AttributeRollScreen`
- Rank progression math — that is `AkashicRankManager`
- When effects fire — consuming teams decide that in their own integration hooks

> Luminary knows *how* to paint. It never decides *when*. That is always the consuming team's call.

---

### AkashicDataService — Palette Computation Trigger

`AkashicDataService` is the natural trigger point for palette initialization. It already owns the fetch lifecycle. Adding VFX awareness requires exactly two lines of integration.

**AkashicDataService integration responsibilities:**

- Call `vfxSystem.setPalette(userId, data)` on every successful data fetch
- Call `vfxSystem.updateSignaturesOnAttributeChange(userId, data, avatarMesh)` when attributes change (deity bond, quest reward, level up)

**AkashicDataService does NOT own:**

- Any VFX logic — it is a pure trigger. The shape of `VFXPalette` is opaque to it.
- Effect timing or sequencing
- Primitive or archetype selection

---

### World / Combat — Runtime Effect Triggers

The combat system owns *when* effects fire. `ResourceManager`, `ActionSlot`, and `AkashicRankManager` each gain one integration hook into the VFX service. The hook is a single typed function call. The combat team has no knowledge of primitives, palette resolution, or archetype structure.

**Combat integration responsibilities:**

- `ActionSlot` — call `vfxSystem.castSpell(archetypeId, casterId, position, target)` on ability execution. The `archetypeId` is a config field on the slot, not computed at runtime.
- `ResourceManager` — call `vfxSystem.triggerCombat(type, entityId, position)` on hit, crit, dodge, death, and respawn events.
- `AkashicRankManager` — call `vfxSystem.playRankUp(userId, newRank, newTier, position)` on rank change. Call `vfxSystem.playResonanceGain(userId, amount, position)` on resonance award.

**Combat does NOT own:**

- Any VFX logic downstream of the hook call
- Palette data — it passes `userId` and the service resolves the palette from cache

---

### UI — Ceremony Sequence Triggers

UI panels own the ceremonial moments in a player's progression. Each panel gets one integration hook for its specific ceremony.

**UI integration responsibilities:**

- `AttributeRollScreen` — call `vfxSystem.playRollCeremony(userId, position)` after `accept-roll` API response and palette refresh
- `AkashicPanel` — surface for deity bonding: call `vfxSystem.playDeityBond(userId, deityName, position)` after bond confirmation

**UI does NOT own:**

- Effect content or sequencing — that is Luminary's archetype definitions
- Palette state — the roll ceremony fires *after* `setPalette()` has been called with the chosen roll

---

### World — Avatar Lifecycle

Wherever avatar meshes are created and destroyed (PlayerController or EntityManager), two hooks manage persistent strength signature effects.

```typescript
// On avatar spawn — start ambient strength signature particles
vfxSystem.startStrengthSignatures(userId, avatarMesh);

// On avatar despawn — clean up all VFX for this user
vfxSystem.disposeAllForUser(userId);
```

---

## The Palette Contract

`VFXPalette` is the SDF contract equivalent for this system — the data handshake between Layer 1 and all downstream layers. No consuming team should need to understand how a palette was computed. They receive it opaquely via the cache and it drives all rendering decisions.

```typescript
interface VFXPalette {
  userId: string;

  // Core identity colors — derived from dominant attribute axis
  soulColor: RGB;           // Physical=ember, Mental=violet, Social=gold, Creative=teal
  accentColor: RGB;         // Rank tier hue via existing badge formula
  rankHue: number;          // HSL: (145 + (tier/99) × 263) % 360  ← reuses badge math

  // Visual character — derived from attribute values
  emissiveBoost: number;    // Faith 0→100 maps to 0.6→2.4
  particleStyle: ParticleStyle; // Top derived strength determines texture feel
  noiseScale: number;       // CUN vs MAG balance: precise←→chaotic
  particleDensity: number;  // MAG 0→100 maps to 0.3→3.0

  // Identity layers
  strengthSignatures: StrengthVFXSignature[];  // Top 3 derived strengths → ambient effects
  deityOverlay: DeityVFXOverlay | null;         // Active deity → persistent visual layer

  // Combat state
  resourceType: 'mana' | 'stamina';  // Drives blue/green palette split
  inCombat: boolean;

  // Axis metadata
  dominantAxis: AttributeAxis;
  secondaryAxis: AttributeAxis | null;  // Present when two axes are within 5 points
}
```

### Palette Invalidation Rules

The palette is computed once per data fetch and cached per `userId`. It is invalidated — and therefore recomputed — only when:

1. `AkashicDataService.fetchAkashicData()` completes (any fetch)
2. A deity bond is established or broken (Faith amplification changes)
3. An attribute crosses an axis-dominance threshold (e.g. Mental overtakes Physical as the leader)
4. Rank tier changes (accent color changes with tier hue)

Palette recomputation is **not** triggered by: resonance gains that don't change rank, combat state changes, or UI events. The `diffPalettes()` utility identifies which sub-systems need updating when a new palette is computed, preventing unnecessary effect restarts.

---

## Axis Soul Color Derivation

The `soulColor` is derived from which of the four attribute axes is dominant. This is the visual grammar of soul identity.

| Dominant Axis | Attributes | Soul Color | Visual Character |
|---|---|---|---|
| Physical | STR, AGI, END | Ember `[1.0, 0.35, 0.08]` | Power, heat, motion |
| Mental | MAG, WIS, CUN | Deep violet `[0.45, 0.18, 0.95]` | Precision, mystery, depth |
| Social | LDR, FTH, CHA | Bright gold `[1.0, 0.85, 0.15]` | Warmth, radiance, presence |
| Creative | CRE, ART, INN | Teal-green `[0.08, 0.88, 0.65]` | Growth, invention, organic life |

When two axes are within 5 points of each other, `secondaryAxis` is set and the soul color **blends** toward the secondary — producing hybrid signatures for mixed builds. A STR/MAG player gradually shifts from pure ember toward an ember-violet composite as magic climbs.

---

## Archetype System: Separating Shape from Identity

Spell archetypes define the *shape* of an effect — timing, phases, which primitives fire and when — entirely independently of school, deity, or soul color. The palette overlays on top of any archetype.

This means:
- Adding a new spell shape requires only a JSON entry in `spell_archetypes.json`. No team meeting needed.
- The same `charge_spell` archetype produces fire when cast by a Physical-dominant player, cold violet when cast by a Mental-dominant player, and gold light when cast by a high-Faith Social player.
- A player bonded to Odin gets a cobalt eye rune layered over every cast regardless of which archetype fires.

```
spell_archetypes.json
  charge_spell:   buildup → release → projectile
  instant_strike: impact → aftermath
  long_cast:      windup → channel → culmination
  sustained_beam: startup → hold → decay
  shield_bubble:  form → hold → break/fade
  heal_pulse:     origin_burst → wave → landing
  aoe_blast:      gather → detonate → smoke
  ground_slam:    wind_up → impact → crater
```

---

## Strength Signatures: The Soul Showing

Every player's top 3 derived strengths from the roll ceremony — and as they evolve through play — produce **persistent ambient VFX** visible at all times. These are not combat effects. They are the Akashic Record made visible.

Strength signatures are:
- Subtle enough to be atmospheric, not distracting
- Specific enough to be recognizable across the full 36-strength vocabulary
- Evolving — as attributes change and new strengths emerge, signatures update

Examples: a Battlemage sees occasional flame+lightning arcs from their hands. A Prophecy build has a faint orbital hex rune at shoulder height. An Enchantment build casts a soft rose shimmer on interactions. These effects require no player action. They are simply what the soul looks like.

---

## Deity Visual Overlays

Each of the 14 visible deities (+ 2 hidden) contributes a persistent visual layer to their bonded player. Overlays do not replace the Akashic palette — they layer on top of it. A player with a Mental-dominant soul who bonds with Odin gets the cobalt eye rune layered over their cool violet base. The two identities compound rather than cancel.

Overlays are defined in `DEITY_VFX_OVERLAYS` in `AkashicPaletteResolver.ts`. Each entry specifies: deity color, which primitive to use, when it triggers (always / movement / spellcast / impact), and intensity.

---

## Scope Boundaries

### In Scope (Luminary — poqpoq-vfx)
- `VFXPalette` interface definition and versioning
- Palette resolver (pure functions, no Babylon dependency)
- Primitive library (NodeMaterial/ShaderMaterial assets)
- Archetype JSON definitions and parser
- `AkashicVFXSystem` service (Babylon-coupled, consumed by World)
- Deity overlay definitions
- Strength signature templates for all 36 derived strengths
- Unit tests for the resolver (run without a scene)

### In Scope (Consuming Teams — their own files only)
- Calling `setPalette()` from `AkashicDataService`
- Calling `castSpell()` from `ActionSlot`
- Calling `triggerCombat()` from `ResourceManager`
- Calling `playRankUp()` / `playResonanceGain()` from `AkashicRankManager`
- Calling `playRollCeremony()` from `AttributeRollScreen`
- Calling `playDeityBond()` from deity bonding confirmation
- Calling `startStrengthSignatures()` / `disposeAllForUser()` from avatar lifecycle

### Out of Scope (all teams)
- No team writes VFX primitives directly — all effects go through `AkashicVFXSystem`
- No team reads `VFXPalette` fields to make gameplay decisions — the palette is visual only
- No team re-implements soul color derivation — `AkashicPaletteResolver` is the single source of truth
- No team hardcodes particle colors — all colors derive from the palette contract

---

## Follow-On ADRs Required

| ADR | Topic | Author | Reviewers |
|-----|-------|--------|-----------|
| ADR-VFX-002 | Palette Contract — full interface spec, invalidation rules, `diffPalettes()` protocol | Luminary | Akashic/Combat teams |
| ADR-VFX-003 | Integration Hook Specifications — exact call signatures for each consuming team | Luminary | All teams |
| ADR-VFX-004 | Strength Signature System — all 36 templates, grouping strategy, LOD rules | Luminary | World team |
| ADR-VFX-005 | NodeMaterial Asset Pipeline — primitive authoring workflow, hot-reload, versioning | Luminary | World team |

---

## Performance Constraints

The VFX system must satisfy these bounds or implementing teams may reject integration:

| Constraint | Target |
|---|---|
| Palette computation (cold) | < 1ms per player |
| Palette cache hit | < 0.1ms |
| Primitive spawn (per effect phase) | < 2ms |
| Ambient signatures (20 nearby players) | < 2ms/frame total |
| Memory per cached palette | < 2KB |
| Archetype JSON parse (cold, all archetypes) | < 10ms at init |

Palette computation uses only arithmetic and table lookups — no async operations, no allocations in the hot path.

---

## Consequences

**Positive:**

- Clean module boundaries — each team's integration is a single typed function call, not a sprawling dependency
- The pure `AkashicPaletteResolver` and `AkashicVFXTypes` files can be imported and unit-tested by any team without a running Babylon scene
- Adding new spell archetypes, deities, or strength signatures requires only data changes — no cross-team coordination
- The existing rank tier badge HSL formula is reused directly for `accentColor` — no new math, no new data
- Two players with identical builds who bond with different deities look visibly different — emergent visual identity from systems that already exist
- Failed AI companion commands (proposed spells that don't resolve) can log to the archetype system as feature roadmap items — same pattern as Splatter's AI Proposals panel

**Costs & Risks:**

- Palette cache must be invalidated correctly — stale palettes produce wrong colors silently. The `diffPalettes()` utility mitigates this but consuming teams must call it on update paths.
- The `AkashicVFXSystem` singleton must be initialized before any consuming team calls it. Boot order must be documented and enforced.
- 36 strength signature templates is a real authoring commitment. Grouping by axis-pair (4 groups × ~9 strengths each sharing base particle styles) makes this tractable without requiring 36 unique assets.
- NodeMaterial assets require Babylon tooling to author. Until the full NodeMaterial pipeline is established (ADR-VFX-005), primitives fall back to the Babylon native particle system implementations already scaffolded in `AkashicVFXSystem.ts`.

---

## Review Checklist

- [ ] **AkashicDataService team:** Confirm `setPalette()` call fits naturally into the existing fetch lifecycle without additional async overhead
- [ ] **Combat team:** Confirm `archetypeId` as an `ActionSlot` config field is the right integration point; flag if slot config shape needs to change
- [ ] **ResourceManager team:** Confirm the `CombatEventType` union covers all combat events that need visual feedback
- [ ] **UI team:** Confirm `playRollCeremony()` firing *after* `setPalette()` is the correct ordering for the roll confirm flow
- [ ] **All teams:** Confirm the performance targets are acceptable — flag any integration point where < 2ms is not achievable
- [ ] **All teams:** Confirm the out-of-scope boundaries — specifically that no team needs to read `VFXPalette` fields for non-visual gameplay logic

---

*poqpoq · ADR-VFX-001 · Akashic VFX Authority & Module Topology · March 2026*
*Author: Allen Partridge*
*Next: ADR-VFX-002 (Palette Contract) · ADR-VFX-003 (Integration Hooks)*
