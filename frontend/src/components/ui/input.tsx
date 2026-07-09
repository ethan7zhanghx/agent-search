import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-[12px] border border-[var(--querit-line)] bg-white px-3 text-sm text-[var(--querit-ink)] outline-none transition focus:border-[var(--querit-ink)] focus:ring-4 focus:ring-cyan-100",
        className,
      )}
      {...props}
    />
  );
}
