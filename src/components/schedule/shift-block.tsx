import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ShiftBlockProps {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}

// Purely presentational - has no knowledge of grid placement or periods.
// Reused as-is across every schedule-shaped screen (Bản biểu, Đăng ban, and
// later Bản ký); the containing grid decides where it sits.
export function ShiftBlock({ title, children, className }: ShiftBlockProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1 rounded-md border border-border bg-card p-2 text-xs",
        className
      )}
    >
      <p className="font-medium text-foreground truncate">{title}</p>
      {children}
    </div>
  );
}
