interface Props {
  model: string | null | undefined;
}

/** Small attribution shown beneath AI-generated summaries. */
export function ModelBadge({ model }: Props) {
  if (!model || model === "unknown") return null;

  const label = model
    .replace(/^google\//, "")
    .replace(/^qwen\//, "")
    .replace(/^meta\//, "")
    .replace(/-instruct$/i, "");

  return (
    <span
      className="relative group inline-flex items-center gap-1 text-xs mt-2 cursor-default"
      style={{ color: "var(--color-muted)", opacity: 0.7 }}
    >
      <svg
        className="w-3 h-3"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5.5 8h5M8 5.5v5" strokeLinecap="round" />
      </svg>
      {label}

      {/* Tooltip */}
      <span
        className="absolute top-full left-0 mt-2 w-56 rounded-lg px-3 py-2 text-xs text-left
                        leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100
                        transition-opacity z-50 shadow-lg"
        style={{ backgroundColor: "#1c1917", color: "#fffdf9" }}
      >
        This summary was generated using an open-source AI language model ({model}) and may not be
        fully accurate. Always refer to the original transcript for the authoritative record.
      </span>
    </span>
  );
}
