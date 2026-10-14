export const FUSO = "America/Fortaleza";
export type Janela = { inicio: number; fim: number };
const data = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function diaFortaleza(ms: number): string {
  const p = Object.fromEntries(
    data.formatToParts(ms).map(p => [p.type, p.value])
  );
  return `${p.year}-${p.month}-${p.day}`;
}
export function diaDaNoite(agora: Date | number = Date.now()): string {
  return diaFortaleza(Number(agora) - 4 * 3600_000);
}
export function validarDia(dia: string): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dia) ||
    !Number.isFinite(Date.parse(dia)) ||
    new Date(dia).toISOString().slice(0, 10) !== dia
  )
    throw new Error("dia inválido, use AAAA-MM-DD");
}
function meiaNoite(dia: string): number {
  validarDia(dia);
  const utc = Date.parse(`${dia}T00:00:00Z`);
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    timeZoneName: "longOffset",
  }).formatToParts(utc);
  const offset = partes
    .find(p => p.type === "timeZoneName")!
    .value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!offset) throw new Error("Não foi possível calcular o fuso de Fortaleza");
  return (
    utc -
    (offset[1] === "+" ? 1 : -1) *
      (Number(offset[2]) * 60 + Number(offset[3])) *
      60_000
  );
}
export function janela(dia: string, agora: Date | number = Date.now()): Janela {
  const inicio = meiaNoite(dia);
  const proximo = new Date(Date.parse(dia) + 86400_000)
    .toISOString()
    .slice(0, 10);
  return {
    inicio,
    fim: Math.min(Number(agora), meiaNoite(proximo) + 4 * 3600_000),
  };
}
export function horaFortaleza(ms: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(ms);
}
