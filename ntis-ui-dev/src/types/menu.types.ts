export interface SubMenuItem {
  name: string;
  href: string;
  className?: string;
  departmentId?: number;
  moduleId?: number;
  departmentName?: string;
  moduleName?: string;
  screenCode?: string;
}

/** Serializable for Server → Client Components: use `iconName` only (Lucide export name). */
export interface MenuItem {
  name: string;
  nameHi: string;
  iconName?: string;
  href: string;
  subItems?: SubMenuItem[];
  departmentId?: number;
  moduleId?: number;
  departmentName?: string;
  moduleName?: string;
  screenCode?: string;
}
