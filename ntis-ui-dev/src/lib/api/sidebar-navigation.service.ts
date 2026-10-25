import { apiClient } from '@/services/api.service';
import { ApiResponse } from '@/types/common.types';
import { ScreenGroupMaster, ScreenMaster, SidebarDataResponse } from '@/types/sidebar-navigation.types';
 
class SidebarNavigationService {
  async getScreenGroups(): Promise<ApiResponse<SidebarDataResponse<ScreenGroupMaster>>> {
    return apiClient.get<SidebarDataResponse<ScreenGroupMaster>>('/ScreenGroupMaster?PageSize=100');
  }
 
  async getScreens(): Promise<ApiResponse<SidebarDataResponse<ScreenMaster>>> {
    return apiClient.get<SidebarDataResponse<ScreenMaster>>('/ScreenMaster?PageSize=100');
  }
}
 
export const sidebarNavigationService = new SidebarNavigationService();