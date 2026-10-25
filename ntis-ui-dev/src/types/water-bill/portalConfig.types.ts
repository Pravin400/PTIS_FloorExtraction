export interface PortalInfo {
  portalTitle: string;
  portalTitleLocal: string;
  portalSubTitle: string;
  portalSubTitleLocal: string;
  departmentLogo: string;
  governmentLogo: string;
  favicon: string;
  defaultLanguage: string;
}

export interface PortalHeaderConfig {
  showGovernmentTopBar: boolean;
  governmentText: string;
  governmentTextLocal: string;
  showSkipToMainContent: boolean;
  showScreenReader: boolean;
  showFontSizeControls: boolean;
  showLanguageSelector: boolean;
  showThemeSelector: boolean;
  showAdminLogin: boolean;
  adminLoginText: string;
  adminLoginUrl: string;
}

export interface PortalContactConfig {
  email: string;
  helplineNo: string;
  officeHours: string;
  address: string;
  addressLocal: string;
  googleMapLink: string;
}

export interface PortalThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  footerBackgroundColor: string;
  footerTextColor: string;
}

export interface PortalNavigationSubItem {
  title: string;
  titleLocal: string;
  url: string;
  displayOrder: number;
  openInNewTab?: boolean;
}

export interface PortalNavigationItem {
  code: string;
  title: string;
  titleLocal: string;
  icon?: string | null;
  url: string;
  displayOrder: number;
  openInNewTab: boolean;
  children?: PortalNavigationSubItem[];
}

export interface PortalHeroFeature {
  icon: string;
  title: string;
  titleLocal: string;
  displayOrder: number;
}

export type PortalHeroMediaType = "image" | "gif" | "video";

export interface PortalHeroConfig {
  title: string;
  titleLocal: string;
  subTitle: string;
  subTitleLocal: string;
  /** "image" (default) and "gif" render via backgroundImage/mobileBackgroundImage; "video" renders backgroundVideoSrc with backgroundImage used as the <video> poster. */
  backgroundMediaType?: PortalHeroMediaType;
  backgroundImage: string;
  mobileBackgroundImage: string;
  /** Required when backgroundMediaType is "video". */
  backgroundVideoSrc?: string;
  /** MIME type for backgroundVideoSrc, e.g. "video/mp4" or "video/webm". Defaults to "video/mp4". */
  backgroundVideoType?: string;
  features: PortalHeroFeature[];
}

export interface PortalCitizenLoginConfig {
  showLogin: boolean;
  sectionTitle: string;
  sectionTitleLocal: string;
  userNamePlaceholder: string;
  passwordPlaceholder: string;
  showCaptcha: boolean;
  showForgotPassword: boolean;
  forgotPasswordText: string;
  loginButtonText: string;
}

export interface PortalSectionSettingsConfig {
  showCitizenServices: boolean;
  citizenServicesTitle: string;
  citizenServicesTitleLocal: string;
  showLatestUpdates: boolean;
  latestUpdatesTitle: string;
  showAnnouncements: boolean;
  announcementsTitle: string;
  showImportantLinks: boolean;
  importantLinksTitle: string;
}

export interface PortalFooterLink {
  title: string;
  url: string;
  displayOrder: number;
}

export interface PortalFooterSocialMedia {
  platform: string;
  icon: string;
  url: string;
}

export interface PortalFooterConfig {
  showFooter: boolean;
  logo: string;
  aboutTitle: string;
  aboutTitleLocal: string;
  aboutDescription: string;
  aboutDescriptionLocal: string;
  copyrightText: string;
  links: PortalFooterLink[];
  showSocialMedia: boolean;
  socialMedia: PortalFooterSocialMedia[];
}

export interface PortalSeoConfig {
  pageTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface PortalConfigJson {
  portal: PortalInfo;
  header: PortalHeaderConfig;
  contact: PortalContactConfig;
  theme: PortalThemeConfig;
  navigation: PortalNavigationItem[];
  hero: PortalHeroConfig;
  citizenLogin: PortalCitizenLoginConfig;
  sectionSettings: PortalSectionSettingsConfig;
  footer: PortalFooterConfig;
  seo: PortalSeoConfig;
}

export interface DepartmentPortalConfiguration {
  departmentId: number;
  configJson: PortalConfigJson;
  configVersion: number;
  createdBy: number;
  updatedBy: number | null;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface DepartmentPortalConfigurationPagedResponse {
  items: DepartmentPortalConfiguration[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface DepartmentPortalConfigurationQueryParameters {
  departmentId?: number;
  pageNumber?: number;
  pageSize?: number;
}
