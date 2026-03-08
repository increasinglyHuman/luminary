# Luminary

**The Akashic VFX System for poqpoq World**

Luminary transforms poqpoq's soul-level progression data into a living visual language. Every spell, combat event, and ceremonial moment is driven by the player's Akashic Record — their attributes, deity bonds, rank tier, and derived strengths. No two players look alike.

## Core Concept

> *The Akashic Record is not just data. It's a visual signature.*

A fresh Emerald Noob and a Gold Transcendent cast the same spell — but the world *shows* the difference. A player bonded to Odin gets cobalt eye runes layered over their cool violet base. A Battlemage sees flame+lightning arcs from their hands. These effects require no player action. They are simply what the soul looks like.

## Architecture

Luminary uses a **four-layer pipeline** with clear ownership boundaries:

```
Layer 4: EVENT SEQUENCES        → Rank up, deity bond, roll ceremony
Layer 3: SPELL/COMBAT ARCHETYPES → charge_spell, heal_pulse, shield_bubble
Layer 2: AKASHIC PALETTE RESOLVER → Soul color, emissive, particle style
Layer 1: VFX PRIMITIVE LIBRARY    → energy_orb, hex_rune, shockwave, etc.
```

### Key Design Principles

- **Palette-driven**: All visual decisions flow from the Akashic palette — no hardcoded colors
- **Data-driven archetypes**: New spell shapes = JSON entry, no code changes
- **Zero coupling**: Palette resolver has no Babylon.js dependency — fully testable, server-safe
- **Clean boundaries**: Luminary knows *how* to paint. Consuming teams decide *when*.

## Repository Structure

```
luminary/
├── comms/
│   └── comms.md                    # Cross-team collaboration document
├── docs/
│   ├── ADR-VFX-001-Akashic-VFX-Authority.md  # Architecture decision record
│   ├── AKASHIC_SYSTEM_COMPLETE_REFERENCE.md   # Full Akashic system reference
│   ├── poqpoq_akashic_vfx_strategy.md        # VFX strategy overview
│   ├── INTEGRATION.md                         # Drop-in wiring guide
│   ├── AkashicVFXTypes.ts                     # Shared type contracts
│   ├── AkashicPaletteResolver.ts              # Pure palette resolver
│   ├── AkashicVFXSystem.ts                    # Babylon.js VFX service
│   ├── AkashicVFXSystem.test.ts               # Unit tests
│   └── spell_archetypes.json                  # Archetype definitions
└── images/
    └── ...                                    # Visual assets
```

## Integration

Luminary integrates with consuming teams through typed function calls:

| Consumer | Hook | Call |
|----------|------|------|
| AkashicDataService | Data fetch | `vfxSystem.setPalette(userId, data)` |
| ActionSlot | Ability fire | `vfxSystem.castSpell(archetypeId, casterId, pos, target)` |
| ResourceManager | Combat events | `vfxSystem.triggerCombat(type, entityId, pos)` |
| AkashicRankManager | Rank change | `vfxSystem.playRankUp(userId, rank, tier, pos)` |
| AttributeRollScreen | Roll accept | `vfxSystem.playRollCeremony(userId, pos)` |
| Avatar lifecycle | Spawn/despawn | `startStrengthSignatures()` / `disposeAllForUser()` |

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for complete wiring guide.

## Related Projects

| Project | Role |
|---------|------|
| [poqpoq World](https://github.com/increasinglyHuman/poqpoq-world) | Game engine — primary consumer |
| Scripter | Scripting engine — script-triggered VFX |
| Glitch | Preview & visualization tool |
| Dungeon Master | Dungeon effects, traps, boss encounters |

## Contributing

See [comms/comms.md](comms/comms.md) for the team collaboration document, open questions, and integration status.

## License

MIT License — see [LICENSE](LICENSE).

---

*poqpoq World · Luminary VFX System · 2026*
*Technical Lead: Allen Partridge · [increasinglyHuman](https://github.com/increasinglyHuman)*
