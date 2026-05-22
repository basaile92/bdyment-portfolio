import { DateUtils } from '../utils/DateUtils';
import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class ProjectService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getProjects = () => {
    return this.portfolioDataRetrieverPort.getProjects().sort(DateUtils.compareItemsByStartYearAndEndYear);
  };

  getProjectsBySkill = (_root: any, { skillName }: any) => {
    return this.getProjects()
      .filter((item) => item.skills.find((skill) => skill.name === skillName))
      .sort(DateUtils.compareItemsByStartYearAndEndYear);
  };

  getProjectsByYear = (_root: any, { year }: any) => {
    return this.getProjects()
      .filter((item) => DateUtils.filterItemsByYear(item, year))
      .sort(DateUtils.compareItemsByStartYearAndEndYear);
  };
}
