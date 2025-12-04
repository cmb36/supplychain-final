import { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  className = '',
  style = {},
  ...props 
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      style={{
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        color: '#374151',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        outline: 'none',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#0ea5e9';
        e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;

