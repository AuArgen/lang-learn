'use client';

import { useState, useRef } from 'react';
import { addWordAction, deleteWordAction, updateWordAction } from '@/app/actions/word-actions';
import { requestPublicationAction } from '@/app/actions/theme-actions';
import { POPULAR_LANGUAGES } from '@/lib/types/theme';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function WordsClient({
  theme,
  words,
  appUrl,
  userRole,
  isAuthorOrAdmin
}: {
  theme: any;
  words: any[];
  appUrl: string;
  userRole: string;
  isAuthorOrAdmin: boolean;
}) {
  const t = useTranslations('ThemeDetails');
  const tThemes = useTranslations('Themes');
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const themeLanguageName = POPULAR_LANGUAGES.find(l => l.code === theme.language)?.name;
  const wordLabelText = themeLanguageName ? t('wordLabelWithLang', { lang: themeLanguageName }) : t('wordLabelFallback');
  
  let wordPlaceholder = 'Сөздү жазыңыз';
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
        <div className="space-y-6">
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
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {errorMsg}
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
                    onClick={() => {
                        setEditingWord(null);
                        setErrorMsg('');
                    }}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                  >
                    {tThemes('cancel')}
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
             <h3 className="text-indigo-900 font-bold mb-2">{t('publishStatus')}: {theme.status.toUpperCase()}</h3>
             <p className="text-sm text-indigo-700 mb-4 font-medium">
               {theme.words_count >= 10 
                  ? t('publishReady')
                  : t('publishWarning')}
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
