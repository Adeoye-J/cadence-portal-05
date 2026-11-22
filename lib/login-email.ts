/**
 * The address a sign-in link was just sent to. Kept in an httpOnly cookie for 15 minutes, so the
 * "check your inbox" page can show it without putting the address in a URL.
 */
export const LOGIN_EMAIL_COOKIE = "cadence-login-email";
export const LOGIN_EMAIL_MAX_AGE_SEC = 15 * 60;
