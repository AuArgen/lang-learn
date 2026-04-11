import { headers } from 'next/headers';
import { adminDb } from '@/lib/firebase/admin';

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
  const userThemes = await adminDb.collection('themes').where('author_id', '==', userId).count().get();
  return userThemes.data().count >= 1; // Limit is 1
}

export async function hasReachedWordLimit(themeId: string) {
  const words = await adminDb.collection('words').where('theme_id', '==', themeId).count().get();
  return words.data().count >= 3; // Limit is 3
}
