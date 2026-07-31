import { useEffect, useState } from "react";

const SIZE = 168;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Anel da nota geral: trilha em azul claro (mesma rampa) e preenchimento na
 * cor de ação, animado por stroke-dashoffset ao montar.
 */
export default function ScoreRing({
  value,
  caption,
}: {
  value: number;
  caption: string;
}) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setFilled(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const offset = filled ? CIRCUMFERENCE * (1 - value / 100) : CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative text-primary"
        role="img"
        aria-label={`Nota geral: ${value} de 100`}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.14}
            strokeWidth={STROKE}
          />
          <circle
            className="diag-ring"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[52px] font-semibold leading-none tracking-tight text-foreground">
            {value}
          </span>
          <span className="mt-1 text-[12px] font-medium text-muted-foreground">
            de 100
          </span>
        </div>
      </div>
      <span className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-foreground">
        {caption}
      </span>
    </div>
  );
}
