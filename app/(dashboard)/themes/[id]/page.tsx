import { themesService } from '@/lib/firebase/services/themes';
import { wordsService } from '@/lib/firebase/services/words';
import { getServerUser } from '@/lib/auth/server-auth';
import { addWordAction, deleteWordAction } from '@/app/actions/word-actions';
import { requestPublicationAction } from '@/app/actions/theme-actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function ThemeDetailsPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return <div>Сураныч, системге кириңиз.</div>;

  const { id } = await params;
  const theme = await themesService.getTheme(id);
  
  if (!theme) return redirect('/themes');

  const words = await wordsService.getWordsByTheme(id);

  const headersList = await headers();
  const domain = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (domain.includes('localhost') ? 'http' : 'https');
  const appUrl = `${protocol}://${domain}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/themes" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition text-slate-600">
           &larr; 
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{theme.title}</h2>
            {(user.role === 'ADMIN' || (user.role === 'PRO' && theme.author_id === user.userId)) && (
              <Link href={`/themes/${id}/edit`} className="text-sm bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 px-3 py-1 rounded-full transition-colors font-medium border border-slate-200 hover:border-indigo-200">
                Түзөтүү (Edit) ✎
              </Link>
            )}
          </div>
          <p className="text-slate-500 mt-1">{theme.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <form action={addWordAction.bind(null, id)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Жаңы сөз кошуу</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Сөз (Англисче)</label>
                <input name="word" required className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Apple" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Котормосу (Кыргызча)</label>
                <input name="translation" required className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Алма" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all active:scale-95">
                + Сөздү базага кошуу
              </button>
            </div>
          </form>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
             <h3 className="text-indigo-900 font-bold mb-2">Публикация статусу: {theme.status.toUpperCase()}</h3>
             <p className="text-sm text-indigo-700 mb-4">
               {theme.words_count >= 10 
                  ? "Бул тема 10 сөздөн ашты. Эми сиз жалпы элге ачык кылуу үчүн сурам жөнөтө аласыз."
                  : "Эскертүү: Башкы бетке чыгаруу үчүн кеминде 10 сөз болушу шарт."}
             </p>
             {user.role !== 'USER' && theme.words_count >= 10 && theme.status === 'draft' && (
                <form action={requestPublicationAction.bind(null, id)}>
                  <button className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow font-medium text-sm transition">
                    Коомдук кылууга сурам жөнөтүү
                  </button>
                </form>
             )}
             {theme.words_count >= 10 && (
               <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Коомдук оюн шилтемеси:</p>
                  <input readOnly value={`${appUrl}/play/${id}`} className="w-full bg-white text-slate-900 px-3 py-2 text-sm rounded-md border-indigo-200 focus:outline-none" />
               </div>
             )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex justify-between">
            <span>Бардык сөздөр ({words.length})</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {words.map(w => (
              <li key={w.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <p className="font-bold text-slate-800">{w.word}</p>
                  <p className="text-sm text-slate-500">{w.translation}</p>
                </div>
                <form action={deleteWordAction.bind(null, w.id!, id)}>
                  <button title="Өчүрүү" className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition">
                    &times;
                  </button>
                </form>
              </li>
            ))}
            {words.length === 0 && (
              <li className="p-8 text-center text-slate-500">Папка бош. Сөз кошуңуз.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
