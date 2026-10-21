import Link from "next/link";
import type { ComponentProps } from "react";

type PillLinkProps = ComponentProps<typeof Link>;

export function PillLink({ className = "", ...props }: PillLinkProps) {
  return <Link className={`pill-link ${className}`.trim()} {...props} />;
}
