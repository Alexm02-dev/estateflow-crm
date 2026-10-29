import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'AVAILABLE':
      return <Badge variant="success">Available</Badge>;
    case 'RESERVED':
      return <Badge variant="warning">Reserved</Badge>;
    case 'BOOKED':
      return <Badge variant="purple">Booked</Badge>;
    case 'UNAVAILABLE':
      return <Badge variant="neutral">Unavailable</Badge>;
    case 'CONFIRMED':
      return <Badge variant="success">Confirmed</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pending</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'NEW':
      return <Badge variant="info">New</Badge>;
    case 'CONTACTED':
      return <Badge variant="default">Contacted</Badge>;
    case 'SITE_VISIT':
      return <Badge variant="purple">Site Visit</Badge>;
    case 'INTERESTED':
      return <Badge variant="info">Interested</Badge>;
    case 'NEGOTIATION':
      return <Badge variant="warning">Negotiation</Badge>;
    case 'LOST':
      return <Badge variant="danger">Lost</Badge>;
    case 'ADMIN':
      return <Badge variant="purple">Admin</Badge>;
    case 'SALES_EMPLOYEE':
      return <Badge variant="info">Sales Agent</Badge>;
    default:
      return <Badge variant="default">{status.replace('_', ' ')}</Badge>;
  }
};
