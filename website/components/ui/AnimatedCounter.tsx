'use client';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface Props {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export default function AnimatedCounter({ from = 0, to, suffix = '', prefix = '', duration = 2 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, from, to, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString('ro-RO')}{suffix}</span>;
}
