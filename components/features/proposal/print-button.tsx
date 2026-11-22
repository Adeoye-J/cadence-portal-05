"use client";

/** Opens the browser's print dialog, where the page can be printed or saved as PDF. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-body-sm-medium text-on-primary shadow-sm hover:bg-primary-container print:hidden"
    >
      Print or save as PDF
    </button>
  );
}
