import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variantClass = variant === "secondary" ? "button-secondary" : "";

  return <button className={`button ${variantClass} ${className}`.trim()} {...props} />;
}
