import React, { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

/* ---------- Card ---------- */

export interface GridContainerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

export const GridContainerCard = forwardRef<HTMLDivElement, GridContainerCardProps>(
  ({ children, variant = "default", padding = "md", className = "", ...props }, ref) => {
    const variantClasses = {
      default: "bg-white",
      bordered: "bg-white border-2 border-gray-300",
      elevated: "bg-white shadow-lg border border-gray-100",
    };

    const paddingClasses = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg",
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridContainerCard.displayName = "GridContainerCard";

/* ---------- Subcomponents ---------- */

export const GridContainerCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => (
  <div ref={ref} className={cn("mb-0", className)} {...props}>
    {children}
  </div>
));

GridContainerCardHeader.displayName = "GridContainerCardHeader";

export const GridContainerCardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ children, className = "", ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold", className)}
    {...props}
  >
    {children}
  </h3>
));

GridContainerCardTitle.displayName = "GridContainerCardTitle";

export const GridContainerCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props}>
    {children}
  </div>
));

GridContainerCardContent.displayName = "GridContainerCardContent";
