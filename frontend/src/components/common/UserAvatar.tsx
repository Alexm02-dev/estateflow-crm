import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  isOnline?: boolean;
  className?: string;
}

const colorPalette = [
  'bg-indigo-600 text-white',
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-violet-600 text-white',
  'bg-rose-600 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-cyan-600 text-white',
];

const getColorForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
};

const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 'md',
  showStatus = false,
  isOnline = true,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0 ring-1',
    md: 'w-2.5 h-2.5 bottom-0 right-0 ring-2',
    lg: 'w-3 h-3 bottom-0.5 right-0.5 ring-2',
    xl: 'w-3.5 h-3.5 bottom-0.5 right-0.5 ring-2',
  };

  const colorClass = getColorForName(name || 'Unknown');
  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size]} ${colorClass} rounded-full font-semibold flex items-center justify-center tracking-wider shadow-sm ring-2 ring-white`}
        title={name}
      >
        {initials}
      </div>
      {showStatus && (
        <span
          className={`absolute rounded-full ring-white ${statusSizeClasses[size]} ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
