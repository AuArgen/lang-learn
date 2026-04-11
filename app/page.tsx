import { themesService } from '@/lib/firebase/services/themes';
import Link from 'next/link';
import { Metadata } from 'next';
import { getServerUser } from '@/lib/auth/server-auth';

export const metadata: Metadata = {
  title: 'BilimAi - Англисчени Үн менен Оюн аркылуу Үйрөнүңүз',
  description: 'Интерактивдүү үн таануу оюндары менен англис тилин тез жана кызыктуу үйрөнүңүз.',
  openGraph: {
    title: 'BilimAi Games',
    description: 'Англисче сөздөрдү үн менен туура айтууну машыгыңыз.',
    url: 'https://domain.com',
    siteName: 'BilimAi',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ky_KG',
    type: 'website',
  },
};

export default async function HomePage() {
  // Fetch only published themes for the public landing page
  const { adminDb } = await import('@/lib/firebase/admin');
  let themes: any[] = [];
  try {
    const publishedThemesSnapshot = await adminDb.collection('themes').where('status', '==', 'published').get();
    themes = publishedThemesSnapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
  } catch (error) {
    console.warn('⚠️ Cloud Firestore API is disabled. Falling back to mock data for demonstration purposes.');
    themes = [
      { id: 'mock-1', title: 'Action Words 🏃‍♂️', description: 'Basic verbs for everyday actions', words_count: 12, status: 'published' },
      { id: 'mock-2', title: 'Food & Drinks 🍎', description: 'Common fruits, vegetables, and beverages', words_count: 15, status: 'published' },
      { id: 'mock-3', title: 'Colors & Shapes 🔴', description: 'Learn to describe the visual world', words_count: 10, status: 'published' }
    ];
  }
  
  const user = await getServerUser();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            BilimAi
          </div>
          <nav>
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/themes" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                  Кабинетке Кирүү
                </Link>
                <a href="/api/auth/logout" className="text-sm font-medium text-red-500 hover:text-red-600">
                  Чыгуу
                </a>
              </div>
            ) : (
              <a href={process.env.AUTH_SERVICE_URL || '/api/auth/callback?token=mock_token'} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition shadow-md shadow-indigo-200">
                Кирүү (Login)
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Тил үйрөнүү эми <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              оюн менен укмуштуудай!
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Сиздин үнүңүздү түшүнгөн жасалма интеллект. Тема тандаңыз, микрофонду басыңыз жана сөздөрдү туура айтуу менен упай топтоңуз.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            🔥 Жалпыга ачык оюндар
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-1000 delay-200 fill-mode-both">
            {themes.map((theme: any) => (
              <Link href={`/play/${theme.id}`} key={theme.id} className="group flex flex-col bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                  🎮
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{theme.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{theme.description}</p>
                <div className="mt-auto flex items-center justify-between text-sm font-medium">
                  <span className="text-slate-400">{theme.words_count || 0} сөз</span>
                  <span className="text-indigo-600 group-hover:text-indigo-700">Ойноо &rarr;</span>
                </div>
              </Link>
            ))}
            {themes.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100">
                <p className="text-lg text-slate-500">Азырынча жалпыга ачык оюндар жок.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} BilimAi. Бардык укуктар корголгон.
      </footer>
    </div>
  );
}
