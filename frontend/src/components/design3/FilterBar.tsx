import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Props = {
  allSkills: string[];
  allLanguages: string[];
  allSpecializations: string[];
  onSearch: (q: string) => void;
  onSkills: (skills: string[]) => void;
  onLanguages: (langs: string[]) => void;
  onSpecializations: (specs: string[]) => void;
};

export default function FilterBar({ allSkills, allLanguages, allSpecializations, onSearch, onSkills, onLanguages, onSpecializations }: Props) {
  const [q, setQ] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  const total = skills.length + languages.length + specializations.length;

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => {
    const next = list.includes(v) ? list.filter(x => x !== v) : [...list, v];
    set(next);
    if (set === setSkills) onSkills(next);
    else if (set === setLanguages) onLanguages(next);
    else onSpecializations(next);
  };

  const Chip = ({ t, remove }: { t: string; remove: () => void }) => (
    <button onClick={remove} className="px-3 py-1 rounded-full bg-muted text-sm">{t} ×</button>
  );

  return (
    <section className="bg-white border rounded-[18px] shadow-[6px_6px_14px_rgba(15,23,42,0.06),_-6px_-6px_14px_rgba(255,255,255,0.8)] p-4">
      <h2 className="font-semibold mb-2">Find the best place</h2>
      <div className="relative mb-2">
        <Input value={q} onChange={(e)=>{ setQ(e.target.value); onSearch(e.target.value); }} placeholder="Search students by name, roll number, skills, or programming languages..." className="pl-9 h-11" />
        <span className="absolute left-3 top-1/2 -translate-y-1/2">🔎</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Popover label={`Skills (${skills.length})`}>
          <div className="grid grid-cols-2 gap-2 p-2">
            {allSkills.map(s => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={skills.includes(s)} onChange={() => toggle(skills, setSkills, s)} />{s}
              </label>
            ))}
          </div>
        </Popover>
        <Popover label={`Languages (${languages.length})`}>
          <div className="grid gap-2 p-2">
            {allLanguages.map(s => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={languages.includes(s)} onChange={() => toggle(languages, setLanguages, s)} />{s}
              </label>
            ))}
          </div>
        </Popover>
        <Popover label={`Specialization (${specializations.length})`}>
          <div className="grid gap-2 p-2">
            {allSpecializations.map(s => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={specializations.includes(s)} onChange={() => toggle(specializations, setSpecializations, s)} />{s}
              </label>
            ))}
          </div>
        </Popover>
        {(total > 0 || q) && (
          <button onClick={()=>{ setQ(''); setSkills([]); setLanguages([]); setSpecializations([]); onSearch(''); onSkills([]); onLanguages([]); onSpecializations([]); }} className="text-muted-foreground">Clear all ({total})</button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map(s => <Chip key={`sk-${s}`} t={s} remove={()=>toggle(skills,setSkills,s)} />)}
        {languages.map(s => <Chip key={`la-${s}`} t={s} remove={()=>toggle(languages,setLanguages,s)} />)}
        {specializations.map(s => <Chip key={`sp-${s}`} t={s} remove={()=>toggle(specializations,setSpecializations,s)} />)}
      </div>
    </section>
  );
}

function Popover({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(v=>!v)} className="h-9 px-3 rounded-xl border bg-white">{label}</button>
      {open && (
        <div className="absolute z-20 bg-white border rounded-xl shadow min-w-[220px] max-h-48 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
}


