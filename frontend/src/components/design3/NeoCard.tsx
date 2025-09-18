import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github } from 'lucide-react';

type Props = {
  project: any;
  onView: (p: any) => void;
};

export default function NeoCard({ project, onView }: Props) {
  return (
    <article className="bg-white border rounded-[18px] shadow-[4px_4px_10px_rgba(15,23,42,0.06),_-4px_-4px_10px_rgba(255,255,255,0.8)] overflow-hidden">
      <div className="h-40 bg-muted overflow-hidden">
        {project.imageUrl ? (
          <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-3">
        {project.badge && <span className="inline-block bg-foreground text-white rounded-full text-xs px-2 py-1">{project.badge}</span>}
        <div className="flex items-center gap-2 mt-1">
          {project.ownerImageUrl ? (
            <img src={project.ownerImageUrl} alt={project.ownerName || 'Student'} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted" />
          )}
          <div className="font-bold truncate">{project.title}</div>
        </div>
        <div className="text-xs text-muted-foreground truncate">{project.ownerName || project.owner?.full_name} • {project.projectType || project.project_type || ''}</div>
        <div className="font-extrabold mt-1">{project.price || ''}</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{project.completionDate || ((project.createdAt || project.created_at) ? new Date(project.createdAt || project.created_at).toLocaleDateString() : '')}</span>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="h-8 w-8 grid place-items-center border rounded-lg">
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.deploymentUrl && (
              <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer" className="h-8 w-8 grid place-items-center border rounded-lg">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={()=>onView(project)}>View details</Button>
        </div>
      </div>
    </article>
  );
}


