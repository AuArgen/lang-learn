import { adminDb } from '../admin';
import * as admin from 'firebase-admin';
import { themesService } from './themes';
import { readMockDB, writeMockDB } from './mockDb';

export interface Word {
  id?: string;
  theme_id: string;
  word: string;
  translation: string;
  language: string;
  audio_url?: string;
}

export const wordsService = {
  async addWord(data: Omit<Word, 'id'>) {
    try {
      const docRef = adminDb.collection('words').doc();
      const word = { ...data, id: docRef.id };
      await docRef.set(word);

      // Update count in theme
      await adminDb.collection('themes').doc(data.theme_id).update({
        words_count: admin.firestore.FieldValue.increment(1)
      });

      return word;
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Adding word to local memory mock.');
      const db = readMockDB();
      const newWord = { ...data, id: 'mock-word-' + Date.now() };
      db.words.push(newWord);
      writeMockDB(db);
      themesService.updateMockThemeCount(data.theme_id, 1);
      return newWord;
    }
  },

  async updateWord(id: string, data: Partial<Word>) {
    try {
      await adminDb.collection('words').doc(id).update(data);
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Updating word in local memory mock.');
      const db = readMockDB();
      const wordIndex = db.words.findIndex(w => w.id === id);
      if (wordIndex > -1) {
        db.words[wordIndex] = { ...db.words[wordIndex], ...data };
        writeMockDB(db);
      }
    }
  },

  async deleteWord(id: string, themeId: string) {
    try {
      await adminDb.collection('words').doc(id).delete();
      await adminDb.collection('themes').doc(themeId).update({
        words_count: admin.firestore.FieldValue.increment(-1)
      });
    } catch (error: any) {
      console.warn('⚠️ Firestore disabled. Deleting word from local memory mock.');
      const db = readMockDB();
      const index = db.words.findIndex(w => w.id === id);
      if (index > -1) {
        db.words.splice(index, 1);
        writeMockDB(db);
      }
      themesService.updateMockThemeCount(themeId, -1);
    }
  },
  
  async getWordsByTheme(themeId: string) {
    try {
      const snapshot = await adminDb.collection('words').where('theme_id', '==', themeId).get();
      return snapshot.docs.map(doc => doc.data() as Word);
    } catch (error: any) {
      const db = readMockDB();
      const themeWords = db.words.filter(w => w.theme_id === themeId);
      return themeWords;
    }
  }
};
