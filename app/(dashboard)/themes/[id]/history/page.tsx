import { gamesService } from '@/lib/firebase/services/games';
import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ThemeHistoryPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return <div>Сураныч, системге кириңиз.</div>;

  const { id } = await params;
  const theme = await themesService.getTheme(id);
  
  if (!theme) return redirect('/themes');

  // Verify access
  const userRole = user.role?.toUpperCase() || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR';
  const isAuthor = theme.author_id === user.userId;
  if (!isAdmin && !isAuthor) {
    return <div>Бул баракты көрүүгө укугуңуз жок.</div>;
  }

  const results = await gamesService.getResultsByTheme(id);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/themes" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition text-slate-600">
           &larr; 
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{theme.title} - Оюн тарыхы</h2>
          <p className="text-slate-500 mt-1">Оюнчулар катышкан оюндардын жыйынтыктары.</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-lg">Азырынча бул темада эч ким ойной элек.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((res: any) => (
            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{res.player_or_team_name}</h3>
                  <p className="text-sm text-slate-500">{new Date(res.played_at).toLocaleString('ru-RU')}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500">Упай</span>
                    <span className="font-bold text-green-600 text-lg">{res.score || 0}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500">Ката</span>
                    <span className="font-bold text-red-500 text-lg">{res.mistakes_count || 0}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-500">Убакыт</span>
                    <span className="font-bold text-blue-600 text-lg">{res.time_taken_sec || 0} сек</span>
                  </div>
                </div>
              </div>

              {res.history && res.history.length > 0 && (
                <div className="p-5">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Создөрдүн деталдуу тарыхы:</h4>
                  <div className="space-y-4">
                    {res.history.map((h: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-xl border ${h.isCorrect ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{h.translation} <span className="text-slate-400 font-normal text-sm">({h.word})</span></p>
                            <div className="mt-2 space-y-1">
                              {h.inputs && h.inputs.map((input: string, iIndex: number) => (
                                <p key={iIndex} className="text-sm">
                                  <span className="text-slate-500">Айтты/Жазды:</span> <span className="font-medium">"{input}"</span>
                                </p>
                              ))}
                              {!h.inputs?.length && <p className="text-sm text-slate-400 italic">Жооп берилген жок</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${h.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {h.isCorrect ? 'Туура' : 'Ката / Өткөрүлдү'}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">{h.mistakes_made || 0} ката кетти</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
