import { cache } from 'react';
import { apiClient } from '../../services/api.service';
import { FOOTER_REGISTRY, DEFAULT_ACTION_STYLE, FooterButtonStyle } from '@/config/footer-registry';
import { logger } from '@/lib/utils/logger';
import { FALLBACK_FOOTER_ACTIONS } from '@/config/footer-fallback';

export interface FooterActionDto {
  id: number;
  actionCommand: string;
  buttonName: string;
  lucideIcon?: string;
  displayOrder: number;
  isEnabled: boolean;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  haveFullAccess?: boolean;
  haveNoAccess?: boolean;
  routePath?: string;
}

export interface FooterAction extends FooterActionDto {
  style: FooterButtonStyle;
}

/**
 * Service to handle dynamic footer actions fetched from the backend.
 * Integrates permissions (from DB) with aesthetics (from footer-registry).
 */
export const footerService = {
  /**
   * Fetches authorized footer actions for a specific role and route.
   * Deduped per request using react cache.
   * @param options.userRoleId - Mandatory ID of the user role
   * @param options.targetRoute - Optional route path to filter actions and find screenId
   * @param options.screenId - Optional explicit screenId
   */
  getAuthorizedActions: cache(
    async (options: { userRoleId: number; targetRoute?: string }): Promise<FooterAction[]> => {
      // 1. Mandatory Validation
      if (!options.userRoleId) {
        logger.error('footerService.getAuthorizedActions: userRoleId is mandatory');
        return [];
      }

      let items: FooterActionDto[] = [];

      try {
        const params = new URLSearchParams();
        params.set('UserRoleId', options.userRoleId.toString());
        // Explicitly NOT passing ScreenId as per user request

        const response = await apiClient.get<{ items?: FooterActionDto[] } | FooterActionDto[]>(
          `FooterAction?${params.toString()}`
        );

        if (!response.success || !response.data) {
          logger.warn('FooterAction API response indicates failure or empty data, falling back to static footer actions');
          items = FALLBACK_FOOTER_ACTIONS.map((action, index) => ({
            id: index + 1000,
            ...action,
          }));
        } else {
          // Handle both raw array and wrapped response with 'items'
          items = Array.isArray(response.data)
            ? response.data
            : response.data.items || [];
        }
      } catch (error) {
        logger.error('Error in footerService.getAuthorizedActions (falling back to static footer actions):', {
          error: error instanceof Error ? error : new Error(String(error))
        });
        items = FALLBACK_FOOTER_ACTIONS.map((action, index) => ({
          id: index + 1000,
          ...action,
        }));
      }

      // Filter out BANK_MASTER as requested by user
      items = items.filter((item) => (item.actionCommand || '').toUpperCase() !== 'BANK_MASTER');

      // 3. Final Frontend Filtering
      // Filter by routePath to show only actions relevant to the current screen.
      // We are more lenient here, matching if either path contains the other
      // after normalization to avoid minor trailing slash or prefix issues.
      if (options.targetRoute) {
        const normalize = (path: string) =>
          path
            .toLowerCase()
            .replace(/^\/+|\/+$/g, '')
            .trim();
        const normalizedTarget = normalize(options.targetRoute);

        items = items.filter((item) => {
          if (!item.routePath) {
            const cmd = (item.actionCommand || '').toUpperCase();
            const prefix = cmd.split('_')[0].toLowerCase();
            const targetSegments = normalizedTarget.split('/');
            return prefix ? targetSegments.includes(prefix) : false;
          }
          const normalizedItemPath = normalize(item.routePath);
          return (
            normalizedItemPath === normalizedTarget ||
            normalizedItemPath.includes(normalizedTarget) ||
            normalizedTarget.includes(normalizedItemPath)
          );
        });
      }

      return items.map((dto) => {
        const baseStyle = FOOTER_REGISTRY[dto.actionCommand] || DEFAULT_ACTION_STYLE;
        return {
          ...dto,
          style: {
            ...baseStyle,
            iconName: dto.lucideIcon || baseStyle.iconName,
          },
        };
      });
    }
  ),
};

