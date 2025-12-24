import { useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search, X } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  // Curated defaults merged with provided options (de-duplicated)
  const DEFAULT_SPECIALIZATIONS = useMemo(() => [
    'Web development','Game development','Mobile development','Data science','Machine learning','AI','Cybersecurity','DevOps','Cloud computing','IoT / Embedded','UI/UX','Blockchain','AR/VR','Desktop apps','Frontend development','Backend development'
  ], []);
  const DEFAULT_LANGUAGES = useMemo(() => [
    'C','C++','Java','Python','JavaScript','TypeScript','Go','Rust','Kotlin','Swift','PHP','Ruby','Dart','R','SQL','HTML/CSS'
  ], []);
  // Use curated lists only, do not merge dynamic user-provided values
  const mergedSpecs = DEFAULT_SPECIALIZATIONS;
  const mergedLanguages = DEFAULT_LANGUAGES;

  const totalActiveFilters = selectedLanguages.length + selectedSpecs.length;

  const handleToggle = (current: string[], update: (v: string[]) => void, value: string) => {
    const next = current.includes(value) ? current.filter(x => x !== value) : [...current, value];
    update(next);
    if (update === setSelectedLanguages) onLanguages(next);
    else onSpecializations(next);
  };

  const clearAll = () => {
    setQuery('');
    setSelectedLanguages([]);
    setSelectedSpecs([]);
    onSearch('');
    onSkills([]);
    onLanguages([]);
    onSpecializations([]);
  };

  const ActiveChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <button onClick={onRemove} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border shadow-sm hover:shadow transition-shadow text-sm">
      <span>{label}</span>
      <X className="h-3.5 w-3.5 opacity-70" />
    </button>
  );

  return (
    <section className="bg-white border rounded-[18px] shadow-[6px_6px_14px_rgba(15,23,42,0.06),_-6px_-6px_14px_rgba(255,255,255,0.8)] p-4">
      <h2 className="font-semibold mb-2">Find the best place</h2>
      <div className="relative mb-3">
        <Input value={query} onChange={(e)=>{ setQuery(e.target.value); onSearch(e.target.value); }} placeholder="Search by title, type, owner, skills..." className="pl-10 h-11 focus:ring-2 focus:ring-primary/30" />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <MultiSelectPopover
          label={`Languages (${selectedLanguages.length})`}
          options={mergedLanguages}
          selected={selectedLanguages}
          onToggle={(v)=>handleToggle(selectedLanguages, setSelectedLanguages, v)}
        />
        <MultiSelectPopover
          label={`Specializations (${selectedSpecs.length})`}
          options={mergedSpecs}
          selected={selectedSpecs}
          onToggle={(v)=>handleToggle(selectedSpecs, setSelectedSpecs, v)}
        />
        {(totalActiveFilters > 0 || query) && (
          <button onClick={clearAll} className="h-9 px-3 rounded-xl border bg-white text-muted-foreground hover:text-foreground hover:shadow-sm transition">Clear all ({totalActiveFilters})</button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedLanguages.map(s => (
          <ActiveChip key={`la-${s}`} label={s} onRemove={()=>handleToggle(selectedLanguages, setSelectedLanguages, s)} />
        ))}
        {selectedSpecs.map(s => (
          <ActiveChip key={`sp-${s}`} label={s} onRemove={()=>handleToggle(selectedSpecs, setSelectedSpecs, s)} />
        ))}
      </div>
    </section>
  );
}

function MultiSelectPopover({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={()=>setOpen(v=>!v)}
        className="h-9 px-3 rounded-xl border bg-white inline-flex items-center gap-1 hover:shadow-sm transition"
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 bg-white border rounded-xl shadow-[6px_6px_14px_rgba(15,23,42,0.06),_-6px_-6px_14px_rgba(255,255,255,0.8)] min-w-[260px] max-h-64 overflow-auto p-2 animate-in fade-in-0 zoom-in-95">
          <ul className="divide-y">
            {options.map(opt => {
              const isActive = selected.includes(opt);
              return (
                <li key={opt}>
                  <label className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/60 rounded-md ${isActive ? 'bg-muted/40' : ''}`}>
                    <input type="checkbox" checked={isActive} onChange={()=>onToggle(opt)} />
                    <span className="text-sm">{opt}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}


