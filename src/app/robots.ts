import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

export default function robots():MetadataRoute.Robots {
  const ready=process.env.NEXT_PUBLIC_SITE_READY==='true';
  return {rules:{userAgent:'*',...(ready?{allow:'/'}:{disallow:'/'})},...(ready?{sitemap:`${site.origin}/sitemap.xml`}:{})};
}
