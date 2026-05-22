import { DateUtils } from '../utils/DateUtils';
import { PortfolioDataRetrieverPort } from '../port/PortfolioDataRetrieverPort';

export class MissionService {
  private portfolioDataRetrieverPort: PortfolioDataRetrieverPort;

  constructor(portfolioDataRetrieverPort: PortfolioDataRetrieverPort) {
    this.portfolioDataRetrieverPort = portfolioDataRetrieverPort;
  }

  getMissions = () => {
    return this.portfolioDataRetrieverPort.getMissions().sort(DateUtils.compareItemsByStartYearAndEndYear);
  };

  getMissionsBySkill = (_root: any, { skillName }: any) => {
    return this.getMissions()
      .filter((item) => item.skills.find((skill) => skill.name === skillName))
      .sort(DateUtils.compareItemsByStartYearAndEndYear);
  };

  getMissionsByYear = (_root: any, { year }: any) => {
    return this.getMissions()
      .filter((item) => DateUtils.filterItemsByYear(item, year))
      .sort(DateUtils.compareItemsByStartYearAndEndYear);
  };
}
