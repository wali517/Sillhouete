import type { ReactNode } from "react";

export default function ProductBadge({ children }: { children: ReactNode }) {
  return (
    <span className="absolute right-[3px] top-2.5 z-10 rounded-[3px] bg-white p-[7px] text-[11px] font-semibold uppercase leading-[15px] tracking-normal text-black">
      {children}
    </span>
  );
}
