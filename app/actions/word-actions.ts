'use server'

import { wordsService } from '@/lib/firebase/services/words';
import { getServerUser, hasReachedWordLimit } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';

export async function addWordAction(themeId: string, formData: FormData) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  const word = formData.get('word') as string;
  const translation = formData.get('translation') as string;

  if (user.role === 'USER') {
    const limitReached = await hasReachedWordLimit(themeId);
    if (limitReached) {
      throw new Error("Сиздин лимит бүттү. Бул темада эң көп 3 сөз боло алат.");
    }
  }

  await wordsService.addWord({
    theme_id: themeId,
    word,
    translation,
    language: 'kg', // can be dynamic
  });

  revalidatePath(`/themes/${themeId}`);
}

export async function deleteWordAction(wordId: string, themeId: string) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  await wordsService.deleteWord(wordId, themeId);
  revalidatePath(`/themes/${themeId}`);
}
