import { revalidatePath } from 'next/cache';

export function revalidateModulePaths(basePath: string) {
  const cleanPath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  revalidatePath(cleanPath, 'page');
  revalidatePath(cleanPath, 'layout');
}
