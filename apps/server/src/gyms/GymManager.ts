import { matchMaker } from 'colyseus';
import { GymData } from '@pokemon-realms/shared';
import { getGymByOwner, getGymsByZone, setGymOpen, updateGymWinStreak } from '../db/queries/gyms';

export class GymManager {
  // gymId -> array of challenger userIds
  private challengeQueues: Map<number, number[]> = new Map();

  async handlePlayerConnect(userId: number, zoneName: string) {
    const gym = await getGymByOwner(userId);
    if (gym && gym.zoneName === zoneName) {
      await setGymOpen(gym.id, true);
    }
  }

  async handlePlayerDisconnect(userId: number) {
    const gym = await getGymByOwner(userId);
    if (gym) {
      await setGymOpen(gym.id, false);
      this.challengeQueues.delete(gym.id);
    }
  }

  async challengeGym(gymId: number, challengerId: number): Promise<boolean> {
    if (!this.challengeQueues.has(gymId)) {
      this.challengeQueues.set(gymId, []);
    }
    const queue = this.challengeQueues.get(gymId)!;
    if (!queue.includes(challengerId)) {
      queue.push(challengerId);
      return true;
    }
    return false;
  }

  getQueueLength(gymId: number): number {
    return this.challengeQueues.get(gymId)?.length || 0;
  }

  async popNextChallenger(gymId: number, leaderId: number): Promise<string | null> {
    const queue = this.challengeQueues.get(gymId);
    if (!queue || queue.length === 0) return null;
    
    const challengerId = queue.shift()!;
    
    // Create BattleRoom
    try {
      const room = await matchMaker.createRoom('battle', {
        p1Id: leaderId.toString(),
        p2Id: challengerId.toString(),
        isGymBattle: true,
        gymId
      });
      return room.roomId;
    } catch (e) {
      console.error('Failed to create gym battle:', e);
      return null;
    }
  }

  async handleBattleResult(gymId: number, didLeaderWin: boolean) {
    await updateGymWinStreak(gymId, didLeaderWin);
  }
}

export const gymManager = new GymManager();
