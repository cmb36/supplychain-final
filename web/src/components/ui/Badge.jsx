import { forwardRef } from 'react';

const badgeVariants = {
  default: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  warning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  info: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    border: '1px solid #93c5fd',
  },
};

const Badge = forwardRef(({ 
  children, 
  variant = 'default',
  className = '', 
  style = {}, 
  ...props 
}, ref) => {
  const variantStyles = badgeVariants[variant] || badgeVariants.default;

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        lineHeight: '1',
        ...variantStyles,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;

