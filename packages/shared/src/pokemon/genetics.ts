export interface IVs {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface EVs {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export enum Nature {
  HARDY = 'HARDY',
  LONELY = 'LONELY',
  BRAVE = 'BRAVE',
  ADAMANT = 'ADAMANT',
  NAUGHTY = 'NAUGHTY',
  BOLD = 'BOLD',
  DOCILE = 'DOCILE',
  RELAXED = 'RELAXED',
  IMPISH = 'IMPISH',
  LAX = 'LAX',
  TIMID = 'TIMID',
  HASTY = 'HASTY',
  SERIOUS = 'SERIOUS',
  JOLLY = 'JOLLY',
  NAIVE = 'NAIVE',
  MODEST = 'MODEST',
  MILD = 'MILD',
  QUIET = 'QUIET',
  BASHFUL = 'BASHFUL',
  RASH = 'RASH',
  CALM = 'CALM',
  GENTLE = 'GENTLE',
  SASSY = 'SASSY',
  CAREFUL = 'CAREFUL',
  QUIRKY = 'QUIRKY',
}

export interface PokemonInstanceData {
  id: number;
  ownerId: number;
  speciesId: string;
  nickname: string | null;
  level: number;
  experience: number;
  
  nature: Nature;
  isShiny: boolean;
  
  ivs: IVs;
  evs: EVs;
  
  currentHp: number;
  status: string | null;
  moves: string[]; // e.g., ["TACKLE", "GROWL"]
  
  isParty: boolean;
  partyPosition: number | null;
  boxNumber: number | null;
  boxPosition: number | null;
}
