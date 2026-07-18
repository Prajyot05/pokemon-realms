import movesData from '../data/moves.json';
import { PokemonInstance } from '../pokemon/PokemonInstance';
import { BattleAction } from '@pokemon-realms/shared';
import { calculateAllStats } from '../pokemon/genetics';

export class TurnResolver {
  
  static getSpeed(pokemon: PokemonInstance): number {
    const stats = calculateAllStats(
      pokemon.data.speciesId, 
      pokemon.data.level, 
      pokemon.data.ivs, 
      pokemon.data.evs, 
      pokemon.data.nature
    );
    let speed = stats.speed;

    // Paralysis drops speed by 50% in modern gens (25% in gen 1-6). We'll use 50%.
    if (pokemon.data.status === 'PAR') {
      speed = Math.floor(speed * 0.5);
    }

    return speed;
  }

  static getMovePriority(moveId: string): number {
    const move = (movesData as any)[moveId];
    // We would parse priority from PBS if it exists. 
    // PE moves.txt often specifies Priority=1, etc. But if missing, default to 0.
    if (move && move.Priority) return move.Priority;
    
    // Hardcode some known priorities if PBS didn't supply them
    if (['QUICKATTACK', 'MACHPUNCH', 'EXTREMESPEED'].includes(moveId)) return 1;
    if (['PROTECT', 'DETECT'].includes(moveId)) return 4;
    
    return 0;
  }

  static resolveOrder(
    p1: { instance: PokemonInstance; action: BattleAction },
    p2: { instance: PokemonInstance; action: BattleAction }
  ): ('p1' | 'p2')[] {
    
    // Action type priorities
    // POKEMON > BAG > RUN > FIGHT
    const actionPriority = {
      RUN: 4,
      POKEMON: 3,
      BAG: 2,
      FIGHT: 1,
    };

    const p1AP = actionPriority[p1.action.type as keyof typeof actionPriority] || 0;
    const p2AP = actionPriority[p2.action.type as keyof typeof actionPriority] || 0;

    if (p1AP > p2AP) return ['p1', 'p2'];
    if (p2AP > p1AP) return ['p2', 'p1'];

    // If both are FIGHT, compare move priorities
    if (p1.action.type === 'FIGHT' && p2.action.type === 'FIGHT') {
      const p1Priority = this.getMovePriority(p1.action.moveId!);
      const p2Priority = this.getMovePriority(p2.action.moveId!);

      if (p1Priority > p2Priority) return ['p1', 'p2'];
      if (p2Priority > p1Priority) return ['p2', 'p1'];
    }

    // If priorities are equal, compare Speed
    const p1Speed = this.getSpeed(p1.instance);
    const p2Speed = this.getSpeed(p2.instance);

    if (p1Speed > p2Speed) return ['p1', 'p2'];
    if (p2Speed > p1Speed) return ['p2', 'p1'];

    // Speed tie: random
    return Math.random() < 0.5 ? ['p1', 'p2'] : ['p2', 'p1'];
  }
}
