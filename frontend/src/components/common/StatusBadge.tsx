import type { ReactNode } from 'react';

export type StatusVariant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray' | 'pink';

export interface StatusBadgeProps {
  variant?: StatusVariant;
  children: ReactNode;
  plain?: boolean;
  className?: string;
}

export function StatusBadge({
  variant = 'gray',
  children,
  plain = false,
  className = '',
}: StatusBadgeProps) {
  return (
    <span className={`badge b-${variant} ${plain ? 'plain' : ''} ${className}`.trim()}>
      {children}
    </span>
  );
}

export default StatusBadge;
