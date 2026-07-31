import { useEffect } from "react";
import { initAnimations } from "./anim";

/**
 * Monta o sistema `data-anim` na página atual e remonta a cada troca de rota.
 *
 * O `requestAnimationFrame` deixa o React terminar a pintura antes de medirmos
 * posição e largura: sem ele o marquee mede `scrollWidth` zero e o smart
 * trigger lê a posição errada dos blocos.
 */
export function useAnimations(deps: readonly unknown[] = []) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const frame = requestAnimationFrame(() => {
      cleanup = initAnimations();
    });

    return () => {
      cancelAnimationFrame(frame);
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
