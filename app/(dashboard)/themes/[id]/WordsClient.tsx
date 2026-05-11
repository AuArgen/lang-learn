'use client';

import { useState, useRef } from 'react';
import { addWordAction, deleteWordAction, updateWordAction } from '@/app/actions/word-actions';
import { requestPublicationAction } from '@/app/actions/theme-actions';
import { generateWordsWithAIAction, addGeneratedWordsAction } from '@/app/actions/user-actions';
import { POPULAR_LANGUAGES } from '@/lib/types/theme';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import GeminiKeyForm from '@/components/GeminiKeyForm';

interface GeneratedWord { word: string; translation: string; }

export default function WordsClient({
  theme,
  words,
  appUrl,
  userRole,
  isAuthorOrAdmin,
  geminiKeyStatus,
}: {
  theme: any;
  words: any[];
  appUrl: string;
  userRole: string;
  isAuthorOrAdmin: boolean;
  geminiKeyStatus: { hasKey: boolean; maskedKey: string | null };
}) {
  const t = useTranslations('ThemeDetails');
  const tThemes = useTranslations('Themes');

  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // AI generation state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiWords, setAiWords] = useState<GeneratedWord[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [addingWords, setAddingWords] = useState(false);
  const [addResult, setAddResult] = useState<{ added: number; skipped: number } | null>(null);

  const themeLanguageName = POPULAR_LANGUAGES.find(l => l.code === theme.language)?.name;
  const wordLabelText = themeLanguageName ? t('wordLabelWithLang', { lang: themeLanguageName }) : t('wordLabelFallback');

  let wordPlaceholder = t('wordPlaceholder');
  if (theme.language === 'en') wordPlaceholder = 'Apple';
  if (theme.language === 'ru') wordPlaceholder = 'Яблоко';
  if (theme.language === 'tr') wordPlaceholder = 'Elma';
  if (theme.language === 'ky') wordPlaceholder = 'Алма';

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg('');
    try {
      if (editingWord) {
        await updateWordAction(editingWord.id, theme.id, formData);
        setEditingWord(null);
      } else {
        await addWordAction(theme.id, formData);
        formRef.current?.reset();
      }
    } catch (error: any) {
      setErrorMsg(error.message || t('errorOccurred'));
    }
  };

  const handleGenerateAI = async () => {
    setAiError('');
    setAiWords([]);
    setSelectedWords(new Set());
    setAddResult(null);
    setAiLoading(true);
    try {
      const result = await generateWordsWithAIAction(theme.id);
      setAiWords(result);
      setSelectedWords(new Set(result.map((_, i) => i)));
    } catch (e: any) {
      setAiError(e.message || t('errorOccurred'));
    } finally {
      setAiLoading(false);
    }
  };

  const toggleWord = (idx: number) => {
    setSelectedWords(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleAddSelected = async () => {
    const toAdd = aiWords.filter((_, i) => selectedWords.has(i));
    if (toAdd.length === 0) return;
    setAddingWords(true);
    setAiError('');
    try {
      const result = await addGeneratedWordsAction(theme.id, toAdd);
      setAddResult(result);
      setAiWords([]);
      setSelectedWords(new Set());
    } catch (e: any) {
      setAiError(e.message || t('aiAddError'));
    } finally {
      setAddingWords(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/themes" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition text-slate-600">
           &larr;
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{theme.title}</h2>
            {isAuthorOrAdmin && (
              <Link href={`/themes/${theme.id}/edit`} className="text-sm bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 px-3 py-1 rounded-full transition-colors font-medium border border-slate-200 hover:border-indigo-200">
                {t('editThemeBtn')}
              </Link>
            )}
          </div>
          <p className="text-slate-500 mt-1">{theme.description}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-5">
          {/* Manual add/edit form */}
          <form
            key={editingWord ? editingWord.id : 'new'}
            action={handleSubmit}
            ref={formRef}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
          >
            <h3 className="text-lg font-bold mb-4 text-slate-800">
              {editingWord ? t('editWord') : t('addWord')}
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                <span>⚠️</span><span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{wordLabelText}</label>
                <input
                  name="word"
                  required
                  defaultValue={editingWord?.word || ''}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder={wordPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('translationLabel')}</label>
                <input
                  name="translation"
                  required
                  defaultValue={editingWord?.translation || ''}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder={t('translationPlaceholder')}
                />
              </div>

              <div className="flex flex-row items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="is_manual_input"
                  id="is_manual_input"
                  defaultChecked={editingWord?.is_manual_input || false}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_manual_input" className="text-sm font-semibold text-slate-700 select-none cursor-pointer">
                  {t('manualInputLabel')}
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all active:scale-95 flex items-center justify-center">
                  {editingWord ? tThemes('save') : t('addWordBtn')}
                </button>
                {editingWord && (
                  <button
                    type="button"
                    onClick={() => { setEditingWord(null); setErrorMsg(''); }}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                  >
                    {tThemes('cancel')}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* AI generation panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setAiOpen(v => !v)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">✨</div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{t('aiTitle')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t('aiSubtitle')}</p>
                </div>
              </div>
              <span className="text-slate-400 text-lg">{aiOpen ? '▲' : '▼'}</span>
            </button>

            {aiOpen && (
              <div className="px-5 pb-5 border-t border-slate-100 space-y-4 pt-4">
                {aiError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-start gap-2">
                    <span>⚠️</span><span>{aiError}</span>
                  </div>
                )}

                {addResult && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium flex items-start gap-2">
                    <span>✅</span>
                    <span>
                      {t('aiAddedCount', { count: addResult.added })}
                      {addResult.skipped > 0 ? `, ${t('aiSkippedCount', { count: addResult.skipped })}` : ''}
                    </span>
                  </div>
                )}

                {aiWords.length === 0 ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      {t('aiDescriptionLine1', { title: theme.title })}
                      {' '}{t('aiDescriptionLine2')}
                    </p>
                    <button
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {aiLoading ? (
                        <><span className="animate-spin inline-block">⏳</span> {t('aiLoading')}</>
                      ) : (
                        <><span>✨</span> {t('aiGenerateBtn')}</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">{t('aiSelectLabel')}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedWords(new Set(aiWords.map((_, i) => i)))}
                          className="text-xs text-indigo-600 hover:underline"
                        >{t('aiSelectAll')}</button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => setSelectedWords(new Set())}
                          className="text-xs text-slate-500 hover:underline"
                        >{t('aiDeselectAll')}</button>
                      </div>
                    </div>

                    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {aiWords.map((w, i) => (
                        <li key={i}>
                          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedWords.has(i) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                            <input
                              type="checkbox"
                              checked={selectedWords.has(i)}
                              onChange={() => toggleWord(i)}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-slate-800 text-sm">{w.word}</span>
                              <span className="text-slate-400 mx-2 text-xs">→</span>
                              <span className="text-slate-600 text-sm">{w.translation}</span>
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleAddSelected}
                        disabled={addingWords || selectedWords.size === 0}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {addingWords ? <span className="animate-spin">⏳</span> : t('aiAddSelected', { count: selectedWords.size })}
                      </button>
                      <button
                        onClick={() => { setAiWords([]); setSelectedWords(new Set()); setAiError(''); }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                      >
                        {tThemes('cancel')}
                      </button>
                    </div>
                    <button
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      {aiLoading ? <span className="animate-spin">⏳</span> : '🔄'} {t('aiRegenerate')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gemini API key form */}
          <GeminiKeyForm hasKey={geminiKeyStatus.hasKey} maskedKey={geminiKeyStatus.maskedKey} />

          {/* Publish status */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-indigo-900 font-bold mb-2">{t('publishStatus')}: {theme.status.toUpperCase()}</h3>
            <p className="text-sm text-indigo-700 mb-4 font-medium">
              {theme.words_count >= 10 ? t('publishReady') : t('publishWarning')}
            </p>
            {userRole !== 'USER' && theme.words_count >= 10 && theme.status === 'draft' && (
              <form action={requestPublicationAction.bind(null, theme.id)}>
                <button className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm font-semibold text-sm transition active:scale-95">
                  {(userRole === 'ADMIN' || userRole === 'ADMINISTRATOR') ? tThemes('publish') : t('publishRequestBtn')}
                </button>
              </form>
            )}
            {(userRole === 'ADMIN' || userRole === 'ADMINISTRATOR') && theme.status === 'pending' && (
              <form action={requestPublicationAction.bind(null, theme.id)}>
                <button className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm font-semibold text-sm transition active:scale-95 mt-2">
                  {tThemes('publish')}
                </button>
              </form>
            )}
            {theme.words_count >= 3 && (
              <div className="mt-4 pt-4 border-t border-indigo-200/60">
                <p className="text-xs text-indigo-600 font-semibold mb-2">{t('publicLink')}</p>
                <input readOnly value={`${appUrl}/play/${theme.id}`} className="w-full bg-white/60 text-indigo-900 px-4 py-2 font-medium text-sm rounded-xl border border-indigo-200 focus:outline-none" />
              </div>
            )}
          </div>
        </div>

        {/* Right column: word list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[800px]">
          <div className="p-5 bg-slate-50/50 border-b border-slate-200 font-bold text-slate-800 flex justify-between">
            <span>{t('allWords', { count: words.length })}</span>
          </div>
          <ul className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {words.map(w => {
              const isSelected = editingWord?.id === w.id;
              return (
                <li key={w.id} className={`p-4 flex items-center justify-between transition-colors ${isSelected ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'}`}>
                  <div className="px-1">
                    <p className="font-bold text-slate-800 text-base">
                      {w.word}
                      {w.is_manual_input && <span className="ml-2 inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded border border-indigo-200">{t('textBadge')}</span>}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{w.translation}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingWord(w)}
                      className={`p-2 rounded-lg transition flex items-center justify-center ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      title={tThemes('actionEdit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <form action={async () => {
                      if (confirm(t('deleteWordConfirm'))) {
                        await deleteWordAction(w.id, theme.id);
                        if (editingWord?.id === w.id) setEditingWord(null);
                      }
                    }}>
                      <button title={tThemes('actionDelete')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
            {words.length === 0 && (
              <li className="p-12 text-center flex flex-col items-center">
                <p className="text-slate-500 font-medium">{t('emptyDictionary')}</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
