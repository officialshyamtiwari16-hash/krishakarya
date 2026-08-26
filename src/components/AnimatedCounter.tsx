import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: string | number;
  className?: string;
  duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  className = '',
  duration = 1.2,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return String(value);
    }
    return String(value).replace(/\d+/g, '0');
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-20px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(String(value));
      return;
    }

    const strValue = String(value);
    // Find all number sequences
    const numMatches = strValue.match(/\d+/g);
    if (!numMatches) {
      setDisplayValue(strValue);
      return;
    }

    const targets = numMatches.map((n) => parseInt(n, 10));
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      let matchIdx = 0;
      const currentFormatted = strValue.replace(/\d+/g, () => {
        const target = targets[matchIdx] || 0;
        const currentVal = Math.floor(target * easedProgress);
        matchIdx++;
        return currentVal.toLocaleString();
      });

      setDisplayValue(currentFormatted);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(strValue);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
};
