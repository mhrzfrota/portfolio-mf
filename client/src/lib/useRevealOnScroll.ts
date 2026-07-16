import { useEffect } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Revela com fade-up os elementos marcados com `data-reveal` conforme entram
 * na viewport (ou já ao carregar, se estiverem acima da dobra). Um único
 * IntersectionObserver cobre a página inteira; cada elemento é observado só
 * até aparecer, então o custo em runtime é praticamente zero.
 */
export function useRevealOnScroll(deps: readonly unknown[] = []) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // Com movimento reduzido nada anima, mas o conteúdo não pode ficar oculto.
    if (reduced) {
      document
        .querySelectorAll("[data-reveal]")
        .forEach(el => el.classList.add("is-revealed"));
      return;
    }

    const targets = document.querySelectorAll(
      "[data-reveal]:not(.is-revealed)"
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      // Dispara quando o topo do bloco passa 60px acima da borda inferior:
      // a seção já está de fato à vista, mas a animação ainda acompanha o scroll.
      { rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [reduced, ...deps]);
}
