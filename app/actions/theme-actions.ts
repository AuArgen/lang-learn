'use server'

import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser, hasReachedThemeLimit } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';

export async function createThemeAction(formData: FormData) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const language = formData.get('language') as string;

  if (user.role === 'USER') {
    const isLimitReached = await hasReachedThemeLimit(user.userId);
    if (isLimitReached) {
      throw new Error("Сиздин лимит бүттү. Болгону 1 гана тема кошо аласыз.");
    }
  }

  await themesService.createTheme({
    author_id: user.userId,
    title,
    description,
    language,
    status: 'draft'
  });

  revalidatePath('/themes');
}

export async function deleteThemeAction(id: string) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  
  await themesService.deleteTheme(id);
  revalidatePath('/themes');
}

export async function requestPublicationAction(id: string) {
  const user = await getServerUser();
  if (!user || user.role === 'USER') throw new Error("Unauthorized");
  
  await themesService.updateTheme(id, { status: 'pending' });
  revalidatePath('/themes');
}

export async function updateThemeAction(id: string, formData: FormData) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  
  const userRole = user.role?.toUpperCase() || 'USER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR';
  const isProOrTeacher = userRole === 'PRO' || userRole === 'TEACHER';

  if (!isAdmin && !isProOrTeacher) {
    throw new Error("Сиздин жазылууңуз (PRO) же администратор укугуңуз жок.");
  }

  // If not admin, verify they are the author
  if (!isAdmin) {
    const theme = await themesService.getTheme(id);
    if (!theme || theme.author_id !== user.userId) {
      throw new Error("Сиз бул теманы өзгөртө албайсыз, анткени сиз автору эмессиз.");
    }
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const language = formData.get('language') as string;

  if (title && description) {
    await themesService.updateTheme(id, { title, description, language });
    revalidatePath(`/themes/${id}`);
    revalidatePath('/themes');
  }
}
