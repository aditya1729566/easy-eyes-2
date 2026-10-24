export const site = {
  name: 'Easy Eyes',
  currency: 'INR',
  locale: 'en-IN',
  origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  supportEmail: process.env.STORE_SUPPORT_EMAIL || '',
};
export const money = (minor: number) => new Intl.NumberFormat(site.locale, { style: 'currency', currency: site.currency, maximumFractionDigits: 0 }).format(minor / 100);
