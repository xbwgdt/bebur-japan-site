export const siteConfig = {
  name: "Bebur Japan",
  origin: "https://www.bebur-jp.com",
  company: "新樹産業株式会社",
  distributorLabel: "Bebur 日本総代理店｜新樹産業株式会社",
  postalCode: "〒340-0043",
  address: "埼玉県草加市草加2－13－21－7",
  phone: "080-5189-8663",
  email: "info@newtree-i.com",
} as const;

export function buildMailto(subject: string): string {
  return `mailto:${siteConfig.email}?subject=${encodeURIComponent(`${subject}のお問い合わせ`)}`;
}
