import React from 'react';
import { Navbar } from './Navbar';

export interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  onToggleSidebar?: () => void;
  pageTitle?: string;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onToggleSidebar,
  pageTitle,
  isSidebarOpen,
}) => {
  return (
    <Navbar
      onToggleSidebar={onToggleSidebar || onToggleMobileSidebar || (() => {})}
      pageTitle={pageTitle}
      isSidebarOpen={isSidebarOpen}
    />
  );
};
