import { cn } from "@/lib/utils";

export default function AdminTable({ children, className }) {
  return (
    <div
        className={cn(
          "min-h-0 overflow-x-auto overscroll-contain rounded-2xl border border-border bg-white shadow-sm",
          className
        )}
    >
      {children}
    </div>
  );
}
