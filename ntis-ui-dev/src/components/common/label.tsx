import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
  info?: string;
}

/**
 * Label component for form fields
 * Supports required/optional indicators and info text
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      children,
      required = false,
      optional = false,
      info,
      ...labelProps
    },
    ref
  ) => {
    // Ensure mutually exclusive: if both are set, prioritize 'required' and ignore 'optional'
    const showRequired = required;
    const showOptional = optional && !required;
    const t = useTranslations('common');
    return (
      <div className="flex flex-col gap-0.5">
        <label
          className={cn(
            "block text-sm font-medium text-gray-700",
            className
          )}
          ref={ref}
          {...labelProps}
        >
          <span className="inline-flex items-center gap-1.5">
            {children}
            {showRequired && (
              <span className="text-red-500" aria-label="required">*</span>
            )}
            {showOptional && (
              <span className="text-xs text-gray-400 font-normal">
                {t('form.optional', { default: '(optional)' })}
              </span>
            )}
          </span>
        </label>
        {info && (
          <span className="text-xs text-gray-500 leading-tight">
            {t(info, { default: info })}
          </span>
        )}
      </div>
    );
  }
);

Label.displayName = "Label";
