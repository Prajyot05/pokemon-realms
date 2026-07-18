import { pgTable, serial, varchar, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pokemonInstances = pgTable('pokemon_instances', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  speciesId: varchar('species_id', { length: 50 }).notNull(), // e.g., 'BULBASAUR'
  nickname: varchar('nickname', { length: 50 }),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  
  // Genetics
  nature: varchar('nature', { length: 20 }).notNull(),
  isShiny: boolean('is_shiny').notNull().default(false),
  
  // IVs
  ivHp: integer('iv_hp').notNull(),
  ivAttack: integer('iv_attack').notNull(),
  ivDefense: integer('iv_defense').notNull(),
  ivSpAttack: integer('iv_sp_attack').notNull(),
  ivSpDefense: integer('iv_sp_defense').notNull(),
  ivSpeed: integer('iv_speed').notNull(),

  // EVs
  evHp: integer('ev_hp').notNull().default(0),
  evAttack: integer('ev_attack').notNull().default(0),
  evDefense: integer('ev_defense').notNull().default(0),
  evSpAttack: integer('ev_sp_attack').notNull().default(0),
  evSpDefense: integer('ev_sp_defense').notNull().default(0),
  evSpeed: integer('ev_speed').notNull().default(0),

  // Current State
  currentHp: integer('current_hp').notNull(),
  status: varchar('status', { length: 20 }), // POISON, BURN, etc.
  moves: jsonb('moves').notNull(), // Array of move IDs
  
  // Storage
  isParty: boolean('is_party').notNull().default(false),
  partyPosition: integer('party_position'), // 0-5
  boxNumber: integer('box_number'),
  boxPosition: integer('box_position'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const gyms = pgTable('gyms', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').references(() => users.id).notNull().unique(),
  ownerName: varchar('owner_name', { length: 50 }).notNull(),
  zoneName: varchar('zone_name', { length: 50 }).notNull(),
  tileX: integer('tile_x').notNull(),
  tileY: integer('tile_y').notNull(),
  typeSpecialty: varchar('type_specialty', { length: 20 }).notNull(),
  badgeName: varchar('badge_name', { length: 50 }).notNull(),
  isOpen: boolean('is_open').notNull().default(false),
  winStreak: integer('win_streak').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
