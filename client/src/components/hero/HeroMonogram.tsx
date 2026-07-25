import { Component, Suspense, lazy, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import {
  MONOGRAM_HEIGHT,
  MONOGRAM_SHAPES,
  MONOGRAM_WIDTH,
  outlineToPath,
} from "./monogramShape";

const MonogramScene = lazy(() => import("./MonogramScene"));

/** Sem WebGL o hero não pode ficar vazio: cai pro monograma chapado. */
class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FlatMonogram() {
  return (
    <svg
      viewBox={`-0.4 -0.4 ${MONOGRAM_WIDTH + 0.8} ${MONOGRAM_HEIGHT + 0.8}`}
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mf-flat" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#eaf1ff" />
          <stop offset="45%" stopColor="#7ea3f5" />
          <stop offset="100%" stopColor="#0c2afe" />
        </linearGradient>
      </defs>
      <g fill="url(#mf-flat)">
        {MONOGRAM_SHAPES.map((outline, index) => (
          <path key={index} d={outlineToPath(outline)} />
        ))}
      </g>
    </svg>
  );
}

export default function HeroMonogram({
  isDark,
  className,
}: {
  isDark: boolean;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        "relative h-[clamp(170px,26vh,280px)] w-full max-w-[600px]",
        className
      )}
    >
      {/* halo por trás da peça — separa o metal do fundo sem lavar os reflexos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
      />
      <div className="hero-monogram-in relative h-full w-full">
        <SceneBoundary fallback={<FlatMonogram />}>
          <Suspense fallback={null}>
            <MonogramScene isDark={isDark} reduced={reduced} />
          </Suspense>
        </SceneBoundary>
      </div>
    </div>
  );
}
