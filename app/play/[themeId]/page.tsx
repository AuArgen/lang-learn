import { Metadata } from 'next';
import { themesService } from '@/lib/firebase/services/themes';
import { wordsService } from '@/lib/firebase/services/words';
import PlayContainer from '@/components/PlayContainer';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { themeId: string } }): Promise<Metadata> {
  const { themeId } = await params;
  const theme = await themesService.getTheme(themeId);
  
  return {
    title: theme ? `Оюн: ${theme.title}` : 'Оюн',
  };
}

export default async function PlayPage({ params }: { params: { themeId: string } }) {
  const { themeId } = await params;
  const theme = await themesService.getTheme(themeId);
  
  if (!theme) {
    return redirect('/');
  }

  const words = await wordsService.getWordsByTheme(themeId);

  if (words.length === 0) {
    const t = await getTranslations('PlayGame');
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('noWordsInTheme')}</h2>
          <p className="text-slate-500">{t('needAtLeastOneWord')}</p>
        </div>
      </div>
    );
  }

  return <PlayContainer theme={theme} words={words} themeId={themeId} />;
}
