import React, { ReactNode, memo, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Tooltip } from '../common/Tooltip';

interface SidebarItemProps {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
  badge?: ReactNode;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = memo(({
  name,
  path,
  icon: Icon,
  exact = false,
  isCollapsed = false,
  isMobile = false,
  badge,
  onClick,
}) => {
  const location = useLocation();

  const isExplicitActive = useMemo(() => {
    if (path.includes('?')) {
      const [itemPath, itemQuery] = path.split('?');
      if (location.pathname !== itemPath) return false;
      const searchParams = new URLSearchParams(location.search);
      const targetParams = new URLSearchParams(itemQuery);
      for (const [key, val] of targetParams.entries()) {
        if (searchParams.get(key) !== val) return false;
      }
      return true;
    }
    // Clean root path
    if (path === '/') {
      return location.pathname === '/' && !location.search;
    }
    // Non-query path is active if location matches and there are no competing query parameters
    return location.pathname === path && !location.search;
  }, [location.pathname, location.search, path]);

  const content = (
    <NavLink
      to={path}
      end={exact}
      onClick={onClick}
      className={({ isActive: navActive }) => {
        const isActive = path.includes('?') ? isExplicitActive : (navActive && !location.search);
        return `group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          isCollapsed && !isMobile ? 'justify-center px-0 w-10 mx-auto' : ''
        } ${
          isActive
            ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40 font-bold'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
        }`;
      }}
    >
      {({ isActive: navActive }) => {
        const isActive = path.includes('?') ? isExplicitActive : (navActive && !location.search);
        return (
          <>
            <Icon
              className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
              }`}
            />

            {(!isCollapsed || isMobile) && (
              <span className="truncate flex-1">{name}</span>
            )}

            {badge && (!isCollapsed || isMobile) && (
              <span className="flex-shrink-0">{badge}</span>
            )}

            {/* Active indicator dot when collapsed */}
            {isCollapsed && !isMobile && isActive && (
              <span
                className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-400 shadow-xs"
                aria-hidden="true"
              />
            )}
          </>
        );
      }}
    </NavLink>
  );

  // If collapsed on desktop, wrap with Tooltip
  if (isCollapsed && !isMobile) {
    return (
      <Tooltip content={name} position="right" delayMs={100} className="w-full justify-center">
        {content}
      </Tooltip>
    );
  }

  return content;
});
SidebarItem.displayName = 'SidebarItem';
