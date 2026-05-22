import { availability } from '../data/availability';
import { certificates } from '../data/certificates';
import { commands } from '../data/commands';
import { companies } from '../data/companies';
import { description } from '../data/description';
import { hobbies } from '../data/hobbies';
import { languages } from '../data/languages';
import { missions } from '../data/missions';
import { projects } from '../data/projects';
import { studies } from '../data/studies';
import { PortfolioDataRetrieverPort } from '../../domain/port/PortfolioDataRetrieverPort';

export class JsonPortfolioDataRetrieverAdapter implements PortfolioDataRetrieverPort {
  getAvailability = () => {
    return {
      date: new Date(availability.date),
    };
  };
  getCertificates = () => certificates;
  getCommands = () => commands;
  getCompanies = () => companies;
  getDescription = () => {
    return {
      name: description.name,
      birthday: new Date(description.birthday),
      job: description.job,
      linkedin: description.linkedin,
      github: description.github,
      presentation: description.presentation,
    };
  };
  getHobbies = () => hobbies;
  getLanguages = () => languages;
  getMissions = () => missions;
  getProjects = () => projects;
  getStudies = () => studies;
}
