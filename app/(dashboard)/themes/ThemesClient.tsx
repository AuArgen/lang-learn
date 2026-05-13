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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Gamified Guide */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-1 shadow-lg shadow-indigo-200/50">
        <div className="bg-white/95 backdrop-blur-sm rounded-[22px] px-6 py-6 sm:px-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🚀</span>
            <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500 uppercase tracking-widest">{t('guideTitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Decorative arrow between step 1 and 2 */}
            <div className="hidden md:block absolute top-6 left-1/3 w-8 h-8 text-indigo-200 -translate-x-1/2">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
            {/* Decorative arrow between step 2 and 3 */}
            <div className="hidden md:block absolute top-6 left-2/3 w-8 h-8 text-purple-200 -translate-x-1/2">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>

            {/* Step 1 */}
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 font-black text-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">1</div>
              <div>
                <p className="font-bold text-slate-800 text-base">{t('guideStep1')}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{t('guideStep1Desc')}</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 font-black text-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">2</div>
              <div>
                <p className="font-bold text-slate-800 text-base">{t('guideStep2')}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{t('guideStep2Desc')}</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 font-black text-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">3</div>
              <div>
                <p className="font-bold text-slate-800 text-base">{t('guideStep3')}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{t('guideStep3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side: Form */}
        <div className="w-full lg:w-[380px] flex-shrink-0 sticky top-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
            {/* Decorative blurs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-50 transition-opacity group-hover:opacity-100"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-extrabold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  {editingTheme ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
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
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">{t('themeTitle')}</label>
                  <input 
                    name="title" 
                    required 
                    defaultValue={editingTheme?.title || ''}
                    className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400 font-semibold text-base" 
                    placeholder={t('themeTitlePlaceholder')} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">{t('details')}</label>
                  <textarea 
                    name="description" 
                    required 
                    defaultValue={editingTheme?.description || ''}
                    rows={3}
                    className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all resize-none placeholder:text-slate-400 font-medium" 
                    placeholder={t('detailsPlaceholder')} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">{t('languageLabel')}</label>
                  <select
                    name="language"
                    required
                    defaultValue={editingTheme?.language || ''}
                    className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all font-semibold appearance-none cursor-pointer"
                  >
                    <option value="" disabled>{t('languageSelect')}</option>
                    {POPULAR_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl border-b-4 border-indigo-800 hover:bg-indigo-500 hover:border-indigo-700 active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
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
                      className="px-5 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl border-b-4 border-slate-200 hover:bg-slate-200 hover:border-slate-300 active:border-b-0 active:translate-y-[4px] transition-all"
                    >
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side: Themes Grid */}
        <div className="flex-1">
          {themes.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-indigo-400" />
              </div>
              <h4 className="text-2xl font-bold text-slate-800 mb-2">{t('noThemes')}</h4>
              <p className="text-slate-500 max-w-md mx-auto">{t('noThemesDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {themes.map(theme => {
                const isSelected = editingTheme?.id === theme.id;
                
                return (
                  <div 
                    key={theme.id} 
                    className={`group relative flex flex-col bg-white rounded-3xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isSelected ? 'border-indigo-400 shadow-lg shadow-indigo-100' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-2">
                          {theme.language && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-extrabold tracking-wide uppercase">
                              {POPULAR_LANGUAGES.find(l => l.code === theme.language)?.name || theme.language}
                            </span>
                          )}
                          {(theme.words_count || 0) === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-extrabold tracking-wide uppercase">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              {t('noWordsWarning')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-extrabold tracking-wide uppercase">
                              {t('wordsCount', { count: theme.words_count || 0 })}
                            </span>
                          )}
                        </div>
                        
                        {/* Status Dots */}
                        <div className="flex items-center" title={
                          theme.status === 'published' ? t('statusPublished') : 
                          theme.status === 'pending' ? t('statusPending') : t('statusDraft')
                        }>
                          <span className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                            theme.status === 'published' ? 'bg-emerald-500' : 
                            theme.status === 'pending' ? 'bg-blue-500' : 'bg-slate-300'
                          }`}></span>
                        </div>
                      </div>
                      
                      <h4 className="text-xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {theme.title}
                      </h4>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1">
                        {theme.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/themes/${theme.id}`}
                            className={(theme.words_count || 0) === 0
                              ? "inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl border-b-[3px] border-indigo-800 active:border-b-0 active:translate-y-[3px] transition-all"
                              : "inline-flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl border-b-[3px] border-slate-300 active:border-b-0 active:translate-y-[3px] transition-all"
                            }
                            title={t('actionAddWord')}
                          >
                            <Plus className="w-5 h-5" />
                          </Link>

                          {(theme.words_count || 0) > 0 && (
                            <Link
                              href={`/play/${theme.id}`}
                              className="inline-flex items-center justify-center w-10 h-10 bg-emerald-500 text-white hover:bg-emerald-400 rounded-xl border-b-[3px] border-emerald-700 active:border-b-0 active:translate-y-[3px] transition-all shadow-sm shadow-emerald-200"
                              title={t('actionPlay')}
                            >
                              <Play className="w-5 h-5 ml-1" fill="currentColor" />
                            </Link>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl">
                          <button
                            onClick={() => setEditingTheme(theme)}
                            className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm'}`}
                            title={t('actionEdit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <Link
                            href={`/themes/${theme.id}/history`}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all"
                            title={t('actionHistory')}
                          >
                            <History className="w-4 h-4" />
                          </Link>

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
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm transition-all"
                              title={t('actionDelete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      </div>
                      
                      {/* Publication Actions Container */}
                      <div className="mt-4 flex gap-2">
                        {theme.status === 'draft' && (
                          <form 
                            action={async () => {
                              if ((theme.words_count || 0) < 10) {
                                alert(t('publishError'));
                                return;
                              }
                              await requestPublicationAction(theme.id!);
                            }} 
                            className="w-full"
                          >
                            <button 
                              type="submit"
                              className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-all border border-blue-100"
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" /> {isAdmin ? t('publish') : t('publishRequestBtn')}
                            </button>
                          </form>
                        )}
                        
                        {theme.status === 'pending' && isAdmin && (
                          <form 
                            action={async () => {
                              await requestPublicationAction(theme.id!); // admin: draft->pending->published
                            }} 
                            className="w-full"
                          >
                            <button 
                              type="submit"
                              className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl transition-all border border-emerald-100"
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
                            className="w-full"
                          >
                            <button 
                              type="submit"
                              className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all border border-slate-100"
                            >
                              <Info className="w-3.5 h-3.5 mr-1.5" /> {t('unpublish')}
                            </button>
                          </form>
                        )}
                      </div>
                      
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
