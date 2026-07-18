import { db } from '../src/db/connection';
import { users } from '../src/db/schema';
import { PokemonInstance } from '../src/pokemon/PokemonInstance';
import { getUserParty, addPokemonToUser } from '../src/db/queries/pokemon';

async function run() {
  try {
    const allUsers = await db.select().from(users);
    let count = 0;

    for (const user of allUsers) {
      const party = await getUserParty(user.id);
      if (party.length === 0) {
        console.log(`Giving starter Bulbasaur to user ${user.username} (ID: ${user.id})`);
        const starter = await PokemonInstance.generateWild('BULBASAUR', 5, user.id);
        await addPokemonToUser(starter.data.id, user.id);
        count++;
      }
    }

    console.log(`Done! Gave starters to ${count} users.`);
  } catch (err) {
    console.error('Script failed:', err);
  } finally {
    process.exit(0);
  }
}

run();
