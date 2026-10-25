import { apiClient } from '@/services/api.service';
import type { UserProfile } from '@/types/home/user-profile.types';
import type { ApiResponse } from '@/types/common.types';

/**
 * User Profile Service
 * Handles API calls related to user profile data
 */
class UserProfileService {
  /**
   * Fetches user profile by user ID
   * GET /api/users/{userId}
   */
  async getUserProfile(userId: number): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>(`/users/${userId}`);
  }
}

export const userProfileService = new UserProfileService();
