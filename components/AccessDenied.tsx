import { ShieldAlert } from 'lucide-react';

/** Shown to a signed-in user (e.g. a limited 'administrator') whose role can't open this section. */
export default function AccessDenied({ title }: { title: string }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-700 to-slate-800 px-8 py-6 shadow-lg">
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-slate-300 text-sm font-medium mt-0.5">Acces restricționat</p>
          </div>
        </div>
      </div>
      <main className="flex-1 p-6 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Nu ai permisiunea de a accesa această secțiune.</p>
      </main>
    </div>
  );
}
