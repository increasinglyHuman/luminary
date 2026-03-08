# Luminary (poqpoq-vfx) — Team Collaboration Document

**Last Updated:** 2026-03-09
**Status:** Active — Living Document

---

## Purpose

This document coordinates collaboration between all teams that touch the Luminary VFX system. It is the **single source of truth** for cross-team communication, integration status, blockers, and decisions.

### Contributing Teams

| Team | Domain | Primary Contact Point |
|------|--------|----------------------|
| **Luminary** (poqpoq-vfx) | VFX palette, primitives, archetypes, system service | This repo |
| **poqpoq World** | Game engine, avatar lifecycle, scene management | [poqpoq-world](https://github.com/increasinglyHuman/poqpoq-world) |
| **Scripter** | Scripting engine — user-authored & system scripts | Scripter repo |
| **Glitch** | Preview & visualization tool | Glitch repo |
| **Dungeon Master** | Dungeon generation, traps, built-in effects | DM module |

---

## Integration Status

### Luminary → poqpoq World

| Integration Point | Status | Notes |
|---|---|---|
| GameEventBus event types | **Done** | 24 new event types added (3 akashic/combat + 10 social + 8 creative) — see report below |
| `AkashicDataService` → `'akashic:data-loaded'` | **Done** | Emits after successful fetch with `userId`, `rank`, `dominantAxis` |
| `AkashicRankManager` → `'akashic:rank-up'` | **Done** | Emits in `rankUp()` with `userId`, `oldRank`, `newRank`, `position` |
| `ActionSlot.vfxArchetype` field | **Done** | Optional `string` field added to interface |
| `combat:ability-fired` emission | **Done** | ActionSystem emits when `vfxArchetype` is set on the action |
| `ResourceManager.triggerCombat()` | Planned | Hook into hit/death/dodge events via GameEventBus |
| `AttributeRollScreen.playRollCeremony()` | Planned | After roll accept + palette set |
| Avatar spawn/despawn signatures | Planned | `startStrengthSignatures()` / `disposeAllForUser()` |

### Luminary → Scripter

| Integration Point | Status | Notes |
|---|---|---|
| Script-triggered VFX | **Proposed** | New `TriggerVFXCommand` → bridge → `VFXSystemLike.trigger()` — see proposal below |
| Custom archetype registration | **Proposed** | New `RegisterVFXArchetypeCommand` — sandboxed `"user:"` namespace |
| VFX palette read access | **Proposed** | New `GetVFXPaletteCommand` — read-only snapshot via request/response |

### Luminary → Glitch

| Integration Point | Status | Notes |
|---|---|---|
| VFX preview mode | Planned | Glitch renders archetypes with mock palette data |
| Palette visualizer | Planned | Preview soul color / deity overlay combinations |
| Archetype editor preview | Planned | Live JSON editing → instant visual feedback |

### Luminary → Dungeon Master

| Integration Point | Status | Notes |
|---|---|---|
| Trap VFX archetypes | Planned | DM triggers standard archetypes for trap effects |
| Environment VFX | Planned | Ambient dungeon effects (fog, glow, decay) via primitives |
| Boss encounter sequences | Planned | Custom event sequences for boss phases |

---

## Open Questions

| # | Question | Raised By | Date | Status |
|---|----------|-----------|------|--------|
| 1 | ~~Should Scripter have write access to palette, or read-only?~~ | Scripter | 2026-03-08 | **Resolved** — Read-only. `GetVFXPaletteCommand` returns frozen snapshot. See Scripter proposal §2. |
| 2 | ~~Glitch preview: run full Babylon scene or lightweight canvas?~~ | Glitch | 2026-03-08 | **Resolved** — Full Babylon scene, 3 modes (`palette`, `archetype`, `preview`). See Glitch proposal. |
| 3 | ~~DM trap effects: use existing archetypes or define trap-specific ones?~~ | DM | 2026-03-08 | **Resolved** — Both. 8/9 map to existing archetypes. Only `gas_cloud` is new. See DM proposal §4. |
| 4 | ~~Boot order: how to guarantee VFXSystem init before consumers call it?~~ | — | 2026-03-08 | **Resolved** — GameEventBus subscription eliminates boot-order dependency |
| 5 | ~~Social VFX behavioral trigger cooldowns: what feels right?~~ | — | 2026-03-08 | **Resolved** — ADR-VFX-006 defaults (30s conversation, 60s friendship). SocialTriggerDetector implements. Tuning is iterative. |
| 6 | ~~Comms team: can local/say chat emit `'social:conversation'` events?~~ | World | 2026-03-08 | **Resolved** — Separate SocialTriggerDetector monitors CommsBus, emits social events. CommsBus stays transport. |
| 7 | ~~Building/Crafting teams: can completion events include quality metadata?~~ | World | 2026-03-08 | **Resolved** — Builder's ART attribute (0-100 → 0.0-1.0). VFX celebrates the act, not the object. |

---

## Decision Log

| # | Decision | Date | Rationale |
|---|----------|------|-----------|
| 1 | Luminary is a standalone micro-repo, not embedded in World | 2026-03-08 | Clean boundaries, independent versioning, testable without Babylon |
| 2 | Palette resolver has zero Babylon dependency | 2026-03-08 | Enables server-side use, unit testing, Scripter import |
| 3 | Archetypes are JSON-driven, not code | 2026-03-08 | New spells = data change, no cross-team coordination |
| 4 | ADR-VFX-001 is the authority document for module topology | 2026-03-08 | See docs/ADR-VFX-001-Akashic-VFX-Authority.md |
| 5 | Use GameEventBus over direct function calls | 2026-03-08 | Eliminates boot-order, no cross-team imports, matches CombatVFXManager pattern |
| 6 | Integrate with existing EffectsManager, don't duplicate | 2026-03-08 | World repo already has pooling, glow, post-processing — extend, don't rebuild |
| 7 | All four axes get equal VFX vocabulary | 2026-03-08 | ADR-VFX-006: Social/Creative effects driven by behavioral triggers, not buttons |
| 8 | ADR-VFX-002 Palette Contract formalized | 2026-03-09 | Full interface spec, derivation rules, cache lifecycle, diffPalettes() protocol, consumption rules |
| 9 | Scripter gets read-only palette access | 2026-03-09 | `GetVFXPaletteCommand` returns frozen snapshot. No write path from scripts. Per Allen's direction. |

---

## Blockers & Dependencies

| Blocker | Affects | Owner | Status |
|---------|---------|-------|--------|
| NodeMaterial asset pipeline not established | Primitive visual quality | Luminary | ADR-VFX-005 pending |
| ~~AkashicDataService fetch lifecycle confirmation~~ | ~~Palette integration~~ | ~~World team~~ | **Resolved** — `setEventBus()` method added, emits `'akashic:data-loaded'` |
| ~~ActionSlot config shape confirmation~~ | ~~Spell VFX wiring~~ | ~~Combat team~~ | **Resolved** — `vfxArchetype?: string` field added to interface |
| ~~AkashicDataService early palette emission~~ | ~~Palette init on first load~~ | ~~World team~~ | **Resolved** — `akashic:data-loaded` emitted in `main.ts` from progression data, before avatar spawn |
| ~~`combat:ability-fired` emission from ActionSystem~~ | ~~Combat spell VFX~~ | ~~World team~~ | **Resolved** — ActionSystem emits when `vfxArchetype` is set |
| Social/Creative event emission from game systems | ADR-VFX-006 behavioral triggers | Multiple teams | Pending — event types defined, emitters not built |

---

## World Team Integration Report — 2026-03-09

**From:** poqpoq World team
**Re:** ADR-VFX-001, ADR-VFX-006, VFX Research & Strategy

### What Was Done

All foundational integration hooks are in place. Build verified clean.

#### 1. GameEventBus — 24 New Event Types

Added to `src/events/GameEventBus.ts` (`GameEvents` interface):

| Category | Events | Count |
|----------|--------|:-----:|
| Akashic | `akashic:data-loaded`, `akashic:rank-up` | 2 |
| Combat archetype | `combat:ability-fired` | 1 |
| Social axis (ADR-VFX-006) | `social:conversation`, `social:group-formed`, `social:assist`, `social:event-participate`, `social:devotion`, `social:friendship`, `social:befriend`, `social:quest-together`, `social:shared-experience`, `social:kindness` | 10 |
| Creative axis (ADR-VFX-006) | `creative:craft-complete`, `creative:build-placed`, `creative:build-complete`, `creative:innovation`, `creative:seed-planted`, `creative:seed-matured`, `creative:donation`, `creative:collaborate` | 8 |

All payloads match the ADR-VFX-006 spec exactly. Typed via `GameEvents` interface — Luminary gets full type safety when subscribing.

#### 2. AkashicDataService — Emits `'akashic:data-loaded'`

- Added `setEventBus(events: GameEventBus)` method
- After successful `getAkashicData()` fetch, emits with: `{ userId, rank, dominantAxis }`
- `getDominantAxis()` helper computes which of the 4 axes (physical/mental/social/creative) has the highest attribute total
- **Wiring note:** AkashicDataService is instantiated in `AkashicPanel` (not `main.ts`). The panel needs to call `service.setEventBus(events)` when the GameEventBus is accessible. The bus is available via `window.bbWorldsApp.events`.

#### 3. AkashicRankManager — Emits `'akashic:rank-up'`

- Added `setEventBus(events: GameEventBus)` method
- Wired in `main.ts` line 1105: `this.akashicRankManager?.setEventBus(this.gameEvents)`
- On rank change, emits: `{ userId, oldRank, newRank, position }` (position from player avatar)
- This fires *after* the `onRankUp` callback (existing behavior preserved)

#### 4. ActionSlot — `vfxArchetype` Field

- Added `vfxArchetype?: string` to the `ActionSlot` interface
- Each ability implementation (BasicAttack, SwordSlash, SpellCast, etc.) can set this to its archetype ID
- `ActionSystem` should emit `'combat:ability-fired'` when executing a slot that has a `vfxArchetype` — **this wiring is not done yet** (see remaining work below)

### CombatVFXManager Pattern Review

CombatVFXManager (`src/combat/vfx/CombatVFXManager.ts`) is the established pattern Luminary should follow:

| Aspect | CombatVFXManager Pattern | Luminary Should... |
|--------|-------------------------|-------------------|
| **Init** | Constructor receives `(scene, camera, events)` | Same — receive scene + events, subscribe in constructor |
| **Event subscription** | `events.on('npc:damaged', ...)` with unsubscribe tracking | Same — track unsubscribers for dispose() |
| **Modal pause** | Checks `GameStateManager.canSimulate()` | Same — skip VFX when game is paused |
| **Subsystem delegation** | Delegates to CameraShake, FloatingText, ImpactParticles | Delegate to primitive pool, archetype parser |
| **Disposal** | `dispose()` unsubscribes all, disposes subsystems | Same — clean up pools, unsubscribe all |
| **Pooling** | ImpactParticles uses pool of 8 with `manualEmitCount` + round-robin | Adopt this pattern for all primitives |
| **Zero coupling** | Never imports combat logic, purely reactive | Same — Luminary never imports game logic |

**Key insight:** CombatVFXManager subscribes to `npc:damaged`, `player:damaged`, `npc:death` — all already in GameEventBus. Luminary subscribes to the new event types in the same way. No architectural changes needed. The `AkashicVFXSystem` is a peer of `CombatVFXManager`, not a replacement.

### Remaining Integration Work

| Item | Owner | Effort | Notes |
|------|-------|:------:|-------|
| Wire `combat:ability-fired` emission in ActionSystem | World | Low | Emit when `actionSlot.vfxArchetype` is set, pass position + target |
| Wire `AkashicDataService.setEventBus()` in AkashicPanel | World | Low | 1 line: `this.service.setEventBus(window.bbWorldsApp.events)` |
| Social event emitters (comms, party, quest systems) | World | Medium | Behavioral detection + cooldown logic per ADR-VFX-006 |
| Creative event emitters (building, crafting, seeds) | World | Medium | Per-system integration, mostly straightforward |
| EffectsManager glow layer access | World | Low | Add `getGlowLayer()` public method for Luminary |
| ParticleEffectSystem primitive registration | Luminary | Medium | Register palette-driven configs as named presets |

### Confirmed Architecture Agreements

1. **GameEventBus is the integration surface.** Luminary subscribes to events. No direct function calls from World → Luminary. ✅
2. **`vfxArchetype` is a config field, not computed at runtime.** Each ability declares its archetype statically. ✅
3. **Palette computation is Luminary's responsibility.** World emits `akashic:data-loaded` with raw data; Luminary resolves the palette. ✅
4. **Existing post-processing (bloom, glow) is shared.** Luminary should request the GlowLayer from EffectsManager, not create its own. ✅
5. **ImpactParticles pooling model is the reference.** Pool of N, `manualEmitCount` burst, round-robin. ✅

### Open Questions from World

| # | Question | Date |
|---|----------|------|
| 8 | Should Luminary's `AkashicVFXSystem` be initialized in `main.ts` alongside CombatVFXManager, or lazy-loaded? CombatVFXManager inits at line 1270 of main.ts after camera is ready. | 2026-03-09 |
| 9 | `social:conversation` detection: CommsBus (`src/comms/CommsBus.ts`) handles local/say messages. Should CommsBus emit the event directly, or should a separate SocialTriggerDetector monitor CommsBus traffic? ADR-VFX-006 suggests cooldown logic — that argues for a separate detector. | 2026-03-09 |
| 10 | `creative:build-placed` — BuildModeController can emit this immediately. Should `buildQuality` be derived from the builder's ART attribute, or from the object's metadata? | 2026-03-09 |

---

## Dungeon Master Integration Report — 2026-03-09

**From:** DM Team (`BlackBoxDungeonMaster`)
**Re:** VFX Research & Strategy Part 6, Archetype Catalog, Open Question #3

---

### 1. DM's VFX Surface Area

DM has **four VFX categories** with different lifetimes and palette requirements. We've mapped every DM content type against the existing archetype catalog.

---

### 2. Proposed Event Types

#### A. Trap Events — `dungeon:trap-triggered`

DM defines 9 trap effects (`TrapEffect` type) and 5 triggers (`TrapTrigger`). Each maps to existing or new archetypes:

| DM Trap Effect | Luminary Archetype | Notes |
|---|---|---|
| `spike` | `instant_strike` | Fast upward burst |
| `arrow` | `instant_strike` | Directional — needs `direction` in payload |
| `pit` | `ground_slam` | Ground collapse + dust |
| `poison_gas` | **NEW: `gas_cloud`** | Sustained expanding area — nothing in current catalog fits |
| `boulder` | `ground_slam` | Heavy impact + shockwave |
| `flame_jet` | `sustained_beam` | Directional beam, fire palette |
| `cage` | `shield_bubble` (inverted — closing) | Shrinking bubble |
| `alarm` | `heal_pulse` (reskinned) | Expanding alert ring |
| `magical_rune` | `long_cast` (culmination phase only) | Ground rune flash + detonation |

**Event payload:**
```typescript
interface DungeonTrapEvent {
    trapId: string
    effect: TrapEffect        // 'spike' | 'arrow' | 'pit' | 'poison_gas' | ...
    trigger: TrapTrigger      // 'pressure_plate' | 'tripwire' | 'proximity' | ...
    visibility: TrapVisibility // 'obvious' | 'hidden' | 'invisible'
    damage: number
    position: { x: number, y: number, z: number }
    cellRow: number
    cellCol: number
    direction?: number        // Radians — for arrow, flame_jet
    dungeonPalette: string    // Override palette ID
}
```

**New archetype request — `gas_cloud`:** Sustained area effect that expands, lingers, then dissipates. Phases: `emit` (0.3s) → `spread` (1.5s, loopable) → `dissipate` (2.0s). Primitives: `smoke_wisp` (dense, colored) + `healing_motes` inverted (toxic particles drifting upward). DM will draft the archetype JSON if Luminary approves the concept.

#### B. Environment Events — `dungeon:env-start` / `dungeon:env-stop`

**Persistent ambient effects** tied to cell type and theme. Start when cell enters view, stop when it exits.

| Cell Type / Theme | Primitives | Notes |
|---|---|---|
| `lava_cell` / `volcanic` | `smoke_wisp` + ember `particle_burst` | Hot orange palette |
| `water_pool` / `underground_stream` | `healing_motes` (blue, slow) | Gentle upward drift |
| `ice_cave` / `frozen` | `particle_burst` (crystalline, slow) | Sparse, glittering |
| `crystal_cave` / `crystal` | `electric_arc` (low intensity) + glow | Ambient shimmer |
| `mushroom_grotto` | `healing_motes` (green) + `smoke_wisp` | Spore clouds |
| `shadow` theme | `smoke_wisp` (dark, low opacity) | Creeping fog |
| `overgrown` theme | `healing_motes` (green, sparse) | Floating pollen |
| Magical barriers (props) | `aura_shell` + `hex_rune` | Ward effects |

```typescript
interface DungeonEnvStartEvent {
    cellRow: number
    cellCol: number
    cellType: CellType        // 44 DM cell types
    theme: CellTheme          // 8 DM themes
    position: { x: number, y: number, z: number }
    radius: number            // Octagon=6.4m, connector=1.8m
    dungeonPalette: string
}

interface DungeonEnvStopEvent {
    cellRow: number
    cellCol: number
}
```

**Critical requirement:** Environment VFX **must use GPU particles**. DM dungeons can have 30-100 active cells with ambient effects visible simultaneously. CPU particle budget would be obliterated. This aligns with the strategy doc recommendation (GPU for persistent, CPU for bursts).

#### C. Boss Encounter Events — `dungeon:boss-phase`

Sequenced event chains driven by combat state, not timers.

| Boss Phase | Archetype Sequence |
|---|---|
| Spawn / reveal | `long_cast` (windup → culmination) + camera shake |
| Phase transition (HP threshold) | `aoe_blast` + `shield_bubble` form |
| Enrage | `aura_shell` (pulsing) + `electric_arc` (intensifying) |
| Death | `aoe_blast` (large) → `heal_pulse` (reward burst) |

```typescript
interface DungeonBossPhaseEvent {
    bossId: string
    phase: 'spawn' | 'transition' | 'enrage' | 'death'
    phaseIndex: number        // Multi-transition bosses
    position: { x: number, y: number, z: number }
    intensity: number         // 0-1, scales magnitude
    dungeonPalette: string
}
```

Boss sequences should be **data-driven JSON** alongside spell archetypes — a `BossVFXSequence` schema mapping phases to archetype chains.

#### D. Discovery Events — `dungeon:discovery`

One-shot celebration effects for exploration milestones.

| Discovery | VFX |
|---|---|
| Secret door revealed | `impact_flash` + `hex_rune` (fading in) |
| Treasure found | `healing_motes` (gold) + `impact_flash` (scaled by `LootRarity`) |
| Puzzle solved | `ground_ring` (expanding) + `particle_burst` (upward) |

```typescript
interface DungeonDiscoveryEvent {
    type: 'secret_revealed' | 'treasure_found' | 'puzzle_solved'
    position: { x: number, y: number, z: number }
    rarity?: LootRarity       // Scales treasure effect intensity
    dungeonPalette: string
}
```

---

### 3. Dungeon Palette System

DM effects must **NOT** use the player's Akashic palette. Traps reflect the dungeon's identity, not the player's soul.

**Requirement:** `castWithPalette(archetypeId, overridePalette, position)` variant per the strategy doc.

DM palettes are derived from **dungeon theme** × **difficulty tier**:

| Theme | Soul Color | Particle Style | Noise Scale | Emissive |
|---|---|---|---|---|
| `natural_cave` | `#4a6741` moss | `organic` | 0.8 | 0.3 |
| `ancient_stone` | `#7a7065` warm grey | `ember` | 0.4 | 0.2 |
| `crystal` | `#6a8fb5` ice blue | `crystalline` | 0.3 | 0.8 |
| `organic` | `#5a7a4a` deep green | `organic` | 1.2 | 0.4 |
| `frozen` | `#8ab4d6` frost blue | `crystalline` | 0.2 | 0.6 |
| `volcanic` | `#b54a2a` magma red | `ember` | 1.0 | 0.9 |
| `overgrown` | `#3a8a3a` vine green | `feathered` | 0.9 | 0.3 |
| `shadow` | `#2a1a3a` deep purple | `geometric` | 0.6 | 0.1 |

Higher difficulty tiers intensify: more particles, higher emissive, faster noise. Palette structure matches `VFXPalette` — no special-casing needed in Luminary.

---

### 4. Answer to Open Question #3

**Q3: DM trap effects — use existing archetypes or define trap-specific ones?**

**Answer: Both.** 8 of 9 trap effects map cleanly to existing archetypes (see table in Section 2A). Only `poison_gas` needs a new `gas_cloud` archetype — nothing in the current catalog handles a sustained expanding area cloud that lingers. DM will draft the JSON.

---

### 5. Integration Sequence

| Phase | DM Action | Luminary Dependency |
|---|---|---|
| 1. Contracts | Add event types to DM type system | Agree on payloads above |
| 2. Trap VFX | Emit `dungeon:trap-triggered` | `castWithPalette()` API |
| 3. Environment | Emit `dungeon:env-start/stop` | GPU particle path for persistent effects |
| 4. Boss + Discovery | Emit phase/discovery events | `BossVFXSequence` schema, `gas_cloud` archetype |

---

### 6. Technical Constraints

- **Discrete grid positions.** DM converts octile grid coords → world coords before emitting. All positions are cell centroids.
- **Up to 100 simultaneous environment VFX.** GPU particles mandatory for this layer.
- **Connector corridors are small** (3.6m diamonds vs 12.8m octagons). The `radius` field in env events lets Luminary scale effects appropriately.
- **DM runs in an iframe** when hosted by World. Events must cross the iframe boundary via `postMessage`. **Question for World + Luminary:** Does GameEventBus work cross-iframe, or does DM need to emit via `postMessage` with World relaying to the bus?

---

### 7. New Tracker Items

| # | Item | Owner | Status |
|---|---|---|---|
| 11 | `gas_cloud` archetype for poison traps | DM drafts, Luminary reviews | Open |
| 12 | `castWithPalette()` API — palette override for non-player effects | Luminary | Open |
| 13 | GameEventBus cross-iframe relay (DM→World→Luminary) | World + Luminary | Open |
| 14 | GPU particle path for persistent environment effects (30-100 simultaneous) | Luminary | Open |
| 15 | `BossVFXSequence` JSON schema — phase→archetype chain mapping | DM + Luminary joint | Open |

---

*DM Team · BlackBoxDungeonMaster · Luminary Integration Report · 2026-03-09*

---

## DM Team Follow-Up — Tracker #11 & #15 Drafts

**Date:** 2026-03-09
**Author:** DM Team (Claude Opus 4.6)
**Re:** Tracker #11 (`gas_cloud` archetype), Tracker #15 (`BossVFXSequence` schema)

---

### Tracker #11 — `gas_cloud` Archetype JSON (Draft for Luminary Review)

Sustained expanding area effect for `poison_gas` traps. Nothing in the current 8-archetype catalog handles a cloud that emits, spreads, lingers, then dissipates. Follows the same phase/effects/primitive pattern as existing archetypes.

```json
{
  "id": "gas_cloud",
  "phases": {
    "emit": {
      "duration": 0.3,
      "effects": [
        { "primitive": "smoke_wisp",    "count": 6, "opacity": [0, 0.7], "speed": 1.5 },
        { "primitive": "impact_flash",  "spread": 0.4, "intensity": 0.3 }
      ]
    },
    "spread": {
      "duration": 1.5,
      "effects": [
        { "primitive": "smoke_wisp",    "count": 15, "opacity": 0.6, "speed": 0.8 },
        { "primitive": "healing_motes", "count": 8, "speed": 0.3, "opacity": [0.5, 0.2] }
      ]
    },
    "linger": {
      "duration": 99,
      "effects": [
        { "primitive": "smoke_wisp",    "count": 10, "opacity": [0.5, 0.4], "speed": 0.2 },
        { "primitive": "healing_motes", "count": 4, "speed": 0.15, "opacity": 0.3 }
      ]
    },
    "dissipate": {
      "duration": 2.0,
      "effects": [
        { "primitive": "smoke_wisp",    "count": 10, "opacity": [0.4, 0], "speed": 0.5 }
      ]
    }
  },
  "loopPhase": "linger"
}
```

**Design notes:**
- `emit` → initial burst from trap trigger point (0.3s, matches `instant_strike` impact speed)
- `spread` → cloud expands to full radius (~2m for connectors, ~6m for octagons)
- `linger` → loopable hold phase (like `sustained_beam.hold`) — duration controlled by trap config
- `dissipate` → slow 2s fade-out so players see the cloud receding
- Uses `healing_motes` with low opacity as "toxic particles drifting upward" — Luminary can substitute a dedicated `toxic_mote` primitive if preferred
- Palette-colorable: poison = sickly green, but `dungeon_palette` override could make it volcanic sulfur (yellow), shadow miasma (purple), etc.

**Questions for Luminary:**
1. Is `healing_motes` acceptable as the upward-drifting particle, or should we define a new `toxic_mote` primitive?
2. Should `spread` radius be a parameter in the archetype JSON, or handled at the casting layer via `castWithPalette()` options?

---

### Tracker #15 — `BossVFXSequence` JSON Schema (DM's Draft)

Boss encounters are multi-phase fights where each phase transition triggers a VFX sequence. This schema maps boss phases to archetype chains, letting designers author boss VFX as data rather than code.

```typescript
/** BossVFXSequence — data-driven boss encounter VFX */

interface BossVFXPhase {
  /** Phase name matching DM boss config (e.g., "enrage", "summon", "death") */
  phase: string
  /** Ordered list of VFX to play when this phase activates */
  sequence: BossVFXStep[]
  /** Optional ambient VFX that loops for the phase's duration */
  ambient?: AmbientVFXLayer[]
}

interface BossVFXStep {
  /** Archetype ID from spell_archetypes.json (or 'gas_cloud') */
  archetype: string
  /** Delay in seconds before this step starts (relative to phase start) */
  delay: number
  /** Palette overrides for this specific step */
  palette?: Partial<VFXPaletteSnapshot>
  /** Where to play: 'boss', 'arena_center', 'all_players', 'random_cell' */
  target: 'boss' | 'arena_center' | 'all_players' | 'random_cell'
  /** Optional scale multiplier (bosses hit bigger) */
  scale?: number
}

interface AmbientVFXLayer {
  /** Primitive ID from Luminary's catalog */
  primitive: string
  /** Primitive-specific parameters */
  params: Record<string, number | number[]>
}

interface BossVFXSequence {
  /** Boss type ID matching DM's SpawnConfig.enemyType */
  bossType: string
  /** Phase definitions — order matters for phase transitions */
  phases: BossVFXPhase[]
  /** Death sequence — always plays when boss HP reaches 0 */
  deathSequence: BossVFXStep[]
}
```

**Example — Skeleton King boss:**

```json
{
  "bossType": "skeleton_king",
  "phases": [
    {
      "phase": "entrance",
      "sequence": [
        { "archetype": "ground_slam", "delay": 0, "target": "boss", "scale": 2.0 },
        { "archetype": "aoe_blast",   "delay": 0.7, "target": "arena_center", "scale": 1.5 }
      ],
      "ambient": [
        { "primitive": "electric_arc", "params": { "intensity": 0.3, "count": 3 } }
      ]
    },
    {
      "phase": "enrage",
      "sequence": [
        { "archetype": "long_cast",    "delay": 0, "target": "boss", "scale": 1.8,
          "palette": { "soulColor": [1.0, 0.2, 0.2] } },
        { "archetype": "shockwave",    "delay": 3.0, "target": "arena_center", "scale": 3.0 }
      ],
      "ambient": [
        { "primitive": "ground_ring",  "params": { "scale": [1.0, 3.0], "speed": 0.5, "opacity": [0.4, 0.2] } },
        { "primitive": "smoke_wisp",   "params": { "count": 6, "opacity": 0.3 } }
      ]
    },
    {
      "phase": "summon",
      "sequence": [
        { "archetype": "long_cast",    "delay": 0, "target": "boss" },
        { "archetype": "heal_pulse",   "delay": 2.5, "target": "random_cell", "scale": 0.8 },
        { "archetype": "heal_pulse",   "delay": 2.8, "target": "random_cell", "scale": 0.8 },
        { "archetype": "heal_pulse",   "delay": 3.1, "target": "random_cell", "scale": 0.8 }
      ]
    }
  ],
  "deathSequence": [
    { "archetype": "long_cast",    "delay": 0, "target": "boss", "scale": 2.5,
      "palette": { "soulColor": [0.8, 0.0, 0.0] } },
    { "archetype": "aoe_blast",    "delay": 3.5, "target": "boss", "scale": 4.0 },
    { "archetype": "ground_slam",  "delay": 3.8, "target": "arena_center", "scale": 3.0 }
  ]
}
```

**Design notes:**
- `delay` is relative to phase start, not previous step — allows overlapping effects
- `target` uses DM spatial concepts (boss position, arena center, player positions, random occupied cell)
- `scale` lets boss VFX be proportionally larger than standard combat effects
- `palette` override per-step allows phase-specific color shifts (e.g., enrage = red tint)
- `ambient` layers loop for the phase duration, creating atmosphere between scripted hits
- `deathSequence` is separate because it's universal — always plays regardless of which phase the boss was in
- Schema references archetype IDs directly — Luminary resolves the phases/primitives from its catalog

**Questions for Luminary:**
1. Should `BossVFXSequence` live alongside `spell_archetypes.json` or in a separate `boss_sequences/` directory?
2. Does the `target` field need a `Vec3Like` override for exact positioning, or is the named-target approach sufficient?
3. Should `ambient` support archetype IDs too (not just raw primitives)?

---

**Tracker Status Update:**

| # | Item | Status |
|---|---|---|
| 11 | `gas_cloud` archetype | **Draft submitted** — awaiting Luminary review |
| 15 | `BossVFXSequence` schema | **Draft submitted** — awaiting Luminary review |

---

*DM Team · BlackBoxDungeonMaster · Tracker #11 & #15 Drafts · 2026-03-09*

## Glitch Team Review — Preview Architecture Proposal

**Date:** 2026-03-09
**Author:** Glitch Team (Claude Opus 4.6)
**Re:** Open Question #2, Luminary→Glitch integration, DM cross-iframe question (#13)

---

### Answer to Open Question #2

> Glitch preview: run full Babylon scene or lightweight canvas?

**Full Babylon scene.** Glitch runs Babylon.js v8.52 with WebGL2/WebGPU, Havok physics, particle systems (procedural textures, size gradients, noise), GlowLayer, and VideoTexture. Luminary VFX *are* Babylon constructs. A lightweight renderer would reimplement all of these. Use what's running.

---

### Architecture: Three Modes via `glitchType: 'luminary'`

```typescript
interface LuminaryPayload {
  mode: 'palette' | 'archetype' | 'preview';

  // palette — interactive attribute sliders → live VFXPalette
  attributes?: Partial<AkashicAttributes>;
  deity?: string;
  rank?: number;

  // archetype — JSON editor with live phase sequencing
  archetype?: SpellArchetype;

  // preview — render archetype with explicit palette
  archetypeId?: SpellArchetypeId;
  palette?: VFXPalette;
}
```

### Import Strategy — Zero IPC

`AkashicPaletteResolver.ts` and `AkashicVFXTypes.ts` have **zero Babylon dependency**. Glitch imports them directly as pure TypeScript — no postMessage, no serialization:

```
luminary/src/shared/AkashicVFXTypes.ts        → types
luminary/src/shared/AkashicPaletteResolver.ts  → resolveAkashicPalette()
```

Palette resolution runs **in-process**. Slider drag → `resolveAkashicPalette()` → update scene. Sub-millisecond.

**Hard requirement:** These files must stay zero-dependency. Recommend lint rule or `@poqpoq/akashic-types` shared package.

---

### Mode 1: Palette Visualizer

```
12 attribute sliders + deity picker + rank slider
  ↓ oninput
resolveAkashicPalette(mockAkashicData)
  ↓ VFXPalette
Scene:
  - Central sphere: PBR emissiveColor = soulColor * emissiveBoost
  - Orbiting accent sphere: accentColor
  - Particle system: style-appropriate (ember/crystalline/feathered/geometric/organic/void)
  - NoiseProceduralTexture: noiseStrength = noiseScale
  - GlowLayer intensity ← emissiveBoost
  - 3 strength signatures at attach points
  - Deity overlay primitive when active
```

### Mode 2: Archetype Editor

```
JSON editor (textarea or Monaco)
  ↓ parse + validate against schema
SpellArchetype
  ↓
Phase sequencer:
  - Each phase → ParticleSystemSet from effects[]
  - Timer or scrubber for phase navigation
  - Loop phase auto-restarts
Target prim in scene center
```

### Mode 3: VFX Preview

Full pipeline: palette + archetype → complete visual on mannequin or target prim. Embeddable by any team via `<iframe src="poqpoq.com/glitch/">` + `glitch_spawn`.

---

### Primitive Renderer — `LuminaryPrimitiveRenderer.ts`

New Glitch module mapping primitive IDs to Babylon.js. All configure from `VFXPalette`:

| Primitive ID | Babylon.js Construct | Key Palette Inputs |
|---|---|---|
| `particle_burst` | ParticleSystem, EXPLODE | soulColor, emissiveBoost, particleDensity |
| `healing_motes` | ParticleSystem, slow upward drift | soulColor, noiseScale |
| `electric_arc` | Ribbon mesh or line system | accentColor, noiseScale |
| `smoke_wisp` | ParticleSystem, low power, high noise | soulColor dimmed, noiseScale |
| `hex_rune` | Plane mesh with SDF shader | deityOverlay.color, emissiveBoost |
| `aura_shell` | Sphere mesh, alpha 0.15, emissive | soulColor, emissiveBoost |
| `ribbon_trail` | TrailMesh on moving emitter | deityOverlay.color |
| `impact_flash` | ParticleSystem, manualEmitCount burst | soulColor bright |
| `ground_ring` | Torus mesh, emissive + glow | accentColor |
| `shockwave` | Expanding disc mesh, alpha fade | soulColor |

Follows ImpactParticles pooling pattern: pre-create pool per type, configure from palette on acquire, release on complete.

---

### What Glitch Needs from Luminary

1. **Stable type contracts** — `AkashicVFXTypes.ts` + `AkashicPaletteResolver.ts` versioned on change.
2. **Archetype JSON schema** — Zod or JSON Schema for `SpellArchetype` for real-time validation.
3. **Primitive catalog confirmation** — Table above is our best reading. Please confirm definitive list.
4. **Sample archetypes** — 3-4 complete JSON files (`charge_spell`, `heal_pulse`, `aoe_blast`) for testing.

### What Luminary Gets from Glitch

1. **Embeddable preview** — iframe + `glitch_spawn` = instant VFX preview in any tool.
2. **Archetype validation** — Editor catches malformed JSON before World.
3. **Design exploration** — Full attribute→visual space without a game account.
4. **DM preview** — Dungeon palette effects previewable through the same embed.

---

### Implementation Plan (Glitch Side)

| Phase | Work | Depends On |
|---|---|---|
| **L1** | Add `'luminary'` to GlitchType, extend payload parser | Nothing |
| **L2** | Import resolver + types, build palette visualizer | Stable resolver files |
| **L3** | `LuminaryPrimitiveRenderer.ts` — 10 primitives with pooling | Primitive catalog confirmation |
| **L4** | Archetype editor (JSON + phase sequencer) | Schema + sample files |
| **L5** | Preview mode (palette + archetype → full render) | L2 + L3 + L4 |

**L1 and L2 can start immediately.**

---

### Response to World Team Questions

**Q8 (Init location):** Lazy-load. AkashicVFXSystem should init on first VFX event, not at boot. Glitch handles optional subsystems this way — NPC manager, physics, sensors all init on demand. GameEventBus subscription is order-independent.

**Q9 (social:conversation detection):** Separate `SocialTriggerDetector`. CommsBus is transport, not behavioral analysis. Detector subscribes to traffic, applies cooldowns, emits social events. Clean separation.

**Q10 (build quality source):** Builder's ART attribute. VFX celebrates the *act*, not the object. A high-ART builder placing a simple cube should still get satisfying creative VFX. Palette resolver already maps ART → creative axis.

### Response to DM Team Question

**Q13 (GameEventBus cross-iframe):** GameEventBus does **not** work cross-iframe — it's an in-process pub/sub. DM in an iframe must `postMessage` to the parent (World), which relays to GameEventBus. This is the same pattern Glitch uses: Scripter runs in an iframe, sends commands via `postMessage`, Glitch's `PostMessageBridge` dispatches them locally.

**Proposed relay pattern:**
```
DM iframe → postMessage('dungeon:trap-triggered', payload)
  → World parent listener → gameEventBus.emit('dungeon:trap-triggered', payload)
    → Luminary subscriber reacts
```

World needs a thin relay in its iframe host code. 10-15 lines. DM should define its event payloads as the contract (which they've done above — looks clean).

---

### Updated Integration Table

| Integration Point | Status | Notes |
|---|---|---|
| VFX preview mode | **Proposed** | `glitchType: 'luminary'`, `mode: 'preview'` |
| Palette visualizer | **Proposed** | `mode: 'palette'` — 12 sliders + deity picker |
| Archetype editor | **Proposed** | `mode: 'archetype'` — JSON + phase sequencer |
| Resolver import | **Ready** | Zero-dep resolver importable today |
| DM palette preview | **Proposed** | Same embed, DM sends dungeon palette override |

### Open Question #2 — Proposed Resolution

Full Babylon scene via existing Glitch infrastructure. `resolveAkashicPalette()` in-process. `glitchType: 'luminary'` with three modes. L1/L2 ready to start.

---

## Scripter Integration Proposal — 2026-03-09

**From:** Scripter team (Claude Opus 4.6)
**Re:** Script-triggered VFX, palette read access, runtime archetype registration

---

### Background: How Scripter's Command Protocol Works

Scripter uses a typed **command protocol** — scripts running inside the SES sandbox don't call engine APIs directly. World API calls produce typed `ScriptCommand` objects routed through a `CommandRouter` to the host engine. This is the same pipeline handling particles (`SetParticlesCommand`), physics (`ApplyForceCommand`), NPC operations, etc. — **90+ command types** across 7 files.

The integration adds **3 new commands** and **1 new engine interface**. No architectural changes — pure protocol extension following established patterns.

---

### 1. Script-Triggered VFX: `TriggerVFXCommand`

**How scripts call it:**
```typescript
// User script (runs inside SES sandbox)
export default class FireTrap extends WorldScript {
  touch_start() {
    this.world.vfx.trigger("aoe_blast", {
      position: this.object.getPosition(),
      target: this.object.getPosition().add({ x: 0, y: 2, z: 0 }),
      palette: "caster",  // "caster" | "target" | explicit userId
    });
  }
}
```

**Command definition** (added to `script-command.ts`):
```typescript
export interface TriggerVFXCommand {
  readonly type: "triggerVFX";
  readonly objectId: string;          // source object (containerId)
  readonly archetypeId: string;       // Luminary archetype ID
  readonly position: Vec3;            // world position
  readonly target?: Vec3;             // optional target position
  readonly paletteSource?: string;    // "caster" (default) | "target" | userId
  readonly params?: Record<string, unknown>;  // archetype-specific overrides
}
```

**Router mapping** (added to `command-router.ts`):
```typescript
case "world.vfx.trigger":
  return {
    type: "triggerVFX",
    objectId: containerId,
    archetypeId: args[0] as string,
    position: (args[1] as Record<string, unknown>)?.position as Vec3,
    target: (args[1] as Record<string, unknown>)?.target as Vec3 | undefined,
    paletteSource: (args[1] as Record<string, unknown>)?.palette as string ?? "caster",
    params: (args[1] as Record<string, unknown>)?.params as Record<string, unknown>,
  };
```

**Bridge handler** (added to `reference-bridge.ts`):
```typescript
case "triggerVFX":
  return this.systems.vfx?.trigger(cmd.archetypeId, cmd.objectId, {
    position: cmd.position,
    target: cmd.target,
    paletteSource: cmd.paletteSource,
    params: cmd.params,
  });
```

**Engine-side — two equivalent paths (Luminary chooses):**

*Option A — Direct bridge call:* Luminary implements `VFXSystemLike` interface, bridge calls `.trigger()` directly. Clean, typed, synchronous.

*Option B — GameEventBus:* Bridge emits `'script:vfx-trigger'` to GameEventBus, Luminary subscribes. Matches Decision #5 (event bus over direct calls). Decoupled, but loses type safety at the event boundary.

**Recommendation:** Option A for script-triggered VFX (bridge already has the typed interface), Option B for engine-originated events (combat, rank-up, etc.). Both paths coexist — Luminary subscribes to GameEventBus for World events and implements `VFXSystemLike` for Scripter's typed calls.

**Preview path (Glitch):** `PreviewRelay` forwards `TriggerVFXCommand` to the Glitch iframe via postMessage (same as all 90+ existing commands). Glitch can render a simplified particle burst or log to preview console. Per the Glitch team's L1 mode proposal above, `GlitchScriptBridge` would handle `triggerVFX` commands in the same `switch` as `setParticles`, `playSound`, etc.

---

### 2. Read-Only Palette Access: `GetVFXPaletteCommand`

**How scripts call it:**
```typescript
// Async — uses Scripter's request/response correlation (callId)
const palette = await this.world.vfx.getPalette("caster");
if (palette.dominantAxis === "physical") {
  this.world.say(0, "You feel the heat of the trap!");
  this.world.vfx.trigger("fire_burst", { position: this.object.getPosition() });
} else {
  this.world.say(0, "The magical ward deflects the trap!");
}
```

**Command definition:**
```typescript
export interface GetVFXPaletteCommand {
  readonly type: "getVFXPalette";
  readonly objectId: string;
  readonly targetUserId?: string;  // omit = object owner
}
```

**Response** (returned via callId correlation):
```typescript
interface VFXPaletteSnapshot {
  soulColor: { r: number; g: number; b: number };
  dominantAxis: "physical" | "cunning" | "magical" | "social";
  particleStyle: "ember" | "crystalline" | "feathered" | "organic";
  noiseScale: number;
  emissiveBoost: number;
  deityId?: string;
}
```

**Read-only by design** — returns a frozen snapshot. No write path. The palette resolver has zero Babylon dependency (Decision #2), so it runs in the bridge with no extra imports.

**Resolves Open Question #1:** Read-only confirmed.

---

### 3. Runtime Archetype Registration: `RegisterVFXArchetypeCommand`

**How scripts call it:**
```typescript
this.world.vfx.registerArchetype("user:sparkle_heal", {
  phases: [
    {
      name: "burst",
      duration: 0.5,
      primitives: [
        { type: "healing_motes", count: 30, speed: 2.0 },
        { type: "ground_ring", radius: 1.5 }
      ]
    }
  ],
  blend: "additive"
});

// Then trigger it like any built-in archetype
this.world.vfx.trigger("user:sparkle_heal", { position: pos });
```

**Command definition:**
```typescript
export interface RegisterVFXArchetypeCommand {
  readonly type: "registerVFXArchetype";
  readonly objectId: string;
  readonly archetypeId: string;                // must start with "user:"
  readonly definition: Record<string, unknown>; // archetype JSON
}
```

**Namespacing:** Scripter enforces the `"user:"` prefix in the command router — system archetypes (`charge_spell`, `aoe_blast`, etc.) cannot be overwritten from scripts. Luminary stores user archetypes in a separate registry.

**Sandbox safety:** The definition is plain JSON (no functions, no code). It crosses Scripter's SES boundary as a structured-cloneable object — same as particle configs today.

---

### 4. Engine Interface: `VFXSystemLike`

**Added to `engine-types.ts`** (structural typing — zero import dependency):
```typescript
export interface VFXSystemLike {
  trigger(archetypeId: string, objectId: string, options: {
    position: Vec3;
    target?: Vec3;
    paletteSource?: string;
    params?: Record<string, unknown>;
  }): void;

  getPalette(objectId: string, targetUserId?: string): VFXPaletteSnapshot | null;

  registerArchetype(archetypeId: string, definition: Record<string, unknown>): boolean;
}
```

**Added to `HostSystems`:**
```typescript
export interface HostSystems {
  // ... existing 13 systems ...
  vfx?: VFXSystemLike;
}
```

Luminary implements `VFXSystemLike` — the bridge calls methods on the interface; Luminary provides the implementation at runtime. Same pattern as `ParticleSystemLike`, `AudioEngineLike`, `NPCManagerLike`, etc.

---

### 5. End-to-End Flow

```
Script (SES sandbox)
  │  this.world.vfx.trigger("charge_spell", { position, target })
  ▼
Worker postMessage → ScriptManager.apiResolver()
  ▼
CommandRouter.methodToCommand("world.vfx.trigger", args)
  │  → { type: "triggerVFX", archetypeId: "charge_spell", ... }
  ▼
ScriptCommandEnvelope { scriptId, containerId, callId, command }
  │
  ├── Production ──→ ReferenceBridge → systems.vfx.trigger()
  │                                      → AkashicVFXSystem (Luminary)
  │
  └── Preview ─────→ PreviewRelay → postMessage → Glitch iframe
                                      → GlitchScriptBridge (L1 mode)
```

---

### 6. Relationship to DM's `castWithPalette()` Request

DM's proposal (above) requests a `castWithPalette(archetypeId, overridePalette, position)` API for dungeon-themed effects. Scripter's `TriggerVFXCommand` already supports this via the `paletteSource` field:

- `"caster"` → player's Akashic palette (default)
- `"target"` → target's Akashic palette
- Any other string → treated as a palette ID (e.g., `"dungeon:volcanic"`)

DM can emit `dungeon:trap-triggered` events with a `dungeonPalette` field. If DM also triggers VFX via Scripter (scripts on trap objects), the same `paletteSource` field carries the override. No separate API needed — one mechanism covers both player-palette and dungeon-palette cases.

---

### 7. Files Modified in Scripter (Estimated)

| File | Change | ~Lines |
|------|--------|--------|
| `src/integration/protocol/script-command.ts` | 3 command interfaces + union entries | 30 |
| `src/integration/host/command-router.ts` | 3 router cases (`world.vfx.*`) | 25 |
| `src/integration/bridge/engine-types.ts` | `VFXSystemLike` + `vfx` in `HostSystems` | 15 |
| `src/integration/bridge/reference-bridge.ts` | 3 dispatch cases | 15 |
| `src/types/world-object.ts` | `vfx` namespace on World API types | 10 |
| `src/api/world-api.ts` | Expose `world.vfx` methods in sandbox API | 15 |
| Tests (router, bridge, integration) | New test cases for all 3 commands | 60 |

**Total: ~170 lines across 7 files. Zero architectural changes.**

---

### 8. Open Questions from Scripter

| # | Question | Date |
|---|----------|------|
| 16 | Should `TriggerVFXCommand` support a `duration` override, or is duration always defined by the archetype? Scripts might want "play this effect for 3 seconds" without registering a custom archetype. | 2026-03-09 |
| 17 | For `getPalette()` in preview mode (Glitch), should we return a mock palette or null? A mock palette lets scripts test conditional VFX logic in the editor. | 2026-03-09 |
| 18 | Should `registerArchetype` be persistent (survives script restart) or ephemeral (cleared when script stops)? Ephemeral is simpler and safer. | 2026-03-09 |

---

*Scripter Team · BlackBoxScripter · Luminary Integration Proposal · 2026-03-09*

---

## Luminary Response — Primitive Catalog, Archetype Schema & Open Answers

**Date:** 2026-03-09
**From:** Luminary team
**Re:** Glitch asks (primitive catalog, archetype schema), Scripter open questions (#16-18), World open questions (#8-10)

---

### 1. Definitive Primitive Catalog (v1.0)

12 primitives. This is the confirmed list. Glitch should implement all 12.

| # | Primitive ID | Babylon.js Construct | Category | Key Palette Inputs |
|---|---|---|---|---|
| 1 | `energy_orb` | ParticleSystem, radial emit | Spell core | soulColor, accentColor, particleDensity |
| 2 | `impact_flash` | ParticleSystem, burst (manualEmitCount pattern) | Hit/confirm | soulColor (brightened) |
| 3 | `particle_burst` | ParticleSystem, directional explode | Celebration/impact | soulColor, accentColor, particleDensity |
| 4 | `ground_ring` | Torus mesh, expanding + fading | Area marker | soulColor, emissiveBoost |
| 5 | `healing_motes` | ParticleSystem, slow upward drift | Healing/social/ambient | resourceType → blue/green, noiseScale |
| 6 | `electric_arc` | ParticleSystem, short-lived directional sparks | Lightning/energy | accentColor, noiseScale |
| 7 | `hex_rune` | Disc mesh (tessellation=6), wireframe, rotating | Deity/magic/rune | soulColor, accentColor, emissiveBoost |
| 8 | `aura_shell` | Sphere mesh, alpha 0.15-0.3, emissive, breathe pulse | Shield/aura/rank-up | soulColor, emissiveBoost |
| 9 | `smoke_wisp` | ParticleSystem, low power, upward float | Aftermath/shadow | soulColor (dimmed 40%), noiseScale |
| 10 | `shockwave` | Torus mesh, fast-expanding, alpha fade | Impact ring | accentColor, soulColor, emissiveBoost |
| 11 | `ribbon_trail` | ParticleSystem (ribbon sim — true TrailMesh in v2) | Movement/deity | soulColor, accentColor |
| 12 | `beam_ray` | Cylinder mesh, emissive, pulse alpha | Sustained beam | soulColor, emissiveBoost |

**Future primitives** (DM `gas_cloud` request, potential `connection_ribbon` for social): Will be added via the same factory pattern. The catalog is extensible — new entry in the `PRIMITIVES` record + reference by string ID in archetype JSON.

**Pooling model:** Each primitive type should maintain a pool following the ImpactParticles pattern (pool of 8, `manualEmitCount` for bursts, `performance.now()` timestamp for busy tracking, round-robin fallback). Glitch can start with create/dispose and retrofit pooling in L3.

---

### 2. Archetype JSON Schema

Formal schema for `SpellArchetype`. Glitch should validate against this in the archetype editor (Mode 2).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SpellArchetype",
  "type": "object",
  "required": ["id", "phases"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique archetype identifier. System archetypes are lowercase_snake. User archetypes must use 'user:' prefix.",
      "pattern": "^[a-z][a-z0-9_]*$|^user:[a-zA-Z0-9_]+$"
    },
    "phases": {
      "type": "object",
      "description": "Named phases executed in declaration order.",
      "additionalProperties": {
        "$ref": "#/$defs/EffectPhase"
      },
      "minProperties": 1
    },
    "loopPhase": {
      "type": "string",
      "description": "Which phase loops (e.g. 'hold' for sustained beam). Must match a key in phases."
    }
  },
  "$defs": {
    "EffectPhase": {
      "type": "object",
      "required": ["duration", "effects"],
      "properties": {
        "duration": {
          "type": "number",
          "description": "Phase duration in seconds. Use 99 for phases controlled by external stop signal.",
          "minimum": 0.01
        },
        "effects": {
          "type": "array",
          "items": { "$ref": "#/$defs/EffectPhaseEntry" },
          "minItems": 1
        }
      }
    },
    "EffectPhaseEntry": {
      "type": "object",
      "required": ["primitive"],
      "properties": {
        "primitive": {
          "type": "string",
          "description": "Primitive ID from the catalog.",
          "enum": [
            "energy_orb", "impact_flash", "particle_burst", "ground_ring",
            "healing_motes", "electric_arc", "hex_rune", "aura_shell",
            "smoke_wisp", "shockwave", "ribbon_trail", "beam_ray"
          ]
        },
        "scale":     { "$ref": "#/$defs/AnimatableParam" },
        "opacity":   { "$ref": "#/$defs/AnimatableParam" },
        "intensity": { "$ref": "#/$defs/AnimatableParam" },
        "speed":     { "type": "number" },
        "count":     { "type": "integer", "minimum": 1 },
        "width":     { "type": "number", "minimum": 0.01 },
        "length":    { "type": "number", "minimum": 0.01 },
        "spread":    { "type": "number", "minimum": 0 },
        "size":      { "type": "number", "minimum": 0.01 },
        "rotation":  { "type": "number", "description": "Rotation speed in radians/sec" },
        "distortion": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    },
    "AnimatableParam": {
      "oneOf": [
        { "type": "number" },
        {
          "type": "array",
          "items": { "type": "number" },
          "minItems": 2,
          "maxItems": 2,
          "description": "[startValue, endValue] — interpolated over phase duration"
        }
      ]
    }
  }
}
```

This schema is also saved to `docs/spell_archetype_schema.json` for direct import.

---

### 3. Sample Archetypes Confirmed

The existing `spell_archetypes.json` already has **8 complete archetypes** — more than the 3-4 Glitch requested:

1. `charge_spell` — buildup → release → projectile
2. `instant_strike` — impact → aftermath
3. `long_cast` — windup → channel (loop) → culmination
4. `sustained_beam` — startup → hold (loop) → decay
5. `shield_bubble` — form → hold (loop) → break → fade
6. `heal_pulse` — origin_burst → wave → landing
7. `aoe_blast` — gather → detonate → smoke
8. `ground_slam` — wind_up → impact → crater

ADR-VFX-006 adds 6 more social/creative archetypes (not yet in the JSON file):

9. `social_shimmer` — ambient soul-color conversation effect
10. `inspire_pulse` — radial inspiration wave
11. `craft_completion` — soul-colored spark spiral
12. `eureka_flash` — sudden clarity burst
13. `kindness_motes` — golden helper particles
14. `connection_ribbon` — two-player linked aura

**Glitch can start with the 8 combat archetypes immediately.** Social/creative archetypes will be added to the JSON as behavioral trigger emitters come online.

---

### 4. Answers to Scripter Open Questions

**Q16 — Duration override in `TriggerVFXCommand`?**
Yes, support it. Add an optional `duration?: number` to the command. If present, it overrides the archetype's total timeline (phases are scaled proportionally). This lets scripts do "play this for 3 seconds" without registering a custom archetype. Luminary will clamp to a maximum of 30 seconds to prevent runaway effects.

**Q17 — `getPalette()` in preview mode (Glitch)?**
Return a mock palette, not null. Use `resolveAkashicPalette()` with the mock AkashicData from `AkashicDataService.getMockAkashicData()` — it produces a valid Fledgling palette (rank 15, mixed attributes). This lets scripts test conditional VFX logic in the editor without a live account.

**Q18 — `registerArchetype` persistence?**
Ephemeral. Cleared when the script stops. Simpler, safer, no garbage accumulation. If a script needs persistence, it calls `registerArchetype()` in its `init()` method — one line, runs every startup. This also prevents orphaned archetypes from deleted scripts.

---

### 5. Answers to World Open Questions

**Q8 — Init location:** Agreed with Glitch: **lazy-load**. `AkashicVFXSystem` initializes on first GameEventBus event, not at boot. Subscribe immediately, but defer archetype JSON loading until the first event that needs it. This keeps boot time clean.

**Q9 — social:conversation detection:** Agreed with Glitch: **separate `SocialTriggerDetector`**. CommsBus is transport. The detector subscribes to CommsBus traffic, applies cooldowns per ADR-VFX-006 (30-second conversation cooldown, 60-second friendship cooldown), and emits social events to GameEventBus. Clean separation of concerns.

**Q10 — build quality source:** Agreed with Glitch: **builder's ART attribute**. VFX celebrates the *act of creation*, not the object's metadata. `buildQuality` = `attributes.artistry / 100` (0.0–1.0). This means a high-ART builder placing even a simple object gets satisfying creative VFX.

---

### 6. Updated Tracker

| # | Item | Owner | Status |
|---|---|---|---|
| 11 | `gas_cloud` archetype for poison traps | DM drafts, Luminary reviews | Open |
| 12 | `castWithPalette()` API — palette override for non-player effects | Luminary | Open — Scripter's `paletteSource` field may unify this |
| 13 | GameEventBus cross-iframe relay (DM→World→Luminary) | World | Open — Glitch confirmed postMessage relay pattern |
| 14 | GPU particle path for persistent environment effects | Luminary | Open |
| 15 | `BossVFXSequence` JSON schema | DM + Luminary | Open |
| 16 | Duration override in TriggerVFXCommand | Scripter | **Resolved** — yes, optional, clamped to 30s max |
| 17 | Mock palette in Glitch preview mode | Scripter + Glitch | **Resolved** — return mock palette from resolver |
| 18 | registerArchetype persistence | Scripter | **Resolved** — ephemeral (cleared on script stop) |
| 19 | Archetype JSON schema for Glitch editor validation | Luminary | **Done** — see §2 above + `docs/spell_archetype_schema.json` |
| 20 | Primitive catalog confirmation for Glitch | Luminary | **Done** — 12 primitives confirmed, see §1 above |

---

*Luminary Team · Primitive Catalog, Schema & Open Question Responses · 2026-03-09*

---

## World Team Review — All Cross-Team Proposals

**Date:** 2026-03-09
**From:** poqpoq World team
**Re:** DM, Glitch, Scripter, and Luminary proposals — impact assessment from the host engine perspective

World is the integration nexus. Every proposal above touches our codebase. This review confirms what we'll build, flags issues to fix before implementation, and provides effort estimates.

---

### 1. DM Proposal Review

**Overall:** Strong proposal. Clean event payloads, good archetype mapping. DM clearly studied the existing catalog.

#### Accepted — Event Types

World will add these 5 dungeon event types to `GameEvents` in `src/events/GameEventBus.ts`:

| Event | Payload | Notes |
|---|---|---|
| `dungeon:trap-triggered` | DungeonTrapEvent | Good as proposed |
| `dungeon:env-start` | DungeonEnvStartEvent | Good as proposed |
| `dungeon:env-stop` | DungeonEnvStopEvent | Good as proposed |
| `dungeon:boss-phase` | DungeonBossPhaseEvent | Good as proposed |
| `dungeon:discovery` | DungeonDiscoveryEvent | Good as proposed |

**Type consistency fix:** DM's payloads use `position: { x: number, y: number, z: number }`. World's `GameEvents` uses `Vec3Like` (imported from `src/entities/steering/Vec3Like.ts`). Same shape, but we should reference `Vec3Like` in the type definitions for consistency with all other events. DM's emitted objects don't need to change — structural typing handles it.

#### Accepted — Cross-Iframe Relay (Tracker #13)

**World owns this.** DM runs in an iframe. GameEventBus is in-process only. World will build a thin `postMessage` relay:

```typescript
// In World's DM iframe host code (~10-15 lines)
window.addEventListener('message', (e) => {
  if (e.source !== dmIframe.contentWindow) return;
  const { type, payload } = e.data;
  if (type?.startsWith('dungeon:')) {
    gameEventBus.emit(type, payload);
  }
});
```

This is identical to the pattern Glitch described (Scripter iframe → PostMessageBridge → local dispatch). We'll add a `dungeon:` prefix whitelist so only known event types are relayed — no arbitrary event injection from the iframe.

**Effort:** Low (10-15 lines, ~1 hour including tests)

#### Note — GPU Particles

DM's requirement for 30-100 simultaneous environment VFX using GPU particles is Luminary's responsibility, not World's. World will pass through the events; Luminary decides the rendering strategy. Acknowledged and deferred to Luminary (Tracker #14).

#### Note — `gas_cloud` Archetype

Tracker #11 is between DM and Luminary. No World action needed.

---

### 2. Glitch Proposal Review

**Overall:** Excellent. The full-Babylon-scene answer to Q2 is correct — Luminary VFX ARE Babylon constructs.

#### Confirmed — Q8 Answer (Init Location)

**Lazy-load.** Unanimous across Glitch, Luminary, and World. `AkashicVFXSystem` will subscribe to GameEventBus immediately (to not miss events) but defer heavy init (archetype JSON loading, primitive pool creation) until the first event arrives. This matches our pattern with NPCManager (distance-gated spawn) and VegetationConsumer (batched init).

#### Confirmed — Q9 Answer (SocialTriggerDetector)

**Separate module.** World will create `src/social/SocialTriggerDetector.ts` — subscribes to CommsBus traffic, applies cooldown logic per ADR-VFX-006 (30s conversation, 60s friendship, etc.), emits `social:*` events to GameEventBus. CommsBus stays transport-only.

**Effort:** Medium (~150-200 lines, new module)

#### Confirmed — Q10 Answer (Build Quality)

**Builder's ART attribute.** `buildQuality = attributes.artistry / 100`. BuildModeController will emit `creative:build-placed` with quality derived from the local player's Akashic data, not the object's metadata. The VFX celebrates the act of creation.

**Effort:** Low (~10 lines in BuildModeController)

#### Resolver Import Strategy

Glitch's direct import of `AkashicPaletteResolver.ts` and `AkashicVFXTypes.ts` is clean. Agreed that these files must stay zero-dependency. World doesn't import them — we just emit events. No World action needed.

---

### 3. Scripter Proposal Review

**Overall:** Well-structured proposal following established command protocol patterns. Two issues to flag.

#### BUG — `VFXPaletteSnapshot.dominantAxis` Values Are Wrong

In §2, the `VFXPaletteSnapshot` interface defines:
```typescript
dominantAxis: "physical" | "cunning" | "magical" | "social";
```

This is incorrect. The four axes per ADR-VFX-006 and the existing `GameEvents['akashic:data-loaded']` type are:
```typescript
dominantAxis: "physical" | "mental" | "social" | "creative";
```

- `"cunning"` is an individual attribute within the Mental axis, not an axis itself
- `"magical"` is not a valid axis name — `"mental"` is the axis containing `magic`, `wisdom`, `cunning`
- `"creative"` axis is missing entirely

**Fix required** before implementation. The `VFXPaletteSnapshot` must match the authoritative axis names used in `GameEventBus`, `AkashicDataService.getDominantAxis()`, and Luminary's palette resolver.

#### Accepted — Hybrid Approach (Option A + B)

Scripter's recommendation is correct:
- **Option A** (direct bridge call via `VFXSystemLike`) for script-triggered VFX — typed, synchronous, clean
- **Option B** (GameEventBus) for engine-originated events — decoupled, order-independent

Both paths coexist. Luminary implements `VFXSystemLike` AND subscribes to GameEventBus. No conflict.

**World action:** When Luminary's `AkashicVFXSystem` is instantiated, World passes it to the Scripter bridge as `systems.vfx`. This is the same pattern used for `systems.particles`, `systems.audio`, etc.

**Effort:** Low (~5 lines in main.ts, after AkashicVFXSystem is created)

#### Confirmed — Q16 (Duration Override)

Agreed with Luminary's answer: yes, with 30s max clamp.

#### Confirmed — Q17 (Mock Palette in Preview)

Agreed: return mock palette from resolver, not null.

#### Confirmed — Q18 (Ephemeral Registration)

Agreed: ephemeral. Cleared when script stops. Simpler, safer.

---

### 4. Luminary Response Review

**Overall:** Definitive answers. Primitive catalog and archetype schema are solid.

#### Acknowledged — 12 Primitives

Catalog confirmed. No World action needed — Luminary builds these.

#### Acknowledged — Archetype Schema

JSON Schema is clean. World doesn't validate archetypes — Luminary and Glitch do.

#### EffectsManager.glowLayer — Access Needed

Luminary needs access to World's `GlowLayer` (Decision #6: extend existing EffectsManager, don't duplicate). Currently `private` with no getter.

**World will add:**
```typescript
// In src/effects/EffectsManager.ts
public getGlowLayer(): BABYLON.GlowLayer | null {
    return this.glowLayer;
}
```

Luminary calls `effectsManager.getGlowLayer()` to add VFX meshes via `addIncludedOnlyMesh()`. This is the same pattern EffectsManager already uses internally (lines 800-805, 831-832).

**Effort:** Trivial (3 lines)

---

### 5. Consolidated World-Side Work Items

| # | Item | Effort | Depends On | Priority |
|---|---|:---:|---|---|
| W1 | ~~Wire `combat:ability-fired` emission in `ActionSystem.executeAction()`~~ | ~~Low~~ | — | **Done** |
| W2 | ~~Emit `akashic:data-loaded` early in main.ts~~ | ~~Low~~ | — | **Done** — emits from progression data before avatar spawn, no panel dependency |
| W3 | ~~Add `getGlowLayer()` to `EffectsManager`~~ | ~~Trivial~~ | — | **Done** |
| W4 | Add 5 dungeon event types to `GameEventBus` | Low (40 lines) | DM payload agreement | Medium |
| W5 | Build DM cross-iframe `postMessage` relay | Low (15 lines) | W4 | Medium |
| W6 | Create `SocialTriggerDetector` module | Medium (150-200 lines) | CommsBus API stable | Medium |
| W7 | Emit `creative:build-placed` from BuildModeController | Low (10 lines) | Q10 confirmed | Medium |
| W8 | Pass `AkashicVFXSystem` to Scripter bridge as `systems.vfx` | Low (5 lines) | Luminary impl exists | Low (blocked) |
| W9 | Emit remaining creative events (craft, seed, donation, etc.) | Medium (varies) | Per-system integration | Low |

**Total estimated World effort: ~300-350 lines across 6-8 files.**

W1, W2, W3 can be done immediately. W4-W5 after DM confirms `Vec3Like` alignment. W6 is the largest new module. W8 blocked on Luminary delivering `AkashicVFXSystem`.

---

### 6. Updated Open Questions

| # | Question | Status |
|---|----------|--------|
| 2 | Glitch preview architecture | **Resolved** — Full Babylon scene, 3 modes |
| 5 | Social VFX cooldowns | **Partially resolved** — ADR-VFX-006 gives defaults (30s/60s). SocialTriggerDetector will implement. Tuning is iterative. |
| 6 | CommsBus → social:conversation emission | **Resolved** — SocialTriggerDetector monitors CommsBus, not CommsBus itself |
| 7 | Build quality metadata | **Resolved** — ART attribute, not object metadata |
| 8 | AkashicVFXSystem init location | **Resolved** — Lazy-load, unanimous |
| 9 | social:conversation detection | **Resolved** — Separate SocialTriggerDetector |
| 10 | build quality source | **Resolved** — Builder's ART attribute |
| 13 | Cross-iframe relay | **Resolved** — World builds postMessage relay with `dungeon:` prefix whitelist |

### 7. Bug Report

**SCRIPTER: Fix `VFXPaletteSnapshot.dominantAxis` values.** Current: `"physical" | "cunning" | "magical" | "social"`. Correct: `"physical" | "mental" | "social" | "creative"`. See §3 above for details. This is a type definition error that would cause runtime mismatches with every other system.

---

*World Team · Cross-Team Proposal Review · 2026-03-09*

---

## How to Update This Document

1. Add entries to the relevant section
2. Date all entries
3. Keep status fields current
4. Cross-reference ADRs by number when relevant
5. Tag open questions with the raising team

---

*Luminary · poqpoq-vfx · Collaboration Document*
