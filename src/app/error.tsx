"use client";
export default function Err({ reset }: { error: Error; reset: () => void }) { return <div className="grid min-h-[50vh] place-items-center text-center"><div><h1 className="h-display text-4xl text-champagne">Something went wrong</h1><button onClick={reset} className="btn-gold mt-6">Try again</button></div></div>; }
