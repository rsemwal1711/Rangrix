interface MedalProps {
  rank: 1 | 2 | 3;
  size?: number;
}

const MEDAL_THEMES = {
  1: {
    ribbon: "#ef4444",
    ribbonDark: "#b91c1c",
    discFrom: "#fde68a",
    discTo: "#d97706",
    ring: "#fef3c7",
    label: "1",
  },
  2: {
    ribbon: "#38bdf8",
    ribbonDark: "#0369a1",
    discFrom: "#f1f5f9",
    discTo: "#94a3b8",
    ring: "#f8fafc",
    label: "2",
  },
  3: {
    ribbon: "#fb923c",
    ribbonDark: "#c2410c",
    discFrom: "#fdba74",
    discTo: "#9a3412",
    ring: "#fed7aa",
    label: "3",
  },
} as const;

export function Medal({ rank, size = 28 }: MedalProps) {
  const t = MEDAL_THEMES[rank];
  const gradId = `medal-grad-${rank}`;

  return (
    <svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 40 54"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-md"
      aria-label={`Rank ${rank} medal`}
    >
      {/* Ribbon */}
      <path d="M12 0 L20 20 L28 0 Z" fill={t.ribbon} />
      <path d="M12 0 L20 20 L16 20 Z" fill={t.ribbonDark} />

      {/* Disc */}
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={t.discFrom} />
          <stop offset="100%" stopColor={t.discTo} />
        </radialGradient>
      </defs>
      <circle cx="20" cy="34" r="18" fill={t.ring} />
      <circle cx="20" cy="34" r="15.5" fill={`url(#${gradId})`} stroke={t.discTo} strokeWidth="0.75" />

      {/* Shine highlight */}
      <ellipse cx="14" cy="27" rx="5" ry="3" fill="white" opacity="0.35" />

      {/* Rank number */}
      <text
        x="20"
        y="39"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill="#1c0f24"
        fontFamily="inherit"
      >
        {t.label}
      </text>
    </svg>
  );
}