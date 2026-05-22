import { PortfolioDataRetrieverPort } from '../../../src/domain/port/PortfolioDataRetrieverPort';
import { AVAILABILITY } from '../data/availability';
import { CERTIFICATES } from '../data/certificate';
import { COMMANDS } from '../data/command';
import { COMPANIES } from '../data/company';
import { DESCRIPTION } from '../data/description';
import { HOBBIES } from '../data/hobby';
import { LANGUAGES } from '../data/language';
import { MISSIONS } from '../data/mission';
import { PROJECTS } from '../data/project';
import { STUDIES } from '../data/study';

export class PortfolioDataRetrieverPortImpl implements PortfolioDataRetrieverPort {
  getAvailability = () => {
    return AVAILABILITY;
  };
  getCertificates = () => {
    return CERTIFICATES;
  };
  getCommands = () => {
    return COMMANDS;
  };
  getCompanies = () => {
    return COMPANIES;
  };
  getDescription = () => {
    return DESCRIPTION;
  };
  getHobbies = () => {
    return HOBBIES;
  };
  getLanguages = () => {
    return LANGUAGES;
  };
  getMissions = () => {
    return MISSIONS;
  };
  getProjects = () => {
    return PROJECTS;
  };
  getStudies = () => {
    return STUDIES;
  };
}
