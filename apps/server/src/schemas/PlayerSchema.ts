import { Schema, MapSchema, type } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 400;
  @type('number') y: number = 300;
  @type('string') direction: string = 'down';
  @type('boolean') isMoving: boolean = false;
}

export class WorldState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
}
