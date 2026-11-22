import { describe, expect, it } from "vitest";
import { escapeHtml, magicLinkEmail } from "@/lib/services/email-templates";

describe("escapeHtml", () => {
  it("escapes the characters that can break out of an attribute or tag", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  });
});

describe("magicLinkEmail", () => {
  it("puts the link in both the text and HTML versions", () => {
    const url = "https://app.example.com/api/auth/magic-link/verify?token=abc123";
    const email = magicLinkEmail(url);
    expect(email.text).toContain(url);
    expect(email.html).toContain("https://app.example.com/api/auth/magic-link/verify?token=abc123");
    expect(email.subject).toBe("Your Cadence sign-in link");
  });

  it("escapes a hostile URL inside the HTML", () => {
    const email = magicLinkEmail(`https://x.example/?q="><script>`);
    expect(email.html).not.toContain("<script>");
  });
});
