import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "SEANCE — Let the highest whisper", description: "A confidential auction house built on Tari Ootle." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
