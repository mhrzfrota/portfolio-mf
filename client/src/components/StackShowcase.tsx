import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

const STACK = [
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

export default function StackShowcase() {
  const { lang } = useLanguage();
  const t = getStrings(lang);

  return (
    <section
      id="stack"
      className="scroll-mt-20 bg-background py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <p
          data-reveal
          className="mb-8 text-center text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:mb-10 sm:text-[15px]"
        >
          {t.stack.title}
        </p>

        <div
          data-reveal
          className="reveal-delay-1 hero-marquee-mask mx-auto max-w-5xl overflow-hidden"
        >
          <div className="hero-marquee-track">
            {[...STACK, ...STACK].map((tech, index) => (
              <div
                key={`${tech.name}-${index}`}
                className="flex min-w-36 items-center justify-center px-6 md:min-w-44"
                aria-label={tech.name}
              >
                <img
                  src={tech.logo}
                  alt={tech.name}
                  className="h-9 w-24 object-contain opacity-100 transition-transform duration-300 hover:scale-110 md:h-11 md:w-28"
                  draggable={false}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
