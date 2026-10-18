import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  adminFormHintClassName,
  adminFormInputClassName,
  adminFormLabelClassName,
} from "@/components/admin/admin-form-styles";
import { cn } from "cn";

type AdminFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

/**
 * A labelled form field. Labels are set in the reading serif (sentence case),
 * never slab: only capitals are slab, and a field label is a sentence.
 */
export function AdminField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: AdminFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={adminFormLabelClassName}>
          {label}
        </label>
      ) : (
        <span className={adminFormLabelClassName}>{label}</span>
      )}
      {children}
      {hint ? <p className={adminFormHintClassName}>{hint}</p> : null}
    </div>
  );
}

/** A boxed text input: a slightly darker inset in the leaf, hairline-framed. */
export function AdminInput({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(adminFormInputClassName, className)} {...props} />;
}
