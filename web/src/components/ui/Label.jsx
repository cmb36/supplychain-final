import { forwardRef } from 'react';

const Label = forwardRef(({ 
  children, 
  htmlFor,
  required = false,
  className = '', 
  style = {}, 
  ...props 
}, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={className}
      style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px',
        ...style,
      }}
      {...props}
    >
      {children}
      {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
    </label>
  );
});

Label.displayName = 'Label';

export default Label;

