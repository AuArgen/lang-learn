'use server'

import { getServerUser } from '@/lib/auth/server-auth';
import prisma from '@/lib/db/prisma';
import { wordsService } from '@/lib/firebase/services/words';
import { generateWordsForTheme, GeneratedWord } from '@/lib/gemini/service';
import { revalidatePath } from 'next/cache';

export type GenerateWordsWithAIResult = {
  words: GeneratedWord[];
  error?: string;
};

export async function saveGeminiKeyAction(apiKey: string): Promise<void> {
  const user = await getServerUser();
  if (!user) throw new Error('Авторизациядан өтүңүз.');

  const key = apiKey.trim();
  if (!key) throw new Error('API ключ бош болбосун.');
  if (!key.startsWith('AIza')) {
    throw new Error('Жараксыз Gemini API ключ. Ключ "AIza" менен башталышы керек.');
  }
  if (key.length < 30) {
    throw new Error('API ключ өтө кыска. Толук ключди киргизиңиз.');
  }

  await prisma.user.update({
    where: { id: user.userId },
    data: { gemini_api_key: key },
  });
}

export async function deleteGeminiKeyAction(): Promise<void> {
  const user = await getServerUser();
  if (!user) throw new Error('Авторизациядан өтүңүз.');

  await prisma.user.update({
    where: { id: user.userId },
    data: { gemini_api_key: null },
  });
}

export async function getGeminiKeyStatusAction(): Promise<{ hasKey: boolean; maskedKey: string | null }> {
  const user = await getServerUser();
  if (!user) return { hasKey: false, maskedKey: null };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { gemini_api_key: true },
  });

  const key = dbUser?.gemini_api_key;
  if (!key) return { hasKey: false, maskedKey: null };

  const maskedKey = key.slice(0, 8) + '••••••••••••••••' + key.slice(-4);
  return { hasKey: true, maskedKey };
}

export async function generateWordsWithAIAction(
  themeId: string,
  customDescription = ''
): Promise<GenerateWordsWithAIResult> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { words: [], error: 'Авторизациядан өтүңүз.' };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gemini_api_key: true },
    });

    if (!dbUser?.gemini_api_key) {
      return { words: [], error: 'Биринчи Gemini API ключуңузду киргизиңиз. Төмөнкү формадан кошуңуз.' };
    }

    const theme = await prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) {
      return { words: [], error: 'Тема табылган жок.' };
    }

    if (theme.author_id !== user.userId) {
      const role = user.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'ADMINISTRATOR') {
        return { words: [], error: 'Бул темага жетүүгө уруксатыңыз жок.' };
      }
    }

    const existingWords = await prisma.word.findMany({
      where: { theme_id: themeId },
      select: { word: true },
    });

    const words = await generateWordsForTheme(
      dbUser.gemini_api_key,
      theme.title,
      theme.language || 'en',
      existingWords.map(w => w.word),
      customDescription
    );

    return { words };
  } catch (error) {
    return {
      words: [],
      error: error instanceof Error
        ? error.message
        : 'AI генерациясында белгисиз ката кетти. Кайра аракет кылыңыз.',
    };
  }
}

export async function addGeneratedWordsAction(
  themeId: string,
  words: GeneratedWord[]
): Promise<{ added: number; skipped: number }> {
  const user = await getServerUser();
  if (!user) throw new Error('Авторизациядан өтүңүз.');

  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (!theme) throw new Error('Тема табылган жок.');

  if (theme.author_id !== user.userId) {
    const role = user.role?.toUpperCase();
    if (role !== 'ADMIN' && role !== 'ADMINISTRATOR') {
      throw new Error('Бул темага жетүүгө уруксатыңыз жок.');
    }
  }

  let added = 0;
  let skipped = 0;

  for (const w of words) {
    if (!w.word?.trim() || !w.translation?.trim()) { skipped++; continue; }

    const exists = await prisma.word.findFirst({
      where: {
        theme_id: themeId,
        word: w.word.trim().toLowerCase(),
      },
    });

    if (exists) { skipped++; continue; }

    await wordsService.addWord({
      theme_id: themeId,
      word: w.word.trim(),
      translation: w.translation.trim(),
      language: theme.language || 'en',
      is_manual_input: false,
    });
    added++;
  }

  revalidatePath(`/themes/${themeId}`);
  return { added, skipped };
}
