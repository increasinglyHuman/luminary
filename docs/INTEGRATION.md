# AkashicVFXSystem — Integration Guide
**poqpoq World | Drop-in wiring for existing source files**

---

## File Placement

```
src/
  vfx/
    AkashicVFXTypes.ts          ← types, no BABYLON dependency
    AkashicPaletteResolver.ts   ← pure resolver, fully testable
    AkashicVFXSystem.ts         ← main service (BABYLON)
    AkashicVFXSystem.test.ts    ← unit tests

public/
  vfx/
    archetypes/
      spell_archetypes.json
```

---

## Step 1 — Global Singleton

Create the system once at app startup, before any scene entities load.

```typescript
// src/World.ts (or wherever your Babylon scene is created)
import { AkashicVFXSystem } from './vfx/AkashicVFXSystem';

export let vfxSystem: AkashicVFXSystem;

async function initWorld(scene: BABYLON.Scene) {
  vfxSystem = new AkashicVFXSystem(scene);
  await vfxSystem.initialize();
  // ... rest of world init
}
```

---

## Step 2 — AkashicDataService.ts

Wire palette computation to every data fetch and update.

```typescript
// src/services/AkashicDataService.ts
import { vfxSystem } from '../World';

class AkashicDataService {
  async fetchAkashicData(userId: string): Promise<AkashicData> {
    const data = await api.get(`/users/${userId}/akashic`);
    
    // ↓ ADD THIS — palette computed whenever data arrives
    await vfxSystem.setPalette(userId, data);
    
    return data;
  }

  async refreshAfterAttributeChange(userId: string, avatarMesh: BABYLON.AbstractMesh): Promise<void> {
    const data = await this.fetchAkashicData(userId);
    
    // ↓ ADD THIS — selective update (only restarts what changed)
    vfxSystem.updateSignaturesOnAttributeChange(userId, data, avatarMesh);
  }
}
```

---

## Step 3 — AkashicRankManager.ts

Fire the rank up ceremony VFX.

```typescript
// src/combat/AkashicRankManager.ts
import { vfxSystem } from '../World';

class AkashicRankManager {
  async awardResonance(userId: string, amount: number, position: BABYLON.Vector3): Promise<void> {
    const prev = this.getRank(userId);
    await api.post('/akashic/award', { userId, amount });
    const next = this.getRank(userId);
    
    // ↓ ADD: resonance gain ambient feedback
    await vfxSystem.playResonanceGain(userId, amount, position);
    
    if (next.rank > prev.rank) {
      // ↓ ADD: rank up ceremony
      await vfxSystem.playRankUp(userId, next.rank, next.rankTier, position);
      
      // Refresh palette with new tier color
      const akashicData = await akashicDataService.fetchAkashicData(userId);
      await vfxSystem.setPalette(userId, akashicData);
    }
  }
}
```

---

## Step 4 — ActionSlot.ts

Connect combat abilities to archetypes.

```typescript
// src/combat/ActionSlot.ts
import { vfxSystem } from '../World';
import { SpellArchetypeId } from './vfx/AkashicVFXTypes';

interface ActionSlotConfig {
  vfxArchetype?: SpellArchetypeId;   // ← ADD this field to your config type
  // ... existing fields
}

class ActionSlot {
  async execute(casterId: string, position: BABYLON.Vector3, target?: BABYLON.Vector3): Promise<void> {
    // ... existing ability logic ...

    // ↓ ADD: fire VFX if archetype configured
    if (this.config.vfxArchetype) {
      await vfxSystem.castSpell(this.config.vfxArchetype, casterId, position, target);
    }
  }
}

// Example slot configurations:
const FIREBALL_SLOT: ActionSlotConfig = {
  vfxArchetype: 'charge_spell',
  // ... existing config
};

const HEAL_SLOT: ActionSlotConfig = {
  vfxArchetype: 'heal_pulse',
  // ...
};

const BARRIER_SLOT: ActionSlotConfig = {
  vfxArchetype: 'shield_bubble',
  // ...
};
```

---

## Step 5 — ResourceManager.ts

Wire combat hit/death/regen events.

```typescript
// src/combat/ResourceManager.ts
import { vfxSystem } from '../World';

class ResourceManager {
  onDamageTaken(entityId: string, amount: number, isCrit: boolean, position: BABYLON.Vector3) {
    // ... existing damage logic ...
    
    // ↓ ADD
    const eventType = isCrit ? 'crit' : 'spell_hit';
    vfxSystem.triggerCombat(eventType, entityId, position);
  }

  onMeleeHit(entityId: string, position: BABYLON.Vector3) {
    // ↓ ADD
    vfxSystem.triggerCombat('melee_hit', entityId, position);
  }

  onDeath(entityId: string, position: BABYLON.Vector3) {
    // ↓ ADD
    vfxSystem.triggerCombat('death', entityId, position);
  }

  onRespawn(entityId: string, position: BABYLON.Vector3) {
    // ↓ ADD
    vfxSystem.triggerCombat('respawn', entityId, position);
  }

  onDodge(entityId: string, position: BABYLON.Vector3) {
    // ↓ ADD
    vfxSystem.triggerCombat('dodge', entityId, position);
  }
}
```

---

## Step 6 — AttributeRollScreen.ts

Wire the roll ceremony confirmation.

```typescript
// src/ui/AttributeRollScreen.ts
import { vfxSystem } from '../World';

class AttributeRollScreen {
  async onRollAccepted(userId: string, rollIndex: number): Promise<void> {
    await api.post(`/users/${userId}/accept-roll`, { rollIndex });
    const akashicData = await akashicDataService.fetchAkashicData(userId);
    
    // ↓ ADD: palette is now set, play ceremony
    const playerPosition = this.getPlayerPosition(userId);
    await vfxSystem.playRollCeremony(userId, playerPosition);
  }
}
```

---

## Step 7 — Avatar Spawn/Despawn

Start and stop persistent strength signatures.

```typescript
// Wherever your avatar mesh is created (e.g., PlayerController or EntityManager)
import { vfxSystem } from '../World';

function onAvatarSpawned(userId: string, avatarMesh: BABYLON.AbstractMesh) {
  // ↓ ADD: start persistent ambient strength signature effects
  vfxSystem.startStrengthSignatures(userId, avatarMesh);
}

function onAvatarDespawned(userId: string) {
  // ↓ ADD: clean up all VFX for this user
  vfxSystem.disposeAllForUser(userId);
}
```

---

## Step 8 — Deity Bonding (user_deity_bonds endpoint response)

```typescript
// Wherever you handle POST /users/:userId/bond-deity response
import { vfxSystem } from '../World';

async function onDeityBondComplete(userId: string, deityName: string, position: BABYLON.Vector3) {
  const akashicData = await akashicDataService.fetchAkashicData(userId);
  await vfxSystem.setPalette(userId, akashicData);  // palette now includes new deity overlay
  await vfxSystem.playDeityBond(userId, deityName, position);
}
```

---

## Adding New Archetypes

1. Add entry to `public/vfx/archetypes/spell_archetypes.json`
2. Add the ID to `SpellArchetypeId` union in `AkashicVFXTypes.ts`
3. Wire to an `ActionSlot` config

That's it — no code changes to the system itself.

---

## Adding New Primitives

1. Add a new entry to the `PRIMITIVES` record in `AkashicVFXSystem.ts`
2. Reference by string ID in any archetype JSON

The factory receives `(scene, position, palette, params, duration)` and must
clean itself up after `duration` seconds. Pattern is always:

```typescript
my_primitive: {
  id: 'my_primitive',
  createInstance(scene, position, palette, params, duration) {
    // create particle system or mesh
    // set colors from palette.soulColor / palette.accentColor
    // schedule cleanup: setTimeout(() => dispose(), duration * 1000)
    return particleSystemOrMesh;
  }
}
```

---

## Running Tests

```bash
# Install test runner (no BABYLON needed — pure logic tests)
npm install --save-dev vitest

# Run
npx vitest run src/vfx/AkashicVFXSystem.test.ts
```

All 14 tests cover the palette resolver. The BABYLON-dependent system itself
is tested via integration/E2E in your existing world test harness.
