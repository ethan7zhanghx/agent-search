import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center rounded-[8px] border px-2.5 py-1 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-[var(--querit-line)] bg-white text-[var(--querit-soft-ink)]",
        cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
        blue: "border-blue-200 bg-blue-50 text-blue-800",
        purple: "border-violet-200 bg-violet-50 text-violet-800",
        dark: "border-[var(--querit-ink)] bg-[var(--querit-ink)] text-white",
        muted: "border-transparent bg-[var(--querit-surface)] text-[var(--querit-muted)]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
