"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Filters } from "@/lib/queries";

type Props = {
  f: Filters;
  path: string;
  forceCategory?: string;
  forceBrand?: string;
  brands: [string, string][];
  categories: [string, string][];
  families: [string, string][];
  concentrations: [string, string][];
};

export function CatalogFilters({ f, path, forceCategory, forceBrand, brands, categories, families, concentrations }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.entries(f).filter(([key, value]) => key !== "page" && Boolean(value)).length;

  const Sel = ({ name, label, opts }: { name: keyof Filters; label: string; opts: [string, string][] }) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={f[name] ?? ""} className="input">
        <option value="">All</option>
        {opts.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );

  return (
    <aside className="space-y-3">
      <button
        type="button"
        className="btn-ghost flex w-full items-center justify-between lg:hidden"
        aria-expanded={open}
        aria-controls="catalog-filter-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex items-center gap-2">
          Filters
          {activeCount > 0 && <span className="text-xs normal-case tracking-normal text-white/60">{activeCount} applied</span>}
        </span>
        <ChevronDown aria-hidden="true" size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div id="catalog-filter-panel" className={`${open ? "block" : "hidden"} lg:block`}>
        <form method="get" action={path} className="card h-fit space-y-4 p-4" aria-label="Filters">
          <div><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={f.q} className="input" placeholder="Name, brand, note" /></div>
          {!forceBrand && <Sel name="brand" label="Brand" opts={brands} />}
          {!forceCategory && <Sel name="category" label="Category" opts={categories} />}
          <Sel name="audience" label="Audience" opts={[["men", "Men"], ["women", "Women"], ["unisex", "Unisex"]]} />
          <Sel name="family" label="Fragrance family" opts={families} />
          <Sel name="conc" label="Concentration" opts={concentrations} />
          <Sel name="size" label="Size" opts={[["50", "50 ml"], ["100", "100 ml"]]} />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label" htmlFor="min">Min AED</label><input id="min" name="min" type="number" min="0" defaultValue={f.min} className="input" /></div>
            <div><label className="label" htmlFor="max">Max AED</label><input id="max" name="max" type="number" min="0" defaultValue={f.max} className="input" /></div>
          </div>
          <Sel name="stock" label="Availability" opts={[["in", "In stock only"]]} />
          <Sel name="sort" label="Sort by" opts={[["newest", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["name", "Name A–Z"]]} />
          <button className="btn-gold w-full">Apply</button>
          <Link href={path} className="block text-center text-xs text-white/50 hover:text-gold">Reset</Link>
        </form>
      </div>
    </aside>
  );
}
