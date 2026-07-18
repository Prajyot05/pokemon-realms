import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import { pokemonInstances } from '../schema';

export async function getUserParty(userId: number) {
  const records = await db.select().from(pokemonInstances)
    .where(and(
      eq(pokemonInstances.ownerId, userId),
      eq(pokemonInstances.isParty, true)
    ))
    .orderBy(pokemonInstances.partyPosition);
    
  return records.map(mapRecordToInstanceData);
}

export async function getUserPC(userId: number, boxNumber: number = 0) {
  const records = await db.select().from(pokemonInstances)
    .where(and(
      eq(pokemonInstances.ownerId, userId),
      eq(pokemonInstances.isParty, false),
      eq(pokemonInstances.boxNumber, boxNumber)
    ))
    .orderBy(pokemonInstances.boxPosition);
    
  return records.map(mapRecordToInstanceData);
}

export async function addPokemonToUser(instanceId: number, userId: number) {
  // First, check if party has space (< 6)
  const party = await getUserParty(userId);
  if (party.length < 6) {
    // Add to party
    await db.update(pokemonInstances)
      .set({
        isParty: true,
        partyPosition: party.length, // 0-indexed
        boxNumber: null,
        boxPosition: null
      })
      .where(eq(pokemonInstances.id, instanceId));
    return 'party';
  } else {
    // Add to PC Box 0
    const pc = await getUserPC(userId, 0);
    // Find first empty slot (0-29 usually for a PC box)
    const occupiedSlots = pc.map(p => p.boxPosition);
    let firstEmpty = 0;
    while (occupiedSlots.includes(firstEmpty)) {
      firstEmpty++;
    }

    await db.update(pokemonInstances)
      .set({
        isParty: false,
        partyPosition: null,
        boxNumber: 0,
        boxPosition: firstEmpty
      })
      .where(eq(pokemonInstances.id, instanceId));
    return 'pc';
  }
}

function mapRecordToInstanceData(inserted: any) {
  return {
    id: inserted.id,
    ownerId: inserted.ownerId,
    speciesId: inserted.speciesId,
    nickname: inserted.nickname,
    level: inserted.level,
    experience: inserted.experience,
    nature: inserted.nature,
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
    moves: inserted.moves,
    isParty: inserted.isParty,
    partyPosition: inserted.partyPosition,
    boxNumber: inserted.boxNumber,
    boxPosition: inserted.boxPosition,
  };
}
