import { forwardRef } from 'react';

const Card = forwardRef(({ children, className = '', style = {}, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = forwardRef(({ children, className = '', style = {}, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ children, className = '', style = {}, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={className}
      style={{
        margin: 0,
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
        ...style,
      }}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ children, className = '', style = {}, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={className}
      style={{
        margin: '4px 0 0 0',
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ children, className = '', style = {}, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        padding: '20px 24px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ children, className = '', style = {}, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        padding: '16px 24px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

