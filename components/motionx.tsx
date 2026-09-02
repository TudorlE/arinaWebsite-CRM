'use client';

import { motion, useInView, useMotionValue, useSpring, useScroll, useTransform, type Variants } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Simple fade + rise on scroll-in. */
export function Reveal({
  children, delay = 0, y = 26, className, style,
}: { children: React.ReactNode; delay?: number; y?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that wipes up line-by-line from behind a mask. Pass lines as an array. */
const linesParent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const lineChild: Variants = {
  hidden: { y: '105%' },
  show: { y: '0%', transition: { duration: 0.8, ease: EASE } },
};

export function RevealLines({
  lines, tag = 'h2', style, lineStyle,
}: { lines: React.ReactNode[]; tag?: 'h1' | 'h2' | 'h3'; style?: React.CSSProperties; lineStyle?: React.CSSProperties }) {
  const Tag = motion[tag];
  return (
    <Tag
      style={{ margin: 0, ...style }}
      variants={linesParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {lines.map((ln, i) => (
        <span key={i} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.16em', marginBottom: '-0.1em', ...lineStyle }}>
          <motion.span style={{ display: 'block', paddingTop: '0.08em', whiteSpace: 'normal', overflowWrap: 'break-word' }} variants={lineChild}>{ln}</motion.span>
        </span>
      ))}
    </Tag>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Stagger({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div className={className} style={style} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <motion.div className={className} style={style} variants={staggerChild}>{children}</motion.div>;
}

/** Animated number that counts up when it scrolls into view. Keeps any prefix/suffix text. */
export function CountUp({ value, prefix = '', suffix = '', duration = 1.6 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  useEffect(() => spring.on('change', v => setDisplay(Math.round(v))), [spring]);

  return <span ref={ref}>{prefix}{display.toLocaleString('ro-RO')}{suffix}</span>;
}

/** Parallax wrapper — shifts children as the section scrolls through the viewport. */
export function Parallax({ children, distance = 60, className, style }: { children: React.ReactNode; distance?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className} style={{ ...style, overflow: 'hidden' }}>
      <motion.div style={{ y, height: `calc(100% + ${distance * 2}px)`, width: '100%', marginTop: -distance }}>{children}</motion.div>
    </div>
  );
}
