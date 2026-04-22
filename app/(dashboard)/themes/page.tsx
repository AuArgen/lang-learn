import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser } from '@/lib/auth/server-auth';
import ThemesClient from './ThemesClient';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  const t = await getTranslations('Themes');
  const user = await getServerUser();
  if (!user) return <div>{t('loginRequired')}</div>;

  const themes = await themesService.getThemesByUser(user.userId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('myThemes')}</h2>
        <p className="text-slate-500 mt-2">{t('themesDesc')}</p>
      </div>

      <ThemesClient themes={themes} />
    </div>
  )
}
