import { FALLBACK_FOOTER_ACTIONS } from '@/config/footer-fallback';
import { FOOTER_REGISTRY, DEFAULT_ACTION_STYLE } from '@/config/footer-registry';
import type { FooterAction } from '@/lib/api/footer.service';

export function buildFooterActions(): FooterAction[] {
  return FALLBACK_FOOTER_ACTIONS.map((action, index) => {
    const baseStyle = FOOTER_REGISTRY[action.actionCommand] || DEFAULT_ACTION_STYLE;
    return {
      id: index + 1000,
      ...action,
      style: {
        ...baseStyle,
        iconName: action.lucideIcon || baseStyle.iconName,
      },
    };
  });
}
