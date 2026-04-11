import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser } from '@/lib/auth/server-auth';
import { updateThemeAction } from '@/app/actions/theme-actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function EditThemePage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return redirect('/themes');

  const { id } = await params;
  const theme = await themesService.getTheme(id);
  
  if (!theme) return redirect('/themes');
  
  // Checking permissions: user must be PRO or ADMIN, and (if PRO, must be author)
  if (user.role === 'USER' || (user.role === 'PRO' && theme.author_id !== user.userId)) {
      return redirect(`/themes/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/themes/${id}`} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition text-slate-600">
           &larr; 
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Теманы өзгөртүү</h2>
      </div>

      <form action={updateThemeAction.bind(null, id)} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Теманын аталышы (мисалы: Жаныбарлар)</label>
          <input 
            name="title" 
            required 
            defaultValue={theme.title}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-900" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Кыскача сүрөттөмө же максаты</label>
          <textarea 
            name="description" 
            required 
            rows={4}
            defaultValue={theme.description}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-900 resize-none" 
          ></textarea>
        </div>
        <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all active:scale-95">
          Сактоо
        </button>
      </form>
    </div>
  )
}
