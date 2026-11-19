import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'default' | 'primary' | 'ink' | 'ghost' | 'danger';

function classes(variant: Variant, size: 'sm' | 'md' | 'lg', block: boolean, extra?: string): string {
  return [
    'btn',
    variant !== 'default' ? `btn--${variant}` : '',
    size !== 'md' ? `btn--${size}` : '',
    block ? 'btn--block' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

interface BaseProps {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  className?: string | undefined;
  children: ReactNode;
}

export function Button({
  variant = 'default',
  size = 'md',
  block = false,
  className,
  children,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={classes(variant, size, block, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variant = 'default',
  size = 'md',
  block = false,
  className,
  children,
}: BaseProps & { to: string }) {
  return (
    <Link to={to} className={classes(variant, size, block, className)}>
      {children}
    </Link>
  );
}
