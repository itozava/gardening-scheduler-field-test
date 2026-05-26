import React from "react";

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50";

const variantClasses = {
  default: "",
  outline: "border bg-transparent",
};

const sizeClasses = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
};

export function Button({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${
        sizeClasses[size] || sizeClasses.default
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
