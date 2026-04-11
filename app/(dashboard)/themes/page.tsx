import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser } from '@/lib/auth/server-auth';
import { createThemeAction, deleteThemeAction } from '@/app/actions/theme-actions';
import Link from 'next/link';

export default async function ThemesPage() {
  const user = await getServerUser();
  if (!user) return <div>Сураныч, системге кириңиз.</div>;

  const themes = await themesService.getThemesByUser(user.userId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Менин темаларым</h2>
        <p className="text-slate-500 mt-2">Бул жерден сиз оюн үчүн жаңы тема кошуп, сөздөрдү башкара аласыз.</p>
      </div>

      <form action={createThemeAction} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">Жаңы тема түзүү</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Теманын аталышы</label>
            <input name="title" required className="w-full px-4 py-2 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Мисалы: Үй жаныбарлары" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Сүрөттөмөсү</label>
            <input name="description" required className="w-full px-4 py-2 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Кыскача маалымат..." />
          </div>
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all active:scale-95">
            + Кошуу
          </button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map(theme => (
          <div key={theme.id} className="group flex flex-col bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200">
            <h4 className="text-lg font-bold text-slate-800">{theme.title}</h4>
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{theme.description}</p>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                {theme.words_count || 0} сөз
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${theme.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {theme.status === 'published' ? 'Ачык' : 'Каралоо'}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
              <Link href={`/themes/${theme.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Өзгөртүү &rarr;
              </Link>
              <form action={deleteThemeAction.bind(null, theme.id!)}>
                <button type="submit" className="text-sm font-medium text-red-500 hover:text-red-700 transition">
                  Өчүрүү
                </button>
              </form>
            </div>
          </div>
        ))}
        {themes.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-500">Бир дагы тема жок. Жаңысын кошуңуз.</p>
          </div>
        )}
      </div>
    </div>
  )
}
