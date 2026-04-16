import { themesService } from '@/lib/firebase/services/themes';
import { wordsService } from '@/lib/firebase/services/words';
import { getServerUser } from '@/lib/auth/server-auth';
import { addWordAction, deleteWordAction } from '@/app/actions/word-actions';
import { requestPublicationAction } from '@/app/actions/theme-actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import WordsClient from './WordsClient';

export const dynamic = 'force-dynamic';

export default async function ThemeDetailsPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return <div>Сураныч, системге кириңиз.</div>;

  const userRole = user.role?.toUpperCase() || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR';
  const isProOrTeacher = userRole === 'PRO' || userRole === 'TEACHER';

  const { id } = await params;
  const theme = await themesService.getTheme(id);
  
  if (!theme) return redirect('/themes');

  const words = await wordsService.getWordsByTheme(id);

  const headersList = await headers();
  const domain = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (domain.includes('localhost') ? 'http' : 'https');
  const appUrl = `${protocol}://${domain}`;

  const isAuthorOrAdmin = isAdmin || (isProOrTeacher && theme.author_id === user.userId);

  return (
    <WordsClient 
      theme={theme}
      words={words}
      appUrl={appUrl}
      userRole={userRole}
      isAuthorOrAdmin={isAuthorOrAdmin}
    />
  )
}
