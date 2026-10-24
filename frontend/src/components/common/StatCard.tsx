import type { ReactNode } from 'react';

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color?: string;
  trend?: { v: string; up: boolean };
  sub?: ReactNode;
}

export function StatCard({
  icon,
  label,
  value,
  color = '#7c5cff',
  trend,
  sub,
}: StatCardProps) {
  return (
    <div className="card stat hover" style={{ ['--c' as string]: color }}>
      <div className="icon" style={{ background: `${color}22`, color }}>
        {icon}
      </div>
      {trend && (
        <span
          className="trend"
          style={{
            background: trend.up ? 'rgba(46,212,122,.14)' : 'rgba(255,77,109,.14)',
            color: trend.up ? '#5ef0a0' : '#ff8aa0',
          }}
        >
          {trend.up ? '▲' : '▼'} {trend.v}
        </span>
      )}
      <div className="value">{value}</div>
      <div className="label">{label}</div>
      {sub && <div className="small dim mt8">{sub}</div>}
    </div>
  );
}

export default StatCard;
