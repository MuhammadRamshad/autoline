import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-white">
          Autoline
        </h1>

        <Link
          href="/shop"
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-sm font-mono font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
        >
          <span>Vehicle Entry</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
