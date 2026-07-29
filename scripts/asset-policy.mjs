const ALLOWED_HOSTS = new Set(["bebur.net", "www.bebur.net"]);

export function isAllowedFinalImageUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    return (
      url.protocol === "https:" &&
      ALLOWED_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}
