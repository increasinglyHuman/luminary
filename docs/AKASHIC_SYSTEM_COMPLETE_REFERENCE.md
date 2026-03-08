# The Akashic System — Complete Reference

**poqpoq World — Soul-Level Progression Engine**
**Date:** 2026-03-08
**Status:** Active reference document
**Author:** Allen Partridge + Claude

---

## Overview

The Akashic system is the **soul-level progression** of poqpoq World. It tracks who you ARE, not what you LOOK like. Avatars change, outfits change — the Akashic Record persists.

**Core philosophy:** *"Progression you earn, attributes you discover, blessings you choose."*

Three layers:
- **Essences** — soul currencies that grow from everything you do
- **Attributes** — 12 specific capabilities shaped by stat rolls, deity bonds, and quests
- **Strengths** — 36 derived combo traits reflecting your play style

Plus two supporting systems:
- **Rank & Titles** — LitRPG-style progression with rainbow badge tiers
- **Combat Stats** — derived resource pools and damage/defense values

---

## Layer 1: Essences (Soul Currencies)

Essences grow passively from all activity. They're the "XP bar" — they grow no matter what you do, but quality matters more than quantity.

| Essence | Source | Purpose |
|---------|--------|---------|
| **Resonance** | Everything | Primary currency, rank progression |
| **Wisdom** | Quests, lore, learning | Unlock interpretations |
| **Creativity** | Building, donations | Generate content |
| **Connection** | Social, helping | Amplify activities |

### Resonance (Primary Essence)

Resonance is the master currency. It drives rank progression, deity bonding costs, and is the primary measure of a player's engagement with the world.

**Award philosophy:** Generous — the system wants you to level up. But the *interesting* path yields more than the *obvious* one:
- Unexpected paths and alternate behaviors
- Community contribution (building, teaching, lore creation)
- Small kindnesses and social acts
- Exploration and discovery

---

## Layer 2: The 12-Attribute Model (4 Axes)

```
Physical Axis (Body & Action)    Mental Axis (Mind & Thought)
  STR  Strength  — HP, melee       MAG  Magic     — mana, spell damage
  AGI  Agility   — dodge, speed    WIS  Wisdom    — mana regen, spell resist
  END  Endurance — stamina, DR     CUN  Cunning   — crit, trap detection

Social Axis (Spirit & Connection) Creative Axis (Soul & Making)
  LDR  Leadership — party buffs     CRE  Creativity — crafting quality
  FTH  Faith      — blessing amp    ART  Artistry   — build aesthetics
  CHA  Charisma   — vendor, NPC     INN  Innovation — cooldowns, discoveries
```

### Attribute Properties

| Property | Value |
|----------|-------|
| Range | 0–100 |
| Default (pre-roll) | 10 |
| Post-roll range | 5–10 (base 5 + up to 5 bonus) |
| Growth sources | Deity blessings, quests, gameplay activity |
| Soft cap (base) | 50 |
| Hard cap (legendary) | 100 |
| Rerolling | **None. Ever. By design.** |

### Starting Attributes: The Roll Ceremony (ADR-046)

Every new player participates in the **Attribute Roll Ceremony** during character creation:

1. Server generates **3 complete stat rolls** in a single request
2. Player reviews all three side-by-side
3. Player picks the one they like best — no re-rolls, no fishing

#### Roll Formula

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Per-stat base | 5 | No stat is useless — everyone can cast a little, swing a little |
| Per-stat max bonus | +5 | Ceiling of 10 keeps early game balanced |
| Per-stat range | 5–10 | Tight range; growth comes from gameplay |
| Bonus pool | 24 | Distributed randomly across 12 stats |
| Roll total (fixed) | 84 | Base 60 + bonus 24 — every roll has the same total power |
| Spare points (fixed) | 36 | Budget 120 - roll 84 — banked for later spending |
| Total character budget | 120 | Equal for all players |

```typescript
function generateSingleRoll(): Record<string, number> {
  const attributes: Record<string, number> = {};
  for (const stat of STATS) attributes[stat] = 5; // base
  let remaining = 24;
  while (remaining > 0) {
    const eligible = STATS.filter(s => attributes[s] < 10);
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    attributes[pick]++;
    remaining--;
  }
  return attributes;
}
```

**Key:** Every roll totals exactly 84. The three rolls differ only in *distribution* — one might favor Physical stats, another Mental, a third might be balanced. The choice is about character identity, not power level.

#### Spare Points: The Temptation Funnel

The 36 spare points go into `unspent_attribute_points` but **cannot be allocated during creation**. As the player progresses, they encounter escalating offers:

1. **Early game (levels 1–5)**: Vendors offer vanity purchases — silly hats, cosmetic effects. Bad deals, but tempting.
2. **Mid game (levels 5–15)**: Trade goods, crafting materials, temporary buffs. Reasonable value, but not permanent power.
3. **Late game (levels 15+)**: Through quest chains, deity bonds, and Akashic milestones, the player discovers the ability to slot attribute points into actual stats.

Patient players who resist the vanity shop get meaningful advantages. Both paths are valid — the game rewards patience without punishing impulse.

### Attribute Growth: Activity-Driven

Beyond the roll ceremony, attributes grow through gameplay. Sources and awards:

| Source | Typical Award | Example |
|--------|--------------|---------|
| Deity bonding | +6 primary, +4 secondary | Artemis: +6 AGI, +4 CUN |
| Deity blessing | +5/+5 (varies by deity) | Athena Owl's Insight: +6 WIS, +4 CUN |
| Quest completion | +1 to +5 per attribute | Story quests award thematic stats |
| Token collection | +5 Resonance | World exploration |
| Activity-driven | +1 per threshold | +1 Magic per 10 tool uses |

**Growth rate limits:**
- Soft caps at 50 (without blessings), 100 (legendary)
- Diminishing returns after 30
- Most activities grant +1, not +10
- Time-gated: 1 attribute point per activity type per day max

### Attribute Gameplay Effects

#### STR — Strength

| Level | Melee Damage | Carry Capacity | Building Size |
|-------|-------------|----------------|---------------|
| 0–20 | Base | 10 objects | Small buildings |
| 21–40 | +20 | 25 objects | Medium buildings |
| 41–60 | +40 | 50 objects | Large buildings |
| 61–80 | +60 | 100 objects | Massive buildings |
| 81–100 | +80 | Unlimited | Mega structures |

#### AGI — Agility

| Level | Movement Speed | Jump Height | Special |
|-------|---------------|-------------|---------|
| 0–20 | 1.0x | 1.0x | — |
| 21–40 | 1.25x | 1.5x | Double jump |
| 41–60 | 1.5x | 2.0x | Wall climb |
| 61–80 | 2.0x | 3.0x | Air dash |
| 81–100 | 3.0x | 5.0x | Flight |

#### MAG — Magic

| Level | Tool Power | World Modification | Special |
|-------|-----------|-------------------|---------|
| 0–20 | Basic | Small objects only | — |
| 21–40 | Enhanced | Medium objects | Unlock weather control |
| 41–60 | Advanced | Large objects | Unlock time dilation |
| 61–80 | Master | Massive objects | Unlock building creation |
| 81–100 | Reality bender | No limits | Unlock reality alteration |

#### FTH — Faith

| Level | Companion Power | Blessing Strength | Passive Bonuses |
|-------|----------------|-------------------|-----------------|
| 0–20 | Basic responses | 1.0x | — |
| 21–40 | Enhanced guidance | 1.0x → 1.25x | +5% resonance gain |
| 41–60 | Proactive help | 1.25x → 1.5x | +10% resonance, quest hints |
| 61–80 | Divine intervention | 1.5x → 1.75x | +15% resonance, rare spawns |
| 81–100 | Avatar of deity | 1.75x → 2.0x | +25% resonance, miracles |

#### CUN — Cunning

| Level | Secret Vision | Puzzle Hints | Discovery Range |
|-------|--------------|--------------|-----------------|
| 0–20 | Hidden paths shimmer | 1 hint per puzzle | 5m |
| 21–40 | Secrets glow | 2 hints per puzzle | 15m |
| 41–60 | X-ray vision | 3 hints per puzzle | 30m |
| 61–80 | Treasure sense | Auto-solve simple | 50m |
| 81–100 | Omniscient vision | Auto-solve all | Global |

#### CHA — Charisma

| Level | Group Size | Social Bonuses | Influence Range |
|-------|-----------|----------------|-----------------|
| 0–20 | 3 players | — | 10m |
| 21–40 | 5 players | +10% group resonance | 25m |
| 41–60 | 10 players | +20% group resonance | 50m |
| 61–80 | 25 players | +30% group resonance | 100m |
| 81–100 | 100 players | +50% group resonance | Global |

#### END, WIS, LDR, CRE, ART, INN

These 6 attributes exist in the DB and are awarded by deity blessings, but have **no gameplay code yet**. This is intentional: horizontal expansion adds breadth without power creep. Proposed future effects:

| Attribute | Proposed Effect |
|-----------|----------------|
| END Endurance | Stamina pool (primary), damage reduction (END × 0.2%) |
| WIS Wisdom | Mana regen (WIS × 0.15/tick), spell resist (WIS × 0.3%) |
| LDR Leadership | Party buff (LDR × 0.5% to group stats) |
| CRE Creativity | Craft quality bonus (CRE × 1%) |
| ART Artistry | Build aesthetic score multiplier |
| INN Innovation | Cooldown reduction (INN × 0.3%) |

---

## Layer 3: Derived Strengths (36 Combo Traits)

Every pair of attributes produces a **derived strength** — a named trait representing what emerges when two capabilities combine. There are 36 total: 12 within-axis and 24 cross-axis.

**Formula:** `strength_value = floor((statA + statB) / 2)`

These are **never stored in the DB** — computed on the fly from the 12 base attributes. When attributes change, strengths update automatically.

### Within-Axis Strengths (12)

| # | Axis | Stats | Strength | Word | Description |
|---|------|-------|----------|------|-------------|
| 1 | Physical | STR+AGI | Prowess | Athletic | Raw athletic ability |
| 2 | Physical | STR+END | Fortitude | Tough | Sustained brute force |
| 3 | Physical | AGI+END | Resilience | Tenacious | Outlast and evade |
| 4 | Mental | MAG+WIS | Insight | Learned | Deep arcane understanding |
| 5 | Mental | MAG+CUN | Deception | Sly | Tricky spellwork |
| 6 | Mental | WIS+CUN | Perception | Sharp | Reading the room (and the trap) |
| 7 | Social | LDR+FTH | Devotion | Devout | Inspire faith in others |
| 8 | Social | LDR+CHA | Authority | Commanding | Commanding presence |
| 9 | Social | FTH+CHA | Diplomacy | Persuasive | Gentle persuasion |
| 10 | Creative | CRE+ART | Craftsmanship | Artful | Beautiful functional works |
| 11 | Creative | CRE+INN | Invention | Inventive | Novel solutions from nothing |
| 12 | Creative | ART+INN | Vision | Visionary | Aesthetic breakthroughs |

### Cross-Axis Strengths (24)

Each stat appears exactly **4 times** across these 24 strengths — no attribute dominates the strength space.

| # | Axes | Stats | Strength | Word | Description |
|---|------|-------|----------|------|-------------|
| 13 | Phys × Mental | STR+MAG | Battlemage | Powerful | Power channeled through force |
| 14 | Phys × Mental | AGI+CUN | Assassin's Edge | Lethal | Speed meets trickery |
| 15 | Phys × Mental | END+WIS | Battle Sense | Vigilant | Awareness under pressure |
| 16 | Phys × Mental | END+CUN | Tenacity | Gritty | Outlast the clever and the cruel |
| 17 | Phys × Social | STR+LDR | Warlord | Dominant | Strength that commands |
| 18 | Phys × Social | AGI+FTH | Zealot | Fervent | Swift in service of belief |
| 19 | Phys × Social | AGI+CHA | Showmanship | Dazzling | Grace under spotlight |
| 20 | Phys × Social | END+LDR | Sentinel | Unyielding | Stand firm, hold the line |
| 21 | Phys × Creative | STR+ART | Sculpture | Bold | Strength given form |
| 22 | Phys × Creative | STR+CRE | Forge | Rugged | Raw shaping power |
| 23 | Phys × Creative | END+INN | Trailblazing | Relentless | Endure the unknown path |
| 24 | Phys × Creative | AGI+INN | Improvisation | Resourceful | Adapt on the fly |
| 25 | Mental × Social | MAG+FTH | Prophecy | Prophetic | Arcane meets divine |
| 26 | Mental × Social | WIS+CHA | Enchantment | Beguiling | Insight becomes influence |
| 27 | Mental × Social | CUN+LDR | Manipulation | Cunning | Cunning command |
| 28 | Mental × Social | MAG+CHA | Mesmerism | Entrancing | Magic wrapped in charm |
| 29 | Mental × Creative | WIS+CRE | Synthesis | Thoughtful | Understanding births creation |
| 30 | Mental × Creative | WIS+ART | Runecraft | Precise | Knowledge etched in beauty |
| 31 | Mental × Creative | CUN+INN | Eureka | Brilliant | The unexpected breakthrough |
| 32 | Mental × Creative | MAG+ART | Arcane Design | Esoteric | Spells with style |
| 33 | Social × Creative | LDR+CRE | Patronage | Influential | Lead the makers |
| 34 | Social × Creative | CHA+ART | Performance | Captivating | Charm made visible |
| 35 | Social × Creative | FTH+INN | Inspiration | Inspiring | Belief sparks the new |
| 36 | Social × Creative | FTH+CRE | Devotecraft | Sacred | Faith made tangible |

### Strengths on the Roll Screen

For each roll, the **top 3 strengths** are surfaced as the roll's identity. This transforms the choice from "which numbers do I like" into "who do I want to be":

```
Roll A                    Roll B                   Roll C
"The Battlemage"          "The Oracle"             "The Artisan"
  Powerful                  Wise                     Artful
  Strategic                 Devout                   Visionary
  Athletic                  Persuasive               Graceful
```

Numeric values are **hidden** on the roll screen. Players see one-word descriptors and strength names — identity discovery, not number optimization.

---

## Strengths (Meta-Skills)

Separate from derived strengths, there are 3 **meta-strengths** that track play style:

| Strength | Range | Measures |
|----------|-------|----------|
| Discovery | 0–100 | Exploration, finding secrets, visiting zones |
| Interpretation | 0–100 | Understanding lore, solving puzzles, reading the world |
| Influence | 0–100 | Social impact, helping others, leading groups |

These grow passively based on how you play — they're the system's "personality profile."

---

## Combat Stat Formulas

Attributes feed directly into combat resource pools and damage calculations.

### Resource Pools

| Stat | Formula | Notes |
|------|---------|-------|
| Max HP | `100 + (STR × 5) + (level × 5)` | Strength is king for HP |
| Max Mana | `50 + (primaryAttr × 5) + (secondaryAttr × 2) + (level × 2)` | For mana-class characters |
| Max Stamina | `100 + (primaryAttr × 3) + (secondaryAttr × 2) + (level × 3)` | For stamina-class characters |

**Resource type auto-detection:** The character's highest attribute determines their primary resource type:
- Magic / Faith / Charisma highest → **Mana** class
- Strength / Agility / Cunning highest → **Stamina** class

### Combat Derived Stats

| Stat | Formula | Cap |
|------|---------|-----|
| Melee Damage | `10 + (STR × 2)` | None |
| Spell Damage | `10 + (MAG × 3)` | None |
| Dodge Chance | `AGI × 0.5%` | 50% at AGI 100 |
| Crit Chance | `CUN × 0.4%` | 40% at CUN 100 |
| Rank HP Bonus | `floor(rank / 10) × 50` | Scales with progression |

### Regeneration Rates

Regeneration uses a 100ms tick rate (10 ticks/second). In combat, health regen is **zero** and primary resource regen is reduced.

#### Out of Combat

| Resource | Formula (per second) |
|----------|---------------------|
| Health | `1 + (level × 0.1) + ((STR + AGI) / 2 × 0.05) + (rank × 0.05)` |
| Mana | `5 + (level × 0.5) + (MAG × 0.1) + (rank × 0.2)` |
| Stamina | `10 + (level × 1.0) + (STR × 0.2) + (rank × 0.3)` |

#### In Combat

| Resource | Modifier |
|----------|----------|
| Health | **0%** — no health regen in combat |
| Mana | **30%** — 70% reduction |
| Stamina | **50%** — 50% reduction |

### Proposed Future Expansions

| Stat | Addition | Rationale |
|------|----------|-----------|
| HP | + END × 3 | Endurance as secondary HP source |
| Stamina | 100 + END × 4 + STR × 1 | Endurance becomes stamina primary |
| Mana Regen | + WIS × 0.15 per tick | Wisdom feeds sustainability |
| Spell Resist | WIS × 0.3% | Wisdom counters magic |
| Dmg Reduction | END × 0.2% | Endurance counters physical |
| Party Buff | LDR × 0.5% to group | Leadership has group utility |
| Craft Quality | CRE × 1% bonus | Creativity matters for builders |
| Cooldown Red. | INN × 0.3% | Innovation rewards ability spam |

---

## Rank & Title System

### Rank Progression

Rank is driven entirely by Resonance:

**Formula:** `rank = floor(sqrt(resonance / 200))`

| Resonance | Rank |
|-----------|------|
| 200 | 1 |
| 800 | 2 |
| 1,800 | 3 |
| 5,000 | 5 |
| 20,000 | 10 |
| 50,000 | 15 |
| 200,000 | 31 |

**Resonance for next rank:** `200 × (rank + 1)²`

### LitRPG Titles (Cycling Every 100 Ranks)

| Local Rank (rank % 100) | Title |
|--------------------------|-------|
| 0–9 | Noob |
| 10–19 | Fledgling |
| 20–29 | Adventurer |
| 30–39 | Pathfinder |
| 40–49 | Veteran |
| 50–59 | Sage |
| 60–69 | Champion |
| 70–79 | Grandmaster |
| 80–89 | Mythic |
| 90–99 | Transcendent |

Titles cycle every 100 ranks — at rank 115, the title is "Fledgling" again, but the badge tier color changes.

### Rainbow Badge Tier System

The rank badge displays `rank % 100` and changes color by tier through an HSL hue sweep:

| Tier | Rank Range | Name | Hue (HSL) |
|------|-----------|------|-----------|
| 0 | 0–99 | Emerald | 145° (green) |
| 1 | 100–199 | Jade | 158° |
| 2 | 200–299 | Teal | 171° |
| 3 | 300–399 | Azure | 185° |
| 4 | 400–499 | Sapphire | 198° |
| 5 | 500–599 | Cobalt | 211° |
| 6 | 600–699 | Indigo | 224° |
| 7 | 700–799 | Violet | 237° |
| 8 | 800–899 | Amethyst | 250° |
| 9 | 900–999 | Magenta | 264° |
| 10 | 1000–1099 | Rose | 277° |
| 11 | 1100–1199 | Crimson | 290° |
| 12 | 1200–1299 | Scarlet | 303° |
| 13 | 1300–1399 | Ember | 316° |
| 14 | 1400–1499 | Amber | 330° |
| 15 | 1500–1599 | Copper | 343° |
| 16 | 1600–1699 | Bronze | 356° |
| 17 | 1700–1799 | Silver | 9° |
| 18 | 1800–1899 | Gold | 22° |
| 19 | 1900–1999 | Eternal | 35° |

**HSL sweep formula:** `hue = (145 + (tier / 99) × 263) % 360`

**100 tiers × 100 ranks = 10,000 levels.** Only 20 are named. At tier > 0, the panel shows "Jade Fledgling" (tier name + rank title). Badge border glow and identity background all use the tier's hue via CSS custom properties.

### Seed Capacity by Rank

| Rank | Seeds |
|------|-------|
| 1–9 | 3 |
| 10–29 | 5 |
| 30–49 | 8 |
| 50–69 | 12 |
| 70–89 | 20 |
| 90+ | 999 (unlimited) |

---

## Deity System

### Faith Amplification

Faith (0–100) scales the blessing bonus multiplier:

| Faith Range | Amplification |
|-------------|---------------|
| 0–20 | 1.0× (no boost) |
| 21–40 | 1.0× → 1.25× (+0.0125 per point) |
| 41–60 | 1.25× → 1.5× |
| 61–80 | 1.5× → 1.75× |
| 81–100 | 1.75× → 2.0× |

**Example:** Artemis blessing (+6 AGI) at Faith 80 = +6 × 1.75 = +10.5 AGI (rounded).

### Deity Roster (14 Visible + 2 Hidden)

| Tier | Deity | Rank Req | Pantheon | Primary Axis |
|------|-------|----------|----------|-------------|
| 1 | Artemis | 1 | Greek | Physical (AGI) |
| 1 | Athena | 1 | Greek | Mental (WIS) |
| 1 | Apollo | 1 | Greek | Social (FTH) |
| 1 | Demeter | 1 | Greek | Creative (CRE) |
| 2 | Mars | 5 | Roman | Physical (STR) |
| 2 | Hermes | 5 | Greek | Mental (CUN) |
| 3 | Freya | 10 | Norse | Social (CHA) |
| 3 | Brigid | 10 | Celtic | Creative (INN) |
| 3 | Echo | 10 | Greek | Creative (ART) |
| 4 | Odin | 15 | Norse | Mental (MAG) |
| 4 | Morrigan | 15 | Celtic | Social (LDR) |
| 5 | Tyr | 20 | Norse | Physical (END) |
| 5 | Loki | 20 | Norse | Mental (CUN+INN) |
| Hidden | Bob | 30 | Meta | ALL (+3 each!) |
| Hidden | Thoth | Special | Egyptian | Mental (WIS) |

### Deity Blessing Matrix (Starter Deities)

#### Artemis (Goddess of the Hunt) — Rank 1+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Moon's Grace | +5 AGI | +3 CUN | Swift hunter |
| Hunter's Precision | +5 CUN | +3 STR | Tracker |
| Nature's Bond | +5 FTH | +3 CHA | Beast master |

#### Athena (Goddess of Wisdom) — Rank 1+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Owl's Insight | +5 CUN | +3 MAG | Scholar |
| Battle Strategy | +5 STR | +3 CHA | Leader |
| Divine Wisdom | +5 FTH | +3 CUN | Oracle |

#### Aphrodite (Goddess of Beauty) — Rank 1+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Enchanting Presence | +5 CHA | +3 FTH | Social butterfly |
| Artistic Vision | +5 MAG | +3 CHA | Creator |
| Passionate Heart | +5 FTH | +3 STR | Devotee |

### Advanced Deity Blessings

#### Hephaestus (God of Forges) — Rank 10+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Smith's Mastery | +5 STR | +3 MAG | Builder |
| Inventor's Spark | +5 MAG | +5 CUN | Innovator |
| Forge's Endurance | +5 STR | +3 FTH | Craftsman |

#### Dionysus (God of Revelry) — Rank 10+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Joyful Chaos | +5 CHA | +3 AGI | Party leader |
| Liquid Courage | +5 STR | +3 CHA | Warrior poet |
| Ecstatic Trance | +5 FTH | +3 MAG | Mystic |

#### Hermes (God of Speed) — Rank 25+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Winged Sandals | +5 AGI | +5 CUN | Explorer |
| Silver Tongue | +5 CHA | +3 AGI | Diplomat |
| Trickster's Wit | +5 CUN | +3 MAG | Prankster |

#### Zeus (King of Gods) — Rank 50+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Thunder's Might | +5 STR | +5 MAG | Warrior mage |
| Divine Authority | +5 CHA | +5 FTH | King |
| Sky's Fury | +5 MAG | +5 AGI | Storm caller |

#### Hades (God of the Underworld) — Rank 75+

| Blessing | Primary | Secondary | Theme |
|----------|---------|-----------|-------|
| Shadow's Embrace | +5 CUN | +5 AGI | Assassin |
| Death's Resolve | +5 STR | +5 FTH | Undying |
| Soul's Insight | +5 MAG | +5 CUN | Necromancer |

### Hidden Deities

**Bob (Meta Deity)** — Rank 30+
- Unlock: Complete all 12 ring quests, return to Ritual Ring at midnight
- Blessing: +3 to ALL attributes (unique — no other deity buffs everything)
- Thematic: meta-awareness, fourth-wall humor

**Thoth (Egyptian)** — Special unlock
- Unlock: Collect 13 Akashic Tablets scattered across the world + complete "Scribe's Test" quest
- Blessing: Massive WIS focus (exact values TBD)
- Thematic: knowledge, record-keeping, the Akashic Record itself

### Bonding Rules

| Rule | Value |
|------|-------|
| Initial bonds | 1 deity |
| Additional bonds unlocked at | Rank 25, 50, 75 |
| Unbonding cost | 1,000 Resonance |
| Faith loss on unbonding | −10 Faith |
| Unbonding cooldown | 7 days before rebonding |

---

## Reward Philosophy

Three distinct reward channels. The questing system must preserve these distinctions:

### Resonance (Soul Currency)
Awarded for unexpected paths, community contribution, small kindnesses, alternate behaviors. Generous — the system wants you to level up.

### Attribute Points (Skill Growth)
Awarded **sparingly and intentionally**. Never randomly, never in bulk. Deity blessings and specific quest completions only. When a quest awards +3 Wisdom, it should feel *meaningful*, not routine.

### Titles (Narrative Rewards)
Earned through **memorable deeds**, not grinding. "The Wanderer" — visited every region. "Lorekeeper" — contributed 50+ tales. "Oathbound" — maintained a deity bond for 30+ days. Titles are the rarest reward.

### Anti-Inflation Principle

Every reward channel has a natural ceiling:
- Resonance → rank → tier cycling (you can always grow, but the rate slows)
- Attributes → soft caps on derived stats (dodge max 50%, crit max 40%)
- Titles → finite supply (you can't grind for them)

New content should add **horizontal breadth** (new axes, new titles, new deity options) rather than **vertical power** (higher stat caps, bigger multipliers).

---

## Anti-Nerf Strategy

Instead of nerfing stats, the system uses:

1. **Natural ceilings** — percentage stats cap organically (AGI × 0.5 → max 50%)
2. **Content scaling** — harder zones/enemies scale with player rank
3. **Horizontal breadth** — new Social/Creative mechanics add options, not power
4. **Resource costs** — deity switching costs Resonance, preventing free respec
5. **Seasonal variety** — events offer cosmetic/social rewards, not stat inflation

---

## Database Schema

### Core Tables

```sql
-- Users table (relevant columns)
ALTER TABLE users
  ADD COLUMN attr_strength INTEGER DEFAULT 10,
  ADD COLUMN attr_agility INTEGER DEFAULT 10,
  ADD COLUMN attr_endurance INTEGER DEFAULT 10,
  ADD COLUMN attr_magic INTEGER DEFAULT 10,
  ADD COLUMN attr_wisdom INTEGER DEFAULT 10,
  ADD COLUMN attr_cunning INTEGER DEFAULT 10,
  ADD COLUMN attr_leadership INTEGER DEFAULT 10,
  ADD COLUMN attr_faith INTEGER DEFAULT 10,
  ADD COLUMN attr_charisma INTEGER DEFAULT 10,
  ADD COLUMN attr_creativity INTEGER DEFAULT 10,
  ADD COLUMN attr_artistry INTEGER DEFAULT 10,
  ADD COLUMN attr_innovation INTEGER DEFAULT 10,
  ADD COLUMN unspent_attribute_points INTEGER DEFAULT 60,
  ADD COLUMN attributes_rolled BOOLEAN DEFAULT FALSE;
```

### Deity Bonding Table

```sql
CREATE TABLE user_deity_bonds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  deity_name VARCHAR(50) NOT NULL,
  blessing_choice VARCHAR(50) NOT NULL,
  bonded_at TIMESTAMP DEFAULT NOW(),
  unbonded_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  blessing_primary_attr VARCHAR(20),
  blessing_primary_bonus INTEGER,
  blessing_secondary_attr VARCHAR(20),
  blessing_secondary_bonus INTEGER,
  faith_at_bonding INTEGER,
  current_amplification FLOAT DEFAULT 1.0,
  UNIQUE(user_id, deity_name, is_active) WHERE is_active = TRUE
);
```

### Attribute Transaction Log

```sql
CREATE TABLE attribute_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  attribute_name VARCHAR(20) NOT NULL,
  amount_change INTEGER NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## NEXUS API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/:userId/akashic` | GET | Full akashic data (rank, essences, attributes) |
| `/akashic/stats/:userId` | GET | Combat stats derived from attributes |
| `/akashic/leaderboard` | GET | Materialized view with RANK() |
| `/akashic/transactions/:userId` | GET | Attribute change audit trail |
| `/akashic/award` | POST | Award resonance/essences |
| `/users/:userId/generate-rolls` | POST | Generate 3 stat rolls for ceremony |
| `/users/:userId/accept-roll` | POST | Accept chosen roll (rollIndex: 0/1/2) |
| `/users/:userId/progression` | GET | Rank, resonance, attributes, attributes_rolled flag |

---

## UI: Akashic Panel

The Akashic Panel is a shelf panel (ADR-016) with progressive disclosure:

### Always Visible
- **Rank badge** with tier color, LitRPG title, resonance progress bar
- **Four essences** (Resonance, Wisdom, Creativity, Connection)

### Behind `<details>` Sections
- **12-attribute SVG radar chart** — 4-axis color-coded (Physical red, Mental blue, Social gold, Creative purple), hover for lore tooltips
- **Strengths** (Discovery, Interpretation, Influence) — 3 progress bars
- **Combat Stats** (HP/Mana/Stamina, melee/spell damage, dodge/crit)

### Tale System
- 177+ lore snippets in `public/data/akashic-tales.json`
- Random selection per panel activation
- Serialized fiction ("The Valley" — 7 episodes, 64 segments)
- Community contributions tracked via GitHub #139

---

## Lore System: Tales from the Record

External JSON-based lore delivery system displayed at the bottom of the Akashic panel.

| Property | Value |
|----------|-------|
| File | `public/data/akashic-tales.json` |
| Count | 177 entries |
| Format | `{ title, tale, series?, episode?, order? }` |
| Loading | Singleton fetch cache with promise coalescing |
| Fallback | 3 hardcoded tales on network failure |
| Selection | Random per panel activation |
| Future | LoreBuilder (#140) with maturity ratings (G/M/A) |

---

## Implementation Reference

### Source Files (World Repo)

| File | Purpose |
|------|---------|
| `src/services/AkashicDataService.ts` | Data layer — fetch, combat calc, rank titles |
| `src/combat/AkashicRankManager.ts` | Rank progression, resonance awards, seed capacity |
| `src/combat/ResourceManager.ts` | HP/Mana/Stamina pools, attribute-driven formulas |
| `src/combat/RegenerationSystem.ts` | Passive regen with combat penalties (100ms tick) |
| `src/combat/CombatLevelManager.ts` | XP/level progression, attribute point awards |
| `src/combat/ActionSlot.ts` | Combat ability interface (costs, cooldowns, targeting) |
| `src/ui/shelves/panels/AkashicPanel.ts` | Full UI panel with radar chart, tales, badges |
| `src/ui/AttributeRollScreen.ts` | Three-column roll ceremony UI |
| `public/data/akashic-tales.json` | 177 lore tales |

### Architecture Decision Records

| ADR | Topic |
|-----|-------|
| ADR-023 | Akashic Panel UI (Phase 1 + 2 + 2b) |
| ADR-046 | Attribute Roll System (3 rolls, 36 strengths) |
| ADR-030b | Combat VFX Phase 2 (nameplates, detail frames) |
| ADR-025 | NPC Combat Architecture |
| ADR-016 | Shelf Panel App Launcher Pattern |

### Database Migrations

| Migration | Content |
|-----------|---------|
| 004 | Akashic tables, rank trigger, leaderboard view |
| 005 | 12 attribute columns, deity bonding table |
| 006 | `unspent_attribute_points` column |
| 019 | `attributes_rolled` flag |

---

## VFX Automation Relevance

For a comprehensive VFX solution that automates based on the Akashic system, the key integration points are:

### Attribute-Driven VFX Triggers
- **Faith level** → deity blessing visual intensity (aura glow, particle density)
- **Magic level** → spell VFX scale, complexity, particle count
- **Rank tier** → badge glow color (HSL sweep), ambient particle effects
- **Resource type** (mana vs stamina) → different VFX palettes (blue/arcane vs green/physical)
- **Combat state** → regen VFX presence/absence, damage flash, death effects

### Event-Driven VFX Moments
- **Rank up** → celebration burst, tier color transition, title announcement
- **Deity bonding** → ritual visual sequence, blessing glow application
- **Roll ceremony** → radar chart animation, strength reveal, shimmer-burst on confirm
- **Resonance gain** → subtle ambient sparkle (intensity scales with amount)
- **Level up** → HP/resource bar expansion animation, stat increase popups

### Derived Strength VFX Identity
- Top 3 strengths from roll → **persistent VFX signature** (e.g., "Battlemage" gets occasional flame+lightning particles around hands)
- Strength changes from attribute growth → VFX signature evolves over time
- 36 unique strength VFX templates needed (or grouped by axis-pair)

### Panel-Integrated VFX
- Radar chart breathes with a subtle glow animation
- Badge pulsing matches tier hue
- Tale reveal uses fade-in with ambient particle drift
- Essence values use shimmer bar fills

---

*poqpoq World — 2026-03-08*
*Akashic System: 4 essences, 12 attributes, 36 derived strengths, 16 deities, 10,000 rank levels*
*AI Engineer: Claude Opus 4.6 | Technical Lead: Allen Partridge*
