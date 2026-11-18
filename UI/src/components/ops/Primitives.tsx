import type { ReactNode } from 'react';
import type { HealthStatus } from '../../types/domain';

export function StatusPill({ status, children }: { status: HealthStatus; children?: ReactNode }) {
  const label = children ?? (status === 'unknown' ? 'No data' : status);
  return <span className={`status-label status-${status}`}><span className="status-dot" />{label}</span>;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
}: {
  value: T;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={`segmented-control ${className}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children, icon = '—' }: { children: ReactNode; icon?: string }) {
  return <div className="compact-empty"><span aria-hidden="true">{icon}</span><span>{children}</span></div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading redesigned-page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </header>
  );
}

export function CardHeader({ title, description, trailing }: { title: string; description?: string; trailing?: ReactNode }) {
  return (
    <div className="surface-heading redesigned-card-heading">
      <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {trailing}
    </div>
  );
}
