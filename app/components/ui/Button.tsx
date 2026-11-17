import type { ComponentProps } from "react";
import { Link } from "react-router";

/**
 * Button: the one way to render an action.
 *
 * Variants
 * - filled:   the main action in a section (Search, Jump to transcript). Use one per group.
 * - outlined: secondary actions (Filters, pagination, load more, external source links).
 * - text:     quiet inline actions that sit inside content.
 *
 * Sizes: sm (28px) for detail pages and dense rows, md (32px) for toolbars.
 *
 * States come built in: hover, pressed (active), keyboard focus (global
 * :focus-visible ring) and disabled. Colours come from the role tokens in
 * app.css, so the same component works in light and dark mode.
 *
 * Use Button for actions, ButtonLink for navigation that should look like a
 * button, and buttonClasses() to style any other element (e.g. an external <a>).
 */

export type ButtonVariant = "filled" | "outlined" | "text";
export type ButtonSize = "sm" | "md";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the container */
  fullWidth?: boolean;
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-control border font-medium " +
  "whitespace-nowrap cursor-pointer transition-colors " +
  "disabled:cursor-not-allowed aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  filled:
    "border-transparent bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-pressed " +
    "disabled:bg-surface disabled:text-muted disabled:border-border",
  outlined:
    "border-border bg-surface text-text hover:bg-accent-subtle hover:border-accent hover:text-accent " +
    "active:bg-accent-subtle-pressed disabled:bg-surface disabled:text-muted disabled:border-border",
  text:
    "border-transparent bg-transparent text-accent hover:bg-accent-subtle " +
    "active:bg-accent-subtle-pressed disabled:bg-transparent disabled:text-muted",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-sm",
};

export function buttonClasses({
  variant = "outlined",
  size = "md",
  fullWidth = false,
  className,
}: StyleProps = {}) {
  return [base, variants[variant], sizes[size], fullWidth && "w-full", className]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = StyleProps & Omit<ComponentProps<"button">, "className">;

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = StyleProps & Omit<ComponentProps<typeof Link>, "className">;

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props} />;
}
