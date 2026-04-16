import { adminDb } from '../admin';
import { readMockDB, writeMockDB } from './mockDb';

export interface GameSession {
  id?: string;
  theme_id: string;
  host_id: string | null; // null if public link initially
  mode: 'solo' | 'team';
  is_public_link: boolean;
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
}

export const gamesService = {
  async createGame(data: Omit<GameSession, 'id' | 'created_at'>) {
    try {
      const docRef = adminDb.collection('games').doc();
      const game = {
        ...data,
        id: docRef.id,
        created_at: new Date().toISOString(),
      };
      await docRef.set(game);
      return game;
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Creating game in local memory mock.');
      const db = readMockDB();
      const game = {
        ...data,
        id: 'mock-game-' + Date.now(),
        created_at: new Date().toISOString(),
      };
      db.games.push(game);
      writeMockDB(db);
      return game;
    }
  },
  
  async saveResult(gameId: string, themeId: string, playerName: string, score: number, mistakes: number, timeTakenSec: number = 0, history: any[] = []) {
    try {
      const docRef = adminDb.collection('game_results').doc();
      await docRef.set({
        id: docRef.id,
        game_id: gameId,
        theme_id: themeId,
        player_or_team_name: playerName,
        score,
        mistakes_count: mistakes,
        time_taken_sec: timeTakenSec,
        history,
        played_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Saving game result in local memory mock.');
      const db = readMockDB();
      db.game_results.push({
        id: 'mock-result-' + Date.now(),
        game_id: gameId,
        theme_id: themeId,
        player_or_team_name: playerName,
        score,
        mistakes_count: mistakes,
        time_taken_sec: timeTakenSec,
        history,
        played_at: new Date().toISOString(),
      });
      writeMockDB(db);
    }
  },

  async getResultsByTheme(themeId: string) {
    try {
      const snapshot = await adminDb.collection('game_results')
        .where('theme_id', '==', themeId)
        .orderBy('played_at', 'desc')
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Fetching game results from local memory mock.');
      const db = readMockDB();
      return db.game_results
        .filter(r => r.theme_id === themeId)
        .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());
    }
  }
};
