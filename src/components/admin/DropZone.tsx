"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Uploads one file per request (Vercel rejects request bodies over ~4.5 MB), sequentially, with overall progress. */
export function DropZone({ productId, mode = "add", label = "Drag images here or click to choose" }: { productId?: string; mode?: "add" | "replaceMain"; label?: string }) {
  const [pct, setPct] = useState<number | null>(null); const [msg, setMsg] = useState(""); const input = useRef<HTMLInputElement>(null); const router = useRouter();

  function sendOne(file: File, m: "add" | "replaceMain", onProgress: (fraction: number) => void) {
    return new Promise<{ ok: boolean; text: string }>((resolve) => {
      const fd = new FormData(); fd.append("files", file); if (productId) fd.set("productId", productId); fd.set("mode", m);
      const x = new XMLHttpRequest(); x.open("POST", "/api/admin/upload");
      x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      x.onload = () => {
        try { const r = JSON.parse(x.responseText); resolve(x.status === 200 && !r.errors?.length ? { ok: true, text: "" } : { ok: false, text: r.error ?? r.errors?.join("; ") ?? "Upload failed" }); }
        catch { resolve({ ok: false, text: `${file.name}: upload failed (${x.status})` }); }
      };
      x.onerror = () => resolve({ ok: false, text: `${file.name}: network error` });
      x.send(fd);
    });
  }

  async function send(files: FileList | File[]) {
    const list = Array.from(files); if (!list.length) return;
    setPct(0); setMsg(""); let done = 0; const problems: string[] = [];
    for (const [i, f] of list.entries()) {
      // "replace main" only ever applies to the first file; any extra files are added to the gallery
      const r = await sendOne(f, mode === "replaceMain" && i === 0 ? "replaceMain" : "add", (fr) => setPct(Math.round(((i + fr) / list.length) * 100)));
      if (r.ok) done++; else problems.push(r.text);
    }
    setPct(null); setMsg(`${done} of ${list.length} uploaded${problems.length ? ` · ${problems.join("; ")}` : ""}`); router.refresh();
  }
  return (<div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
    className="rounded border border-dashed border-gold/50 p-6 text-center text-sm"><button type="button" onClick={() => input.current?.click()} className="text-champagne underline">{label}</button>
    <input ref={input} type="file" multiple={mode === "add"} accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose images" onChange={(e) => e.target.files && send(e.target.files)} />
    <p className="mt-1 text-xs text-white/40">JPG, PNG or WebP · max 4 MB each</p>
    {pct !== null && <div role="progressbar" aria-valuenow={pct} className="mx-auto mt-3 h-2 max-w-xs bg-white/10"><div className="h-2 bg-gold" style={{ width: `${pct}%` }} /></div>}
    {msg && <p role="status" className="mt-2 text-xs text-gold">{msg}</p>}</div>);
}
