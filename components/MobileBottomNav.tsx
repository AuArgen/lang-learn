'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav({ 
  user, 
  isAdmin, 
  authUrl,
  tHome,
  tCabinet,
  tAdmin,
  tLogin,
  tLogout
}: { 
  user: any, 
  isAdmin: boolean, 
  authUrl: string,
  tHome: string,
  tCabinet: string,
  tAdmin: string,
  tLogin: string,
  tLogout: string
}) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around items-center px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <Link href="/" className={`flex flex-col items-center gap-1 transition-colors w-16 ${pathname === '/' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span className="text-[10px] font-medium text-center truncate w-full">{tHome}</span>
      </Link>
      
      {user ? (
        <Link href="/themes" className={`flex flex-col items-center gap-1 transition-colors w-16 ${pathname.startsWith('/themes') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          <span className="text-[10px] font-medium text-center truncate w-full">{tCabinet}</span>
        </Link>
      ) : null}

      {isAdmin ? (
        <Link href="/admin" className={`flex flex-col items-center gap-1 transition-colors w-16 ${pathname.startsWith('/admin') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span className="text-[10px] font-medium text-center truncate w-full">{tAdmin}</span>
        </Link>
      ) : null}

      {user ? (
        <a href="/api/auth/logout" className="flex flex-col items-center gap-1 text-slate-500 hover:text-red-500 transition-colors w-16">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span className="text-[10px] font-medium text-center truncate w-full">{tLogout}</span>
        </a>
      ) : (
        <a href={authUrl} className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors w-16">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span className="text-[10px] font-medium text-center truncate w-full">{tLogin}</span>
        </a>
      )}
    </nav>
  );
}
