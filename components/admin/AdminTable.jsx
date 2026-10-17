import { cn } from "@/lib/utils";

export default function AdminTable({ children, className }) {
  return (
    <div
      data-admin-table
      className={cn(
        "w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl border border-border bg-white shadow-sm [-webkit-overflow-scrolling:touch]",
        className
      )}
    >
      <div className="w-full min-w-0 [&_table]:w-full [&_th]:whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
