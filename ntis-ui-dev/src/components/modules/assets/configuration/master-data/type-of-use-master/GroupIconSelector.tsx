"use client";

import { useState, useRef, useEffect } from "react";
import { Home, ChevronDown } from "lucide-react";
import { ICON_OPTIONS, getIconKey } from "@/config/typeofuse-icons.config";
import { Label, Button } from "@/components/common";

interface GroupIconSelectorProps {
  value: string;
  onChange: (name: string, value: string) => void;
  name: string;
  label: string;
  required?: boolean;
}

export function GroupIconSelector({
  value,
  onChange,
  name,
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
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = ICON_OPTIONS.find((opt) => opt.value === getIconKey(value));
  const IconComponent = selectedOption?.Icon || Home;

  return (
    <div className="flex flex-col gap-1.5">
      <Label required={required}>{label}</Label>
      <div ref={dropdownRef} className="relative">
        <Button
          variant="secondary"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full font-normal text-gray-800 shadow-none border-gray-300 [&>span]:flex [&>span]:items-center [&>span]:justify-between [&>span]:w-full"
        >
          <div className="flex items-center gap-2">
            <IconComponent size={18} className="text-blue-600" />
            <span className="text-gray-800">{selectedOption?.label || label}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>

        {isOpen && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {ICON_OPTIONS.map((option) => {
              const OptionIcon = option.Icon;
              const isSelected = getIconKey(value) === option.value;
              return (
                <li key={option.value}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange(name, option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-start gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50 focus:outline-none focus:bg-blue-50 h-auto border-0 ${
                      isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-800"
                    }`}
                  >
                    <OptionIcon size={18} className={isSelected ? "text-blue-600" : "text-gray-600"} />
                    <span>{option.label}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


