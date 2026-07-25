import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const easing = "ease-[cubic-bezier(0.25,0.1,0.25,1)]";

const variantStyles = {
  black: {
    pill: "bg-[var(--brand-ink)] text-white hover:bg-black dark:bg-[#EDEDED] dark:text-[#161616] dark:hover:bg-white",
    circle: "bg-white text-[var(--brand-ink)] dark:bg-[#161616] dark:text-white",
  },
  white: {
    pill: "bg-white text-[#161616] shadow-[0_3px_4px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.16)]",
    circle: "bg-[var(--brand-ink)] text-white",
  },
  outline: {
    pill: "border border-border bg-transparent text-foreground hover:border-foreground",
    circle: "border border-border text-foreground",
  },
};

const sizeStyles = {
  sm: {
    pill: "pl-5 pr-2 py-2 text-[13px]",
    circle: "h-6 w-6",
    icon: "h-3 w-3",
  },
  md: {
    pill: "pl-5 sm:pl-6 pr-2 py-2 text-[13px] sm:text-[14px]",
    circle: "h-7 w-7 sm:h-8 sm:w-8",
    icon: "h-3.5 w-3.5",
  },
};

type RollButtonProps = {
  label: string;
  href?: string;
  external?: boolean;
  download?: string;
  onClick?: () => void;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  leading?: ReactNode;
  className?: string;
};

export default function RollButton({
  label,
  href,
  external = false,
  download,
  onClick,
  variant = "black",
  size = "md",
  leading,
  className,
}: RollButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const classes = cn(
    "group inline-flex items-center justify-between gap-3 rounded-full font-medium transition-all duration-300",
    v.pill,
    s.pill,
    className
  );

  const content = (
    <>
      {leading}
      <span className="block h-5 overflow-hidden">
        <span
          className={cn(
            "flex flex-col transition-transform duration-500 group-hover:-translate-y-1/2",
            easing
          )}
        >
          <span className="flex h-5 shrink-0 items-center whitespace-nowrap">
            {label}
          </span>
          <span className="flex h-5 shrink-0 items-center whitespace-nowrap">
            {label}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          v.circle,
          s.circle
        )}
      >
        <ArrowRight
          className={cn(
            "transition-transform duration-500 group-hover:-rotate-45",
            easing,
            s.icon
          )}
        />
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        download={download}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
