import { headers } from 'next/headers';
import prisma from '@/lib/db/prisma';

export async function getServerUser() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const role = headersList.get('x-user-role');

  if (!userId || !role) {
    return null;
  }

  return { userId, role };
}

// Logic to check limits for USER
export async function hasReachedThemeLimit(userId: string) {
  const count = await prisma.theme.count({
    where: { author_id: userId }
  });
  return count >= 1; // Limit is 1
}

export async function hasReachedWordLimit(themeId: string) {
  const count = await prisma.word.count({
    where: { theme_id: themeId }
  });
  return count >= 3; // Limit is 3
}
