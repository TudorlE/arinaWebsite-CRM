import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Ticker from '@/components/Ticker';
import About from '@/components/About';
import Courses from '@/components/Courses';
import WhyUs from '@/components/WhyUs';
import Founder from '@/components/Founder';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Ticker />
      <About />
      <Courses />
      <WhyUs />
      <Founder />
      <Gallery />
      <Testimonials />
      <Contact />
      <Footer />
    </>
  );
}
