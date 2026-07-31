import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cabeçalho padrão das seções: eyebrow em mono caixa-alta, título e subtítulo.
 *
 * O eyebrow reaproveita o rótulo do menu — o nome da seção é o mesmo nos dois
 * lugares, o que ajuda quem navega a se localizar. A referência numera os
 * eyebrows (01 / 02 / 03); aqui não, porque as seções não formam sequência e o
 * número não codificaria informação nenhuma.
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="max-w-2xl">
        <p data-anim="fade-up" className="eyebrow">
          {eyebrow}
        </p>

        <h2 data-anim="fade-up" data-anim-delay="0.08" className="mt-5">
          {title}
        </h2>

        {subtitle && (
          <p
            data-anim="fade-up"
            data-anim-delay="0.16"
            className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]"
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div data-anim="fade-up" data-anim-delay="0.24" className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
