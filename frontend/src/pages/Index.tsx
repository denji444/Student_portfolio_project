import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicProjects } from "@/lib/api";
import NeoNav from "@/components/design3/NeoNav";
import SEO from "@/components/SEO";
import FilterBar from "@/components/design3/FilterBar";
import NeoCard from "@/components/design3/NeoCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, ExternalLink, Github } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import FadeIn from "@/components/FadeIn";

const Index = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <SEO
          title="PTUT Student Portfolio — Software Engineering Technology"
          description="Explore PTUT SET student portfolios, projects, technologies, and live demos."
          keywords={[
            'PTUT portfolio', 'Punjab Tianjin University of Technology portfolio',
            'Software Engineering Technology portfolio', 'SET portfolio',
            'student portfolio', 'student PTUT portfolio', 'PTUT projects', 'student projects PTUT'
          ]}
        />
        <NeoNav />
        <PublicProjectsSection />
      </main>
    </div>
  );
};

const PublicProjectsSection = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-projects'],
    queryFn: fetchPublicProjects,
  });

  const [search, setSearch] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<any | null>(null);

  const allSkills = Array.from(new Set((data || []).flatMap(p => p.technologies || []))).sort();
  const allSpecs = Array.from(new Set((data || []).map(p => p.projectType).filter(Boolean))) as string[];

  const filtered = useMemo(() => {
    if (!data) return [] as typeof data;
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      const haystack = [p.title, p.projectType, p.ownerName, p.ownerRoll, ...(p.technologies || [])]
        .filter(Boolean).join(' ').toLowerCase();
      const matchesQ = !q || haystack.includes(q);
      const matchesSkills = skills.length === 0 || skills.every(s => (p.technologies || []).includes(s));
      const matchesLang = languages.length === 0 || languages.some(s => (p.technologies || []).includes(s));
      const matchesSpec = specs.length === 0 || specs.some(s => (p.projectType || '').includes(s));
      return matchesQ && matchesSkills && matchesLang && matchesSpec;
    });
  }, [data, search, skills, languages, specs]);

  

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Loading projects...</h2>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Failed to load projects</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🗂️</div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">No projects yet</h2>
        <p className="text-muted-foreground">Projects will appear here as students add them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar allSkills={allSkills} allLanguages={allSkills} allSpecializations={allSpecs}
        onSearch={setSearch} onSkills={setSkills} onLanguages={setLanguages} onSpecializations={setSpecs} />

      {filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((project, idx) => (
            <FadeIn key={project.id} delayMs={60 * (idx % 9)}>
              <NeoCard project={project} onView={(p)=>{ setActive(p); setOpen(true); }} />
            </FadeIn>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔎</div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">No matching projects</h2>
          <p className="text-muted-foreground">Try a different query or clear the search.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground">Status: <Badge variant="secondary">{active.status}</Badge></div>
              {active.projectType && (
                <div className="text-muted-foreground">Project Type: {active.projectType}</div>
              )}
              {/* Media preview */}
              {active.imageUrl && (
                <div>
                  <div className="font-medium mb-1">Thumbnail</div>
                  <div className="w-full rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={active.imageUrl}
                      alt={active.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              )}
              <div>
                <div className="font-medium mb-1">Description</div>
                <p className="leading-relaxed whitespace-pre-wrap">{active.description}</p>
              </div>
              {active.requirements ? (
                <div>
                  <div className="font-medium mb-1">Functional Requirements</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold mb-1">Planned</div>
                      {active.requirements.planned.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {active.requirements.planned.map((fr: string, idx: number) => (
                            <li key={`planned-${idx}-${fr}`}>{fr}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground text-sm">None</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1">Implemented</div>
                      {active.requirements.implemented.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {active.requirements.implemented.map((fr: string, idx: number) => (
                            <li key={`impl-${idx}-${fr}`}>{fr}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground text-sm">None</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
              <div>
                <div className="flex items-center gap-2 mb-1"><Code className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Technologies</span></div>
                <div className="flex flex-wrap gap-1">
                  {(active.technologies||[]).map((t: string) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {active.deploymentUrl && (
                  <Button size="sm" asChild>
                    <a href={active.deploymentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Live Demo
                    </a>
                  </Button>
                )}
                {active.githubUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={active.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" /> Source Code
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
