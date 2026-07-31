import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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

/**
 * Espera o navegador ficar ocioso antes de buscar o chunk do three.js
 * (~950 kB): parseá-lo junto com a primeira pintura era o que segurava a
 * abertura do site no celular. Até lá (e enquanto o chunk baixa) o monograma
 * SVG ocupa o lugar — o hero nunca fica vazio.
 *
 * Em tela de toque o chunk nunca é buscado. O hero agora divide a GPU com o
 * anel 3D, e canvas WebGL mais anel é exatamente a disputa que travava o
 * celular. O `FlatMonogram` é vetorial, então o monograma continua lá — só
 * não em WebGL.
 */
function useIdleReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 1500,
      });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  return ready;
}

export default function HeroMonogram({ isDark }: { isDark: boolean }) {
  const reduced = usePrefersReducedMotion();
  const sceneReady = useIdleReady();

  return (
    <div className="relative h-[clamp(170px,26vh,280px)] w-full max-w-[600px]">
      {/* halo por trás da peça — separa o metal do céu sem lavar os reflexos */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl",
          isDark ? "bg-[#2f5bff]/30" : "bg-white/30"
        )}
      />
      <div className="hero-monogram-in relative h-full w-full">
        <SceneBoundary fallback={<FlatMonogram />}>
          {sceneReady ? (
            <Suspense fallback={<FlatMonogram />}>
              <MonogramScene isDark={isDark} reduced={reduced} />
            </Suspense>
          ) : (
            <FlatMonogram />
          )}
        </SceneBoundary>
      </div>
    </div>
  );
}
