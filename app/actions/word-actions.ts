'use server'

import { wordsService } from '@/lib/firebase/services/words';
import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser, hasReachedWordLimit } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';

async function assertThemeOwner(themeId: string, user: { userId: string; role: string }) {
  const role = user.role?.toUpperCase() || 'USER';
  if (role === 'ADMIN' || role === 'ADMINISTRATOR') return;
  const theme = await themesService.getTheme(themeId);
  if (!theme || theme.author_id !== user.userId) {
    throw new Error("Доступ запрещён. Сиз бул теманын ээси эмессиз.");
  }
}

export async function addWordAction(themeId: string, formData: FormData) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  await assertThemeOwner(themeId, user);

  const word = formData.get('word') as string;
  const translation = formData.get('translation') as string;
  const isManualInput = formData.get('is_manual_input') === 'on';

  const limitReached = await hasReachedWordLimit(themeId);
  if (limitReached) {
    throw new Error("Сиздин лимит бүттү. Бул темада эң көп 100 сөз боло алат.");
  }

  const existingWords = await wordsService.getWordsByTheme(themeId);
  const isDuplicate = existingWords.some(w =>
    w.word.toLowerCase().trim() === word.toLowerCase().trim()
  );
  if (isDuplicate) {
    throw new Error("Бул сөз мурунтан эле кошулган.");
  }

  await wordsService.addWord({
    theme_id: themeId,
    word: word.trim(),
    translation: translation.trim(),
    language: 'kg', // can be dynamic
    is_manual_input: isManualInput,
  });

  revalidatePath(`/themes/${themeId}`);
}

export async function deleteWordAction(wordId: string, themeId: string) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  await assertThemeOwner(themeId, user);
  await wordsService.deleteWord(wordId, themeId);
  revalidatePath(`/themes/${themeId}`);
}

export async function updateWordAction(wordId: string, themeId: string, formData: FormData) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  await assertThemeOwner(themeId, user);

  const word = formData.get('word') as string;
  const translation = formData.get('translation') as string;
  const isManualInput = formData.get('is_manual_input') === 'on';

  const existingWords = await wordsService.getWordsByTheme(themeId);
  const isDuplicate = existingWords.some(w =>
    w.id !== wordId &&
    w.word.toLowerCase().trim() === word.toLowerCase().trim()
  );

  if (isDuplicate) {
    throw new Error("Бул сөз же анын котормосу мурунтан эле кошулган.");
  }

  await wordsService.updateWord(wordId, {
    word: word.trim(),
    translation: translation.trim(),
    is_manual_input: isManualInput,
  });

  revalidatePath(`/themes/${themeId}`);
}
