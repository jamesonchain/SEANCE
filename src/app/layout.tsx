import type { Metadata } from "next";
import "./globals.css";
import "./live.css";
import "./theme.css";

export const metadata: Metadata = { title: "SEANCE | Let the highest whisper", description: "A confidential auction house built on Tari Ootle." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('seance-theme');var t=s||((matchMedia('(prefers-color-scheme: light)').matches)?'study':'crypt');document.documentElement.dataset.theme=t}catch(e){}})()` }} /></head><body>{children}</body></html>;
}
