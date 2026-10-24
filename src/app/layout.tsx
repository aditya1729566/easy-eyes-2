import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';
import { SiteHeader, SiteFooter } from '@/components/chrome';
import { site } from '@/config/site';
const display=Cormorant_Garamond({subsets:['latin'],variable:'--font-display',weight:['400','500','600']});
const ui=Manrope({subsets:['latin'],variable:'--font-ui'});
export const metadata:Metadata={metadataBase:new URL(site.origin),title:{default:'Easy Eyes — Eyewear in focus',template:'%s | Easy Eyes'},description:'An independent eyewear studio. Considered frames and a quieter way of seeing.',robots:{index:process.env.NEXT_PUBLIC_SITE_READY==='true',follow:process.env.NEXT_PUBLIC_SITE_READY==='true'},openGraph:{type:'website',siteName:'Easy Eyes',title:'Easy Eyes — Eyewear in focus',description:'An independent eyewear studio. Considered frames and a quieter way of seeing.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${display.variable} ${ui.variable}`}><SiteHeader/><main id="main">{children}</main><SiteFooter/></body></html>}
