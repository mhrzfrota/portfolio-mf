import {
  ChromaFlow,
  FilmGrain,
  FlutedGlass,
  Shader,
  Swirl,
} from "shaders/react";

export default function HeroShaderStack({ isDark }: { isDark: boolean }) {
  const swirlA = isDark ? "#050A18" : "#ffffff";
  const swirlB = isDark ? "#0B1228" : "#f0f0f0";
  const base = isDark ? "#070D1D" : "#ffffff";
  const accent = isDark ? "#3D5BFF" : "#0C2AFE";

  return (
    <Shader
      key={isDark ? "dark" : "light"}
      className="h-full w-full"
      disableTelemetry
    >
      <Swirl colorA={swirlA} colorB={swirlB} detail={1.7} />
      <ChromaFlow
        baseColor={base}
        downColor={accent}
        leftColor={accent}
        rightColor={accent}
        upColor={accent}
        momentum={13}
        radius={3.5}
      />
      <FlutedGlass
        aberration={0.61}
        angle={31}
        frequency={8}
        highlight={0.12}
        highlightSoftness={0}
        lightAngle={-90}
        refraction={4}
        shape="rounded"
        softness={1}
        speed={0.15}
      />
      <FilmGrain strength={0.05} />
    </Shader>
  );
}
