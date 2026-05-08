import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-dark-800 dark:text-slate-100 dark:hover:bg-dark-700",
        primary:
          "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400",
        secondary:
          "bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-900/30 dark:text-secondary-400",
        destructive:
          "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400", // Style "Deactive" maquette
        success:
          "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400", // Style "Active" maquette
        warning:
          "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        outline:
          "text-slate-900 border border-slate-200 dark:text-slate-100 dark:border-dark-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
