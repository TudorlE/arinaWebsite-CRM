'use client';
import { motion } from 'framer-motion';
import { BLACK, OFFWHITE, display, body } from './theme';

export default function Contact() {
  return (
    <section id="contact" style={{ padding: '120px 24px 100px', background: OFFWHITE }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, color: BLACK, justifyContent: 'center' }}>
          <span style={{ width: 24, height: 1, background: BLACK, display: 'inline-block' }} /> Contact
        </span>
        <h2 style={{ fontFamily: display, fontSize: 'clamp(40px, 6vw, 84px)', color: BLACK, margin: '0 0 20px', lineHeight: 0.92, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
          Ia legătura
        </h2>
        <p style={{ fontFamily: body, fontSize: 17, color: 'rgba(2,7,7,0.55)', maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>
          Suntem aici să răspundem oricărei întrebări. Nu ezita să ne contactezi — detaliile de contact și locația le găsești mai jos.
        </p>
      </motion.div>
    </section>
  );
}
