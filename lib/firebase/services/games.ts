import { adminDb } from '../admin';

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
    const docRef = adminDb.collection('games').doc();
    const game = {
      ...data,
      id: docRef.id,
      created_at: new Date().toISOString(),
    };
    await docRef.set(game);
    return game;
  },
  
  async saveResult(gameId: string, themeId: string, playerName: string, score: number, mistakes: number) {
    const docRef = adminDb.collection('game_results').doc();
    await docRef.set({
      id: docRef.id,
      game_id: gameId,
      theme_id: themeId,
      player_or_team_name: playerName,
      score,
      mistakes_count: mistakes,
      played_at: new Date().toISOString(),
    });
  }
};
