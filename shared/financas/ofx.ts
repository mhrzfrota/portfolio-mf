// Parser de extratos OFX (formato exportado por Nubank, Itaú, Inter, BB,
// Bradesco etc.). Aceita tanto OFX 1.x (SGML, sem tags de fechamento)
// quanto OFX 2.x (XML).

export interface OfxTransaction {
  fitid: string;
  date: string; // YYYY-MM-DD
  amount: number; // negativo = saída, positivo = entrada
  description: string;
  type: string;
}

export interface OfxStatement {
  transactions: OfxTransaction[];
  accountId?: string;
  bankName?: string;
  balance?: number;
  balanceDate?: string;
  startDate?: string;
  endDate?: string;
}

function tagValue(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, "i"));
  const value = match?.[1]?.trim();
  return value ? value : undefined;
}

function parseOfxDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!digits) return undefined;
  const [, year, month, day] = digits;
  return `${year}-${month}-${day}`;
}

function parseOfxAmount(raw?: string): number {
  if (!raw) return Number.NaN;
  // Alguns bancos usam vírgula como separador decimal.
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

function cleanDescription(value?: string): string {
  if (!value) return "";
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lê o arquivo respeitando o charset declarado no cabeçalho OFX.
 * Extratos brasileiros costumam vir em windows-1252/latin-1, o que quebra
 * acentos se lidos como UTF-8.
 */
export async function readOfxFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const header = utf8.slice(0, 600).toUpperCase();
  const declaresLatin =
    header.includes("CHARSET:1252") || header.includes("ISO-8859-1") || header.includes("WINDOWS-1252");
  const hasBrokenChars = utf8.includes("�");

  if (declaresLatin || hasBrokenChars) {
    try {
      return new TextDecoder("windows-1252").decode(buffer);
    } catch {
      return utf8;
    }
  }

  return utf8;
}

export function parseOfx(content: string): OfxStatement {
  const bodyStart = content.search(/<OFX>?/i);
  const body = bodyStart >= 0 ? content.slice(bodyStart) : content;

  const transactions: OfxTransaction[] = [];
  const seenFitids = new Map<string, number>();

  const blockRegex = /<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(body)) !== null) {
    const block = match[1];
    const date = parseOfxDate(tagValue(block, "DTPOSTED"));
    const amount = parseOfxAmount(tagValue(block, "TRNAMT"));
    if (!date || !Number.isFinite(amount) || amount === 0) continue;

    const memo = cleanDescription(tagValue(block, "MEMO"));
    const name = cleanDescription(tagValue(block, "NAME"));
    const description = memo.length >= name.length ? memo || name : name;

    let fitid = tagValue(block, "FITID") ?? "";
    if (!fitid) {
      fitid = `gen:${date}:${amount.toFixed(2)}:${description.toLowerCase().slice(0, 40)}`;
    }
    // Alguns bancos repetem FITID em lançamentos idênticos no mesmo dia.
    const repeats = seenFitids.get(fitid) ?? 0;
    seenFitids.set(fitid, repeats + 1);
    if (repeats > 0) fitid = `${fitid}#${repeats + 1}`;

    transactions.push({
      fitid,
      date,
      amount,
      description: description || "Transação do extrato",
      type: tagValue(block, "TRNTYPE")?.toUpperCase() ?? (amount < 0 ? "DEBIT" : "CREDIT"),
    });
  }

  transactions.sort((a, b) => a.date.localeCompare(b.date));

  const ledger = body.match(/<LEDGERBAL>([\s\S]*?)(?=<\/LEDGERBAL>|<AVAILBAL>|<\/STMTRS>|$)/i)?.[1];

  return {
    transactions,
    accountId: tagValue(body, "ACCTID"),
    bankName: tagValue(body, "ORG"),
    balance: ledger ? parseOfxAmount(tagValue(ledger, "BALAMT")) : undefined,
    balanceDate: ledger ? parseOfxDate(tagValue(ledger, "DTASOF")) : undefined,
    startDate: parseOfxDate(tagValue(body, "DTSTART")),
    endDate: parseOfxDate(tagValue(body, "DTEND")),
  };
}
