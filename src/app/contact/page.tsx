import { getSettings } from "@/lib/queries";

export const metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default async function Page() {
  const settings = await getSettings();
  const phoneHref = settings.contactPhone?.replace(/[^\d+]/g, "");

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="h-display text-4xl text-champagne">Contact</h1>
      <div className="mt-6 space-y-4 text-white/75">
        <p>Questions about a fragrance or an order? Get in touch.</p>
        {settings.contactEmail && <p>Email: <a className="text-champagne hover:text-gold" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></p>}
        {settings.contactPhone && <p>Phone: <a className="text-champagne hover:text-gold" href={`tel:${phoneHref}`}>{settings.contactPhone}</a></p>}
        {!settings.contactEmail && !settings.contactPhone && <p>Our contact details will be listed here soon.</p>}
      </div>
    </article>
  );
}
