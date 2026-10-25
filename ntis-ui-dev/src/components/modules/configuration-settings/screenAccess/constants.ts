import { Eye, Edit, Lock, Unlock, Trash2 } from 'lucide-react';

/**
 * Configuration for screen access permission levels.
 *
 * Access Level Guidelines:
 * - `no-access`: Completely hides the screen from the navigation menu and prevents direct URL access. Use for unauthorized roles.
 * - `view`: Grants read-only access. Users can see data but cannot make any modifications.
 * - `edit`: Grants read and write access. Users can create and update records, but cannot delete them.
 * - `delete`: Grants view, edit, and deletion rights. Use cautiously for senior roles.
 * - `full`: Grants complete administrative control over the screen, including special elevated actions if applicable.
 */
export const getAccessLevelConfig = (t: (key: string) => string) => ({
  'no-access': {
    label: t('accessControl.accessLevels.noAccess'),
    shortLabel: 'X',
    icon: Lock,
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  view: {
    label: t('accessControl.accessLevels.view'),
    shortLabel: 'V',
    icon: Eye,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  edit: {
    label: t('accessControl.accessLevels.edit'),
    shortLabel: 'E',
    icon: Edit,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  delete: {
    label: t('accessControl.accessLevels.delete'),
    shortLabel: 'D',
    icon: Trash2,
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  full: {
    label: t('accessControl.accessLevels.full'),
    shortLabel: 'F',
    icon: Unlock,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
});
