import { forwardRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

const Avatar = forwardRef(({ className, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn(
            'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
            className
        )}
        {...props}
    />
));
Avatar.displayName = 'Avatar';

const AvatarImage = forwardRef(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn('aspect-square h-full w-full', className)}
        {...props}
    />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            'flex h-full w-full items-center justify-center rounded-full',
            'bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm font-semibold',
            className
        )}
        {...props}
    />
));
AvatarFallback.displayName = 'AvatarFallback';

// Convenience component
function UserAvatar({ name, image, size = 'default', className }) {
    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        default: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
    };

    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            {image && <AvatarImage src={image} alt={name} />}
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
    );
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar };
