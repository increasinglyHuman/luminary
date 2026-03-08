/**
 * AkashicVFXSystem.test.ts
 * poqpoq World — Palette Resolver Unit Tests
 *
 * Run with: npx ts-jest or vitest
 * No BABYLON dependency — tests the pure resolver logic only.
 */

import { resolveAkashicPalette, diffPalettes } from './AkashicPaletteResolver';
import { AkashicData } from './AkashicVFXTypes';

// ─────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────

const BASE_ATTRIBUTES = {
  strength: 10, agility: 10, endurance: 10,
  magic: 10, wisdom: 10, cunning: 10,
  leadership: 10, faith: 10, charisma: 10,
  creativity: 10, artistry: 10, innovation: 10,
};

function makeAkashic(overrides: Partial<AkashicData>): AkashicData {
  return {
    userId: 'test-user',
    attributes: { ...BASE_ATTRIBUTES },
    rank: 1,
    rankTier: 0,
    resonance: 200,
    wisdom: 0,
    creativity: 0,
    connection: 0,
    top3Strengths: [],
    activeDeity: null,
    resourceType: 'mana',
    inCombat: false,
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('AkashicPaletteResolver', () => {

  test('fresh character gets void particle style (low total stats)', () => {
    const akashic = makeAkashic({});
    const palette = resolveAkashicPalette(akashic);
    expect(palette.particleStyle).toBe('void');
    expect(palette.userId).toBe('test-user');
  });

  test('physical-dominant player gets warm ember soul color', () => {
    const akashic = makeAkashic({
      attributes: { ...BASE_ATTRIBUTES, strength: 60, agility: 55, endurance: 50 },
    });
    const palette = resolveAkashicPalette(akashic);
    expect(palette.dominantAxis).toBe('physical');
    // Soul color should be warm (red channel dominant)
    expect(palette.soulColor[0]).toBeGreaterThan(palette.soulColor[2]);
  });

  test('mental-dominant player gets cool violet soul color', () => {
    const akashic = makeAkashic({
      attributes: { ...BASE_ATTRIBUTES, magic: 70, wisdom: 65, cunning: 60 },
    });
    const palette = resolveAkashicPalette(akashic);
    expect(palette.dominantAxis).toBe('mental');
    // Blue channel dominant
    expect(palette.soulColor[2]).toBeGreaterThan(palette.soulColor[0]);
  });

  test('high faith increases emissive boost', () => {
    const lowFaith = makeAkashic({ attributes: { ...BASE_ATTRIBUTES, faith: 5 } });
    const highFaith = makeAkashic({ attributes: { ...BASE_ATTRIBUTES, faith: 95 } });
    const palLow = resolveAkashicPalette(lowFaith);
    const palHigh = resolveAkashicPalette(highFaith);
    expect(palHigh.emissiveBoost).toBeGreaterThan(palLow.emissiveBoost);
    expect(palHigh.emissiveBoost).toBeGreaterThan(1.5);
    expect(palLow.emissiveBoost).toBeLessThan(1.0);
  });

  test('high magic increases particle density', () => {
    const lowMag = makeAkashic({ attributes: { ...BASE_ATTRIBUTES, magic: 5 } });
    const highMag = makeAkashic({ attributes: { ...BASE_ATTRIBUTES, magic: 95 } });
    expect(resolveAkashicPalette(highMag).particleDensity)
      .toBeGreaterThan(resolveAkashicPalette(lowMag).particleDensity);
  });

  test('high cunning produces tighter noise scale', () => {
    const lowCun = makeAkashic({ attributes: { ...BASE_ATTRIBUTES, cunning: 5, magic: 80 } });
    const highCun = makeAkashic({ attributes: { ...BASE_ATTRIBUTES, cunning: 95, magic: 5 } });
    expect(resolveAkashicPalette(highCun).noiseScale)
      .toBeLessThan(resolveAkashicPalette(lowCun).noiseScale);
  });

  test('rank tier 0 gives hue ~145 (emerald green)', () => {
    const akashic = makeAkashic({ rankTier: 0 });
    const palette = resolveAkashicPalette(akashic);
    expect(palette.rankHue).toBeCloseTo(145, 0);
  });

  test('rank tier 99 gives hue ~48 (amber/copper)', () => {
    const akashic = makeAkashic({ rankTier: 99 });
    const palette = resolveAkashicPalette(akashic);
    // (145 + 263) % 360 = 408 % 360 = 48
    expect(palette.rankHue).toBeCloseTo(48, 0);
  });

  test('artemis deity produces correct overlay', () => {
    const akashic = makeAkashic({
      activeDeity: {
        deityName: 'artemis',
        blessingChoice: "Moon's Grace",
        faithAtBonding: 20,
        currentAmplification: 1.0,
      }
    });
    const palette = resolveAkashicPalette(akashic);
    expect(palette.deityOverlay).not.toBeNull();
    expect(palette.deityOverlay?.deityName).toBe('artemis');
    expect(palette.deityOverlay?.triggerOn).toBe('movement');
  });

  test('Battlemage strength produces ember particle style', () => {
    const akashic = makeAkashic({
      attributes: { ...BASE_ATTRIBUTES, strength: 60, magic: 55 },
      top3Strengths: [
        { name: 'Battlemage', word: 'Powerful', value: 57, statA: 'strength', statB: 'magic' }
      ],
    });
    const palette = resolveAkashicPalette(akashic);
    expect(palette.particleStyle).toBe('ember');
  });

  test('strength signatures scale with strength value', () => {
    const weakStrength = makeAkashic({
      top3Strengths: [
        { name: 'Battlemage', word: 'Powerful', value: 12, statA: 'strength', statB: 'magic' }
      ],
    });
    const strongStrength = makeAkashic({
      top3Strengths: [
        { name: 'Battlemage', word: 'Powerful', value: 90, statA: 'strength', statB: 'magic' }
      ],
    });
    const palWeak   = resolveAkashicPalette(weakStrength);
    const palStrong = resolveAkashicPalette(strongStrength);
    expect(palStrong.strengthSignatures[0].intensity)
      .toBeGreaterThan(palWeak.strengthSignatures[0].intensity);
  });

  test('close axis scores produce secondary axis and blended color', () => {
    // Physical and Mental nearly tied
    const akashic = makeAkashic({
      attributes: { ...BASE_ATTRIBUTES, strength: 50, agility: 48, magic: 50, wisdom: 47 }
    });
    const palette = resolveAkashicPalette(akashic);
    expect(palette.secondaryAxis).not.toBeNull();
    // Color should be a blend — neither pure red nor pure violet
    // Both channels should have some value
    expect(palette.soulColor[0]).toBeGreaterThan(0.1);
    expect(palette.soulColor[2]).toBeGreaterThan(0.1);
  });

  test('diffPalettes detects deity change', () => {
    const base = makeAkashic({});
    const withDeity = makeAkashic({
      activeDeity: { deityName: 'odin', blessingChoice: 'test', faithAtBonding: 20, currentAmplification: 1.0 }
    });
    const palBase = resolveAkashicPalette(base);
    const palDeity = resolveAkashicPalette(withDeity);
    const diff = diffPalettes(palBase, palDeity);
    expect(diff.deityChanged).toBe(true);
  });

  test('diffPalettes detects no changes when palettes are same', () => {
    const akashic = makeAkashic({ attributes: { ...BASE_ATTRIBUTES, strength: 40 } });
    const pal1 = resolveAkashicPalette(akashic);
    const pal2 = resolveAkashicPalette(akashic);
    const diff = diffPalettes(pal1, pal2);
    expect(diff.colorChanged).toBe(false);
    expect(diff.deityChanged).toBe(false);
    expect(diff.signaturesChanged).toBe(false);
  });

  test('mana vs stamina resource type is preserved', () => {
    const manaUser = makeAkashic({ resourceType: 'mana' });
    const stamUser = makeAkashic({ resourceType: 'stamina' });
    expect(resolveAkashicPalette(manaUser).resourceType).toBe('mana');
    expect(resolveAkashicPalette(stamUser).resourceType).toBe('stamina');
  });

});
