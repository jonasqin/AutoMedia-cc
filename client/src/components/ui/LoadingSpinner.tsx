import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    },
    color: {
      default: 'text-primary-600',
      white: 'text-white',
      gray: 'text-gray-500',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
  },
});

export interface LoadingSpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string;
  textPosition?: 'right' | 'bottom' | 'hidden';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size,
  color,
  text,
  textPosition = 'right',
  ...props
}) => {
  return (
    <div className={cn('flex items-center', textPosition === 'bottom' && 'flex-col')}>
      <svg
        className={cn(spinnerVariants({ size, color }), className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && textPosition !== 'hidden' && (
        <span
          className={cn(
            'ml-2 text-sm',
            color === 'white' && 'text-white',
            color === 'gray' && 'text-gray-500',
            textPosition === 'bottom' && 'ml-0 mt-2'
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;