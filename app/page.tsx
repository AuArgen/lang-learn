import { themesService } from '@/lib/firebase/services/themes';
import Link from 'next/link';
import { Metadata } from 'next';
import { getServerUser } from '@/lib/auth/server-auth';
import { headers } from 'next/headers';
import { getTranslations, getLocale } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// This page queries the database on every request, so opt out of static generation.
// The SQLite database is not available at Docker build time — only at runtime via volume mount.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BilimAi - Англисчени Үн менен Оюн аркылуу Үйрөнүңүз',
  description: 'Интерактивдүү үн таануу оюндары менен англис тилин тез жана кызыктуу үйрөнүңүз.',
  openGraph: {
    title: 'BilimAi Games',
    description: 'Англисче сөздөрдү үн менен туура айтууну машыгыңыз.',
    url: 'https://domain.com',
    siteName: 'BilimAi',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ky_KG',
    type: 'website',
  },
};

export default async function HomePage() {
  const t = await getTranslations('HomePage');
  const locale = await getLocale();
  const themes = await themesService.getPublishedThemes();
  const user = await getServerUser();

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;

  let authUrl = process.env.AUTH_SERVICE_URL || '/api/auth/callback?token=mock_token';
  if (authUrl.includes('localhost:3000')) {
    authUrl = authUrl.replace('http://localhost:3000', appUrl);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            BilimAi
          </div>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
            {user ? (
              <div className="flex items-center gap-4 border-l pl-4 ml-2">
                <Link href="/themes" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                  {t('cabinet')}
                </Link>
                <a href="/api/auth/logout" className="text-sm font-medium text-red-500 hover:text-red-600">
                  {t('logout')}
                </a>
              </div>
            ) : (
              <div className="border-l pl-4 ml-2">
                <a href={authUrl} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition shadow-md shadow-indigo-200">
                  {t('login')}
                </a>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            {t('heroTitle1')} <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              {t('heroTitle2')}
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-6">
            {t('heroDesc')}
          </p>
          <div className="inline-flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-6 py-4 rounded-2xl text-left max-w-3xl">
            <span className="text-3xl">💡</span>
            <p className="text-sm md:text-base text-indigo-900 font-medium leading-relaxed">
              <strong>BilimAi Learn Lang</strong> — {t('aboutProject')}
            </p>
          </div>

          <div className="mt-10 mb-4 flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-75">
            {user ? (
              <Link href="/themes" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition shadow-xl shadow-indigo-200 hover:-translate-y-1 flex items-center gap-2">
                <span className="text-xl">👤</span> {t('cabinet')}
              </Link>
            ) : (
              <a href={authUrl} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition shadow-xl shadow-indigo-200 hover:-translate-y-1 flex items-center gap-2">
                <span className="text-xl">🔐</span> {t('login')}
              </a>
            )}
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 mx-auto max-w-3xl">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-left flex-1">
              <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">🆓</span> {t('freePlan')}
              </h3>
              <ul className="text-slate-600 space-y-3 font-medium text-sm">
                <li className="flex items-start gap-2"><span className="text-green-500 text-base leading-none">✓</span> {t('freePlanFeature1')}</li>
                <li className="flex items-start gap-2"><span className="text-green-500 text-base leading-none">✓</span> {t('freePlanFeature2')}</li>
                <li className="flex items-start gap-2"><span className="text-green-500 text-base leading-none">✓</span> {t('freePlanFeature3')}</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-3xl shadow-sm text-left flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider">PRO</div>
              <h3 className="font-bold text-indigo-900 text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">⭐</span> {t('proPlan')}
              </h3>
              <ul className="text-indigo-800 space-y-3 font-medium text-sm">
                <li className="flex items-start gap-2"><span className="text-indigo-500 text-base leading-none">✓</span> {t('proPlanFeature1')}</li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 text-base leading-none">✓</span> {t('proPlanFeature2')}</li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 text-base leading-none">✓</span> {t('proPlanFeature3')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            🔥 {t('publicGames')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-1000 delay-200 fill-mode-both">
            {themes.map((theme: any) => (
              <Link href={`/play/${theme.id}`} key={theme.id} className="group flex flex-col bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                  🎮
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{theme.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{theme.description}</p>
                <div className="mt-auto flex items-center justify-between text-sm font-medium">
                  <span className="text-slate-400">{t('wordsCount', { count: theme.words_count || 0 })}</span>
                  <span className="text-indigo-600 group-hover:text-indigo-700">{t('play')}</span>
                </div>
              </Link>
            ))}
            {themes.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100">
                <p className="text-lg text-slate-500">{t('noGames')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            🔗 {t('services')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 animate-in fade-in duration-1000 delay-300 fill-mode-both">
            <a href="https://bilimai.kg" target="_blank" rel="noopener noreferrer" className="group flex flex-col bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                🌐
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">BilimAi</h3>
              <p className="text-slate-500 text-sm mb-4">Билим берүү жана жасалма интеллект боюнча башкы платформабызга өтүңүз.</p>
              <div className="mt-auto flex items-center justify-between text-sm font-medium">
                <span className="text-slate-400">bilimai.kg</span>
                <span className="text-blue-600 group-hover:text-blue-700">{t('explore')}</span>
              </div>
            </a>
            
            <a href="https://plus.bilimai.kg" target="_blank" rel="noopener noreferrer" className="group flex flex-col bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                ✨
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">BilimAi Plus</h3>
              <p className="text-slate-500 text-sm mb-4">Кеңейтилген мүмкүнчүлүктөр жана кошумча куралдар камтылган премиум кызматтар.</p>
              <div className="mt-auto flex items-center justify-between text-sm font-medium">
                <span className="text-slate-400">plus.bilimai.kg</span>
                <span className="text-purple-600 group-hover:text-purple-700">{t('explore')}</span>
              </div>
            </a>
          </div>
        </div>
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} BilimAi. {t('rights')}
      </footer>
    </div>
  );
}
