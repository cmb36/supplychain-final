import { forwardRef } from 'react';

const buttonVariants = {
  default: {
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    hover: { backgroundColor: '#0284c7' }
  },
  destructive: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    hover: { backgroundColor: '#dc2626' }
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#374151',
    border: '1px solid #d1d5db',
    hover: { backgroundColor: '#f9fafb', borderColor: '#9ca3af' }
  },
  secondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    hover: { backgroundColor: '#e5e7eb' }
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#374151',
    border: 'none',
    hover: { backgroundColor: '#f3f4f6' }
  },
  success: {
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    hover: { backgroundColor: '#16a34a' }
  },
};

const buttonSizes = {
  default: {
    padding: '10px 16px',
    fontSize: '14px',
  },
  sm: {
    padding: '6px 12px',
    fontSize: '13px',
  },
  lg: {
    padding: '12px 24px',
    fontSize: '15px',
  },
  icon: {
    padding: '8px',
    width: '36px',
    height: '36px',
  },
};

const Button = forwardRef(({ 
  children, 
  variant = 'default', 
  size = 'default',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  style = {},
  ...props 
}, ref) => {
  const variantStyles = buttonVariants[variant] || buttonVariants.default;
  const sizeStyles = buttonSizes[size] || buttonSizes.default;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        whiteSpace: 'nowrap',
        ...variantStyles,
        ...sizeStyles,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variantStyles.hover) {
          Object.assign(e.target.style, variantStyles.hover);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = variantStyles.backgroundColor;
          if (variantStyles.border) {
            e.target.style.border = variantStyles.border;
          }
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

