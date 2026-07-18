import { eq, and } from 'drizzle-orm';
import { db } from '../connection';
import { pokemonInstances } from '../schema';

export async function getUserParty(userId: number) {
  return await db.select().from(pokemonInstances)
    .where(and(
      eq(pokemonInstances.ownerId, userId),
      eq(pokemonInstances.isParty, true)
    ))
    .orderBy(pokemonInstances.partyPosition);
}

export async function getUserPC(userId: number, boxNumber: number = 0) {
  return await db.select().from(pokemonInstances)
    .where(and(
      eq(pokemonInstances.ownerId, userId),
      eq(pokemonInstances.isParty, false),
      eq(pokemonInstances.boxNumber, boxNumber)
    ))
    .orderBy(pokemonInstances.boxPosition);
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
