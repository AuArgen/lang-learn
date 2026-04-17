import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerUser } from '@/lib/auth/server-auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'ADMINISTRATOR';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <nav className="w-full md:w-64 bg-white md:border-r border-b md:border-b-0 p-5 flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          BilimAi Games
        </h1>
        
        <Link href="/themes" className="text-slate-700 font-medium hover:text-indigo-600 hover:bg-slate-100 p-3 rounded-xl transition duration-200">
          Менин темаларым
        </Link>
        <Link href="/" className="text-slate-700 font-medium hover:text-indigo-600 hover:bg-slate-100 p-3 rounded-xl transition duration-200">
          Бардык оюндар (Home)
        </Link>
        
        {isAdmin && (
          <Link href="/admin" className="text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 p-3 rounded-xl transition duration-200 mt-2">
            Админ Панель
          </Link>
        )}

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Профиль</p>
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
            <p className="text-sm text-slate-500">Авторизациядан өткөн жок</p>
          )}
        </div>
      </nav>
      
      <main className="flex-1 overflow-auto p-4 md:p-10">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
