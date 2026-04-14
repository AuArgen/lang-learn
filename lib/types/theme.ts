export interface Theme {
  id?: string;
  author_id: string;
  title: string;
  description: string;
  language?: string;
  words_count: number;
  status: 'draft' | 'pending' | 'published';
  created_at: string;
}

export const POPULAR_LANGUAGES = [
  { code: 'ky', name: 'Кыргыз тили' },
  { code: 'en', name: 'Англис тили' },
  { code: 'ru', name: 'Орус тили' },
  { code: 'tr', name: 'Түрк тили' },
  { code: 'zh', name: 'Кытай тили' },
  { code: 'ar', name: 'Араб тили' },
  { code: 'es', name: 'Испан тили' },
  { code: 'fr', name: 'Француз тили' },
  { code: 'de', name: 'Немис тили' },
  { code: 'ko', name: 'Корей тили' },
  { code: 'ja', name: 'Жапон тили' }
];
