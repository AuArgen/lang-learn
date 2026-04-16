import prisma from '../../db/prisma';

export interface Word {
  id?: string;
  theme_id: string;
  word: string;
  translation: string;
  language: string;
  audio_url?: string;
  is_manual_input?: boolean;
}

export const wordsService = {
  async addWord(data: Omit<Word, 'id'>) {
    const word = await prisma.word.create({
      data: {
        theme_id: data.theme_id,
        word: data.word,
        translation: data.translation,
        language: data.language,
        audio_url: data.audio_url,
        is_manual_input: data.is_manual_input || false
      }
    });

    await prisma.theme.update({
      where: { id: data.theme_id },
      data: {
        words_count: { increment: 1 }
      }
    });

    return word;
  },

  async updateWord(id: string, data: Partial<Word>) {
    await prisma.word.update({
      where: { id },
      data: {
        ...data
      } as any
    });
  },

  async deleteWord(id: string, themeId: string) {
    await prisma.word.delete({
      where: { id }
    });

    await prisma.theme.update({
      where: { id: themeId },
      data: {
        words_count: { decrement: 1 }
      }
    });
  },
  
  async getWordsByTheme(themeId: string) {
    const words = await prisma.word.findMany({
      where: { theme_id: themeId }
    });
    return words as Word[];
  }
};

