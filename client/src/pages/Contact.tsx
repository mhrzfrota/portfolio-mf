import { Button } from "@/components/ui/button";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { Download, MessageCircle } from "lucide-react";

const contactHighlights = [
  {
    title: "Orçamentos",
    description: "Escopo, prazo e próximos passos definidos com clareza.",
  },
  {
    title: "Landing pages",
    description: "Páginas rápidas, responsivas e focadas em conversão.",
  },
  {
    title: "Dashboards e automações",
    description: "Dados organizados para operação, análise e decisão.",
  },
];

export default function Contact() {
  return (
    <div className="space-y-12 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold font-mono tracking-tight">
          <span className="text-primary">/</span>contato
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Tem um projeto em mente ou quer conversar? Estou aberto a novas
          oportunidades.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
        <section className="relative overflow-hidden py-2 md:py-4">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary via-primary/40 to-transparent" />

          <div className="relative space-y-8 pt-8">
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <span className="h-2 w-2 bg-primary" />
              atendimento direto
            </div>

            <div className="space-y-4">
              <h2 className="max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
                Vamos conversar pelo WhatsApp.
              </h2>
              <p className="max-w-xl text-muted-foreground leading-relaxed">
                Clique no botão abaixo para abrir uma conversa com a mensagem de
                orçamento já preenchida.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono rounded-none sm:w-auto"
            >
              <a href={WHATSAPP_BUDGET_URL} target="_blank" rel="noreferrer">
                Enviar mensagem <MessageCircle className="w-4 h-4" />
              </a>
            </Button>

            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              {contactHighlights.map((item, index) => (
                <div
                  key={item.title}
                  className="group relative min-h-36 border border-border px-4 py-5 transition-colors hover:border-primary/70"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-primary/0 transition-colors group-hover:bg-primary/80" />
                  <span className="font-mono text-xs text-primary/70">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 font-mono text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-8 lg:pl-12 border-l border-border/50">
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-mono">
              Informações de contato
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded text-primary">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground">
                    WhatsApp
                  </p>
                  <a
                    href={WHATSAPP_BUDGET_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    (85) 99637-0080
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border border-primary/20 bg-primary/5 rounded-none">
            <h4 className="font-mono font-bold text-primary mb-2">
              Baixar currículo
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Um resumo da minha experiência, formação e habilidades técnicas.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full border-primary/30 hover:bg-primary hover:text-primary-foreground font-mono rounded-none"
            >
              <a href="/curriculo.pdf" download="Curriculo-Matheus-Frota.pdf">
                Baixar PDF <Download className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
