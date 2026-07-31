import { cn } from "@/lib/utils";

/**
 * Botão do sistema Aeline MF.
 *
 * - `primary` / `dark` / `light`: pílula sólida com o label rolando no hover.
 * - `glass`: só sobre o hero — fundo translúcido com blur.
 * - `arrow`: pílula com círculo de 40px à direita; no hover o botão se pinta
 *   a partir da seta (ver .btn-arrow no index.css) e a seta troca na diagonal.
 */

const variants = {
  primary: "btn-primary",
  dark: "btn-dark",
  /** Pílula branca — para uso sobre painel azul ou preto. */
  light: "btn-light",
  glass: "btn-glass",
  arrow: "btn-arrow",
} as const;

type RollButtonProps = {
  label: string;
  href?: string;
  external?: boolean;
  download?: string;
  onClick?: () => void;
  variant?: keyof typeof variants;
  className?: string;
};

/** Seta diagonal ↗ desenhada à mão: haste até o canto e cabeça em L. */
function DiagonalArrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.2 11.8 11.8 4.2" />
      <path d="M5.4 4.2h6.4v6.4" />
    </svg>
  );
}

export default function RollButton({
  label,
  href,
  external = false,
  download,
  onClick,
  variant = "primary",
  className,
}: RollButtonProps) {
  const classes = cn("btn group", variants[variant], className);

  const content = (
    <>
      {/* Duas cópias do label empilhadas: a de cima sai, a de baixo entra. */}
      <span className="btn-roll">
        <span>
          <span>{label}</span>
          <span aria-hidden="true">{label}</span>
        </span>
      </span>

      {variant === "arrow" && (
        <span className="btn-circle" aria-hidden="true">
          <span className="btn-swap">
            <DiagonalArrow />
            <DiagonalArrow />
          </span>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        download={download}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
