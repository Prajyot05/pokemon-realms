import { Schema, MapSchema, defineTypes } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  id: string = '';
  x: number = 400;
  y: number = 300;
  direction: string = 'down';
}

defineTypes(PlayerSchema, {
  id: 'string',
  x: 'number',
  y: 'number',
  direction: 'string',
});

export class WorldState extends Schema {
  players = new MapSchema<PlayerSchema>();
}

defineTypes(WorldState, {
  players: { map: PlayerSchema },
});
