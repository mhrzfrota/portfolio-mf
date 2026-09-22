import { Link } from "wouter";
import { ArrowUpRight, Brain, CircleCheckBig, Wallet } from "lucide-react";
import InternalShell from "@/components/InternalShell";

const screens = [
  {
    href: "/financeiro",
    title: "Financeiro",
    description: "Entradas do mês, saldo e um plano para guardar mais.",
    icon: Wallet,
    label: "Seu dinheiro",
  },
  {
    href: "/habitos",
    title: "Hábitos",
    description: "Sua rotina, um dia de cada vez. Acompanhe sua constância.",
    icon: CircleCheckBig,
    label: "Sua rotina",
  },
  {
    href: "/cerebro",
    title: "Cérebro",
    description: "Notas, conexões e o foco da semana em um só lugar.",
    icon: Brain,
    label: "Seu contexto",
  },
];

export default function Overview() {
  return (
    <InternalShell title="Visão geral" home>
      <p className="mt-3 text-sm text-white/70">
        Tudo o que você precisa, por aqui.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {screens.map(({ href, title, description, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="board-glass group flex min-h-64 flex-col rounded-3xl p-6 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          >
            <div className="flex items-center justify-between">
              <Icon size={25} strokeWidth={1.5} />
              <ArrowUpRight
                size={20}
                className="text-white/60 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transform-none"
              />
            </div>
            <p className="mono-label mt-10 text-[9px] text-white/60">{label}</p>
            <h2 className="mt-2 text-xl font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </InternalShell>
  );
}
