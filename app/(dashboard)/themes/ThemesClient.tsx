'use client';

import { Theme, POPULAR_LANGUAGES } from '@/lib/types/theme';
import { createThemeAction, deleteThemeAction, requestPublicationAction, updateThemeAction, unpublishThemeAction } from '@/app/actions/theme-actions';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Play, Plus, Edit, Trash2, Send, CheckCircle, Info, History } from 'lucide-react';
import { useTranslations } from 'next-intl';

type ThemesClientProps = {
  themes: Theme[];
  isAdmin?: boolean;
};

export default function ThemesClient({ themes, isAdmin = false }: ThemesClientProps) {
  const t = useTranslations('Themes');
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Сол жак: Форма (Left side: Form) */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
          <h3 className="text-xl font-bold mb-6 text-slate-800">
            {editingTheme ? t('editTheme') : t('createTheme')}
          </h3>
          
          <form 
            key={editingTheme ? editingTheme.id : 'new'} 
            action={async (formData) => {
              if (editingTheme) {
                await updateThemeAction(editingTheme.id!, formData);
                setEditingTheme(null);
              } else {
                await createThemeAction(formData);
                formRef.current?.reset();
              }
            }} 
            ref={formRef}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('themeTitle')}</label>
              <input 
                name="title" 
                required 
                defaultValue={editingTheme?.title || ''}
                className="w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium" 
                placeholder={t('themeTitlePlaceholder')} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('details')}</label>
              <textarea 
                name="description" 
                required 
                defaultValue={editingTheme?.description || ''}
                rows={4}
                className="w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none placeholder:text-slate-400" 
                placeholder={t('detailsPlaceholder')} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('languageLabel')}</label>
              <select
                name="language"
                required
                defaultValue={editingTheme?.language || ''}
                className="w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium appearance-none"
              >
                <option value="" disabled>{t('languageSelect')}</option>
                {POPULAR_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {editingTheme ? (
                  <>{t('save')}</>
                ) : (
                  <><Plus className="w-5 h-5" /> {t('add')}</>
                )}
              </button>
              
              {editingTheme && (
                <button 
                  type="button" 
                  onClick={() => setEditingTheme(null)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  {t('cancel')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Оң жак: Таблица (Right side: Table) */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-5 py-4 text-sm font-bold text-slate-700">{t('tableTitle')}</th>
                  <th className="px-5 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">{t('tableTime')}</th>
                  <th className="px-5 py-4 text-sm font-bold text-slate-700 text-right">{t('tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {themes.map(theme => {
                  const isSelected = editingTheme?.id === theme.id;
                  
                  return (
                  <tr key={theme.id} className={`group transition-colors ${isSelected ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'}`}>
                    <td className="px-5 py-4 min-w-[200px]">
                      <div className="font-bold text-slate-800 text-base">{theme.title}</div>
                      <div className="text-sm text-slate-500 mt-1 line-clamp-2">{theme.description}</div>
                      <div className="flex items-center gap-3 mt-3">
                        {theme.language && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                            {POPULAR_LANGUAGES.find(l => l.code === theme.language)?.name || theme.language}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                          {t('wordsCount', { count: theme.words_count || 0 })}
                        </span>
                        {/* Статусу төмөн жагында чыгат */}
                        {theme.status === 'published' && <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold"><CheckCircle className="w-3 h-3 mr-1"/> {t('statusPublished')}</span>}
                        {theme.status === 'pending' && <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold"><Info className="w-3 h-3 mr-1"/> {t('statusPending')}</span>}
                        {theme.status === 'draft' && <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold">{t('statusDraft')}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm tracking-tight text-slate-500 whitespace-nowrap align-top pt-5">
                      {new Date(theme.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-5 py-4 text-right align-top pt-5">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setEditingTheme(theme)}
                            className={`p-2 rounded-lg transition font-medium flex items-center justify-center ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                            title={t('actionEdit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <form 
                            action={async () => {
                              if (theme.words_count > 0) {
                                alert(t('deleteError'));
                                return;
                              }
                              if (confirm(t('deleteConfirm'))) {
                                await deleteThemeAction(theme.id!);
                                if (editingTheme?.id === theme.id) setEditingTheme(null);
                              }
                            }}
                          >
                            <button 
                              type="submit" 
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-2"
                              title={t('actionDelete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>

                          <Link 
                            href={`/themes/${theme.id}`} 
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title={t('actionAddWord')}
                          >
                            <Plus className="w-4 h-4" />
                          </Link>

                          <Link 
                            href={`/themes/${theme.id}/history`} 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title={t('actionHistory')}
                          >
                            <History className="w-4 h-4" />
                          </Link>
                          
                          <Link 
                            href={`/play/${theme.id}`} 
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title={t('actionPlay')}
                          >
                            <Play className="w-4 h-4" />
                          </Link>
                        </div>

                        {/* Публикацияга жиберүү баскычы ылдыйда */}
                        {theme.status === 'draft' && (
                          <form 
                            action={async () => {
                              if ((theme.words_count || 0) < 10) {
                                alert(t('publishError'));
                                return;
                              }
                              await requestPublicationAction(theme.id!);
                            }} 
                            className="mt-1"
                          >
                            <button 
                              type="submit"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" /> {isAdmin ? t('publish') : t('publishRequestBtn')}
                            </button>
                          </form>
                        )}
                        
                        {theme.status === 'pending' && isAdmin && (
                          <form 
                            action={async () => {
                              await requestPublicationAction(theme.id!); // for admin this sets to published
                            }} 
                            className="mt-1"
                          >
                            <button 
                              type="submit"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-white border border-green-200 shadow-sm text-green-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 focus:ring-2 focus:ring-green-100 rounded-lg transition-all"
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" /> {t('publish')}
                            </button>
                          </form>
                        )}

                        {(theme.status === 'published' || (theme.status === 'pending' && isAdmin)) && (
                          <form 
                            action={async () => {
                                if (confirm(t('unpublishConfirm'))) {
                                  await unpublishThemeAction(theme.id!);
                                }
                            }} 
                            className="mt-1"
                          >
                            <button 
                              type="submit"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 shadow-sm text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 focus:ring-2 focus:ring-red-200 rounded-lg transition-all"
                            >
                              <Info className="w-3.5 h-3.5 mr-1.5" /> {t('unpublish')}
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
                {themes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                          <Plus className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-base font-medium text-slate-600">{t('noThemes')}</p>
                        <p className="text-sm mt-1">{t('noThemesDesc')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
