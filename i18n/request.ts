import {getRequestConfig} from 'next-intl/server';
import {cookies, headers} from 'next/headers';

export const locales = ['kg', 'ru', 'en'];
export const defaultLocale = 'kg';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  
  let locale = defaultLocale;
  
  if (localeCookie && locales.includes(localeCookie)) {
    locale = localeCookie;
  } else {
    // Try to get from accept-language if no cookie
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    if (acceptLanguage) {
      if (acceptLanguage.includes('ru')) locale = 'ru';
      else if (acceptLanguage.includes('en')) locale = 'en';
      // defaults to kg
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
