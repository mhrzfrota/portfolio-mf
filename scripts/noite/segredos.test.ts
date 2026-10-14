import { expect, it } from "vitest";
import { ocultarSegredos } from "./segredos.ts";
it.each([
  "sk-teste123",
  "sk-proj-abc_123",
  "sb_secret_abc123",
  "sbp_abc123",
  "ghp_abc123",
  "github_pat_abc123",
  "xoxb-123-abc",
  "xoxp-abc123",
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.assinatura",
  "sk_live_51HxYzAbC123",
  "AKIAIOSFODNN7EXAMPLE",
  "aB3dE5gH7jK9mN1pQ3sT5vX7zA9cE1gI3kM5",
])("oculta token %s", token => {
  expect(ocultarSegredos(`antes ${token} depois`)).toBe(
    "antes [oculto] depois"
  );
});
it("preserva texto, pontuação e hash curto", () =>
  expect(ocultarSegredos("Commit a1b2c3d, teste normal.")).toBe(
    "Commit a1b2c3d, teste normal."
  ));
it("preserva slug de link e hash completo de commit", () => {
  const url = "https://vite.dev/blog/announcing-vite-8-beta-with-rolldown-integration-and-more";
  const hash = "40c682750f0b2bd1c62b4a6cc1e3f8a9d0e7b6c5";
  expect(ocultarSegredos(`${url} ${hash}`)).toBe(`${url} ${hash}`);
});
