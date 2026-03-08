# Luminary (poqpoq-vfx) — Team Collaboration Document

**Last Updated:** 2026-03-08
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
| `AkashicDataService.setPalette()` | Planned | 2-line integration in fetch lifecycle |
| `ActionSlot.castSpell()` | Planned | Add `vfxArchetype` config field |
| `ResourceManager.triggerCombat()` | Planned | Hook into hit/death/dodge events |
| `AkashicRankManager.playRankUp()` | Planned | Fire on rank change |
| `AttributeRollScreen.playRollCeremony()` | Planned | After roll accept + palette set |
| Avatar spawn/despawn signatures | Planned | `startStrengthSignatures()` / `disposeAllForUser()` |

### Luminary → Scripter

| Integration Point | Status | Notes |
|---|---|---|
| Script-triggered VFX | Planned | Scripter calls `castSpell()` with archetype ID |
| Custom archetype loading | Planned | User scripts can register archetypes at runtime |
| VFX palette read access | Planned | Scripts can read (not write) palette for conditional logic |

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
| 1 | Should Scripter have write access to palette, or read-only? | — | 2026-03-08 | Open |
| 2 | Glitch preview: run full Babylon scene or lightweight canvas? | — | 2026-03-08 | Open |
| 3 | DM trap effects: use existing archetypes or define trap-specific ones? | — | 2026-03-08 | Open |
| 4 | Boot order: how to guarantee VFXSystem init before consumers call it? | — | 2026-03-08 | Open |

---

## Decision Log

| # | Decision | Date | Rationale |
|---|----------|------|-----------|
| 1 | Luminary is a standalone micro-repo, not embedded in World | 2026-03-08 | Clean boundaries, independent versioning, testable without Babylon |
| 2 | Palette resolver has zero Babylon dependency | 2026-03-08 | Enables server-side use, unit testing, Scripter import |
| 3 | Archetypes are JSON-driven, not code | 2026-03-08 | New spells = data change, no cross-team coordination |
| 4 | ADR-VFX-001 is the authority document for module topology | 2026-03-08 | See docs/ADR-VFX-001-Akashic-VFX-Authority.md |

---

## Blockers & Dependencies

| Blocker | Affects | Owner | Status |
|---------|---------|-------|--------|
| NodeMaterial asset pipeline not established | Primitive visual quality | Luminary | ADR-VFX-005 pending |
| AkashicDataService fetch lifecycle confirmation | Palette integration | World team | Awaiting review |
| ActionSlot config shape confirmation | Spell VFX wiring | Combat team | Awaiting review |

---

## How to Update This Document

1. Add entries to the relevant section
2. Date all entries
3. Keep status fields current
4. Cross-reference ADRs by number when relevant
5. Tag open questions with the raising team

---

*Luminary · poqpoq-vfx · Collaboration Document*
