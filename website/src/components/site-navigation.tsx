import Link from "next/link";
import { Container } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";

export function SiteNavigation() {
  return (
    <header className="border-b border-white/10">
      <Container className="flex min-h-20 items-center justify-between gap-6">
        <Link aria-label="Kitari Studio home" className="text-lg font-medium" href="/">
          Kitari Studio
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6">
          <TextLink href="/styleguide">Styleguide</TextLink>
        </nav>
      </Container>
    </header>
  );
}
