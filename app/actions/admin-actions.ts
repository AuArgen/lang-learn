'use server'

import { themesService } from '@/lib/firebase/services/themes';
import { getServerUser } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';

export async function approveThemeAction(themeId: string) {
  const user = await getServerUser();
  if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized");
  
  await themesService.updateTheme(themeId, { status: 'published' });
  revalidatePath('/reports');
  revalidatePath('/'); // refresh homepage too
}

export async function rejectThemeAction(themeId: string) {
  const user = await getServerUser();
  if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized");
  
  await themesService.updateTheme(themeId, { status: 'draft' });
  revalidatePath('/reports');
}
