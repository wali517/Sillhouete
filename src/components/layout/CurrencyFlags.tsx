import type { CurrencyCode } from "@/components/providers/StoreProvider";

/** Round flag icons drawn as inline SVG (emoji flags don't render on Windows and can't be cropped round). */
export type FlagKey = CurrencyCode | "AUTO";

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.4;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} />;
}

export default function Flag({ code, size = 24 }: { code: FlagKey; size?: number }) {
  const id = `flag-clip-${code}-${size}`;
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="shrink-0 rounded-full"
      style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.12)" }}
    >
      <defs>
        <clipPath id={id}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {(code === "PKR" || code === "AUTO") && (
          <>
            <rect width="32" height="32" fill="#52ad5a" />
            <rect width="8" height="32" fill="#fff" />
            <circle cx="20" cy="16" r="6.2" fill="#fff" />
            <circle cx="22" cy="14.6" r="5.4" fill="#52ad5a" />
            <Star cx={23.6} cy={12.4} r={2.4} fill="#fff" />
          </>
        )}
        {code === "USD" && (
          <>
            <rect width="32" height="32" fill="#fff" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} y={i * 4.6} width="32" height="2.3" fill="#d2343f" />
            ))}
            <rect width="17" height="16.1" fill="#3c4b9c" />
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={3.5 + c * 5} cy={3.5 + r * 4.6} r="1" fill="#fff" />),
            )}
          </>
        )}
        {code === "EUR" && (
          <>
            <rect width="32" height="32" fill="#2f5aa8" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (Math.PI / 6) * i;
              return (
                <circle key={i} cx={16 + 9 * Math.cos(a)} cy={16 + 9 * Math.sin(a)} r="1.5" fill="#f5c400" />
              );
            })}
          </>
        )}
        {code === "GBP" && (
          <>
            <rect width="32" height="32" fill="#2b3a8c" />
            <path d="M0 0L32 32M32 0L0 32" stroke="#fff" strokeWidth="6" />
            <path d="M0 0L32 32M32 0L0 32" stroke="#d2343f" strokeWidth="2.2" />
            <path d="M16 0V32M0 16H32" stroke="#fff" strokeWidth="9" />
            <path d="M16 0V32M0 16H32" stroke="#d2343f" strokeWidth="5" />
          </>
        )}
        {code === "CAD" && (
          <>
            <rect width="32" height="32" fill="#fff" />
            <rect width="8" height="32" fill="#e0303a" />
            <rect x="24" width="8" height="32" fill="#e0303a" />
            <path
              d="M16 7l1.7 3.3 2.2-.9-.8 4.6 2.4-1.7.7 1.8 1.8-.4-1 3.6 1.2.6-3.4 2.8.4 1.4-3.6-.6v3.6h-1.2v-3.6l-3.6.6.4-1.4-3.4-2.8 1.2-.6-1-3.6 1.8.4.7-1.8 2.4 1.7-.8-4.6 2.2.9z"
              fill="#e0303a"
            />
          </>
        )}
        {code === "AED" && (
          <>
            <rect width="32" height="11" fill="#1d8a4a" />
            <rect y="11" width="32" height="10" fill="#fff" />
            <rect y="21" width="32" height="11" fill="#222" />
            <rect width="10" height="32" fill="#d2343f" />
          </>
        )}
      </g>
    </svg>
  );
}
