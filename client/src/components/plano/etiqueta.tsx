import { ETIQUETAS, type EtiquetaId } from "@/features/plano/quadro";

const MAPA = new Map(ETIQUETAS.map((e) => [e.id, e]));

/** Pílula colorida como as etiquetas do Trello. `compacta` vira só a barra de cor. */
export function Etiqueta({ id, compacta = false }: { id: EtiquetaId; compacta?: boolean }) {
  const e = MAPA.get(id);
  if (!e) return null;
  if (compacta) return <span title={e.nome} className="block h-1.5 w-9 rounded-full" style={{ background: e.cor }} />;
  return (
    <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold text-white" style={{ background: e.cor }}>
      {e.nome}
    </span>
  );
}

export const nomeEtiqueta = (id: EtiquetaId) => MAPA.get(id)?.nome ?? id;
