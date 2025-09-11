import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicProjects } from "@/lib/api";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Placeholder while backend/API wiring is added
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNav showHome={false} showAuth={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    if (!data) return [] as typeof data;
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter((p) => {
      const haystack = [
        p.title,
        p.projectType,
        p.ownerName,
        p.ownerRoll,
        ...(p.technologies || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, debouncedQuery]);

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
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, roll number, title, technologies, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔎</div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">No matching projects</h2>
          <p className="text-muted-foreground">Try a different query or clear the search.</p>
        </div>
      )}
    </div>
  );
};

export default Index;
