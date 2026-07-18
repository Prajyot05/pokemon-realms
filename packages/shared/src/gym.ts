export interface GymData {
  id: number;
  ownerId: number;
  ownerName: string;
  zoneName: string;
  tileX: number;
  tileY: number;
  typeSpecialty: string;
  badgeName: string;
  isOpen: boolean;
  winStreak: number;
  createdAt: number;
}

export type GymChallengeStatus = 'QUEUED' | 'BATTLING' | 'WON' | 'LOST';

export interface GymMessage {
  type: 'GYM_CREATE' | 'GYM_CHALLENGE' | 'GYM_TOGGLE';
  payload: any;
}
