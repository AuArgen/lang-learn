import { adminDb } from '../admin';
import { Theme } from '@/lib/types/theme';
import { readMockDB, writeMockDB } from './mockDb';

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
      const db = readMockDB();
      const newTheme: Theme = {
        ...data,
        id: 'mock-theme-' + Date.now(),
        words_count: 0,
        created_at: new Date().toISOString()
      };
      db.themes.push(newTheme);
      writeMockDB(db);
      return newTheme;
    }
  },

  async updateTheme(id: string, data: Partial<Theme>) {
    try {
      await adminDb.collection('themes').doc(id).update(data);
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Updating theme in local memory mock.');
      const db = readMockDB();
      const themeIndex = db.themes.findIndex(t => t.id === id);
      if (themeIndex > -1) {
        db.themes[themeIndex] = { ...db.themes[themeIndex], ...data };
        writeMockDB(db);
      }
    }
  },

  // Helper for mock data
  updateMockThemeCount(id: string, delta: number) {
    const db = readMockDB();
    const themeIndex = db.themes.findIndex(t => t.id === id);
    if (themeIndex > -1) {
      db.themes[themeIndex].words_count = (db.themes[themeIndex].words_count || 0) + delta;
      writeMockDB(db);
    }
  },

  async deleteTheme(id: string) {
    try {
      await adminDb.collection('themes').doc(id).delete();
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Deleting theme from local memory mock.');
      const db = readMockDB();
      const index = db.themes.findIndex(t => t.id === id);
      if (index > -1) {
        db.themes.splice(index, 1);
        writeMockDB(db);
      }
    }
  },
  
  async getTheme(id: string) {
    try {
      const doc = await adminDb.collection('themes').doc(id).get();
      if (!doc.exists) return null;
      return doc.data() as Theme;
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Returning mock theme detail.');
      const db = readMockDB();
      const t = db.themes.find(theme => theme.id === id);
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
      const db = readMockDB();
      return db.themes.filter(t => t.author_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async getPublishedThemes() {
    try {
      const snapshot = await adminDb.collection('themes').where('status', '==', 'published').get();
      return snapshot.docs.map(doc => doc.data() as Theme);
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Returning mock published themes.');
      const db = readMockDB();
      const published = db.themes.filter(t => t.status === 'published');
      
      if (published.length === 0) {
        return [
          { id: 'mock-1', title: 'Action Words 🏃‍♂️', description: 'Basic verbs for everyday actions', words_count: 12, status: 'published' },
          { id: 'mock-2', title: 'Food & Drinks 🍎', description: 'Common fruits, vegetables, and beverages', words_count: 15, status: 'published' },
          { id: 'mock-3', title: 'Colors & Shapes 🔴', description: 'Learn to describe the visual world', words_count: 10, status: 'published' }
        ] as any[];
      }
      return published;
    }
  }
};
