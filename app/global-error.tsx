"use client";

/**
 * Last-resort boundary, used when the root layout itself fails. It replaces the whole document, so it
 * carries its own minimal styles and no design-system components.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f7f6f2", color: "#13181f" }}>
        <main style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Cadence could not load</h1>
          <p style={{ fontSize: 16, lineHeight: "24px", color: "#5b6370", margin: 0 }}>Try again in a moment.</p>
          <button type="button" onClick={reset} style={{ alignSelf: "flex-start", minHeight: 44, padding: "0 20px", borderRadius: 10, border: "1px solid #e4e2dc", background: "#ffffff", color: "#13181f", fontSize: 14, fontWeight: 500 }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
