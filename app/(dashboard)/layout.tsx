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

    <div className="flex flex-col min-h-screen bg-slate-50 pb-16 md:pb-0">
      {/* Top Header Navigation */}
      <header className="w-full bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        
        {/* Left Side: Logo & Main Links */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
              BilimAi Games
            </h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="text-slate-600 font-bold hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all">
              {t('home')}
            </Link>
            <Link href="/themes" className="text-slate-600 font-bold hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all">
              {t('themes')}
            </Link>
            
            {isAdmin && (
              <Link href="/admin" className="text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 hover:shadow-sm px-4 py-2.5 rounded-xl transition-all ml-2">
                {t('admin')}
              </Link>
            )}
          </nav>
        </div>

        {/* Right Side: Language & Profile */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher currentLocale={locale} />
          
          <div className="hidden md:flex items-center border-l border-slate-200 pl-5 ml-1">
            {user ? (
              <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100">
                <div className="text-right flex flex-col justify-center">
                  <p className="text-sm font-extrabold text-slate-800 leading-none mb-1">
                    ID: {user.userId.slice(0, 8)}...
                  </p>
                  <div className="flex justify-end">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest leading-none">
                      {user.role}
                    </span>
                  </div>
                </div>
                
                <div className="w-px h-8 bg-slate-200 mx-1"></div>
                
                <a href="/api/auth/logout" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors" title="Чыгуу">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </a>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{t('notAuthorized')}</p>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 md:p-8">
        <div className="w-full mx-auto">
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
