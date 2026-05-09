// =============================================================================
// Username-only auth helpers.
//
// Supabase Auth requires an email at the auth.users level — there's no
// signUp({ username }) primitive. We work around that with the synthetic-
// email pattern: every user picks a username, and we tag a noreply address
// onto their auth row. Nothing is ever sent to that address; the domain
// has no MX record. The user never types or sees an email anywhere.
// =============================================================================

export const USERNAME_REGEX = /^[a-z0-9_.-]{3,32}$/;
export const USERNAME_HINT  = "3–32 chars: lowercase letters, digits, dot, dash, underscore.";

const SYNTHETIC_DOMAIN = "noreply.hantavirustrack.org";

export function isValidUsername(raw: string): boolean {
  return USERNAME_REGEX.test(raw);
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${SYNTHETIC_DOMAIN}`;
}

export function isSyntheticEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(`@${SYNTHETIC_DOMAIN}`);
}

/** Recover the username from a synthetic email. Returns the original string
 *  unchanged for legacy real-email accounts (so callers can display either). */
export function emailToUsername(email: string): string {
  if (!isSyntheticEmail(email)) return email;
  return email.slice(0, -1 - SYNTHETIC_DOMAIN.length);
}
