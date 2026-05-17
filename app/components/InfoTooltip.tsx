import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  width?: string;
}

/** Question mark icon with a hover tooltip (desktop) and tap toggle (mobile). */
export function InfoTooltip({ text, width = "w-56" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative group inline-flex items-center cursor-help"
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
    >
      <svg
        className="w-3.5 h-3.5"
        style={{ color: "var(--color-muted)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M9.5 9.5a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
      </svg>
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${width} text-xs text-left leading-relaxed rounded-lg px-3 py-2 transition-opacity z-50 shadow-lg ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none group-hover:opacity-100"
        }`}
        style={{ backgroundColor: "#1c1917", color: "#fffdf9" }}
      >
        {text}
      </span>
    </span>
  );
}
