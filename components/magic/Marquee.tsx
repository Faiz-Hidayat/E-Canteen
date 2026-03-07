"use client";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  /** Speed in seconds (default 25) */
  speed?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  className,
  speed = 25,
  pauseOnHover = false,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        pauseOnHover && "[&:hover_.marquee-track]:pause",
        className
      )}
    >
      <div
        className="marquee-track inline-flex whitespace-nowrap"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        {/* Duplicate content for seamless loop */}
        {children}
        {children}
      </div>
    </div>
  );
}
