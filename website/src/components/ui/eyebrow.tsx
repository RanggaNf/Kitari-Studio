import type { HTMLAttributes } from "react";

type EyebrowProps = HTMLAttributes<HTMLSpanElement>;

export function Eyebrow({ className = "", ...props }: EyebrowProps) {
  return <span className={`eyebrow ${className}`.trim()} {...props} />;
}
