import { adminDb } from '../admin';

export interface Theme {
  id?: string;
  author_id: string;
  title: string;
  description: string;
  words_count: number;
  status: 'draft' | 'pending' | 'published';
  created_at: string;
}

let mockThemes: Theme[] = [
  {
    id: 'user-mock-1',
    author_id: 'mock_author',
    title: 'My Custom Animals',
    description: 'A mock theme to show my custom words',
    words_count: 5,
    status: 'draft',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-mock-2',
    author_id: 'mock_author',
    title: 'Phrasal Verbs',
    description: 'Important phrasal verbs for everyday use',
    words_count: 23,
    status: 'published',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const themesService = {
  async createTheme(data: Omit<Theme, 'id' | 'created_at' | 'words_count'>) {
    try {
      const docRef = adminDb.collection('themes').doc();
      const theme = {
        ...data,
        id: docRef.id,
        words_count: 0,
        created_at: new Date().toISOString(),
      };
      await docRef.set(theme);
      return theme;
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Creating theme in local memory mock.');
      const newTheme: Theme = {
        ...data,
        id: 'mock-theme-' + Date.now(),
        words_count: 0,
        created_at: new Date().toISOString()
      };
      mockThemes.push(newTheme);
      return newTheme;
    }
  },

  async updateTheme(id: string, data: Partial<Theme>) {
    try {
      await adminDb.collection('themes').doc(id).update(data);
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Updating theme in local memory mock.');
      const themeIndex = mockThemes.findIndex(t => t.id === id);
      if (themeIndex > -1) {
        mockThemes[themeIndex] = { ...mockThemes[themeIndex], ...data };
      }
    }
  },

  // Helper for mock data
  updateMockThemeCount(id: string, delta: number) {
    const themeIndex = mockThemes.findIndex(t => t.id === id);
    if (themeIndex > -1) {
      mockThemes[themeIndex].words_count = (mockThemes[themeIndex].words_count || 0) + delta;
    }
  },

  async deleteTheme(id: string) {
    try {
      await adminDb.collection('themes').doc(id).delete();
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Deleting theme from local memory mock.');
      mockThemes = mockThemes.filter(t => t.id !== id);
    }
  },
  
  async getTheme(id: string) {
    try {
      const doc = await adminDb.collection('themes').doc(id).get();
      if (!doc.exists) return null;
      return doc.data() as Theme;
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Returning mock theme detail.');
      const t = mockThemes.find(theme => theme.id === id);
      if (t) return t;
      
      // Fallback for dev environment where global memory arrays might not sync across threads
      if (id.startsWith('mock-')) {
        return {
          id,
          author_id: 'mock_author', // Important: it won't let you edit if it doesn't match, maybe better to allow viewing at least
          title: 'Убактылуу Тема (Dev)',
          description: 'Тема булутка сакталбагандыктан убактылуу көрсөтүлүүдө.',
          words_count: 0,
          status: 'draft',
          created_at: new Date().toISOString()
        } as Theme;
      }
      return null;
    }
  },

  async getThemesByUser(userId: string) {
    try {
      const snapshot = await adminDb.collection('themes').where('author_id', '==', userId).get();
      return snapshot.docs.map(doc => doc.data() as Theme);
    } catch (error: any) {
      // Allow initial mocks to match current mock user id
      mockThemes.forEach(t => {
        if (t.id === 'user-mock-1' || t.id === 'user-mock-2') t.author_id = userId;
      });
      return mockThemes.filter(t => t.author_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }
};
