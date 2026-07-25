import type { Lang } from "@/contexts/LanguageContext";

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

/**
 * Depoimentos reais de clientes — os balões do hero só aparecem quando
 * houver pelo menos um item no idioma ativo. Preencher com frases REAIS
 * (nada inventado); exemplo do formato:
 * { quote: "Entregou em 2 semanas, ficou incrível!", author: "Fulano", role: "Cliente X" }
 */
const testimonials: Record<Lang, Testimonial[]> = {
  pt: [],
  en: [],
};

export function getTestimonials(lang: Lang): Testimonial[] {
  return testimonials[lang];
}
