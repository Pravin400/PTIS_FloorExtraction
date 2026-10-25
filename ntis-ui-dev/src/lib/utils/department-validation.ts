export const DEPARTMENT_CODE_REGEX = /^[A-Za-z0-9_-]{1,6}$/;
export const DEPARTMENT_CODE_SANITIZE = /[^A-Za-z0-9_-]/g;

export const DEPARTMENT_TEXT_REGEX = /^[\p{L}\p{M}\s]{1,50}$/u;
export const DEPARTMENT_TEXT_SANITIZE = /[^\p{L}\p{M}\s]/gu;

export const DEPARTMENT_DESCRIPTION_REGEX = /^[\p{L}\p{M}\s]{0,100}$/u;
export const DEPARTMENT_DESCRIPTION_SANITIZE = /[^\p{L}\p{M}\s]/gu;

export const sanitizeDepartmentCode = (value: string) => {
  return value
    .replace(DEPARTMENT_CODE_SANITIZE, '')
    .slice(0, 6);
};

export const sanitizeDepartmentText = (value: string, maxLength: number) => {
  return value
    .replace(DEPARTMENT_TEXT_SANITIZE, '')
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
};

export const sanitizeDescription = (value: string) => {
  return value
    .replace(DEPARTMENT_DESCRIPTION_SANITIZE, '')
    .replace(/\s+/g, ' ')
    .slice(0, 100);
};
