import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { icons } from "@/lib/icons";

/**
 * Page template header (brief section 6): eyebrow, title, description,
 * optional back link, and a primary action area.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  back,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  back?: { href: Route; label: string };
  actions?: ReactNode;
}) {
  const BackIcon = icons.back;
  return (
    <header className="flex flex-col gap-4">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-control text-body-sm text-ink-muted hover:text-ink"
        >
          <BackIcon size={16} aria-hidden="true" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? <p className="tnum text-label-md text-ink-muted">{eyebrow}</p> : null}
          <h1 className="text-headline-lg text-ink sm:text-headline-xl">{title}</h1>
          {description ? <p className="text-body-lg text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
