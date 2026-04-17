import { getServerUser } from '@/lib/auth/server-auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getServerUser();
  const userRole = user?.role?.toUpperCase() || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR';

  if (!user || !isAdmin) {
    return redirect('/themes');
  }

  // 1. Fetch Analytics Counts
  const [totalUsers, totalThemes, totalWords, totalGames] = await Promise.all([
    prisma.user.count(),
    prisma.theme.count(),
    prisma.word.count(),
    prisma.gameSession.count()
  ]);

  // 2. Fetch Users and their data
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { themes: true, games: true }
      },
      themes: {
        include: {
          _count: {
            select: { words: true }
          }
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  // 3. Fetch Game Results (for answer grid visibility)
  const recentGameResults = await prisma.gameResult.findMany({
    include: {
      game: {
        include: {
          host: true
        }
      },
      theme: true
    },
    orderBy: { played_at: 'desc' },
    take: 100 // limit to last 100 to prevent huge loads, but allows scrolling history
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Админ Панель</h1>
         <p className="text-slate-500 mt-1">Жалпы статистика, окуучулар жана алардын баалоолору.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
            <h3 className="text-indigo-100 text-sm font-medium">Жалпы Колдонуучу</h3>
            <p className="text-3xl font-bold mt-1">{totalUsers}</p>
         </div>
         <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-200">
            <h3 className="text-purple-100 text-sm font-medium">Жалпы Тема</h3>
            <p className="text-3xl font-bold mt-1">{totalThemes}</p>
         </div>
         <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
            <h3 className="text-emerald-100 text-sm font-medium">Жалпы Сөз</h3>
            <p className="text-3xl font-bold mt-1">{totalWords}</p>
         </div>
         <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
            <h3 className="text-orange-100 text-sm font-medium">Оюндар баштатылды</h3>
            <p className="text-3xl font-bold mt-1">{totalGames}</p>
         </div>
      </div>

      <AdminDashboardClient users={users} gameResults={recentGameResults} />
    </div>
  );
}
