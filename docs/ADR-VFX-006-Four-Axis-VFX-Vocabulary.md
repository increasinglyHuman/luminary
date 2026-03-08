# poqpoq // Architecture Decision Record

---

# ADR-VFX-006 — Four-Axis VFX Vocabulary

| Field | Value |
|-------|-------|
| **Status** | Draft — awaiting team review |
| **Date** | March 2026 |
| **Author** | Allen Partridge |
| **Domain** | VFX · Social · Creative · Behavioral Triggers |
| **Affects** | Luminary · World · Scripter · Comms · Building · Crafting |
| **Depends on** | ADR-VFX-001 (Akashic VFX Authority) |

---

## Context

The initial VFX archetype catalog is combat-biased. Of 12 spell archetypes, 11 serve Physical or Mental axis actions (charge_spell, instant_strike, sustained_beam, etc.). The Social and Creative axes — which represent half of poqpoq's identity space — have almost no visual language.

This matters because poqpoq is not a combat game with social features bolted on. The four axes are equal pillars. A player who maxes Charisma and Leadership and never swings a sword should have effects that are *as rich and as personal* as the Battlemage's flame arcs. A builder with high Creativity and Artistry should see their soul showing just as clearly as the player who grinds Magic.

The fundamental difference: Physical and Mental effects trigger on **button presses** (cast spell, swing sword). Social and Creative effects trigger on **behaviors** — conversations, group activities, crafting completions, building placements, discoveries, acts of kindness. The VFX system must recognize these behavioral moments and respond.

---

## Decision

Expand the archetype catalog and event vocabulary to serve all four axes equally. Social and Creative VFX are driven by behavioral events emitted by existing game systems (comms, building, crafting, questing, social interaction), not by new action buttons.

---

## The Four-Axis VFX Vocabulary

### Physical Axis — Power in Motion

**Trigger pattern:** Button press → immediate effect
**Already covered:** `charge_spell`, `instant_strike`, `ground_slam`, combat impacts

| Moment | Trigger | Visual |
|--------|---------|--------|
| Melee strike | ActionSlot execute | Impact flash + sparks (existing) |
| Dodge | ResourceManager dodge event | Smoke wisp trail (existing) |
| Sprint burst | Movement speed threshold | Ember trail from feet |
| Endurance feat | Sustained activity (long fight, marathon run) | Subtle heat shimmer aura, intensifies over time |

### Mental Axis — Precision Made Visible

**Trigger pattern:** Ability cast → phased sequence
**Already covered:** `sustained_beam`, `long_cast`, `shield_bubble`, spell hits

| Moment | Trigger | Visual |
|--------|---------|--------|
| Spell cast | ActionSlot execute | Archetype sequence (existing) |
| Secret found | CUN discovery event | Brief geometric flash at discovery point |
| Puzzle solved | Quest system puzzle-complete | Hex rune dissolve + golden motes |
| Trap detected | CUN proximity event | Faint crystalline wireframe outline of trap |
| Lore discovered | Akashic Tales interaction | Orbiting text-glyph particles, fade after 3s |

### Social Axis — The Soul Reaching Out

**Trigger pattern:** Behavioral → ambient response (no button press)

Social VFX are **reactive to social behaviors**, not cast like spells. The system watches for social moments and responds with effects that reflect the player's social identity. These effects are visible to nearby players — social VFX are inherently public.

| Moment | Trigger Source | Event | Visual |
|--------|---------------|-------|--------|
| **Conversation** | Comms system (local/say chat) | `'social:conversation'` | Soft shimmer around speaker, soul-color tinted. Intensity scales with CHA. Two-person conversation: matching shimmer between speakers |
| **Group formation** | Party/group system | `'social:group-formed'` | Brief connecting ribbon trails between group members, gold-tinted. LDR-scaled: higher LDR = wider, brighter ribbons |
| **Helping another player** | Quest/trade/gift system | `'social:assist'` | Warm motes float from helper to recipient. FTH-scaled brightness |
| **Teaching moment** | Lore sharing, mentoring detection | `'social:teach'` | Gentle descending knowledge motes around both players. WIS tint |
| **Event participation** | Event system join/contribute | `'social:event-participate'` | Soul-color sparkle burst on contribution. Scales with contribution value |
| **Planning/coordination** | Group chat activity spike | `'social:coordinate'` | Faint hex-rune planning overlay above group leader's head. LDR-driven |
| **Devotion act** | Deity shrine interaction, prayer | `'social:devotion'` | Deity overlay intensifies + upward motes in deity color. FTH amplified |
| **Inspiring speech** | Extended local chat with group nearby | `'social:inspire'` | Outward pulse from speaker, soul-color, reaches nearby players. CHA-driven radius |
| **Friendship bond** | Friend request accepted | `'social:friendship'` | Matched soul-color ribbon between the two players, brief spiral, dissolve |
| **Making friends** | Sustained interaction with a stranger (proximity + chat + shared activity) | `'social:befriend'` | Warm convergent motes between the two players, gradually blending their soul colors over the interaction. CHA-driven warmth |
| **Questing together** | Shared quest progress with non-friend players | `'social:quest-together'` | Subtle shared aura shell around the questing group, blended soul colors of participants. LDR-scaled cohesion. Strengthens the longer the group stays together |
| **Social experience** | Attending events, concerts, gatherings, group activities | `'social:shared-experience'` | Ambient crowd shimmer — each participant contributes their soul color to a collective particle field. The more participants, the richer and more varied the visual tapestry. CHA determines individual contribution brightness |
| **Kindness** | Gift, free repair, unsolicited help | `'social:kindness'` | Soft golden motes from the actor. Universal gold, not soul-colored — kindness transcends identity |

#### Social VFX Design Principles

1. **Never intrusive.** Social effects are ambient, not flashy. A conversation shimmer should be noticeable but not distracting. These are not combat explosions.
2. **Always visible to others.** Social identity is public. Nearby players see the effects, reinforcing the social player's presence.
3. **Scale with attributes, not volume.** A CHA 80 player talking once gets a richer effect than a CHA 10 player talking constantly. Quality over quantity.
4. **Compound with deity overlay.** A Faith-bonded social player's devotion effects layer with their deity color. Apollo-bonded helper: warm gold motes. Hades-bonded helper: dark purple motes (still helpful — just flavored differently).
5. **Cooldowns on behavioral triggers.** Conversation shimmer doesn't fire on every chat message. Cooldown: once per 30s of active conversation. Helping motes: once per distinct assist action.

### Creative Axis — Making Visible

**Trigger pattern:** Completion/creation → celebration effect

Creative VFX fire on **acts of creation** — finishing a craft, placing a building, making a discovery, innovating something new. They celebrate the moment of making.

| Moment | Trigger Source | Event | Visual |
|--------|---------------|-------|--------|
| **Craft completion** | Crafting system | `'creative:craft-complete'` | Upward spiral of soul-colored sparks from the workbench/hands. CRE-scaled density. Quality of craft affects intensity — masterwork item = larger burst |
| **Building placed** | Building system | `'creative:build-placed'` | Ground ring expands from placement point, soul-color. ART-scaled: higher ART = more geometric/beautiful ring pattern |
| **Building dedicated** | Building completion ceremony | `'creative:build-complete'` | Full aura shell around the structure, builder's soul color, 3s hold then fade. Visible to all nearby |
| **Innovation discovery** | First-time craft/build/combo | `'creative:innovation'` | Eureka flash above head (white-gold) + brief geometric afterimage. INN-driven intensity |
| **Artistic flourish** | High-quality build/craft exceeds threshold | `'creative:flourish'` | Soul-colored ribbon trails briefly trace the outline of the created object |
| **Tool use** | Extended tool interaction | `'creative:tool-active'` | Subtle hand-glow while tools are active. Soul color, low intensity. MAG+CRE drives brightness |
| **Seed planting** | Seed system | `'creative:seed-planted'` | Green-gold motes descend into the ground at plant point. FTH tint if deity-bonded |
| **Seed matured** | Seed system maturation | `'creative:seed-matured'` | Upward burst of organic motes from the seed location. CRE + natural green blend |
| **Donation** | Object donated to community | `'creative:donation'` | Warm golden pulse outward from donated object. Connection essence visual |
| **Collaboration** | Multi-player build/craft | `'creative:collaborate'` | Blended soul-colors from all contributors swirl around the work-in-progress |

#### Creative VFX Design Principles

1. **Celebrate the object, not just the player.** Craft completion effects center on the workbench/creation point. Building effects trace the building. The soul is in the work.
2. **Quality over quantity.** A masterwork craft gets a bigger burst than a routine one. Don't spam effects on every single action — reserve visual celebration for meaningful completions.
3. **Organic particle styles for Creative axis.** Default to `'organic'` particle style for Creative VFX. Geometric only when INN is dominant (Innovation leans structural).
4. **Blend with environment.** Creative effects should feel like they belong in the world — growing from the ground, tracing building edges, spiraling around crafting stations. Not floating in empty space.

---

## New Archetype Definitions

These archetypes serve Social and Creative moments. They are gentler, more ambient, and shorter-lived than combat archetypes.

```json
{
  "id": "social_shimmer",
  "description": "Ambient conversation/interaction effect",
  "phases": {
    "onset": {
      "duration": 0.3,
      "effects": [
        { "primitive": "aura_shell", "scale": [0.5, 1.0], "opacity": [0, 0.2] }
      ]
    },
    "hold": {
      "duration": 99,
      "effects": [
        { "primitive": "healing_motes", "count": 3, "speed": 0.3 }
      ]
    },
    "fade": {
      "duration": 0.5,
      "effects": [
        { "primitive": "aura_shell", "opacity": [0.2, 0] }
      ]
    }
  },
  "loopPhase": "hold"
}
```

```json
{
  "id": "inspire_pulse",
  "description": "Outward social pulse from inspiring action",
  "phases": {
    "gather": {
      "duration": 0.2,
      "effects": [
        { "primitive": "energy_orb", "scale": [0.1, 0.5], "opacity": [0, 0.8] }
      ]
    },
    "release": {
      "duration": 0.4,
      "effects": [
        { "primitive": "ground_ring", "scale": [0, 6.0], "speed": 3.0 },
        { "primitive": "healing_motes", "count": 8, "speed": 0.5 }
      ]
    }
  }
}
```

```json
{
  "id": "craft_completion",
  "description": "Upward spiral on crafting success",
  "phases": {
    "spark": {
      "duration": 0.2,
      "effects": [
        { "primitive": "impact_flash", "spread": 0.5, "intensity": 0.4 }
      ]
    },
    "spiral": {
      "duration": 1.5,
      "effects": [
        { "primitive": "particle_burst", "count": 20, "speed": 2.0 },
        { "primitive": "healing_motes", "count": 6, "speed": 0.8 }
      ]
    }
  }
}
```

```json
{
  "id": "eureka_flash",
  "description": "Discovery/innovation moment",
  "phases": {
    "flash": {
      "duration": 0.15,
      "effects": [
        { "primitive": "impact_flash", "spread": 0.8, "intensity": 0.6 }
      ]
    },
    "afterimage": {
      "duration": 0.8,
      "effects": [
        { "primitive": "hex_rune", "opacity": [0.7, 0], "rotation": 2.0 }
      ]
    }
  }
}
```

```json
{
  "id": "kindness_motes",
  "description": "Universal golden motes for acts of kindness",
  "phases": {
    "rise": {
      "duration": 2.0,
      "effects": [
        { "primitive": "healing_motes", "count": 5, "speed": 0.4 }
      ]
    }
  }
}
```

```json
{
  "id": "connection_ribbon",
  "description": "Brief ribbon between two connected players",
  "phases": {
    "form": {
      "duration": 0.5,
      "effects": [
        { "primitive": "ribbon_trail", "width": 0.1, "length": 2.0 }
      ]
    },
    "dissolve": {
      "duration": 1.0,
      "effects": [
        { "primitive": "particle_burst", "count": 8, "speed": 1.5 }
      ]
    }
  }
}
```

---

## New GameEventBus Event Types

```typescript
// Add to GameEvents interface in events/GameEventBus.ts

// Social axis events
'social:conversation': {
  userId: string;
  position: Vec3Like;
  channelType: 'local' | 'say' | 'group';
  nearbyPlayerCount: number;
};
'social:group-formed': {
  leaderId: string;
  memberIds: string[];
  positions: Vec3Like[];
};
'social:assist': {
  helperId: string;
  recipientId: string;
  assistType: 'quest' | 'trade' | 'gift' | 'repair' | 'teach';
  position: Vec3Like;
};
'social:event-participate': {
  userId: string;
  eventId: string;
  contributionValue: number;
  position: Vec3Like;
};
'social:devotion': {
  userId: string;
  deityName: string;
  actType: 'shrine' | 'prayer' | 'offering';
  position: Vec3Like;
};
'social:friendship': {
  userId1: string;
  userId2: string;
  positions: [Vec3Like, Vec3Like];
};
'social:befriend': {
  userId1: string;
  userId2: string;
  interactionDuration: number;  // seconds of sustained interaction
  positions: [Vec3Like, Vec3Like];
};
'social:quest-together': {
  questId: string;
  participantIds: string[];
  positions: Vec3Like[];
  duration: number;             // how long they've been questing together
};
'social:shared-experience': {
  eventId: string;
  participantIds: string[];
  positions: Vec3Like[];
  experienceType: 'event' | 'concert' | 'gathering' | 'ritual' | 'celebration';
};

// Creative axis events
'creative:craft-complete': {
  userId: string;
  itemQuality: number;     // 0-1, drives effect intensity
  craftType: string;
  position: Vec3Like;
};
'creative:build-placed': {
  userId: string;
  buildQuality: number;
  position: Vec3Like;
  buildSize: 'small' | 'medium' | 'large';
};
'creative:build-complete': {
  userId: string;
  position: Vec3Like;
  contributorIds: string[];
};
'creative:innovation': {
  userId: string;
  discoveryType: string;
  position: Vec3Like;
};
'creative:seed-planted': {
  userId: string;
  position: Vec3Like;
};
'creative:seed-matured': {
  userId: string;
  position: Vec3Like;
};
'creative:donation': {
  userId: string;
  recipientType: 'community' | 'player';
  position: Vec3Like;
};
'creative:collaborate': {
  userIds: string[];
  position: Vec3Like;
};
```

---

## Behavioral Trigger Detection

Social and Creative events don't come from button presses. They require **detection systems** that watch for behavioral patterns and emit events when thresholds are met.

### Social Trigger Detection

| Behavior | Detection Method | Cooldown | Threshold |
|----------|-----------------|----------|-----------|
| Conversation | Comms system: local/say messages from user | 30s | 3+ messages in 60s window |
| Group formation | Party system: group create event | Once per group | Immediate |
| Helping | Quest/trade system: assist action logged | 60s per recipient | Immediate |
| Teaching | Mentoring: lower-rank player nearby + lore share | 120s | 2+ lore interactions in 5m |
| Event participation | Event system: contribution registered | 60s | Immediate on contribution |
| Planning | Group chat: 5+ messages from leader in 30s | 120s | Activity spike detection |
| Inspiring speech | Local chat: 5+ nearby players + extended message | 180s | Message length > 100 chars + audience > 4 |
| Devotion | Shrine/ritual system: interaction complete | 300s | Immediate |
| Making friends | Proximity + chat + shared activity with stranger | 300s | 3+ minutes sustained interaction with non-friend |
| Questing together | Quest system: shared progress with non-friend | 60s per group | 2+ players on same quest within 15m |
| Shared experience | Event system: co-attendance | 120s | 3+ players at event location |
| Kindness | Gift system: unprompted gift to another player | 120s | Immediate |

### Creative Trigger Detection

| Behavior | Detection Method | Cooldown | Threshold |
|----------|-----------------|----------|-----------|
| Craft completion | Crafting system: item created | None (per-craft) | Immediate |
| Building placed | Building system: object placed | 5s | Immediate |
| Building dedicated | Building system: structure complete | None (per-building) | Immediate |
| Innovation | First-time craft/build type | None | First occurrence check |
| Tool use | Tool system: active tool timer | 10s | 5s continuous use |
| Seed planted | Seed system: plant action | None | Immediate |
| Donation | Trade system: gift with no return | 60s | Immediate |
| Collaboration | Multi-user proximity + build actions | 30s | 2+ users building within 10m |

---

## Palette Interaction: How Axis Dominance Shapes Non-Combat Effects

The VFXPalette already computes `dominantAxis`. For Social and Creative effects, the palette drives visual character differently than combat:

| Palette Value | Combat Effect | Social Effect | Creative Effect |
|---|---|---|---|
| `soulColor` | Spell projectile color | Shimmer/aura tint | Crafting spark color |
| `emissiveBoost` | Spell brightness | Conversation glow warmth | Tool-use hand glow |
| `particleStyle` | Spell particle shape | Mote shape (feathered for Social) | Spark shape (organic for Creative) |
| `noiseScale` | Spell chaos | Shimmer smoothness (low = graceful, high = exuberant) | Crafting precision (low = clean sparks, high = wild arcs) |
| `particleDensity` | Spell particle count | Mote count around speaker | Spark density on craft |
| `deityOverlay` | Spell deity layer | Devotion effect color | Seed/craft blessing tint |

### Social Players Get Graceful Effects

A CHA 80 / FTH 60 / LDR 50 player with `particleStyle: 'feathered'` and high `emissiveBoost` will have:
- Warm, glowing conversation shimmer (feathered particles, high emissive)
- Wide inspire pulse radius (CHA-driven)
- Bright devotion effects (FTH-driven emissive boost)
- The effects feel radiant, welcoming, expansive

### Creative Players Get Organic Effects

A CRE 70 / ART 65 / INN 50 player with `particleStyle: 'organic'` will have:
- Naturalistic crafting sparks (organic particle shape)
- Building effects that feel grown, not constructed
- Innovation flashes that are bright but brief
- The effects feel alive, emergent, growing

---

## Consequences

**Positive:**
- All four player archetypes get a visual identity, not just fighters and mages
- Social VFX reinforce the social contract — helping, teaching, kindness become *visible*
- Creative VFX celebrate making — the core loop for builders becomes visually rewarding
- Behavioral triggers create emergent visual moments that surprise players
- The system rewards *being* a social/creative player, not just *having* social/creative stats

**Costs & Risks:**
- Behavioral detection adds complexity. False positives (conversation shimmer on spam) need debounce/cooldown.
- Social effects visible to others could feel intrusive if overdone. Subtlety is critical.
- Creative effects on every single block placement would be noise. Quality thresholds are needed.
- New event types require cooperation from comms, building, crafting, and quest teams.

---

## Review Checklist

- [ ] **Comms team:** Can local/say chat activity be emitted as `'social:conversation'` events with minimal overhead?
- [ ] **Building team:** Can object placement emit `'creative:build-placed'` with quality metadata?
- [ ] **Crafting team:** Can craft completion emit `'creative:craft-complete'` with item quality?
- [ ] **Quest team:** Can assist actions be detected and emitted as `'social:assist'`?
- [ ] **All teams:** Are the behavioral cooldowns reasonable? Too frequent = noise. Too rare = invisible.
- [ ] **All teams:** Are Social effects subtle enough to be atmospheric, not distracting?

---

*poqpoq · ADR-VFX-006 · Four-Axis VFX Vocabulary · March 2026*
*Author: Allen Partridge*
*Prerequisite: ADR-VFX-001 (Akashic VFX Authority)*
