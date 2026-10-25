/**
 * GroupIconSelector Component
 * 
 * Custom dropdown selector for choosing group icons
 * Displays icon preview alongside icon names
 */

import { useState, useRef, useEffect } from 'react';
import { Home, ChevronDown } from 'lucide-react';
import { ICON_OPTIONS, getIconKey } from '@/config/typeofuse-icons.config';

// Re-export for backward compatibility
export { getIconKey };

interface GroupIconSelectorProps {
  value: string;
  onChange: (iconValue: string) => void;
  label: string;
  required?: boolean;
}

export function GroupIconSelector({
  value,
  onChange,
  label,
  required = true,
}: GroupIconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = ICON_OPTIONS.find((opt) => opt.value === getIconKey(value));
  const IconComponent = selectedOption?.Icon || Home;

  return (
    <div className="flex flex-col">
      <label className="mb-1.5 text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full h-10 px-4 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <IconComponent size={18} className="text-blue-600" />
            <span className="text-gray-800">{selectedOption?.label || 'Select icon'}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {ICON_OPTIONS.map((option) => {
              const OptionIcon = option.Icon;
              const isSelected = getIconKey(value) === option.value;
              return (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(`${option.value}-icon`);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-blue-50 ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-800'
                  }`}
                >
                  <OptionIcon size={18} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                  <span>{option.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* spacing to match other fields */}
      <div className="h-[18px]" />
    </div>
  );
}
