import {
  Availability,
  Certificate,
  Command,
  Company,
  Description,
  Language,
  Mission,
  Project,
  Study
} from '../model/model';

export interface PortfolioDataRetrieverPort {
  getAvailability(): Availability;
  getCertificates(): Certificate[];
  getCommands(): Command[];
  getCompanies(): Company[];
  getDescription(): Description;
  getHobbies(): string[];
  getLanguages(): Language[];
  getMissions(): Mission[];
  getProjects(): Project[];
  getStudies(): Study[];
}
