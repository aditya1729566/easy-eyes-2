import type { Metadata } from 'next';
import { Barlow_Condensed, Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';
import { SiteHeader, SiteFooter } from '@/components/chrome';
import { site } from '@/config/site';
const display=Barlow_Condensed({subsets:['latin'],variable:'--font-display',weight:['500','600','700','800']});
const accent=Cormorant_Garamond({subsets:['latin'],variable:'--font-accent',weight:['500','600'],style:['normal','italic']});
const ui=Manrope({subsets:['latin'],variable:'--font-ui'});
export const metadata:Metadata={metadataBase:new URL(site.origin),title:{default:'Easy Eyes — Eyewear with attitude',template:'%s | Easy Eyes'},description:'Independent eyewear for the ones who never look away.',robots:{index:process.env.NEXT_PUBLIC_SITE_READY==='true',follow:process.env.NEXT_PUBLIC_SITE_READY==='true'},openGraph:{type:'website',siteName:'Easy Eyes',title:'Easy Eyes — Eyewear with attitude',description:'Independent eyewear for the ones who never look away.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${display.variable} ${accent.variable} ${ui.variable}`}><SiteHeader/><main id="main">{children}</main><SiteFooter/></body></html>}
