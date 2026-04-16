import prisma from '../../db/prisma';
import { Theme } from '@/lib/types/theme';

export const themesService = {
  async createTheme(data: Omit<Theme, 'id' | 'created_at' | 'words_count' | 'status'> & { status?: string }) {
    const theme = await prisma.theme.create({
      data: {
        author_id: data.author_id,
        title: data.title,
        description: data.description || '',
        language: data.language || 'en',
        status: data.status || 'draft',
        words_count: 0
      }
    });

    return {
      ...theme,
      created_at: theme.created_at.toISOString(),
      language: theme.language || 'en'
    } as Theme;
  },

  async updateTheme(id: string, data: Partial<Theme>) {
    await prisma.theme.update({
      where: { id },
      data: {
        ...data,
      } as any // Allow undefined mapping to ignore
    });
  },

  async deleteTheme(id: string) {
    await prisma.theme.delete({
      where: { id }
    });
  },
  
  async getTheme(id: string) {
    const doc = await prisma.theme.findUnique({
      where: { id }
    });
    if (!doc) return null;
    return {
      ...doc,
      created_at: doc.created_at.toISOString(),
      language: doc.language || 'en'
    } as Theme;
  },

  async getThemesByUser(userId: string) {
    const themes = await prisma.theme.findMany({
      where: { author_id: userId },
      orderBy: { created_at: 'desc' }
    });
    return themes.map(t => ({
      ...t, 
      created_at: t.created_at.toISOString(),
      language: t.language || 'en'
    })) as Theme[];
  },

  async getPublishedThemes() {
    const themes = await prisma.theme.findMany({
      where: { status: 'published' },
      orderBy: { created_at: 'desc' }
    });
    return themes.map(t => ({
      ...t, 
      created_at: t.created_at.toISOString(),
      language: t.language || 'en'
    })) as Theme[];
  }
};

