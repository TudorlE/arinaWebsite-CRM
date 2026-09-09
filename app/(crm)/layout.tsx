import { ThemeProvider } from '@/components/ThemeProvider';
import { ActionHistoryProvider } from '@/lib/actionHistory';
import UndoRedoBar from '@/components/UndoRedoBar';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ActionHistoryProvider>
        <div className="crm-root">{children}</div>
        <UndoRedoBar />
      </ActionHistoryProvider>
    </ThemeProvider>
  );
}
