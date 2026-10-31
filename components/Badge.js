'use client';

const variants = {
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-gray-100 text-text-secondary',
};

export default function Badge({ children, variant = 'neutral' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.neutral}`}>
      {children}
    </span>
  );
}
