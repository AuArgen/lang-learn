'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayContainer from '@/components/PlayContainer';
import { useTranslations, useLocale } from 'next-intl';

const STORAGE_KEY = 'bilim_local_play';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ky', label: 'Кыргызча' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
];

interface LocalWord {
  id: string;
  word: string;
  translation: string;
  is_manual_input?: boolean;
}

interface LocalData {
  themeName: string;
  language: string;
  words: LocalWord[];
}

const defaultData: LocalData = { themeName: '', language: 'en', words: [] };

export default function LocalPlayPage() {
  const t = useTranslations('LocalPlay');
  const locale = useLocale();
  const [data, setData] = useState<LocalData>(defaultData);
  const [wordInput, setWordInput] = useState('');
  const [translationInput, setTranslationInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved));
    } catch {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const addWord = () => {
    const w = wordInput.trim();
    const tr = translationInput.trim();
    if (!w || !tr) return;
    setData(prev => ({
      ...prev,
      words: [...prev.words, { id: Date.now().toString(), word: w, translation: tr }],
    }));
    setWordInput('');
    setTranslationInput('');
  };

  const removeWord = (id: string) => {
    setData(prev => ({ ...prev, words: prev.words.filter(w => w.id !== id) }));
  };

  const clearAll = () => {
    if (confirm(t('clearAllConfirm'))) {
      setData(defaultData);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addWord();
  };

  if (!isLoaded) return null;

  if (isPlaying && data.words.length > 0) {
    const theme = {
      id: 'local',
      title: data.themeName || t('defaultThemeName'),
      description: '',
      language: data.language,
    };
    return (
      <PlayContainer
        theme={theme}
        words={data.words}
        themeId=""
        isLocal
        onBackToSetup={() => setIsPlaying(false)}
      />
    );
  }

  const backLabel = locale === 'ru' ? 'Назад' : locale === 'en' ? 'Back' : 'Артка';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 pb-16">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              {t('badge')}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        {/* Theme settings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t('themeNameLabel')}
            </label>
            <input
              type="text"
              value={data.themeName}
              onChange={e => setData(prev => ({ ...prev, themeName: e.target.value }))}
              placeholder={t('themeNamePlaceholder')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-indigo-400 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t('languageLabel')}
            </label>
            <select
              value={data.language}
              onChange={e => setData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-indigo-400 focus:outline-none transition"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add word form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {t('addWord')}
          </h2>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={wordInput}
              onChange={e => setWordInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('wordPlaceholder')}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-indigo-400 focus:outline-none transition"
            />
            <span className="text-slate-300 font-light text-lg flex-shrink-0">→</span>
            <input
              type="text"
              value={translationInput}
              onChange={e => setTranslationInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('translationPlaceholder')}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-indigo-400 focus:outline-none transition"
            />
            <button
              onClick={addWord}
              disabled={!wordInput.trim() || !translationInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition flex-shrink-0"
            >
              {t('addBtn')}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">{t('addHint')}</p>
        </div>

        {/* Word list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">
              {t('wordsCount', { count: data.words.length })}
            </span>
            {data.words.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition"
              >
                {t('clearAll')}
              </button>
            )}
          </div>

          {data.words.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-slate-400 text-sm">{t('noWords')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {data.words.map((w, i) => (
                <li
                  key={w.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition group"
                >
                  <span className="text-xs text-slate-300 w-5 text-right flex-shrink-0 font-mono">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-slate-800 font-semibold text-sm truncate">{w.word}</span>
                  <span className="text-slate-300 text-xs flex-shrink-0">→</span>
                  <span className="flex-1 text-slate-500 text-sm truncate">{w.translation}</span>
                  <button
                    onClick={() => removeWord(w.id)}
                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs"
                    title="Delete"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Saved locally banner */}
        {data.words.length > 0 && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <span className="text-xl mt-0.5">💾</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">{t('savedLocally')}</p>
              <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">{t('savedLocallyDesc')}</p>
            </div>
          </div>
        )}

        {/* Play button */}
        <button
          onClick={() => {
            if (data.words.length === 0) return alert(t('minWordsWarning'));
            setIsPlaying(true);
          }}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>🎮</span>
          {t('playBtn')} ({data.words.length})
        </button>

        {/* Register CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white text-center">
          <p className="text-base font-bold mb-1">{t('registerTitle')}</p>
          <p className="text-sm text-indigo-200 mb-4 leading-relaxed">{t('registerDesc')}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-white text-indigo-700 font-bold text-sm rounded-full hover:bg-indigo-50 transition shadow-md"
          >
            {t('registerCta')}
          </Link>
        </div>
      </main>
    </div>
  );
}
