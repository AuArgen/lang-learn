import { themesService } from '@/lib/firebase/services/themes';
import Link from 'next/link';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Metadata } from 'next';
import { getServerUser } from '@/lib/auth/server-auth';
import { headers } from 'next/headers';
import { getTranslations, getLocale } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BilimAi Learn Lang — Сөздөрдү оюн аркылуу үйрөнүңүз',
  description: 'Мугалимдер тема жасайт, окуучулар үн менен ойношот. Каттоосуз ойноо мүмкүн.',
  openGraph: {
    title: 'BilimAi Learn Lang',
    description: 'Мугалимдер жана окуучулар үчүн оюн аркылуу тил үйрөнүү платформасы.',
    url: 'https://domain.com',
    siteName: 'BilimAi',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ky_KG',
    type: 'website',
  },
};

export default async function HomePage() {
  const t = await getTranslations('HomePage');
  const locale = await getLocale();
  const themes = await themesService.getPublishedThemes();
  const user = await getServerUser();

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;

  let authUrl = process.env.AUTH_SERVICE_URL || '/api/auth/callback?token=mock_token';
  if (authUrl.includes('localhost:3000')) {
    authUrl = authUrl.replace('http://localhost:3000', appUrl);
  }

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'ADMINISTRATOR';

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16 md:pb-0 overflow-x-hidden">

      {/* ── Header ── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm">B</div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">BilimAi</span>
          </div>
          <nav className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            {user ? (
              <div className="hidden md:flex items-center gap-3 border-l pl-3 ml-1">
                <Link href="/themes" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                  {t('cabinet')}
                </Link>
                <a href="/api/auth/logout" className="text-sm font-medium text-red-400 hover:text-red-500 transition-colors">
                  {t('logout')}
                </a>
              </div>
            ) : (
              <a href={authUrl} className="hidden md:block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full transition-colors shadow-sm">
                {t('login')}
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#060914] text-white">
          {/* Ambient glow orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[130px]" />
            <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px]" />
            <div className="absolute -bottom-20 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
          </div>

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }}
          />

          <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-20">
            <div className="grid md:grid-cols-2 gap-14 items-center">

              {/* ── Left: text ── */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-7 text-slate-300">
                  <span>🎓</span> {t('tagline')}
                </div>

                <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight mb-5">
                  {t('heroTitle1')}<br />
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                    {t('heroTitle2')}
                  </span>
                </h1>

                <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg mx-auto md:mx-0">
                  {t('heroDesc')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  {user ? (
                    <Link
                      href="/themes"
                      className="px-7 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      <span>🗂️</span> {t('heroBtnCabinet')}
                    </Link>
                  ) : (
                    <a
                      href={authUrl}
                      className="px-7 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      <span>🏫</span> {t('heroBtnTeacher')}
                    </a>
                  )}
                  <Link
                    href="/play/local"
                    className="px-7 py-4 bg-white/8 hover:bg-white/14 border border-white/12 text-white font-bold rounded-2xl text-base transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <span>✏️</span> {t('heroBtnTryFree')}
                  </Link>
                </div>

                {/* Stats row */}
                <div className="mt-12 flex items-center gap-8 justify-center md:justify-start">
                  {[
                    { num: '100%', label: locale === 'ru' ? 'Бесплатно' : locale === 'en' ? 'Free' : 'Бекер' },
                    { num: 'AI', label: locale === 'ru' ? 'Генерация слов' : locale === 'en' ? 'AI words' : 'AI сөздөр' },
                    { num: '10+', label: locale === 'ru' ? 'Языков' : locale === 'en' ? 'Languages' : 'Тилдер' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-4">
                      {i > 0 && <div className="w-px h-8 bg-white/10" />}
                      <div>
                        <div className="text-2xl font-black text-white leading-none">{s.num}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: game card mockup ── */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  {/* Glow behind card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-600/20 rounded-3xl blur-2xl scale-110" />

                  {/* Main card */}
                  <div className="relative bg-slate-800/70 backdrop-blur-xl border border-white/10 rounded-3xl p-7 w-[320px] shadow-2xl shadow-black/60">

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full w-3/5 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full" />
                      </div>
                      <span className="text-xs font-bold text-slate-400">3/5</span>
                    </div>

                    {/* Hearts */}
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex gap-1 text-base">❤️❤️❤️❤️<span className="opacity-30">❤️</span></div>
                      <div className="text-sm font-black text-emerald-400">70 pts</div>
                    </div>

                    {/* Word card */}
                    <div className="bg-gradient-to-br from-slate-700/60 to-slate-700/30 border border-white/8 rounded-2xl p-5 text-center mb-4">
                      <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">
                        {locale === 'ru' ? 'Перевод' : locale === 'en' ? 'Translation' : 'Котормосу'}
                      </p>
                      <h3 className="text-4xl font-black text-white mb-1">🍎 Алма</h3>
                    </div>

                    {/* Text input */}
                    <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 flex items-center gap-2 mb-3">
                      <span className="text-white font-medium text-sm">Apple</span>
                      <span className="w-0.5 h-4 bg-cyan-400 rounded-full animate-pulse" />
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl py-3 flex items-center justify-center gap-2">
                        <span className="text-lg">🎙️</span>
                        <span className="text-xs font-bold text-cyan-300">
                          {locale === 'ru' ? 'Говорить' : locale === 'en' ? 'Speak' : 'Айт'}
                        </span>
                      </div>
                      <div className="bg-slate-700/40 border border-slate-600/30 rounded-xl py-3 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-400">
                          {locale === 'ru' ? 'Пропустить →' : locale === 'en' ? 'Skip →' : 'Өткөр →'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating: correct badge */}
                  <div className="absolute -top-5 -right-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg shadow-emerald-500/40 flex items-center gap-1.5">
                    <span>✓</span>
                    {locale === 'ru' ? 'Верно!' : locale === 'en' ? 'Correct!' : 'Туура!'}
                  </div>

                  {/* Floating: score badge */}
                  <div className="absolute -bottom-5 -left-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg shadow-violet-500/40 flex items-center gap-1">
                    <span>⭐</span> +10 pts
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Wave divider */}
          <div className="relative h-16 overflow-hidden">
            <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full text-slate-50" fill="currentColor" preserveAspectRatio="none">
              <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z" />
            </svg>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="bg-slate-50 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{t('howTitle')}</h2>
              <div className="w-16 h-1 bg-indigo-500 rounded-full mx-auto" />
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* connector line (desktop) */}
              <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-0.5 bg-indigo-100 z-0" />

              {[
                {
                  num: t('howStep1Num'),
                  title: t('howStep1Title'),
                  desc: t('howStep1Desc'),
                  emoji: '📚',
                  color: 'from-blue-500 to-indigo-600',
                },
                {
                  num: t('howStep2Num'),
                  title: t('howStep2Title'),
                  desc: t('howStep2Desc'),
                  emoji: '🔗',
                  color: 'from-violet-500 to-purple-600',
                },
                {
                  num: t('howStep3Num'),
                  title: t('howStep3Title'),
                  desc: t('howStep3Desc'),
                  emoji: '🎙️',
                  color: 'from-purple-500 to-pink-500',
                },
              ].map((step, i) => (
                <div key={i} className="relative z-10 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-5 shadow-lg`}>
                    {step.emoji}
                  </div>
                  <div className={`inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br ${step.color} text-white text-xs font-black rounded-full mb-3`}>
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOR WHOM ── */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{t('forWhoTitle')}</h2>
              <div className="w-16 h-1 bg-indigo-500 rounded-full mx-auto" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Teacher card */}
              <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-5">
                    <span>🏫</span> {t('forWhoTeacherBadge')}
                  </div>
                  <h3 className="text-2xl font-black mb-3">{t('forWhoTeacherTitle')}</h3>
                  <p className="text-indigo-100 text-sm mb-6 leading-relaxed">{t('forWhoTeacherDesc')}</p>
                  <ul className="space-y-3 mb-8">
                    {[
                      t('forWhoTeacherF1'),
                      t('forWhoTeacherF2'),
                      t('forWhoTeacherF3'),
                      t('forWhoTeacherF4'),
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <span className="text-yellow-300 mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-indigo-100">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {user ? (
                    <Link href="/themes" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-bold rounded-full text-sm hover:bg-indigo-50 transition shadow-md">
                      {t('forWhoTeacherCta')}
                    </Link>
                  ) : (
                    <a href={authUrl} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-bold rounded-full text-sm hover:bg-indigo-50 transition shadow-md">
                      {t('forWhoTeacherCta')}
                    </a>
                  )}
                </div>
              </div>

              {/* Student card */}
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-5">
                    <span>🎓</span> {t('forWhoStudentBadge')}
                  </div>
                  <h3 className="text-2xl font-black mb-3">{t('forWhoStudentTitle')}</h3>
                  <p className="text-emerald-100 text-sm mb-6 leading-relaxed">{t('forWhoStudentDesc')}</p>
                  <ul className="space-y-3 mb-8">
                    {[
                      t('forWhoStudentF1'),
                      t('forWhoStudentF2'),
                      t('forWhoStudentF3'),
                      t('forWhoStudentF4'),
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <span className="text-yellow-300 mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-emerald-100">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {themes.length > 0 ? (
                    <a href="#games" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-full text-sm hover:bg-emerald-50 transition shadow-md">
                      {t('forWhoStudentCta')}
                    </a>
                  ) : (
                    <a href={authUrl} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-full text-sm hover:bg-emerald-50 transition shadow-md">
                      {t('forWhoStudentCta')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{t('featuresTitle')}</h2>
              <div className="w-16 h-1 bg-indigo-500 rounded-full mx-auto" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { emoji: '🎙️', title: t('feat1Title'), desc: t('feat1Desc'), bg: 'bg-blue-50', border: 'border-blue-100', icon: 'bg-blue-100 text-blue-600' },
                { emoji: '🤖', title: t('feat2Title'), desc: t('feat2Desc'), bg: 'bg-violet-50', border: 'border-violet-100', icon: 'bg-violet-100 text-violet-600' },
                { emoji: '🆓', title: t('feat3Title'), desc: t('feat3Desc'), bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'bg-emerald-100 text-emerald-600' },
                { emoji: '🌐', title: t('feat4Title'), desc: t('feat4Desc'), bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-100 text-orange-600' },
              ].map((f) => (
                <div key={f.title} className={`${f.bg} border ${f.border} rounded-3xl p-6 hover:shadow-md transition-shadow`}>
                  <div className={`w-12 h-12 ${f.icon} rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                    {f.emoji}
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PUBLIC GAMES ── */}
        <section id="games" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">{t('publicGames')}</h2>
                <p className="text-slate-500 mt-2 text-sm">{t('publicGamesDesc')}</p>
              </div>
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🔥</div>
            </div>
            <div className="w-full h-px bg-slate-100 mb-10" />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((theme: any) => (
                <Link
                  href={`/play/${theme.id}`}
                  key={theme.id}
                  className="group flex flex-col bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🎮
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                      {t('wordsCount', { count: theme.words_count || 0 })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">{theme.title}</h3>
                  <p className="text-slate-400 text-sm mb-5 line-clamp-2 flex-1">{theme.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">BilimAi</span>
                    <span className="text-sm font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                      {t('play')}
                    </span>
                  </div>
                </Link>
              ))}
              {themes.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="text-5xl mb-4">🎮</div>
                  <p className="text-slate-400 font-medium">{t('noGames')}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-20 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-3xl md:text-4xl font-black mb-4">{t('ctaTitle')}</h2>
            <p className="text-slate-300 mb-10 text-lg leading-relaxed">{t('ctaDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/themes" className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-full transition shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2">
                  <span>🗂️</span> {t('heroBtnCabinet')}
                </Link>
              ) : (
                <a href={authUrl} className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-full transition shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2">
                  <span>🏫</span> {t('ctaBtnTeacher')}
                </a>
              )}
              {themes.length > 0 && (
                <a href="#games" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition flex items-center justify-center gap-2">
                  <span>🎮</span> {t('ctaBtnPlay')}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── OTHER SERVICES ── */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
              🔗 {t('services')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <a href="https://bilimai.kg" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 p-5 rounded-2xl transition-all">
                <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">🌐</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">BilimAi</p>
                  <p className="text-xs text-slate-400 truncate">bilimai.kg</p>
                </div>
                <span className="text-sm font-semibold text-indigo-500 group-hover:text-indigo-600">{t('explore')}</span>
              </a>
              <a href="https://plus.bilimai.kg" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 p-5 rounded-2xl transition-all">
                <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">✨</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 group-hover:text-purple-700 transition-colors">BilimAi Plus</p>
                  <p className="text-xs text-slate-400 truncate">plus.bilimai.kg</p>
                </div>
                <span className="text-sm font-semibold text-purple-500 group-hover:text-purple-600">{t('explore')}</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center text-white font-black text-xs">B</div>
          <span className="text-white font-bold">BilimAi Learn Lang</span>
        </div>
        &copy; {new Date().getFullYear()} BilimAi. {t('rights')}
      </footer>

      <MobileBottomNav
        user={user}
        isAdmin={isAdmin}
        authUrl={authUrl}
        tHome={locale === 'ru' ? 'Главная' : locale === 'en' ? 'Home' : 'Башкы'}
        tCabinet={t('cabinet')}
        tAdmin={locale === 'ru' ? 'Админ' : locale === 'en' ? 'Admin' : 'Админ'}
        tLogin={t('login')}
        tLogout={t('logout')}
      />
    </div>
  );
}
