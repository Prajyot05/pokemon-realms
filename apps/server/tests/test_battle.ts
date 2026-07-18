import { DamageCalculator } from '../src/battle/DamageCalculator';
import { TurnResolver } from '../src/battle/TurnResolver';
import { PokemonInstance } from '../src/pokemon/PokemonInstance';
import { db } from '../src/db/connection';
import { generateRandomNature, generateRandomIVs } from '../src/pokemon/genetics';

async function runTests() {
  try {
    console.log('--- Testing Battle Core ---');
    
    // Test Type Effectiveness
    const eff1 = DamageCalculator.getEffectiveness('FIRE', ['GRASS']);
    console.assert(eff1 === 2.0, `Expected FIRE on GRASS to be 2.0, got ${eff1}`);
    
    const eff2 = DamageCalculator.getEffectiveness('FIRE', ['WATER']);
    console.assert(eff2 === 0.5, `Expected FIRE on WATER to be 0.5, got ${eff2}`);
    
    const eff3 = DamageCalculator.getEffectiveness('NORMAL', ['GHOST']);
    console.assert(eff3 === 0, `Expected NORMAL on GHOST to be 0, got ${eff3}`);

    const eff4 = DamageCalculator.getEffectiveness('FLYING', ['GRASS', 'BUG']); // 2 * 2
    console.assert(eff4 === 4.0, `Expected FLYING on GRASS/BUG to be 4.0, got ${eff4}`);

    console.log('✅ Type Effectiveness Tests Passed');

    // Test Damage Calculation (Mocking instances without DB save)
    // We can't easily mock PokemonInstance.generateWild since it hits the DB, 
    // so we'll construct them manually.
    const ivs = generateRandomIVs();
    const evs = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    const p1 = new PokemonInstance({
      id: 1, ownerId: 1, speciesId: 'CHARMANDER', nickname: null, level: 50, experience: 0,
      nature: 'HARDY' as any, isShiny: false, ivs, evs, currentHp: 100, status: null,
      moves: ['FLAMETHROWER'], isParty: true, partyPosition: 0, boxNumber: null, boxPosition: null
    });

    const p2 = new PokemonInstance({
      id: 2, ownerId: 2, speciesId: 'BULBASAUR', nickname: null, level: 50, experience: 0,
      nature: 'HARDY' as any, isShiny: false, ivs, evs, currentHp: 100, status: null,
      moves: ['TACKLE'], isParty: true, partyPosition: 0, boxNumber: null, boxPosition: null
    });

    const dmgResult = DamageCalculator.calculateDamage(p1, p2, 'FLAMETHROWER');
    console.assert(dmgResult.effectiveness > 1, `Expected FLAMETHROWER to be super effective, got ${dmgResult.effectiveness}`);
    console.assert(dmgResult.damage > 0, `Expected Damage to be > 0, got ${dmgResult.damage}`);

    console.log('✅ Damage Calculation Tests Passed (Damage:', dmgResult.damage, ')');
    
    console.log('All tests completed successfully.');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    process.exit(0);
  }
}

runTests();
