import React from 'react';

export const baseFieldClass =
  'border border-blue-200 rounded bg-gradient-to-br from-blue-50 to-blue-100 p-0.5 shadow-sm';

export interface FieldShellProps {
  id?: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}

const FieldShell: React.FC<FieldShellProps> = ({ id, label, icon: Icon, className, children }) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const labelId = `${fieldId}-label`;

  const childWithA11y = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{ id?: string; 'aria-labelledby'?: string }>,
        {
          id: (children as React.ReactElement<{ id?: string }>).props.id ?? fieldId,
          'aria-labelledby':
            (children as React.ReactElement<{ 'aria-labelledby'?: string }>).props[
              'aria-labelledby'
            ] ?? labelId,
        }
      )
    : children;

  return (
    <div className={`${baseFieldClass} ${className ?? ''}`}>
      <div id={labelId} className="text-sm text-blue-800 mb-0 block">
        {Icon && <Icon className="w-2.5 h-2.5 inline mr-0.5 text-blue-600" />}
        {label}
      </div>
      {childWithA11y}
    </div>
  );
};

export default FieldShell;
