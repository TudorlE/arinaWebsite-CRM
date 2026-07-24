import Navbar from '@/components/site/Navbar';
import Hero from '@/components/site/Hero';
import About from '@/components/site/About';
import Courses from '@/components/site/Courses';
import WhyUs from '@/components/site/WhyUs';
import Founder from '@/components/site/Founder';
import Gallery from '@/components/site/Gallery';
import Testimonials from '@/components/site/Testimonials';
import CTA from '@/components/site/CTA';
import Contact from '@/components/site/Contact';
import Footer from '@/components/site/Footer';

export const metadata = {
  title: 'Arry Production – Școală de Muzică Premium',
  description: 'Descoperă talentul muzical din tine la Arry Production. Cursuri de pian, tobe, canto, chitară și solfegiu.',
};

export default function HomePage() {
  return (
    <div style={{ background: '#07040f', minHeight: '100vh' }}>
      <Navbar />
      <Hero />
      <About />
      <Courses />
      <WhyUs />
      <Founder />
      <Gallery />
      <Testimonials />
      <CTA />
      <Contact />
      <Footer />
    </div>
  );
}
