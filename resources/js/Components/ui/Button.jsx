import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    {
        variants: {
            variant: {
                default:
                    'bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25',
                secondary:
                    'bg-secondary-500 text-white shadow-md hover:bg-secondary-600 hover:shadow-lg hover:shadow-secondary-500/25',
                destructive:
                    'bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25',
                outline:
                    'border-2 border-gray-200 dark:border-dark-600 bg-transparent hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300',
                ghost:
                    'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300',
                link: 'text-primary-500 underline-offset-4 hover:underline',
                glass:
                    'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
            },
            size: {
                default: 'h-10 px-5 py-2',
                sm: 'h-8 rounded-lg px-3 text-xs',
                lg: 'h-12 rounded-xl px-8 text-base',
                xl: 'h-14 rounded-2xl px-10 text-lg',
                icon: 'h-10 w-10 rounded-xl',
                'icon-sm': 'h-8 w-8 rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const Button = forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
