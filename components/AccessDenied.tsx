import { ShieldAlert } from 'lucide-react';
import PageBanner from '@/components/ui/PageBanner';

/** Shown to a signed-in user (e.g. a limited 'administrator') whose role can't open this section. */
export default function AccessDenied({ title }: { title: string }) {
  return (
    <div className="flex flex-col flex-1">
      <PageBanner icon={ShieldAlert} title={title} subtitle="Acces restricționat" accent="#94A3B8" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Nu ai permisiunea de a accesa această secțiune.</p>
      </main>
    </div>
  );
}
