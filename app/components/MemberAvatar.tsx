import { type CSSProperties, useState } from "react";

type MemberAvatarProps = {
  name: string;
  src?: string | null;
  className: string;
  style?: CSSProperties;
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
};

export function MemberAvatar({
  name,
  src,
  className,
  style,
  fallbackClassName = "font-serif",
  fallbackStyle,
}: MemberAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <img
        loading="lazy"
        decoding="async"
        src={src}
        alt={name}
        className={className}
        style={style}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name} profile image`}
      className={`${className} ${fallbackClassName} flex items-center justify-center`}
      style={{
        backgroundColor: "var(--color-surface)",
        color: "var(--color-muted)",
        ...style,
        ...fallbackStyle,
      }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
