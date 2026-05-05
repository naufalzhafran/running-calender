function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("SITE_URL is empty");
  }

  return new URL(trimmed).origin;
}

export function getSiteUrl() {
  const configured =
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  if (!configured.trim()) {
    throw new Error("SITE_URL or NEXT_PUBLIC_SITE_URL must be configured");
  }

  return normalizeSiteUrl(configured);
}

export function buildAbsoluteSiteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}
