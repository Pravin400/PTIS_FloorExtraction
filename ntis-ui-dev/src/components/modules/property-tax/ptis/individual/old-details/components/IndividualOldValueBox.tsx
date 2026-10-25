import React from 'react';

export interface ValueBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number | undefined | null;
}

export const ValueBox = React.forwardRef<HTMLDivElement, ValueBoxProps>(
  ({ value, className, ...rest }, ref) => {
    const displayValue = value === null || value === undefined ? '' : value;

    return (
      <div
        ref={ref}
        role="textbox"
        aria-readonly="true"
        className={`relative flex items-center px-2 border rounded text-[13px] font-semibold leading-tight text-black bg-white border-blue-300 h-7 w-full overflow-hidden truncate ${
          className ?? ''
        }`}
        title={displayValue.toString()}
        {...rest}
      >
        <span className="truncate">{displayValue}</span>
      </div>
    );
  }
);

ValueBox.displayName = 'ValueBox';

export default ValueBox;
