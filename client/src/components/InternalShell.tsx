import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import InternalAccount from "./InternalAccount";

export default function InternalShell({
  title,
  children,
  home = false,
}: {
  title: string;
  children: ReactNode;
  home?: boolean;
}) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · MF`;
    return () => {
      document.title = previous;
    };
  }, [title]);
  return (
    <div className="board-bg min-h-dvh font-sans text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Link
          href={home ? "/" : "/interno"}
          className="flex items-center gap-3 rounded-lg text-sm text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          <ArrowLeft size={17} />
          <span>{home ? "Portfólio" : "Visão geral"}</span>
        </Link>
        <InternalAccount />
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        <p className="mono-label text-[10px] text-white/60">
          MF Services · interno
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
