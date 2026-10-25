import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Props for the {@link TextArea} component.
 *
 * @property error - If true, displays the textarea in an error state.
 * @property errorMessage - Error message shown below the textarea when in error state.
 * @property showCharCount - If true, displays the current character count based on the current value, for both controlled (`value`) and uncontrolled (`defaultValue`) usage.
 *
 * Inherits all standard textarea attributes.
 */
export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  showCharCount?: boolean;
  charCountLabel?: string;
}
/**
 * TextArea component for multi-line text input in forms.
 *
 * Extends the native `<textarea>` with styling, error state, and optional character counting.
 *
 * - Shows an error message and ARIA attributes when `error` and `errorMessage` are set.
 * - Displays character count if `showCharCount` is true.
 * - Accepts all standard textarea props via {@link TextAreaProps}.
 */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      id, // Explicitly destructure id for clarity and better IntelliSense
      className,
      rows = 4,
      label,
      required,
      error,
      errorMessage,
      showCharCount,
      charCountLabel,
      maxLength,
      value,
      defaultValue,
      onChange,
      ...props
    }: TextAreaProps,
    ref: React.ForwardedRef<HTMLTextAreaElement>
  ) => {
    // Generate a fallback id if not provided
    const internalId = React.useId();
    const errorId = `${id || internalId}-error`;

    // Support live char count for uncontrolled usage
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      typeof defaultValue === 'string' ? defaultValue : ''
    );

    let currentLength = 0;
    if (isControlled && typeof value === 'string') {
      currentLength = value.length;
    } else {
      currentLength = uncontrolledValue.length;
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id || internalId} className="mb-1.5 inline-block text-sm font-medium text-gray-700 dark:text-gray-900">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id || internalId} // Ensure id is passed to the textarea
          rows={rows}
          data-slot="textarea"
          {...(isControlled
            ? { value: value ?? "" }
            : { defaultValue })}
          maxLength={maxLength}
          aria-invalid={error || props["aria-invalid"] === "true" ? "true" : "false"}
          aria-describedby={
            errorMessage
              ? [errorId, props["aria-describedby"]].filter(Boolean).join(" ")
              : props["aria-describedby"]
          }
          className={cn(
            // text / placeholder / selection
            "placeholder:text-gray-500 selection:bg-primary selection:text-primary-foreground",
            // size & layout
            "flex w-full min-w-0 rounded-md px-3 py-2 text-gray-700 md:text-sm",
            // background & transition
            "bg-input-background outline-none transition-all duration-200",
            // default border
            "border border-gray-300",
            // FOCUS STYLES (BLUE RING)
            "focus-visible:border-blue-300",
            "focus-visible:ring-2 focus-visible:ring-blue-400/40",
            // error state
            error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
            "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/30",
            // disabled
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            // resize control
            "resize-y",
            className
          )}
          onChange={e => {
            if (!isControlled) {
              setUncontrolledValue(e.target.value);
            }
            if (onChange) {
              onChange(e);
            }
          }}
          {...props}
        />

        <div className="flex items-center justify-between mt-1">
          {errorMessage && (
            <p
              id={errorId}
              className="text-xs text-red-600"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          {showCharCount && (
            <p className={cn("text-xs ml-auto", maxLength && currentLength >= maxLength ? "text-amber-600 font-semibold" : "text-gray-500")}>
              {maxLength
                ? `${currentLength} / ${maxLength}${charCountLabel ? ` ${charCountLabel}` : ''}`
                : `${currentLength}${charCountLabel ? ` ${charCountLabel}` : ''}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
