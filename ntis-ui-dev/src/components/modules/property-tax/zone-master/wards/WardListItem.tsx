interface WardListItemProps {
  wardNo: string;
  description?: string;
  checked?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  colorScheme?: 'blue' | 'purple' | 'green';
}

export function WardListItem({
  wardNo,
  checked = false,
  onToggle,
  disabled = false,
  colorScheme = 'blue',
}: WardListItemProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-white/60',
      hover: 'hover:bg-white/80',
      border: 'border-blue-100/50',
      hoverBorder: 'hover:border-blue-300/50',
      text: 'text-blue-700',
      checkbox: 'text-blue-600',
      focusRing: 'focus:ring-blue-500',
      hoverText: 'group-hover:text-blue-700',
    },
    purple: {
      bg: 'bg-white/60',
      hover: 'hover:bg-white/80',
      border: 'border-purple-100/50',
      hoverBorder: 'hover:border-purple-300/50',
      text: 'text-purple-700',
      checkbox: 'text-purple-600',
      focusRing: 'focus:ring-purple-500',
      hoverText: 'group-hover:text-purple-700',
    },
    green: {
      bg: 'bg-green-50/60',
      hover: 'hover:bg-green-100/80',
      border: 'border-green-200/50',
      hoverBorder: 'hover:border-green-300/50',
      text: 'text-green-700',
      checkbox: 'text-green-600',
      focusRing: 'focus:ring-green-500',
      hoverText: 'group-hover:text-green-700',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <label
      className={`flex items-center gap-3 px-4 py-1 ${colors.bg} backdrop-blur-sm ${colors.hover} rounded-lg cursor-pointer transition-all duration-200 border ${colors.border} ${colors.hoverBorder} hover:shadow-md group`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className={`w-4 h-4 ${colors.checkbox} rounded focus:ring-2 ${colors.focusRing} focus:ring-offset-1`}
      />
      <span className={`text-sm font-medium text-gray-700 ${colors.hoverText} transition-colors flex items-center gap-2 flex-1`}>
        {wardNo}
      </span>
    </label>
  );
}
