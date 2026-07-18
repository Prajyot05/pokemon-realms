import { Schema, MapSchema, type } from '@colyseus/schema';

export class BattlePokemonSchema extends Schema {
  @type('string') id: string = '';
  @type('string') speciesId: string = '';
  @type('number') level: number = 1;
  @type('number') maxHp: number = 1;
  @type('number') currentHp: number = 1;
  @type('boolean') isShiny: boolean = false;
  @type('string') status: string = ''; // e.g. 'BRN', 'PSN', 'SLP'
}

export class BattlePlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type(BattlePokemonSchema) activePokemon: BattlePokemonSchema = new BattlePokemonSchema();
  // We can track party status (alive/fainted) as a simple array of booleans
  @type(['boolean']) partyAlive = new Array<boolean>();
}

export class BattleState extends Schema {
  @type('string') phase: string = 'WAITING_FOR_ACTIONS';
  @type({ map: BattlePlayerSchema }) players = new MapSchema<BattlePlayerSchema>();
  @type('number') spectatorCount: number = 0;
  @type('number') turn: number = 0;
}
