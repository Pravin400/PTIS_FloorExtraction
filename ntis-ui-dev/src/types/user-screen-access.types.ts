export interface UserScreenAccess {
  departmentId: number;
  departmentName: string;
  moduleId: number;
  moduleName: string;
  userId: number;
  userRoleId: number;
  screenCode: string;
  screenName: string;
  screenNameLocal: string;
  screenIcon: string | null;
  routePath: string;
  isMenu: boolean | number;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  haveFullAccess: boolean;
  haveNoAccess: boolean;
  screenGroupName?: string | null;
}
