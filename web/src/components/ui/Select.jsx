import { forwardRef } from 'react';

const Select = forwardRef(({ 
  children, 
  value, 
  onChange, 
  disabled = false,
  placeholder,
  className = '',
  style = {},
  fullWidth = true,
  ...props 
}, ref) => {
  return (
    <div style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={className}
        style={{
          width: fullWidth ? '100%' : 'auto',
          minWidth: fullWidth ? 'auto' : '200px',
          padding: '10px 36px 10px 12px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none',
          transition: 'all 0.2s',
          opacity: disabled ? 0.5 : 1,
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
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {/* Icono de flecha personalizado */}
      <div
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#6b7280',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;

