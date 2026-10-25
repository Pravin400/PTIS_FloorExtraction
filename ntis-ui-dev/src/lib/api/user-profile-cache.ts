import { cache } from 'react';
import { userProfileService } from '@/lib/api/user-profile.service';

// Wraps userProfileService.getUserProfile with React cache for SSR deduplication
export const getUserProfileCached = cache(async (userId: number) => {
  return userProfileService.getUserProfile(userId);
});
