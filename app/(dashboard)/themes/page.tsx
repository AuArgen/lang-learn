import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser } from '@/lib/auth/server-auth';
import ThemesClient from './ThemesClient';

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  const user = await getServerUser();
  if (!user) return <div>Сураныч, системге кириңиз.</div>;

  const themes = await themesService.getThemesByUser(user.userId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Менин темаларым</h2>
        <p className="text-slate-500 mt-2">Бул жерден сиз оюн үчүн жаңы тема кошуп, сөздөрдү башкара аласыз.</p>
      </div>

      <ThemesClient themes={themes} />
    </div>
  )
}
