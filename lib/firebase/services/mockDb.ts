import fs from 'fs';
import path from 'path';
import { Theme } from '@/lib/types/theme';
import { Word } from './words'; // We'll make sure this works, or we can just use any

const DATA_DIR = path.join(process.cwd(), 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {}

const DB_PATH = path.join(DATA_DIR, '.mock-db.json');

interface MockDB {
  themes: Theme[];
  words: any[]; // We'll use any to avoid cyclic dependencies if any
  games: any[];
  game_results: any[];
}

const defaultDB: MockDB = {
  themes: [],
  words: [
    { id: 'm1-1', theme_id: 'user-mock-1', word: 'Cat', translation: 'Мышык', language: 'en' },
    { id: 'm1-2', theme_id: 'user-mock-1', word: 'Dog', translation: 'Ит', language: 'en' },
    { id: 'm1-3', theme_id: 'user-mock-1', word: 'Tiger', translation: 'Жолборс', language: 'en' },
    { id: 'm2-1', theme_id: 'user-mock-2', word: 'Give up', translation: 'Багынуу, таштоо', language: 'en' },
    { id: 'm2-2', theme_id: 'user-mock-2', word: 'Look for', translation: 'Издөө', language: 'en' },
    { id: 'm2-3', theme_id: 'user-mock-2', word: 'Take off', translation: 'Чечүү, учуу', language: 'en' }
  ],
  games: [],
  game_results: []
};

export function readMockDB(): MockDB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeMockDB(defaultDB);
      return defaultDB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data) as MockDB;
    if (!parsed.games) parsed.games = [];
    if (!parsed.game_results) parsed.game_results = [];
    return parsed;
  } catch (error) {
    return defaultDB;
  }
}

export function writeMockDB(data: MockDB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write mock db', error);
  }
}
