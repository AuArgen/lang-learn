import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerUser } from '@/lib/auth/server-auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getTranslations, getLocale } from 'next-intl/server';
import MobileBottomNav from '@/components/MobileBottomNav';
import { headers } from 'next/headers';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('DashboardNav');
  const locale = await getLocale();
  const user = await getServerUser();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'ADMINISTRATOR';

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  let authUrl = process.env.AUTH_SERVICE_URL || '/api/auth/callback?token=mock_token';
  if (authUrl.includes('localhost:3000')) {
    authUrl = authUrl.replace('http://localhost:3000', appUrl);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pb-16 md:pb-0">
      <nav className="w-full md:w-64 bg-white md:border-r border-b md:border-b-0 p-4 md:p-5 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-stretch gap-2">
        <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent md:mb-6">
          BilimAi Games
        </h1>
        
        <div className="md:mb-4">
          <LanguageSwitcher currentLocale={locale} />
        </div>

        <div className="hidden md:flex flex-col gap-2 flex-1">

        <Link href="/themes" className="text-slate-700 font-medium hover:text-indigo-600 hover:bg-slate-100 p-3 rounded-xl transition duration-200">
          {t('themes')}
        </Link>
        <Link href="/" className="text-slate-700 font-medium hover:text-indigo-600 hover:bg-slate-100 p-3 rounded-xl transition duration-200">
          {t('home')}
        </Link>
        
        {isAdmin && (
          <Link href="/admin" className="text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 p-3 rounded-xl transition duration-200 mt-2">
            {t('admin')}
          </Link>
        )}

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('profile')}</p>
          {user ? (
            <>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    ID: {user.userId.slice(0, 8)}...
                  </p>
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mt-1">
                    {user.role}
                  </div>
                </div>
                <a href="/api/auth/logout" className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Чыгуу">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t('notAuthorized')}</p>
          )}
        </div>
        </div>
      </nav>
      
      <main className="flex-1 overflow-auto p-4 md:p-10">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      <MobileBottomNav 
        user={user} 
        isAdmin={isAdmin}
        authUrl={authUrl}
        tHome={locale === 'ru' ? 'Главная' : locale === 'en' ? 'Home' : 'Башкы'}
        tCabinet={t('themes')}
        tAdmin={t('admin')}
        tLogin={locale === 'ru' ? 'Войти' : locale === 'en' ? 'Login' : 'Кирүү'}
        tLogout={locale === 'ru' ? 'Выйти' : locale === 'en' ? 'Logout' : 'Чыгуу'}
      />
    </div>
  )
}
