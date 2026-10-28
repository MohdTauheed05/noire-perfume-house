import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const st = await getSettings();
  return { title: { default: st.storeName ?? "NOIRÉ PERFUME HOUSE", template: `%s | ${st.storeName ?? "NOIRÉ PERFUME HOUSE"}` },
    description: st.heroSubtitle, metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"), openGraph: { type: "website", title: st.storeName } };
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const st = await getSettings();
  return (<html lang="en"><body>
    <CartProvider><Header /><main id="main" className="min-h-[60vh]">{children}</main>
      <Footer name={st.storeName ?? "NOIRÉ PERFUME HOUSE"} contactEmail={st.contactEmail} contactPhone={st.contactPhone} />
    </CartProvider>
  </body></html>);
}
