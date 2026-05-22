import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/Components/ui/Dialog';
import { cn } from '@/lib/utils';

// AlertDialog built on top of our existing Dialog component — no extra Radix dep needed.

function AlertDialog({ children, open, onOpenChange }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const setOpen = (v) => {
        if (!isControlled) setInternalOpen(v);
        onOpenChange?.(v);
    };

    // We pass the state down to children via context-like prop injection
    const childArray = Array.isArray(children) ? children : [children];

    const trigger = childArray.find(c => c?.type?.displayName === 'AlertDialogTrigger');
    const content = childArray.find(c => c?.type?.displayName === 'AlertDialogContent');

    return (
        <>
            {trigger && (
                <span onClick={() => setOpen(true)}>
                    {trigger.props.children}
                </span>
            )}
            <Dialog open={isOpen} onOpenChange={setOpen}>
                {content && (
                    <DialogContent className="max-w-md">
                        {typeof content.props.children === 'function'
                            ? content.props.children({ close: () => setOpen(false) })
                            : content.props.children}
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}

function AlertDialogTrigger({ children, asChild }) {
    return <>{children}</>;
}
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

function AlertDialogContent({ children, className }) {
    return <>{children}</>;
}
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({ className, ...props }) => (
    <DialogHeader className={className} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...props }) => (
    <DialogFooter className={className} {...props} />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = ({ className, ...props }) => (
    <DialogTitle className={className} {...props} />
);
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = ({ className, ...props }) => (
    <DialogDescription className={className} {...props} />
);
AlertDialogDescription.displayName = 'AlertDialogDescription';

const AlertDialogAction = ({ className, children, ...props }) => (
    <button
        className={cn(
            'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold',
            'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            'transition-colors disabled:opacity-50 disabled:pointer-events-none',
            className
        )}
        {...props}
    >
        {children}
    </button>
);
AlertDialogAction.displayName = 'AlertDialogAction';

const AlertDialogCancel = ({ className, children, ...props }) => (
    <button
        className={cn(
            'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold',
            'border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800',
            'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700',
            'focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-colors',
            className
        )}
        {...props}
    >
        {children}
    </button>
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
