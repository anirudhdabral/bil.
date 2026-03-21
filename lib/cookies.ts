export function setCookie(name: string, value: string, days = 365 * 50) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const domains = new Set<string>(["", hostname]);

  if (parts.length > 1) {
    for (let index = 0; index <= parts.length - 2; index += 1) {
      domains.add(`.${parts.slice(index).join(".")}`);
    }
  }

  domains.forEach((domain) => {
    const domainSegment = domain ? `;domain=${domain}` : "";
    document.cookie = `${name}=;Max-Age=0;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domainSegment};SameSite=Lax`;
  });
}
