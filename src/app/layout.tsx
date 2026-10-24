import type { Metadata } from 'next';
import { Manrope, Syne } from 'next/font/google';
import './globals.css';
import { SiteHeader, SiteFooter } from '@/components/chrome';
import { site } from '@/config/site';
const display=Syne({subsets:['latin'],variable:'--font-display',weight:['500','600','700','800']});
const ui=Manrope({subsets:['latin'],variable:'--font-ui'});
export const metadata:Metadata={metadataBase:new URL(site.origin),title:{default:'Easy Eyes — A different point of view',template:'%s | Easy Eyes'},description:'Independent eyewear for a different point of view.',robots:{index:process.env.NEXT_PUBLIC_SITE_READY==='true',follow:process.env.NEXT_PUBLIC_SITE_READY==='true'},openGraph:{type:'website',siteName:'Easy Eyes',title:'Easy Eyes — A different point of view',description:'Independent eyewear for a different point of view.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${display.variable} ${ui.variable}`}><SiteHeader/><main id="main">{children}</main><SiteFooter/></body></html>}
