"use client";

import { useState } from "react";
import { icons } from "@/lib/icons";

export type FaqItem = { question: string; answer: string };

/** Accordion for the landing page. One answer is open at a time. The first is open to start, as in the design. */
export function Faq({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const ChevronDown = icons.chevronDown;
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={item.question} className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`faq-${i}`}
                id={`faq-button-${i}`}
                onClick={() => setOpen(expanded ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left text-headline-sm text-on-surface"
              >
                <span>{item.question}</span>
                <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-on-surface-variant transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              </button>
            </h3>
            <div id={`faq-${i}`} role="region" aria-labelledby={`faq-button-${i}`} hidden={!expanded} className="px-6 pb-6 text-body-sm leading-relaxed text-on-surface-variant">
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
