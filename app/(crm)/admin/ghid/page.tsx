'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Lightbulb, AlertTriangle, Sparkles, ShieldCheck, LayoutDashboard,
  Users, ClipboardList, Music2, DoorOpen, CalendarDays, CalendarRange, Repeat,
  Mic2, CreditCard, Globe, UserCheck, Settings, HelpCircle, Search, ArrowUp,
} from 'lucide-react';
type IconType = typeof BookOpen;

type GhidBadgeVariant = 'indigo' | 'purple' | 'gray';

const GHID_BADGE_STYLES: Record<GhidBadgeVariant, string> = {
  indigo: 'bg-brand-100 text-brand-700',
  purple: 'bg-accent-100 text-accent-700',
  gray:   'bg-slate-100 text-slate-600',
};

function GhidBadge({ variant, children }: { variant: GhidBadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${GHID_BADGE_STYLES[variant]}`}>
      {children}
    </span>
  );
}

interface SectionMeta { id: string; title: string; icon: IconType; group: string; }

const SECTIONS: SectionMeta[] = [
  { id: 'intro',                title: 'Introducere',            icon: Sparkles,       group: 'Start' },
  { id: 'roluri',               title: 'Roluri & acces',         icon: ShieldCheck,    group: 'Start' },
  { id: 'dashboard',            title: 'Dashboard',              icon: LayoutDashboard, group: 'Start' },
  { id: 'elevi-general',        title: 'Elevi General',          icon: Users,          group: 'Elevi & Profesori' },
  { id: 'elevi-frecventa',      title: 'Elevi Frecvență',        icon: ClipboardList,  group: 'Elevi & Profesori' },
  { id: 'profesori-general',    title: 'Profesori General',      icon: Music2,         group: 'Elevi & Profesori' },
  { id: 'profesori-frecventa',  title: 'Profesori Frecvență',    icon: ClipboardList,  group: 'Elevi & Profesori' },
  { id: 'cabinete',             title: 'Cabinete General',       icon: DoorOpen,       group: 'Program' },
  { id: 'program',              title: 'Program',                icon: CalendarDays,   group: 'Program' },
  { id: 'program-general',      title: 'Program General',        icon: CalendarRange,  group: 'Program' },
  { id: 'orar-fix',             title: 'Orar Fix',               icon: Repeat,         group: 'Program' },
  { id: 'auditii',              title: 'Audiții',                icon: Mic2,           group: 'Program' },
  { id: 'registru',             title: 'Registru Frecvență',     icon: ClipboardList,  group: 'Program' },
  { id: 'plati',                title: 'Plăți',                  icon: CreditCard,     group: 'Administrare' },
  { id: 'cereri-site',          title: 'Cereri Site',            icon: Globe,          group: 'Administrare' },
  { id: 'aprobari',             title: 'Aprobări & Roluri',       icon: UserCheck,      group: 'Administrare' },
  { id: 'setari',               title: 'Setări cont',            icon: Settings,       group: 'Administrare' },
  { id: 'intrebari',            title: 'Întrebări frecvente',    icon: HelpCircle,     group: 'Ajutor' },
];

const GROUPS = ['Start', 'Elevi & Profesori', 'Program', 'Administrare', 'Ajutor'];

function Access({ roles }: { roles: ('admin' | 'teacher' | 'student')[] }) {
  const map = {
    admin:   { variant: 'indigo' as const, label: 'Admin' },
    teacher: { variant: 'purple' as const, label: 'Profesor' },
    student: { variant: 'gray' as const, label: 'Elev' },
  };
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Acces</span>
      {roles.map(r => <GhidBadge key={r} variant={map[r].variant}>{map[r].label}</GhidBadge>)}
    </div>
  );
}

function Callout({ type, label, children }: { type: 'tip' | 'warn'; label: string; children: React.ReactNode }) {
  const isTip = type === 'tip';
  const Icon = isTip ? Lightbulb : AlertTriangle;
  return (
    <div className={`relative flex gap-3.5 rounded-2xl border p-4 pl-5 my-6 text-sm overflow-hidden
      ${isTip ? 'bg-accent-50/70 border-accent-200/70' : 'bg-amber-50/70 border-amber-200/70'}`}>
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${isTip ? 'bg-accent-400' : 'bg-amber-400'}`} />
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isTip ? 'bg-accent-100 text-accent-600' : 'bg-amber-100 text-amber-600'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className={`font-bold mb-0.5 ${isTip ? 'text-accent-700' : 'text-amber-700'}`}>{label}</p>
        <p className="text-slate-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="relative space-y-4 my-5 ml-1">
      <span className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-3.5">
          <span className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-mono font-bold flex items-center justify-center shadow-sm shadow-brand-600/30">{i + 1}</span>
          <span className="text-sm text-slate-600 leading-relaxed pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function FieldTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="my-5 rounded-2xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[420px]">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
            <th className="py-2.5 pl-4 pr-4">Câmp</th>
            <th className="py-2.5 pr-4">Ce reprezintă</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, desc], i) => (
            <tr key={field} className={i % 2 === 1 ? 'bg-slate-50/60' : ''}>
              <td className="py-2.5 pl-4 pr-4 font-semibold text-slate-800 whitespace-nowrap align-top">{field}</td>
              <td className="py-2.5 pr-4 text-slate-500 align-top">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ meta, sub, children }: { meta: SectionMeta; sub: string; children: React.ReactNode }) {
  const Icon = meta.icon;
  return (
    <section id={meta.id} className="scroll-mt-8 py-11 border-t border-slate-100 first:border-t-0 first:pt-0" data-guide-section>
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-600/20">
          <Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{meta.title}</h2>
      </div>
      {sub && <p className="text-sm text-slate-400 mb-5 ml-12">{sub}</p>}
      <div className="max-w-3xl">{children}</div>
    </section>
  );
}

export default function GhidPage() {
  const mainRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState('intro');
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { root, rootMargin: '-10% 0px -75% 0px', threshold: 0 },
    );
    root.querySelectorAll('[data-guide-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    const el = mainRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
    setShowTop(el.scrollTop > 480);
  };

  const scrollToTop = () => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const filteredSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter(s => s.title.toLowerCase().includes(q));
  }, [filter]);

  return (
    <div className="flex flex-col flex-1">
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-accent-600 px-4 sm:px-8 py-5 sm:py-7 shadow-lg">
        <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-16 w-40 h-40 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-white/15 rounded-2xl backdrop-blur-sm ring-1 ring-white/20 flex-shrink-0"><BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" /></div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">Ghid de utilizare</h1>
            <p className="text-white/75 text-xs sm:text-sm font-medium mt-0.5">Cum se folosește CRM-ul Arry Production — pas cu pas</p>
          </div>
        </div>
      </div>

      {/* Reading progress */}
      <div className="h-[3px] bg-slate-100 flex-shrink-0">
        <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-[width] duration-150 ease-out" style={{ width: `${progress * 100}%` }} />
      </div>

      <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 px-4 sm:px-6 py-6 sm:py-8">

          {/* Mobile section jump (TOC is desktop-only) */}
          <div className="lg:hidden w-full">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={activeId}
                onChange={e => {
                  const id = e.target.value;
                  setActiveId(id);
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none"
              >
                {GROUPS.map(group => (
                  <optgroup key={group} label={group}>
                    {SECTIONS.filter(s => s.group === group).map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Sticky TOC */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-8 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Caută o secțiune…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>
            <nav className="space-y-5">
              {GROUPS.map(group => {
                const items = filteredSections.filter(s => s.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 px-2.5">{group}</p>
                    <div className="flex flex-col gap-0.5">
                      {items.map(s => {
                        const isActive = activeId === s.id;
                        const Icon = s.icon;
                        return (
                          <a
                            key={s.id}
                            href={`#${s.id}`}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors
                              ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                          >
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                            <span className="truncate">{s.title}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredSections.length === 0 && (
                <p className="text-xs text-slate-400 px-2.5">Nicio secțiune găsită.</p>
              )}
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0 flex-1 max-w-3xl">

            <Section meta={SECTIONS[0]} sub="Ce este acest CRM și cum e organizat">
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                CRM-ul Arry Production e locul unde se gestionează tot ce ține de activitatea studioului: elevii și profesorii, orarul lecțiilor, prezența, audițiile și plățile. Site-ul public (cu formularul de contact) și CRM-ul fac parte din aceeași aplicație — cererile primite pe site ajung direct în secțiunea <b>Cereri Site</b>.
              </p>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Te autentifici cu adresa de email și parola contului tău. Dacă ești profesor sau elev și tocmai te-ai înregistrat, contul tău așteaptă <b>aprobarea</b> unui administrator înainte de a putea intra (vezi <a href="#aprobari" className="text-brand-600 font-medium">Aprobări</a>).
              </p>
              <Callout type="tip" label="De reținut">
                Meniul din stânga se adaptează automat la rolul tău — un profesor nu vede niciodată opțiunile rezervate administratorului (Aprobări, Roluri, Cereri Site, Orar Fix).
              </Callout>
            </Section>

            <Section meta={SECTIONS[1]} sub="Cine ce poate face în CRM">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 p-4 hover:border-brand-300 transition-colors">
                  <GhidBadge variant="indigo">Admin</GhidBadge>
                  <p className="text-sm text-slate-500 mt-2">Acces complet: adaugă/editează/șterge orice, aprobă conturi noi, schimbă roluri, vede toate rapoartele.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 hover:border-accent-300 transition-colors">
                  <GhidBadge variant="purple">Profesor</GhidBadge>
                  <p className="text-sm text-slate-500 mt-2">Vede și editează propriul program și proprii elevi. Nu vede Aprobări, Roluri, Cereri Site sau Orar Fix.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <GhidBadge variant="gray">Elev</GhidBadge>
                  <p className="text-sm text-slate-500 mt-2">Acces doar de vizualizare la propriul program.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-bold text-sm text-slate-800">Legătura Profesor ↔ cont</p>
                  <p className="text-sm text-slate-500 mt-2">Un cont de profesor trebuie <b>asociat</b> cu o fișă de profesor ca să funcționeze filtrarea „doar datele mele”.</p>
                </div>
              </div>
            </Section>

            <Section meta={SECTIONS[2]} sub="Prima pagină după autentificare">
              <p className="text-sm text-slate-600 leading-relaxed">
                O privire de ansamblu rapidă: număr de elevi, venit lunar estimat, lecții programate azi, plăți restante, profesori activi și un grafic al veniturilor.
              </p>
            </Section>

            <Section meta={SECTIONS[3]} sub="Lista completă a elevilor + fișa fiecăruia">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Elevii apar sub formă de carduri, cu instrumentele studiate și profesorul atribuit. Caută după nume sau filtrează după instrument din bara de sus.
              </p>
              <h3 className="font-bold text-slate-900 mt-6 mb-2">Adaugă un elev nou</h3>
              <Steps items={[
                <>Apasă cardul cu <b>+ „Adaugă elev”</b> din colțul din stânga sus al listei.</>,
                <>Completează toate câmpurile din formular (vezi tabelul de mai jos — toate sunt necesare, în afară de Cabinet și Observații).</>,
                <>Apasă <b>„Adaugă elev”</b>. Elevul apare imediat în listă, iar sistemul îi generează automat prima plată lunară (ca „neachitată”).</>,
              ]} />
              <FieldTable rows={[
                ['Nume complet', 'Numele și prenumele elevului.'],
                ['Data nașterii', 'Selectată din calendarul dedicat — apasă pe câmp, alege luna/anul din listele rapide, apoi ziua.'],
                ['Telefon / Email', 'Date de contact ale elevului sau părintelui.'],
                ['Instrumente', 'Poți bifa mai multe (ex. Pian și Canto) — apasă pe fiecare etichetă pentru a o selecta.'],
                ['Nivel', 'Începător / Intermediar / Avansat.'],
                ['Abonament lunar', 'Suma pe care o achită elevul lunar (MDL).'],
                ['Profesor', 'Profesorul principal atribuit.'],
                ['Cabinet', 'Cabinetul „de bază” al elevului (opțional).'],
                ['Status', 'Activ / Pauză / Inactiv — util pentru elevi care întrerup temporar cursurile.'],
                ['Observații', 'O notă scurtă, liberă (opțional).'],
              ]} />
              <h3 className="font-bold text-slate-900 mt-6 mb-2">Butoanele de pe fiecare card</h3>
              <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm text-slate-600 mb-2">
                <li><b>Detalii (ℹ)</b> — statistici din totdeauna (lecții totale, finalizate, anulate, recuperate, prezențe/absențe) + <b>totalul de bani aduși</b>.</li>
                <li><b>Profil complet (ochi)</b> — pagina dedicată: istoric lecții, plăți, note de progres, grilă de frecvență lunară.</li>
                <li><b>Editează / Șterge</b> — modifică sau elimină elevul (șterge automat și lecțiile, plățile, notele lui).</li>
              </ul>
              <Callout type="tip" label="Sfat">
                Folosește <b>Detalii</b> pentru o privire rapidă (ex. în timpul unui apel) și <b>Profil complet</b> când vrei să adaugi o notă de progres sau o plată.
              </Callout>
            </Section>

            <Section meta={SECTIONS[4]} sub="Frecvența tuturor elevilor, într-un singur tabel">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Un tabel cu <b>un rând per elev</b>, pentru luna selectată: Total lecții, Programate (încă neconsemnate), Finalizate, Anulate, Recuperate, Prezențe, Absențe motivate, Absențe nemotivate.
              </p>
              <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm text-slate-600 mb-2">
                <li>Schimbă luna cu săgețile din stânga barei de filtre.</li>
                <li>Filtrează după <b>Profesor</b> sau <b>Disciplină</b>.</li>
              </ul>
              <Callout type="tip" label="De reținut">
                Nimic din acest tabel nu se introduce manual — totul e calculat automat din <b>Program</b>, în timp real.
              </Callout>
            </Section>

            <Section meta={SECTIONS[5]} sub="Lista profesorilor">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Adaugă un profesor cu <b>+ „Adaugă profesor”</b>: nume, email, telefon, dată de naștere (opțional) și un scurt bio/specialitate.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Butonul <b>Detalii</b> arată activitatea din totdeauna (lecții totale, finalizate, anulate, recuperate), <b>banii aduși</b> de elevii lui și lista completă a elevilor cu care a lucrat.
              </p>
            </Section>

            <Section meta={SECTIONS[6]} sub="Activitatea lunară a fiecărui profesor">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 leading-relaxed">
                Câte un card per profesor, pentru luna selectată: Total, Programate, Finalizate, Anulate, Recuperate — plus lista elevilor cu care a lucrat în acea lună. Filtrează după disciplină pentru activitatea pe un singur instrument.
              </p>
            </Section>

            <Section meta={SECTIONS[7]} sub="Șablonul săptămânal al încăperilor">
              <Access roles={['admin']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Nu ține cont de o dată anume — arată un șablon recurent, valabil în fiecare săptămână: Luni → Duminică. Pentru fiecare cabinet și zi vezi profesorul alocat și poți marca starea <b>Ocupat</b> / <b>Liber</b>.
              </p>
              <Steps items={[
                <>Alege ziua din rândul de taburi de sus (Luni…Duminică).</>,
                <>Fiecare cabinet apare cu profesorul alocat acelei zile (dacă există) și starea curentă.</>,
                <>Apasă <b>„Marchează Ocupat/Liber”</b> pentru a schimba starea — oricând, fără restricții.</>,
                <>Apasă <b>„Gestionare”</b> pentru a adăuga/edita/șterge cabinete, culoare și profesorul alocat pe fiecare zi.</>,
              ]} />
              <Callout type="warn" label="Important">
                Rezervarea efectivă a unei lecții într-un cabinet (pentru o dată anume) nu se face aici — se face din <b>Program General</b> sau <b>Orar Fix</b>.
              </Callout>
            </Section>

            <Section meta={SECTIONS[8]} sub="Calendarul clasic, săptămânal / lunar">
              <Access roles={['admin', 'teacher', 'student']} />
              <p className="text-sm text-slate-600 leading-relaxed">
                Vizualizare săptămânală (grilă pe ore) sau lunară. Trage o lecție cu mouse-ul într-o altă zi/oră pentru a o muta, sau apasă pe ea pentru a o edita ori șterge. Bifele ✅ / ❌ o marchează rapid ca finalizată sau anulată.
              </p>
            </Section>

            <Section meta={SECTIONS[9]} sub="Calendarul complet, cu filtre și toate opțiunile de editare">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Trei vizualizări (<b>Zilnic / Săptămânal / Lunar</b>) și filtre după Profesor, Elev, Disciplină, Cabinet și Status (inclusiv <b>Recuperări</b>).
              </p>
              <h3 className="font-bold text-slate-900 mt-5 mb-2">Adaugă o lecție</h3>
              <Steps items={[
                <>Apasă <b>„Lecție nouă”</b> sau direct pe o celulă goală din grilă.</>,
                <>Completează elev, profesor, disciplină, dată, oră, durată, cabinet și note.</>,
                <>Salvează — lecția apare imediat în calendar.</>,
              ]} />
              <h3 className="font-bold text-slate-900 mt-5 mb-2">Editează sau mută o lecție</h3>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Trage lecția cu mouse-ul într-o altă zi/oră, sau apasă pe ea pentru meniul <b>Editează / Șterge</b>.
              </p>
              <Callout type="tip" label="Lecții recurente">
                Dacă lecția face parte dintr-un Orar Fix, la editare/ștergere ți se cere să alegi: <b>doar această lecție</b>, <b>aceasta și toate viitoarele</b>, sau <b>întregul orar recurent</b>. Lecțiile deja trecute nu se șterg niciodată automat.
              </Callout>
              <p className="text-sm text-slate-600 leading-relaxed">
                Poți marca o lecție ca <b>Recuperată</b> direct din formularul de editare (câmpul Status) — util când o lecție anulată se ține ulterior, în afara programului fix.
              </p>
            </Section>

            <Section meta={SECTIONS[10]} sub="Lecții recurente — se repetă automat în fiecare săptămână">
              <Access roles={['admin']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Definești o singură dată regula unei lecții săptămânale (ex. „în fiecare luni la 16:00, Pian, cu profesoara Arina, elevă Maria”) și sistemul generează automat toate lecțiile viitoare corespunzătoare.
              </p>
              <Steps items={[
                <>Apasă <b>„Orar fix nou”</b> și completează elev, profesor, disciplină, ziua săptămânii, ora de start/sfârșit și cabinetul.</>,
                <>Apasă <b>„Generează”</b> pe rândul orarului și alege pe câte luni înainte: <b>3, 6 sau 12 luni</b>.</>,
                <>Lecțiile generate apar automat în Program și Program General — nu mai trebuie adăugate manual.</>,
              ]} />
              <p className="text-sm text-slate-600 leading-relaxed">
                Poți <b>dezactiva</b> temporar un orar sau îl poți <b>edita</b> — modificarea se aplică viitoarelor lecții negenerate manual. Ștergerea unui orar fix elimină lecțiile viitoare (cele cu prezență deja înregistrată sunt păstrate, pentru istoric).
              </p>
            </Section>

            <Section meta={SECTIONS[11]} sub="Modul separat, independent de programul obișnuit">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Pentru audiții de admitere sau evaluări — complet separate de lecțiile obișnuite. Fiecare audiție are elev, disciplină, profesor, dată/oră, durată, note, rezultat și status (Programată / Finalizată / Anulată / Neprezentare).
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Comută între <b>Listă</b> (căutare + filtre) și <b>Calendar</b> (grupat pe lună) din colțul din dreapta al barei de filtre.
              </p>
            </Section>

            <Section meta={SECTIONS[12]} sub="Catalogul complet — o lecție pe rând">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Spre deosebire de Elevi Frecvență (rezumat lunar per elev), aici fiecare <b>lecție ținută</b> apare pe un rând separat, cu patru butoane pentru a marca rapid: <b>Prezent / Absență motivată / Absență nemotivată / Întârziere</b>.
              </p>
              <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm text-slate-600 mb-2">
                <li>Marchezi prezența direct din tabel — apeși pe simbolul din coloana potrivită.</li>
                <li>Filtrează după elev, profesor, disciplină sau status; caută rapid un nume.</li>
                <li>Apasă <b>„Export CSV”</b> pentru a descărca tabelul (se deschide corect în Excel).</li>
              </ul>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aceeași marcare de prezență apare și în fișa individuală a elevului, sub forma unei grile lunare colorate — cele două locuri sunt sincronizate automat.
              </p>
            </Section>

            <Section meta={SECTIONS[13]} sub="Evidența abonamentelor lunare">
              <Access roles={['admin']} />
              <p className="text-sm text-slate-600 leading-relaxed">
                Rata de colectare a lunii curente (câți bani au fost încasați, câți sunt restanți), plus lista fiecărei plăți individuale. Poți marca o plată ca <b>achitată</b>, o poți edita sau șterge. La adăugarea unui elev nou, prima lună de plată se generează automat ca „neachitată”.
              </p>
            </Section>

            <Section meta={SECTIONS[14]} sub="Mesajele primite din formularul de contact al site-ului public">
              <Access roles={['admin']} />
              <p className="text-sm text-slate-600 leading-relaxed">
                Fiecare persoană care completează formularul de pe site apare aici ca o cerere nouă. Mută-o prin etapele fluxului — <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs">nou → contactat → înscris → anulat</code> — pe măsură ce discuți cu ea.
              </p>
            </Section>

            <Section meta={SECTIONS[15]} sub="Gestionarea conturilor de utilizator">
              <Access roles={['admin']} />
              <h3 className="font-bold text-slate-900 mb-2">Aprobări</h3>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                Când cineva își creează cont (email/parolă sau Google), contul rămâne <b>„în așteptare”</b> până îl aprobi.
              </p>
              <Steps items={[
                <>Apasă <b>„Aprobă”</b> pe rândul persoanei.</>,
                <>Alege rolul: <b>Profesor</b> sau <b>Elev</b>.</>,
                <>Dacă alegi Profesor, <b>asociază-l cu fișa lui de profesor</b> din listă — sau lasă necompletat și asociază-l mai târziu.</>,
              ]} />
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">Poți și <b>respinge</b> o cerere — contul rămâne blocat până e reaprobat.</p>
              <h3 className="font-bold text-slate-900 mb-2">Roluri</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Un tabel cu toți utilizatorii deja procesați, unde poți schimba rolul oricui (în afară de admini — rolul de Admin nu se poate atribui din interfață, din motive de siguranță).
              </p>
            </Section>

            <Section meta={SECTIONS[16]} sub="Contul tău personal">
              <Access roles={['admin', 'teacher']} />
              <p className="text-sm text-slate-600 leading-relaxed">
                Vezi numele, emailul și rolul contului tău, și poți schimba parola oricând.
              </p>
            </Section>

            <Section meta={SECTIONS[17]} sub="">
              <div className="space-y-5">
                <div>
                  <p className="font-bold text-sm text-slate-900 mb-1">Care e diferența dintre Program și Program General?</p>
                  <p className="text-sm text-slate-600 leading-relaxed"><b>Program</b> e varianta clasică, simplă (săptămânal/lunar, drag &amp; drop). <b>Program General</b> e varianta completă, cu filtre și toate opțiunile de propagare pentru lecțiile recurente.</p>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 mb-1">Am anulat din greșeală o lecție — ce fac?</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Deschide lecția din Program General, apasă Editează și schimbă statusul înapoi la „Programată”, sau la „Recuperată” dacă elevul a recuperat-o ulterior.</p>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 mb-1">De ce nu apare un profesor nou în filtrele „doar datele mele”?</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Foarte probabil contul lui de utilizator nu a fost asociat cu fișa de profesor la aprobare. Mergi în Aprobări pentru a face legătura.</p>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 mb-1">Cum recuperez o lecție anulată la o altă dată?</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Adaugă o lecție nouă în Program General la data de recuperare și marchează-i statusul ca <b>„Recuperată”</b> — apare corect în statisticile de la Elevi Frecvență și Profesori Frecvență.</p>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 mb-1">Unde văd câți bani a adus un elev sau un profesor de când e cu noi?</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Apasă butonul <b>Detalii</b> de pe cardul lui, din Elevi General sau Profesori General.</p>
                </div>
              </div>
            </Section>

          </div>
        </div>

        {showTop && (
          <button
            onClick={scrollToTop}
            title="Înapoi sus"
            className="fixed bottom-8 right-8 w-11 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-20"
          >
            <ArrowUp className="w-4.5 h-4.5" />
          </button>
        )}
      </main>
    </div>
  );
}
