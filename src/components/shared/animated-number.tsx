"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  /** Target numeric value */
  value: number;
  /** Animation duration in ms. Default 500 */
  duration?: number;
  /** Number of decimal places. Default 0 (integer) */
  decimals?: number;
  /** CSS class applied to the <span> */
  className?: string;
}

/**
 * Smoothly counts from the previous value to the new target value using
 * requestAnimationFrame. Triggers on every `value` change.
 */
export function AnimatedNumber({
  value,
  duration = 500,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    // No animation needed on first render or same value
    if (from === to) {
      setDisplay(to);
      return;
    }

    // Cancel any in-progress animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
    </span>
  );
}
