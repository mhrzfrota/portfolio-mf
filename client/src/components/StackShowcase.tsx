import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

export const STACK: { name: string; logo: string; logoDark?: string }[] = [
  { name: "React", logo: "/logos/stack/react.svg" },
  { name: "Node.js", logo: "/logos/stack/nodejs.svg" },
  { name: "TypeScript", logo: "/logos/stack/typescript.svg" },
  { name: "Python", logo: "/logos/stack/python.svg" },
  { name: "PostgreSQL", logo: "/logos/stack/postgresql.svg" },
  { name: "Tailwind CSS", logo: "/logos/stack/tailwindcss.svg" },
  { name: "Supabase", logo: "/logos/stack/supabase.svg" },
  { name: "Docker", logo: "/logos/stack/docker.svg" },
  // A marca da AWS tem o texto em azul quase preto, que some no tema escuro.
  { name: "AWS", logo: "/logos/stack/aws.svg", logoDark: "/logos/stack/aws-dark.svg" },
  { name: "Java", logo: "/logos/stack/java.svg" },
];

/**
 * Faixa de logos da referência: atravessa a seção inteira de ponta a ponta,
 * cortando os logos nas bordas — sem `section-box`, sem container e sem
 * máscara de fade, que é o que dava a impressão de faixa "encaixotada".
 *
 * O título visível saiu; o texto vira o `aria-label` da região, para quem usa
 * leitor de tela continuar sabendo o que a faixa é.
 */
export default function StackShowcase() {
  const { lang } = useLanguage();
  const t = getStrings(lang);

  return (
    <section
      id="stack"
      aria-label={t.stack.title}
      className="scroll-mt-24 overflow-hidden bg-background py-10 sm:py-14"
    >
      {/* A lista já vem duplicada no JSX: o marquee percorre metade da
          largura e cai num quadro idêntico ao inicial, sem emenda. */}
      <div
        data-anim="marquee-left"
        data-anim-speed="40"
        className="overflow-hidden"
      >
        <div className="marquee-track">
          {[...STACK, ...STACK].map((tech, index) => (
            <div
              key={`${tech.name}-${index}`}
              className="flex min-w-36 items-center justify-center px-6 md:min-w-48"
              aria-label={tech.name}
            >
              {/* Cor da marca, sempre. O cinza uniforme escondia justamente a
                  informação que a faixa carrega: qual stack é qual. */}
              <img
                src={tech.logo}
                alt={tech.name}
                className={`h-8 w-24 object-contain opacity-90 transition duration-300 hover:scale-110 hover:opacity-100 md:h-10 md:w-28 ${
                  tech.logoDark ? "dark:hidden" : ""
                }`}
                draggable={false}
                loading="lazy"
              />
              {tech.logoDark && (
                <img
                  src={tech.logoDark}
                  alt=""
                  aria-hidden="true"
                  className="hidden h-8 w-24 object-contain opacity-90 transition duration-300 hover:scale-110 hover:opacity-100 md:h-10 md:w-28 dark:block"
                  draggable={false}
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
