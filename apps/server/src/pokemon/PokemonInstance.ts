import { IVs, EVs, Nature, PokemonInstanceData } from '@pokemon-realms/shared';
import { generateRandomIVs, generateRandomNature, calculateAllStats } from './genetics';
import pokemonData from '@pokemon-realms/shared/src/data/pokemon.json';
import { db } from '../db/connection';
import { pokemonInstances } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export class PokemonInstance {
  data: PokemonInstanceData;

  constructor(data: PokemonInstanceData) {
    this.data = data;
  }

  static async generateWild(speciesId: string, level: number, ownerId: number): Promise<PokemonInstance> {
    const species = (pokemonData as Record<string, any>)[speciesId];
    if (!species) throw new Error(`Species ${speciesId} not found`);

    const ivs = generateRandomIVs();
    const evs = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    const nature = generateRandomNature();
    // Simplified shiny logic for now
    const isShiny = Math.random() < (1 / 8192);

    const stats = calculateAllStats(speciesId, level, ivs, evs, nature);
    
    // Pick the first 4 moves available at this level
    const availableMoves: string[] = [];
    const moveList = species.Moves;
    for (let i = 0; i < moveList.length; i += 2) {
      const moveLevel = moveList[i];
      const moveId = moveList[i + 1];
      if (moveLevel <= level) {
        if (!availableMoves.includes(moveId)) {
          availableMoves.push(moveId);
        }
      }
    }
    const startingMoves = availableMoves.slice(-4);

    if (ownerId === -1) {
      // Wild encounter, do not save to DB yet
      return new PokemonInstance({
        id: -1,
        ownerId: -1,
        speciesId,
        nickname: null,
        level,
        experience: 0,
        nature,
        isShiny,
        ivs,
        evs,
        currentHp: stats.hp,
        status: null,
        moves: startingMoves,
        isParty: false,
        partyPosition: null,
        boxNumber: null,
        boxPosition: null,
      });
    }

    // Save to DB
    const [inserted] = await db.insert(pokemonInstances).values({
      ownerId,
      speciesId,
      level,
      experience: 0,
      nature,
      isShiny,
      ivHp: ivs.hp,
      ivAttack: ivs.attack,
      ivDefense: ivs.defense,
      ivSpAttack: ivs.spAttack,
      ivSpDefense: ivs.spDefense,
      ivSpeed: ivs.speed,
      evHp: evs.hp,
      evAttack: evs.attack,
      evDefense: evs.defense,
      evSpAttack: evs.spAttack,
      evSpDefense: evs.spDefense,
      evSpeed: evs.speed,
      currentHp: stats.hp,
      moves: startingMoves,
      isParty: false,
    }).returning();

    return new PokemonInstance({
      id: inserted.id,
      ownerId: inserted.ownerId,
      speciesId: inserted.speciesId,
      nickname: inserted.nickname,
      level: inserted.level,
      experience: inserted.experience,
      nature: inserted.nature as Nature,
      isShiny: inserted.isShiny,
      ivs: {
        hp: inserted.ivHp,
        attack: inserted.ivAttack,
        defense: inserted.ivDefense,
        spAttack: inserted.ivSpAttack,
        spDefense: inserted.ivSpDefense,
        speed: inserted.ivSpeed,
      },
      evs: {
        hp: inserted.evHp,
        attack: inserted.evAttack,
        defense: inserted.evDefense,
        spAttack: inserted.evSpAttack,
        spDefense: inserted.evSpDefense,
        speed: inserted.evSpeed,
      },
      currentHp: inserted.currentHp,
      status: inserted.status,
      moves: inserted.moves as string[],
      isParty: inserted.isParty,
      partyPosition: inserted.partyPosition,
      boxNumber: inserted.boxNumber,
      boxPosition: inserted.boxPosition,
    });
  }
}
