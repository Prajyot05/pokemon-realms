import typesData from '../data/types.json';
import movesData from '../data/moves.json';
import pokemonData from '../data/pokemon.json';
import { PokemonInstance } from '../pokemon/PokemonInstance';
import { calculateAllStats } from '../pokemon/genetics';

export class DamageCalculator {
  static getEffectiveness(moveType: string, targetTypes: string[]): number {
    let effectiveness = 1.0;
    for (const targetType of targetTypes) {
      const typeInfo = (typesData as any)[targetType];
      if (typeInfo) {
        if (typeInfo.Weaknesses) {
          const weaknesses = Array.isArray(typeInfo.Weaknesses) ? typeInfo.Weaknesses : [typeInfo.Weaknesses];
          if (weaknesses.includes(moveType)) effectiveness *= 2.0;
        }
        if (typeInfo.Resistances) {
          const resistances = Array.isArray(typeInfo.Resistances) ? typeInfo.Resistances : [typeInfo.Resistances];
          if (resistances.includes(moveType)) effectiveness *= 0.5;
        }
        if (typeInfo.Immunities) {
          const immunities = Array.isArray(typeInfo.Immunities) ? typeInfo.Immunities : [typeInfo.Immunities];
          if (immunities.includes(moveType)) effectiveness *= 0.0;
        }
      }
    }
    return effectiveness;
  }

  static calculateDamage(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    moveId: string
  ): { damage: number; isCritical: boolean; effectiveness: number } {
    const move = (movesData as any)[moveId];
    if (!move || move.Category === 'Status' || !move.Power) {
      return { damage: 0, isCritical: false, effectiveness: 1.0 };
    }

    const level = attacker.data.level;
    const power = move.Power;

    const attackerStats = calculateAllStats(
      attacker.data.speciesId, 
      attacker.data.level, 
      attacker.data.ivs, 
      attacker.data.evs, 
      attacker.data.nature
    );
    const defenderStats = calculateAllStats(
      defender.data.speciesId, 
      defender.data.level, 
      defender.data.ivs, 
      defender.data.evs, 
      defender.data.nature
    );

    let atk = move.Category === 'Special' ? attackerStats.spAttack : attackerStats.attack;
    let def = move.Category === 'Special' ? defenderStats.spDefense : defenderStats.defense;

    // Base damage calculation (Gen 3 formula)
    let damage = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * power * atk / def) / 50) + 2;

    // Modifiers
    let modifier = 1.0;

    // STAB
    const attackerSpeciesData = (pokemonData as any)[attacker.data.speciesId];
    const attackerTypes = attackerSpeciesData?.Types || [];
    if (attackerTypes.includes(move.Type)) {
      modifier *= 1.5;
    }

    // Type Effectiveness
    const defenderSpeciesData = (pokemonData as any)[defender.data.speciesId];
    const defenderTypes = defenderSpeciesData?.Types || [];
    const effectiveness = this.getEffectiveness(move.Type, defenderTypes);
    modifier *= effectiveness;

    // Critical Hit (simplified: 1/16 chance)
    let isCritical = false;
    if (effectiveness > 0 && Math.random() < 0.0625) {
      isCritical = true;
      modifier *= 1.5;
    }

    // Burn (reduces physical damage by half)
    if (attacker.data.status === 'BRN' && move.Category === 'Physical') {
      modifier *= 0.5;
    }

    // Random variance (0.85 to 1.00)
    const randomFactor = (Math.floor(Math.random() * 16) + 85) / 100;
    modifier *= randomFactor;

    damage = Math.floor(damage * modifier);

    // Minimum 1 damage if it's not immune
    if (effectiveness > 0 && damage === 0) {
      damage = 1;
    }

    return { damage, isCritical, effectiveness };
  }
}
