export interface ScreenGroupMaster {
  id: number;
  screenGroupName: string;
  screenGroupLocalName?: string;
  screenGroupIcon?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ScreenMaster {
  id: number;
  screenGroupId: number;
  screenName: string;
  screenNameLocal?: string;
  screenIcon?: string;
  routePath: string;
  displayOrder: number;
  isActive: boolean;
  isMenu: boolean;
}

export interface SidebarDataResponse<T> {
  items: T[];
}
