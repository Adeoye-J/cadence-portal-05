import type { Route } from "next";
import type { IconName } from "@/lib/icons";
import type { Role } from "@/lib/authz";

/**
 * One navigation configuration for the studio sidebar, the mobile strip and the public header.
 * Add an item only when its route exists. A link to a page that is not built is a dead interaction.
 */
export type NavItem = {
  label: string;
  href: Route;
  icon: IconName;
  /** Roles that see this item. Omit to show it to every member. */
  roles?: Role[];
};

export const studioNav: readonly NavItem[] = [
  { label: "Projects", href: "/studio/projects", icon: "dashboard" },
  { label: "Clients", href: "/studio/clients", icon: "people" },
  { label: "Payments", href: "/studio/payments", icon: "payments", roles: ["owner", "admin"] },
  { label: "Team", href: "/studio/settings/team", icon: "roles" },
  { label: "Billing", href: "/studio/billing", icon: "receipt", roles: ["owner"] },
  { label: "Account", href: "/account", icon: "account" },
];

/** The studio items this role may open. Used by the sidebar, so no member sees a link they cannot follow. */
export function studioNavFor(role: Role): readonly NavItem[] {
  return studioNav.filter((item) => !item.roles || item.roles.includes(role));
}

export const publicNav: readonly { label: string; href: Route }[] = [
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
];

export const legalNav: readonly { label: string; href: Route }[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
];
