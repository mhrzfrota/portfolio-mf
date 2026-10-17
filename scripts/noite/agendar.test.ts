import { expect, it } from "vitest";
import { gerarPlist, validarHora } from "./agendar.ts";
import { aspasAppleScript } from "./aviso.ts";
it("gera plist com horário, shell de login, base e logs", () => {
  const p = gerarPlist({ repo: "/meu repo", base: "/noite", horario: "23:30" });
  expect(p).toContain("<integer>23</integer>");
  expect(p).toContain("<integer>30</integer>");
  expect(p).toContain("<string>/bin/zsh</string><string>-lc</string>");
  expect(p).toContain("cd &quot;/meu repo&quot; &amp;&amp; pnpm noite --se-pendente");
  expect(p).toContain("<key>StartInterval</key><integer>1800</integer>");
  expect(p).toContain("<key>NOITE_HORA</key><string>23:30</string>");
  expect(p.match(/\/noite\/logs\/launchd.log/g)).toHaveLength(2);
});
it("escapa XML e shell, incluindo substituição de comando", () => {
  const p = gerarPlist({
    repo: '/a"$HOME`cmd`&<',
    base: "/a&b",
    horario: "00:01",
  });
  expect(p).toContain("\\&quot;\\$HOME\\`cmd\\`&amp;&lt;");
  expect(p).toContain("/a&amp;b");
  expect(() => validarHora("24:00")).toThrow();
  expect(() => validarHora("1:30")).toThrow();
  expect(aspasAppleScript('Uma "frase" \\ fim\nlinha')).toBe(
    '"Uma \\"frase\\" \\\\ fim linha"'
  );
});
it("põe ~/.local/bin no PATH do launchd, onde ficam os CLIs do Claude e do Codex", () => {
  const p = gerarPlist({ repo: "/r", base: "/noite", horario: "23:30", home: "/Users/teste" });
  expect(p).toContain("<key>PATH</key><string>/Users/teste/.local/bin:");
});
