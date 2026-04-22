'use server';

import { cookies } from 'next/headers';
import { locales, defaultLocale } from '@/i18n/request';

export async function setUserLocale(locale: string) {
  if (!locales.includes(locale)) {
    locale = defaultLocale;
  }
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
    httpOnly: true
  });
}
