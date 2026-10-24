import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: ReactNode;
  required?: boolean;
  error?: string;
  helperText?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  helperText,
  fullWidth = false,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`field ${fullWidth ? 'full' : ''} ${className}`.trim()}>
      <label>
        {label}
        {required && <span style={{ color: 'var(--red, #ff4d6d)', marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {error ? (
        <span className="small" style={{ color: 'var(--red, #ff4d6d)', marginTop: 4 }}>
          {error}
        </span>
      ) : helperText ? (
        <span className="small dim" style={{ marginTop: 4 }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

export default FormField;
