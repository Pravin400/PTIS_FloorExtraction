import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ValueDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number | undefined | null;
  prefixIcon?: LucideIcon;
  prefixIconClassName?: string;
}

export const ValueDisplay = React.forwardRef<HTMLDivElement, ValueDisplayProps>(
  ({ value, className, prefixIcon: Icon, prefixIconClassName, ...rest }, ref) => {
    const displayValue = value === null || value === undefined ? '' : value;

    return (
      <div
        ref={ref}
        role="textbox"
        aria-readonly="true"
        className={`relative flex items-center px-2 border rounded text-[13px] font-semibold leading-tight text-black bg-white border-blue-300 h-7 w-full overflow-hidden truncate ${className ?? ''}`}
        title={displayValue.toString()}
        {...rest}
      >
        {Icon && (
          <Icon
            className={`w-5 h-5 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${prefixIconClassName || 'text-green-600'}`}
          />
        )}
        <span className={Icon ? 'pl-5 truncate' : 'truncate'}>{displayValue}</span>
      </div>
    );
  }
);

ValueDisplay.displayName = 'ValueDisplay';
