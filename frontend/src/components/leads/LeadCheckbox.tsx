import React from 'react';
import { Check } from 'lucide-react';

interface LeadCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  className?: string;
}

export const LeadCheckbox: React.FC<LeadCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  label = 'Select lead row',
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Crucial: prevents triggering row navigation or other parent click handlers
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${
        disabled
          ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-50'
          : checked
          ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
          : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
      } ${className}`}
      id={id}
    >
      <Check
        className={`w-3.5 h-3.5 stroke-[3] transition-all duration-150 ${
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      />
    </div>
  );
};
