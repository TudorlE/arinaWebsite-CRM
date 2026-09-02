import { ThemeProvider } from '@/components/ThemeProvider';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="crm-root">{children}</div>
    </ThemeProvider>
  );
}
