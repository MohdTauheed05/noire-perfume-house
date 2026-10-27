import Link from "next/link";
import HeroClient from "@/components/HeroClient";
import { Section } from "@/components/Grid";
import { featuredBrands, getSettings, homepage, listProducts } from "@/lib/queries";

const CAT: Record<string, [string, string]> = {
  men: ["Men's Perfumes", "men"], women: ["Women's Perfumes", "women"], unisex: ["Unisex Fragrances", "unisex"], oud: ["Oud & Oriental", "oud-oriental"],
  floral: ["Floral Fragrances", "floral"], woody: ["Woody Fragrances", "woody"], fresh: ["Fresh & Citrus", "fresh-citrus"],
  "best-sellers": ["Best Sellers", "best-sellers"], "new-arrivals": ["New Arrivals", "new-arrivals"], "gift-sets": ["Gift Sets", "gift-sets"],
};
const audiences = [
  { number: "01", title: "For him", href: "/categories/men" },
  { number: "02", title: "For her", href: "/categories/women" },
  { number: "03", title: "Unisex", href: "/categories/unisex" },
];

export default async function Home() {
  const [st, secs, brands] = await Promise.all([getSettings(), homepage(), featuredBrands()]);
  const blocks = await Promise.all(secs.filter((x) => x.visible).map(async (sec) => {
    if (sec.type === "hero") return (
      <section key={sec.id} className="home-hero relative isolate overflow-hidden">
        <div aria-hidden="true" className="home-hero-glow" />
        <div className="relative mx-auto grid min-h-[650px] w-full max-w-[1440px] items-center gap-2 px-5 py-10 sm:px-8 lg:min-h-[700px] lg:grid-cols-[1fr_0.95fr] lg:px-16">
          <div className="z-10 max-w-2xl py-8 lg:py-16">
            <p className="home-eyebrow"><span /> The fragrance edit</p>
            <h1 className="h-display mt-7 max-w-[12ch] text-6xl leading-[0.94] tracking-[-0.035em] text-[#f5ead5] sm:text-7xl lg:text-[6.25rem]">{st.heroHeadline}</h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#d4c9b8]/75 sm:text-lg">{st.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href={st.heroCta1Href ?? "/shop"} className="home-button home-button-primary">{st.heroCta1Label ?? "SHOP ALL FRAGRANCES"}<span aria-hidden="true">↗</span></Link><Link href={st.heroCta2Href ?? "/brands"} className="home-button home-button-quiet">{st.heroCta2Label ?? "EXPLORE BRANDS"}</Link></div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-5 text-[10px] uppercase tracking-[0.18em] text-[#dfd1bb]/65 sm:text-[11px]"><span>Iconic fragrance houses</span><span>For every mood</span><span>Find your signature</span></div>
          </div>
          <div className="home-hero-product relative mx-auto h-[390px] w-full max-w-[560px] sm:h-[500px] lg:h-[620px]">
            <div aria-hidden="true" className="home-hero-orbit" />
            <div className="relative z-10 h-full"><HeroClient /></div>
            <p className="home-hero-caption">A scent that stays with you</p>
          </div>
        </div>
        <nav aria-label="Shop by audience" className="home-category-bar relative z-10 mx-auto grid max-w-[1440px] grid-cols-3 border-t border-white/10 px-5 sm:px-8 lg:px-16">
          {audiences.map(({ number, title, href }) => <Link key={href} href={href} className="group flex items-center justify-between border-r border-white/10 py-5 pr-3 text-sm text-[#f1e6d3]/80 transition hover:text-[#e4bd73] sm:py-6 sm:text-base"><span><small className="mr-2 text-[9px] tracking-widest text-[#c5a56b]/70 sm:mr-4">{number}</small>{title}</span><span aria-hidden="true" className="mr-3 transition group-hover:translate-x-1">↗</span></Link>)}
        </nav>
      </section>
    );
    if (sec.type === "featured-brands") return (
      <section key={sec.id} className="home-houses mx-auto max-w-[1440px] px-5 pt-16 sm:px-8 lg:px-16 lg:pt-24"><div className="home-section-heading"><div><p className="home-kicker">Explore the houses</p><h2 className="h-display mt-2 text-4xl text-[#f0e5d2] sm:text-5xl">Fragrance, by house</h2></div><Link href="/brands" className="home-text-link">All houses <span aria-hidden="true">↗</span></Link></div>
        <div className="home-house-grid mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{brands.map((b, i) => <Link key={b.id} href={`/brands/${b.slug}`} className="home-house-card"><span className="home-house-index">{String(i + 1).padStart(2, "0")}</span><span>{b.name}</span><span aria-hidden="true" className="home-house-arrow">↗</span></Link>)}</div></section>
    );
    if (sec.type === "editorial") return (
      <section key={sec.id} className="home-editorial mx-5 mt-20 px-6 py-14 text-center sm:mx-8 sm:px-12 lg:mx-auto lg:mt-28 lg:max-w-7xl lg:py-20"><p className="home-kicker">A little more personal</p><h2 className="h-display mx-auto mt-3 max-w-3xl text-4xl text-[#f0e5d2] sm:text-5xl">{sec.title && sec.title !== "editorial" ? sec.title : "The art of finding your scent"}</h2>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#e2d7c5]/70">{sec.content ?? "Every fragrance tells a story. Find the one that feels like yours."}</p><Link href="/shop" className="home-text-link mt-7">Explore the collection <span aria-hidden="true">↗</span></Link></section>
    );
    const c = CAT[sec.type];
    if (!c) return null;
    const { items } = await listProducts({}, c[1]);
    return <Section key={sec.id} title={sec.title && sec.title !== sec.type ? sec.title : c[0]} href={`/categories/${c[1]}`} items={items.slice(0, 4)} />;
  }));

  return <div className="home-page">
    {blocks}
    <section className="home-discover mx-auto mt-20 max-w-[1440px] px-5 sm:px-8 lg:mt-28 lg:px-16">
      <div className="home-discover-panel grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-14">
        <div><p className="home-kicker">Your next favourite is waiting</p><h2 className="h-display mt-3 max-w-xl text-4xl leading-tight text-[#211b17] sm:text-5xl">A fragrance for every version of you.</h2></div>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-sm leading-6 text-[#211b17]/70">Explore the collection by mood, fragrance family, or the houses you already love.</p><Link href="/shop" className="home-button home-button-dark">Find your fragrance <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>
  </div>;
}
