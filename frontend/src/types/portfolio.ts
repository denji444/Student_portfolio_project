export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  functionalRequirements?: string[];
  requirements?: { planned: string[]; implemented: string[] };
  projectType?: string;
  imageUrl?: string;
  deploymentUrl?: string;
  githubUrl?: string;
  completionDate: string;
  status: 'completed' | 'in-progress' | 'planned';
  ownerName?: string;
  ownerRoll?: string;
  ownerEmail?: string;
  ownerImageUrl?: string | null;
  comments?: { id: string; content: string; created_at: string }[];
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  specialization: string;
  email: string;
  phone?: string;
  profileImage?: string;
  skills: string[];
  programmingLanguages: string[];
  strengths: string[];
  weaknesses: string[];
  workExperience: WorkExperience[];
  projects: Project[];
  graduationYear: number;
  gpa?: number;
  linkedinUrl?: string;
  githubUrl?: string;
}