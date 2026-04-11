'use server'

import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser, hasReachedThemeLimit } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';

export async function createThemeAction(formData: FormData) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

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
  
  if (user.role !== 'PRO' && user.role !== 'ADMIN') {
    throw new Error("Сиздин жазылууңуз (PRO) же администратор укугуңуз жок.");
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  if (title && description) {
    await themesService.updateTheme(id, { title, description });
    revalidatePath(`/themes/${id}`);
    revalidatePath('/themes');
  }
}
