import { useEffect, useState } from "react";

import { setStoredTheme, useResolvedTheme } from "~/lib/theme";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const theme = useResolvedTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggle() {
    setStoredTheme(theme === "dark" ? "light" : "dark");
  }

  const showDark = mounted && theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={showDark ? "Switch to light theme" : "Switch to dark theme"}
      className="p-1.5 rounded cursor-pointer"
      style={{ color: "var(--color-muted)" }}
    >
      {showDark ? (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          />
        </svg>
      )}
    </button>
  );
}
