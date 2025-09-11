import type { Student } from "@/types/portfolio";

export const studentsData: Student[] = [
  {
    id: "1",
    name: "Sarah Chen",
    rollNumber: "SET2021001",
    department: "Software Engineering Technology",
    specialization: "Full Stack Development",
    email: "sarah.chen@student.edu",
    phone: "+1 (555) 123-4567",
    graduationYear: 2024,
    gpa: 3.8,
    githubUrl: "https://github.com/sarahchen",
    linkedinUrl: "https://linkedin.com/in/sarahchen",
    skills: ["React", "Node.js", "MongoDB", "TypeScript", "AWS", "Docker", "GraphQL", "Redis"],
    programmingLanguages: ["JavaScript", "TypeScript", "Python", "Java", "SQL"],
    strengths: [
      "Strong problem-solving abilities",
      "Excellent team collaboration",
      "Quick learner of new technologies",
      "Good communication skills"
    ],
    weaknesses: [
      "Sometimes perfectionist leading to longer development time",
      "Need to improve public speaking confidence"
    ],
    workExperience: [
      {
        id: "w1",
        company: "TechStart Solutions",
        position: "Frontend Developer Intern",
        duration: "Jun 2023 - Aug 2023",
        description: "Developed responsive web applications using React and worked on improving user experience.",
        technologies: ["React", "JavaScript", "CSS", "Git"]
      },
      {
        id: "w2",
        company: "Digital Innovations Inc",
        position: "Junior Full Stack Developer",
        duration: "Sep 2023 - Present",
        description: "Working on e-commerce platform development using modern web technologies.",
        technologies: ["React", "Node.js", "MongoDB", "Express.js"]
      }
    ],
    projects: [
      {
        id: "p1",
        title: "E-Commerce Platform",
        description: "A full-featured e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.",
        technologies: ["React", "Node.js", "MongoDB", "Stripe API", "JWT"],
        deploymentUrl: "https://ecommerce-demo.netlify.app",
        githubUrl: "https://github.com/sarahchen/ecommerce-platform",
        completionDate: "December 2023",
        status: "completed"
      },
      {
        id: "p2",
        title: "Task Management App",
        description: "Collaborative task management application with real-time updates, team collaboration features, and progress tracking.",
        technologies: ["React", "Socket.io", "Express.js", "PostgreSQL"],
        deploymentUrl: "https://taskmaster-app.netlify.app",
        githubUrl: "https://github.com/sarahchen/task-manager",
        completionDate: "October 2023",
        status: "completed"
      },
      {
        id: "p3",
        title: "Weather Analytics Dashboard",
        description: "Real-time weather data visualization dashboard with historical analysis and forecasting capabilities.",
        technologies: ["React", "D3.js", "Python", "Flask", "OpenWeather API"],
        githubUrl: "https://github.com/sarahchen/weather-dashboard",
        completionDate: "January 2024",
        status: "in-progress"
      }
    ]
  },
  {
    id: "2",
    name: "Alex Rodriguez",
    rollNumber: "SET2021002",
    department: "Software Engineering Technology",
    specialization: "Mobile App Development",
    email: "alex.rodriguez@student.edu",
    phone: "+1 (555) 234-5678",
    graduationYear: 2024,
    gpa: 3.9,
    githubUrl: "https://github.com/alexrodriguez",
    linkedinUrl: "https://linkedin.com/in/alexrodriguez",
    skills: ["React Native", "Flutter", "iOS Development", "Android Development", "Firebase", "SQLite", "REST APIs"],
    programmingLanguages: ["JavaScript", "Dart", "Swift", "Kotlin", "Java"],
    strengths: [
      "Exceptional mobile UI/UX design skills",
      "Strong understanding of mobile development patterns",
      "Experience with both native and cross-platform development"
    ],
    weaknesses: [
      "Limited backend development experience",
      "Need to improve testing practices"
    ],
    workExperience: [
      {
        id: "w3",
        company: "MobileFirst Studios",
        position: "Mobile Developer Intern",
        duration: "May 2023 - Aug 2023",
        description: "Developed mobile applications using React Native and contributed to UI/UX improvements.",
        technologies: ["React Native", "JavaScript", "Firebase"]
      }
    ],
    projects: [
      {
        id: "p4",
        title: "Fitness Tracking App",
        description: "Complete fitness tracking mobile application with workout logging, progress tracking, and social features.",
        technologies: ["React Native", "Firebase", "Redux", "Google Fit API"],
        deploymentUrl: "https://play.google.com/store/apps/details?id=com.fitness.tracker",
        githubUrl: "https://github.com/alexrodriguez/fitness-tracker",
        completionDate: "November 2023",
        status: "completed"
      },
      {
        id: "p5",
        title: "Language Learning App",
        description: "Interactive language learning mobile app with gamification, progress tracking, and offline capabilities.",
        technologies: ["Flutter", "Dart", "SQLite", "Provider"],
        githubUrl: "https://github.com/alexrodriguez/language-app",
        completionDate: "September 2023",
        status: "completed"
      }
    ]
  },
  {
    id: "3",
    name: "Emily Johnson",
    rollNumber: "SET2021003",
    department: "Software Engineering Technology",
    specialization: "Data Science & Analytics",
    email: "emily.johnson@student.edu",
    graduationYear: 2024,
    gpa: 3.95,
    githubUrl: "https://github.com/emilyjohnson",
    linkedinUrl: "https://linkedin.com/in/emilyjohnson",
    skills: ["Python", "Machine Learning", "Data Visualization", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "SQL"],
    programmingLanguages: ["Python", "R", "SQL", "JavaScript", "MATLAB"],
    strengths: [
      "Strong mathematical and statistical background",
      "Excellent data analysis and visualization skills",
      "Research-oriented mindset",
      "Detail-oriented approach"
    ],
    weaknesses: [
      "Limited web development experience",
      "Could improve presentation skills"
    ],
    workExperience: [
      {
        id: "w4",
        company: "DataInsights Corp",
        position: "Data Science Intern",
        duration: "Jun 2023 - Present",
        description: "Working on predictive analytics projects and developing machine learning models for business intelligence.",
        technologies: ["Python", "Pandas", "Scikit-learn", "Matplotlib", "SQL"]
      }
    ],
    projects: [
      {
        id: "p6",
        title: "Customer Churn Prediction Model",
        description: "Machine learning model to predict customer churn using various algorithms and feature engineering techniques.",
        technologies: ["Python", "Scikit-learn", "Pandas", "Matplotlib", "Seaborn"],
        githubUrl: "https://github.com/emilyjohnson/churn-prediction",
        completionDate: "December 2023",
        status: "completed"
      },
      {
        id: "p7",
        title: "Stock Market Analysis Dashboard",
        description: "Interactive dashboard for stock market analysis with real-time data and predictive modeling.",
        technologies: ["Python", "Streamlit", "YFinance", "Plotly", "TensorFlow"],
        deploymentUrl: "https://stock-analysis-dashboard.streamlit.app",
        githubUrl: "https://github.com/emilyjohnson/stock-dashboard",
        completionDate: "January 2024",
        status: "completed"
      }
    ]
  },
  {
    id: "4",
    name: "Michael Kim",
    rollNumber: "SET2021004",
    department: "Software Engineering Technology",
    specialization: "DevOps & Cloud Computing",
    email: "michael.kim@student.edu",
    phone: "+1 (555) 345-6789",
    graduationYear: 2024,
    gpa: 3.7,
    githubUrl: "https://github.com/michaelkim",
    linkedinUrl: "https://linkedin.com/in/michaelkim",
    skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Terraform", "Linux", "CI/CD", "Monitoring"],
    programmingLanguages: ["Python", "Bash", "JavaScript", "Go", "YAML"],
    strengths: [
      "Strong understanding of cloud infrastructure",
      "Excellent automation and scripting skills",
      "Good troubleshooting abilities",
      "Team player with leadership qualities"
    ],
    weaknesses: [
      "Frontend development could be improved",
      "Need more experience with microservices architecture"
    ],
    workExperience: [
      {
        id: "w5",
        company: "CloudTech Solutions",
        position: "DevOps Intern",
        duration: "Jul 2023 - Dec 2023",
        description: "Worked on CI/CD pipeline implementation and cloud infrastructure automation using AWS and Terraform.",
        technologies: ["AWS", "Terraform", "Jenkins", "Docker", "Kubernetes"]
      }
    ],
    projects: [
      {
        id: "p8",
        title: "Automated Deployment Pipeline",
        description: "Complete CI/CD pipeline setup with automated testing, building, and deployment to multiple environments.",
        technologies: ["Jenkins", "Docker", "AWS", "Terraform", "Ansible"],
        githubUrl: "https://github.com/michaelkim/cicd-pipeline",
        completionDate: "November 2023",
        status: "completed"
      },
      {
        id: "p9",
        title: "Microservices Monitoring System",
        description: "Comprehensive monitoring and logging solution for microservices architecture using modern observability tools.",
        technologies: ["Prometheus", "Grafana", "ELK Stack", "Docker", "Kubernetes"],
        githubUrl: "https://github.com/michaelkim/monitoring-system",
        completionDate: "January 2024",
        status: "in-progress"
      }
    ]
  },
  {
    id: "5",
    name: "Jessica Wang",
    rollNumber: "SET2021005",
    department: "Software Engineering Technology",
    specialization: "Cybersecurity",
    email: "jessica.wang@student.edu",
    graduationYear: 2024,
    gpa: 3.85,
    githubUrl: "https://github.com/jessicawang",
    linkedinUrl: "https://linkedin.com/in/jessicawang",
    skills: ["Penetration Testing", "Network Security", "Cryptography", "SIEM", "Incident Response", "Vulnerability Assessment"],
    programmingLanguages: ["Python", "C++", "Java", "PowerShell", "Bash"],
    strengths: [
      "Strong analytical and problem-solving skills",
      "Excellent attention to detail",
      "Good understanding of security principles",
      "Ethical hacking capabilities"
    ],
    weaknesses: [
      "Limited web development knowledge",
      "Could improve documentation skills"
    ],
    workExperience: [
      {
        id: "w6",
        company: "SecureIT Consulting",
        position: "Security Analyst Intern",
        duration: "Jun 2023 - Aug 2023",
        description: "Performed vulnerability assessments and penetration testing for client organizations.",
        technologies: ["Nmap", "Metasploit", "Wireshark", "Burp Suite", "Kali Linux"]
      }
    ],
    projects: [
      {
        id: "p10",
        title: "Network Security Scanner",
        description: "Automated network security scanning tool with vulnerability detection and reporting capabilities.",
        technologies: ["Python", "Nmap", "Socket Programming", "SQLite"],
        githubUrl: "https://github.com/jessicawang/security-scanner",
        completionDate: "October 2023",
        status: "completed"
      },
      {
        id: "p11",
        title: "Encryption Toolkit",
        description: "Comprehensive cryptography toolkit with various encryption algorithms and security utilities.",
        technologies: ["Python", "Cryptography", "Tkinter", "AES", "RSA"],
        githubUrl: "https://github.com/jessicawang/crypto-toolkit",
        completionDate: "December 2023",
        status: "completed"
      }
    ]
  },
  {
    id: "6",
    name: "David Thompson",
    rollNumber: "SET2021006",
    department: "Software Engineering Technology",
    specialization: "Game Development",
    email: "david.thompson@student.edu",
    phone: "+1 (555) 456-7890",
    graduationYear: 2024,
    gpa: 3.6,
    githubUrl: "https://github.com/davidthompson",
    linkedinUrl: "https://linkedin.com/in/davidthompson",
    skills: ["Unity", "Unreal Engine", "C#", "Game Design", "3D Modeling", "Animation", "Physics Programming"],
    programmingLanguages: ["C#", "C++", "JavaScript", "Python", "GDScript"],
    strengths: [
      "Creative and innovative thinking",
      "Strong visual and spatial reasoning",
      "Good understanding of game mechanics",
      "Passionate about gaming industry"
    ],
    weaknesses: [
      "Limited business application development experience",
      "Could improve project management skills"
    ],
    workExperience: [],
    projects: [
      {
        id: "p12",
        title: "2D Platformer Game",
        description: "Complete 2D platformer game with multiple levels, character abilities, and power-ups built in Unity.",
        technologies: ["Unity", "C#", "Photoshop", "Audio Engineering"],
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        githubUrl: "https://github.com/davidthompson/platformer-game",
        completionDate: "November 2023",
        status: "completed"
      },
      {
        id: "p13",
        title: "VR Puzzle Game",
        description: "Immersive VR puzzle game with hand tracking and spatial interaction mechanics.",
        technologies: ["Unity", "C#", "Oculus SDK", "XR Toolkit"],
        githubUrl: "https://github.com/davidthompson/vr-puzzle",
        completionDate: "January 2024",
        status: "in-progress"
      }
    ]
  }
];