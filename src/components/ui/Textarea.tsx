"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, label, error, id, ...props }, ref) {
    const autoId = useId();
    const textareaId = id ?? autoId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "min-h-[80px] w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground",
            "placeholder:text-muted-foreground/70 transition-colors",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
            error && "border-expense",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-expense">{error}</p>}
      </div>
    );
  },
);
