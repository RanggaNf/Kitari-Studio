import Link from "next/link";
import type { ComponentProps } from "react";

type TextLinkProps = ComponentProps<typeof Link>;

export function TextLink({ className = "", ...props }: TextLinkProps) {
  return <Link className={`text-link ${className}`.trim()} {...props} />;
}
