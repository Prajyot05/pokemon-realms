import { Schema, MapSchema, type } from '@colyseus/schema';
import { BattlePokemonSchema } from './BattleSchema'; // Reusing this for simple display

export class TradePlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') offeredPokemonId: number = -1;
  @type(BattlePokemonSchema) offeredPokemonData: BattlePokemonSchema = new BattlePokemonSchema();
  @type('boolean') isReady: boolean = false;
  @type('boolean') isConfirmed: boolean = false;
}

export class TradeState extends Schema {
  @type('string') phase: string = 'SELECTING'; // TradePhase
  @type({ map: TradePlayerSchema }) players = new MapSchema<TradePlayerSchema>();
}
