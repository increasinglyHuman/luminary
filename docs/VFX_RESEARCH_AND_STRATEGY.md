# Luminary VFX Research & Strategy Report

**Date:** 2026-03-08
**Author:** Allen Partridge + Claude Opus 4.6
**Status:** Research complete — strategy recommendations for team review

---

## Part 1: What Already Exists in the World Repo

Before building anything new, Luminary must account for the substantial VFX infrastructure already in `/home/p0qp0q/blackbox/World/src/`. Duplicating this work would be wasteful and create maintenance debt.

### Existing Systems Map

| System | File | Capabilities | Luminary Relationship |
|--------|------|-------------|----------------------|
| **EffectsManager** | `effects/EffectsManager.ts` | Particle pooling, post-processing pipeline (bloom, DOF, FXAA, color grading), LOD with adaptive quality, glow layer, 100+ user optimization | **Integrate with** — Luminary should use EffectsManager's glow layer and post-processing, not create its own |
| **ParticleEffectSystem** | `effects/ParticleEffectSystem.ts` | Config-driven particle factory, WebGL2 detection, GPU capability detection, 9 presets (companion, weather, magic) | **Extend** — Luminary's primitives should register as configs in this system |
| **CompanionEffects** | `effects/CompanionEffects.ts` | AI companion emotional auras, glow layer integration, emotion-type enum | **Coordinate** — Companion effects and Akashic signatures must not conflict visually |
| **PostProcessingEffects** | `effects/PostProcessingEffects.ts` | Full pipeline: bloom, tone mapping, SSAO, DOF, adaptive quality | **Consume** — Luminary emissive materials benefit from existing bloom pipeline |
| **CombatVFXManager** | `combat/vfx/CombatVFXManager.ts` | Event-driven via GameEventBus, delegates to ImpactParticles/FloatingText/CameraShake | **Extend** — Luminary combat VFX should subscribe to the same GameEventBus events |
| **ImpactParticles** | `combat/vfx/ImpactParticles.ts` | **Pooled** burst system (pool of 8), procedural shard texture, `manualEmitCount` burst pattern, round-robin recycling | **Adopt pattern** — This is the pooling model Luminary should follow |
| **GameEventBus** | `events/GameEventBus.ts` | Typed pub/sub with `GameEvents` interface. Events: `npc:damaged`, `player:damaged`, `npc:death`, `player:death`, `player:levelup`, plus comms events | **Subscribe** — Luminary should react to events, not require direct function calls |
| **PBRMaterialSystem** | `materials/PBRMaterialSystem.ts` | PBR material management | **Coordinate** — Material allocation budget |

### Key Architectural Insights from the World Repo

**1. GameEventBus is the integration pattern, not direct calls.**

The CombatVFXManager doesn't receive direct function calls — it subscribes to `GameEventBus` events and reacts purely. This is the correct pattern for Luminary. Instead of the ADR-VFX-001 approach where each team calls `vfxSystem.castSpell()` directly, Luminary should:

- Add new event types to `GameEvents` interface: `'akashic:palette-updated'`, `'akashic:rank-up'`, `'akashic:deity-bond'`, `'akashic:roll-accepted'`, `'combat:ability-fired'`
- Subscribe to these events in `AkashicVFXSystem`
- Consuming teams emit events (which they'd do anyway) rather than importing Luminary

This eliminates the boot-order problem (Open Question #4 in comms.md) — event subscriptions are order-independent.

**2. ImpactParticles has the pooling pattern Luminary needs.**

The current Luminary prototype creates and disposes particle systems via `new ParticleSystem()` + `setTimeout(() => ps.dispose())`. The World repo's `ImpactParticles` shows the production pattern:
- Pre-create a pool of N systems at init
- Use `manualEmitCount` for burst-style effects (not emitRate)
- Track busy state with `performance.now()` timestamps
- Round-robin fallback when pool is exhausted
- Procedural textures (zero external asset dependency)

**3. EffectsManager already owns the glow layer and post-processing.**

Luminary should not create its own `GlowLayer` or post-processing. Instead, it should request the existing glow layer from EffectsManager and use it for emissive materials.

**4. AkashicDataService is clean and ready.**

The service at `services/AkashicDataService.ts` has a straightforward `getAkashicData(userId)` method. The `setPalette()` hook fits naturally — either as a direct call after line 111, or (preferred) by emitting an `'akashic:data-loaded'` event that Luminary subscribes to.

**5. ActionSlot is an interface, not a class.**

Adding `vfxArchetype?: SpellArchetypeId` to the `ActionSlot` interface is trivial. The ability implementations (SwordSlash, SpellCast, HealSpell, etc.) in `combat/abilities/` each implement this interface and would add the archetype ID to their config.

**6. ResourceManager uses callbacks, not events.**

`ResourceManager` has `onResourceChange` and `onDeath` callbacks. For Luminary integration, either:
- Wire these callbacks to emit GameEventBus events (preferred — keeps ResourceManager unchanged)
- Or have the combat system emit events at the same points it fires callbacks

---

## Part 2: Babylon.js VFX Capabilities Deep Dive

### GPU Particles vs CPU Particles

| Feature | CPU (`ParticleSystem`) | GPU (`GPUParticleSystem`) |
|---------|----------------------|--------------------------|
| Capacity | 5,000-10,000 practical | 100,000+ at near-zero CPU cost |
| Sub-emitters | Yes | No |
| Custom update function | Yes | No |
| Color/size gradients | Yes | Yes |
| Noise texture | Yes | Yes |
| API compatibility | Full | Nearly identical |

**Luminary strategy:** Use GPU particles for persistent/ambient effects (strength signatures, deity overlays). Use CPU particles for short-lived burst effects that need sub-emitters.

Detection: `BABYLON.GPUParticleSystem.IsSupported`

### ParticleSystemSet — Natural Fit for Archetype Phases

`BABYLON.ParticleSystemSet` bundles multiple particle systems into one start/stop/dispose unit. Each archetype phase (e.g., `charge_spell.buildup` with energy_orb + ground_ring + electric_arc) should be a single ParticleSystemSet rather than 3 independently setTimeout-managed systems.

Benefits:
- Atomic start/stop (no timing drift between concurrent effects)
- Single disposal call
- Serializable to JSON (aligns with data-driven archetype approach)

### Sub-Emitters

Particles can spawn child systems on birth, death, or attachment:
```typescript
system.subEmitters = [new SubEmitter(childSystem)];
// Types: SubEmitterType.END, SubEmitterType.ATTACHED
```

**Luminary use case:** `impact_flash` particles spawn `smoke_wisp` sub-emitters on death — natural transition from flash to smoke without two systems and a setTimeout.

### Noise Textures — The Missing Link

The palette's `noiseScale` value is computed but currently unused in the particle systems. Babylon has built-in support:

```typescript
const noiseTexture = new BABYLON.NoiseProceduralTexture("noise", 256, scene);
system.noiseTexture = noiseTexture;
system.noiseStrength = new BABYLON.Vector3(noiseScale, noiseScale, noiseScale);
```

This applies Perlin-noise perturbation to particle positions each frame:
- Low `noiseScale` (0.2) = tight, precise paths → crystalline/cunning builds
- High `noiseScale` (1.8) = wild, chaotic paths → expansive/magical builds

**This is a 5-line-per-primitive change that makes the CUN vs MAG visual distinction real.**

### GlowLayer — Instant Emissive Payoff

The World repo's EffectsManager already creates a GlowLayer. Luminary's `emissiveBoost` palette value should feed directly into emissive material intensity. High-faith characters will literally glow brighter with zero additional rendering cost.

```typescript
const mat = new BABYLON.StandardMaterial("vfx_mat", scene);
mat.emissiveColor = rgbToColor3(palette.soulColor).scale(palette.emissiveBoost);
// GlowLayer picks this up automatically
```

### Thin Instances for Mesh-Based Primitives

Current Luminary code creates a new mesh + material per invocation of `hex_rune`, `ground_ring`, `aura_shell`, and `shockwave`. With thin instances:

- Create ONE base mesh per primitive type at startup
- Add thin instances: `mesh.thinInstanceAdd(matrix)`
- Per-instance color via: `mesh.thinInstanceSetBuffer("color", colorBuffer, 4)`
- Result: N active runes = 1 draw call instead of N

### SPS (Solid Particle System) for Geometric Styles

`particleStyle: 'geometric' | 'crystalline'` should render mesh-based particles (icosahedrons, tetrahedrons) rather than billboard sprites. SPS handles this:

- All particles in one draw call
- Per-particle color, rotation, scaling
- Creates genuine visual distinction from `feathered` and `organic` billboard styles

### TrailMesh for Ribbon Effects

The `ribbon_trail` primitive is currently approximated with particles. Babylon's `TrailMesh` is purpose-built:

```typescript
const trail = new BABYLON.TrailMesh("trail", sourceMesh, scene, 0.2, 60, true);
```

Ideal for movement-triggered deity overlays (Hermes wing trails, Artemis crescent trails).

### SDF (Signed Distance Fields) for Runes

`hex_rune` should be an SDF-rendered quad, not a wireframe mesh:
- Crisp edges at any distance (no aliasing)
- Smooth animation of rune complexity
- Deity-specific rune patterns as different SDF textures (Odin's eye, Athena's owl)
- Glow falloff computed analytically from the distance field

### Sprite Sheet Animation

For complex particle shapes without geometry cost:
```typescript
system.isAnimationSheetEnabled = true;
system.startSpriteCellID = 0;
system.endSpriteCellID = 15;  // 4x4 atlas
system.spriteCellWidth = 64;
system.spriteCellHeight = 64;
```

Create atlases for: fire/ember frames, lightning bolt variants, rune glyph variants, healing shapes.

---

## Part 3: Game VFX Industry Best Practices

### Palette-Driven Systems in Commercial Games

| Game | Pattern | Key Learning for Luminary |
|------|---------|--------------------------|
| **Path of Exile** | Base archetype + color/style MTX overlays = final effect. Data-driven JSON configs. | Shape/dressing separation is exactly Luminary's approach — validated at massive scale |
| **Guild Wars 2** | Profession-colored VFX shift with attunement (fire=orange, water=blue). Single "energy" mesh with color uniform. | Use one effect mesh + color uniform, not separate meshes per element |
| **Diablo 4** | Class identity through particle *shape* (geometric vs organic) as much as color | `particleStyle` system (crystalline vs feathered vs ember) is the right approach |
| **Lost Ark** | Extreme particle counts, aggressive LOD beyond 20m. Sprite sheets for complex shapes. | Sprite sheets for ember/lightning styles; hard LOD cutoffs |

### Object Pooling — The #1 Priority

The current Luminary prototype's create-and-dispose pattern is the single biggest performance issue:

```
Current: new ParticleSystem() → start() → setTimeout(dispose) → new ParticleSystem()...
Target:  pool.acquire() → configure(palette) → start() → pool.release()
```

**Pool budget:** 5-8 instances per primitive type = 60-96 total pooled systems for 12 primitives. Emitter meshes should also be pooled.

### VFX Frame Budget

| Category | Budget (ms @ 60fps) | Notes |
|----------|---------------------|-------|
| Total frame | 16.6ms | — |
| VFX total | 2.0-2.5ms | Luminary's target |
| Particle simulation | 1.0ms | GPU particles reduce this |
| VFX draw calls | 0.8ms | Thin instances + SPS help |
| Post-process (glow) | 0.4ms | Already paid by EffectsManager |
| Draw call budget | < 20 calls | For all VFX combined |

### Overdraw Control

Additive blend particles (`BLENDMODE_ADD`) are the primary fill-rate concern. Each overlapping layer costs a full fragment shader evaluation. Limit maximum overdraw to 4-6 layers. Reduce particle count or size if exceeded.

### 3-Tier LOD System

| Distance | Tier | Particle Count | Draw Calls | Visual |
|----------|------|----------------|------------|--------|
| 0-15m | Full | 100% | Full | All primitives, all details |
| 15-40m | Reduced | 30% | Merged | Key primitives only, larger particles |
| 40m+ | Minimal | 0% particles | 1 | Single glow sprite with soul color |

At reduced tier: skip `smoke_wisp`, `hex_rune`, `electric_arc` (subtle details invisible at distance). At minimal tier: replace entire effect with a colored point light flash.

---

## Part 4: Architecture Corrections

Based on the World repo study, several adjustments to ADR-VFX-001 are recommended:

### 1. Use GameEventBus Instead of Direct Calls

**Before (ADR-VFX-001):**
```typescript
// Each consuming team imports and calls vfxSystem directly
vfxSystem.castSpell('charge_spell', casterId, position, target);
```

**Recommended:**
```typescript
// Consuming team emits an event (they'd do this anyway)
events.emit('combat:ability-fired', {
  archetypeId: 'charge_spell',
  casterId,
  position,
  target
});

// Luminary subscribes (in its own code, no imports needed by consumers)
events.on('combat:ability-fired', (data) => {
  this.castSpell(data.archetypeId, data.casterId, data.position, data.target);
});
```

**Benefits:** Eliminates boot-order dependency, no cross-team imports, consuming teams don't need Luminary as a dependency.

### 2. Extend Existing Effects Infrastructure

Luminary should register its primitives with the existing `ParticleEffectSystem` and use the existing `EffectsManager` for glow/post-processing, rather than operating as a fully independent system. The `AkashicVFXSystem` becomes a higher-level orchestrator that delegates to existing infrastructure.

### 3. Replace setTimeout with Render-Loop Timers

All current `setTimeout` calls in `AkashicVFXSystem.ts` should use `scene.onBeforeRenderObservable` with elapsed-time accumulators. setTimeout runs outside the render loop and can fire during GC pauses, causing visual stuttering. Scene observers auto-clean on dispose.

### 4. Replace setInterval for Strength Signatures

The `setInterval` at line 821 of `AkashicVFXSystem.ts` should be a render-loop observer with a time accumulator. This ensures signature particles align with frame timing.

### 5. Emitters Don't Need Meshes

Current primitives create tiny box/sphere meshes as emitters. Babylon particle systems accept `Vector3` directly as emitters for point emission. This eliminates mesh creation/disposal overhead.

---

## Part 5: Revised Implementation Phases

### Phase 1 — Foundation (Integrate, Don't Duplicate)

- [ ] Set up Luminary as a package consumable by World
- [ ] Register Luminary primitives with existing `ParticleEffectSystem`
- [ ] Wire `AkashicVFXSystem` to subscribe to `GameEventBus` events
- [ ] Implement primitive pooling following `ImpactParticles` pattern
- [ ] Add noise texture support to all particle primitives (5 lines each)
- [ ] Wire `emissiveBoost` to existing GlowLayer
- [ ] Add `'akashic:data-loaded'` event type to GameEvents
- [ ] **Proof of concept:** Two players with different dominant axes, visually distinct effects

### Phase 2 — Archetypes & Pooling

- [ ] Refactor archetype phases to use `ParticleSystemSet` (atomic start/stop)
- [ ] Replace all `setTimeout` with scene observer timers
- [ ] Replace emitter meshes with `Vector3` emitters where possible
- [ ] Implement `charge_spell`, `instant_strike`, `heal_pulse`, `shield_bubble`
- [ ] Add `'combat:ability-fired'` event type with archetype ID
- [ ] Add easing curves to phase transitions
- [ ] **Milestone:** Full archetype-driven magic reading Akashic palettes

### Phase 3 — Deity & Strength Signatures

- [ ] Switch persistent effects to `GPUParticleSystem`
- [ ] Replace `setInterval` signatures with render-loop observers
- [ ] Implement deity overlay system (16 deities)
- [ ] Build strength signature templates grouped by axis-pair
- [ ] Implement thin instances for `hex_rune` (deity-specific SDF textures)
- [ ] **Milestone:** Players visually wear their soul history

### Phase 4 — Event Sequences & Polish

- [ ] Rank up ceremony with tier-color transitions
- [ ] Deity bonding sequence
- [ ] Roll ceremony VFX
- [ ] Resonance gain ambient feedback
- [ ] 3-tier LOD system
- [ ] Sprite sheet atlases for ember, lightning, rune styles
- [ ] **Milestone:** Progression moments feel like genuine events

### Phase 5 — Advanced Rendering

- [ ] SPS for `crystalline` and `geometric` particle styles (mesh particles)
- [ ] TrailMesh for `ribbon_trail` primitive (movement-triggered deity effects)
- [ ] SDF-rendered rune quads for `hex_rune` (per-deity patterns)
- [ ] Volumetric noise shader for `aura_shell`
- [ ] Screen-space distortion for `shockwave` (high-tier only)
- [ ] WebGPU compute path (optional enhancement)

---

## Part 6: Dungeon Master & Scripter Integration Notes

### Dungeon Master

The DM module at `/home/p0qp0q/blackbox/BlackBoxDungeonMaster/` will consume Luminary for:

- **Trap VFX**: Standard archetypes (`aoe_blast` for explosion traps, `ground_slam` for pit traps, `sustained_beam` for laser traps). DM emits `'dungeon:trap-triggered'` events.
- **Environment VFX**: Ambient dungeon effects using persistent primitives (`smoke_wisp` for fog, `healing_motes` inverted for toxic spores, `aura_shell` for magical barriers).
- **Boss encounter sequences**: Custom event sequences for boss phase transitions. These are essentially spell archetypes with longer timelines.
- **Palette override**: DM effects should use a "dungeon palette" (dark, ominous) rather than the player's Akashic palette. The system needs a `castWithPalette(archetypeId, overridePalette, position)` variant.

### Scripter

The Scripter at `/home/p0qp0q/blackbox/BlackBoxScripter/` needs:

- **Read-only palette access**: Scripts can query a player's `VFXPalette` for conditional logic (e.g., "if player is Physical-dominant, show fire trap warning"). No write access.
- **Script-triggered VFX**: Scripter emits `'script:vfx-trigger'` events with archetype ID and position. Luminary subscribes.
- **Runtime archetype registration**: User scripts can define custom archetypes (JSON) at runtime. These go into a separate "user archetypes" namespace to avoid conflicts.

### Glitch

The Glitch preview tool at `/home/p0qp0q/blackbox/glitch/` needs:

- **Standalone VFX preview**: Run `AkashicVFXSystem` with mock palette data and a minimal Babylon scene. The palette resolver has zero Babylon dependency — Glitch can compute palettes without a full scene.
- **Archetype editor**: Load/edit/save archetype JSON with instant visual preview. This is a JSON editor + live Babylon canvas.
- **Palette visualizer**: Sliders for each attribute → live palette preview showing soul color, particle style, emissive boost, noise scale.

---

## Part 7: Key Reference URLs

| Resource | URL |
|----------|-----|
| Babylon.js Particle System | `https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system` |
| GPU Particles | `https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/gpu_particles` |
| Sub-Emitters | `https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/sub_emitters` |
| ParticleSystemSet | `https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_set` |
| Solid Particle System | `https://doc.babylonjs.com/features/featuresDeepDive/particles/solid_particle_system` |
| Thin Instances | `https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances` |
| Glow Layer | `https://doc.babylonjs.com/features/featuresDeepDive/mesh/glowLayer` |
| Trail Mesh | `https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/trail` |
| Noise Texture on Particles | `https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_noise_texture` |
| Node Material Editor | `https://nme.babylonjs.com` |
| Snippet Server | `https://snippet.babylonjs.com` |
| Playground | `https://playground.babylonjs.com` |

---

## Summary: Top 5 Strategic Recommendations

1. **Don't duplicate — integrate.** The World repo has pooling, glow, post-processing, and an event bus. Luminary should extend these systems, not rebuild them.

2. **GameEventBus over direct calls.** This solves boot order, eliminates cross-team imports, and follows the pattern already established by CombatVFXManager.

3. **Pool everything.** Follow the `ImpactParticles` pattern. No `new ParticleSystem()` during gameplay. Pre-create, configure from palette, release back to pool.

4. **Noise textures make the palette real.** The `noiseScale` value is computed but unused. 5 lines per primitive makes CUN vs MAG visually distinct.

5. **GPU particles for persistence, CPU for bursts.** Strength signatures and deity overlays run indefinitely — GPU particles. Combat bursts and ceremony effects are short-lived — CPU particles with pooling.

---

*Luminary · poqpoq-vfx · Research & Strategy Report · March 2026*
*Technical Lead: Allen Partridge · AI Engineer: Claude Opus 4.6*
