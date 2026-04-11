import { adminDb } from '../admin';
import * as admin from 'firebase-admin';
import { themesService } from './themes';

export interface Word {
  id?: string;
  theme_id: string;
  word: string;
  translation: string;
  language: string;
  audio_url?: string;
}

let mockWords: Word[] = [
  { id: 'm1-1', theme_id: 'user-mock-1', word: 'Cat', translation: 'Мышык', language: 'en' },
  { id: 'm1-2', theme_id: 'user-mock-1', word: 'Dog', translation: 'Ит', language: 'en' },
  { id: 'm1-3', theme_id: 'user-mock-1', word: 'Tiger', translation: 'Жолборс', language: 'en' },
  { id: 'm2-1', theme_id: 'user-mock-2', word: 'Give up', translation: 'Багынуу, таштоо', language: 'en' },
  { id: 'm2-2', theme_id: 'user-mock-2', word: 'Look for', translation: 'Издөө', language: 'en' },
  { id: 'm2-3', theme_id: 'user-mock-2', word: 'Take off', translation: 'Чечүү, учуу', language: 'en' }
];

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
      const newWord = { ...data, id: 'mock-word-' + Date.now() };
      mockWords.push(newWord);
      themesService.updateMockThemeCount(data.theme_id, 1);
      return newWord;
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
      mockWords = mockWords.filter(w => w.id !== id);
      themesService.updateMockThemeCount(themeId, -1);
    }
  },
  
  async getWordsByTheme(themeId: string) {
    try {
      const snapshot = await adminDb.collection('words').where('theme_id', '==', themeId).get();
      return snapshot.docs.map(doc => doc.data() as Word);
    } catch (error: any) {
      const themeWords = mockWords.filter(w => w.theme_id === themeId);
      return themeWords;
    }
  }
};
