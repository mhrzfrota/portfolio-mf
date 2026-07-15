import { Fragment, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Destaca os trechos entre `**` sem precisar injetar HTML cru. */
function renderFact(fact: string) {
  return fact.split(/\*\*(.+?)\*\*/g).map((chunk, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-foreground">
        {chunk}
      </strong>
    ) : (
      <Fragment key={index}>{chunk}</Fragment>
    )
  );
}

export default function RotatingFacts({
  facts,
  interval = 4500,
}: {
  facts: string[];
  interval?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setIndex(value => (value + 1) % facts.length),
      interval
    );
    return () => window.clearInterval(id);
  }, [facts.length, interval, reduced]);

  return (
    <p
      className="mx-auto flex min-h-[3.5rem] max-w-xl items-start justify-center text-balance text-center text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]"
      aria-live="polite"
    >
      <span key={index} className="hero-fact">
        {renderFact(facts[index])}
      </span>
    </p>
  );
}
