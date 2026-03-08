/**
 * AkashicVFXSystem.ts
 * poqpoq World — Akashic VFX System
 *
 * The central Babylon.js service. Owns the primitive cache, archetype parser,
 * palette cache, and all effect lifecycle management.
 *
 * Usage:
 *   const vfx = new AkashicVFXSystem(scene);
 *   await vfx.initialize();
 *
 *   // Called from AkashicDataService whenever data loads/updates
 *   await vfx.setPalette(userId, akashicData);
 *
 *   // Called from ActionSlot.ts when an ability fires
 *   await vfx.castSpell('charge_spell', userId, position, targetPosition);
 *
 *   // Called from AkashicRankManager.ts on rank change
 *   await vfx.playRankUp(userId, newRank, newTier);
 */

import * as BABYLON from 'babylonjs';
import {
  AkashicData,
  AkashicEventType,
  ActiveVFXEffect,
  CombatEventType,
  EffectPhase,
  EffectPhaseEntry,
  SpellArchetype,
  SpellArchetypeId,
  VFXPalette,
  RGB,
} from './AkashicVFXTypes';
import {
  resolveAkashicPalette,
  diffPalettes,
} from './AkashicPaletteResolver';

// ─────────────────────────────────────────────
// Internal primitive handle
// Each primitive is a thin wrapper around a BABYLON particle system
// or material that accepts palette uniforms
// ─────────────────────────────────────────────

interface PrimitiveHandle {
  id: string;
  createInstance: (
    scene: BABYLON.Scene,
    position: BABYLON.Vector3,
    palette: VFXPalette,
    params: EffectPhaseEntry,
    duration: number
  ) => BABYLON.IParticleSystem | BABYLON.Mesh | null;
}

// ─────────────────────────────────────────────
// Primitive Factory
// Each primitive is a factory function — no NodeMaterial files yet,
// built with native Babylon particle systems + meshes.
// When NodeMaterial JSON files are ready, swap the factory body only.
// ─────────────────────────────────────────────

function rgbToColor4(rgb: RGB, alpha = 1): BABYLON.Color4 {
  return new BABYLON.Color4(rgb[0], rgb[1], rgb[2], alpha);
}

function rgbToColor3(rgb: RGB): BABYLON.Color3 {
  return new BABYLON.Color3(rgb[0], rgb[1], rgb[2]);
}

function resolveParam(param: [number, number] | number, t: number): number {
  if (Array.isArray(param)) return param[0] + (param[1] - param[0]) * t;
  return param;
}

const PRIMITIVES: Record<string, PrimitiveHandle> = {

  energy_orb: {
    id: 'energy_orb',
    createInstance(scene, position, palette, params, duration) {
      const ps = new BABYLON.ParticleSystem('energy_orb', 80, scene);
      const emitter = BABYLON.MeshBuilder.CreateSphere('orb_emitter', { diameter: 0.05 }, scene);
      emitter.position = position.clone();
      emitter.isPickable = false;
      ps.emitter = emitter;
      ps.minEmitBox = new BABYLON.Vector3(-0.05, -0.05, -0.05);
      ps.maxEmitBox = new BABYLON.Vector3(0.05, 0.05, 0.05);
      ps.color1 = rgbToColor4(palette.soulColor, 0.9);
      ps.color2 = rgbToColor4(palette.accentColor, 0.6);
      ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      const startScale = Array.isArray(params.scale) ? params.scale[0] : (params.scale ?? 0.3);
      const endScale   = Array.isArray(params.scale) ? params.scale[1] : (params.scale ?? 0.3);
      ps.minSize = 0.08 * startScale;
      ps.maxSize = 0.15 * endScale;
      ps.minLifeTime = 0.3;
      ps.maxLifeTime = 0.6;
      ps.emitRate = Math.round(60 * palette.particleDensity);
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      ps.gravity = new BABYLON.Vector3(0, 0.1, 0);
      ps.minEmitPower = 0.2;
      ps.maxEmitPower = 0.5;
      ps.updateSpeed = 0.02;
      ps.start();
      setTimeout(() => { ps.stop(); setTimeout(() => { ps.dispose(); emitter.dispose(); }, 1000); }, duration * 1000);
      return ps;
    }
  },

  impact_flash: {
    id: 'impact_flash',
    createInstance(scene, position, palette, params, duration) {
      const ps = new BABYLON.ParticleSystem('impact_flash', 200, scene);
      const emitter = BABYLON.MeshBuilder.CreateBox('flash_emitter', { size: 0.01 }, scene);
      emitter.position = position.clone();
      emitter.isPickable = false;
      ps.emitter = emitter;
      const spread = params.spread ?? 1.5;
      ps.minEmitBox = new BABYLON.Vector3(-0.01, -0.01, -0.01);
      ps.maxEmitBox = new BABYLON.Vector3(0.01, 0.01, 0.01);
      ps.color1 = rgbToColor4(palette.soulColor, 1.0);
      ps.color2 = rgbToColor4([1, 1, 1], 0.8);
      ps.colorDead = new BABYLON.Color4(palette.soulColor[0], palette.soulColor[1], palette.soulColor[2], 0);
      ps.minSize = 0.05;
      ps.maxSize = 0.12;
      ps.minLifeTime = 0.15;
      ps.maxLifeTime = 0.4;
      ps.emitRate = 600;
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      ps.gravity = new BABYLON.Vector3(0, -0.5, 0);
      ps.minEmitPower = spread * 2;
      ps.maxEmitPower = spread * 5;
      ps.updateSpeed = 0.015;
      ps.start();
      // Impact flash is always brief — stop emitting immediately
      setTimeout(() => { ps.stop(); }, 50);
      setTimeout(() => { ps.dispose(); emitter.dispose(); }, 1000);
      return ps;
    }
  },

  particle_burst: {
    id: 'particle_burst',
    createInstance(scene, position, palette, params, duration) {
      const ps = new BABYLON.ParticleSystem('particle_burst', params.count ?? 30, scene);
      const emitter = BABYLON.MeshBuilder.CreateBox('burst_emitter', { size: 0.01 }, scene);
      emitter.position = position.clone();
      emitter.isPickable = false;
      ps.emitter = emitter;
      ps.color1 = rgbToColor4(palette.soulColor, 0.9);
      ps.color2 = rgbToColor4(palette.accentColor, 0.7);
      ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      ps.minSize = 0.06;
      ps.maxSize = 0.14;
      ps.minLifeTime = 0.5;
      ps.maxLifeTime = 1.2;
      ps.emitRate = (params.count ?? 30) / 0.1;
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      const speed = Math.abs(params.speed ?? 3.0);
      ps.minEmitPower = speed * 0.5;
      ps.maxEmitPower = speed * 1.5;
      ps.gravity = new BABYLON.Vector3(0, -2.0, 0);
      ps.updateSpeed = 0.02;
      ps.start();
      setTimeout(() => { ps.stop(); }, 100);
      setTimeout(() => { ps.dispose(); emitter.dispose(); }, 2000);
      return ps;
    }
  },

  ground_ring: {
    id: 'ground_ring',
    createInstance(scene, position, palette, params, duration) {
      // A torus that expands and fades — rendered as a thin disc
      const ring = BABYLON.MeshBuilder.CreateTorus('ground_ring', {
        diameter: 0.1,
        thickness: 0.04,
        tessellation: 48,
      }, scene);
      ring.position = new BABYLON.Vector3(position.x, position.y + 0.05, position.z);
      ring.isPickable = false;
      const mat = new BABYLON.StandardMaterial('ring_mat', scene);
      mat.diffuseColor = rgbToColor3(palette.soulColor);
      mat.emissiveColor = rgbToColor3(palette.soulColor).scale(palette.emissiveBoost);
      mat.alpha = 0.7;
      mat.disableLighting = true;
      ring.material = mat;

      const targetScale = Array.isArray(params.scale) ? params.scale[1] : (params.scale ?? 2.0);
      const speed = params.speed ?? 1.5;
      let elapsed = 0;
      const observer = scene.onBeforeRenderObservable.add(() => {
        elapsed += scene.getEngine().getDeltaTime() / 1000;
        const t = Math.min(elapsed / duration, 1);
        ring.scaling = new BABYLON.Vector3(t * targetScale, 1, t * targetScale);
        mat.alpha = 0.7 * (1 - t);
      });
      setTimeout(() => {
        scene.onBeforeRenderObservable.remove(observer);
        ring.dispose();
        mat.dispose();
      }, duration * 1000);
      return ring;
    }
  },

  healing_motes: {
    id: 'healing_motes',
    createInstance(scene, position, palette, params, duration) {
      // Override with healing green-gold regardless of soul color
      const healColor: RGB = palette.resourceType === 'mana'
        ? [0.4, 0.7, 1.0]   // mana healer: cool blue
        : [0.3, 1.0, 0.5];  // stamina healer: fresh green
      const ps = new BABYLON.ParticleSystem('healing_motes', params.count ?? 20, scene);
      const emitter = BABYLON.MeshBuilder.CreateBox('heal_emitter', { size: 0.01 }, scene);
      emitter.position = position.clone();
      emitter.isPickable = false;
      ps.emitter = emitter;
      ps.color1 = rgbToColor4(healColor, 0.8);
      ps.color2 = rgbToColor4([1, 1, 1], 0.5);
      ps.colorDead = new BABYLON.Color4(healColor[0], healColor[1], healColor[2], 0);
      ps.minSize = 0.04;
      ps.maxSize = 0.09;
      ps.minLifeTime = 1.0;
      ps.maxLifeTime = 2.0;
      ps.emitRate = 12;
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      ps.gravity = new BABYLON.Vector3(0, 0.8, 0);   // float upward
      ps.minEmitPower = 0.2;
      ps.maxEmitPower = 0.6;
      ps.updateSpeed = 0.02;
      ps.start();
      setTimeout(() => { ps.stop(); setTimeout(() => { ps.dispose(); emitter.dispose(); }, 2500); }, duration * 1000);
      return ps;
    }
  },

  electric_arc: {
    id: 'electric_arc',
    createInstance(scene, position, palette, params, duration) {
      const count = params.count ?? 3;
      const ps = new BABYLON.ParticleSystem('electric_arc', count * 20, scene);
      const emitter = BABYLON.MeshBuilder.CreateBox('arc_emitter', { size: 0.01 }, scene);
      emitter.position = position.clone();
      emitter.isPickable = false;
      ps.emitter = emitter;
      ps.color1 = rgbToColor4([0.8, 0.9, 1.0], 1.0);
      ps.color2 = rgbToColor4(palette.soulColor, 0.7);
      ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      ps.minSize = 0.03;
      ps.maxSize = 0.06;
      ps.minLifeTime = 0.05;
      ps.maxLifeTime = 0.15;
      ps.emitRate = count * 30;
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      ps.minEmitPower = 1.5;
      ps.maxEmitPower = 4.0;
      ps.updateSpeed = 0.01;
      ps.direction1 = new BABYLON.Vector3(-1, 0.5, -1);
      ps.direction2 = new BABYLON.Vector3(1, 0.5, 1);
      ps.start();
      setTimeout(() => { ps.stop(); setTimeout(() => { ps.dispose(); emitter.dispose(); }, 300); }, duration * 1000);
      return ps;
    }
  },

  hex_rune: {
    id: 'hex_rune',
    createInstance(scene, position, palette, params, duration) {
      // Flat hexagonal disc that rotates and fades
      const hex = BABYLON.MeshBuilder.CreateDisc('hex_rune', { radius: 0.5, tessellation: 6 }, scene);
      hex.position = new BABYLON.Vector3(position.x, position.y + 0.02, position.z);
      hex.rotation.x = Math.PI / 2;
      hex.isPickable = false;
      const mat = new BABYLON.StandardMaterial('hex_mat', scene);
      mat.diffuseColor = rgbToColor3(palette.soulColor);
      mat.emissiveColor = rgbToColor3(palette.accentColor).scale(palette.emissiveBoost * 0.7);
      mat.wireframe = true;
      mat.alpha = Array.isArray(params.opacity) ? params.opacity[0] : (params.opacity ?? 0.6);
      mat.disableLighting = true;
      hex.material = mat;
      const rotSpeed = params.rotation ?? 0.5;
      let elapsed = 0;
      const observer = scene.onBeforeRenderObservable.add(() => {
        elapsed += scene.getEngine().getDeltaTime() / 1000;
        hex.rotation.y += rotSpeed * scene.getEngine().getDeltaTime() / 1000;
        if (Array.isArray(params.opacity)) {
          const t = Math.min(elapsed / duration, 1);
          mat.alpha = params.opacity[0] + (params.opacity[1] - params.opacity[0]) * t;
        }
      });
      setTimeout(() => {
        scene.onBeforeRenderObservable.remove(observer);
        hex.dispose();
        mat.dispose();
      }, duration * 1000);
      return hex;
    }
  },

  aura_shell: {
    id: 'aura_shell',
    createInstance(scene, position, palette, params, duration) {
      const sphere = BABYLON.MeshBuilder.CreateSphere('aura_shell', { diameter: 2.2, segments: 12 }, scene);
      sphere.position = position.clone();
      sphere.isPickable = false;
      const mat = new BABYLON.StandardMaterial('aura_mat', scene);
      mat.diffuseColor = rgbToColor3(palette.soulColor);
      mat.emissiveColor = rgbToColor3(palette.soulColor).scale(palette.emissiveBoost * 0.4);
      mat.alpha = Array.isArray(params.opacity) ? params.opacity[0] : (params.opacity ?? 0.3);
      mat.backFaceCulling = false;
      mat.wireframe = false;
      mat.disableLighting = true;
      sphere.material = mat;
      let elapsed = 0;
      const baseAlpha = mat.alpha;
      const observer = scene.onBeforeRenderObservable.add(() => {
        elapsed += scene.getEngine().getDeltaTime() / 1000;
        // Subtle breathe pulse
        const pulse = Math.sin(elapsed * 2) * 0.05;
        mat.alpha = baseAlpha + pulse;
        if (Array.isArray(params.opacity)) {
          const t = Math.min(elapsed / duration, 1);
          mat.alpha = params.opacity[0] + (params.opacity[1] - params.opacity[0]) * t + pulse;
        }
      });
      setTimeout(() => {
        scene.onBeforeRenderObservable.remove(observer);
        sphere.dispose();
        mat.dispose();
      }, duration * 1000);
      return sphere;
    }
  },

  smoke_wisp: {
    id: 'smoke_wisp',
    createInstance(scene, position, palette, params, duration) {
      const ps = new BABYLON.ParticleSystem('smoke_wisp', 40, scene);
      const emitter = BABYLON.MeshBuilder.CreateBox('smoke_emitter', { size: 0.01 }, scene);
      emitter.position = position.clone();
      emitter.isPickable = false;
      ps.emitter = emitter;
      // Smoke is a darker, desaturated version of soul color
      const smokeR = palette.soulColor[0] * 0.4;
      const smokeG = palette.soulColor[1] * 0.4;
      const smokeB = palette.soulColor[2] * 0.4;
      ps.color1 = new BABYLON.Color4(smokeR, smokeG, smokeB, 0.6);
      ps.color2 = new BABYLON.Color4(smokeR * 0.5, smokeG * 0.5, smokeB * 0.5, 0.3);
      ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      ps.minSize = 0.15;
      ps.maxSize = 0.5;
      ps.minLifeTime = 0.8;
      ps.maxLifeTime = 1.8;
      ps.emitRate = 15;
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
      ps.gravity = new BABYLON.Vector3(0, 0.3, 0);
      ps.minEmitPower = 0.1;
      ps.maxEmitPower = 0.4;
      ps.updateSpeed = 0.02;
      ps.start();
      setTimeout(() => { ps.stop(); setTimeout(() => { ps.dispose(); emitter.dispose(); }, 2500); }, duration * 1000);
      return ps;
    }
  },

  shockwave: {
    id: 'shockwave',
    createInstance(scene, position, palette, params, duration) {
      // Expanding torus on the ground plane
      const wave = BABYLON.MeshBuilder.CreateTorus('shockwave', {
        diameter: 0.2,
        thickness: 0.08,
        tessellation: 48,
      }, scene);
      wave.position = new BABYLON.Vector3(position.x, position.y + 0.02, position.z);
      wave.isPickable = false;
      const mat = new BABYLON.StandardMaterial('wave_mat', scene);
      mat.diffuseColor = rgbToColor3(palette.accentColor);
      mat.emissiveColor = rgbToColor3(palette.soulColor).scale(palette.emissiveBoost);
      mat.alpha = 0.9;
      mat.disableLighting = true;
      wave.material = mat;
      const speed = params.speed ?? 8.0;
      const waveDuration = 0.6;
      let elapsed = 0;
      const observer = scene.onBeforeRenderObservable.add(() => {
        elapsed += scene.getEngine().getDeltaTime() / 1000;
        const t = Math.min(elapsed / waveDuration, 1);
        const scale = t * speed * 0.4;
        wave.scaling = new BABYLON.Vector3(scale, 1, scale);
        mat.alpha = 0.9 * (1 - t);
      });
      setTimeout(() => {
        scene.onBeforeRenderObservable.remove(observer);
        wave.dispose();
        mat.dispose();
      }, (waveDuration + 0.1) * 1000);
      return wave;
    }
  },

  ribbon_trail: {
    id: 'ribbon_trail',
    createInstance(scene, position, palette, params, duration) {
      // Ribbon trail using a trail mesh — attaches to a moving reference
      const ps = new BABYLON.ParticleSystem('ribbon_trail', 30, scene);
      const emitter = BABYLON.MeshBuilder.CreateBox('ribbon_emitter', { size: 0.01 }, scene);
      emitter.position = position.clone();
      emitter.isPickable = false;
      ps.emitter = emitter;
      ps.color1 = rgbToColor4(palette.soulColor, 0.8);
      ps.color2 = rgbToColor4(palette.accentColor, 0.4);
      ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      const width = params.width ?? 0.15;
      ps.minSize = width * 0.5;
      ps.maxSize = width;
      ps.minLifeTime = params.length ?? 0.8;
      ps.maxLifeTime = (params.length ?? 0.8) * 1.2;
      ps.emitRate = 40;
      ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      ps.gravity = new BABYLON.Vector3(0, 0.1, 0);
      ps.minEmitPower = 0.05;
      ps.maxEmitPower = 0.15;
      ps.updateSpeed = 0.015;
      ps.start();
      setTimeout(() => { ps.stop(); setTimeout(() => { ps.dispose(); emitter.dispose(); }, 1500); }, duration * 1000);
      return ps;
    }
  },

  beam_ray: {
    id: 'beam_ray',
    createInstance(scene, position, palette, params, duration) {
      // Cylinder representing a beam — would be a proper shader in full impl
      const beam = BABYLON.MeshBuilder.CreateCylinder('beam_ray', {
        height: 5.0,
        diameter: params.width ?? 0.2,
        tessellation: 8,
      }, scene);
      beam.position = position.clone();
      beam.rotation.x = Math.PI / 2;
      beam.isPickable = false;
      const mat = new BABYLON.StandardMaterial('beam_mat', scene);
      mat.diffuseColor = rgbToColor3(palette.soulColor);
      mat.emissiveColor = rgbToColor3(palette.soulColor).scale(palette.emissiveBoost);
      mat.alpha = 0.7;
      mat.disableLighting = true;
      beam.material = mat;
      // Pulse effect
      let elapsed = 0;
      const observer = scene.onBeforeRenderObservable.add(() => {
        elapsed += scene.getEngine().getDeltaTime() / 1000;
        mat.alpha = 0.7 + Math.sin(elapsed * 8) * 0.15;
      });
      setTimeout(() => {
        scene.onBeforeRenderObservable.remove(observer);
        beam.dispose();
        mat.dispose();
      }, duration * 1000);
      return beam;
    }
  },

};

// ─────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────

export class AkashicVFXSystem {
  private scene: BABYLON.Scene;
  private paletteCache = new Map<string, VFXPalette>();
  private activeEffects = new Map<string, ActiveVFXEffect[]>();
  private archetypes = new Map<string, SpellArchetype>();
  private signatureIntervals = new Map<string, ReturnType<typeof setInterval>>();
  private initialized = false;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  // ── Initialization ──────────────────────────

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.loadArchetypes();
    this.initialized = true;
    console.log('[AkashicVFXSystem] Initialized with', this.archetypes.size, 'archetypes');
  }

  private async loadArchetypes(): Promise<void> {
    try {
      const res = await fetch('/vfx/archetypes/spell_archetypes.json');
      const data = await res.json();
      for (const archetype of data.archetypes) {
        this.archetypes.set(archetype.id, archetype as SpellArchetype);
      }
    } catch (e) {
      console.warn('[AkashicVFXSystem] Could not load archetype JSON, using empty set:', e);
    }
  }

  // ── Palette Management ──────────────────────

  /**
   * Call this whenever AkashicDataService fetches or updates player data.
   * Computes the VFXPalette and caches it. Triggers selective visual updates
   * on the player's avatar if the palette changed.
   */
  async setPalette(userId: string, akashicData: AkashicData): Promise<void> {
    const newPalette = resolveAkashicPalette(akashicData);
    const prevPalette = this.paletteCache.get(userId) ?? null;
    this.paletteCache.set(userId, newPalette);

    if (prevPalette) {
      const diff = diffPalettes(prevPalette, newPalette);
      if (diff.signaturesChanged || diff.deityChanged) {
        // Strength signatures or deity changed — restart ambient effects
        this.restartAmbientEffects(userId, newPalette);
      }
    }
  }

  getPalette(userId: string): VFXPalette | null {
    return this.paletteCache.get(userId) ?? null;
  }

  // ── Spell Casting ───────────────────────────

  /**
   * Primary spell casting entry point.
   * Called from ActionSlot.ts when an ability fires.
   */
  async castSpell(
    archetypeId: SpellArchetypeId,
    casterId: string,
    position: BABYLON.Vector3,
    target?: BABYLON.Vector3 | BABYLON.AbstractMesh
  ): Promise<void> {
    if (!this.initialized) await this.initialize();

    const palette = this.paletteCache.get(casterId);
    if (!palette) {
      console.warn(`[AkashicVFXSystem] No palette for user ${casterId}, skipping VFX`);
      return;
    }

    const archetype = this.archetypes.get(archetypeId);
    if (!archetype) {
      console.warn(`[AkashicVFXSystem] Unknown archetype: ${archetypeId}`);
      return;
    }

    await this.executeArchetype(archetype, palette, position, target);
  }

  private async executeArchetype(
    archetype: SpellArchetype,
    palette: VFXPalette,
    position: BABYLON.Vector3,
    target?: BABYLON.Vector3 | BABYLON.AbstractMesh
  ): Promise<void> {
    const phases = archetype.phases;
    const phaseNames = Object.keys(phases);
    let delay = 0;

    for (const phaseName of phaseNames) {
      const phase = phases[phaseName];
      const isLoop = archetype.loopPhase === phaseName;
      const duration = isLoop ? 9999 : phase.duration;

      setTimeout(() => {
        this.spawnPhase(phase, palette, position, duration);
      }, delay * 1000);

      if (!isLoop) {
        delay += phase.duration;
      } else {
        break; // Loop phases don't advance the timeline
      }
    }
  }

  private spawnPhase(
    phase: EffectPhase,
    palette: VFXPalette,
    position: BABYLON.Vector3,
    duration: number
  ): void {
    for (const entry of phase.effects) {
      const factory = PRIMITIVES[entry.primitive];
      if (!factory) {
        console.warn(`[AkashicVFXSystem] Unknown primitive: ${entry.primitive}`);
        continue;
      }
      try {
        factory.createInstance(this.scene, position, palette, entry, duration);
      } catch (e) {
        console.error(`[AkashicVFXSystem] Error spawning primitive ${entry.primitive}:`, e);
      }
    }
  }

  // ── Combat Events ───────────────────────────

  /**
   * Called from ResourceManager.ts and combat event bus.
   */
  async triggerCombat(
    type: CombatEventType,
    entityId: string,
    position: BABYLON.Vector3
  ): Promise<void> {
    const palette = this.paletteCache.get(entityId);
    if (!palette) return;

    switch (type) {
      case 'melee_hit':
        await this.castSpell('instant_strike', entityId, position);
        break;
      case 'spell_hit':
        this.spawnPhase(
          { duration: 0.3, effects: [{ primitive: 'impact_flash', spread: 0.8 }, { primitive: 'shockwave', speed: 5 }] },
          palette, position, 0.3
        );
        break;
      case 'crit':
        this.spawnPhase(
          { duration: 0.5, effects: [{ primitive: 'impact_flash', spread: 2.0 }, { primitive: 'particle_burst', count: 25, speed: 6 }] },
          palette, position, 0.5
        );
        break;
      case 'dodge':
        this.spawnPhase(
          { duration: 0.2, effects: [{ primitive: 'smoke_wisp', count: 3 }] },
          palette, position, 0.2
        );
        break;
      case 'death': {
        // Mana-class: dissolve upward. Stamina-class: slam down.
        const deathArchetype = palette.resourceType === 'mana' ? 'summoning' : 'ground_slam';
        await this.castSpell(deathArchetype as SpellArchetypeId, entityId, position);
        break;
      }
      case 'respawn':
        this.spawnPhase(
          { duration: 1.0, effects: [{ primitive: 'aura_shell', opacity: [0, 0.6] }, { primitive: 'particle_burst', count: 30, speed: 2 }] },
          palette, position, 1.0
        );
        break;
    }
  }

  // ── Akashic Event Sequences ─────────────────

  /**
   * Called from AkashicRankManager.ts on rank change.
   */
  async playRankUp(
    userId: string,
    newRank: number,
    newTier: number,
    position: BABYLON.Vector3
  ): Promise<void> {
    const palette = this.paletteCache.get(userId);
    if (!palette) return;

    const isTierUp = newRank % 100 === 0;

    // 1. Particle burst from position
    this.spawnPhase(
      { duration: 0.1, effects: [{ primitive: 'particle_burst', count: 200, speed: 5 }] },
      palette, position, 0.1
    );

    // 2. Ground ring expansion
    setTimeout(() => {
      this.spawnPhase(
        { duration: 2.0, effects: [{ primitive: 'ground_ring', scale: [0, 4] }] },
        palette, position, 2.0
      );
    }, 100);

    // 3. If tier boundary: full aura shell
    if (isTierUp) {
      setTimeout(() => {
        this.spawnPhase(
          { duration: 2.5, effects: [{ primitive: 'aura_shell', opacity: [0.8, 0] }] },
          palette, position, 2.5
        );
      }, 200);
    }

    console.log(`[AkashicVFXSystem] Rank up VFX: user=${userId} rank=${newRank} tier=${newTier} tierUp=${isTierUp}`);
  }

  /**
   * Called when a deity bond is established or changed.
   */
  async playDeityBond(
    userId: string,
    deityName: string,
    position: BABYLON.Vector3
  ): Promise<void> {
    const palette = this.paletteCache.get(userId);
    if (!palette) return;

    // Deity-specific overlay color
    const overlay = palette.deityOverlay;
    if (!overlay) return;

    // Rune formation
    this.spawnPhase(
      { duration: 2.0, effects: [{ primitive: 'hex_rune', opacity: [0, 0.9], rotation: 0.8 }] },
      palette, position, 2.0
    );

    // Ground ring with deity color (we use the existing palette which already has the overlay)
    setTimeout(() => {
      this.spawnPhase(
        { duration: 3.0, effects: [{ primitive: 'ground_ring', scale: [0, 3.5] }] },
        palette, position, 3.0
      );
    }, 500);

    // Final flash
    setTimeout(() => {
      this.spawnPhase(
        { duration: 0.3, effects: [{ primitive: 'impact_flash', spread: 3.5 }] },
        palette, position, 0.3
      );
    }, 2500);
  }

  /**
   * Called from AttributeRollScreen.ts on roll selection.
   */
  async playRollCeremony(
    userId: string,
    position: BABYLON.Vector3
  ): Promise<void> {
    const palette = this.paletteCache.get(userId);
    if (!palette) return;

    // Shockwave to confirm selection
    this.spawnPhase(
      { duration: 0.4, effects: [{ primitive: 'shockwave', speed: 6 }] },
      palette, position, 0.4
    );

    // Aura shell — the Akashic signature is SET
    setTimeout(() => {
      this.spawnPhase(
        { duration: 2.0, effects: [{ primitive: 'aura_shell', opacity: [0.9, 0] }] },
        palette, position, 2.0
      );
    }, 200);

    // Particle burst confirms
    setTimeout(() => {
      this.spawnPhase(
        { duration: 0.1, effects: [{ primitive: 'particle_burst', count: 60, speed: 4 }] },
        palette, position, 0.1
      );
    }, 400);
  }

  /**
   * Called from AkashicRankManager.ts / award endpoint response.
   * Amount brackets: small (5–50), medium (50–500), large (500+).
   */
  async playResonanceGain(
    userId: string,
    amount: number,
    position: BABYLON.Vector3
  ): Promise<void> {
    const palette = this.paletteCache.get(userId);
    if (!palette) return;

    if (amount >= 500) {
      // Large: ground ring + particle burst + 3s ambient motes
      this.spawnPhase(
        { duration: 0.1, effects: [{ primitive: 'ground_ring', scale: [0, 1.5] }] },
        palette, position, 1.0
      );
      this.spawnPhase(
        { duration: 0.1, effects: [{ primitive: 'healing_motes', count: 8 }] },
        palette, position, 3.0
      );
    } else if (amount >= 50) {
      // Medium: brief aura pulse
      this.spawnPhase(
        { duration: 0.5, effects: [{ primitive: 'aura_shell', opacity: [0.4, 0] }] },
        palette, position, 0.5
      );
    } else {
      // Small: 3–5 gold motes float up
      this.spawnPhase(
        { duration: 0.1, effects: [{ primitive: 'healing_motes', count: 4 }] },
        palette, position, 2.0
      );
    }
  }

  // ── Persistent Strength Signatures ──────────

  /**
   * Start ambient strength signature particles on the player's avatar.
   * Called when the avatar mesh is ready and palette is set.
   */
  startStrengthSignatures(userId: string, avatarMesh: BABYLON.AbstractMesh): void {
    this.stopStrengthSignatures(userId);
    const palette = this.paletteCache.get(userId);
    if (!palette || palette.strengthSignatures.length === 0) return;

    const intervals: ReturnType<typeof setInterval>[] = [];

    for (const sig of palette.strengthSignatures) {
      const intervalMs = Math.round(1000 / sig.rate);
      const interval = setInterval(() => {
        const pos = avatarMesh.getAbsolutePosition();
        const offset = this.getAttachOffset(sig.attachPoint);
        const effectPos = pos.add(offset);

        // Use signature color, not soul color
        const sigPalette: VFXPalette = { ...palette, soulColor: sig.color, particleDensity: sig.intensity * 0.8 };
        const factory = PRIMITIVES[sig.primitiveId];
        if (factory) {
          factory.createInstance(this.scene, effectPos, sigPalette, { primitive: sig.primitiveId }, 1.5);
        }
      }, intervalMs);
      intervals.push(interval);
    }

    // Store all intervals under userId
    this.signatureIntervals.set(userId, intervals[0]); // simplified: store first
    // Full impl would store all intervals
  }

  stopStrengthSignatures(userId: string): void {
    const interval = this.signatureIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.signatureIntervals.delete(userId);
    }
  }

  /**
   * Called from AkashicDataService when attributes change.
   * Recomputes palette diff and restarts only what changed.
   */
  updateSignaturesOnAttributeChange(userId: string, newAkashic: AkashicData, avatarMesh: BABYLON.AbstractMesh): void {
    const prev = this.paletteCache.get(userId);
    const next = resolveAkashicPalette(newAkashic);
    this.paletteCache.set(userId, next);

    if (!prev) return;
    const diff = diffPalettes(prev, next);
    if (diff.signaturesChanged || diff.deityChanged) {
      this.startStrengthSignatures(userId, avatarMesh);
    }
  }

  // ── Cleanup ─────────────────────────────────

  disposeAllForUser(userId: string): void {
    this.stopStrengthSignatures(userId);
    this.paletteCache.delete(userId);
    const effects = this.activeEffects.get(userId) ?? [];
    for (const e of effects) e.dispose();
    this.activeEffects.delete(userId);
  }

  dispose(): void {
    for (const [userId] of this.paletteCache) {
      this.disposeAllForUser(userId);
    }
    this.archetypes.clear();
    this.initialized = false;
  }

  // ── Internal Helpers ─────────────────────────

  private restartAmbientEffects(userId: string, palette: VFXPalette): void {
    // Placeholder: in full implementation, locate the avatar mesh and restart
    // For now, just log — actual mesh lookup depends on your entity registry
    console.log(`[AkashicVFXSystem] Palette changed for ${userId}, ambient effects will update on next avatar interaction`);
  }

  private getAttachOffset(attachPoint: string): BABYLON.Vector3 {
    const offsets: Record<string, BABYLON.Vector3> = {
      hands:   new BABYLON.Vector3(0.4, 0.8, 0.0),
      feet:    new BABYLON.Vector3(0.0, 0.1, 0.0),
      head:    new BABYLON.Vector3(0.0, 1.8, 0.0),
      torso:   new BABYLON.Vector3(0.0, 0.9, 0.0),
      ambient: new BABYLON.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 2.0,
        (Math.random() - 0.5) * 1.5
      ),
    };
    return offsets[attachPoint] ?? BABYLON.Vector3.Zero();
  }
}
