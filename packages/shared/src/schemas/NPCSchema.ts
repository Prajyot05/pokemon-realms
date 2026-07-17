import { Schema, type } from '@colyseus/schema';

export class NPCSchema extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('string') direction: string = 'down';
  @type('string') sprite: string = 'npc 01'; // Default sprite
}
