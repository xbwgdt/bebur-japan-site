export const approvedContact = {
  distributorName: "Bebur 日本総代理店",
  companyName: "新樹産業株式会社",
  postalCode: "340-0043",
  address: "埼玉県草加市草加2－13－21－7",
  phone: "080-5189-8663",
  inquiryEmail: "info@newtree-i.com",
} as const;

export const siteConfig = {
  name: "Bebur Japan",
  origin: "https://www.bebur-jp.com",
  company: approvedContact.companyName,
  distributorLabel: `${approvedContact.distributorName}｜${approvedContact.companyName}`,
  postalCode: `〒${approvedContact.postalCode}`,
  address: approvedContact.address,
  phone: approvedContact.phone,
  email: approvedContact.inquiryEmail,
} as const;

export function buildMailto(
  subject: string,
  email: string = siteConfig.email,
): string {
  return `mailto:${email}?subject=${encodeURIComponent(`${subject}のお問い合わせ`)}`;
}
