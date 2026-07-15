import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

type TypeCyclerProps = {
  texts: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  holdDuration?: number;
  className?: string;
};

export default function TypeCycler({
  texts,
  typeSpeed = 85,
  deleteSpeed = 40,
  holdDuration = 1600,
  className,
}: TypeCyclerProps) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced) return;

    const current = texts[index];

    if (!deleting && length === current.length) {
      const id = window.setTimeout(() => setDeleting(true), holdDuration);
      return () => window.clearTimeout(id);
    }

    if (deleting && length === 0) {
      setDeleting(false);
      setIndex(value => (value + 1) % texts.length);
      return;
    }

    const id = window.setTimeout(
      () => setLength(value => value + (deleting ? -1 : 1)),
      deleting ? deleteSpeed : typeSpeed
    );
    return () => window.clearTimeout(id);
  }, [
    length,
    deleting,
    index,
    texts,
    reduced,
    typeSpeed,
    deleteSpeed,
    holdDuration,
  ]);

  const visible = reduced ? texts[0] : texts[index].slice(0, length);

  return (
    <span className={cn("whitespace-pre", className)} aria-hidden="true">
      {visible}
      {!reduced && <span className="type-caret" />}
    </span>
  );
}
