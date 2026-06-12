export default function SectionBadge({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3 sm:mb-8">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[11px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[12px] dark:bg-white dark:text-[var(--brand-ink)]">
        {number}
      </span>
      <span className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-foreground sm:px-4 sm:py-1.5 sm:text-[13px]">
        {label}
      </span>
    </div>
  );
}
