'use server'

import { gamesService } from '@/lib/firebase/services/games';
import { getServerUser } from '@/lib/auth/server-auth';

export async function createGameSessionAction(themeId: string, mode: 'solo' | 'team', isPublicLink: boolean) {
  const user = await getServerUser();
  const game = await gamesService.createGame({
    theme_id: themeId,
    host_id: user ? user.userId : null,
    mode,
    is_public_link: isPublicLink,
    status: 'playing' // directly playing for simplicity
  });
  return game.id as string;
}

export async function saveGameResultAction(gameId: string, themeId: string, playerName: string, score: number, mistakes: number, timeTakenSec: number = 0, history: any[] = []) {
  await gamesService.saveResult(gameId, themeId, playerName, score, mistakes, timeTakenSec, history);
}
