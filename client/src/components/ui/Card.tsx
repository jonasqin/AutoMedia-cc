import React, { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-lg border bg-white shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        elevated: 'border-gray-200 shadow-md',
        outlined: 'border-2 border-gray-300',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const CardHeaderVariants = cva('flex flex-col space-y-1.5 p-6', {
  variants: {
    variant: {
      default: '',
      border: 'border-b border-gray-200',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const CardBodyVariants = cva('p-6 pt-0', {
  variants: {
    variant: {
      default: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const CardFooterVariants = cva('flex items-center p-6 pt-0', {
  variants: {
    variant: {
      default: '',
      border: 'border-t border-gray-200',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  hover?: boolean;
  clickable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, clickable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, size, className }),
        hover && 'transition-shadow hover:shadow-md cursor-pointer',
        clickable && 'cursor-pointer'
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'border';
}

const CardHeader: React.FC<CardHeaderProps> = ({ className, variant, ...props }) => (
  <div className={cn(CardHeaderVariants({ variant }), className)} {...props} />
);

CardHeader.displayName = 'CardHeader';

const CardBody: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn(CardBodyVariants(), className)} {...props} />
);

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'border';
}

const CardFooter: React.FC<CardFooterProps> = ({ className, variant, ...props }) => (
  <div className={cn(CardFooterVariants({ variant }), className)} {...props} />
);

CardFooter.displayName = 'CardFooter';

const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props} />
);

CardTitle.displayName = 'CardTitle';

const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-gray-600', className)} {...props} />
);

CardDescription.displayName = 'CardDescription';

export { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription };