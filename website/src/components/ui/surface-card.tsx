import type { HTMLAttributes } from "react";

type SurfaceCardProps = HTMLAttributes<HTMLElement>;

export function SurfaceCard({ className = "", ...props }: SurfaceCardProps) {
  return <article className={`surface-card ${className}`.trim()} {...props} />;
}
