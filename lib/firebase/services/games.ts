import prisma from '../../db/prisma';

export interface GameSession {
  id?: string;
  theme_id: string;
  host_id: string | null;
  mode: 'solo' | 'team';
  is_public_link: boolean;
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
}

export const gamesService = {
  async createGame(data: Omit<GameSession, 'id' | 'created_at'>) {
    const game = await prisma.gameSession.create({
      data: {
        theme_id: data.theme_id,
        host_id: data.host_id,
        mode: data.mode,
        is_public_link: data.is_public_link,
        status: data.status,
      }
    });
    return {
      ...game,
      created_at: game.created_at.toISOString()
    } as GameSession;
  },
  
  async saveResult(gameId: string, themeId: string, playerName: string, score: number, mistakes: number, timeTakenSec: number = 0, history: any[] = []) {
    await prisma.gameResult.create({
      data: {
        game_id: gameId,
        theme_id: themeId,
        player_or_team_name: playerName,
        score,
        mistakes_count: mistakes,
        time_taken_sec: timeTakenSec,
        history: JSON.stringify(history)
      }
    });
  },

  async getResultsByTheme(themeId: string) {
    const results = await prisma.gameResult.findMany({
      where: { theme_id: themeId },
      orderBy: { played_at: 'desc' }
    });

    return results.map(r => ({
      ...r,
      history: JSON.parse(r.history),
      played_at: r.played_at.toISOString()
    }));
  }
};

