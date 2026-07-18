import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../connection';
import { pokemonInstances } from '../schema';
import { getUserParty } from './pokemon';

export async function executeTrade(p1Id: number, p1PokemonId: number, p2Id: number, p2PokemonId: number): Promise<boolean> {
  // Use a transaction for atomic swap
  return await db.transaction(async (tx) => {
    // 1. Validate ownership
    const p1Pokemon = await tx.select().from(pokemonInstances).where(eq(pokemonInstances.id, p1PokemonId));
    const p2Pokemon = await tx.select().from(pokemonInstances).where(eq(pokemonInstances.id, p2PokemonId));

    if (p1Pokemon.length === 0 || p1Pokemon[0].ownerId !== p1Id) return false;
    if (p2Pokemon.length === 0 || p2Pokemon[0].ownerId !== p2Id) return false;

    // 2. Validate party size > 1 if they are trading away a party pokemon and receiving one that goes to PC
    // For simplicity right now, since we are doing a 1:1 trade, the party size stays exactly the same, 
    // EXCEPT if we are swapping positions.
    // The easiest robust way is to just swap the ownerId and keep their existing storage location (isParty, partyPosition, boxNumber, boxPosition) exactly as they were for the PREVIOUS owner.
    // Wait, no. If I trade my party slot 2 for your PC box 1 slot 5.
    // My new pokemon goes to party slot 2. Your new pokemon goes to PC box 1 slot 5.
    // So we just swap the ownerId AND retain the position of the slot it's replacing!
    
    const p1Loc = {
      isParty: p1Pokemon[0].isParty,
      partyPosition: p1Pokemon[0].partyPosition,
      boxNumber: p1Pokemon[0].boxNumber,
      boxPosition: p1Pokemon[0].boxPosition
    };

    const p2Loc = {
      isParty: p2Pokemon[0].isParty,
      partyPosition: p2Pokemon[0].partyPosition,
      boxNumber: p2Pokemon[0].boxNumber,
      boxPosition: p2Pokemon[0].boxPosition
    };

    // Give p2's pokemon to p1, putting it in p1Loc
    await tx.update(pokemonInstances)
      .set({
        ownerId: p1Id,
        isParty: p1Loc.isParty,
        partyPosition: p1Loc.partyPosition,
        boxNumber: p1Loc.boxNumber,
        boxPosition: p1Loc.boxPosition
      })
      .where(eq(pokemonInstances.id, p2PokemonId));

    // Give p1's pokemon to p2, putting it in p2Loc
    await tx.update(pokemonInstances)
      .set({
        ownerId: p2Id,
        isParty: p2Loc.isParty,
        partyPosition: p2Loc.partyPosition,
        boxNumber: p2Loc.boxNumber,
        boxPosition: p2Loc.boxPosition
      })
      .where(eq(pokemonInstances.id, p1PokemonId));

    return true;
  });
}
