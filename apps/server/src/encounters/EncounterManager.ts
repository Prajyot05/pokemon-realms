import { PokemonInstance } from '../pokemon/PokemonInstance';
import { addPokemonToUser } from '../db/queries/pokemon';

// Simplified encounter table for now. 
// In Phase 3, this will parse the PE `encounters.txt`
const encounterTables: Record<string, { species: string, minLevel: number, maxLevel: number, chance: number }[]> = {
  'pallet-town': [
    { species: 'PIDGEY', minLevel: 2, maxLevel: 5, chance: 50 },
    { species: 'RATTATA', minLevel: 2, maxLevel: 4, chance: 50 }
  ],
  'route-1': [
    { species: 'PIDGEY', minLevel: 2, maxLevel: 5, chance: 50 },
    { species: 'RATTATA', minLevel: 2, maxLevel: 4, chance: 50 }
  ]
};

export class EncounterManager {
  // 10% chance to encounter a pokemon when stepping in grass
  static ENCOUNTER_CHANCE = 0.10;

  static async rollEncounter(mapId: string, userId: number): Promise<PokemonInstance | null> {
    if (Math.random() > this.ENCOUNTER_CHANCE) return null;

    const table = encounterTables[mapId] || encounterTables['route-1'];
    
    // Pick a random species based on chance
    const roll = Math.random() * 100;
    let current = 0;
    let selectedEntry = table[table.length - 1]; // fallback

    for (const entry of table) {
      current += entry.chance;
      if (roll <= current) {
        selectedEntry = entry;
        break;
      }
    }

    const level = Math.floor(Math.random() * (selectedEntry.maxLevel - selectedEntry.minLevel + 1)) + selectedEntry.minLevel;
    
    console.log(`[Encounter] Player ${userId} found a wild Lv${level} ${selectedEntry.species}!`);

    // For Phase 3, we just generate it, no catching yet.
    try {
      const instance = await PokemonInstance.generateWild(selectedEntry.species, level, -1);
      return instance;
    } catch (err) {
      console.error('[Encounter] Failed to generate/catch pokemon:', err);
      return null;
    }
  }
}
