"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Input({
  label,
  id,
  className,
  inputClassName,
  error,
  type = "text",
  ...props
}) {
  const inputId = id || props.name;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
            isPassword && "pr-12",
            error && "border-error focus:border-error focus:ring-error/20",
            inputClassName
          )}
          {...props}
          type={inputType}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-0 z-10 inline-flex w-11 items-center justify-center text-brand-primary hover:text-brand-primary-dark"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        ) : null}
      </div>
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
}
