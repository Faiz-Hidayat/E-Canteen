"use client";

import { useEffect, useRef, useState } from "react";

interface NumberTickerProps {
  value: number;
  /** Duration of the animation in ms (default 750) */
  duration?: number;
  /** Locale for formatting (default "id-ID") */
  locale?: string;
  className?: string;
}

export function NumberTicker({
  value,
  duration = 750,
  locale = "id-ID",
  className,
}: NumberTickerProps) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    if (from === to) return;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    startRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString(locale)}</span>;
}
