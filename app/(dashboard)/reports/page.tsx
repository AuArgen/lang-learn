import { getServerUser } from '@/lib/auth/server-auth';
import { adminDb } from '@/lib/firebase/admin';
import { approveThemeAction, rejectThemeAction } from '@/app/actions/admin-actions';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const user = await getServerUser();
  const userRole = user?.role?.toUpperCase() || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR';

  if (!user || (!isAdmin && user.role === 'USER')) {
    return redirect('/themes');
  }

  // Get results
  const resultsSnapshot = await adminDb.collection('game_results')
    .orderBy('played_at', 'desc')
    .limit(50)
    .get();
    
  const results = resultsSnapshot.docs.map(doc => doc.data());

  let pendingThemes: any[] = [];
  if (isAdmin) {
    const pendingSnapshot = await adminDb.collection('themes').where('status', '==', 'pending').get();
    pendingThemes = pendingSnapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {isAdmin && pendingThemes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Жарыялоого сурамдар (Админ)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingThemes.map(theme => (
              <div key={theme.id} className="bg-orange-50 border border-orange-200 p-5 rounded-2xl">
                <h3 className="font-bold text-slate-800">{theme.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{theme.words_count} сөз камтылган.</p>
                <div className="flex gap-2">
                  <form action={approveThemeAction.bind(null, theme.id)}>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded-lg transition shadow-sm">
                      Уруксат (Жарыялоо)
                    </button>
                  </form>
                  <form action={rejectThemeAction.bind(null, theme.id)}>
                    <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition">
                      Четке кагуу
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Аналитика жана Жыйынтыктар</h2>
        <p className="text-slate-500 mt-1 mb-6">Окуучулардын оюндардагы акыркы көрсөткүчтөрү.</p>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="px-6 py-4">Команда / Окуучу</th>
                  <th className="px-6 py-4">Тема ID</th>
                  <th className="px-6 py-4">Упай</th>
                  <th className="px-6 py-4">Каталар</th>
                  <th className="px-6 py-4">Жасалган убактысы</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                        {r.player_or_team_name?.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-slate-900">{r.player_or_team_name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{r.theme_id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded-md font-bold">
                        {r.score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded-md font-bold">
                        {r.mistakes_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(r.played_at).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">Бир дагы жыйынтык жок</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
