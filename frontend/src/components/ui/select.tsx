import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative inline-flex min-w-40 items-center", className)}>
      <select
        className="h-10 w-full appearance-none rounded-[10px] border border-[var(--querit-line)] bg-white py-0 pl-3 pr-9 text-sm font-medium text-[var(--querit-soft-ink)] outline-none transition focus:border-[var(--querit-ink)] focus:ring-4 focus:ring-cyan-100"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--querit-muted)]" />
    </span>
  );
}
