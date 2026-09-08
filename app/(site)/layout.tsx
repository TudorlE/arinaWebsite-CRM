import { BookingProvider } from '@/components/Booking';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LocaleProvider } from '@/lib/i18n';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <div className="site-root">
          <BookingProvider>{children}</BookingProvider>
        </div>
      </LocaleProvider>
    </ThemeProvider>
  );
}
