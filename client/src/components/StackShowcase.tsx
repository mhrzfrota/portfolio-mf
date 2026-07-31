import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

export const STACK = [
  { name: "React", logo: "/logos/stack/react.svg" },
  { name: "Node.js", logo: "/logos/stack/nodejs.svg" },
  { name: "TypeScript", logo: "/logos/stack/typescript.svg" },
  { name: "Python", logo: "/logos/stack/python.svg" },
  { name: "PostgreSQL", logo: "/logos/stack/postgresql.svg" },
  { name: "Tailwind CSS", logo: "/logos/stack/tailwindcss.svg" },
  { name: "Supabase", logo: "/logos/stack/supabase.svg" },
  { name: "Docker", logo: "/logos/stack/docker.svg" },
  { name: "AWS", logo: "/logos/stack/aws.svg" },
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
              {/* Cinza uniforme como na referência; a cor volta no hover, e o
                  marquee pausa junto, então dá pra identificar cada uma. */}
              <img
                src={tech.logo}
                alt={tech.name}
                className="h-8 w-24 object-contain opacity-55 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-10 md:w-28 dark:opacity-45 dark:invert dark:hover:invert-0"
                draggable={false}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
