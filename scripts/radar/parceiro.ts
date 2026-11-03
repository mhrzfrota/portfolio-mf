import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { admin, acharUsuario } from "./admin.ts";
export async function executarParceiro(args: string[]) {
  if (args[0] === "--") args = args.slice(1);
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { nome: { type: "string" }, radar: { type: "string" } },
  });
  const [cmd, email] = positionals,
    db = admin();
  if (cmd === "listar") {
    const { data, error } = await db
      .from("radar_papeis")
      .select("user_id,papel,nome,radar_owner,criado_em")
      .order("criado_em");
    if (error) throw error;
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (!email) throw new Error("Informe o e-mail.");
  if (cmd === "convidar") {
    const donoIdent = values.radar ?? process.env.NOITE_OWNER_EMAIL;
    if (!donoIdent) throw new Error("Informe --radar <email> ou configure NOITE_OWNER_EMAIL para identificar o dono do Radar.");
    const dono = await acharUsuario(db, donoIdent);
    const papelDono = await db.from("radar_papeis").select("papel").eq("user_id", dono.id).maybeSingle();
    if (papelDono.error) throw papelDono.error;
    if (papelDono.data?.papel !== "dono") throw new Error("O usuário indicado não é dono de um Radar.");
    const redirectTo = `${(process.env.SITE_URL || "https://emefeservices.vercel.app").replace(/\/$/, "")}/acesso?convite=1`;
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { nome: values.nome ?? "" },
    });
    if (error) throw error;
    const id = data.user.id;
    const papel = await db
      .from("radar_papeis")
      .upsert({
        user_id: id,
        papel: "parceiro",
        nome: values.nome?.trim() || null,
        radar_owner: dono.id,
      });
    if (papel.error) throw papel.error;
    console.log(`✓ convite enviado: ${email}`);
    return;
  }
  if (cmd === "remover") {
    const u = await acharUsuario(db, email);
    const papel = await db.from("radar_papeis").select("papel").eq("user_id", u.id).maybeSingle();
    if (papel.error) throw papel.error;
    if (papel.data?.papel !== "parceiro") throw new Error("Esse e-mail não é parceiro do Radar.");
    // Sem papel a conta perderia a trava das outras áreas: bloqueia o login antes de tirar o papel. Os dados ficam.
    const ban = await db.auth.admin.updateUserById(u.id, { ban_duration: "876000h" });
    if (ban.error) throw ban.error;
    const { error } = await db.from("radar_papeis").delete().eq("user_id", u.id);
    if (error) throw error;
    console.log(`✓ acesso removido e login bloqueado: ${email}`);
    return;
  }
  throw new Error("Use convidar, listar ou remover.");
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  executarParceiro(process.argv.slice(2)).catch(e => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  });
