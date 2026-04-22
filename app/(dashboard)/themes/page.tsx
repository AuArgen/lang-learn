import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser } from '@/lib/auth/server-auth';
import ThemesClient from './ThemesClient';
import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  const t = await getTranslations('Themes');
  const user = await getServerUser();
  if (!user) return <div>{t('loginRequired')}</div>;

  const userRole = user.role?.toUpperCase() || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR';

  let themes: import('@/lib/types/theme').Theme[] = [];
  if (isAdmin) {
    // Admin sees all themes to manage publications
    const allThemes = await prisma.theme.findMany({
      orderBy: { created_at: 'desc' }
    });
    themes = allThemes.map(t => ({
      ...t,
      created_at: t.created_at.toISOString(),
      language: t.language || 'en',
      status: t.status as "draft" | "pending" | "published"
    })) as import('@/lib/types/theme').Theme[];
  } else {
    themes = await themesService.getThemesByUser(user.userId);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('myThemes')}</h2>
        <p className="text-slate-500 mt-2">{t('themesDesc')}</p>
      </div>

      <ThemesClient themes={themes} isAdmin={isAdmin} />
    </div>
  )
}
