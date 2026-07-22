import { cn } from "@/lib/utils";

/** Bloco de skeleton com shimmer — usado enquanto o relatório "monta". */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("diag-skeleton", className)} />;
}
