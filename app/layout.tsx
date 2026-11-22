import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "../styles/globals.css";
import { cn } from "@/lib/cn";
import { parseThemePreference, THEME_COOKIE } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Cadence", template: "%s · Cadence" },
  description: "Client delivery portal for proposals, sign-off, milestones and payments.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf9f5",
};

/** Applies the device setting before the first paint when the user chose "match device". */
const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )cadence-theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en" className={cn(inter.variable, theme === "dark" && "dark")} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
