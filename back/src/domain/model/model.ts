export interface DateItem {
  startYear: number;
  endYear?: number;
}

export interface YearItem {
  year: number;
}

export interface Availability {
  date: Date;
}

export interface Certificate extends YearItem {
  certifier: string;
  skill: string;
  link: string;
}

export interface Usage {
  parameter: string;
  description: string;
}

export interface Command {
  command: string;
  usages: Usage[];
}

export interface Company extends DateItem {
  name: string;
  website?: string;
  role: string;
  place?: string;
  description?: string;
}

export interface Description {
  name: string;
  birthday: Date;
  job: string;
  linkedin: string;
  github: string;
  presentation: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Skill {
  name: string;
  category: string;
}

export interface Mission extends DateItem {
  company: string;
  websites: string[];
  place: string;
  role: string;
  description: string;
  skills: Skill[];
}

export interface Project extends DateItem {
  name: string;
  websites?: string[];
  role: string;
  description: string;
  skills: Skill[];
}

export interface Study extends DateItem {
  label: string;
  place: string;
  school: string;
  diploma: string;
  degree: string;
}
