import { expect, it } from "vitest";
import { executar } from "./processo.ts";

it("corta no tempo máximo mesmo quando um neto fora do grupo segura a saída aberta", async () => {
  // O filho cria um neto em outro grupo de processos (escapa do kill do grupo) que herda o stdout por 5 s
  const script = "if (fork() == 0) { setpgrp(0, 0); sleep 5; exit 0 } sleep 5";
  const inicio = Date.now();
  await expect(executar("perl", ["-e", script], { cwd: process.cwd(), timeout: 300 })).rejects.toThrow(/Tempo máximo/);
  expect(Date.now() - inicio).toBeLessThan(3000);
});

it("devolve o stdout quando termina bem", async () => {
  await expect(executar("printf", ["ok"], { cwd: process.cwd(), timeout: 5000 })).resolves.toBe("ok");
});
