'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  calculateLicenseEndDate,
  calculateRenewalAlerts,
  generateLicenseKey as buildLicenseKey,
} from '@/lib/utils/ulb-configuration.utils';
import { ULB_TYPE_OPTIONS } from '@/config/ulb-configuration.config';
import { parseLicenseDurationFromApi } from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.mapper';
import { getUlbConfigurationValidationError } from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.validator';
import {
  getFirstUlbFieldError,
  sanitizeUlbFieldValue,
  validateUlbConfigurationFields,
  type UlbConfigurationFieldErrors,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-form-validation';
import type {
  CompletionStatus,
  RenewalAlert,
  ULBConfigurationFormData,
  UlbConfigurationMaster,
  UlbSectionKey,
} from '@/types/ulbconfig-master.types';

const EMPTY_FORM: ULBConfigurationFormData = {
  ulbName: '',
  ulbCode: '',
  ulbType: '',
  state: '',
  district: '',
  address: '',
  pincode: '',
  contactPerson: '',
  designation: '',
  email: '',
  phone: '',
  alternatePhone: '',
  website: '',
  ulbLogo: null,
  ulbNameFont: 'Inter',
  ulbNameColor: '#1e40af',
  ulbNameSize: '24',
  ulbNameWeight: '600',
  ulbNameStyle: 'normal',
  projectStartDate: '',
  financialYearStart: '',
  goLiveDate: '',
  implementationPartner: '',
  projectManager: '',
  projectManagerEmail: '',
  projectManagerPhone: '',
  licenseType: '',
  licenseKey: '',
  licenseStartDate: '',
  licenseDuration: '',
  licenseEndDate: '',
  maxUsers: '',
  maxDepartments: '',
  supportType: '',
  renewalDate: '',
  licenseStatus: 'active',
};

function toFormDate(value: string | null | undefined): string {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';
  return str.includes('T') ? str.split('T')[0] : str;
}

function buildInitialForm(ulb: UlbConfigurationMaster | null): ULBConfigurationFormData {
  if (!ulb) return EMPTY_FORM;

  const ulbTypeLabel = ULB_TYPE_OPTIONS.find((o) => o.value === ulb.ulbTypeId)?.label ?? '';
  const licenseDuration = ulb.licenceDuration
    ? parseLicenseDurationFromApi(ulb.licenceDuration)
    : '';
  const licenseEndDate =
    ulb.licenceEndDate ??
    calculateLicenseEndDate(ulb.licenceStartDate ?? '', licenseDuration);
  const alerts = licenseEndDate ? calculateRenewalAlerts(licenseEndDate) : [];

  return {
    ...EMPTY_FORM,
    ulbName: ulb.ulbName ?? '',
    ulbCode: ulb.ulbCode ?? '',
    ulbType: ulbTypeLabel,
    state: ulb.state ?? '',
    district: ulb.district ?? '',
    address: ulb.ulbAddress ?? '',
    pincode: ulb.pinCode ?? '',
    contactPerson: ulb.contactPersonName ?? '',
    designation: ulb.contactPersonDesignation ?? '',
    email: ulb.emailId ?? '',
    phone: ulb.mobileNo ?? '',
    alternatePhone: ulb.alternateMobileNo ?? '',
    website: ulb.websiteUrl ?? '',
    ulbLogo: ulb.ulbLogo ?? null,
    projectStartDate: toFormDate(ulb.projectStartDate),
    financialYearStart: toFormDate(ulb.financialYearStartDate),
    goLiveDate: toFormDate(ulb.expectedGoLiveDate),
    implementationPartner: ulb.partnerName ?? '',
    projectManager: ulb.pmName ?? '',
    projectManagerEmail: ulb.pmEmailId ?? '',
    projectManagerPhone: ulb.pmMobileNo ?? '',
    licenseType: ulb.licenceType ?? '',
    licenseKey: ulb.licenceKey ?? '',
    licenseStartDate: toFormDate(ulb.licenceStartDate),
    licenseDuration,
    licenseEndDate: toFormDate(licenseEndDate),
    supportType: ulb.supportType ?? '',
    renewalDate: alerts[0]?.date ?? '',
    licenseStatus: ulb.isActive !== false ? 'active' : 'inactive',
  };
}

function buildCompletionStatus(ulb: UlbConfigurationMaster | null, hasLicences = false): CompletionStatus {
  return {
    ulbInfo: !!(ulb?.ulbName && ulb?.ulbCode),
    logoImages: !!ulb?.ulbLogo,
    projectLicenseInfo: !!(
      ulb?.licenceType &&
      ulb?.licenceKey &&
      ulb?.projectStartDate &&
      ulb?.licenceStartDate
    ),
    departmentLicense: hasLicences,
  };
}

function buildInitialRenewalAlerts(ulb: UlbConfigurationMaster | null): RenewalAlert[] {
  if (!ulb) return [];
  const licenseDuration = ulb.licenceDuration
    ? parseLicenseDurationFromApi(ulb.licenceDuration)
    : '';
  const licenseEndDate =
    ulb.licenceEndDate ??
    calculateLicenseEndDate(ulb.licenceStartDate ?? '', licenseDuration);
  return licenseEndDate ? calculateRenewalAlerts(licenseEndDate) : [];
}

const SECTION_TO_STATUS: Record<UlbSectionKey, keyof CompletionStatus> = {
  'ulb-info': 'ulbInfo',
  'logo-images': 'logoImages',
  'project-license-info': 'projectLicenseInfo',
};

export function useUlbConfigurationForm(initialUlb: UlbConfigurationMaster | null, initialHasLicences = false) {
  const t = useTranslations('ulb_configuration');
  const tCommon = useTranslations('common');

  const [initialFormData, setInitialFormData] = useState<ULBConfigurationFormData>(() => buildInitialForm(initialUlb));
  const [formData, setFormData] = useState<ULBConfigurationFormData>(initialFormData);
  const [errors, setErrors] = useState<UlbConfigurationFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ULBConfigurationFormData, boolean>>>({});
  const [submittedOnce, setSubmittedOnce] = useState<Partial<Record<UlbSectionKey, boolean>>>({});
  const [masterRenewalAlerts, setMasterRenewalAlerts] = useState<RenewalAlert[]>(() =>
    buildInitialRenewalAlerts(initialUlb)
  );
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>(() =>
    buildCompletionStatus(initialUlb, initialHasLicences)
  );

  const validateFields = useCallback(
    (data: ULBConfigurationFormData, section: UlbSectionKey): UlbConfigurationFieldErrors =>
      validateUlbConfigurationFields(data, section, tCommon, t),
    [t, tCommon]
  );

  const syncFromUlbMaster = useCallback((ulb: UlbConfigurationMaster | null, hasLicences?: boolean) => {
    const initial = buildInitialForm(ulb);
    setInitialFormData(initial);
    setFormData(initial);
    setErrors({});
    setTouched({});
    setSubmittedOnce({});
    setMasterRenewalAlerts(buildInitialRenewalAlerts(ulb));
    setCompletionStatus((prev) => ({
      ...buildCompletionStatus(ulb, hasLicences ?? prev.departmentLicense),
      departmentLicense: hasLicences ?? prev.departmentLicense,
    }));
  }, []);

  const setField = useCallback(<K extends keyof ULBConfigurationFormData>(field: K, value: ULBConfigurationFormData[K], updateInitial = false) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (updateInitial) {
      setInitialFormData((prev) => ({ ...prev, [field]: value }));
    }
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleFieldChange = useCallback(
    <K extends keyof ULBConfigurationFormData>(field: K, value: ULBConfigurationFormData[K]) => {
      const sanitized =
        typeof value === 'string'
          ? (sanitizeUlbFieldValue(field, value) as ULBConfigurationFormData[K])
          : value;
      setField(field, sanitized);
    },
    [setField]
  );

  const handleFieldBlur = useCallback(
    (field: keyof ULBConfigurationFormData) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const projectLicenseFields: (keyof ULBConfigurationFormData)[] = [
        'projectStartDate',
        'financialYearStart',
        'goLiveDate',
        'implementationPartner',
        'projectManager',
        'projectManagerEmail',
        'projectManagerPhone',
        'licenseType',
        'licenseKey',
        'licenseStartDate',
        'licenseDuration',
        'licenseEndDate',
        'supportType',
      ];

      const section: UlbSectionKey = projectLicenseFields.includes(field)
        ? 'project-license-info'
        : 'ulb-info';

      const fieldErrors = validateFields(formData, section);
      setErrors((prev) => ({
        ...prev,
        [field]: fieldErrors[field],
      }));
    },
    [formData, validateFields]
  );

  const getFieldError = useCallback(
    (field: keyof ULBConfigurationFormData): string | undefined => {
      if (!errors[field]) return undefined;

      const projectLicenseFields: (keyof ULBConfigurationFormData)[] = [
        'projectStartDate',
        'financialYearStart',
        'goLiveDate',
        'implementationPartner',
        'projectManager',
        'projectManagerEmail',
        'projectManagerPhone',
        'licenseType',
        'licenseKey',
        'licenseStartDate',
        'licenseDuration',
        'licenseEndDate',
        'supportType',
      ];
      const section: UlbSectionKey = projectLicenseFields.includes(field)
        ? 'project-license-info'
        : 'ulb-info';

      if (submittedOnce[section] || touched[field]) {
        return errors[field];
      }
      return undefined;
    },
    [errors, submittedOnce, touched]
  );

  const handleStateChange = useCallback((state: string) => {
    setFormData((prev) => ({ ...prev, state, district: '' }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.state;
      delete next.district;
      return next;
    });
  }, []);

  const handleLicenseChange = useCallback((field: 'licenseStartDate' | 'licenseDuration', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const endDate = calculateLicenseEndDate(next.licenseStartDate, next.licenseDuration);
      next.licenseEndDate = endDate;
      const alerts = calculateRenewalAlerts(endDate);
      next.renewalDate = alerts[0]?.date ?? '';
      setMasterRenewalAlerts(alerts);
      return next;
    });
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const generateLicenseKey = useCallback(() => {
    const key = buildLicenseKey();
    setField('licenseKey', key);
    toast.success('Master license key generated', { description: key });
  }, [setField]);

  const validateSection = useCallback(
    (section: UlbSectionKey): boolean => {
      if (section === 'logo-images') {
        return getUlbConfigurationValidationError(formData, section) === null;
      }

      setSubmittedOnce((prev) => ({ ...prev, [section]: true }));
      const fieldErrors = validateFields(formData, section);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));

      if (Object.keys(fieldErrors).length > 0) return false;

      return getUlbConfigurationValidationError(formData, section) === null;
    },
    [formData, validateFields]
  );

  const getSectionValidationError = useCallback(
    (section: UlbSectionKey): string | null => {
      const fieldErrors = validateFields(formData, section);
      const firstFieldError = getFirstUlbFieldError(fieldErrors, section);
      if (firstFieldError) return firstFieldError;

      const code = getUlbConfigurationValidationError(formData, section);
      return code ? t(`validation.${code}`) : null;
    },
    [formData, t, validateFields]
  );

  const markSectionComplete = useCallback((section: UlbSectionKey, complete: boolean) => {
    setCompletionStatus((prev) => ({ ...prev, [SECTION_TO_STATUS[section]]: complete }));
  }, []);

  const setDepartmentLicenseComplete = useCallback((complete: boolean) => {
    setCompletionStatus((prev) => ({ ...prev, departmentLicense: complete }));
  }, []);

  const completedCount = useMemo(
    () => Object.values(completionStatus).filter(Boolean).length,
    [completionStatus]
  );

  const urgentAlertCount = useMemo(
    () =>
      masterRenewalAlerts.filter((a) => a.triggered && a.daysRemaining >= -30).length,
    [masterRenewalAlerts]
  );

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  return {
    formData,
    errors,
    touched,
    isDirty,
    setField,
    handleFieldChange,
    handleFieldBlur,
    getFieldError,
    handleStateChange,
    handleLicenseChange,
    generateLicenseKey,
    masterRenewalAlerts,
    completionStatus,
    markSectionComplete,
    setDepartmentLicenseComplete,
    syncFromUlbMaster,
    validateSection,
    getSectionValidationError,
    completedCount,
    urgentAlertCount,
  };
}

export type UseUlbConfigurationForm = ReturnType<typeof useUlbConfigurationForm>;
