import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Button variants follow DESIGN.md "Components > Buttons".
 * Every size keeps a 44px minimum height (WCAG 2.5.5 target size), so "sm" is
 * narrower in type only, not in hit area.
 */
export const buttonVariants = cva(
  "inline-flex min-h-11 min-w-11 cursor-pointer select-none items-center justify-center gap-2 rounded-control font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary-container px-5 text-white hover:bg-primary active:bg-primary",
        secondary: "border border-border bg-surface px-5 text-ink hover:border-ink",
        ghost: "px-5 text-ink hover:bg-border/50",
        destructive: "px-2 text-danger underline-offset-4 hover:underline",
      },
      size: {
        sm: "text-body-sm",
        md: "py-2.5 text-body-sm",
        lg: "py-3 text-body-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner, disables the button, and sets aria-busy. */
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" size={16} className="motion-safe:animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
