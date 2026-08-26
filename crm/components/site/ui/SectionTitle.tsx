'use client';
import { motion } from 'framer-motion';

interface Props {
  tag?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  light?: boolean;
}

export default function SectionTitle({ tag, title, subtitle, center = true, light = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={center ? 'text-center' : ''}
    >
      {tag && (
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{ background: 'rgba(244,168,92, 0.18)', color: '#9C4A1E' }}>
          {tag}
        </span>
      )}
      <h2 className={`text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4 ${light ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg md:text-xl max-w-2xl leading-relaxed ${center ? 'mx-auto' : ''} ${light ? 'text-white/75' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
