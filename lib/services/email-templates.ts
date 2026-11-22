/** Pure template functions. No I/O, so they can be unit tested. */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function magicLinkEmail(url: string): { subject: string; text: string; html: string } {
  const safeUrl = escapeHtml(url);
  return {
    subject: "Your Cadence sign-in link",
    text: `Use this link to sign in to Cadence. It expires in 15 minutes and works once.\n\n${url}\n\nIf you did not ask for this, ignore this email.`,
    html: `<!doctype html><html lang="en"><body style="margin:0;background:#f7f6f2;font-family:Inter,Arial,sans-serif;color:#13181f"><div style="max-width:520px;margin:0 auto;padding:32px 24px"><p style="font-size:12px;color:#5b6370;margin:0 0 8px">Cadence</p><h1 style="font-size:22px;font-weight:600;margin:0 0 12px">Sign in to Cadence</h1><p style="font-size:16px;line-height:24px;margin:0 0 24px">This link signs you in and expires in 15 minutes. It works once.</p><a href="${safeUrl}" style="display:inline-block;background:#0e5a4f;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 20px;font-weight:500">Sign in</a><p style="font-size:14px;line-height:20px;color:#5b6370;margin:24px 0 0">If you did not ask for this, you can ignore this email.</p></div></body></html>`,
  };
}

export function invitationEmail(input: { url: string; projectTitle: string; studioName: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const url = escapeHtml(input.url);
  const project = escapeHtml(input.projectTitle);
  const studio = escapeHtml(input.studioName);
  return {
    subject: `${input.studioName} invited you to review ${input.projectTitle}`,
    text: `${input.studioName} has invited you to review the scope and milestones for "${input.projectTitle}" on Cadence.\n\nOpen this link and sign in with this email address. The link works until it is used or 14 days pass.\n\n${input.url}\n\nIf you were not expecting this, ignore this email.`,
    html: `<!doctype html><html lang="en"><body style="margin:0;background:#f7f6f2;font-family:Inter,Arial,sans-serif;color:#13181f"><div style="max-width:520px;margin:0 auto;padding:32px 24px"><p style="font-size:12px;color:#5b6370;margin:0 0 8px">Cadence</p><h1 style="font-size:22px;font-weight:600;margin:0 0 12px">Review ${project}</h1><p style="font-size:16px;line-height:24px;margin:0 0 24px">${studio} has invited you to review the scope and milestones. Sign in with this email address to continue.</p><a href="${url}" style="display:inline-block;background:#0e5a4f;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 20px;font-weight:500">Review the project</a><p style="font-size:14px;line-height:20px;color:#5b6370;margin:24px 0 0">The link works until it is used or 14 days pass. If you were not expecting this, ignore this email.</p></div></body></html>`,
  };
}
