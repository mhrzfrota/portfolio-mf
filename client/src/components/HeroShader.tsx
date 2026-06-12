import { Component, Suspense, lazy, type ReactNode } from "react";

const HeroShaderStack = lazy(() => import("./HeroShaderStack"));

// Se WebGPU/WebGL não estiver disponível, o hero mantém o fundo estático.
class ShaderErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroShader({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
    >
      <ShaderErrorBoundary>
        <Suspense fallback={null}>
          <HeroShaderStack isDark={isDark} />
        </Suspense>
      </ShaderErrorBoundary>
    </div>
  );
}
