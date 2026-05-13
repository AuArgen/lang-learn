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
    <div className="space-y-8 w-full pb-12">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-50 rounded-full blur-3xl -ml-10 -mb-10 opacity-60"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {t('myThemes')}
              </span>
              <span className="text-3xl">🎯</span>
            </h2>
            <p className="text-slate-500 mt-3 text-lg font-medium max-w-2xl">{t('themesDesc')}</p>
          </div>
        </div>
      </div>

      <ThemesClient themes={themes} isAdmin={isAdmin} />
    </div>
  )
}
