import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { Student } from "@/types/portfolio";

interface SearchFilterBarProps {
  onSearch: (query: string) => void;
  onSkillFilter: (skills: string[]) => void;
  onLanguageFilter: (languages: string[]) => void;
  onSpecializationFilter: (specializations: string[]) => void;
  studentsData: Student[];
}

export const SearchFilterBar = ({
  onSearch,
  onSkillFilter,
  onLanguageFilter,
  onSpecializationFilter,
  studentsData
}: SearchFilterBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // Extract unique values from student data
  const allSkills = Array.from(new Set(studentsData.flatMap(s => s.skills))).sort();
  const allLanguages = Array.from(new Set(studentsData.flatMap(s => s.programmingLanguages))).sort();
  const allSpecializations = Array.from(new Set(studentsData.map(s => s.specialization))).sort();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleSkillToggle = (skill: string) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updated);
    onSkillFilter(updated);
  };

  const handleLanguageToggle = (language: string) => {
    const updated = selectedLanguages.includes(language)
      ? selectedLanguages.filter(l => l !== language)
      : [...selectedLanguages, language];
    setSelectedLanguages(updated);
    onLanguageFilter(updated);
  };

  const handleSpecializationToggle = (specialization: string) => {
    const updated = selectedSpecializations.includes(specialization)
      ? selectedSpecializations.filter(s => s !== specialization)
      : [...selectedSpecializations, specialization];
    setSelectedSpecializations(updated);
    onSpecializationFilter(updated);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setSelectedLanguages([]);
    setSelectedSpecializations([]);
    onSearch("");
    onSkillFilter([]);
    onLanguageFilter([]);
    onSpecializationFilter([]);
  };

  const activeFiltersCount = selectedSkills.length + selectedLanguages.length + selectedSpecializations.length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students by name, roll number, skills, or programming languages..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Skills
              {selectedSkills.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {selectedSkills.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Filter by Skills</h4>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {allSkills.map(skill => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill}`}
                      checked={selectedSkills.includes(skill)}
                      onCheckedChange={() => handleSkillToggle(skill)}
                    />
                    <label
                      htmlFor={`skill-${skill}`}
                      className="text-sm cursor-pointer"
                    >
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Languages
              {selectedLanguages.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {selectedLanguages.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Filter by Programming Languages</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allLanguages.map(language => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${language}`}
                      checked={selectedLanguages.includes(language)}
                      onCheckedChange={() => handleLanguageToggle(language)}
                    />
                    <label
                      htmlFor={`lang-${language}`}
                      className="text-sm cursor-pointer"
                    >
                      {language}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Specialization
              {selectedSpecializations.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {selectedSpecializations.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Filter by Specialization</h4>
              <div className="space-y-2">
                {allSpecializations.map(specialization => (
                  <div key={specialization} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${specialization}`}
                      checked={selectedSpecializations.includes(specialization)}
                      onCheckedChange={() => handleSpecializationToggle(specialization)}
                    />
                    <label
                      htmlFor={`spec-${specialization}`}
                      className="text-sm cursor-pointer"
                    >
                      {specialization}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedSkills.length > 0 || selectedLanguages.length > 0 || selectedSpecializations.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map(skill => (
            <Badge key={`skill-badge-${skill}`} variant="secondary" className="px-2 py-1">
              {skill}
              <button
                onClick={() => handleSkillToggle(skill)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedLanguages.map(language => (
            <Badge key={`lang-badge-${language}`} variant="secondary" className="px-2 py-1">
              {language}
              <button
                onClick={() => handleLanguageToggle(language)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedSpecializations.map(specialization => (
            <Badge key={`spec-badge-${specialization}`} variant="secondary" className="px-2 py-1">
              {specialization}
              <button
                onClick={() => handleSpecializationToggle(specialization)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};