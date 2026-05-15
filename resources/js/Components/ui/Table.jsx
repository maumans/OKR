import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Table = forwardRef(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
        <table
            ref={ref}
            className={cn('w-full caption-bottom text-sm', className)}
            {...props}
        />
    </div>
));
Table.displayName = 'Table';

const TableHeader = forwardRef(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn('[&_tr]:border-b border-gray-100 dark:border-dark-800', className)}
        {...props}
    />
));
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn('[&_tr:last-child]:border-0', className)}
        {...props}
    />
));
TableBody.displayName = 'TableBody';

const TableFooter = forwardRef(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            'border-t border-gray-100 dark:border-dark-800',
            'bg-gray-50/50 dark:bg-dark-900/50',
            'font-medium [&>tr]:last:border-b-0',
            className
        )}
        {...props}
    />
));
TableFooter.displayName = 'TableFooter';

const TableRow = forwardRef(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            'border-b border-gray-100 dark:border-dark-800',
            'transition-colors',
            'hover:bg-gray-50 dark:hover:bg-dark-800/60',
            'data-[state=selected]:bg-primary-50 dark:data-[state=selected]:bg-primary-500/10',
            className
        )}
        {...props}
    />
));
TableRow.displayName = 'TableRow';

const TableHead = forwardRef(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            'h-11 px-4 text-left align-middle',
            'text-[11px] font-semibold uppercase tracking-wider',
            'text-gray-400 dark:text-gray-500',
            '[&:has([role=checkbox])]:pr-0',
            className
        )}
        {...props}
    />
));
TableHead.displayName = 'TableHead';

const TableCell = forwardRef(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            'px-4 py-3 align-middle',
            'text-gray-600 dark:text-gray-300',
            '[&:has([role=checkbox])]:pr-0',
            className
        )}
        {...props}
    />
));
TableCell.displayName = 'TableCell';

const TableCaption = forwardRef(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn('mt-4 text-sm text-gray-400 dark:text-gray-500', className)}
        {...props}
    />
));
TableCaption.displayName = 'TableCaption';

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
};
