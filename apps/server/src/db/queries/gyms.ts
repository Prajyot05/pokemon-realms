import { eq, desc } from 'drizzle-orm';
import { db } from '../connection';
import { gyms } from '../schema';
import { GymData } from '@pokemon-realms/shared';

export async function createGym(
  ownerId: number,
  ownerName: string,
  zoneName: string,
  tileX: number,
  tileY: number,
  typeSpecialty: string,
  badgeName: string
): Promise<GymData> {
  const [gym] = await db.insert(gyms).values({
    ownerId,
    ownerName,
    zoneName,
    tileX,
    tileY,
    typeSpecialty,
    badgeName,
    isOpen: true,
    winStreak: 0
  }).returning();

  return {
    id: gym.id,
    ownerId: gym.ownerId,
    ownerName: gym.ownerName,
    zoneName: gym.zoneName,
    tileX: gym.tileX,
    tileY: gym.tileY,
    typeSpecialty: gym.typeSpecialty,
    badgeName: gym.badgeName,
    isOpen: gym.isOpen,
    winStreak: gym.winStreak,
    createdAt: gym.createdAt.getTime()
  };
}

export async function getGymByOwner(ownerId: number): Promise<GymData | null> {
  const result = await db.select().from(gyms).where(eq(gyms.ownerId, ownerId));
  if (result.length === 0) return null;
  const gym = result[0];
  return {
    id: gym.id,
    ownerId: gym.ownerId,
    ownerName: gym.ownerName,
    zoneName: gym.zoneName,
    tileX: gym.tileX,
    tileY: gym.tileY,
    typeSpecialty: gym.typeSpecialty,
    badgeName: gym.badgeName,
    isOpen: gym.isOpen,
    winStreak: gym.winStreak,
    createdAt: gym.createdAt.getTime()
  };
}

export async function getGymsByZone(zoneName: string): Promise<GymData[]> {
  const results = await db.select().from(gyms).where(eq(gyms.zoneName, zoneName));
  return results.map(gym => ({
    id: gym.id,
    ownerId: gym.ownerId,
    ownerName: gym.ownerName,
    zoneName: gym.zoneName,
    tileX: gym.tileX,
    tileY: gym.tileY,
    typeSpecialty: gym.typeSpecialty,
    badgeName: gym.badgeName,
    isOpen: gym.isOpen,
    winStreak: gym.winStreak,
    createdAt: gym.createdAt.getTime()
  }));
}

export async function setGymOpen(gymId: number, isOpen: boolean) {
  await db.update(gyms).set({ isOpen }).where(eq(gyms.id, gymId));
}

export async function updateGymWinStreak(gymId: number, didLeaderWin: boolean) {
  if (didLeaderWin) {
    const result = await db.select({ winStreak: gyms.winStreak }).from(gyms).where(eq(gyms.id, gymId));
    if (result.length > 0) {
      await db.update(gyms).set({ winStreak: result[0].winStreak + 1 }).where(eq(gyms.id, gymId));
    }
  } else {
    await db.update(gyms).set({ winStreak: 0 }).where(eq(gyms.id, gymId));
  }
}

export async function getGymLeaderboard(): Promise<GymData[]> {
  const results = await db.select().from(gyms).orderBy(desc(gyms.winStreak)).limit(10);
  return results.map(gym => ({
    id: gym.id,
    ownerId: gym.ownerId,
    ownerName: gym.ownerName,
    zoneName: gym.zoneName,
    tileX: gym.tileX,
    tileY: gym.tileY,
    typeSpecialty: gym.typeSpecialty,
    badgeName: gym.badgeName,
    isOpen: gym.isOpen,
    winStreak: gym.winStreak,
    createdAt: gym.createdAt.getTime()
  }));
}
