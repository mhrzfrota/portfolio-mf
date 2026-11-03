import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { admin } from "./admin.ts";
const db = () => admin();
export async function executarBuscas(args: string[]) {
  if (args[0] === "--") args = args.slice(1);
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      resultado: { type: "string" },
      erro: { type: "string" },
    },
  });
  const [cmd, id] = positionals;
  const cliente = db();
  if (cmd === "pendentes") {
    const { data, error } = await cliente
      .from("radar_buscas")
      .select("*")
      .eq("modo", "completa")
      .eq("status", "pendente")
      .order("criado_em");
    if (error) throw error;
    if (values.json) console.log(JSON.stringify(data, null, 2));
    else
      for (const x of data ?? [])
        console.log(
          `${x.id} | ${x.nicho} | ${x.regiao} | ${x.quantidade} | ${x.owner}`
        );
    return;
  }
  if (!id) throw new Error("Informe o id da busca.");
  if (cmd === "pegar") {
    const { data, error } = await cliente
      .from("radar_buscas")
      .update({ status: "rodando", atualizado_em: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pendente")
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Busca não está pendente.");
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  const campos =
    cmd === "concluir"
      ? {
          status: "concluida",
          resultado: JSON.parse(values.resultado ?? "{}"),
          erro: null,
        }
      : { status: "falhou", erro: values.erro?.trim() };
  if (!["concluir", "falhar"].includes(cmd ?? ""))
    throw new Error("Use pendentes, pegar, concluir ou falhar.");
  if (cmd === "falhar" && !campos.erro) throw new Error("Use --erro.");
  const { error } = await cliente
    .from("radar_buscas")
    .update({ ...campos, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "rodando");
  if (error) throw error;
  console.log(`✓ ${cmd}: ${id}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  executarBuscas(process.argv.slice(2)).catch(e => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  });
