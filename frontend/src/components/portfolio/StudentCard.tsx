import { useState } from "react";
import { User, Mail, Phone, Github, Linkedin, Eye, Share2, FolderOpen, MapPin, Calendar, Star, TrendingUp, TrendingDown, Code } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectCard } from "./ProjectCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/types/portfolio";

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => {
  const [showAllProjects, setShowAllProjects] = useState(false);
  const { toast } = useToast();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href + `?student=${student.id}`);
    toast({
      title: "Profile link copied!",
      description: "Student profile link has been copied to clipboard.",
    });
  };

  const displayedProjects = showAllProjects ? student.projects : student.projects.slice(0, 2);
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 h-fit bg-card border border-border overflow-hidden">
      {/* Simplified Header inspired by your reference image */}
      <div className="bg-gradient-to-br from-card to-surface-secondary p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={student.profileImage} alt={student.name} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate mb-1">
              {student.name}
            </h3>
            <p className="text-muted-foreground font-medium text-sm mb-2">{student.rollNumber}</p>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground">{student.department}</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Class of {student.graduationYear}</span>
            </div>
            {student.gpa && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-sm text-foreground font-medium">GPA: {student.gpa}</span>
              </div>
            )}
          </div>
        </div>

        {/* Specialization Badge */}
        <Badge className="mt-4 bg-accent text-accent-foreground hover:bg-accent/80 font-medium">
          {student.specialization}
        </Badge>
      </div>

      <CardContent className="p-6">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-full">
                <Eye className="h-4 w-4 mr-2" />
                Full Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.profileImage} alt={student.name} />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{student.name}</h2>
                    <p className="text-muted-foreground">{student.rollNumber} • {student.specialization}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{student.phone}</span>
                      </div>
                    )}
                    {student.linkedinUrl && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-accent hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {student.githubUrl && (
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-muted-foreground" />
                        <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-accent hover:underline">
                          GitHub Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Complete Skills */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Code className="h-5 w-5 text-accent" />
                    Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {student.skills.map((skill) => (
                      <Badge key={skill} className="bg-accent/10 text-accent border-accent/20">{skill}</Badge>
                    ))}
                  </div>
                </div>

                {/* Programming Languages */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Programming Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {student.programmingLanguages.map((lang) => (
                      <Badge key={lang} className="bg-secondary/10 text-secondary border-secondary/20">{lang}</Badge>
                    ))}
                  </div>
                </div>

                {/* Complete Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {student.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Star className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-warning" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {student.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="h-4 w-4 mt-0.5 bg-warning rounded-full flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Work Experience */}
                {student.workExperience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Work Experience</h3>
                    <div className="space-y-4">
                      {student.workExperience.map((work) => (
                        <div key={work.id} className="border-l-2 border-accent pl-4">
                          <h4 className="font-medium">{work.position}</h4>
                          <p className="text-sm text-muted-foreground">{work.company} • {work.duration}</p>
                          <p className="text-sm mt-1">{work.description}</p>
                          {work.technologies && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {work.technologies.map((tech) => (
                                <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Projects */}
                {student.projects.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Projects</h3>
                    <div className="grid gap-4">
                      {student.projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleShare} className="border-slate-300 text-slate-600 hover:bg-slate-50 rounded-full">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};