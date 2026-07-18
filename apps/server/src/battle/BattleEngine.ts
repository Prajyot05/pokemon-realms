import { BattleAction, TurnResult, BattleEvent, BattlePokemonSchema } from '@pokemon-realms/shared';
import { PokemonInstance } from '../pokemon/PokemonInstance';
import { DamageCalculator } from './DamageCalculator';
import { TurnResolver } from './TurnResolver';
import movesData from '../data/moves.json';
import pokemonData from '../data/pokemon.json';
import { db } from '../db/connection';
import { pokemonInstances } from '../db/schema';
import { eq } from 'drizzle-orm';

export class BattleEngine {
  static async resolveTurn(
    turnNumber: number,
    p1: { id: string; instance: PokemonInstance; action: BattleAction, schema: BattlePokemonSchema },
    p2: { id: string; instance: PokemonInstance; action: BattleAction, schema: BattlePokemonSchema }
  ): Promise<TurnResult> {
    const events: BattleEvent[] = [];
    
    // 1. Determine order
    const order = TurnResolver.resolveOrder(
      { instance: p1.instance, action: p1.action },
      { instance: p2.instance, action: p2.action }
    );

    const players = { p1, p2 };
    let battleEndedEarly = false;

    // Track faints
    const isFainted = {
      p1: p1.instance.data.currentHp <= 0,
      p2: p2.instance.data.currentHp <= 0
    };

    // 2. Execute actions in order
    for (const key of order) {
      if (isFainted[key]) continue; // Can't act if fainted

      const player = players[key];
      const opponentKey = key === 'p1' ? 'p2' : 'p1';
      const opponent = players[opponentKey];

      const action = player.action;

      if (action.type === 'FIGHT') {
        const moveId = action.moveId!;
        const move = (movesData as any)[moveId];

        if (isFainted[opponentKey]) {
          events.push({
            type: 'TEXT',
            text: `But there was no target...`
          });
          continue;
        }

        const speciesName = player.instance.data.nickname || (pokemonData as any)[player.instance.data.speciesId].Name;
        const opponentName = opponent.instance.data.nickname || (pokemonData as any)[opponent.instance.data.speciesId].Name;

        events.push({
          type: 'TEXT',
          text: `${speciesName} used ${move.Name}!`
        });

        // Check accuracy
        const acc = move.Accuracy || 100;
        if (Math.random() * 100 > acc) {
          events.push({ type: 'TEXT', text: `${speciesName}'s attack missed!` });
          continue;
        }

        // Play animation
        events.push({
          type: 'ANIMATION',
          sourceId: player.id,
          targetId: opponent.id,
          animationId: moveId
        });

        // Calculate Damage
        if (move.Category === 'Physical' || move.Category === 'Special') {
          const { damage, isCritical, effectiveness } = DamageCalculator.calculateDamage(
            player.instance,
            opponent.instance,
            moveId,
            player.schema,
            opponent.schema
          );

          if (effectiveness === 0) {
            events.push({ type: 'TEXT', text: `It doesn't affect ${opponentName}...` });
          } else {
            if (isCritical) events.push({ type: 'TEXT', text: 'A critical hit!' });
            
            if (effectiveness > 1.0) events.push({ type: 'TEXT', text: 'It\'s super effective!' });
            if (effectiveness < 1.0) events.push({ type: 'TEXT', text: 'It\'s not very effective...' });

            // Apply Damage
            opponent.instance.data.currentHp = Math.max(0, opponent.instance.data.currentHp - damage);
            events.push({
              type: 'DAMAGE',
              targetId: opponent.id,
              amount: damage
            });

            if (opponent.instance.data.currentHp <= 0) {
              isFainted[opponentKey] = true;
              events.push({
                type: 'TEXT',
                text: `${opponentName} fainted!`
              });
              events.push({
                type: 'FAINT',
                targetId: opponent.id
              });
            }
          }
        } else if (move.Category === 'Status') {
           // Handle stat modifiers (GROWL, TAIL WHIP, etc)
           if (move.FunctionCode === 'LowerTargetAttack1') {
             opponent.schema.stageAttack = Math.max(-6, opponent.schema.stageAttack - 1);
             events.push({ type: 'TEXT', text: `${opponentName}'s attack fell!` });
           } else if (move.FunctionCode === 'LowerTargetDefense1') {
             opponent.schema.stageDefense = Math.max(-6, opponent.schema.stageDefense - 1);
             events.push({ type: 'TEXT', text: `${opponentName}'s defense fell!` });
           } else if (move.FunctionCode === 'LowerTargetSpeed1') {
             opponent.schema.stageSpeed = Math.max(-6, opponent.schema.stageSpeed - 1);
             events.push({ type: 'TEXT', text: `${opponentName}'s speed fell!` });
           } else {
             events.push({ type: 'TEXT', text: `But it failed!` });
           }
        }
      } else if (action.type === 'POKEMON') {
        const speciesName = player.instance.data.nickname || (pokemonData as any)[player.instance.data.speciesId].Name;
        events.push({
          type: 'TEXT',
          text: `Player withdrew ${speciesName}!`
        });
        events.push({
          type: 'SWITCH',
          sourceId: player.id,
          pokemonIndex: action.pokemonIndex
        });
      } else if (action.type === 'RUN') {
        events.push({
          type: 'TEXT',
          text: `Got away safely!`
        });
        battleEndedEarly = true;
        break; // Stop processing further actions this turn
      }
    }

    // Persist HP to DB
    const updates = [];
    if (p1.instance.data.id !== -1) {
      updates.push(db.update(pokemonInstances).set({ currentHp: p1.instance.data.currentHp }).where(eq(pokemonInstances.id, p1.instance.data.id)));
    }
    if (p2.instance.data.id !== -1) {
      updates.push(db.update(pokemonInstances).set({ currentHp: p2.instance.data.currentHp }).where(eq(pokemonInstances.id, p2.instance.data.id)));
    }
    
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return {
      turnNumber,
      events,
      isBattleEnded: battleEndedEarly
    };
  }
}
