import { IVs, EVs, Nature } from '@pokemon-realms/shared';
import pokemonData from '@pokemon-realms/shared/src/data/pokemon.json';

const NATURE_COUNT = Object.keys(Nature).length;
const NATURE_VALUES = Object.values(Nature);

// Gen 3 Nature modifiers matrix (10% increase, 10% decrease)
const natureModifiers: Record<Nature, { increase: keyof IVs | null, decrease: keyof IVs | null }> = {
  [Nature.HARDY]: { increase: null, decrease: null },
  [Nature.LONELY]: { increase: 'attack', decrease: 'defense' },
  [Nature.BRAVE]: { increase: 'attack', decrease: 'speed' },
  [Nature.ADAMANT]: { increase: 'attack', decrease: 'spAttack' },
  [Nature.NAUGHTY]: { increase: 'attack', decrease: 'spDefense' },
  [Nature.BOLD]: { increase: 'defense', decrease: 'attack' },
  [Nature.DOCILE]: { increase: null, decrease: null },
  [Nature.RELAXED]: { increase: 'defense', decrease: 'speed' },
  [Nature.IMPISH]: { increase: 'defense', decrease: 'spAttack' },
  [Nature.LAX]: { increase: 'defense', decrease: 'spDefense' },
  [Nature.TIMID]: { increase: 'speed', decrease: 'attack' },
  [Nature.HASTY]: { increase: 'speed', decrease: 'defense' },
  [Nature.SERIOUS]: { increase: null, decrease: null },
  [Nature.JOLLY]: { increase: 'speed', decrease: 'spAttack' },
  [Nature.NAIVE]: { increase: 'speed', decrease: 'spDefense' },
  [Nature.MODEST]: { increase: 'spAttack', decrease: 'attack' },
  [Nature.MILD]: { increase: 'spAttack', decrease: 'defense' },
  [Nature.QUIET]: { increase: 'spAttack', decrease: 'speed' },
  [Nature.BASHFUL]: { increase: null, decrease: null },
  [Nature.RASH]: { increase: 'spAttack', decrease: 'spDefense' },
  [Nature.CALM]: { increase: 'spDefense', decrease: 'attack' },
  [Nature.GENTLE]: { increase: 'spDefense', decrease: 'defense' },
  [Nature.SASSY]: { increase: 'spDefense', decrease: 'speed' },
  [Nature.CAREFUL]: { increase: 'spDefense', decrease: 'spAttack' },
  [Nature.QUIRKY]: { increase: null, decrease: null },
};

export function generateRandomIVs(): IVs {
  return {
    hp: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    spAttack: Math.floor(Math.random() * 32),
    spDefense: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
  };
}

export function generateRandomNature(): Nature {
  return NATURE_VALUES[Math.floor(Math.random() * NATURE_COUNT)];
}

export function checkShiny(originalTrainerId: number, secretId: number, personalityValue: number): boolean {
  const p1 = personalityValue >>> 16;
  const p2 = personalityValue & 0xFFFF;
  const e = originalTrainerId ^ secretId ^ p1 ^ p2;
  return e < 8;
}

export function calculateHP(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

export function calculateStat(statType: keyof IVs, base: number, iv: number, ev: number, level: number, nature: Nature): number {
  const baseStat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const modifiers = natureModifiers[nature];
  
  if (modifiers.increase === statType) return Math.floor(baseStat * 1.1);
  if (modifiers.decrease === statType) return Math.floor(baseStat * 0.9);
  
  return baseStat;
}

export function calculateAllStats(speciesId: string, level: number, ivs: IVs, evs: EVs, nature: Nature) {
  const speciesData = (pokemonData as Record<string, any>)[speciesId];
  if (!speciesData) throw new Error(`Unknown species ID: ${speciesId}`);

  // BaseStats format assumed from PBS parsing (e.g. [HP, ATK, DEF, SPD, SATK, SDEF])
  // PBS files usually list: HP, Attack, Defense, Speed, Sp. Atk, Sp. Def.
  const base = speciesData.BaseStats;

  return {
    hp: calculateHP(base[0], ivs.hp, evs.hp, level),
    attack: calculateStat('attack', base[1], ivs.attack, evs.attack, level, nature),
    defense: calculateStat('defense', base[2], ivs.defense, evs.defense, level, nature),
    speed: calculateStat('speed', base[3], ivs.speed, evs.speed, level, nature),
    spAttack: calculateStat('spAttack', base[4], ivs.spAttack, evs.spAttack, level, nature),
    spDefense: calculateStat('spDefense', base[5], ivs.spDefense, evs.spDefense, level, nature),
  };
}
