import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'brand-outline' | 'navigation';
  size?: 'default' | 'planner' | 'compact';
}

const brandOutline = 'brand-outline-control';
const variants = {
  'brand-outline': brandOutline,
  navigation: `${brandOutline} navigation-control`,
  primary:
    'border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover active:border-brand-active active:bg-brand-active aria-expanded:border-brand-active aria-expanded:bg-brand-active max-lg:border-brand-hover max-lg:bg-brand-hover',
  outline:
    'border-border bg-surface text-brand hover:border-brand hover:bg-brand-subtle active:border-brand-active active:bg-brand-active active:text-white aria-expanded:border-brand-active aria-expanded:bg-brand-active aria-expanded:text-white max-lg:text-brand-hover max-lg:active:text-white max-lg:aria-expanded:text-white',
} as const;

export function Button({
  variant = 'primary',
  size = 'default',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex items-center justify-center gap-3 ${variant === 'primary' || variant === 'outline' ? 'rounded-control border' : ''} font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 ${size === 'planner' ? 'px-2.5 py-1.5' : size === 'compact' ? 'px-2.5 py-1' : 'px-3 py-2'} ${variants[variant]} ${className}`}
    />
  );
}
