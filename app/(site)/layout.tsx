import { BookingProvider } from '@/components/Booking';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-root">
      <BookingProvider>{children}</BookingProvider>
    </div>
  );
}
