import { Link, useLocation } from "react-router";

const iconProps = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const TABS = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
      </svg>
    ),
  },
  {
    to: "/members",
    label: "Members",
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14.6c2.6.2 4.6 1.9 5.3 5.4" />
      </svg>
    ),
  },
  {
    to: "/sittings",
    label: "Sittings",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m10 9.5 5 2.5-5 2.5z" />
      </svg>
    ),
  },
  {
    to: "/bills",
    label: "Bills",
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4M10 12h5M10 16h5" />
      </svg>
    ),
  },
  {
    to: "/topics",
    label: "Topics",
    icon: (
      <svg {...iconProps}>
        <path d="M4 5h16v11H9l-5 4z" />
      </svg>
    ),
  },
];

/**
 * Phone-only tab bar, fixed to the bottom of the screen below 768px.
 * Each tab is a full fifth of the width and 56px tall, so every tap target is over 44px.
 * The root layout adds bottom padding (pb-24) under 768px so the bar never covers content.
 */
export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg pb-4"
    >
      {TABS.map(({ to, label, icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
              active ? "font-semibold text-accent" : "text-muted"
            }`}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
