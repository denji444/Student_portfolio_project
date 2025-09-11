import { ExternalLink, Github, Play, Calendar, Code, Share2, User2, IdCard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Project } from "@/types/portfolio";

interface ProjectCardProps {
  project: Project;
  compact?: boolean;
}

export const ProjectCard = ({ project, compact = false }: ProjectCardProps) => {
  const truncatedDescription = (() => {
    const words = (project.description || '').trim().split(/\s+/);
    const limit = 30; // shorter preview
    if (words.length <= limit) return project.description;
    return words.slice(0, limit).join(' ') + '…';
  })();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'in-progress':
        return 'bg-warning text-warning-foreground';
      case 'planned':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'planned':
        return 'Planned';
      default:
        return 'Unknown';
    }
  };

  if (compact) {
    return (
      <Card className="border-l-4 border-l-accent hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{project.title}</h4>
                <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {project.technologies.slice(0, 3).map((tech) => (
                  <Badge key={tech} variant="outline" className="text-xs px-1.5 py-0.5">
                    {tech}
                  </Badge>
                ))}
                {project.technologies.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{project.technologies.length - 3}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {project.deploymentUrl && (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                  <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold truncate">{project.title}</h3>
              <Badge className={`${getStatusColor(project.status)}`}>
                {getStatusText(project.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{project.completionDate}</span>
              {project.projectType && (
                <>
                  <span className="mx-1">•</span>
                  <Badge variant="outline">{project.projectType}</Badge>
                </>
              )}
              {(project.ownerName || project.ownerRoll) && (
                <>
                  <span className="mx-1">•</span>
                  {project.ownerImageUrl ? (
                    <img src={project.ownerImageUrl} alt={project.ownerName || 'Student'} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <User2 className="h-4 w-4" />
                  )}
                  {project.ownerName && (
                    <span className="truncate max-w-[120px]">{project.ownerName}</span>
                  )}
                  {project.ownerRoll && (
                    <>
                      <span className="mx-1">•</span>
                      <IdCard className="h-4 w-4" />
                      <span className="truncate max-w-[90px]">{project.ownerRoll}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Project Image/Video */}
        {(project.imageUrl || project.videoUrl) && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            {project.videoUrl ? (
              <div className="relative h-full flex items-center justify-center bg-black/10">
                <Play className="h-12 w-12 text-muted-foreground" />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-black/20 transition-opacity"
                    >
                      <Play className="h-12 w-12 text-white" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{project.title} - Demo Video</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video">
                      <iframe
                        src={project.videoUrl}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        title={`${project.title} demo`}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        )}

        {/* Description (preview) */}
        <p className="text-sm text-muted-foreground">{truncatedDescription}</p>

        {/* Technologies */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Technologies Used</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="outline">
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => {
            const url = window.location.origin + `/?project=${encodeURIComponent(project.id)}`;
            navigator.clipboard.writeText(url);
          }}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">View Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{project.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="text-muted-foreground">Status: {getStatusText(project.status)}</div>
                {project.projectType && (
                  <div className="text-muted-foreground">Project Type: {project.projectType}</div>
                )}
                {(project.ownerName || project.ownerRoll || project.ownerEmail || project.ownerImageUrl) && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/40">
                    {project.ownerImageUrl ? (
                      <img src={project.ownerImageUrl} alt={project.ownerName || 'Student'} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div className="min-w-0">
                      {project.ownerName && <div className="font-medium truncate">{project.ownerName}</div>}
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                        {project.ownerRoll && <span>Roll: {project.ownerRoll}</span>}
                        {project.ownerEmail && <span>Email: {project.ownerEmail}</span>}
                      </div>
                    </div>
                  </div>
                )}
                {project.videoUrl || project.imageUrl ? (
                  <div className="aspect-video rounded bg-muted overflow-hidden">
                    {project.videoUrl ? (
                      <iframe src={project.videoUrl} className="w-full h-full" allowFullScreen title={`${project.title} demo`} />
                    ) : (
                      <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                ) : null}
                <div>
                  <div className="font-medium mb-1">Description</div>
                  <p className="leading-relaxed whitespace-pre-wrap">{project.description}</p>
                </div>
                <div>
                  <div className="font-medium mb-1">Technologies</div>
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map((t) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                </div>
                {project.comments && project.comments.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Admin Comments</div>
                    <ul className="space-y-2">
                      {project.comments.map((c) => (
                        <li key={c.id} className="rounded bg-muted/40 p-2 text-sm">
                          <div className="text-muted-foreground text-xs mb-1">{new Date(c.created_at).toLocaleString()}</div>
                          <div className="whitespace-pre-wrap">{c.content}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  {project.deploymentUrl && (
                    <Button size="sm" asChild>
                      <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Live Demo
                      </a>
                    </Button>
                  )}
                  {project.githubUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" /> Source Code
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};