"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/features/account/sign-out-button";
import { cn } from "@/lib/cn";
import { icons } from "@/lib/icons";
import { studioNavFor } from "@/lib/nav";
import type { Role } from "@/lib/authz";

/**
 * Studio navigation. Desktop: a fixed 240px column. Phone and tablet: a horizontal strip that scrolls.
 * Only the items this role may open are rendered.
 */
export function StudioSidebar({ studioName, role }: { studioName: string; role: Role }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Studio"
      className="flex flex-col border-b border-border bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r"
    >
      <div className="hidden px-6 pt-6 lg:block">
        <p className="text-label-md text-ink-muted">Studio</p>
        <p className="text-body-sm font-medium text-ink">{studioName}</p>
      </div>
      <ul className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:p-4 lg:pt-6">
        {studioNavFor(role).map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-body-sm",
                  active ? "bg-canvas font-medium text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="hidden px-4 pb-6 lg:mt-auto lg:block">
        <SignOutButton className="w-full" />
      </div>
    </nav>
  );
}
