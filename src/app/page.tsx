import Link from "next/link";
import HeroClient from "@/components/HeroClient";
import { Section } from "@/components/Grid";
import { featuredBrands, getSettings, homepage, listProducts } from "@/lib/queries";

const CAT: Record<string, [string, string]> = {
  men: ["Men's Perfumes", "men"], women: ["Women's Perfumes", "women"], unisex: ["Unisex Fragrances", "unisex"], oud: ["Oud & Oriental", "oud-oriental"],
  floral: ["Floral Fragrances", "floral"], woody: ["Woody Fragrances", "woody"], fresh: ["Fresh & Citrus", "fresh-citrus"],
  "best-sellers": ["Best Sellers", "best-sellers"], "new-arrivals": ["New Arrivals", "new-arrivals"], "gift-sets": ["Gift Sets", "gift-sets"],
};
export default async function Home() {
  const [st, secs, brands] = await Promise.all([getSettings(), homepage(), featuredBrands()]);
  const blocks = await Promise.all(secs.filter((x) => x.visible).map(async (sec) => {
    if (sec.type === "hero") return (
      <section key={sec.id} className="relative grid min-h-[88vh] items-center overflow-hidden bg-[radial-gradient(ellipse_at_70%_40%,#2a2113,#0b0b0c_65%)]">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-4 px-4 md:grid-cols-2">
          <div className="z-10 py-16">
            <p className="text-xs uppercase tracking-[0.4em] text-gold">{st.storeName}</p>
            <h1 className="h-display mt-4 text-5xl leading-[1.05] text-champagne md:text-7xl">{st.heroHeadline}</h1>
            <p className="mt-6 max-w-md text-white/70">{st.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-4"><Link href={st.heroCta1Href ?? "/shop"} className="btn-gold">{st.heroCta1Label ?? "SHOP ALL FRAGRANCES"}</Link><Link href={st.heroCta2Href ?? "/brands"} className="btn-ghost">{st.heroCta2Label ?? "EXPLORE BRANDS"}</Link></div>
          </div>
          <div className="relative h-[420px] md:h-[640px]"><HeroClient /></div>
        </div></section>);
    if (sec.type === "featured-brands") return (
      <section key={sec.id} className="mx-auto max-w-7xl px-4 pt-16"><h2 className="h-display mb-6 text-3xl text-champagne">Featured Houses</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{brands.map((b) => <Link key={b.id} href={`/brands/${b.slug}`} className="card grid h-24 place-items-center text-center text-sm uppercase tracking-[0.25em] hover:border-gold">{b.name}</Link>)}</div></section>);
    if (sec.type === "editorial") return (
      <section key={sec.id} className="mx-auto mt-16 max-w-4xl px-4 text-center"><h2 className="h-display text-4xl text-champagne">{sec.title && sec.title !== "editorial" ? sec.title : "The Art of Scent"}</h2>
        <p className="mt-4 text-white/70">{sec.content ?? "Every fragrance tells a story. Edit this editorial block from the admin homepage editor."}</p></section>);
    const c = CAT[sec.type]; if (!c) return null;
    const { items } = await listProducts({}, c[1]);
    return <Section key={sec.id} title={sec.title && sec.title !== sec.type ? sec.title : c[0]} href={`/categories/${c[1]}`} items={items.slice(0, 4)} />;
  }));
  return <>{blocks}</>;
}
