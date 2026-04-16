/**
 * Returns the canonical origin URL to use for auth email redirects.
 * Always prefers the production domain over preview/sandbox URLs to avoid
 * confirmation emails pointing to ephemeral or wrong hosts.
 */
const PRODUCTION_ORIGIN = "https://unigates.online";

export function getAuthRedirectOrigin(): string {
  if (typeof window === "undefined") return PRODUCTION_ORIGIN;

  const host = window.location.hostname;

  // Use production domain for any non-local environment
  // (preview URLs like *.lovableproject.com or *.lovable.app should NOT be used
  // because confirmation links would be invalid for end users)
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local");

  if (isLocal) return window.location.origin;

  return PRODUCTION_ORIGIN;
}

export function getAuthCallbackUrl(path: string = "/auth/callback"): string {
  return `${getAuthRedirectOrigin()}${path}`;
}
