import { cn } from "@/lib/utils";
import { getOrderTrackState } from "@/lib/orderTracking";

export default function OrderTracker({ status }) {
  const { steps, canceled } = getOrderTrackState(status);

  return (
    <ol className="flex items-start justify-between gap-2">
      {steps.map((step, index) => {
        const done = step.complete || step.active;
        const isLast = index === steps.length - 1;
        const lastCanceled = isLast && canceled;
        return (
          <li key={step.id} className="flex flex-1 items-start">
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold",
                  lastCanceled && step.active && "border-error bg-error text-white",
                  !lastCanceled && step.complete && "border-brand-accent bg-brand-accent text-white",
                  !lastCanceled && step.active && !step.complete && "border-brand-primary bg-brand-primary text-white",
                  !step.complete && !step.active && "border-neutral-300 bg-white text-neutral-400",
                  step.skipped && "border-dashed"
                )}
              >
                {step.complete ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "mt-2 text-xs font-bold sm:text-sm",
                  lastCanceled && step.active && "text-error",
                  !lastCanceled && done && "text-brand-primary",
                  !done && "text-neutral-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span
                className={cn(
                  "mt-5 h-0.5 min-w-6 flex-1 rounded-full",
                  step.complete ? "bg-brand-accent" : "bg-neutral-200"
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
