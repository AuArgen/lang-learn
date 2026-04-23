'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setUserLocale } from '@/app/actions/locale-action';
import { useTranslations } from 'next-intl';

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations('LocaleSwitcher');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLocaleChange = (locale: string) => {
    startTransition(async () => {
      await setUserLocale(locale);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      {(['kg', 'ru', 'en'] as const).map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          disabled={isPending}
          className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
            currentLocale === locale
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span className="sm:hidden">{locale.toUpperCase()}</span>
          <span className="hidden sm:inline">{t(locale)}</span>
        </button>
      ))}
    </div>
  );
}
