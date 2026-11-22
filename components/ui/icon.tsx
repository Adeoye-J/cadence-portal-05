import { cn } from "@/lib/cn";
import { icons } from "@/lib/icons";

export type IconName = keyof typeof icons;

/** Renders a semantic icon from lib/icons. Decorative by default; put a label on the control, not the icon. */
export function Ico({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const Icon = icons[name];
  return <Icon size={size} className={cn(className)} aria-hidden="true" />;
}
