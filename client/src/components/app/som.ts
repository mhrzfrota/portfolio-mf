import { useCallback, useEffect, useState } from "react";

/**
 * Clique sonoro do dock e dos cards (2026-10-29), como na referência. É
 * sintetizado na hora com Web Audio, sem arquivo de áudio, e só toca depois
 * de um gesto da pessoa. Ligar e desligar fica nos Ajustes do dock.
 */
const CHAVE = "mf-som";
let contexto: AudioContext | null = null;

function lerLigado() {
  try {
    return localStorage.getItem(CHAVE) !== "0";
  } catch {
    return true;
  }
}

export function tocarClique(tom: "baixo" | "alto" = "alto") {
  if (!lerLigado() || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    contexto ??= new Ctx();
    const agora = contexto.currentTime;
    const osc = contexto.createOscillator();
    const ganho = contexto.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(tom === "alto" ? 1250 : 720, agora);
    osc.frequency.exponentialRampToValueAtTime(tom === "alto" ? 620 : 380, agora + 0.05);
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.exponentialRampToValueAtTime(0.045, agora + 0.004);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 0.07);
    osc.connect(ganho).connect(contexto.destination);
    osc.start(agora);
    osc.stop(agora + 0.08);
  } catch {
    // Sem áudio no navegador: segue em silêncio.
  }
}

export function useSom() {
  const [ligado, setLigado] = useState(true);
  useEffect(() => setLigado(lerLigado()), []);
  const alternar = useCallback(() => {
    setLigado(atual => {
      const novo = !atual;
      try {
        localStorage.setItem(CHAVE, novo ? "1" : "0");
      } catch {
        // Armazenamento bloqueado: vale só nesta visita.
      }
      if (novo) window.setTimeout(() => tocarClique("alto"), 0);
      return novo;
    });
  }, []);
  return { ligado, alternar };
}
